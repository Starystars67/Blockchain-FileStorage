'use strict';
// require our needed dependancies
var argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
var net = require('net');
const app = require('express')()
const bodyParser = require('body-parser')
var multer = require('multer');
var moment = require('moment');
var upload = multer({
  limits: { fieldSize: 125 * 1024 * 1024 }
});
var bCrypt = require('bcrypt');
const shortid = require('shortid');
var console = require('./logging');
const { FileSystem, CryptoBlockchain, CryptoBlock} = require('./cryptography')

var clients = [];
var users, ledger, FileSys;

// Define our export variable
var Network = {
  Web: {},
  Net: {}
};

//////////////////////////////////////////////////////////////////////
//      Client - Server Comms
//////////////////////////////////////////////////////////////////////

Network.Web.Start = function (config, userList) {
  FileSys = new FileSystem(config);
  var loadedLedger = FileSys.ReadLedger()
  if (loadedLedger.blockchain == undefined || loadedLedger.blockchain.length == undefined) {
    ledger = new CryptoBlockchain({});
  } else {
    ledger = new CryptoBlockchain(loadedLedger);
  }
  console.log('System', 'Ledger Loaded. Contains '+ledger.blockchain.length+' records.')

  FileSys.SaveLedger(ledger)

  console.log(ledger)

  users = userList;
  // Start a TCP Server
  console.log('Network', `Starting Server`);

  app.use(bodyParser.json()) // for parsing application/json
  app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
  app.use(upload.array());

  app.post('/', (req, res) => {
    //console.log(req.params) // Uncomment to show the incoming data
    //console.log(req.body) // Uncomment to show the incoming data
    // TODO: Make login system function and encryption in client
    if (true || isLoggedIn(req)) { // Check user is logged in, else move them to login
      //console.log("User loggedin, move ot handling")
      Functions.handleUploadRequest(req, res)
    } else {
      login(req)
    }
  })

  app.post('/find', (req, res) => {
    //console.log(req.params) // Uncomment to show the incoming data
    //console.log(req.body) // Uncomment to show the incoming data
    // TODO: Make login system function and encryption in client
    if (true || isLoggedIn(req)) { // Check user is logged in, else move them to login
      //console.log("User loggedin, move ot handling")
      Functions.handleFindRequest(req, res)
    } else {
      login(req)
    }
  })

  app.post('/download', (req, res) => {
    //console.log(req.params) // Uncomment to show the incoming data
    //console.log(req.body) // Uncomment to show the incoming data
    // TODO: Make login system function and encryption in client
    if (true || isLoggedIn(req)) { // Check user is logged in, else move them to login
      //console.log("User loggedin, move ot handling")
      Functions.handleDownloadRequest(req, res)
    } else {
      login(req)
    }
  })

  app.post('/remove', (req, res) => {
    //console.log(req.params) // Uncomment to show the incoming data
    //console.log(req.body) // Uncomment to show the incoming data
    // TODO: Make login system function and encryption in client
    if (true || isLoggedIn(req)) { // Check user is logged in, else move them to login
      //console.log("User loggedin, move ot handling")
      Functions.handleRemoveRequest(req, res)
    } else {
      login(req)
    }
  })

  app.listen(config.Port, () => {
    console.log('Network', `Access Port Running on: ${config.Port}.`);
  })
}

var Functions = {};

Functions.handleUploadRequest = function(req, res) {
  console.log('Network', 'New data received: ');
  //console.log(req.params)
  //console.log(req.body.chunks)
  console.log(req.body.pwd)
  var data = JSON.parse(req.body.data)
  console.log(data.length)

  var fileChunkNames = []
  for (var i = 0; i < data.length; i++) {
    //console.log(data[i])
    fileChunkNames[i] = FileSys.SaveData(JSON.stringify(data[i]))
  }
  //console.log(fileChunkNames)
  var x = shortid.generate();
  var block = {
    filename: x,
    filechunks: fileChunkNames,
    controlKey: bCrypt.hashSync(req.body.pwd, bCrypt.genSaltSync(10), null)
  }

  ledger.addNewBlock(new CryptoBlock(ledger.blockchain.length, moment(), block))

  console.log(ledger)

  FileSys.SaveLedger(ledger)

  res.send({status: 'COMPLETE', fileID: x})

  //console.log(network)

  //console.log(network.GetNodes.length)

  /*

    receive the whole data - Done
    -----get number of nodes on network
    -----distrobute the data accross nodes for as many as the user split the data.
    collate returned record id's into a main record of segments
    store this data and record in ledger for historical records.
    distrobute this update out to all nodes

  */



};

Functions.handleFindRequest = function(req, res) {
  console.log('Network', 'New data received: ');
  //console.log(req.params)
  //console.log(req.body.chunks)
  console.log(req.body)
  var data = req.body
  console.log(data.pwd)
  var found = false;

  for (var i = 0; i < ledger.blockchain.length; i++) {
    //console.log(ledger.blockchain[i].data)
    if (ledger.blockchain[i].data.filename == data.id) {
      found = true;
      var e = i;
      i = ledger.blockchain.length; // This ends the cycle
      if (bCrypt.compareSync(data.pwd, ledger.blockchain[e].data.controlKey)) {
        // File found and password Correct!
        res.send({status: 'COMPLETE', msg: 'FILE FOUND'})
      } else {
        // File exists but wrong password
        res.send({status: 'ERROR', msg: 'ERROR: Wrong Control Key.'})
      }
    }
  }

  if (!found) {
    res.send({status: 'ERROR', msg: 'ERROR: File Not Found.'})
  }

  //res.send({status: 'COMPLETE', fileID: x})
};

