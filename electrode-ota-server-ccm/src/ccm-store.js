// includes
const { fetchJSON } = require("@walmart/electrode-fetch");

// 2(Min)*60(Sec)*1000(MilliSec)
const FREQ_TIME = 120000;
const STATUS_OK = "OK";

//CCM Store
class CCMStore {
    constructor(options) {
        // init defaults
        this._options = options || {};
        this._cache = {};
        // build url
        const ccmKey = options.ccmKey || "";
        this.url = `${options.host}/scm-app/v2/services/${options.serviceName}/scopes/${options.env}/${options.cloudEnv}/configs/${ccmKey}`;
        // start refreshing the cache
        this.refresh();
    }

    getConfig(key) {
        if (key && this._cache[key]) {
            return this._cache[key];
        }
        return this._cache;
    }

    async req() {
        //Ref: https://gecgithub01.walmart.com/electrode-client/electrode-ccm-client/blob/master/lib/ccm-client.js#L152
        const headers = {
            "WM_SEC.AUTH_TOKEN": "6KASDKKA-6JJS-6583-H435-8935JSDK4924"
        };
        try {
            const { payload, status } = await fetchJSON(this.url, { headers });
            if (status === STATUS_OK) {
                Object.assign(this._cache, payload.configuration.properties);
            } else {
                console.log(`status: ${status}`, JSON.stringify(payload));
            }
        } catch (error) {
            console.log(error);
        }
    }

    async refresh() {
        if (!Object.keys(this._cache).length) {
            await this.req();
        }
        this._timer = setInterval(this.req.bind(this), FREQ_TIME);
    }

    flush() {
        clearInterval(this._timer);
    }
}

module.exports = CCMStore;
