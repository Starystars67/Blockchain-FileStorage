var fs = require('fs');
const ipc = require('electron').ipcRenderer;
const { dialog } = require('electron').remote
let crypto;
try {
  crypto = require('crypto');
  console.log('crypto required');
} catch (err) {
  console.log('crypto support is disabled!');
}
const axios = require('axios').default;

// ========================================================
// Renderer Running Settings
// ========================================================

var secpassword = "";
var publickey = "";
var privatekey = "";
var publicKeyMaxSize = {lower: 0, upper: 0};
var filedata = "";
var fileName = "";

// ========================================================
// Buttons Functions
// ========================================================

$("#UploadPage").click(function() {
  $('#page-select').hide();
  $('#page-upload').show();
})

$("#DownloadPage").click(function() {
  $('#page-select').hide();
  $('#page-download').show();
})

$(".BackToMainMenu").click(function() {
  $('.page').hide();
  $('#page-select').show();
})

// ========================================================
// Final Functions
// ========================================================

function checkIfReady() {
  if (publickey != "" && filedata != "") {
    $('#UploadData').show();
  }
}

$("#UploadData").click(function() {
  $('#finalStepsModal').modal('show');
})

$("#DOWNLOAD-FILE").click(function() {
  // Attempt to download the file
})

// taken and converted from here: https://www.geeksforgeeks.org/divide-a-string-in-n-equal-parts/
function divideData(databuffer, n) {
  /*
    convert buffer to json then jsonstring put this in ->
    {
      filename: name, + extension
      filedata: (data as a json string)
    }
    then stringify that and mvoe to this:

    get first chunk which is 0 to size/n
    then remove that range from the total data  and start again and continue until remaining data is not a complete size
  */

  var compiledData = {
    "filename": fileName,
    "fileData": databuffer.toJSON()
  }

  var strForm = JSON.stringify(compiledData);
  // get data size
  var str_size = strForm.length;//
  var part_size = Math.floor(str_size / n);
  var dataChunks = [];

  //console.log(compiledData);
  //console.log(strForm)
  console.log(str_size + " -> " + part_size)

  var tempStrData = strForm;
  var i = 0;
  //console.log(tempStrData.length)
  while (tempStrData.length > 0) {
    // If the remaining data - the chunk size is still greater than a chunk size then we make the new chunk with this data.
    if (tempStrData.length - part_size > part_size) {
      dataChunks[i] = tempStrData.substring(0, part_size);
    }
    // If our remaining data will not be a full part size (meaning we likeli will go above the desired chunk count).
    if ((tempStrData.length - part_size) < part_size && i == n - 1) {
      console.log(`Adding Remainder on iteration ${i}`)
      dataChunks[i] = tempStrData
      tempStrData = ''
    }

    i++;
    tempStrData = tempStrData.slice(part_size, tempStrData.length);
    //console.log(tempStrData.length)
    //console.log(tempStrData)
    //console.log(dataChunks)
  }
  //console.log(dataChunks)
  return dataChunks
}

// ========================================================
// File selecting, reading and breaking up stuff
// ========================================================
const findButton = document.getElementById('FINDFile');
findButton.addEventListener('click', function (event) { handleFind(event) });

function handleFind(event) {
  console.log("Find Called")
  $('#manageModal').modal('hide');
  $('#loadingModal').modal('show');
  $('#loadingModalTitle').text('Finding File Record');

  var formData = new FormData();
  formData.append("pwd", $('#filePassword').val());
  formData.append("id", $('#fileIDToFind').val());

  axios({
    method: 'post',
    url: 'https://files.yourthought.co.uk/find',
    data: formData,
    headers: {'Content-Type': 'multipart/form-data' }
    })
  .then(function (res) {
    console.log(res.data);
    $('#loadingModal').modal('hide');
    if (res.data.status == 'COMPLETE') {
      $('#manageResultsModal').modal('show');
    } else {
      console.log('ERROR!!')
      $('#errorSpan').text(res.data.msg)
    }
  })
  .catch(function (error) {
    console.log(error);
  })
};

const deleteFileButton = document.getElementById('DELETE-FILE');

deleteFileButton.addEventListener('click', function (event) {
  console.log('User Wants to Delete the file! Are they sure?')
  $('#deleteModal').modal('show')
})

const confirmDeleteFileButton = document.getElementById('DELETE-FILE-CONFIRM');

