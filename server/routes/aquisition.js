"use strict";
const {wrap} = require('../util');
const diregister = require('../diregister');
const noContent = (reply)=>(e)=> {
    if (e) return reply(e);
    reply().code(204);
};
const ok = (reply)=>(e)=>{
    if (e) return reply(e);
    reply('OK').code(200);
};

const register = diregister({
    name: 'aquisitionRoute',
    dependencies: ['electrode:route', 'ota!app']
}, (options, route, app)=> {
    const {
        download,
        updateCheck,
        downloadReportStatus,
        deployReportStatus

    } = wrap(app);

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
