import diregister from "electrode-ota-server-diregister";
import { shasum } from "electrode-ota-server-util";
/**
 * The fileservice is meant to be plugable.
 *
 * By default we stick it into cassandra.  This is less than optimal,
 * but will work for some circumstances. You would probable want to
 * use a storage provider for this stuff.
 *
 */
export const fileservice = ({downloadUrl}, dao) => {
    downloadUrl = downloadUrl && downloadUrl.replace(/\/+?$/, "");
    return (file, packageHash = null) => {
        if (packageHash === null) {
            packageHash = shasum(file);
        }
        const blobObj = {
            packageHash,
            size: file.length,
            blobUrl: downloadUrl ? `${downloadUrl}/${packageHash}` : packageHash
        };
        return dao.download(packageHash).then(() => blobObj, () => {
            return dao.upload(packageHash, file).then(() => blobObj, err => {
                console.log("upload error", err);
                throw err;
            });
        });
    };
};

export const register = diregister({
    name: "ota!fileservice-upload",
    multiple: false,
    connections: false,
    dependencies: ["ota!dao"]
}, fileservice);

