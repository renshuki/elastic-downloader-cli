const inquirer = require('inquirer');
const { architecturesFor } = require('./architectures');
const { isLegacyNoArch } = require('./download');
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
// plain input when the versions could not be fetched.
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
            choices: [MANUAL_VERSION, ...versions],
        },
        {
            name: 'manualVersion',
            type: 'input',
            message: 'Type a version:',
            when: (answers) => answers.version === MANUAL_VERSION,
            validate: requireVersion,
            filter: (input) => input.trim(),
        },
    ];
}

// The version comes from the manual input only when the manual escape hatch
// was selected in the search-list; never fall back on truthiness, otherwise
// the "Other (...)" label itself would leak as the version.
function resolvedVersion(answers) {
    if (answers.version === MANUAL_VERSION) {
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
