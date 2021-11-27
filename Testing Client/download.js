console.clear()
var crypto = require('crypto');
var fs = require('fs');
var path = require('path')
var { performance } = require('perf_hooks');
var FormData = require('form-data');
const axios = require('axios').default;


var runTime = performance.now()


/*

Read Upload Results file

for each in file download the file and the compare the file data Buffer
if they match then we have a success and a time to process. If it failes we get a failed status

*/


var results = {
  stats: {error: 0, success: 0},
  results: []
}

var testNum = 0
var it = 0
var encryptionPassword = 'TEST'

var tests = [
  //{testInputFile: 'Run-1000-1kb-txt', data: fs.readFileSync(`./Run-1000-1kb-txt.json`), inputFile: '1kb.txt', testOutputFile: 'Run-1000-1kb-txt-download'},
  {testInputFile: 'Run-1000-500kb-txt', data: fs.readFileSync(`./Run-1000-500kb-txt.json`), inputFile: '500kb.txt', testOutputFile: 'Run-1000-500kb-txt-download'},
  {testInputFile: 'Run-1000-1mb-txt', data: fs.readFileSync(`./Run-1000-1mb-txt.json`), inputFile: '1mb.txt', testOutputFile: 'Run-1000-1mb-txt-download'},
]


// Load Test Files
var fileBuffers = {
  '1kb.txt': {data: fs.readFileSync(`./data/1kb.txt`), name: '1kb.txt'},
  '500kb.txt': {data: fs.readFileSync(`./data/500kb.txt`), name: '500kb.txt'},
  '1mb.txt': {data: fs.readFileSync(`./data/1mb.txt`), name: '1mb.txt'}
}

// PublicKey Passphrase
// Load Public Key
var privatekey = fs.readFileSync(`./privateKey.pem`);

function Download(FileID) {
  var downloadStart = performance.now()
  var formData = new FormData();
  formData.append("pwd", encryptionPassword);
  formData.append("id", FileID);

  axios({
    method: 'post',
    url: 'http://127.0.0.1:4058/download',
    data: formData,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {'Content-Type': `multipart/form-data; boundary=${formData._boundary}` }
    })
  .then(function (res) {
    var downloadFinish = performance.now()
    var downloadTime = (downloadFinish-downloadStart)
    if (res.data.status == 'COMPLETE') {
      var completedData = [];
      if (res.data) {
        var processStart = performance.now()
        for (var i = 0; i < res.data.data.length; i++) {
          for (var j = 0; j < res.data.data[i].length; j++) {
            var t = crypto.privateDecrypt(
            	{
            		key: privatekey,
                passphrase: "test",
            		padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            		oaepHash: "sha256",
            	},
            	new Buffer(res.data.data[i][j], 'base64')
            )
            //console.log(`New part decrypted. (${i}:${j})`)
            completedData += t
          }
        }
        if (completedData[completedData.length-1] != '}') {
          completedData+='}'
        }
        if (completedData[completedData.length-2] != '}') {
          completedData+='}'
        }
        var theData = JSON.parse(completedData) // Not sure how TF this closing brace bracket has gone missing!!! Maybe it wandered off just like my drink....
        // And finally now lets save our file for use once more

        var compareResults = "Match Failed"
        if (Buffer.compare(Buffer.from(theData.fileData), fileBuffers[tests[testNum].inputFile].data) == 0) {
          compareResults = "Match Success"
        }


        var processFinish = performance.now()
        var processTime = (processFinish-processStart)

        console.log(`Download Test: ${testNum+1}:${it+1} Result: ${compareResults} Download Return Time: ${downloadTime}ms, Decryption Time: ${processTime}ms  - ID: ${FileID}`);
        results.results.push({ID: FileID, result: compareResults, processTime: processTime, downloadTime: downloadTime})
        results.stats.success++;
        it++
        RunTest()
      } else {
        results.stats.error++
        results.results.push({ID: FileID, result: "Retreival Failed", processTime: 0, downloadTime: downloadTime})
        it++
        RunTest()
      }
    } else {
      console.log("UNEXPECTED ERROR");
      process.exit()
    }
  })
  .catch(function (error) {
    console.log(error);
    process.exit()
  })
}

