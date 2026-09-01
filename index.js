#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const inquirer = require('inquirer');
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

const printBanner = require('./lib/banner');
const { parseArgs } = require('./lib/cli');
const { buildQuestions, resolvedVersion } = require('./lib/questions');
const { fetchVersions } = require('./lib/versions');
const { download } = require('./lib/download');
const { extract, isExtractable } = require('./lib/extract');

async function main() {
    const preset = parseArgs(process.argv);

    printBanner();

    // The version list is only needed when the version will be prompted.
    let versions = null;

    if (preset.version === undefined) {
        versions = await fetchVersions();

        // An empty list means the endpoints answered but provided nothing
        // usable, which is just as unusable as a failed fetch.
        if (!versions || versions.length === 0) {
            console.log(chalk.yellow('Could not fetch the list of available versions, the version will need to be typed manually.'));
        }
    }

    const answers = await inquirer.prompt(buildQuestions(versions), preset);
    answers.version = resolvedVersion(answers);

    if (!answers.confirm) {
        console.log(chalk.yellow('Download cancelled.'));
        return;
    }

    const filename = await download(answers);

    if (answers.extract && isExtractable(answers.arch)) {
        await extract(filename);

        if (answers.deleteArchive) {
            fs.unlinkSync(filename);
            console.log(chalk.green(`Archive ${filename} deleted!`));
        }
    }
}

main().catch((err) => {
    console.error(chalk.red(err.message || String(err)));
    process.exitCode = 1;
});
