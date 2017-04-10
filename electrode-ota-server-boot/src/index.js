const Confippet = require("electrode-confippet");
const path = require('path');
const dirs = [path.join(__dirname, "config"), path.join(process.cwd(), 'config')];
const {set} = require("lodash");
const defaultConfig = rquire('electrode-ota-server-defuault-config').default;
const electrodeServer = require("electrode-server");
export function boot() {
    const makeRandomJson = (name) => {
        const randomFile = path.join(process.cwd(), '.random.json');
        const fs = require('fs');
        const util = require('./server/util')
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

    if (process.env.OTA_CONFIG_DIR) {
        dirs.push(process.env.OTA_CONFIG_DIR)
    }

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
    defaults._$.compose(defaultConfig);
    defaults._$.use(verify(defaults));
    return defaults;
}
export default function () {
    return electrodeServer(boot());
}

if (require.main === module) {
    electrodeServer(boot());
}