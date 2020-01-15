import { wrap, reqFields } from "electrode-ota-server-util";
import diregister from "electrode-ota-server-diregister";
import keysToCamelOrSnake from "./keys-to-camel-or-snake";

const HTTP_OK = 200;

const ok = reply => e => {
    if (e) return reply(e);
    reply("OK").code(HTTP_OK);
};

export const register = diregister({
    name: "acquisitionRoute",
    dependencies: ["electrode:route", "ota!acquisition", "ota!logger"]
// eslint-disable-next-line max-params
}, (options, route, acquisition, logger) => {
    const {
        download,
        updateCheck,
        downloadReportStatus,
        deployReportStatus
    } = wrap(acquisition);

    const handleUpdateCheck = (request, reply) => {
        logger.info(reqFields(request), "updateCheck request");
        const snakeCaseRequested = /update_check/.test(request.url.path);
        // if snake_case request? convert to camelCase
        const qs = snakeCaseRequested ? keysToCamelOrSnake(request.query) : request.query;
        updateCheck(qs, (e, updatedInfo) => {
            if (e) {
                console.log("error making update check ", request.query, e.message);
                return reply(e);
            }
            // if snake_case request? convert the response to the same
            const updateInfo = snakeCaseRequested ? keysToCamelOrSnake(updatedInfo) : updatedInfo;
            console.log(request.url.path);
            console.log({ updateInfo });
            reply({ updateInfo });
        });
    };

    route([
        {
            method: "GET",
            path: "/updateCheck",
            config: {
                auth: false,
                handler: handleUpdateCheck,
                tags: ["api"]
            }
        },
        {
            method: "GET",
            path: "/update_check",
            config: {
                auth: false,
                handler: handleUpdateCheck,
                tags: ["api"]
            }
        },
        {
            path: "/storagev2/{packageHash}",
            method: "GET",
            config: {
                auth: false,
                handler(request, reply) {
                    logger.info(reqFields(request), "download request");
                    download(request.params.packageHash, (e, o) => {
                        if (e) return reply(e);
                        const { content, length } = o;
                        reply(content).type("application/octet-stream").bytes(length);
                    });
                },
                tags: ["api"]
            }
        },
        {
            path: "/reportStatus/deploy",
            method: "POST",
            config: {
                auth: false,
                handler(request, reply) {
                    logger.info(reqFields(request), "report deployment status request");
                    deployReportStatus(request.payload, ok(reply));
                },
                tags: ["api"]
            }
        },
        {
            path: "/reportStatus/download",
            method: "POST",
            config: {
                auth: false,
                handler(request, reply) {
                    logger.info(reqFields(request), "report download status request");
                    downloadReportStatus(request.payload, ok(reply));
                },
                tags: ["api"]
            }
        }
    ]);
});

export default { register };
