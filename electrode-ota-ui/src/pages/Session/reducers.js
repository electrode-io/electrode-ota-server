import {REQUEST_SESSIONS, RECEIVE_SESSIONS} from './actions';
import {generateReducer} from '../../util/reducerHelper';

export const sessions = generateReducer(REQUEST_SESSIONS, RECEIVE_SESSIONS, 'items');

export default ({sessions});