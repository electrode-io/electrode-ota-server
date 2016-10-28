const path = require('path');
const yauzl = require('yauzl');
const yazl = require('yazl');

const crypto = require('crypto');

const streamHash = (stream, hashType = 'sha256', digestType = 'hex')=> {
    return new Promise(function (resolve, reject) {
        const hash = crypto.createHash(hashType);

        stream.on('data', function (data) {
            hash.update(data)
        });
        stream.on('error', reject);
        stream.on('end', function () {
            resolve(hash.digest(digestType)); // 34f7a3113803f8ed3b8fd7ce5656ebec
        })
    });
};
const generate = (buffer)=> new Promise(function (resolve, reject) {
    const method = typeof buffer === 'string' ? 'open' : buffer instanceof Buffer ? 'fromBuffer' : null;
    if (!method) {
        return Promise.reject(new Error('Unhandled type ' + buffer));
    }
    const manifest = {};
    yauzl[method](buffer, {lazyEntries: true}, function (err, zipfile) {
        if (err) return reject(err);
        zipfile.readEntry();
        zipfile.on("entry", function (entry) {
            if (/\/$/.test(entry.fileName)) {
                zipfile.readEntry();
                return
            }
            // file entry
            zipfile.openReadStream(entry, function (err, readStream) {
                if (err) throw err;
                streamHash(readStream).then(hash=> {
                    manifest[entry.fileName] = hash;
                    zipfile.readEntry();

                });
            });

        });
        zipfile.once("end", function () {
            zipfile.close();
            resolve(manifest);
        });
    });
});
const MTIME = new Date(0);
const delta = (manifest, buffer)=> {

    const method = typeof buffer === 'string' ? 'open' : buffer instanceof Buffer ? 'fromBuffer' : null;
    if (!method) {
        return Promise.reject(new Error('Unhandled type ' + buffer));
    }

    return new Promise((resolve, reject)=> {

        yauzl[method](buffer, {lazyEntries: true}, function (err, zipfile) {
            const seen = [];
            if (err) return reject(err);
            const retFile = new yazl.ZipFile();

            zipfile.readEntry();
            zipfile.on("entry", function (entry) {
                if (/\/$/.test(entry.fileName)) {
                    zipfile.readEntry();
                    return;
                }
                // file entry
                zipfile.openReadStream(entry, function (err, readStream) {
                    if (err) throw err;
                    streamHash(readStream).then(hash=> {
                        seen.push(entry.fileName);
                        if (hash !== manifest[entry.fileName]) {
                            zipfile.openReadStream(entry, (e, readFromStream)=> {
                                const mtime = entry.getLastModDate();
                                retFile.addReadStream(readFromStream, entry.fileName, {mtime});
                            });
                        }
                        zipfile.readEntry();
                    });
                });
            });

            zipfile.once("end", function () {
                const deletedFiles = Object.keys(manifest).filter(v=>seen.indexOf(v) == -1).sort();
                const jsonContent = JSON.stringify({deletedFiles});
                retFile.addBuffer(new Buffer(jsonContent), "hotcodepush.json", {mtime: MTIME});
                zipfile.close();
                retFile.end({}, (totalSize)=> {
                    resolve(retFile);
                });
            });
        });
    });
};

const all = (arr, fn)=>()=>Promise.all(arr.map(fn));

/**
 * For the current history, descend backwards generating, a manifestBlobUrl
 * and the appropriate download exampels.
 *
 * @param download
 * @param upload
 * @param current
 * @param histories
 */

const genDiffPackageMap = (download, upload, current, histories = [])=> download(current.packageHash, current.blobUrl)
    .then(generate)
    .then((manifest)=> {
        //scope manifest
        return upload(manifest)
            .then(({url})=>current.manifestBlobUrl = url)
            .then(all(histories, (history)=> {
                //For history in the history, get its package,
                // and generate a delta between what was in it
                // and what the current one is.
                return download(history.packageHash, history.blobUrl)
                    .then(pkg=> delta(manifest, pkg))
                    .then(upload).then(ret=> {
                        //{size,url}
                        const diffPackageMap = current.diffPackageMap || (current.diffPackageMap = {});
                        diffPackageMap[history.packageHash] = ret;
                    });
            }))
    });


/**
 *
 * @param download - (packageHash, url) return blob;
 * @param upload - (file) returns {size,url}
 * @param history - (history array)
 * @returns {Promise.<[{history}>}
 */

const diffPackageMap = (download, upload, history)=> {
    const promises = [];
    for (let i = history.length - 1; i > 0; i--) {
        promises.push(genDiffPackageMap(download, upload, history[i], history.slice(0, i)));
    }
    return Promise.all(promises).then(()=>history);
};

module.exports = {
    diffPackageMap,
    generate,
    delta,
    streamHash
};
