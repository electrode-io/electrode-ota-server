const diregister = require('../diregister');
const {shasum} = require('../util');
/**
 * The fileservice is meant to be plugable.
 *
 * By default we stick it into cassandra.  This is less than optimal,
 * but will work for some circumstances. You would probable want to
 * use a storage provider for this stuff.
 *
 */
module.exports.register = diregister({
    name: "ota!fileservice",
    multiple: false,
    connections: false,
    dependencies: ['ota!dao']
}, ({downloadUrl}, dao)=> {
    downloadUrl = downloadUrl.replace((/\/+?$/, ''));
    return (file) => {
        const packageHash = shasum(file);
        return dao.upload(packageHash, file).then(()=> ({
            packageHash,
            size: file.length,
            blobUrl: `${downloadUrl}/${packageHash}`
        }));
    };
});
