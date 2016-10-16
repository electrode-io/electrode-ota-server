#!/usr/bin/env node
const cassandra = require('cassandra-driver');
const connect = require('../server/dao/cassandra/init');
const exit = e=>process.exit(e ? 1 : 0);
const error = e=> {
    if (e) console.log(e);
    process.exit(1);
};

let isDrop = false;
let isUser = false;
const args = process.argv.slice(2);
while (args.length) {
    const arg = args.shift();
    switch (arg) {
        case '--drop':
            isDrop = true;
            break;
        case '--user':
            isUser = true;
            break;

        case '-h':
        case '--help':
        default:
            console.log(`
${process.argv[1]} 
        --help this helpful message
        --drop drops all tables (dangerous) then sets up tables.`)
    }
}

const api = connect({namespace:'wm_ota'}, void(0), isDrop);
api.connect()
    .then(_=>console.log('Connected: Dropping and Creating Tables'))
    .then(api.drop)
    .then(api.load)
    .then(exit, error);
