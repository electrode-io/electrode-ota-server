"use strict";

let options = {
  sleepSec: 3000
};

let timeoutIdx = -1;
process.argv.forEach((val, idx) => {
  if (val === "--sleep" || val === "-s") {
    timeoutIdx = idx + 1;
  }
});
if (timeoutIdx >= 0 && timeoutIdx < process.argv.length) {
  options.sleepSec = parseInt(process.argv[timeoutIdx]) || options.sleepSec;
}

process.title = `electrode-ota-server-service-worker`;

function workerProcess() {
  // TODO
}
let timer = setInterval(workerProcess, options.sleepSec * 1000);

process.once("SIGINT", () => {
  clearInterval(timer);
  process.exit(0);
});

if (process.send) {
  process.send({ status: "OK", sleep: options.sleepSec });
}
