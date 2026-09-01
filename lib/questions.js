const inquirer = require('inquirer');
const { architecturesFor } = require('./architectures');
const { isLegacyNoArch } = require('./download');
const productGroups = require('./products');

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

module.exports = [
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
    // TODO: Offer a search-list of available versions instead of a free-form
    // input. Fetching https://api.github.com/repos/elastic/<product>/tags does
    // not work for every product (not all of them have a GitHub repository),
    // so a common endpoint exposing the versions in JSON format is needed.
    {
        name: 'version',
        type: 'input',
        message: 'Type a version:',
    },
    {
        name: 'confirm',
        type: 'confirm',
        message: (answers) => {
            // An architecture-specific selection does not apply to versions
            // predating the per-product noArchBefore boundary: say so before
            // downloading the generic package.
            if (isLegacyNoArch(answers.product, answers.arch, answers.version)) {
                return `${answers.product.name} versions before ${answers.product.noArchBefore} ship a single platform independent package, so "${answers.arch.name}" will not apply. Download ${answers.product.name} ${answers.version} anyway?`;
            }

            return `Are you sure to download ${answers.product.name} ${answers.version} (${answers.arch.name}) in the current directory?`;
        },
    },
];
