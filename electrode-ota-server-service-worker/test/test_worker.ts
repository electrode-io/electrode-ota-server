"use strict";

process.on("message", data => {
  switch (data.action) {
    case "ping":
      process.send("pong");
      break;
    case "stdout":
      console.log("Hello World");
      process.send("ok");
      break;
    case "stderr":
      console.error("Yo error");
      process.send("ok");
      break;
  }
});

process.once("SIGINT", () => {
  process.exit(0);
});
