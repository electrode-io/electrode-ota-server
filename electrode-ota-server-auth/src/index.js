import {map} from "electrode-ota-server-util";
import diregister from "electrode-ota-server-diregister";

module.exports.register = diregister({
    name: 'ota!scheme',
    version: '0.0.1',
    multiple: false,
    connections: true,
    dependencies: ['electrode:register', 'electrode:auth', 'ota!validate']
}, (options, register, auth, validators) => {

   return Promise.all(map(options.strategy, (obj, key) => obj !== false && new Promise((resolve, reject)=> {
        //register plugins
        if (obj == null || obj.enable === false || obj === false) {
            return resolve();
        }
        const plugin = typeof obj.module != 'string' ? obj.module : require(obj.module);
        register.call(this, plugin, obj.conf || {}, (e) => e ? reject(e) : resolve());

    }))).then(() => {

        map(options.strategy, (obj, name)=> {
            if (obj == null || obj === false || obj.enable === false) return;

            const args = [name, obj.scheme || obj.module];

            if ('mode' in obj) args.push(obj.mode);

            const options = Object.assign({}, obj.options);

            if (typeof obj.validate === 'string') {
                options.validateFunc = validators[obj.validate];
                delete obj.validate;
            }
            args.push(options);

            auth.strategy(...args);
        });

        if (options.default)
            auth.default(options.default);
    })
});

