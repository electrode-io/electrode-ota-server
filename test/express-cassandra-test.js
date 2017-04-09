const init = require('../server/dao/express-cassandra');
const {expect} = require('chai');

describe('Express Cassandra', function () {
    let model;

    before(() => init({
        ormOptions: {
            createKeyspace: true,
            dropTableOnSchemaChange: true,
            disableTTYConfirmation: true,
            migration: 'alter'
        }
    }).then((r) => model = r));

    it('should start', function () {

        expect(model).to.exist;
    })

});