Functions.handleDownloadRequest = function(req, res) {
  console.log('Network', 'New data received: ');
  //console.log(req.params)
  //console.log(req.body.chunks)
  console.log(req.body)
  var data = req.body
  console.log(data.pwd)
  var found = false;

  for (var i = 0; i < ledger.blockchain.length; i++) {
    //console.log(ledger.blockchain[i].data)
    if (ledger.blockchain[i].data.filename == data.id) {
      found = true;
      var e = i;
      i = ledger.blockchain.length; // This ends the cycle
      if (bCrypt.compareSync(data.pwd, ledger.blockchain[e].data.controlKey)) {
        // File found and password Correct!
        // Now lets try and serve the file for download
        var recompiledData = []
        var MISSING_FILE = false
        for (var j = 0; j < ledger.blockchain[e].data.filechunks.length; j++) {
          var x = FileSys.ReadData(ledger.blockchain[e].data.filechunks[j])
          if (x != undefined) {
            recompiledData[j] = JSON.parse(x)
          } else {
            MISSING_FILE = true
          }
        }
        if (!MISSING_FILE) {
          res.send({status: 'COMPLETE', msg: 'FILE FOUND', data: recompiledData})
        } else {
          res.send({status: 'ERROR', msg: 'FILE MISSING/REMOVED', data: {}})
        }
      } else {
        // File exists but wrong password
        res.send({status: 'ERROR', msg: 'ERROR: Wrong Control Key.'})
      }
    }
  }

  if (!found) {
    res.send({status: 'ERROR', msg: 'ERROR: File Not Found.'})
  }

  //res.send({status: 'COMPLETE', fileID: x})
};

Functions.handleRemoveRequest = function(req, res) {
  console.log('Network', 'New data received: ');
  console.log(req.body)
  var data = req.body
  console.log(data.pwd)
  var found = false;

  for (var i = 0; i < ledger.blockchain.length; i++) {
    //console.log(ledger.blockchain[i].data)
    if (ledger.blockchain[i].data.filename == data.id) {
      found = true;
      var e = i;
      i = ledger.blockchain.length; // This ends the cycle
      if (bCrypt.compareSync(data.pwd, ledger.blockchain[e].data.controlKey)) {
        // File found and password Correct!
        // Now lets try and delete the file.
        for (var j = 0; j < ledger.blockchain[e].data.filechunks.length; j++) {
          FileSys.RemoveData(ledger.blockchain[e].data.filechunks[j])
        }
        res.send({status: 'COMPLETE', msg: 'File Successfully Deleted',})
      } else {
        // File exists but wrong password
        res.send({status: 'ERROR', msg: 'ERROR: Wrong Control Key.'})
      }
    }
  }

  if (!found) {
    res.send({status: 'ERROR', msg: 'ERROR: File Not Found.'})
  }

  //res.send({status: 'COMPLETE', fileID: x})
};

//////////////////////////////////////////////////////////////////////
//      Server 2 Server Comms
//////////////////////////////////////////////////////////////////////

Network.Net.Start = function (config, userList) {
  users = userList;
  console.log('Network', `Connecting to other devices on the network!`);
  connectToNetwork(config, 0);
}

var networkNodes = [];
Network.GetNodes = function () {
  return networkNodes;
}

function connectToNetwork(config, i) {
  if (config.Nodes[i].IP != config.IP) {
    networkNodes[i] = new net.Socket();
    console.log('Network', `Attempting to connect to: ${config.Nodes[i].Name}.`);
    networkNodes[i].connect(config.Nodes[i].PORT, config.Nodes[i].IP, function() {
      console.log(`Connected to ${config.Nodes[i].Name}.`);
      if (i < config.Nodes.length-1) {
        var t = i+1; // must be +1 otherwise it edits the i value
        connectToNetwork(config, t)
      }
      networkNodes[i].write('root toor');
    });

    networkNodes[i].on('data', function(data) {
      console.log('Received: ' + data);
      //networkNodes[i].destroy(); // kill client after server's response
    });

    networkNodes[i].on('close', function() {
      console.log('Connection closed. ('+config.Nodes[i].Name+')');
    });
    networkNodes[i].on('error', (err) => {
      // handle errors here
      if (err.code == "ECONNRESET") {
        console.error("Connection to "+config.Nodes[i].Name+" lost!") // TODO: Make this try to reconnect to the server
        if (i < config.Nodes.length-1) {
          i++;
          connectToNetwork(config, i)
        }
      } else if (err.code == "ETIMEDOUT") {
        console.error("Connection to "+config.Nodes[i].Name+" timed out!") // TODO: Make this try to reconnect to the server?
        if (i < config.Nodes.length-1) {
          i++;
          connectToNetwork(config, i)
        }
      } else {
        console.error(err);
        throw err;
      }
    });
  } else {
    networkNodes[i] = "SELF";
    if (i < config.Nodes.length-1) {
      i++;
      connectToNetwork(config, i)
    }
  }
}

function isLoggedIn (socket) {
  var isLogged = false
  clients.some(function (client) {
    if (client === socket && client.authenticated) {
      //console.log("User is logged");
      isLogged = true;
    }
  });
  return isLogged
}

function login (socket, data) {
  var loginData = data.split(' ')
  var notFound = true;
  users.some(function (user) {
    if (user.username === loginData[0]) {
      notFound = false;
      bcrypt.compare(loginData[1], user.password, function(err, res) {
        if (res) {
          socket.write("Login Successful.\n");
          clients.some(function (client) {
            if (client === socket) {
              client.authenticated = true;
              return true;
            }
          });
        } else {
          console.log("psswd err")
          socket.write("Invalid username or password.\n");
        }
      });
    }
  });
  if (notFound) {
    console.log("uname issue")
    socket.write("Invalid username or password.\n");
  }
}

module.exports = Network;
