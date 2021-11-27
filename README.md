# Blockchain-FileStorage 
This a masters research project. This project is an effort to create a better more secure method for data storage.

There are three specific aspects to the project.
  1. The ledger
  2. The data front
  3. The data storage its self.

Server Task List:
 - [x] 1. Main system (app.js)
 - [x] 2. Communication (network.js)
    - [X] 2.1 TCP server
 - [x] 3. Ledger handling system (ledger.js)
    - [x] 3.1 Data inserting (called from API)
 - [x] 4. Data handling (functions.js)
    - [x] 4.1 Data storing
    - [x] 4.2 Data security
    - [x] 4.3 Data Hashing
    - [x] 4.4 Data distribution


    make connection to other Nodes
    listen for other nodes connection
    =
    update nodes list

    login to any node to upload Data

    send my public key / hash

    on insert request take data then break up and encrypt the data
    using the users private key



    https://stackoverflow.com/questions/8750780/encrypting-data-with-public-key-in-node-js
    var crypto = require("crypto");
    var path = require("path");
    var fs = require("fs");

    var encryptStringWithRsaPublicKey = function(toEncrypt, relativeOrAbsolutePathToPublicKey) {
        var absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);
        var publicKey = fs.readFileSync(absolutePath, "utf8");
        var buffer = Buffer.from(toEncrypt);
        var encrypted = crypto.publicEncrypt(publicKey, buffer);
        return encrypted.toString("base64");
    };

    var decryptStringWithRsaPrivateKey = function(toDecrypt, relativeOrAbsolutePathtoPrivateKey) {
        var absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey);
        var privateKey = fs.readFileSync(absolutePath, "utf8");
        var buffer = Buffer.from(toDecrypt, "base64");
        var decrypted = crypto.privateDecrypt(privateKey, buffer);
        return decrypted.toString("utf8");
    };

    module.exports = {
        encryptStringWithRsaPublicKey: encryptStringWithRsaPublicKey,
        decryptStringWithRsaPrivateKey: decryptStringWithRsaPrivateKey
    }




Distributed not p2p.
