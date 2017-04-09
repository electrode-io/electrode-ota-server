"use strict";
import {wrap} from '../util';
import diregister from '../diregister';
const noContent = (reply)=>(e)=> {
    if (e) return reply(e);
    reply().code(204);
};
const ok = (reply)=>(e)=>{
    if (e) return reply(e);
    reply('OK').code(200);
};

const register = diregister({
    name: 'acquisitionRoute',
    dependencies: ['electrode:route', 'ota!acquisition']
}, (options, route, acquisition)=> {
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
                    updateCheck(request.query, (e, updateInfo)=> {
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
                    download(request.params.packageHash, (e, o)=> {
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
                    downloadReportStatus(request.payload, ok(reply));
                }
            }
        }
    ]);
});

module.exports = {register};
