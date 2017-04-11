"use strict";
import React from 'react';
import {render} from 'react-dom';
import {renderIntoDocument} from 'react-addons-test-utils';
import expect from "expect";
import App from '../public/App.jsx';

//insert app into dom.
function into(node, debug) {
    if (debug === true) {
        debug = document.createElement('div');
        document.body.appendChild(debug);
        return render(node, debug);
    }
    return renderIntoDocument(node);
}

describe("index.jsx", function(){

  it('should render App', function(){
    const app = into(<App/>, true);
    expect(app).toExist();
  });

});