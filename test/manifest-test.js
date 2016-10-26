const manifest = require('../server/manifest');
const expect = require('chai').expect;
const path = require('path');
const join = path.join.bind(path, __dirname);
const step0 = require('./fixtures/step.0.manifest.json');
const step1 = require('./fixtures/step.1.manifest.json');

const fs = require('fs');
const eql = eql=>resp=> expect(resp).to.eql(eql);

const readFile = (file, options = {}) => {
    return new Promise((resolve, reject)=> {
        fs.readFile(file, options, function (err, buffer) {
            if (err) return reject(err);
            resolve(buffer);
        });
    })
};
const readFixture = (file, options)=> readFile(join('fixtures', file), options);

describe('manifest', function () {
    this.timeout(50000);
    it('should generate manifest', ()=> readFixture('step.0.blob.zip').then(buffer=>manifest.generate(buffer).then(eql(step0))));

    /*it('should generate a delta file from a file and a manufest', function () {

        return readFixture('step.2.blob.zip').then(buffer=>manifest.delta(step1, buffer));

    });*/
});
