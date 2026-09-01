import { confirm, input, search, select, Separator } from '@inquirer/prompts';
import { architecturesFor } from './architectures.js';
import { isLegacyNoArch } from './download.js';
import { isExtractable } from './extract.js';
import { versionsFor, VERSION_FORMAT } from './versions.js';
import productGroups from './products.js';

const MANUAL_VERSION = 'Other (type the version manually)';

function productChoices() {
    const choices = [];

    productGroups.forEach((group) => {
        choices.push(new Separator(`--- ${group.group} ---`));
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
    const version = input.trim();

    if (version === '') {
        return 'Please enter a version (e.g. 8.14.0)';
    }

    return VERSION_FORMAT.test(version)
        ? true
        : 'Versions can only contain letters, digits, dots and dashes (e.g. 8.14.0)';
}

// Search source for the version list. An empty term shows the manual entry
// escape hatch followed by every version within the product's range; a term
// narrows the versions down (substring match) and keeps the escape hatch
// reachable as the last entry, so a term matching nothing still offers it.
function filterVersionChoices(available, term) {
    const needle = (term || '').trim();

    if (needle === '') {
        return [MANUAL_VERSION, ...available];
    }

    return [...available.filter((version) => version.includes(needle)), MANUAL_VERSION];
}

function askManualVersion(defaultVersion) {
    return input({
        message: 'Type a version:',
        default: defaultVersion,
        validate: requireVersion,
    }).then((version) => version.trim());
}

// Searchable list of fetched versions with a manual entry escape hatch. The
// list only offers the versions within the product's availability range;
// when there is nothing to list (the fetch failed, or no fetched version
// falls inside the range) the prompt goes straight to manual input.
async function askVersion(product, versions) {
    const available = versions && versions.length > 0 ? versionsFor(product, versions) : [];

    if (available.length === 0) {
        return askManualVersion(undefined);
    }

    const choice = await search({
        message: 'Choose a version (type to filter):',
        source: (term) => filterVersionChoices(available, term),
        pageSize: 15,
    });

    if (choice === MANUAL_VERSION) {
        // Pressing Enter without typing anything picks the latest release
        // available for the product (the list is ordered newest first).
        return askManualVersion(available[0]);
    }

    return choice;
}

// An architecture-specific selection does not apply to versions predating
// the per-product noArchBefore boundary: say so before downloading the
// generic package.
function confirmMessage(answers) {
    const { product, arch, version } = answers;

    if (isLegacyNoArch(product, arch, version)) {
        return `${product.name} versions before ${product.noArchBefore} ship a single platform independent package, so "${arch.name}" will not apply. Download ${product.name} ${version} anyway?`;
    }

    return `Are you sure to download ${product.name} ${version} (${arch.name}) in the current directory?`;
}

// Asks whatever the preset (answers pre-filled from command-line flags) did
// not provide, in the same order as the original prompt flow.
async function askAnswers(preset, versions) {
    const answers = { ...preset };

    if (answers.product === undefined) {
        answers.product = await select({
            message: 'Select a product:',
            choices: productChoices(),
            pageSize: 20,
        });
    }

    if (answers.arch === undefined) {
        answers.arch = await select({
            message: 'Select an architecture / package:',
            choices: architectureChoices(answers.product),
            pageSize: 20,
        });
    }

    if (answers.version === undefined) {
        answers.version = await askVersion(answers.product, versions);
    }

    if (answers.extract === undefined) {
        answers.extract = isExtractable(answers.arch)
            ? await confirm({ message: 'Extract the archive after the download?', default: false })
            : false;
    }

    if (answers.deleteArchive === undefined) {
        // The isExtractable guard matters when `extract` was pre-answered
        // (e.g. via a command-line flag) for a non-archive package.
        answers.deleteArchive = answers.extract === true && isExtractable(answers.arch)
            ? await confirm({ message: 'Delete the archive once extracted?', default: false })
            : false;
    }

    if (answers.confirm === undefined) {
        answers.confirm = await confirm({ message: confirmMessage(answers) });
    }

    return answers;
}

export {
    askAnswers,
    productChoices,
    architectureChoices,
    filterVersionChoices,
    requireVersion,
    confirmMessage,
    MANUAL_VERSION,
};
