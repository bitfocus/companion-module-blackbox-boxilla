const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')
const actions = require('./actions')
const { initFeedbacks } = require('./feedbacks')

let debug
let log

// DEBUG ONLY!!!!!!
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

class instance extends InstanceBase {
	constructor(internal) {
		super(internal)

		Object.assign(this, {
			...actions,
		})

		this.header
		this.devices = []
		this.users = []
		this.users_list = []
		this.hosts_list = []
		this.receivers_list = []
		this.connections = []
		this.connections_list = []
		this.active_connections = []
	}

	initActions() {
		this.setActionDefinitions(this.getActions())
	}

	initConnection() {
		if (this.config.host !== undefined && this.config.username !== undefined && this.config.password !== undefined) {
			this.header = this.createExtraHeaders()
			this.sendCommand('bxa-api/version', 'GET')
			this.sendCommand('bxa-api/users/kvm', 'GET')
			this.sendCommand('bxa-api/devices/kvm', 'GET')
			this.sendCommand('bxa-api/connections/kvm', 'GET')
			if (this.config.apiPollInterval != 0) {
				this.sendCommand('bxa-api/connections/kvm/active', 'GET')
				if (this.pollAPI) {
					clearInterval(this.pollAPI)
				}
				this.pollAPI = setInterval(
					() => {
						this.sendCommand('bxa-api/connections/kvm/active', 'GET')
					},
					this.config.apiPollInterval < 100 ? 100 : this.config.apiPollInterval
				)
			}
		} else {
			this.log('error', 'Apply instance settings first')
			this.updateStatus(InstanceStatus.UnknownError, 'Invalid settings')
		}
	}

	createExtraHeaders() {
		const { username, password } = this.config
		return {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
			'Accept-version': 'v1',
		}
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module connects to Boxilla',
			},
			{
				type: 'textinput',
				id: 'host',
				width: 6,
				label: 'Target IP Address',
				regex: this.REGEX_IP,
			},
			{
				type: 'textinput',
				id: 'username',
				label: 'Username',
				default: 'REST_BbAdminUser',
				width: 6,
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				default: 'Boxill@2020',
				width: 6,
			},
			{
				type: 'textinput',
				id: 'apiPollInterval',
				label: 'Polling interval',
				width: '2',
				default: '1000',
			},
		]
	}

	async sendCommand(uri, type, data) {
		if (type == 'GET') {
			try {
				const response = await fetch('https://' + this.config.host + '/' + uri, {
					headers: this.header,
				})

				if (!response.ok) {
					const errorData = await response.json()
					this.log('error', 'HTTP GET Request failed (' + errorData.code + ')')
					this.updateStatus(InstanceStatus.UnknownError, errorData.code)
				} else {
					this.updateStatus(InstanceStatus.Ok)
					const result = await response.json()
					this.processIncomingData(result)
				}
			} catch (err) {
				this.log('error', 'HTTP GET Request failed (' + err.message + ')')
				console.error(err)
				this.updateStatus(InstanceStatus.UnknownError, err.message)
			}
		} else if (type == 'POST') {
			try {
				const response = await fetch('https://' + this.config.host + '/' + uri, {
					method: 'POST',
					headers: this.header,
					body: JSON.stringify(data),
				})

				if (!response.ok) {
					const errorData = await response.json()
					this.log('error', 'HTTP POST Request failed (' + errorData.code + ')')
					this.updateStatus(InstanceStatus.UnknownError, errorData.code)
				} else {
					this.updateStatus(InstanceStatus.Ok)
					const result = await response.json()
					this.processIncomingData(result)
				}
			} catch (err) {
				this.log('error', 'HTTP POST Request failed (' + err.message + ')')
				this.updateStatus(InstanceStatus.UnknownError, err.message)
			}
		} else if (type == 'PUT') {
			try {
				const response = await fetch('https://' + this.config.host + '/' + uri, {
					method: 'PUT',
					headers: this.header,
					body: JSON.stringify(data),
				})

				if (!response.ok) {
					const errorData = await response.json()
					this.log('error', 'HTTP PUT Request failed (' + errorData.code + ')')
					this.updateStatus(InstanceStatus.UnknownError, errorData.code)
				} else {
					this.updateStatus(InstanceStatus.Ok)
					const result = await response.json()
					this.processIncomingData(result)
				}
			} catch (err) {
				this.log('error', 'HTTP PUT Request failed (' + err.message + ')')
				this.updateStatus(InstanceStatus.UnknownError, err.message)
			}
		}
	}

	processIncomingData(result) {
		let variableObj = {}
		if (
			result.code == '400' ||
			result.code == '401' ||
			result.code == '402' ||
			result.code == '403'
		) {
			this.log('error', `${result.code}: ${result.message}`)
		} else {
			let msg = result.message
			if (msg['software_version'] != undefined) {
				variableObj['software_version'] = msg['software_version']
			}
			if (msg['model_number'] != undefined) {
				variableObj['model_number'] = msg['model_number']
			}
			if (msg['active_connections'] != undefined) {
				this.active_connections = []
				msg['active_connections'].forEach((element) => {
					this.active_connections[element['receiver_name']] = []
					this.active_connections[element['receiver_name']]['connection_name'] = element['connection_name']
					this.active_connections[element['receiver_name']]['active_user'] = element['active_user']
				})
				this.checkFeedbacks('actual_connection')
			} else if (msg['users'] != undefined) {
				this.users = msg['users']
				this.users_list = []
				this.users.forEach((element) => {
					this.users_list.push({ id: element.username, label: element.username })
				})
			} else if (msg['connections'] != undefined) {
				this.connections = msg['connections']
				this.connections_list = []
				this.connections.forEach((element) => {
					this.connections_list.push({ id: element.name, label: element.name })
				})
			} else if (msg['devices'] != undefined) {
				this.devices = msg['devices']
				this.hosts_list = []
				this.receivers_list = []
				this.devices.forEach((element) => {
					if (element.model.slice(-1) == 'T') {
						this.hosts_list.push({ id: element.ip, label: element.name })
					} else {
						this.receivers_list.push({ id: element.name, label: element.name })
					}
				})
			}
			this.initActions()
			this.initFeedbacks()
		}
		if (Object.keys(variableObj).length > 0) {
			this.setVariableValues(variableObj)
		}
	}

	initVariables() {
		let variables = [
			{ variableId: 'software_version', name: 'Boxilla version:' },
			{ variableId: 'model_number', name: 'Model number:' },
		]
		this.setVariableDefinitions(variables)
	}

	destroy() {
		if (this.pollAPI) {
			clearInterval(this.pollAPI)
		}
	}

	init(config) {
		debug = this.debug
		log = this.log

		const newconfig = {
			...config,
			apiPollInterval: config.apiPollInterval ?? 1000,
		}

		this.configUpdated(newconfig)
	}

	configUpdated(config) {
		this.config = { ...config }
		this.initConnection()
		this.initVariables()
		this.initActions()
		this.initFeedbacks()
	}

	/**
	 * Set available feedback choices
	 */
	initFeedbacks() {
		const feedbacks = initFeedbacks.bind(this)()
		this.setFeedbackDefinitions(feedbacks)
	}
}

runEntrypoint(instance, [
	function (context, props) {
		return {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
	},
])
