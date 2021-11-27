'use strict';
/*
  There are three specific aspects to the project.
    1. The ledger
    2. The data front
    3. The data storage its self.
*/


var argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const fs = require('fs');
const getIP = require('external-ip')();
const network = require('./modules/network')
var console = require('./modules/logging');

// establish settings

console.log('System', 'Server initialising.')
var rawdata = fs.readFileSync('settings.json');
var config = JSON.parse(rawdata);
console.log('System', 'Server settings loaded.')
var rawdata = fs.readFileSync('users.json');
var users = JSON.parse(rawdata);
console.log('System', 'Server users loaded.')




var IP = "";
getIP((err, ip) => {
  if (err) {throw err;}
  config.IP = ip;
  console.log('System', `Server IP is: ${config.IP}`);
  network.Net.Start(config, users)
  network.Web.Start(config, users)
});


/*
.addNewBlock(
  new CryptoBlock(2, "01/07/2020", {
    sender: "Vitaly Friedman",
    recipient: "Ricardo Gimenes",
    quantity: 100
  })
);
*/
