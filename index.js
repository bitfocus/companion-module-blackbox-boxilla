const instance_skel                      = require('../../instance_skel');
const actions                            = require('./actions');
const { executeFeedback, initFeedbacks } = require('./feedbacks');

let debug;
let log;

// DEBUG ONLY!!!!!!
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

class instance extends instance_skel {

	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...actions
		});

		this.header;
		this.init()
		this.devices = [];
		this.users = [];
		this.users_list = [];
		this.hosts_list = [];
		this.receivers_list = [];
		this.connections = [];
		this.connections_list = [];
		this.active_connections = [];
		this.config.apiPollInterval = this.config.apiPollInterval !== undefined ? this.config.apiPollInterval : 1000;
	}

	actions(system) {
		this.setActions(this.getActions());
	}

	initConnection() {
		if (this.config.host !== undefined && this.config.username !== undefined && this.config.password !== undefined) {
			this.header = this.createExtraHeaders();
			this.sendCommand('bxa-api/version', 'GET');
			this.sendCommand('bxa-api/users/kvm', 'GET');
			this.sendCommand('bxa-api/devices/kvm', 'GET');
			this.sendCommand('bxa-api/connections/kvm', 'GET');
			if (this.config.apiPollInterval != 0) {
				this.sendCommand('bxa-api/connections/kvm/active', 'GET');
				if (this.pollAPI) {
					clearInterval(this.pollAPI);
				}
				this.pollAPI = setInterval(() => {
					this.sendCommand('bxa-api/connections/kvm/active', 'GET');
				}, this.config.apiPollInterval < 100 ? 100 : this.config.apiPollInterval);
			}
		} else {
			this.system.emit('log', 'Boxilla', 'error', 'Apply instance settings first')
			this.status(this.STATUS_ERROR, 'SETTINGS');
		}
	}

	createExtraHeaders() {
		const { username, password } = this.config;
		return { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Basic '+ Buffer.from(`${username}:${password}`).toString('base64'), 'Accept-version': 'v1'}
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
				width: 6
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				default: 'Boxill@2020',
				width: 6
			},{
				type: 'textinput',
				id: 'apiPollInterval',
				label: 'Polling interval',
				width: '2',
				default: '1000'
			}

		]
	}

	action(action) {
		let id = action.action;
		let opt = action.options;
		let uri, params;
		let type = 'GET';

		switch (id) {
			case 'active_connection':
				uri = 'bxa-api/connections/kvm/active',
				type = 'POST',
				params = { 'username': opt.username, 'connection_name': opt.connection_name, 'receiver_name': opt.receiver_name}
				break;
			case 'new_connection':
				uri = 'bxa-api/connections/kvm';
				type = 'POST';
				params = { 'name': opt.name, 'host': opt.host, 'group': opt.group, 'connection_type': opt.connection_type, 'view_only': opt.view_only, 'extended_desktop': opt.extended_desktop, 'usb_redirection': opt.usb_redirection, 'audio': opt.audio, 'persistent': opt.persistent, 'zone': opt.zone, 'cmode': opt.cmode};
				break;
		}

		if (!uri) {
			this.system.emit('log', 'Boxilla', 'error', 'no command');
		} else {
			this.sendCommand(uri,type,params);
		}
	}

	sendCommand(uri, type, data) {
		// this.log(`command to send is: ${uri}, typeof: ${type}, params: ${JSON.stringify(data)}`);
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

	processIncomingData(result) {
		if(result.data.code == '400' || result.data.code == '401' || result.data.code == '402' || result.data.code == '403') {
			this.system.emit('log', 'Boxilla', 'error', `${result.data.code}: ${result.data.message}`);
		} else {
			let msg = result.data.message;
			if(msg['software_version'] != undefined) {
				this.setVariable('software_version', msg['software_version']);
			}
			if(msg['model_number'] != undefined) {
				this.setVariable('model_number', msg['model_number']);
			}
			if(msg['active_connections'] != undefined) {
				this.active_connections = [];
				msg['active_connections'].forEach(element => {
					this.active_connections[element['receiver_name']] = [];
					this.active_connections[element['receiver_name']]['connection_name'] = element['connection_name'];
					this.active_connections[element['receiver_name']]['active_user'] = element['active_user'];
				});
				this.checkFeedbacks('actual_connection');
			} else if(msg['users'] != undefined) {
				this.users = msg['users'];
				this.users_list = [];
				this.users.forEach(element => {
					this.users_list.push({'id':element.username, 'label':element.username})
				});
			} else if(msg['connections'] != undefined) {
				this.connections = msg['connections'];
				this.connections_list= [];
				this.connections.forEach(element => {
					this.connections_list.push({'id': element.name, 'label':element.name});
				});
			} else if(msg['devices'] != undefined) {
				this.devices = msg['devices'];
				this.hosts_list = [];
				this.receivers_list = [];
				this.devices.forEach(element => {
					if(element.model.slice(-1) == 'T') {
						this.hosts_list.push({'id': element.ip, 'label':element.name});
					} else {
						this.receivers_list.push({'id': element.name, 'label':element.name});
					}
				});
			}
			this.actions();
			this.init_feedbacks();
		}
	}

	initVariables() {
		let variables = [
			{ name: 'software_version', label: 'Boxilla version:' },
			{ name: 'model_number', label: 'Model number:' }
		]
		this.setVariableDefinitions(variables)
	}

	destroy() {
		debug("destroy", this.id);
		if (this.pollAPI) {
			clearInterval(this.pollAPI);
		}
	}

	init() {
		debug = this.debug;
		log = this.log;
		this.initVariables();
		this.initConnection();
		this.init_feedbacks();
	}

	updateConfig(config) {
		this.config = config
		this.initConnection();
		this.actions();
		this.init_feedbacks();
	}

	/**
	 * Set available feedback choices
	 */
	init_feedbacks() {
		const feedbacks = initFeedbacks.bind(this)();
		this.setFeedbackDefinitions(feedbacks);
	}

	/**
	 * Execute feedback
	 * @param  {} feedback
	 * @param  {} bank
	 */
	feedback(feedback, bank) {
		return executeFeedback.bind(this)(feedback, bank);
	}
}

exports = module.exports = instance;
