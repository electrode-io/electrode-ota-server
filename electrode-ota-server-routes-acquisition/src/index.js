import { wrap, reqFields } from "electrode-ota-server-util";
import diregister from "electrode-ota-server-diregister";
import keysToCamelOrSnake from "./keys-to-camel-or-snake";

const HTTP_OK = 200;

const ok = reply => e => {
    if (e) return reply(e);
    reply("OK").code(HTTP_OK);
};

const shouldSendCachedUrl = (id, plan) => {
    const bucket = plan.toLowerCase();
    const lastChar = id.substr(-1).toLowerCase();
    // Unique Client ID is of HexaDecimal chars
    //  the plan will have the chars from 0-F
    //   if the last character of the id is present in the plan, send the cached url
    //  eg: plan: "35cf", id: "c407bdf6613d0b85" / "2ABCBCA1-BF1D-4831-9D5F-C4107BFB9B6E"
    //  the former id gets the cached url and the latter gets non-cadched url
    //  also, if the plan is "*"/"all" all the requests get cached url
    const toAll = (bucket === "*" || bucket === "all");
    return toAll || bucket.indexOf(lastChar) >= 0;
};

export const register = diregister({
    name: "acquisitionRoute",
    dependencies: ["electrode:route", "ota!acquisition", "ota!logger", "ota!ccm"]
// eslint-disable-next-line max-params
}, (options, route, acquisition, logger, ccm) => {
    const {
        download,
        updateCheck,
        downloadReportStatus,
        deployReportStatus
    } = wrap(acquisition);

    const handleUpdateCheck = (request, reply) => {
        const action = request.url.pathname;
        logger.info(reqFields(request), `${action} request`);
        const snakeCaseRequested = /update_check/.test(action);
        // if snake_case request? convert to camelCase
        const qs = snakeCaseRequested ? keysToCamelOrSnake(request.query) : request.query;
        updateCheck(qs, (e, updatedInfo) => {
            if (e) {
                console.log("error making update check ", request.query, e.message);
                return reply(e);
            }
            // default is Experiment-A(expA) => Non-cached dowload URL
            // Experiment-B(expB) => Cached dowload URL (/deltaPackage)
            // Also checks for cdnRampUp from CCM to switch url
            const rampUpPlan = ccm("cdnRampUp");
            const sendCachedUrl = shouldSendCachedUrl(qs.clientUniqueId, rampUpPlan);
            if ((sendCachedUrl || qs.absetup === "expB") && "downloadURL" in updatedInfo) {
                updatedInfo.downloadURL = updatedInfo.downloadURL.replace("storagev2", "deltaPackage");
            }
            // if snake_case request? convert the response to the same
            const updateInfo = snakeCaseRequested ? keysToCamelOrSnake(updatedInfo) : updatedInfo;
            reply({ updateInfo });
        });
    };

    const handleReportDeployStatus = (request, reply) => {
        const action = request.url.pathname;
        logger.info(reqFields(request), `report deployment status request ${action}`);
        const snakeCaseRequested = /report_status/.test(action);
        // if snake_case request? convert to camelCase
        const payload = snakeCaseRequested ? keysToCamelOrSnake(request.payload) : request.payload;
        deployReportStatus(payload, ok(reply));
    };

    const handleReportDownloadStatus = (request, reply) => {
        const action = request.url.pathname;
        logger.info(reqFields(request), `report download status request ${action}`);
        const snakeCaseRequested = /report_status/.test(action);
        // if snake_case request? convert to camelCase
        const payload = snakeCaseRequested ? keysToCamelOrSnake(request.payload) : request.payload;
        downloadReportStatus(payload, ok(reply));
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
                        reply(content)
                            .type("application/octet-stream")
                            .bytes(length);
                    });
                },
                tags: ["api"]
            }
        },
        {
            path: "/deltaPackage/{packageHash}",
            method: "GET",
            config: {
                auth: false,
                handler(request, reply) {
                    logger.info(reqFields(request), "download request");
                    download(request.params.packageHash, (e, o) => {
                        if (e) return reply(e);
                        const { content, length } = o;
                        reply(content)
                            .header("Cache-Control", "s-maxage=31536000, max-age=0")
                            .type("application/octet-stream")
                            .bytes(length);
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
                handler: handleReportDeployStatus,
                tags: ["api"]
            }
        },
        {
            path: "/report_status/deploy",
            method: "POST",
            config: {
                auth: false,
                handler: handleReportDeployStatus,
                tags: ["api"]
            }
        },
        {
            path: "/reportStatus/download",
            method: "POST",
            config: {
                auth: false,
                handler: handleReportDownloadStatus,
                tags: ["api"]
            }
        },
        {
            path: "/report_status/download",
            method: "POST",
            config: {
                auth: false,
                handler: handleReportDownloadStatus,
                tags: ["api"]
            }
        }
    ]);
});

export default { register };
