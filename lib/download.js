const fs = require('fs');
const chalk = require('chalk');
const axios = require('axios');
const CLI = require('clui');

const downloadStatus = new CLI.Spinner('Downloading...  ');

// Numeric comparison of dotted version strings ("7.10.0" > "7.9.3").
function compareVersions(a, b) {
    const pa = a.split('.').map((part) => parseInt(part, 10) || 0);
    const pb = b.split('.').map((part) => parseInt(part, 10) || 0);

    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        if ((pa[i] || 0) !== (pb[i] || 0)) {
            return (pa[i] || 0) - (pb[i] || 0);
        }
    }

    return 0;
}

function buildFilename(product, arch, version) {
    // Legacy naming schemes (e.g. Topbeat .deb packages) define the whole
    // filename themselves.
    if (arch.filename) {
        return arch.filename(product.slug, version);
    }

    // Platform independent artifacts, and products which did not embed the
    // architecture in the filename before a given version (e.g. Elasticsearch
    // before 7.0.0, Logstash before 7.10.0).
    const withoutArch = !arch.suffix
        || (product.noArchBefore && compareVersions(version, product.noArchBefore) < 0);

    if (withoutArch) {
        return `${product.slug}-${version}.${arch.ext}`;
    }

    return `${product.slug}-${version}-${arch.suffix}.${arch.ext}`;
}

// True when the noArchBefore rule will drop an architecture-specific
// selection: such versions ship a single generic package, so the selected
// architecture does not apply and the user should be told.
function isLegacyNoArch(product, arch, version) {
    return Boolean(
        product.noArchBefore
        && arch.suffix
        && compareVersions(version, product.noArchBefore) < 0
    );
}

function buildUrl(product, filename) {
    const base = product.baseUrl || `https://artifacts.elastic.co/downloads/${product.path}`;
    return `${base}/${filename}`;
}

async function download(answers) {
    const filename = buildFilename(answers.product, answers.arch, answers.version);
    const url = buildUrl(answers.product, filename);

    // Reject instead of exiting: the file might also be a leftover partial
    // archive from an interrupted run, so this is not a successful retry.
    if (fs.existsSync(filename)) {
        throw new Error(`File already exists! Abort. (${filename})`);
    }

    console.log(chalk.yellow(`File will be downloaded from ${url}`));

    downloadStatus.start();

    let response;

    try {
        response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
    } catch (err) {
        downloadStatus.stop();

        // The unconsumed error response stream would keep the event loop
        // (and therefore the process) alive.
        if (err.response && err.response.data && typeof err.response.data.destroy === 'function') {
            err.response.data.destroy();
        }

        // Propagate instead of exiting so callers (and scripts relying on
        // the exit code) can detect that nothing was downloaded.
        if (err.response && err.response.status === 404) {
            throw new Error('File not found :/');
        }

        // Anything else (timeout, DNS failure, connection reset, other HTTP
        // status) is not a missing artifact: surface the actual cause.
        const reason = err.response ? `HTTP ${err.response.status}` : (err.code || err.message);
        throw new Error(`Download failed (${reason}) :/`);
    }

    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);

    // pipe() does not forward source errors: a connection dropped mid
    // download must reject through the writer error path below.
    response.data.on('error', (err) => writer.destroy(err));

    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            downloadStatus.stop();
            process.stdout.write('\n');
            console.log(chalk.green("Download completed! :)"));
            resolve(filename);
        });
        writer.on('error', (err) => {
            downloadStatus.stop();
            process.stdout.write('\n');
            console.log(chalk.red("Download failed :/"));
            // A local write failure (e.g. full disk) only unpipes: destroy
            // the response stream too, or the HTTP socket would stay open.
            response.data.destroy();
            // Best effort removal of the partial archive, so a retry does
            // not abort on "File already exists".
            fs.unlink(filename, () => reject(err));
        });
    });
}

module.exports = { compareVersions, buildFilename, buildUrl, isLegacyNoArch, download };
