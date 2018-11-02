import diregister from "electrode-ota-server-diregister";

const levels = ["error", "warn", "info", "log", "debug", "trace"];
export function noOp() {}

// default logger - bunyan (https://github.com/trentm/node-bunyan)
export function loggerFactory(options, register) {
  let loggers = {};
  let noOpIdx = levels.length;
  if (options && options.level) {
    noOpIdx = levels.indexOf(options.level.toLowerCase()) + 1;
  }
  return levels.reduce((logger, method, idx) => {
    if (idx >= noOpIdx) {
      logger[method] = noOp;
    } else {
      logger[method] = function(fields, shortMsg, longMsg) {
        try {
          console[method](fields, shortMsg, longMsg || "");
        } catch (e) {
          console.error("error while logging", e);
        }
      };
    }
    return logger;
  }, {});
}

export const register = diregister(
  {
    name: "ota!logger",
    multiple: false,
    connections: false,
    dependencies: ["electrode:register"]
  },
  loggerFactory
);
