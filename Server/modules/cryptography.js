var console = require('./logging');
var fs = require('fs');
var moment = require('moment');
const shortid = require('shortid');

// https://www.smashingmagazine.com/2020/02/cryptocurrency-blockchain-node-js/
const SHA256 = require('crypto-js/sha256');

class CryptoBlock {
  constructor(index, timestamp, data, precedingHash = " ") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.precedingHash = precedingHash;
    this.hash = this.computeHash();
    this.nonce = 0;
  }

  computeHash() {
    return SHA256(
      this.index +
        this.precedingHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
    ).toString();
  }

  proofOfWork(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.computeHash();
    }
  }
}

class CryptoBlockchain {
  constructor(cfg) {
    if (cfg.blockchain == undefined) {
      this.blockchain = [this.startGenesisBlock()];
      this.difficulty = 4;
    } else {
      this.blockchain = cfg.blockchain;
      this.difficulty = cfg.difficulty;
    }
  }
  startGenesisBlock() {
    return new CryptoBlock(0, moment().format('DD/MM/YYYY'), "Initial Block in the Chain", "0");
  }

  obtainLatestBlock() {
    var last = this.blockchain[this.blockchain.length - 1];
    console.log(last)
    return last
  }

  addNewBlock(newBlock) {
    console.log(newBlock)
    newBlock.precedingHash = this.obtainLatestBlock().hash;
    newBlock.proofOfWork(this.difficulty);
    this.blockchain.push(newBlock);
  }

  checkChainValidity() {
    for (let i = 1; i < this.blockchain.length; i++) {
      const currentBlock = this.blockchain[i];
      const precedingBlock = this.blockchain[i - 1];

      if (currentBlock.hash !== currentBlock.computeHash()) {
        return false;
      }
      if (currentBlock.precedingHash !== precedingBlock.hash) return false;
    }
    return true;
  }
}

/**
 * File Wrapper for the FileSystem regarding reading & writing to disk.
 */
class FileSystem  {
  /*
    file saving
    ledger updating
    ledger hashing
    ledger reading
  */

  contructor(s) {
    this.settings = s
  }

  /** SaveData used to save data to a file. The file name is automatically generated using `shortid.generate()`
   * @param {string} data The data to be written to file.
   * @returns {string} filename The file name of the stored data.
   */
  SaveData(data) {
    // This is where we can change the system to save using Either FTP, Local Storage OR what ever else we want
    var filename = shortid.generate()
    if (!fs.existsSync(`./datafiles/${filename}.fc`)) {
      //file not exists, we can use this name
      //console.log('About to save file!')
      try {
        fs.writeFileSync(`./datafiles/${filename}.fc`, data, (err) => {
            if (err) {throw err;}
        });
        //console.log("Data saved.");
        return filename
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log('File Name In Use!!! '+filename)
      filename = shortid.generate()
    }
  }

  /** ReadData used to read a files data back into memory.
   * @param {string} filename The file name to read.
   * @returns {string} data The stored data.
   */
  ReadData(filename) {
    // This is where we can change the system to save using Either FTP, Local Storage OR what ever else we want
    if (fs.existsSync(`./datafiles/${filename}.fc`)) {
      //file not exists, we can use this name
      //console.log('About to save file!')
      try {
        console.log('Reading Data From Disk.')
        var data = fs.readFileSync(`./datafiles/${filename}.fc`);
        console.log(data)
        return data
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log('File Not Found!!! '+filename)
      return undefined
    }
  }

  /** RemoveData used to read a files data back into memory.
   * @param {string} filename The file name to read.
   * @returns {void} nothing.
   */
  RemoveData(filename) {
    // This is where we can change the system to save using Either FTP, Local Storage OR what ever else we want
    if (fs.existsSync(`./datafiles/${filename}.fc`)) {
      //file not exists, we can use this name
      //console.log('About to save file!')
      try {
        fs.unlink(`./datafiles/${filename}.fc`, (err) => {
          if (err) throw err;
          console.log(`./datafiles/${filename}.fc was deleted`);
        });
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log('File Not Found!!! '+filename)
    }
  }

  /** SaveLedger used to save the ledger to file in a json string format.
   * @param {Object} record The ledger in Object format
   */
  SaveLedger(records) {
    // Used to update Ledger with new record
    const data = JSON.stringify(records);

    // write JSON string to a file
    fs.writeFile('ledger.json', data, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
    });
  }

  /** ReadLedger used to read the ledger from file..
   * Useful for upon startup.
   * @returns {Object} ledger The ledger in object form.
   */
  ReadLedger() {
    var rawdata = fs.readFileSync('ledger.json');
    var data = (rawdata != "") ? rawdata : "{}"
    var ledger = JSON.parse(data);
    console.log(ledger)
    return ledger
  }
}

module.exports = {
  CryptoBlock: CryptoBlock,
  CryptoBlockchain: CryptoBlockchain,
  FileSystem: FileSystem
};
