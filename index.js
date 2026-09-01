#!/usr/bin/env node

import fs from 'node:fs';
import chalk from 'chalk';

import printBanner from './lib/banner.js';
import { parseArgs } from './lib/cli.js';
import { askAnswers } from './lib/questions.js';
import { fetchVersions } from './lib/versions.js';
import { download, isLegacyNoArch } from './lib/download.js';
import { extract, isExtractable } from './lib/extract.js';

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

    const answers = await askAnswers(preset, versions);

    // The interactive confirmation prompt carries this caveat itself, but a
    // scripted run (--yes) skips the prompt, so the notice must be printed.
    if (preset.confirm && isLegacyNoArch(answers.product, answers.arch, answers.version)) {
        console.log(chalk.yellow(`${answers.product.name} versions before ${answers.product.noArchBefore} ship a single platform independent package; the "${answers.arch.name}" selection will not apply.`));
    }

    // Covers --extract combined with an interactively selected package type:
    // the flag cannot be validated upfront when the architecture is only
    // known after the prompt.
    if (answers.extract && !isExtractable(answers.arch)) {
        console.log(chalk.yellow(`.${answers.arch.ext} packages cannot be extracted, --extract will be ignored.`));
        answers.extract = false;
    }

    if (!answers.confirm) {
        console.log(chalk.yellow('Download cancelled.'));
        return;
    }

    const filename = await download(answers);

    if (answers.extract) {
        await extract(filename);

        if (answers.deleteArchive) {
            fs.unlinkSync(filename);
            console.log(chalk.green(`Archive ${filename} deleted!`));
        }
    }
}

main().catch((err) => {
    // Ctrl+C while a prompt is open surfaces as ExitPromptError: treat it
    // like an explicit cancellation, not a failure.
    if (err && err.name === 'ExitPromptError') {
        console.log(chalk.yellow('Download cancelled.'));
        return;
    }

    console.error(chalk.red(err.message || String(err)));
    process.exitCode = 1;
});
