#!/usr/bin/env/node
import "babel-polyfill";
import Summarizor, { LOGGING_DEBUG, LOGGING_INFO, LOGGING_ERROR } from "./summarizor";
import { join } from "path";
import { store } from "electrode-confippet";
import { daoFactory, shutdown } from "./dao_factory";
import { loggerFactory } from "electrode-ota-server-logger";
/**
 * Options:
 *    --sleep  Sleep time in seconds.  Default 5 minutes
 *    --config Config directory.
 *
 */
const FIVE_MINUTES: number = 3000;
const options = {
  sleepSec: FIVE_MINUTES,
  summationRangeInHours: 6,
  lockExpirationInHours: 2,
  logging: LOGGING_ERROR
};

let args = require("minimist")(process.argv.slice(2));
if (args.sleep) {
  const sleepInt = parseInt(args.sleep);
  if (!isNaN(sleepInt) && sleepInt >= 0) {
    options.sleepSec = sleepInt;
  }
}
if (args.query_range) {
  const rangeAsInt = parseInt(args.query_range);
  if (!isNaN(rangeAsInt) && rangeAsInt > 0) {
    options.summationRangeInHours = rangeAsInt;
  }
}

if (args.logging) {
  switch (args.logging.toLowerCase()) {
    case "debug":
      options.logging = LOGGING_DEBUG;
      break;
    case "info":
      options.logging = LOGGING_INFO;
      break;
  }
}

function getServerConfigs() {
  let configDirs: string[] = [];
  configDirs = configDirs.concat(
    join(require.resolve("electrode-ota-server-default-config"), ".."),
    process.env.OTA_CONFIG_DIR || join(process.cwd(), "config")
  );
  const configs = store();
  const configOptions = {
    dirs: configDirs,
    warnMissing: false,
    failMissing: false,
    context: {
      deployment: process.env.NODE_ENV || "production"
    }
  };
  configs._$.compose(configOptions);
  return configs;
}

async function createWorker() {
  const serverConfigs = getServerConfigs();
  const dao = await daoFactory(serverConfigs, loggerFactory);
  const logger = loggerFactory({});
  return new Summarizor(options, dao, logger);
}

createWorker().then(worker => {
  process.title = `electrode-ota-server-service-worker`;
  process.once("SIGINT", () => {
    worker.stop();
    shutdown();
    process.exit(0);
  });

  worker.start();
});
