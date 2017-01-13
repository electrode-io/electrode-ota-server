const acquisition = require('../server/model/acquisition');
const init = require('../server/dao/cassandra/init');
const eql = require('./support/eql');
const Dao = require('../server/dao/cassandra/dao-cassandra');
const weighted = require('../server/model/weighted-plugin').weighted;
const expect = require('chai').expect;

describe('model/acquisition', function () {
    let ac;
    this.timeout(50000);

    before(() => init({contactPoints: ['localhost'], keyspace: 'ota_test'}).connect({reset: true}).then((client) => {
        ac = acquisition(new Dao({client}), weighted);
    }));

    it('should be 50% rollout', () => {
        const result = [];
        const update = (uniqueClientId = 'uniqueClientId',
                        packageHash = 'packageHash',
                        ratio = 50) => () => ac.isUpdateAble(uniqueClientId, packageHash, ratio).then(r => result.push(r));
        const first = update();
        return first().then(first).then(first).then(_ => {
            const [r0,r1,r2] = result;
            /*TODO- Figure this out.
             expect(r0).to.be.true;
             expect(r1).to.be.true;
             expect(r2).to.be.true;*/
            result.length = 0;
        }).then(update('id1', 'hash', 3))
            .then(update('id1', 'hash', 3))
            .then(update('id1', 'hash', 99))
            .then(_ => {
                const [r0,r1,r2] = result;
                expect(r0).to.be.false;
                expect(r1).to.be.false;
                expect(r2).to.be.true;
            });
    });


});
