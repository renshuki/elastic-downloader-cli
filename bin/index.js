#!/usr/bin/env node

const yargs = require("yargs");
const figlet = require("figlet");
const chalk = require('chalk');
const inquirer = require('inquirer');

console.log(
    chalk.green(
        figlet.textSync('Elastic Downloader CLI', { horizontalLayout: 'default' })
        )
    );


inquirer.prompt([
{
    name: 'product',
    type: 'list',
    message: 'Select a product:',
    choices: [
    {
        key: 'Elasticsearch',
        value: 'elasticsearch'
    },
    {
        key: 'Kibana',
        value: 'kibana'
    },
    {
        key: 'Logstash',
        value: 'logstash'
    }
    ]
},
{
    name: 'version',
    type: 'list',
    message: 'Select a version:',
    choices: getVersionsList
},
{
    name: 'arch',
    type: 'list',
    message: 'Select an architecture:',
    choices: [
    {
        key: 'LINUX X86-64',
        value: 'linux-x86_64'
    },
    {
        key: 'WINDOWS',
        value: 'windows-x86_64'
    },
    {
        key: 'MACOS',
        value: 'darwin-x86_64'
    }
    ]
},
{
    name: 'confirm',
    type: 'confirm',
    message: (answers) => `Are you sure to download ${answers.product} ${answers.version} (${answers.arch}) in the current directory?`
}
])
.then((download) => {
    console.log(JSON.stringify(download, null, '  '));
});




// const options = yargs
//  .usage("Usage: -p <product> -v <version> -a <architecture>")
//  .option("p", { alias: "product", describe: "Elastic product name", type: "string", demandOption: true })
//  .option("v", { alias: "version", describe: "Elastic product version", type: "string", demandOption: true })
//  .option("a", { alias: "arch", describe: "Elastic product architecture", type: "string", demandOption: true })
//  .argv;

// const dl = `Downloading ${options.product}...`;

// console.log(dl);