const chalk = require('chalk');
const CLI = require('clui');
const tar = require('tar');
const extractZip = require('extract-zip');

const extractStatus = new CLI.Spinner('Extracting...  ');

// Only archives can be extracted; .deb, .rpm and .msi packages are meant to
// be installed with the system package manager.
const EXTRACTABLE_EXTENSIONS = ['tar.gz', 'tgz', 'zip'];

function isExtractable(arch) {
    return EXTRACTABLE_EXTENSIONS.includes(arch.ext);
}

async function extract(filename) {
    extractStatus.start();

    try {
        if (filename.endsWith('.zip')) {
            await extractZip(filename, { dir: process.cwd() });
        } else {
            await tar.x({ file: filename });
        }
    } catch (err) {
        extractStatus.stop();
        console.log(chalk.red('Extraction failed :/'));
        throw err;
    }

    extractStatus.stop();
    console.log(chalk.green('Archive extracted! :)'));
}

module.exports = { isExtractable, extract };
