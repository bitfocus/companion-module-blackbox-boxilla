exports.getActions = function () {

	let actions = {}

	actions['joyStickOperationPan'] = {
		label: 'Pan camera',
		options: [
			{
				label: 'Select direction',
				type: 'dropdown',
				id: 'direction',
				default: 'Stop',
				choices: [{ label: 'Left', id: 'Left' }, { label: 'Right', id: 'Right' }, { label: 'Stop', id: 'Stop' }]
			},
			{
				label: 'Select speed (0-100)',
				type: 'textinput',
				id: 'speed',
				default: '15',
				regex: '/^([0-9]|[1-2][0-9]|100)$/'
			}
		]
	}

	return actions
}
