const child_process = require('child_process');
const tmp = require('tmp');
const cwd = process.cwd();
const path = require('path');

const sample = path.join.bind(path, __dirname, 'sample');
const rncp = path.join.bind(path, sample('react-native-code-push'));
const demo = path.join.bind(path, rncp('Examples', 'CodePushDemoApp'));
const rimraf = require('rimraf');
const spawn = require('child_process').spawn;
const plist = require('plist');
const fs = require('fs-extra');
const server = process.env.MS_CONFIG ? require('./support/server-ms') : require('./support/server-init');
const AccountManager = require('code-push/script/management-sdk');

function exec(cmd, ...args) {
    return new Promise((resolve, reject)=> {
        const c = spawn(cmd, args);
        c.stdout.on('data', function (data) {
            text += data;

            console.log(data + '');
        });
        let text = '';
        c.stderr.on('data', function (data) {
            console.log('stderr: ' + data.toString());
        });

        c.on('exit', function (code) {
            if (!code) return resolve(text);
            reject(new Error('child process exited with code ' + code))
        });
    });
}
function execEnvInCwd(addEnv, cwd, cmd, ...args) {
    const env = Object.assign({}, process.env, addEnv);

    return new Promise((resolve, reject)=> {
        const c = spawn(cmd, args, {env, cwd});
        c.stdout.on('data', function (data) {
            console.log('stdout: ' + data.toString());
        });
        let text = '';
        c.stderr.on('data', function (data) {
            console.log('stderr: ' + data.toString());
            text += data;
        });

        c.on('exit', function (code) {
            if (!code) return resolve(text);
            reject(new Error('child process exited with code ' + code))
        });
    });
}
function releaseReact(addEnv, cwd, cmd, ...args) {
    const env = Object.assign({}, process.env, addEnv);
    let bundle;
    return new Promise((resolve, reject)=> {
        const c = spawn(cmd, args, {env, cwd});

        c.stdout.on('data', function (data) {
            const str = data.toString();
            console.log(str);
            const parts = /bundle output to:\s*(.*\/main.jsbundle)/.exec(str);
            if (parts[1]) {
                bundle = parts[1];
            }
            //*argv	char *	"/Users/jspear1/Library/Developer/CoreSimulator/Devices/18AAFFC5-2FFD-45E8-A8A7-F3F047861138/data/Containers/Bundle/Application/44E48764-2D17-493E-976B-FCA4907DD8C8/CodePushDemoApp.app/CodePushDemoApp"	0x00007fff56ab78a0
            if (/Done writing bundle output/.test(str)) {
                fs.copySync(bundle, demo('ios', 'main.jsbundle'));
            }
        });
        let text = '';
        c.stderr.on('data', function (data) {
            console.log('stderr: ' + data.toString());
            text += data;
        });

        c.on('exit', function (code) {
            if (!code) return resolve(text);
            reject(new Error('child process exited with code ' + code))
        });
    });
}
function rmrf(path) {
    return new Promise((resolve, reject)=> {
        rimraf(path + '/*', function (e) {
            if (e) reject(e);
            resolve();
        })
    });
}
function iosUpdate(working_dir, name, CodePushServerURL, CodePushDeploymentKey) {
    const info = path.join(working_dir, 'ios', name, 'Info.plist');
    const obj = plist.parse(fs.readFileSync(info, {encoding: 'utf-8'}));

    if (CodePushDeploymentKey) {
        obj.CodePushDeploymentKey = CodePushDeploymentKey;
    }
    if (CodePushServerURL && CodePushServerURL != 'https://codepush.azurewebsites.net') {
        obj.CodePushServerURL = CodePushServerURL;
        if (/http:/.test(CodePushServerURL)) {
            const NSAppTransportSecurity = obj.NSAppTransportSecurity || ( obj.NSAppTransportSecurity = {} );
            const NSExceptionDomains = NSAppTransportSecurity.NSExceptionDomains || ( NSAppTransportSecurity.NSExceptionDomains = {});
            const hostname = /http:\/\/([^/]*).*/.exec(CodePushServerURL)[1];
            NSExceptionDomains[hostname] = {NSTemporaryExceptionAllowsInsecureHTTPLoads: true};
        }
    }
    const out = plist.build(obj);
    if (CodePushDeploymentKey || CodePushServerURL) {
        fs.renameSync(info, `${info}-${Date.now()}`);
        fs.writeFileSync(info, out, {encoding: 'utf-8'})
    }
    return Promise.resolve(out);
}
function execInDir(indir, cmd, ...args) {
    console.log(`running in ${indir}\n\t${cmd} ${args.join(' ')}\n`);
    const opwd = process.cwd();
    try {
        process.chdir(indir);
    } catch (e) {
        return Promise.reject(e);
    }
    return exec(cmd, ...args).then((ret)=> {
        process.chdir(opwd);
        return ret;
    }, (ret)=> {
        process.chdir(opwd);
    })
}
function runInXcodeTest() {
    return execInDir(demo('ios', 'CodePushDemoApp.xcodeproj'), 'xcodebuild', '-workspace', 'project.xcworkspace',
        '-scheme', 'CodePushDemoAppTests',
        '-sdk', 'iphonesimulator',
        '-destination', 'platform=iOS Simulator,name=iPhone 6s',
        'test'
    );
}
function checkIfInstallNeeded(repopath, url) {
    return new Promise((resolve, reject)=> {
        try {
            fs.lstatSync(repopath);
            return execInDir(repopath, 'git', 'remote', 'update').then(()=> execInDir(repopath, 'git', 'status', '-s', '-u', 'no').then(resp=> {
                if (!resp) {
                    //nothing has changed
                    return resolve(true);
                }

                return execInDir(repopath, 'git', 'reset', '--hard', 'origin/master').then(()=>resolve(false), reject);
            }), reject);
        } catch (e) {
            console.log('e', e);
            return execInDir(path.dirname(repopath), 'git', 'clone', url).then(()=> {
                resolve(false)
            }, reject);
        }
    });

}

