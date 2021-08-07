#!/usr/bin/env node

const figlet = require('figlet');
const chalk = require('chalk');
const CLI = require('clui');
var Spinner = CLI.Spinner;
const axios = require('axios');
const inquirer = require('inquirer');
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

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
.then((download) => {
    try {
        var status = new Spinner('Downloading, 10 seconds remaining...  ');
        status.start();
        var number = 10;
        setInterval(function () {
          number--;
          status.message('Downloading, ' + number + ' seconds remaining...  ');
          if (number === 0) {
            process.stdout.write('\n');
            console.log(JSON.stringify(download, null, '  '));
            process.exit(0);
          }
        }, 1000);
    } catch {
        console.log(chalk.red("Download failed :/"));
        process.exit(0);

    }
});




// const options = yargs
//  .usage('Usage: -p <product> -v <version> -a <architecture>')
//  .option('p', { alias: 'product', describe: 'Elastic product name', type: 'string', demandOption: true })
//  .option('v', { alias: 'version', describe: 'Elastic product version', type: 'string', demandOption: true })
//  .option('a', { alias: 'arch', describe: 'Elastic product architecture', type: 'string', demandOption: true })
//  .argv;

// const dl = `Downloading ${options.product}...`;

// console.log(dl);