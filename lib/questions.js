const inquirer = require('inquirer');
const { architecturesFor } = require('./architectures');
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

// Searchable list of fetched versions with a manual entry escape hatch, or a
// plain input when the versions could not be fetched.
function versionQuestions(versions) {
    if (!versions || versions.length === 0) {
        return [
            {
                name: 'version',
                type: 'input',
                message: 'Type a version:',
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
        },
    ];
}

// The version can come either from the search-list or from the manual input.
function resolvedVersion(answers) {
    return answers.manualVersion || answers.version;
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
            message: (answers) => `Are you sure to download ${answers.product.name} ${resolvedVersion(answers)} (${answers.arch.name}) in the current directory?`,
        },
    ];
}

module.exports = { buildQuestions, resolvedVersion };
