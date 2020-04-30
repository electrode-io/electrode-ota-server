/* eslint-disable max-params */
// should I send Cached URL in ther response?
const shouldSendCachedUrl = (id, plan) => {
    if (id && plan && typeof plan === "string") {
        const bucket = plan.toLowerCase();
        const lastChar = id.substr(-1).toLowerCase();
        // Unique Client ID is of HexaDecimal chars
        //  the plan will have the chars from 0-F
        //   if the last character of the id is present in the plan, send the cached url
        //  eg: plan: "35cf", id: "c407bdf6613d0b85" / "2ABCBCA1-BF1D-4831-9D5F-C4107BFB9B6E"
        //  the former id gets the cached url and the latter gets non-cadched url
        //  also, if the plan is "*"/"all" all the requests get cached url
        const toAll = (bucket === "*" || bucket === "all");
        return toAll || bucket.indexOf(lastChar) >= 0;
    }
    //default
    return false;
};

// buildUrl for a/b test
// default is Experiment-A(expA) => Non-cached dowload URL
// Experiment-B(expB) => Cached dowload URL (/deltaPackage)
// Also checks for cdnRampUp from CCM to switch url
const buildUrl = (dUrl, id, plan, absetup) => {
    const sendCachedUrl = shouldSendCachedUrl(id, plan);
    if ((sendCachedUrl || absetup === "expB") && dUrl) {
        return dUrl.replace("storagev2", "deltaPackage");
    }
    return dUrl;
};

export {
    buildUrl,
    shouldSendCachedUrl
};
