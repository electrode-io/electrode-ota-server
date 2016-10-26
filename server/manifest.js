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
    const manifest = {};
    yauzl.fromBuffer(buffer, {lazyEntries: true}, function (err, zipfile) {
        if (err) return reject(err);
        zipfile.readEntry();
        zipfile.on("entry", function (entry) {
            if (/\/$/.test(entry.fileName)) {
                zipfile.readEntry();
            } else {
                // file entry
                zipfile.openReadStream(entry, function (err, readStream) {
                    if (err) throw err;
                    streamHash(readStream).then(hash=> {
                        manifest[entry.fileName] = hash;
                        zipfile.readEntry();

                    });
                });
            }
        });
        zipfile.once("end", function () {
            zipfile.close();
            resolve(manifest);
        });
    });
});
const delta = (manfifest, buffer)=> {

    return new Promise((resolve, reject)=> {
        yauzl.fromBuffer(buffer, {lazyEntries: true}, function (err, zipfile) {
            if (err) return reject(err);
            const retFile = new yazl.ZipFile();

            zipfile.readEntry();
            zipfile.on("entry", function (entry) {
                if (/\/$/.test(entry.fileName)) {
                    zipfile.readEntry();
                } else {
                    // file entry
                    zipfile.openReadStream(entry, function (err, readStream) {
                        if (err) throw err;
                        streamHash(readStream).then(hash=> {
                            if (hash !== manfifest[entry.fileName]) {
                                zipfile.openReadStream(entry, (e, readFromStream)=> {
                                    retFile.addReadStream(readFromStream, entry.fileName, relativePath);
                                });

                            }
                            zipfile.readEntry();

                        });
                    });
                }
            });

            zipfile.once("end", function () {
                zipfile.close();
                retFile.end();
                resolve(retFile);
            });
        });
    });
};

module.exports = {
    generate,
    delta
};
