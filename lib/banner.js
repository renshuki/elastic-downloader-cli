const figlet = require('figlet');
const chalk = require('chalk');

function printBanner() {
    console.log(
        chalk.green(
            figlet.textSync('Elastic Downloader CLI', { horizontalLayout: 'default' })
        )
    );
}

module.exports = printBanner;
