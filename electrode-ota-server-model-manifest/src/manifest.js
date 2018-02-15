import yauzl from 'yauzl';
import yazl from 'yazl';
import crypto from 'crypto';
import fileType from 'file-type';
import _ from 'lodash';
import { Stream } from 'stream';

const MACOSX_DIR = "__MACOSX/";
const DS_STORE = ".DS_Store";
const CODEPUSH_METAFILE = ".codepushrelease";

const MTIME = new Date(0);
const all = (arr, fn)=>Promise.all(arr.map(fn));

const isIgnoredFile = (fn) => fn.startsWith(MACOSX_DIR)
    || fn === DS_STORE
    || fn.endsWith("/" + DS_STORE)
    || fn.endsWith("/")
    || fn === CODEPUSH_METAFILE
    || fn.endsWith("/" + CODEPUSH_METAFILE);

export const isZip = (fileName, content)=> {
    if (typeof content === 'string') {
        content = new Buffer(content);
    }
    const type = fileType(content);
    return (type && type.mime === 'application/zip');
};


export const toBuf = stream => new Promise((resolve, reject)=> {
    const bufs = [];
    stream.on('data', function (d) {
        bufs.push(d);
    });
    stream.on('error', reject);
    stream.on('end', function () {
        resolve(Buffer.concat(bufs));
    });
});

export const zipToBuf = zip=> toBuf(zip.outputStream);

export const streamHash = (stream, hashType = 'sha256', digestType = 'hex')=> {
    return new Promise(function (resolve, reject) {
        const hash = crypto.createHash(hashType);
        stream.on('data', function (data) {
            hash.update(data)
        });
        stream.on('error', (err) => {
            reject(err);
        });
        stream.on('end', function () {
            resolve(hash.digest(digestType)); // 34f7a3113803f8ed3b8fd7ce5656ebec
        });
    });
};

export const streamToBuf = (stream) => {
    if (stream instanceof Buffer) {
        return Promise.resolve(stream);
    }
    if (stream instanceof Uint8Array) {
        return Promise.resolve(Buffer.from(stream));
    }
    if (stream instanceof Stream) {
        return toBuf(stream);
    }
};

/**
 * Takes a manifest dictionary of { "filename1": "file1hash", "filename2":"file2hash" ...} and generates the hash according to CodePush
 * Convert to array, sort, and hash
 * hash = sha256([ "filename1:file1hash", "filename2:file2hash", ...])
 *
 * @param {dictionary of filename:hash} manifest
 * @returns hash
 */
export const manifestHash = (manifest) => {
    const manifestAsArray = _.map(manifest, (hash, filename) => {
        return filename + ":" + hash;
    });
    const sorted = manifestAsArray.sort();
    const manifestAsString = JSON.stringify(sorted);
    const sha256 = crypto.createHash("sha256");
    sha256.update(manifestAsString);
    return sha256.digest("hex");
};

/**
 * Generates a manifest for the input buffer (zip file)
 *
 * Sample manifest file
 * {
 *    "file1": "hash_of_file_1_ABCDEF01234567890",
 *    "file2": "hash_of_file_2_ABCDEF01234567890"
 * }
 *
 * @param {input buffer} buffer
 */
export const generate = (buffer)=> new Promise(function (resolve, reject) {
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
            if (isIgnoredFile(entry.fileName)) {
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

/**
 * Given the manifest of the current install, and the next package (as zip file),
 * generate a diff package containing modified or new files.
 * Deleted files are added to `hotcodepush.json` file in resultant zip
 *
 * @param {dictionary of filename to hash} manifest : current install's manifest
 * @param {zipped file as buffer} buffer   : new package to check manifest against
 * @returns zip file of missing files, plus optional `hotcodepush.json` file
 */
export const delta = (manifest, buffer)=> {
    if (manifest instanceof Buffer) {
        manifest = JSON.parse(manifest.toString());
    }

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
            // this is to make react native code push work right
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
                    resolve({
                        zipFile : retFile
                    });
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


export const downloadOrGenerateManifest = (download, upload, current)=> {
    if (current.manifestBlobUrl) {
        return download(null, current.manifestBlobUrl, 'application/json');
    }
    return download(current.packageHash, current.blobUrl)
        .then(generate)
        .then((manifest)=> {
            return upload(JSON.stringify(manifest), manifestHash(manifest))
                .then(({blobUrl})=>current.manifestBlobUrl = blobUrl)
                .then(()=>manifest);
        });

};


export const genDiffPackageMap = (download, upload, current, histories = [])=> {
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
 * This function compares what the device has installed (based on what's in the table for given packageHash)
 * to the latest available package.  It calls delta() to figure out which files in the latest package zip are
 * different from what is in the manifest for the device-installed package.  It builds a new zip with
 * just the changed files and uses upload to save it.
 * 
 * @param {*} download injected class for downloading zips, manifests, and other blob content
 * @param {*} upload injected class for uploading zips, manifests, and other blob content
 * @param {*} latestPackage the newest package from the data store; what the device will upgrade to
 * @param {*} installedPackage the package installed on the device requesting an update
 */
export const generateDiffPackage = (download, upload, latestPackage, installedPackage) => {
    return downloadOrGenerateManifest(download, upload, installedPackage)
        .then((installedPkgManifest) => {
            return download(latestPackage.packageHash, latestPackage.blobUrl)
                .then((latestPkgContent) => streamToBuf(latestPkgContent))
                .then((latestPkgContent) => delta(installedPkgManifest, latestPkgContent))
                .then((deltaResults) => {
                    return zipToBuf(deltaResults.zipFile);
                })
                .then(upload)
                .then(({ blobUrl, size }) => {
                    const diffPackageMap = latestPackage.diffPackageMap || (latestPackage.diffPackageMap = {});
                    diffPackageMap[installedPackage.packageHash] = {
                        url : blobUrl,
                        size
                    };
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


export const diffPackageMap = (download, upload, histories)=> {
    const promises = [];
    for (let i = histories.length - 1; i > -1; i--) {
        promises.push(genDiffPackageMap(download, upload, histories[i], histories.slice(0, i)));
    }
    return Promise.all(promises).then(()=>histories);
};

export const diffPackageMapCurrent = (download, upload, current)=> {
    const last = current.length - 1;
    return generateDiffPackage(download, upload, current[last], current[0]).then(() => current);
};

export default ({
    isZip,
    zipToBuf,
    diffPackageMapCurrent,
    diffPackageMap,
    generate,
    delta,
    streamHash,
    manifestHash
});
