/* eslint-disable max-params */
import { missingParameter, notAuthorized } from "electrode-ota-server-errors";
import { reqFields } from "electrode-ota-server-util";
import keysToCamelOrSnake from "./keys-to-camel-or-snake";
import * as abTest from "./ab-test";
import isProtected from "./is-protected";

const HTTP_OK = 200;
const ok = reply => e => {
    if (e) return reply(e);
    reply("OK").code(HTTP_OK);
};

const handles = {
    updateCheck(request, reply, logger, ccm, acquisitionUpdateCheck) {
        const action = request.url.pathname;
        logger.info(reqFields(request), `${action} request`);
        const snakeCaseParams = /deployment_key/.test(request.url.path);
        // if snake_case requested? convert to camelCase
        const qs = snakeCaseParams ? keysToCamelOrSnake(request.query) : request.query;
        // validate query-parameters
        missingParameter(qs.deploymentKey, `Deployment key missing`);
        missingParameter(qs.appVersion, `appVersion missing`);
        // retrieve the protected packages list
        const packsProtected = ccm("packsProtected");
        const isProtectedPack = isProtected(qs.deploymentKey, packsProtected);
        // is the request for external api?
        //  and is the requested package protected? then throw exception
        if (/^(\/updateCheck|\/v0.1\/public\/codepush\/update_check)/.test(action) && isProtectedPack) {
            notAuthorized(null, "Unauthorized");
        }
        // invoke acquisition model updateCheck
        acquisitionUpdateCheck(qs, (e, updatedInfo) => {
            if (e) {
                console.log("error making update check ", request.query, e.message);
                return reply(e);
            }
            const rampUpPlan = ccm("cdnRampUp");
            if ("downloadURL" in updatedInfo) {
                updatedInfo.downloadURL = abTest.buildUrl(updatedInfo.downloadURL, qs.clientUniqueId, rampUpPlan, qs.absetup);
            }
            // if snake_case request? convert the response to the same
            const updateInfo = snakeCaseParams ? keysToCamelOrSnake(updatedInfo) : updatedInfo;
            reply({ updateInfo });
        });
    },

    justDownload(request, reply, logger, download) {
        logger.info(reqFields(request), "download request");
        download(request.params.packageHash, (e, o) => {
            if (e) return reply(e);
            const { content, length } = o;
            reply(content)
                .type("application/octet-stream")
                .bytes(length);
        });
    },

    cachedDownload(request, reply, logger, download) {
        logger.info(reqFields(request), "download request");
        download(request.params.packageHash, (e, o) => {
            if (e) return reply(e);
            const { content, length } = o;
            reply(content)
                .header("Cache-Control", "s-maxage=31536000, max-age=31536000")
                .header("Vary", "Accept-Encoding")
                .type("application/octet-stream")
                .bytes(length);
        });
    },

    reportDeployStatus(request, reply, logger, deployReportStatus) {
        const action = request.url.pathname;
        logger.info(reqFields(request), `report deployment status request ${action}`);
        const snakeCaseRequested = /report_status/.test(action);
        // if snake_case request? convert to camelCase
        const payload = snakeCaseRequested ? keysToCamelOrSnake(request.payload) : request.payload;
        deployReportStatus(payload, ok(reply));
    },

    reportDownloadStatus(request, reply, logger, downloadReportStatus) {
        const action = request.url.pathname;
        logger.info(reqFields(request), `report download status request ${action}`);
        const snakeCaseRequested = /report_status/.test(action);
        // if snake_case request? convert to camelCase
        const payload = snakeCaseRequested ? keysToCamelOrSnake(request.payload) : request.payload;
        downloadReportStatus(payload, ok(reply));
    }
};

export default handles;
