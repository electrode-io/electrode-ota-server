import Confippet from "electrode-confippet";
import path from 'path';
import {set} from "lodash";
import fs from 'fs';
import util from 'electrode-ota-server-util';
import Module from 'module';

let _module = module;
while (_module.parent) {
    _module = _module.parent;
}
export const DEFAULT_OTA_SERVER_DIRS = [
    path.join(require.resolve('electrode-server'), '..', 'config')
];

export function boot(dirs = DEFAULT_OTA_SERVER_DIRS) {
    const makeRandomJson = (name) => {
        const randomFile = path.join(process.cwd(), '.random.json');
        let rndm = {};

        try {
            // Query the entry
            fs.lstatSync(randomFile);
            rndm = require(randomFile);
        }
        catch (e) {
        }
        if (!rndm[name]) {
            console.log(`Generating random password in "${randomFile}"  option path "${name}"\n To prevent this from happening
set a cookie password for this path in your configuration.`);
            rndm[name] = util.genString(50);
            fs.writeFileSync(randomFile, JSON.stringify(rndm), {flag: 'w', encoding: 'utf8'});
        }
        return rndm[name];
    };

    const options = {
        dirs,
        warnMissing: false,
        failMissing: false,
        context: {
            deployment: process.env.NODE_ENV || 'production'
        }
    };

    const verify = (def) => {
        const update = {};
        const secret = (path) => {
            //disabled skip
            if (def.$(path + '.enable') === false) {
                return;
            }
            const fullPath = `${path}.options.password`;
            const tmp = def.$(fullPath);
            if (!tmp) {
                set(update, fullPath, makeRandomJson(fullPath));
            }
        };

        secret('plugins.electrode-ota-server-auth.options.strategy.github-oauth');
        secret('plugins.electrode-ota-server-auth.options.strategy.session');


        return update;
    };

    const defaults = Confippet.store();
    defaults._$.compose(options);
    defaults._$.use(verify(defaults));


    return defaults;
}
export const bootServer = function (dirs) {
    const electrodeServer = require('electrode-server');
    return electrodeServer(boot(dirs));
};
export default bootServer;
if (require.main === module) {
    bootServer();
}
