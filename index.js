#!/usr/bin/env node

const fs = require('fs');
const figlet = require('figlet');
const chalk = require('chalk');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const axios = require('axios');
const inquirer = require('inquirer');
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

const versionStatus = new Spinner('Fetching versions from Github repository...  ');
const downloadStatus = new Spinner('Downloading...  ');


console.log(
    chalk.green(
        figlet.textSync('Elastic Downloader CLI', { horizontalLayout: 'default' })
        )
    );

async function download(answers) {
    let filename = `${answers.product[2]}-${answers.version}-${answers.arch[1]}.${answers.arch[2]}`

    // for versions downloads prior to 7.0.0
    if (parseInt(answers.version.split(".").shift()) < 7) {
        filename = `${answers.product[2]}-${answers.version}.${answers.arch[2]}`
    }

    const url = `https://artifacts.elastic.co/downloads/${answers.product[1]}/${filename}`;

    if (fs.existsSync(filename)) {
      console.log(chalk.red('File already exists! Abort.'));
      process.exit(0);
    }

    console.log(chalk.yellow(`File will be downloaded from ${url}`));

    downloadStatus.start();

    var response;

    try {
        response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
    } catch {
        downloadStatus.stop();
        console.log(chalk.red("File not found :/"));
        process.exit(0);
    }

    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            downloadStatus.stop();
            process.stdout.write('\n');
            console.log(chalk.green("Download completed! :)"));
            resolve();
        })
        writer.on('error', (err) => {
            downloadStatus.stop();
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
            name: 'LINUX 64-BIT',
            value: ['LINUX 64-BIT', 'linux-x86_64', 'tar.gz']
        },
        {
            name: 'MAC',
            value: ['MAC', 'darwin-x86_64', 'tar.gz']
        },
        {
            name: 'WINDOWS 64-BIT',
            value: ['WINDOWS 64-BIT', 'windows-x86_64', 'zip']
        }
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
            value: ['Elasticsearch', 'elasticsearch', 'elasticsearch']
        },
        {
            name: 'Kibana',
            value: ['Kibana', 'kibana', 'kibana']
        },
        {
            name: 'Logstash',
            value: ['Logstash', 'logstash', 'logstash']
        },
        new inquirer.Separator('--- Elastic Enterprise Search ---'),
        {
            name: 'App Search',
            value: ['App Search', 'app-search', 'app-search']
        },
        {
            name: 'Enterprise Search',
            value: ['Enterprise Search', 'enterprise-search', 'enterprise-search']
        },
        new inquirer.Separator('--- Elastic Observability ---'),
        {
            name: 'APM Server',
            value: ['APM Server', 'apm-server', 'apm-server']
        },
        {
            name: 'Elastic Agent',
            value: ['Elastic Agent', 'elastic-agent', 'elastic-agent']
        },
        {
            name: 'Auditbeat',
            value: ['Auditbeat', 'beats/auditbeat', 'auditbeat']
        },
        {
            name: 'Filebeat',
            value: ['Filebeat', 'beats/filebeat', 'filebeat']
        },
        {
            name: 'Functionbeat',
            value: ['Functionbeat', 'beats/functionbeat', 'functionbeat']
        },
        {
            name: 'Heartbeat',
            value: ['Heartbeat', 'beats/heartbeat', 'heartbeat']
        },
        {
            name: 'Journalbeat',
            value: ['Journalbeat', 'beats/journalbeat', 'jounalbeat']
        },
        {
            name: 'Metricbeat',
            value: ['Metricbeat', 'beats/metricbeat', 'metricbeat']
        },
        {
            name: 'Packetbeat',
            value: ['Packetbeat', 'beats/packetbeat', 'packetbeat']
        },
        {
            name: 'Topbeat',
            value: ['Topbeat', 'beats/topbeat', 'topbeat']
        },
        {
            name: 'Winlogbeat',
            value: ['Winlogbeat', 'beats', 'winlogbeat']
        }
    ],
    default: 'elasticsearch',
},
// TODO: Use search-list instead of manually type a version when fallback possible with Inquirer.js
// Not all products have a Github repository which make fetch from: https://api.github.com/repos/elastic/product_name/tags
// not compatible accross all products. Need to figure out an endpoint to retrieve the products versions in JSON format.
//
// {
//     name: 'version',
//     type: 'search-list',
//     message: 'Choose a version:',
//     choices: (answers) => new Promise((resolve, reject) => {
//             versionStatus.start();
//             resolve(axios.get(`https://api.github.com/repos/elastic/${answers.product}/tags`));
//         }).then( response => {
//             let versionsList = []
//             response.data.forEach( item => {
//                 versionsList.push(item.name.substring(1));
//             })
//             versionStatus.stop();
//             return versionsList;
//         }).catch((err) => {
//             versionStatus.stop();
//             process.stdout.write('\n');
//             console.error(chalk.red("Github repository not found :/"))
//             process.exit(0);
//         })
// },
{
    name: 'version',
    type: 'input',
    message: 'Type a version:'
},
{
    name: 'confirm',
    type: 'confirm',
    message: (answers) => `Are you sure to download ${answers.product[0]} ${answers.version} (${answers.arch[0]}) in the current directory?`
}
])
.then((answers) => { download(answers) });