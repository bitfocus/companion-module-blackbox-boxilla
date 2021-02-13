let instance_skel = require('../../instance_skel');
let actions       = require('./actions');
let log;
let debug;

class instance extends instance_skel {

	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...actions
		});

		this.header;
		this.actions()
		this.init()
	}

	actions(system) {
		this.setActions(this.getActions());
	}

	initConnection() {
		if (this.config.host !== undefined && this.config.username !== undefined && this.config.password !== undefined) {
			this.header = this.createExtraHeaders();
			this.sendCommand('bxa-api/version', 'GET');
		} else {
			this.system.emit('log', 'Boxilla', 'error', 'Apply instance settings first')
			this.status(this.STATUS_ERROR, 'SETTINGS');
		}
	}

	createExtraHeaders() {
		const { username, password } = this.config;
		return { 'Accept': 'application/json', 'Authorization': 'Basic '+ Buffer.from(`${username}:${password}`).toString('base64'), 'Accept-version': 'v1'}
	}

	config_fields() {
		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module connects to Boxilla'
			},
			{
				type: 'textinput',
				id: 'host',
				width: 6,
				label: 'Target IP Address',
				regex: this.REGEX_IP
			},
			{
				type: 'textinput',
				id: 'username',
				label: 'Username',
				default: 'REST_BbAdminUser',
				width: 5
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				default: 'Boxill@2020',
				width: 5
			}
		]
	}

	action(action) {
		let id = action.action;
		let opt = action.options;
		let uri;

		switch (id) {
			case 'getVersioning':
				uri = 'bxa-api/version';
				break;
		}

		if (!uri) {
			this.system.emit('log', 'Boxilla', 'error', 'no command');
		} else {
			this.sendGETCommand(uri);
		}
	}

	sendCommand(uri, type, data) {
		console.log(`command to send is: ${uri}, typeof: ${type}`);
		if(type == 'GET') {
			this.system.emit('rest_get', 'https://' + this.config.host+'/' + uri, (err, result) => {
				if (err !== null) {
					this.log('error', 'HTTP GET Request failed (' + result.error.code + ')');
					this.status(this.STATUS_ERROR, result.error.code);
				}
				else {
					this.status(this.STATUS_OK);
					this.processIncomingData(result);
				}
			}, this.header);
		} else if(type == 'POST') {
			this.system.emit('rest', 'https://' + this.config.host+'/' + uri, data, (err, result) => {
				if (err !== null) {
					this.log('error', 'HTTP GET Request failed (' + result.error.code + ')');
					this.status(this.STATUS_ERROR, result.error.code);
				}
				else {
					this.status(this.STATUS_OK);
					this.processIncomingData(result);
				}
			}, this.header);
		} else if(type == 'PUT') {
			this.system.emit('rest_put', 'https://' + this.config.host+'/' + uri, data, (err, result) => {
				if (err !== null) {
					this.log('error', 'HTTP GET Request failed (' + result.error.code + ')');
					this.status(this.STATUS_ERROR, result.error.code);
				}
				else {
					this.status(this.STATUS_OK);
					this.processIncomingData(result);
				}
			}, this.header);
		}
	}

	processIncomingData(data) {
		let resultObj = JSON.parse(data);
		console.log('response:', resultObj.data);
		this.setVariable('version', resultObj.Response.Data['Version'])
	}

	initVariables() {
		let variables = [
			{ name: 'version', label: 'Boxilla version:' }
		]
		this.setVariableDefinitions(variables)
	}

	destroy() {
		debug("destroy", this.id);
	}

	init() {
		debug = this.debug;
		log = this.log;
		this.initVariables();
		this.initConnection();
	}

	updateConfig(config) {
		this.config = config
		this.initConnection()
		this.actions()
	}

}

exports = module.exports = instance;
