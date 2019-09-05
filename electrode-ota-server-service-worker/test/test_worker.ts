"use strict";

function workerProcess() {
  console.log("Hello World");
}
let timer = setInterval(workerProcess, 200);
console.error(`Yo useless error`);

process.once("SIGINT", () => {
  clearInterval(timer);
  process.exit(0);
});
if (process.send) {
  process.send({ status: "OK" });
}
