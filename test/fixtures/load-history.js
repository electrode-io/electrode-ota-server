const superagent = require('superagent');
const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');
const mkdirp = require('mkdirp');

function unzip(file, to) {
    to = path.join(__dirname, to);
    return new Promise(function (resolve, reject) {
        yauzl.open(file, {lazyEntries: true}, function (err, zipfile) {
            if (err) return reject(err);
            zipfile.readEntry();
            zipfile.on("entry", function (entry) {
                if (/\/$/.test(entry.fileName)) {
                    // directory file names end with '/'
                    mkdirp(path.join(to, entry.fileName), function (err) {
                        if (err) return reject(err);
                        zipfile.readEntry();
                    });
                } else {
                    // file entry
                    zipfile.openReadStream(entry, function (err, readStream) {
                        if (err) throw err;
                        // ensure parent directory exists
                        mkdirp(path.join(to, path.dirname(entry.fileName)), function (err) {
                            if (err) return reject(err);
                            readStream.pipe(fs.createWriteStream(path.join(to, entry.fileName)));
                            readStream.on("end", function () {
                                zipfile.readEntry();
                            });
                        });
                    });
                }
            });
            zipfile.once("end", function () {
                zipfile.close();
                resolve();
            });
        });
    })

}
function get(url, file) {
    return new Promise(function (resolve, reject) {
        var stream = fs.createWriteStream(path.join(__dirname, file));
        superagent.get(url).pipe(stream).on('close', function () {
            resolve();
        }).on('error', reject);
    });
}
function getUnzip(url, file) {
    const zip = `${file}.zip`
    return get(url, zip).then(()=>unzip(zip, file));
}

function resolveHistory(history) {
    return Promise.all(history.map(function (hist, i) {
        const diffPackageMap = hist.diffPackageMap || {};
        return Promise.all([
            get(hist.manifestBlobUrl, `step.${i}.manifest.json`),
            getUnzip(hist.blobUrl, `step.${i}.blob`)
        ].concat(Object.keys(diffPackageMap).map(function (key) {
            return getUnzip(diffPackageMap[key].url, `step.${i}.map.${key}`);
        })));
    }));
}
if (require.main === module){
    resolveHistory(require('./history.json').history);
}else{
    module.exports = resolveHistory;
}

