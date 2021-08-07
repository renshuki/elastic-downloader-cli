#!/usr/bin/env node
const fs = require('fs');
const figlet = require('figlet');
const chalk = require('chalk');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const axios = require('axios');
const inquirer = require('inquirer');
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

console.log(
    chalk.green(
        figlet.textSync('Elastic Downloader CLI', { horizontalLayout: 'default' })
        )
    );

async function download (answers) {
    const status = new Spinner('Downloading...  ');
    const filename = `${answers.product}-${answers.version}-${answers.arch}.tar.gz`
    const url = `https://artifacts.elastic.co/downloads/${answers.product}/${filename}`;
    console.log(chalk.yellow(`File will be downloaded from ${url}`));

    status.start();

    const writer = fs.createWriteStream(filename);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            status.stop();
            process.stdout.write('\n');
            console.log(chalk.green("Download completed! :)"));
            resolve();
        })
        writer.on('error', (err) => {
            status.stop();
            process.stdout.write('\n');
            console.log(chalk.red("Download failed :/"));
            reject(err);
        })
    })
}

inquirer.prompt([
{
    name: 'arch',
    type: 'list',
    message: 'Select an architecture:',
    choices: [
        {
            name: 'LINUX X86-64',
            value: 'linux-x86_64'
        },
        {
            name: 'MACOS',
            value: 'darwin-x86_64'
        },
    ]
},
{
    name: 'product',
    type: 'list',
    message: 'Select a product:',
    pageSize: 20,
    choices: [
        new inquirer.Separator('--- Elastic Stack ---'),
        {
            name: 'Elasticsearch',
            value: 'elasticsearch'
        },
        {
            name: 'Kibana',
            value: 'kibana'
        },
        {
            name: 'Logstash',
            value: 'logstash'
        },
        new inquirer.Separator('--- Elastic Enterprise Search ---'),
        {
            name: 'App Search',
            value: 'app-search'
        },
        {
            name: 'Enterprise Search',
            value: 'enterprise-search'
        },
        new inquirer.Separator('--- Elastic Observability ---'),
        {
            name: 'APM Server',
            value: 'apm-server'
        },
        {
            name: 'Elastic Agent',
            value: 'elastic-agent'
        },
        {
            name: 'Auditbeat',
            value: 'auditbeat'
        },
        {
            name: 'Filebeat',
            value: 'filebeat'
        },
        {
            name: 'Functionbeat',
            value: 'functionbeat'
        },
        {
            name: 'Heartbeat',
            value: 'heartbeat'
        },
        {
            name: 'Journalbeat',
            value: 'jounalbeat'
        },
        {
            name: 'Metricbeat',
            value: 'metricbeat'
        },
        {
            name: 'Packetbeat',
            value: 'packetbeat'
        },
        {
            name: 'Topbeat',
            value: 'topbeat'
        },
        {
            name: 'Winlogbeat',
            value: 'winlogbeat'
        }
    ],
    default: 'elasticsearch',
},
{
    name: 'version',
    type: 'search-list',
    message: 'Type a version:',
    choices: (answers) =>  axios.get(`https://api.github.com/repos/elastic/${answers.product}/tags`)
        .then( response => {
            let versionsList = []
            response.data.forEach( item => {
                versionsList.push(item.name.substring(1));
            })
            return versionsList;
        }).catch((err) => {
            console.error(chalk.red("No version found :/"))
            process.exit(0);
        })
},
{
    name: 'confirm',
    type: 'confirm',
    message: (answers) => `Are you sure to download ${answers.product} ${answers.version} (${answers.arch}) in the current directory?`
}
])
.then((answers) => { download(answers) });







// const options = yargs
//  .usage('Usage: -p <product> -v <version> -a <architecture>')
//  .option('p', { alias: 'product', describe: 'Elastic product name', type: 'string', demandOption: true })
//  .option('v', { alias: 'version', describe: 'Elastic product version', type: 'string', demandOption: true })
//  .option('a', { alias: 'arch', describe: 'Elastic product architecture', type: 'string', demandOption: true })
//  .argv;

// const dl = `Downloading ${options.product}...`;

// console.log(dl);