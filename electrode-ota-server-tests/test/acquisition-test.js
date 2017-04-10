import initDao from './support/init-dao';
import acquisition from 'electrode-ota-server-model-acquisition/lib/acquisition';
import { expect } from 'chai';

describe('model/acquisition', function () {
    let ac;
    this.timeout(50000);
    let i = 0;
    const genRatio = (ratio) => {
        const ret = ratio % (i += 25) == 0;
        return ret;
    };
    before(async () => ac = acquisition((await initDao()), genRatio));

    it('should be 50% rollout', () => {
        const result = [];
        const update = (uniqueClientId = 'uniqueClientId',
                        packageHash = 'packageHash',
                        ratio = 50) => () => ac.isUpdateAble(uniqueClientId, packageHash, ratio).then(r => result.push(r));
        const first = update();
        return first().then(first).then(first).then(_ => {
            const [r0, r1, r2] = result;
            expect(r0).to.be.true;
            expect(r1).to.be.true;
            expect(r2).to.be.true;
            result.length = 0;
        }).then(update('id1', 'hash', 3))
            .then(update('id1', 'hash', 3))
            .then(update('id1', 'hash', 99))
            .then(_ => {
                const [r0, r1, r2] = result;
                expect(r0).to.be.false;
                expect(r1).to.be.false;
                expect(r2).to.be.false;
            });
    });


});