confirmDeleteFileButton.addEventListener('click', function (event) {
  console.log("Yep, they are sure about deleting it!")
  $('#manageModal').modal('hide');
  $('#loadingModal').modal('show');
  $('#loadingModalTitle').text('Deleting File...');

  var formData = new FormData();
  formData.append("pwd", $('#filePassword').val());
  formData.append("id", $('#fileIDToFind').val());

  axios({
    method: 'post',
    url: 'https://files.yourthought.co.uk/remove',
    data: formData,
    headers: {'Content-Type': 'multipart/form-data' }
    })
  .then(function (res) {
    console.log(res.data);
    $('#loadingModal').modal('hide');
    if (res.data.status == 'COMPLETE') {
      //$('#manageResultsModal').modal('show');
      // TODO: ADD Data Decryption here!
      $('#loadingModal').modal('hide');
      $('#successModal').modal('show');
      $('#successSpan').text(res.data.msg)
    } else {
      console.log('ERROR!!')
      $('#loadingModal').modal('hide');
      $('#errorModal').modal('show');
      $('#errorSpan').text(res.data.msg)
    }
  })
  .catch(function (error) {
    console.log(error);
    $('#loadingModal').modal('hide');
    $('#errorModal').modal('show');
    $('#errorSpan').text(error)
  })
})

const modalCancelButton = document.getElementById('ModalCancelButton_1');
modalCancelButton.addEventListener('click', function (event) { handleCancel(event) });

function handleCancel(event) {
  console.log('Cancel Called')
  $('#manageModal').modal('hide');
  $('#loadingModal').modal('hide');
}

const finalSubmitButton = document.getElementById('FinalSubmit');

