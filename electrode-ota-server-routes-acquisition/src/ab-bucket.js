const TENTH = 10;
const LAST_BUCKET = 100;
const HALF_DIVIDER = 2;
// "a" starts with the code 97
//  hence using 96 to get actual alphabet position
const MOD_CHAR = 96;

// AB testing bucket
const abBucket = (id, plan) => {
    const lastChar = id.substr(-1);
    const result = {
        bucket: 10,
        cached: false
    };
    if (!isNaN(lastChar)) {
        result.bucket = parseInt(lastChar) * TENTH;
    } else {
        const calculatedBucket = (Math.ceil((lastChar.toLowerCase().charCodeAt() % MOD_CHAR) / HALF_DIVIDER) * TENTH);
        result.bucket = calculatedBucket > LAST_BUCKET ? LAST_BUCKET : calculatedBucket;
    }
    result.cached = parseInt(plan) === result.bucket;
    return result;
};

export default abBucket;
