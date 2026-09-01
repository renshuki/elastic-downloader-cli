const fs = require('fs');
const chalk = require('chalk');
const axios = require('axios');
const CLI = require('clui');

const downloadStatus = new CLI.Spinner('Downloading...  ');

function majorVersion(version) {
    return parseInt(version.split('.').shift(), 10);
}

// Downloads prior to 7.0.0 do not include the architecture in the filename.
function buildFilename(product, arch, version) {
    if (majorVersion(version) < 7) {
        return `${product.slug}-${version}.${arch.ext}`;
    }

    return `${product.slug}-${version}-${arch.suffix}.${arch.ext}`;
}

function buildUrl(product, filename) {
    return `https://artifacts.elastic.co/downloads/${product.path}/${filename}`;
}

async function download(answers) {
    const filename = buildFilename(answers.product, answers.arch, answers.version);
    const url = buildUrl(answers.product, filename);

    if (fs.existsSync(filename)) {
        console.log(chalk.red('File already exists! Abort.'));
        process.exit(0);
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
    } catch {
        downloadStatus.stop();
        console.log(chalk.red("File not found :/"));
        process.exit(0);
    }

    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);

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
            reject(err);
        });
    });
}

module.exports = { buildFilename, buildUrl, download };
