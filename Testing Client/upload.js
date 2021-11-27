console.clear()
var crypto = require('crypto');
var fs = require('fs');
var { performance } = require('perf_hooks');
var FormData = require('form-data');
const axios = require('axios').default;


var runTime = performance.now()


var stats = {
  error: 0,
  success: 0
}

var files = []
var runFileName = ''
var iterations = 1000
var testNum = 0
var filedata = ''
var fileName = ''
var it = 0
var encryptionPassword = 'TEST'
var chunkAmount = 10

var tests = [
  {testOutputFile: 'Run-100-1kb-txt', inputFile: '1kb.txt', it: 100},
  {testOutputFile: 'Run-100-500kb-txt', inputFile: '500kb.txt', it: 100},
  {testOutputFile: 'Run-100-1mb-txt', inputFile: '1mb.txt', it: 100},
  {testOutputFile: 'Run-1000-1kb-txt', inputFile: '1kb.txt', it: 1000},
  {testOutputFile: 'Run-1000-500kb-txt', inputFile: '500kb.txt', it: 1000},
  {testOutputFile: 'Run-1000-1mb-txt', inputFile: '1mb.txt', it: 1000},
]

// Load Test Files
var fileBuffers = {
  '1kb.txt': {data: fs.readFileSync(`./data/1kb.txt`), name: '1kb.txt'},
  '500kb.txt': {data: fs.readFileSync(`./data/500kb.txt`), name: '500kb.txt'},
  '1mb.txt': {data: fs.readFileSync(`./data/1mb.txt`), name: '1mb.txt'}
}

// PublicKey Passphrase
// Load Public Key
var publickey = fs.readFileSync(`./publicKey.pem`);
var strForm = publickey.toString();
strForm = strForm.replace('-----BEGIN PUBLIC KEY-----','');
strForm = strForm.replace('-----END PUBLIC KEY-----','');
strForm = strForm.split(/\r|\n/)
for (var i = 0; i < strForm.length; i++) {
  if (strForm[i] == "") {
    strForm.splice(i,1);
    i--;
  }
}
var x = ""
for (var i = 0; i < strForm.length; i++) {
  x += strForm[i];
}
x = x.replace(/\r|\n/,'')
x = new Buffer(x, 'base64');

// Need to find the modulus.
// generate prime
// check if prime / 8 is greater than x.length then use the previous prime as our working number
var num = 1;
var modulusFound = false
var lastPrime = 0
while (!modulusFound) {
  if (isPrime(num)) {
    //console.log(`${num / 8} > ${x.length}`)
    if (num / 8 > x.length) {
      modulusFound = true
    } else {
      lastPrime = num
      num++
    }
  } else {
    num++
  }
}

function isPrime( n ) {
    var max = Math.sqrt(n);
    for( var i = 2;  i <= max;  i++ ) {
        if( n % i === 0 )
            return false;
    }
    return true;
}

var publicKeyMaxSize = {lower: 0, upper: 0};

publicKeyMaxSize.lower = lastPrime / 8;
publicKeyMaxSize.upper = lastPrime
console.log(publicKeyMaxSize)

function divideData(databuffer, n) {
  var compiledData = {
    "filename": fileName,
    "fileData": databuffer.toJSON()
  }
  var strForm = JSON.stringify(compiledData);
  var str_size = strForm.length;//
  var part_size = Math.floor(str_size / n);
  var dataChunks = [];

  var tempStrData = strForm;
  var i = 0;
  while (tempStrData.length > 0) {
    // If the remaining data - the chunk size is still greater than a chunk size then we make the new chunk with this data.
    if (tempStrData.length - part_size > part_size) {
      dataChunks[i] = tempStrData.substring(0, part_size);
    }
    // If our remaining data will not be a full part size (meaning we likeli will go above the desired chunk count).
    if ((tempStrData.length - part_size) < part_size && i == n - 1) {
      dataChunks[i] = tempStrData
      tempStrData = ''
    }

    i++;
    tempStrData = tempStrData.slice(part_size, tempStrData.length);
  }
  return dataChunks
}

function NewIteration() {
  if (iterations > it) {
    // For this iteration lets encrypt and then upload
    var processStart = performance.now()
    var data = divideData(filedata, chunkAmount)
    //console.log(data.length)
    for (var i = 0; i < data.length; i++) {
      //console.log("attempt: "+i)
      //console.log(data[i])

      // So we need to break up this chunk into bite size chunks that we can encrypt
      var temp = data[i]
      data[i] = [];
      var subData = 0;
      if (temp != undefined) {
        while (temp.length > 0) {
          //console.log(temp)
          data[i][subData] = temp.substring(0, Math.floor(publicKeyMaxSize.lower/2))
          temp = temp.slice(Math.floor(publicKeyMaxSize.lower/2), temp.length);
          //console.log(data[i][subData])
          //console.log(`Attempting Encryption`)

          data[i][subData] = crypto.publicEncrypt(
            {
              key: publickey,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: "sha256",
            },
            // We convert the data string to a buffer using `Buffer.from`
            Buffer.from(data[i][subData])
          )

          subData++;
        }
      }
    }
    var processFinish = performance.now()
    var processTime = (processFinish-processStart)

    var uploadStart = performance.now()
    var formData = new FormData();
    formData.append("pwd", encryptionPassword);
    formData.append("chunks", chunkAmount);
    formData.append("data", JSON.stringify(data));

    //console.log('boundary:', formData._boundary);

    axios({
      method: 'post',
      url: 'http://127.0.0.1:4058',
      data: formData,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {'Content-Type': `multipart/form-data; boundary=${formData._boundary}` }
    })
    .then(function (res) {
      var uploadFinish = performance.now()
      var uploadTime = (uploadFinish-uploadStart)
      console.log(`Test: ${testNum+1} Iteration: ${it}/${iterations}: Process/Encryption Time: ${processTime}ms, Upload Return Time: ${uploadTime}ms  - ID: ${res.data.fileID}`);
      files.push({ID: res.data.fileID, processTime: processTime, uploadTime: uploadTime})
      stats.success++;
      it++;
      NewIteration();
    })
    .catch(function (error) {
      console.log(error);
      stats.error++;
      it++;
      NewIteration();
    })
  } else {
    console.log(`\nUploading Test ${testNum+1} Complete. Errors: ${stats.errors} Success: ${stats.success}\nFile ID's: `)
    //console.log(files)
    fs.writeFileSync(`./${runFileName}.json`, JSON.stringify(files), (err) => {
        if (err) {throw err;}
    });
    testNum++
    RunTest()
  }
}


function RunTest() {
  if (tests[testNum] != undefined) {
    files = []
    stats = {error: 0, success: 0}
    it = 0
    runFileName = tests[testNum].testOutputFile
    iterations = tests[testNum].it
    filedata = fileBuffers[tests[testNum].inputFile].data
    fileName = fileBuffers[tests[testNum].inputFile].name
    NewIteration()
  } else {
    console.log(`FINALLY!!  WE ARE DONE! TOTAL PROCESS TIME: ${performance.now() - runTime}`)
  }
}

//NewIteration()
RunTest()
