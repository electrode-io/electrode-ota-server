"use strict";
import cassandra from 'cassandra-driver';

class BaseCassandra {
    constructor(props) {
        this.client = props.client;
    }

    _first(query, args = [], config = BaseCassandra.defaultConfig, unwrap = firstArg) {
        if (typeof config === 'function') {
            unwrap = config;
            config = DEFAULT_CONFIG;
        }
        return new Promise((resolve, reject)=>this.client.execute(query, args, config, (e, rs)=>e ? reject(e) : resolve(unwrap(rs.first()))));
    }

    _all(query, args = [], config = BaseCassandra.defaultConfig, unwrap = (v, arr)=>arr.push(v)) {

        if (typeof config === 'function') {
            unwrap = config;
            config = DEFAULT_CONFIG;
        }

        return new Promise((resolve, reject)=> {
            const result = [];
            this.client.eachRow(query, args, config, (n, row)=> {
                unwrap(row, result);
            }, e => {
                if (e) {
                    e.query = query;
                    e.args = args;
                    return reject(e);
                }
                resolve(result);
            });
        });
    }

    _batch(queries, config = BaseCassandra.defaultConfig, unwrap = firstArg) {

        if (typeof config === 'function') {
            unwrap = config;
            config = DEFAULT_CONFIG;
        }

        return new Promise((resolve, reject)=> {
            this.client.batch(queries, config, function (e, o) {
                if (e) {
                    return reject(e);
                }
                resolve(unwrap(o));
            });
        });
    }

}

const firstArg = (v)=>v;
const DEFAULT_CONFIG = {prepare: true};
const uuid = cassandra.types.Uuid.random.bind(cassandra.types.Uuid);
const tuuid = cassandra.types.TimeUuid.now.bind(cassandra.types.TimeUuid);

const upstr = (q, i)=>`"${q}" = ?`;


const updater = (availableKeys, obj)=> {
    const keys = Object.keys(obj).filter(key=>availableKeys.indexOf(key) > -1).sort();

    return {
        update: `${keys.map(upstr).join(',')}`,
        params: keys.map(v=>obj[v])
    };

};

const insertError = (row) =>row['[applied]'] != false;


const q = (query, ...params)=> {
    return {
        query,
        params
    }
};
BaseCassandra.uuid = uuid;
BaseCassandra.tuuid = tuuid;
BaseCassandra.updater = updater;
BaseCassandra.insertError = insertError;
BaseCassandra.q = q;
BaseCassandra.defaultConfig = DEFAULT_CONFIG;

module.exports = BaseCassandra;