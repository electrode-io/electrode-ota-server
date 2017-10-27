import diregister from "electrode-ota-server-diregister";
import bunyan from "bunyan";
import good from "good";

// default logger - bunyan (https://github.com/trentm/node-bunyan)
export function loggerFactory(options, register) {

    return ["error", "warn", "info", "log", "debug", "trace"].reduce((logger, method) => {
        logger[method] = function(fields, shortMsg, longMsg) {
            try {
                console[method](fields, shortMsg, longMsg || "");
            } catch (e) {
                console.error("error while logging", e);
            }
        }
        return logger;
    }, {});

}


export const register = diregister({
    name: 'ota!logger',
    multiple: false,
    connections: false,
    dependencies : ["electrode:register"]
}, loggerFactory);