describe.skip('end to end client test', function () {

    this.timeout(300000);
    let am;
    let agent;
    let updateServerUrl;
    let collaborator;
    let extraCollaborator;
    let aquistionServerUrl;
    let stop;
    const proxy = process.env.CP_HTTP_PROXY || 'http://localhost:8888';

    before(()=>server().then((setup)=> {
        updateServerUrl = setup.serverUrl;
        aquistionServerUrl = setup.aquistionServerUrl || '';
        accessKey = setup.accessKey;
        collaborator = setup.collaborator;
        extraCollaborator = setup.extraCollaborator;
        agent = setup.agent;
        am = new AccountManager(setup.accessKey, {}, setup.serverUrl);
        stop = setup.stop;
    }).then(()=>checkIfInstallNeeded(rncp(), 'https://github.com/Microsoft/react-native-code-push.git')
        .then((resp)=>resp ? null : execInDir(demo(), 'npm', 'install'))));

    after(()=> {
        return stop && stop();
    });


    it('should download install configure and upload an react-native app', function (done) {
        this.timeout(300000);
        tmp.dir(function (err, LOCALAPPDATA, cleanupCallback) {


            execEnvInCwd({LOCALAPPDATA}, demo(), 'code-push', 'login', '--accessKey', accessKey).then(()=> {
                const appname = path.basename(LOCALAPPDATA);
                return am.addApp(appname).then(()=> am.getDeployment(appname, 'Staging')).then((deployment)=> {
                    iosUpdate(demo(), 'CodePushDemoApp', aquistionServerUrl, deployment.key);
                    iosUpdate(demo(), 'CodePushDemoAppTests', aquistionServerUrl, deployment.key);
                    return releaseReact({LOCALAPPDATA}, demo(), 'code-push', 'release-react', appname, 'ios', '--deploymentName', 'Staging');
                })
                    //.then(runInXcodeTest)
                    .then(()=> {
                        try {
                            fs.unlinkSync(path.join(LOCALAPPDATA, '.code-push.config'))
                        } catch (e) {
                        }
                        cleanupCallback();
                        done();
                    });


            }, (e)=> {
                cleanupCallback();
                done(e);

            });
        });

    })
});

