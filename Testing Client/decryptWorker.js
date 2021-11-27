const { isMainThread, parentPort, workerData } = require('worker_threads');
var crypto = require('crypto');
let workerdata = JSON.parse(workerData)
parentPort.on('message', (msg) => {
  console.log(msg)
});
console.log("TEST")
console.log("TEST2")
if (!isMainThread){
  console.log("Worker Created")
  var t = crypto.privateDecrypt(
    {
      key: workerdata.privatekey,
      passphrase: "test",
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    new Buffer(workerdata.data, 'base64')
  )
  console.log(`Worker ${workerdata.id} Completed!`)
  parentPort.postMessage({id: workerdata.id, data: t})
  process.exit()
} else {
  console.log("I SHOULD BE RUN AS A WORKER. NOT A MAIN PROCESS")
}
