/* eslint-disable max-params */

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
        const snakeCaseRequested = /update_check/.test(action);
        // if snake_case request? convert to camelCase
        const qs = snakeCaseRequested ? keysToCamelOrSnake(request.query) : request.query;
        const packsProtected = ccm("packsProtected");
        const isRequestDisabled = isProtected(qs.deploymentKey, packsProtected);
        if (/auth\/updateCheck/.test(action) && isRequestDisabled) {
            return reply().code(401);
        }
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
            const updateInfo = snakeCaseRequested ? keysToCamelOrSnake(updatedInfo) : updatedInfo;
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
