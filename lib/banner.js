import figlet from 'figlet';
import chalk from 'chalk';

function printBanner() {
    console.log(
        chalk.green(
            figlet.textSync('Elastic Downloader CLI', { horizontalLayout: 'default' })
        )
    );
}

export default printBanner;
