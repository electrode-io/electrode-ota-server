import React from 'react';
import OrigTags from 'react-tagsinput';
import 'react-tagsinput/react-tagsinput.css';
const Tags = ({onAdd, onRemove, onSelect, ...rest} )=> {

    const handleChange = (newArr, changeArr)=> {
        let add = [], remove = [];
        for (const v of changeArr) {
            if (newArr.indexOf(v) > -1) {
                add.push(v);
            } else {
                remove.push(v);
            }
        }

        if (add.length) {
            onAdd && onAdd(...add);
        } else if (remove.length) {
            onRemove && onRemove(...remove)
        } else {
            onSelect && onSelect()
        }
    };
    return <OrigTags onChange={handleChange} {...rest}/>
};

export default Tags;