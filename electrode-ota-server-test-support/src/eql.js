import {expect} from 'chai';

const eql = (eq, pos) => {
    const isA = Array.isArray(eq);
    if (isA) {
        eq = eq.map(eql);
    }

    return (v, i) => {
        if (isA) {
            expect(Array.isArray(v), 'should be an array').to.be.true;
            eq.forEach((c, i) => c(v[i]));
            return v;
        }
        const p = JSON.parse(JSON.stringify(v));
        delete p.id;
        delete p.id_;
        expect(p, i ? `on the ${i} item` : '').to.eql(eq);
        return v;

    };
};
export default eql;