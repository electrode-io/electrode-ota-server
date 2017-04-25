import ManagementSDK from 'code-push';

const apiMap = {};

export default (host, token) => {
    const key = `${token}@${host}`;
    if (apiMap[key]) {
        return apiMap[key];
    }
    return (apiMap[key] = new ManagementSDK(token, {}, host));
};