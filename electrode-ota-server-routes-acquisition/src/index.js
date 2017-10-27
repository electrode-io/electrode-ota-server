import {wrap} from 'electrode-ota-server-util';
import diregister from "electrode-ota-server-diregister";
const noContent = (reply) => (e) => {
    if (e) return reply(e);
    reply().code(204);
};
const ok = (reply) => (e) => {
    if (e) return reply(e);
    reply('OK').code(200);
};

export const register = diregister({
    name: 'acquisitionRoute',
    dependencies: ['electrode:route', 'ota!acquisition', 'ota!logger']
}, (options, route, acquisition, logger) => {
    const {
        download,
        updateCheck,
        downloadReportStatus,
        deployReportStatus

    } = wrap(acquisition);

    route([

        {
            method: "GET",
            path: "/updateCheck",
            config: {
                auth: false,
                handler(request, reply)
                {
                    logger.info({ req: request }, "updateCheck request");
                    updateCheck(request.query, (e, updateInfo) => {
                        if (e) {
                            console.log('error making update check ', request.query, e.message);
                            return reply(e);
                        }
                        reply({updateInfo});
                    });
                }
            }
        },
        {
            path: '/storagev2/{packageHash}',
            method: "GET",
            config: {
                auth: false,
                handler(request, reply){
                    logger.info({ req: request }, "download request");
                    download(request.params.packageHash, (e, o) => {
                        if (e) return reply(e);
                        reply(o);
                    })
                }
            }
        },
        {
            path: '/reportStatus/deploy',
            method: 'POST',
            config: {
                auth: false,
                handler(request, reply){
                    logger.info({ req: request }, "report deployment status request");
                    deployReportStatus(request.payload, ok(reply));
                }
            }
        },
        {
            path: '/reportStatus/download',
            method: 'POST',
            config: {
                auth: false,
                handler(request, reply){
                    logger.info({ req: request }, "report download status request");
                    downloadReportStatus(request.payload, ok(reply));
                }
            }
        }
    ]);
});

export default {register};
