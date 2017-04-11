import {asAsyncEvent} from '../../util/actionHelper';
export const CLEAR_NOTIFICATION = 'CLEAR_NOTIFICATION';
export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const clearNotification = asAsyncEvent(CLEAR_NOTIFICATION);