const { Worker } = require('worker_threads');

function decryptParallel(data) {
  const threads = new Set();
  var partial = []
  for (let w = 0; w < data.length; w++) {
    threads.add(new Worker(path.join(__dirname, './decryptWorker.js'), {workerData: JSON.stringify({ id: 0, data: data[0], privatekey: privatekey })}))
    partial[w] = ""
  }
  console.log("Workers Created")
  for (let worker of threads) {
    console.log("HEy")
    worker.postMessage("Hello")
    worker.on('error', (err) => { throw err; });
    worker.on('exit', () => {
      threads.delete(worker);
      console.log(`Thread exiting, ${threads.size} running...`);
      if (threads.size === 0) {
        //console.log(primes.join('\n'));
      }
    })
    worker.on('message', (msg) => {
      console.log(msg)
    });
  }
  var flag = false
  /*while (!flag) {
    flag = true
    for (var i = 0; i < partial.length; i++) {
      if (partial[i] == "")
        flag = false
    }
  }*/
  //return 0//completedData
}

function DownloadParallel(FileID) {
  var downloadStart = performance.now()
  var formData = new FormData();
  formData.append("pwd", encryptionPassword);
  formData.append("id", FileID);

  axios({
    method: 'post',
    url: 'http://127.0.0.1:4058/download',
    data: formData,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {'Content-Type': `multipart/form-data; boundary=${formData._boundary}` }
    })
  .then(function (res) {
    var downloadFinish = performance.now()
    var downloadTime = (downloadFinish-downloadStart)
    if (res.data.status == 'COMPLETE') {
      var completedData = [];
      if (res.data) {
        var processStart = performance.now()
        for (var i = 0; i < res.data.data.length; i++) {
          var decryptedDataChunk = decryptParallel(res.data.data[i])
          console.log(decryptedDataChunk)
          completedData = decryptedDataChunk
        }
        if (completedData[completedData.length-1] != '}') {
          completedData+='}'
        }
        if (completedData[completedData.length-2] != '}') {
          completedData+='}'
        }
        var theData = JSON.parse(completedData) // Not sure how TF this closing brace bracket has gone missing!!! Maybe it wandered off just like my drink....
        // And finally now lets save our file for use once more

        var compareResults = "Match Failed"
        if (Buffer.compare(Buffer.from(theData.fileData), fileBuffers[tests[testNum].inputFile].data) == 0) {
          compareResults = "Match Success"
        }

        var processFinish = performance.now()
        var processTime = (processFinish-processStart)

        console.log(`Download Test: ${testNum+1}:${it+1} Result: ${compareResults} Download Return Time: ${downloadTime}ms, Decryption Time: ${processTime}ms  - ID: ${FileID}`);
        results.results.push({ID: FileID, result: compareResults, processTime: processTime, downloadTime: downloadTime})
        results.stats.success++;
        it++
        RunTest()
      } else {
        results.stats.error++
        results.results.push({ID: FileID, result: "Retreival Failed", processTime: 0, downloadTime: downloadTime})
        it++
        RunTest()
      }
    } else {
      console.log("UNEXPECTED ERROR");
      process.exit()
    }
  })
  .catch(function (error) {
    console.log(error);
    process.exit()
  })
}



function RunTest() {
  if (tests[testNum] != undefined) {
    var testIDs = JSON.parse(tests[testNum].data)
    if (it < testIDs.length) {
      DownloadParallel(testIDs[it].ID)
    } else {
      fs.writeFileSync(`./${tests[testNum].testOutputFile}.json`, JSON.stringify(results), (err) => {
          if (err) {throw err;}
      });
      results = {
        stats: {error: 0, success: 0},
        results: []
      }
      it = 0
      testNum++
      RunTest()
    }
  } else {
    console.log(`FINALLY!!  WE ARE DONE! TOTAL PROCESS TIME: ${performance.now() - runTime}`)
  }
}

//NewIteration()
RunTest()