finalSubmitButton.addEventListener('click', function (event) {
  console.log("Submit Called")
  $('#finalStepsModal').modal('hide');
  $('#loadingModal').modal('show');
  $('#loadingModalTitle').text('Encrypting Data');
  var chunkAmount = $('#fileChunks').val();
  var data = divideData(filedata, chunkAmount)
  //console.log(data)
  for (var i = 0; i < data.length; i++) {
    //console.log("attempt: "+i)

    // So we need to break up this chunk into bite size chunks that we can encrypt
    var temp = data[i]
    data[i] = [];
    var subData = 0;
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
  console.log("=========================================")
  console.log("       ENCRYPTED DATA AS FOLLOWS   ")
  console.log("=========================================")
  console.log(data)
  console.log(`Typeof: ${typeof(data)}`)
  console.log("=========================================")

  var formData = new FormData();
  formData.append("pwd", $('#encryptionPassword').val());
  formData.append("chunks", chunkAmount);
  formData.append("data", JSON.stringify(data));
  $('#loadingModalTitle').text('Uploading Data');

  axios({
    method: 'post',
    url: 'https://files.yourthought.co.uk/',
    data: formData,
    headers: {'Content-Type': 'multipart/form-data' }
    })
  .then(function (res) {
    console.log(res.data);
    $('#loadingModal').modal('hide');
    if (res.data.status == 'COMPLETE') {
      $('#uploadSuccessModal').modal('show');
      $('#fileID').text(res.data.fileID)
    }
  })
  .catch(function (error) {
    console.log(error);
  })
});

function isPrime( n ) {
    var max = Math.sqrt(n);
    for( var i = 2;  i <= max;  i++ ) {
        if( n % i === 0 )
            return false;
    }
    return true;
}

const publicKeyButton = document.getElementById('publicKeyButton');

publicKeyButton.addEventListener('click', function (event) {
  ipc.send('open-file-dialog-for-file-publicKey')
});

ipc.on('selected-file-publicKey', function (event, path) {
  console.log('Public Key Full path: ', path);
  var fileNamePK = path.split("\\").pop();
  $('#publicKeyText').val(fileNamePK);
  fs.readFile(path, function(err,data){
    if (!err) {
      console.log('received data: ')
      console.log(data);
      var strForm = data.toString();
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
      console.log(x);
      x = new Buffer(x, 'base64');
      console.log(x.length)

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

      publicKeyMaxSize.lower = lastPrime / 8;
      publicKeyMaxSize.upper = lastPrime
      console.log(publicKeyMaxSize)

      publickey = data;
      checkIfReady();
    } else {
      console.log(err);
    }
  });
});

const privateKeyButton = document.getElementById('privateKeyButton');

privateKeyButton.addEventListener('click', function (event) {
  console.log("Looking for a private key, anyone have one?")
  ipc.send('open-file-dialog-for-file-privateKey')
});

ipc.on('selected-file-privateKey', function (event, path) {
  console.log('Private Key Full path: ', path);
  var fileNamePK = path.split("\\").pop();
  $('#privateKeyText').val(fileNamePK);
  fs.readFile(path, function(err,data){
    if (!err) {
      console.log('received data: ')
      console.log(data);
      var strForm = data.toString();
      strForm = strForm.replace('-----BEGIN ENCRYPTED PRIVATE KEY-----','');
      strForm = strForm.replace('-----END ENCRYPTED PRIVATE KEY-----','');
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
      console.log(x);
      privatekey = data;
    } else {
      console.log(err);
    }
  });
});

const downloadButton = document.getElementById('DOWNLOAD-FILE');

downloadButton.addEventListener('click', function (event) {
  console.log("Download Called")
  $('#manageModal').modal('hide');
  $('#loadingModal').modal('show');
  $('#loadingModalTitle').text('Retreiving File Data...');

  var formData = new FormData();
  formData.append("pwd", $('#filePassword').val());
  formData.append("id", $('#fileIDToFind').val());

  axios({
    method: 'post',
    url: 'https://files.yourthought.co.uk/download',
    data: formData,
    headers: {'Content-Type': 'multipart/form-data' }
    })
  .then(function (res) {
    console.log(res.data);
    $('#loadingModal').modal('hide');
    if (res.data.status == 'COMPLETE') {
      //$('#manageResultsModal').modal('show');
      // Now lets decrypt the uploaded data to make it useable again.
      // I hope you brought your private key?
      var completedData = [];
      if (res.data) {
        console.log(res.data.data.length)
        for (var i = 0; i < res.data.data.length; i++) {
          //console.log(res.data.data[i])
          for (var j = 0; j < res.data.data[i].length; j++) {
            console.log(res.data.data[i][j])
            var t = crypto.privateDecrypt(
            	{
            		key: privatekey,
                passphrase: $('#PrivateKeyPassPhrase').val(),
            		// In order to decrypt the data, we need to specify the
            		// same hashing function and padding scheme that we used to
            		// encrypt the data in the previous step
            		padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            		oaepHash: "sha256",
            	},
            	new Buffer(res.data.data[i][j], 'base64')
            )
            completedData += t
            console.log(t)
          }
        }
        console.log(completedData)
        console.log(typeof(completedData))
        console.log(completedData[completedData.length-1])
        if (completedData[completedData.length-1] != '}') {
          completedData+='}'
        }
        if (completedData[completedData.length-2] != '}') {
          completedData+='}'
        }
        var theData = JSON.parse(completedData) // Not sure how TF this closing brace bracket has gone missing!!! Maybe it wandered off just like my drink....
        // And finally now lets save our file for use once more
        $('#loadingModal').modal('hide');
        ipc.send('save-file', theData)
      } else {
        console.log('Seems the file contents have been removed in the past.')
        $('#loadingModal').modal('hide');
        $('#errorModal').modal('show');
        $('#errorSpan').text('The file contents were removed from the system and therefore are no longer available.')
      }
    } else {
      console.log('ERROR!!')
      $('#errorSpan').text(res.data.msg)
      $('#loadingModal').modal('hide');
      $('#errorModal').modal('show');
    }
  })
  .catch(function (error) {
    console.log(error);
  })
});

const uploadFileButton = document.getElementById('uploadFileButton');

uploadFileButton.addEventListener('click', function (event) {
  ipc.send('open-file-dialog-for-file-uploadFile')
});

ipc.on('selected-file-uploadFile', function (event, path) {
  console.log('Upload File Full path: ', path);
  fileName = path.split("\\").pop();
  $('#uploadFileText').val(fileName);
  fs.readFile(path, function(err,data){ // , {encoding: 'utf-8'}
    if (!err) {
      console.log('received data: ');
      console.log(data)
      filedata = data;
      checkIfReady();
    } else {
      console.log(err);
    }
  });
});

function showkeygen() {
  $('#keygenModal').modal('show');
}

function retreiveFile() {
  $('#manageModal').modal('show');
}


// ========================================================
// Private & Public Key Gen stuff
// ========================================================

$("#GenKeys").click(function() {
  $('#keygenModal').modal('hide');
  var passPhrase = $("#passphrase").val();
  $("#passphrase").val("");
  $('#loadingModal').modal('show');
  $('#loadingModalTitle').text('Generating Key Pair');
  console.log("Generating new Key pair.")
  var publicKeyOptions = {
    title: "Save file",
    defaultPath : "publicKey",
    buttonLabel : "Save",

    filters :[
      {name: 'pem', extensions: ['pem',]}
    ]
  }
  var privateKeyOptions = {
    title: "Save file",
    defaultPath : "privateKey",
    buttonLabel : "Save",

    filters :[
      {name: 'pem', extensions: ['pem',]}
    ]
  }

  // help from here: https://stackoverflow.com/questions/8520973/how-to-create-a-pair-private-public-keys-using-node-js-crypto/52775583
  const { generateKeyPair } = require('crypto');
  generateKeyPair('rsa', {
    modulusLength: 12288, // 12288 bits = 1536 bytes
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: passPhrase
    }
  }, (err, publicKey, privateKey) => {
    // Handle errors and use the generated key pair.
    $('#loadingModal').modal('hide');
    dialog.showSaveDialog( publicKeyOptions, (filename) => {
      fs.writeFileSync(filename, publicKey, 'utf-8');
      console.log("Public Key Generated and Saved.");
    })
    dialog.showSaveDialog( privateKeyOptions, (filename) => {
      fs.writeFileSync(filename, privateKey, 'utf-8');
      console.log("Private Key Generated and Saved.");
    })
  });
});
