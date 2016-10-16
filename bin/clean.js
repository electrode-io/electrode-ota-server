const AccountManager = require('code-push/script/management-sdk');
const {env} = process;
//setup for wm-server testing.
//const updateServerUrl = 'http://localhost:9001';
//const am = new AccountManager('XiciZqpBzsagXpsVVrWAxzvmjrxaWHFccZgGczeN', {}, 'http://localhost:9001', proxy);

//setup form ms-server testing/

//BHd3OV1DL9DLjCHIBeUZkQQLcYef4yecGHaB-    speajus
//c65FIa5miVV5TZjG0YCW3NnbXPFZEyi8xQMDZ  speajus2


const updateServerUrl = ('CP_SERVER_URL' in env) ? env.CP_SERVER_URL : 'http://localhost:9001';
const accessKey = env.CP_ACCESS_KEY || 'XiciZqpBzsagXpsVVrWAxzvmjrxaWHFccZgGczeN';
const proxy = env.CP_HTTP_PROXY || 'http://localhost:8888';


const am = new AccountManager(accessKey, {}, updateServerUrl === 'https://codepush.azurewebsites.net' ? void(0) : updateServerUrl, proxy);


am.getApps()
    .then((apps)=>
        apps.filter(a=>/-146/.test(a.name)))
    .then(apps=>
        Promise.all(apps.map(a=>
            am.removeApp(a.name)
        ))
    ).then(()=>process.exit(0), (e)=> {

    console.log("ERROR: ", e);
    process.exit(1)
});
