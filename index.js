#!/usr/bin/env node

const chalk = require('chalk');
const inquirer = require('inquirer');
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

const printBanner = require('./lib/banner');
const questions = require('./lib/questions');
const { download } = require('./lib/download');

printBanner();

inquirer.prompt(questions)
    .then((answers) => {
        if (!answers.confirm) {
            console.log(chalk.yellow('Download cancelled.'));
            return;
        }

        return download(answers);
    });
