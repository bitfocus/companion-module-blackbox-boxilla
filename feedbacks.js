const { combineRgb } = require('@companion-module/base')

exports.initFeedbacks = function() {
	const feedbacks = {};

	const foregroundColor = combineRgb(255, 255, 255)
	const backgroundColorProgram = combineRgb(255, 0, 0)

	feedbacks.actual_connection = {
		type: 'boolean',
		name: 'Change color for active connection',
		description: 'When KVM is switched, background color will change',
		defaultStyle: {
			color: foregroundColor,
			bgcolor: backgroundColorProgram,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Username',
				id: 'user',
				choices: this.users_list,
			},
			{
				type: 'dropdown',
				label: 'Connection name',
				id: 'connection',
				choices: this.connections_list,
			},
			{
				type: 'dropdown',
				label: 'Receiver name',
				id: 'receiver',
				choices: this.receivers_list,
			},
		],
		callback: (feedback, _) => {
			let options = feedback.options
			if (
				this.active_connections?.[options.receiver]?.['connection_name'] == options.connection &&
				this.active_connections?.[options.receiver]?.['active_user'] == options.user
			) {
				return true
			}
			return false
		},
	}

	return feedbacks;

}