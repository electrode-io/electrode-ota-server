/* eslint-disable max-params */
import { wrap } from "electrode-ota-server-util";
import handles from "./handlers";

export default (options, route, acquisition, logger, ccm) => {
    const { download, updateCheck: acquisitionUpdateCheck, downloadReportStatus, deployReportStatus } = wrap(acquisition);
    route([
        {
            method: "GET",
            path: "/updateCheck",
            config: {
                auth: false,
                handler(request, reply) {
                    handles.updateCheck(request, reply, logger, ccm, acquisitionUpdateCheck);
                },
                tags: ["api"]
            }
        },
        {
            method: "GET",
            path: "/v0.1/public/codepush/update_check",
            config: {
                auth: false,
                handler(request, reply) {
                    handles.updateCheck(request, reply, logger, ccm, acquisitionUpdateCheck);
                },
                tags: ["api"]
            }
        },
        {
            method: "GET",
            path: "/auth/updateCheck",
            config: {
                handler(request, reply) {
                    handles.updateCheck(request, reply, logger, ccm, acquisitionUpdateCheck);
                },
                tags: ["api"]
            }
        },
        {
            path: "/storagev2/{packageHash}",
            method: "GET",
            config: {
                auth: false,
                handler(request, reply) {
                    handles.justDownload(request, reply, logger, download);
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
                    handles.cachedDownload(request, reply, logger, download);
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
                    handles.reportDeployStatus(request, reply, logger, deployReportStatus);
                },
                tags: ["api"]
            }
        },
        {
            path: "/v0.1/public/codepush/report_status/deploy",
            method: "POST",
            config: {
                auth: false,
                handler(request, reply) {
                    handles.reportDeployStatus(request, reply, logger, deployReportStatus);
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
                    handles.reportDownloadStatus(request, reply, logger, downloadReportStatus);
                },
                tags: ["api"]
            }
        },
        {
            path: "/v0.1/public/codepush/report_status/download",
            method: "POST",
            config: {
                auth: false,
                handler(request, reply) {
                    handles.reportDownloadStatus(request, reply, logger, downloadReportStatus);
                },
                tags: ["api"]
            }
        }
    ]);
};
