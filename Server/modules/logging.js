var argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');

var Console = {}

Console.log = function (source, message) {
  if (message == null || message == undefined || message == "") {
    // message variable is blank so we cannot assign a tag to it from its source
    console.log(source)
  } else {
    var prefix = ''
    switch (source) {
      case 'Network':
        prefix = '['+chalk.green('Network')+'] ';
        break;
      case 'System':
        prefix = '['+chalk.green('System')+'] ';
        break;
      default:

    }
    console.log(prefix+message)
  }
}

Console.error = function (source, message) {
  if (message == null || message == undefined || message == "") {
    // message variable is blank so we cannot assign a tag to it from its source
    console.log(source)
  } else {
    var prefix = prefix = '['+chalk.green(source)+'] ';
    console.log('['+chalk.red('ERROR')+']'+prefix+message)
  }
}

module.exports = Console;
