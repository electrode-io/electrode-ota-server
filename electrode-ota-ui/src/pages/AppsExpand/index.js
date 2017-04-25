import {connect} from 'react-redux';
import boundDispatched from '../../util/boundDispatched';
import AppsExpand from './AppsExpand';
import {getApps, toggle} from './actions';

function filterName({name = ''}) {
    return ~name.toLowerCase().indexOf(this);
}

function filterItems(items = [], str) {
    if (!str) return items;
    return items.filter(filterName, str.toLowerCase());
}
function debounce(fn, to) {
    let _to;
    return function (...args) {
        clearTimeout(_to);
        _to = setTimeout(fn.bind(this, ...args), to);
    }
}

let blocking = false;
export default connect(({authorization, sidebar, filter, apps:{items = [], isFetching = true, isStale}})=> {
        items = filterItems(items, filter);
        return {
            authorization,
            filter,
            open: sidebar,
            sidebar,
            items,
            isFetching,
            isStale
        }
    },
    dispatch => {
        const onGetApps = debounce(function onGetApps$inner() {
            const {authorization:{host, token}} = this;
            return dispatch(getApps(host, token))
        }, 400);
        return {
            onGetApps,
            onDidExpand(open)
            {
                if (open) {
                    onGetApps.call(this);
                }
            },
            onExpand(open)
            {
                return dispatch(toggle(open));
            }
        }
    }, boundDispatched)(AppsExpand);