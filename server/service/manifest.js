import path from 'path';
import yauzl from 'yauzl';
import yazl from 'yazl';
import crypto from 'crypto';
const MTIME = new Date(0);
const all = (arr, fn)=>Promise.all(arr.map(fn));
import fileType from 'file-type';

const isZip = (fileName, content)=> {
    if (typeof content === 'string') {
        content = new Buffer(content);
    }
    const type = fileType(content);
    return (type && type.mime === 'application/zip');
};

const toBuf = stream => new Promise((resolve, reject)=> {
    const bufs = [];
    stream.on('data', function (d) {
        bufs.push(d);
    });
    stream.on('error', reject);
    stream.on('end', function () {
        resolve(Buffer.concat(bufs));
    });
});
const zipToBuf = zip=> toBuf(zip.outputStream);
const streamHash = (stream, hashType = 'sha256', digestType = 'hex')=> {
    return new Promise(function (resolve, reject) {
        const hash = crypto.createHash(hashType);

        stream.on('data', function (data) {
            hash.update(data)
        });
        stream.on('error', reject);
        stream.on('end', function () {
            resolve(hash.digest(digestType)); // 34f7a3113803f8ed3b8fd7ce5656ebec
        });
    });
};
const generate = (buffer)=> new Promise(function (resolve, reject) {
    if (buffer instanceof Uint8Array) {
        buffer = Buffer.from(buffer);
    }
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
const delta = (manifest, buffer)=> {
    if (buffer instanceof Uint8Array) {
        buffer = Buffer.from(buffer);
    }
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


/**
 * For the current history, descend backwards generating, a manifestBlobUrl
 * and the appropriate download exampels.
 *
 * @param download
 * @param upload
 * @param current
 * @param histories
 */

const downloadOrGenerateManifest = (download, upload, current)=> {
    if (current.manifestBlobUrl) {
        return download(null, current.manifestBlobUrl, 'application/json');
    }
    return download(current.packageHash, current.blobUrl)
        .then(generate)
        .then((manifest)=> {
            return upload(JSON.stringify(manifest))
                .then(({blobUrl})=>current.manifestBlobUrl = blobUrl)
                .then(()=>manifest);
        });

};

const genDiffPackageMap = (download, upload, current, histories = [])=> {

    return downloadOrGenerateManifest(download, upload, current)
        .then(manifest=> {
            return all(histories, function genDiffPackageMap$all(history) {
                //For history in the histories, get its package,
                // and generate a delta between what was in it
                // and what the current one is.
                return download(history.packageHash, history.blobUrl)
                    .then(pkg=> delta(manifest, pkg))
                    .then(zipToBuf)
                    .then(upload)
                    .then(({blobUrl, size})=> {
                        const diffPackageMap = current.diffPackageMap || (current.diffPackageMap = {});
                        diffPackageMap[history.packageHash] = {url: blobUrl, size};
                    });
            });
        });
};


/**
 * Retro generates diffPackageMap
 * @param download - (packageHash, url) return blob;
 * @param upload - (file) returns {size,url}
 * @param history - (history array)
 * @returns {Promise.<[{history}>}
 */

const diffPackageMap = (download, upload, histories)=> {
    const promises = [];
    for (let i = histories.length - 1; i > -1; i--) {
        promises.push(genDiffPackageMap(download, upload, histories[i], histories.slice(0, i)));
    }
    return Promise.all(promises).then(()=>histories);
};

const diffPackageMapCurrent = (download, upload, current)=> {
    const last = current.length - 1;
    return genDiffPackageMap(download, upload, current[last], current.slice(0, last)).then(_=>current);
};

module.exports = {
    isZip,
    zipToBuf,
    diffPackageMapCurrent,
    diffPackageMap,
    generate,
    delta,
    streamHash
};
