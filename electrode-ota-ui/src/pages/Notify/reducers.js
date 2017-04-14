import {
	SHOW_NOTIFICATION,
	CLEAR_NOTIFICATION
} from './actions';

const EMPTY_NOTIFY = {};

export const notification = (state = EMPTY_NOTIFY, {type, isError, value, error, ...rest})=> {
	const [action, ...parents] = type.toLowerCase().split('_');
	value = value || [];
	switch (type) {
		case CLEAR_NOTIFICATION:
			return EMPTY_NOTIFY;
		case SHOW_NOTIFICATION: {
			return value;
		}
	}
	switch (action) {
		//capture the action arguments
		case 'add':
		case 'remove':
		case 'patch':
		case 'rename':
		case 'transfer':
		case 'clear':
		case 'promote':
			const parts = value.concat();
			if (parents[0] == 'deployment') {

				switch (action) {
					case 'patch':
					case 'release':
					case 'rename':
						parts.pop();

				}
			} else if (action === 'rename') {
				//reorder the last 2 for a rename
				parts.pop();
				// parts.push(parts.pop(), parts.pop());
			}


			let name = parts.pop();
			let parent = [...parents, ...parts].join('-');
			if (parent === 'app') {
				parent = 'shell';
			}

			return {
				parent,
				name
			};
		//capture the completed state
		case 'added':
		case 'removed':
		case 'patched':
		case 'renamed':
		case 'transfered':
		case 'cleared':
		case 'promoted':
			return {
				...state,
				action,
				isError,
				error
			};
		default:
			return state;

	}

};

export default({notification});
