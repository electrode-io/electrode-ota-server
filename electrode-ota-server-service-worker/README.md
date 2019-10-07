# `electrode-ota-service-worker`

Creates a worker process that summarizes the metrics and places them into the `metrics-summary` table.

## Usage

In your OTA Manager config, add this module as a plugin.

```json
{
  "plugins": {
    "electrode-ota-server-service-worker": {
      "options": {
        "numberWorkers": 1,
        "workerSleep": 300
      }
    }
  }
}
```

The options are

- numberWorkers: Number of workers to fork (default 1)
- workerSleep: Time in seconds for the worker to sleep between updates (default 300 sec)

## Contributing

To run tests and coverage

```sh
% yarn
% yarn coverage
```

To run tests only

```sh
% yarn test
```
