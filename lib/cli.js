const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const productGroups = require('./products');
const { architecturesFor } = require('./architectures');

function allProducts() {
    return productGroups.flatMap((group) => group.products);
}

function listProducts() {
    productGroups.forEach((group) => {
        console.log(chalk.cyan(`\n${group.group}`));
        group.products.forEach((product) => {
            const archIds = architecturesFor(product).map((arch) => arch.id).join(', ');
            console.log(`  ${product.slug.padEnd(26)} ${archIds}`);
        });
    });
}

function fail(message) {
    console.error(chalk.red(message));
    process.exit(1);
}

// Turns the command-line options into pre-filled answers; inquirer skips
// every prompt whose answer is already provided here, so the CLI stays
// interactive for whatever was not passed on the command line.
function presetAnswers(opts) {
    const preset = {};

    if (opts.product) {
        const product = allProducts().find((p) => p.slug === opts.product);

        if (!product) {
            fail(`Unknown product "${opts.product}". Run "ecdl --list-products" to see the available products.`);
        }

        preset.product = product;
    }

    if (opts.arch) {
        if (!preset.product) {
            fail('--arch requires --product.');
        }

        const architectures = architecturesFor(preset.product);
        const arch = architectures.find((a) => a.id === opts.arch);

        if (!arch) {
            const available = architectures.map((a) => a.id).join(', ');
            fail(`Unknown architecture "${opts.arch}" for ${preset.product.name}. Available: ${available}`);
        }

        preset.arch = arch;
    }

    if (opts.productVersion) {
        preset.version = opts.productVersion;
    }

    if (opts.extract || opts.deleteArchive) {
        preset.extract = true;
    }

    if (opts.deleteArchive) {
        preset.deleteArchive = true;
    }

    if (opts.yes) {
        preset.confirm = true;

        // A scripted run should not stop on the remaining yes/no prompts.
        if (preset.extract === undefined) {
            preset.extract = false;
        }
        if (preset.deleteArchive === undefined) {
            preset.deleteArchive = false;
        }
    }

    return preset;
}

function parseArgs(argv) {
    program
        .name('ecdl')
        .description(pkg.description)
        .version(pkg.version, '-V, --cli-version', 'output the elastic-downloader-cli version')
        .option('-p, --product <product>', 'product to download, by slug (see --list-products)')
        .option('-a, --arch <arch>', 'architecture / package id (see --list-products)')
        .option('-v, --product-version <version>', 'product version to download')
        .option('--extract', 'extract the archive after the download')
        .option('--delete-archive', 'delete the archive once extracted (implies --extract)')
        .option('-y, --yes', 'skip the confirmation prompt')
        .option('--list-products', 'list the available products and architectures, then exit')
        .addHelpText('after', `
Examples:
  $ ecdl
  $ ecdl --list-products
  $ ecdl -p elasticsearch -a linux-x86_64 -v 8.14.0 -y
  $ ecdl -p filebeat -a deb-amd64 -v 8.14.0 -y
  $ ecdl -p kibana -a darwin-aarch64 -v 8.14.0 --extract --delete-archive -y`)
        .parse(argv);

    const opts = program.opts();

    if (opts.listProducts) {
        listProducts();
        process.exit(0);
    }

    return presetAnswers(opts);
}

module.exports = { parseArgs };
