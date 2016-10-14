"use strict";
import {loaderFactory, DefaultLoader} from "Subschema";
import layout from './layouts';
import component from './components';
import './styles/sb-admin-2.lessp';

//this is the entry for exporting library.

const loader = loaderFactory([DefaultLoader]);

loader.addTemplate(layout);
loader.addType(component);

loader.addValidator('max', ({max = 30, message = 'Exceeds max lenght of 30 chars'})=> {
        return (value)=> {
            value = value == null ? '' : '' + value;
            if (value.length > max) {
                return {
                    type: 'ERROR',
                    message
                }
            }
        }
    }
);
export default loader;
