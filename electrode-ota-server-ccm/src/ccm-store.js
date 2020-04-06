// includes
import requestValue from "@walmart/store-services-node-ccm-client";

const ONE_MIN = 60000;

//CCM Store
class CCMStore {
    constructor(options) {
        /* options {
            ccm: { url: 'http://scm.stg.walmart.com', env: 'QA' };
            serviceName: 'getting-started';
            environment: 'QA | DEV';
            cloudEnvironment: 'stg-dfw2 | dev';
        }*/
        this._options = options || {};
        this._cache = {};
    }

    getConfig(key) {
        // key: 'disableServerRenderingConfig'
        if (key) {
            return this._cache[key];
        }
        return undefined;
    }

    async req() {
        const configs = await requestValue(this._options);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(configs));
    }

    refresh() {
        setInterval(async () => await this.req, ONE_MIN);
    }
}

export default CCMStore;
