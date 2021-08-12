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
    const filename = `${answers.product}-${answers.version}-${answers.arch}.tar.gz`
    const url = `https://artifacts.elastic.co/downloads/${answers.product}/${filename}`;

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
            name: 'LINUX X86-64',
            value: 'linux-x86_64'
        },
        {
            name: 'MACOS',
            value: 'darwin-x86_64'
        },
        {
            name: 'WINDOWS',
            value: 'windows-x86_64'
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
// TODO: Use search-list instead of manually type a version when fallback possible with Inquirer.js
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
    message: (answers) => `Are you sure to download ${answers.product} ${answers.version} (${answers.arch}) in the current directory?`
}
])
.then((answers) => { download(answers) });