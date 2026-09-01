const inquirer = require('inquirer');
const architectures = require('./architectures');
const productGroups = require('./products');

function architectureChoices() {
    return architectures.map((arch) => ({ name: arch.name, value: arch }));
}

function productChoices() {
    const choices = [];

    productGroups.forEach((group) => {
        choices.push(new inquirer.Separator(`--- ${group.group} ---`));
        group.products.forEach((product) => {
            choices.push({ name: product.name, value: product });
        });
    });

    return choices;
}

module.exports = [
    {
        name: 'arch',
        type: 'list',
        message: 'Select an architecture:',
        pageSize: 20,
        choices: architectureChoices(),
    },
    {
        name: 'product',
        type: 'list',
        message: 'Select a product:',
        pageSize: 20,
        choices: productChoices(),
    },
    // TODO: Offer a search-list of available versions instead of a free-form
    // input. Fetching https://api.github.com/repos/elastic/<product>/tags does
    // not work for every product (not all of them have a Github repository),
    // so a common endpoint exposing the versions in JSON format is needed.
    {
        name: 'version',
        type: 'input',
        message: 'Type a version:',
    },
    {
        name: 'confirm',
        type: 'confirm',
        message: (answers) => `Are you sure to download ${answers.product.name} ${answers.version} (${answers.arch.name}) in the current directory?`,
    },
];
