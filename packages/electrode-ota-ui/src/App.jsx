"use strict";
import React from 'react';
import {Provider} from 'react-redux';
import Routes from './routes';
export default ({store})=><Provider store={store}><Routes store={store}/></Provider>;
