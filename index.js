#!/usr/bin/env node

const chalk = require('chalk');
const inquirer = require('inquirer');
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

const printBanner = require('./lib/banner');
const { buildQuestions, resolvedVersion } = require('./lib/questions');
const { fetchVersions } = require('./lib/versions');
const { download } = require('./lib/download');
const { extract } = require('./lib/extract');

async function main() {
    printBanner();

    const versions = await fetchVersions();

    if (!versions) {
        console.log(chalk.yellow('Could not fetch the list of available versions, the version will need to be typed manually.'));
    }

    const answers = await inquirer.prompt(buildQuestions(versions));
    answers.version = resolvedVersion(answers);

    if (!answers.confirm) {
        console.log(chalk.yellow('Download cancelled.'));
        return;
    }

    const filename = await download(answers);

    if (answers.extract) {
        await extract(filename);
    }
}

main();
