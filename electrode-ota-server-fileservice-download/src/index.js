import diregister from "electrode-ota-server-diregister";

/**
 * The fileservice is meant to be plugable.
 *
 * By default we stick it into cassandra.  This is less than optimal,
 * but will work for some circumstances. You would probable want to
 * use a storage provider for this stuff.
 *
 */

export const fileservice = (options, dao) => {
    return (packageHash, url, type) => {
        const hash = packageHash || url.split("/").pop();
        const p = dao.download(hash);

        return p.then(resp => {
            console.log("resp-len: ", resp.length, " | type: ", type);
            if (type === "application/json") {
                return {
                    content: JSON.parse(`${resp }`),
                    length: resp.length
                };
            } else {
                return {
                    content: resp,
                    length: resp.length
                };
            }
        });
    };
};
export const register = diregister({
    name: "ota!fileservice-download",
    multiple: false,
    connections: false,
    dependencies: ["ota!dao"]
}, fileservice);
