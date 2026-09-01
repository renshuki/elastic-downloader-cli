const inquirer = require('inquirer');
const { architecturesFor } = require('./architectures');
const { isLegacyNoArch } = require('./download');
const { isExtractable } = require('./extract');
const { versionsFor } = require('./versions');
const productGroups = require('./products');

const MANUAL_VERSION = 'Other (type the version manually)';

function productChoices() {
    const choices = [];

    productGroups.forEach((group) => {
        choices.push(new inquirer.Separator(`--- ${group.group} ---`));
        group.products.forEach((product) => {
            const label = product.note ? `${product.name} (${product.note})` : product.name;
            choices.push({ name: label, value: product });
        });
    });

    return choices;
}

function architectureChoices(product) {
    return architecturesFor(product).map((arch) => ({ name: arch.name, value: arch }));
}

function requireVersion(input) {
    return input.trim() !== '' ? true : 'Please enter a version (e.g. 8.14.0)';
}

// Searchable list of fetched versions with a manual entry escape hatch, or a
// plain input when the versions could not be fetched. The list only offers
// the versions within the selected product's availability range; when none
// of the fetched versions falls inside it, the search-list is skipped and
// the prompt goes straight to manual input.
function versionQuestions(versions) {
    if (!versions || versions.length === 0) {
        return [
            {
                name: 'version',
                type: 'input',
                message: 'Type a version:',
                validate: requireVersion,
                filter: (input) => input.trim(),
            },
        ];
    }

    return [
        {
            name: 'version',
            type: 'search-list',
            message: 'Choose a version (type to filter):',
            pageSize: 15,
            choices: (answers) => [MANUAL_VERSION, ...versionsFor(answers.product, versions)],
            when: (answers) => versionsFor(answers.product, versions).length > 0,
        },
        {
            name: 'manualVersion',
            type: 'input',
            message: 'Type a version:',
            // Pressing Enter without typing anything picks the latest
            // release available for the product (the fetched list is
            // ordered newest first). No default when nothing matched the
            // product's range.
            default: (answers) => versionsFor(answers.product, versions)[0],
            when: (answers) => answers.version === undefined || answers.version === MANUAL_VERSION,
            validate: requireVersion,
            filter: (input) => input.trim(),
        },
    ];
}

// The version comes from the manual input when the manual escape hatch was
// selected in the search-list, or when the search-list was skipped entirely
// (no fetched version within the product's range); never fall back on
// truthiness, otherwise the "Other (...)" label itself would leak as the
// version.
function resolvedVersion(answers) {
    if (answers.version === MANUAL_VERSION || answers.version === undefined) {
        return answers.manualVersion;
    }

    return answers.version;
}

function buildQuestions(versions) {
    return [
        {
            name: 'product',
            type: 'list',
            message: 'Select a product:',
            pageSize: 20,
            choices: productChoices(),
        },
        {
            name: 'arch',
            type: 'list',
            message: 'Select an architecture / package:',
            pageSize: 20,
            choices: (answers) => architectureChoices(answers.product),
        },
        ...versionQuestions(versions),
        {
            name: 'extract',
            type: 'confirm',
            message: 'Extract the archive after the download?',
            default: false,
            when: (answers) => isExtractable(answers.arch),
        },
        {
            name: 'deleteArchive',
            type: 'confirm',
            message: 'Delete the archive once extracted?',
            default: false,
            // The isExtractable guard matters when `extract` was pre-answered
            // (e.g. via a command-line flag) for a non-archive package.
            when: (answers) => answers.extract === true && isExtractable(answers.arch),
        },
        {
            name: 'confirm',
            type: 'confirm',
            message: (answers) => {
                const version = resolvedVersion(answers);

                // An architecture-specific selection does not apply to
                // versions predating the per-product noArchBefore boundary:
                // say so before downloading the generic package.
                if (isLegacyNoArch(answers.product, answers.arch, version)) {
                    return `${answers.product.name} versions before ${answers.product.noArchBefore} ship a single platform independent package, so "${answers.arch.name}" will not apply. Download ${answers.product.name} ${version} anyway?`;
                }

                return `Are you sure to download ${answers.product.name} ${version} (${answers.arch.name}) in the current directory?`;
            },
        },
    ];
}

module.exports = { buildQuestions, resolvedVersion };
