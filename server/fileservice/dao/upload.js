import diregister from '../../diregister';
import {shasum} from '../../util';
/**
 * The fileservice is meant to be plugable.
 *
 * By default we stick it into cassandra.  This is less than optimal,
 * but will work for some circumstances. You would probable want to
 * use a storage provider for this stuff.
 *
 */
const fileservice = ({downloadUrl}, dao)=> {
    downloadUrl = downloadUrl && downloadUrl.replace(/\/+?$/, '');
    return (file) => {
        const packageHash = shasum(file);
        return dao.upload(packageHash, file).then(()=> ({
            packageHash,
            size: file.length,
            blobUrl: downloadUrl ? `${downloadUrl}/${packageHash}` : packageHash
        }), (err)=>{
            console.log('upload error', err);
            throw err;
        });
    };
};
const register = diregister({
    name: "ota!fileservice-upload",
    multiple: false,
    connections: false,
    dependencies: ['ota!dao']
}, fileservice);

module.exports = {
    register,
    fileservice
};
