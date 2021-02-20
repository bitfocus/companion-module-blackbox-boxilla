exports.initFeedbacks = function() {
	const feedbacks = {};

	const foregroundColor = {
		type: 'colorpicker',
		label: 'Foreground color',
		id: 'fg',
		default: this.rgb(255, 255, 255)
	};

	const backgroundColorProgram = {
		type: 'colorpicker',
		label: 'Background color',
		id: 'bg',
		default: this.rgb(255, 0, 0)
	};

	feedbacks.actual_connection = {
		label: 'Change color for active connection',
		description: 'When KVM is switched, background color will change',
		options: [
			foregroundColor,
			backgroundColorProgram,
			{
				type: 'dropdown',
				label: 'user',
				id: 'user',
				choices: this.users_list,
			},{
				type: 'dropdown',
				label: 'receiver',
				id: 'receiver',
				choices: this.receivers_list,
			},{
				type: 'dropdown',
				label: 'connection',
				id: 'connection',
				choices: this.connections_list,
			}
		]
	};

	return feedbacks;

}

exports.executeFeedback = function (feedback, bank) {
	if(feedback.type === 'actual_connection') {
		if(this.active_connections[feedback.options.receiver]['connection_name'] == feedback.options.connection_name || this.active_connections[feedback.options.receiver]['active_user'] == feedback.options.user) {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}

	if(feedback.type === 'tally_PVW') {
		if(this.tallyPVW[feedback.options.src]) {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}

	if(feedback.type === 'tally_record') {
		if(this.switcher['recording']) {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}
	
	if(feedback.type === 'tally_streaming') {
		if(this.switcher['streaming']) {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}

	if(feedback.type === 'play_media') {
		if(this.shortcut_states[feedback.options.target] == 'true') {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}
};