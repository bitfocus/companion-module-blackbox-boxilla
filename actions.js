exports.getActions = function () {
	let actions = {}

	actions['active_connection'] = {
		name: 'Connect user to connection',
		options: [
			{
				label: 'Username',
				type: 'dropdown',
				id: 'username',
				choices: this.users_list,
			},
			{
				label: 'Connection name',
				type: 'dropdown',
				id: 'connection_name',
				choices: this.connections_list,
			},
			{
				label: 'Receiver name',
				type: 'dropdown',
				id: 'receiver_name',
				choices: this.receivers_list,
			},
		],
		callback: (action) => {
			let opt = action.options
			this.sendCommand('bxa-api/connections/kvm/active', 'POST', {
				username: opt.username,
				connection_name: opt.connection_name,
				receiver_name: opt.receiver_name,
			})
		},
	}

	// actions['new_connection'] = {
	// 	label: 'Create new connection',
	// 	options: [{
	// 			label: 'Name',
	// 			type: 'textinput',
	// 			id: 'name',
	// 			default: 'Companion123',
	// 		},{
	// 			label: 'Select host',
	// 			type: 'dropdown',
	// 			id: 'host',
	// 			choices: this.hosts_list
	// 		},{
	// 			label: 'Group',
	// 			type: 'dropdown',
	// 			id: 'group',
	// 			default: 'ConnectViaTx',
	// 			choices: [{id: 'ConnectViaTx', label: 'ConnectViaTx'},{id: 'VM', label: 'VM'},{id: 'VMPool', label: 'VMPool'},{id: 'VMHorizon', label: 'VMHorizon'},{id: 'TXPair', label: 'TXPair'}]
	// 		},{
	// 			label: 'connection_type',
	// 			type: 'dropdown',
	// 			id: 'connection_type',
	// 			default: 'Private',
	// 			choices: [{id: 'Private', label: 'Private'},{id: 'Shared', label: 'Shared'}]
	// 		},{
	// 			label: 'view_only',
	// 			type: 'dropdown',
	// 			id: 'view_only',
	// 			default: 'Yes',
	// 			choices: [{id: 'Yes', label: 'Yes'},{id: 'No', label: 'No'}]
	// 		},{
	// 			label: 'extended_desktop',
	// 			type: 'dropdown',
	// 			id: 'extended_desktop',
	// 			default: 'Yes',
	// 			choices: [{id: 'Yes', label: 'Yes'},{id: 'No', label: 'No'}]
	// 		},{
	// 			label: 'usb_redirection',
	// 			type: 'dropdown',
	// 			id: 'usb_redirection',
	// 			default: 'Yes',
	// 			choices: [{id: 'Yes', label: 'Yes'},{id: 'No', label: 'No'}]
	// 		},{
	// 			label: 'audio',
	// 			type: 'dropdown',
	// 			id: 'audio',
	// 			default: 'Yes',
	// 			choices: [{id: 'Yes', label: 'Yes'},{id: 'No', label: 'No'}]
	// 		},{
	// 			label: 'persistent',
	// 			type: 'dropdown',
	// 			id: 'persistent',
	// 			default: 'Yes',
	// 			choices: [{id: 'Yes', label: 'Yes'},{id: 'No', label: 'No'}]
	// 		},{
	// 			label: 'zone',
	// 			type: 'dropdown',
	// 			id: 'zone',
	// 			default: 'OSS',
	// 			choices: [{id: 'OSS', label: 'OSS'}]
	// 		},{
	// 			label: 'compression',
	// 			type: 'dropdown',
	// 			id: 'cmode',
	// 			default: 'Optimized',
	// 			choices: [{id: 'Optimized', label: 'Optimized'},{id: 'LossLess', label: 'LossLess'}]
	// 		}],
	// 		callback: (action) => {
	// 			let opt = action.options
	// 			this.sendCommand('bxa-api/connections/kvm', 'POST', {
	//  			name: opt.name,
	//  			host: opt.host,
	//  			group: opt.group,
	//  			connection_type: opt.connection_type,
	//  			view_only: opt.view_only,
	//  			extended_desktop: opt.extended_desktop,
	//  			usb_redirection: opt.usb_redirection,
	//  			audio: opt.audio,
	//  			persistent: opt.persistent,
	//  			zone: opt.zone,
	//  			cmode: opt.cmode,
	//  		})
	//  	}
	//  }

	return actions
}
