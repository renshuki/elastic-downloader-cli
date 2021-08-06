#!/usr/bin/env node

const figlet = require("figlet");
const chalk = require('chalk');
const axios = require('axios');
const inquirer = require('inquirer');

console.log(
    chalk.green(
        figlet.textSync('Elastic Downloader CLI', { horizontalLayout: 'default' })
        )
    );


inquirer.prompt([
{
    name: 'arch',
    type: 'list',
    message: 'Select an architecture:',
    choices: [
        {
            name: "LINUX X86-64",
            value: "linux-x86_64"
        },
        {
            name: "MACOS",
            value: "darwin-x86_64"
        },
        {
            name: "WINDOWS",
            value: "windows-x86_64"
        },
    ]
},
{
    name: 'product',
    type: 'list',
    message: 'Select a product:',
    pageSize: 20,
    choices: [
        new inquirer.Separator("--- Elastic Stack ---"),
        {
            name: "Elasticsearch",
            value: "elasticsearch"
        },
        {
            name: "Kibana",
            value: "kibana"
        },
        {
            name: "Logstash",
            value: "logstash"
        },
        new inquirer.Separator("--- Elastic Enterprise Search ---"),
        {
            name: "App Search",
            value: "app-search"
        },
        new inquirer.Separator("--- Elastic Observability ---"),
        {
            name: "APM Server",
            value: "apm-server"
        },
        {
            name: "Elastic Agent",
            value: "elastic-agent"
        },
        {
            name: "Auditbeat",
            value: "auditbeat"
        },
        {
            name: "Filebeat",
            value: "filebeat"
        },
        {
            name: "Functionbeat",
            value: "functionbeat"
        },
        {
            name: "Heartbeat",
            value: "heartbeat"
        },
        {
            name: "Journalbeat",
            value: "jounalbeat"
        },
        {
            name: "Metricbeat",
            value: "metricbeat"
        },
        {
            name: "Packetbeat",
            value: "packetbeat"
        },
        {
            name: "Topbeat",
            value: "topbeat"
        },
        {
            name: "Winlogbeat",
            value: "winlogbeat"
        }
    ],
    default: 'elasticsearch',
},
{
    name: 'version',
    type: 'input',
    message: 'Type a version:',
    default: function (value) {
        (answers) =>  axios.get(`https://api.github.com/repos/elastic/${answers.product.toLowerCase()}/tags`)
            .then(function (response) {
                console.log(response.data[0].name.substring(1));
            });
    }
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