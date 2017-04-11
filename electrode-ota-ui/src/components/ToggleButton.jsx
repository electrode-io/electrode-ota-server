import React from 'react';

export default ({icon, btnCls, activeCls = 'active', active = false, onToggle, label, ...rest})=> {
    return <button {...rest} className={`btn btn-default ${btnCls} ${active ? activeCls : ''}`} aria-label={label}
                   onClick={onToggle}>
		{label}{icon ? <i className={`fa fa-fw fa-${icon}`}/> : null }
    </button>
}
