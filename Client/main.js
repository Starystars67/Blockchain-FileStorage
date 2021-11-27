const path = require('path')
const os = require('os');
var argv = require('minimist')(process.argv.slice(2));
const { app, BrowserWindow, ipcMain, dialog } = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')

  // Open the DevTools.
  if (argv._.includes('dev')) {
    win.webContents.openDevTools()
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('open-file-dialog-for-file-publicKey', function (event) {
 if(os.platform() === 'linux' || os.platform() === 'win32'){
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters :[
          {name: 'pem', extensions: ['pem',]}
        ]
    }, function (files) {
       if (files) event.sender.send('selected-file-publicKey', files[0]);
    });
} else {
    dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory'],
        filters :[
          {name: 'pem', extensions: ['pem',]}
        ]
    }, function (files) {
        if (files) event.sender.send('selected-file-publicKey', files[0]);
    });
}});

ipcMain.on('open-file-dialog-for-file-privateKey', function (event) {
  console.log("Sorry we do not have one, we are just an application, lets ask the user to give us one.")
 if(os.platform() === 'linux' || os.platform() === 'win32'){
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters :[
          {name: 'pem', extensions: ['pem',]}
        ]
    }, function (files) {
       if (files) event.sender.send('selected-file-privateKey', files[0]);
    });
} else {
    dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory'],
        filters :[
          {name: 'pem', extensions: ['pem',]}
        ]
    }, function (files) {
        if (files) event.sender.send('selected-file-privateKey', files[0]);
    });
}});

ipcMain.on('open-file-dialog-for-file-uploadFile', function (event) {
 if(os.platform() === 'linux' || os.platform() === 'win32'){
    dialog.showOpenDialog({
        properties: ['openFile']
    }, function (files) {
       if (files) event.sender.send('selected-file-uploadFile', files[0]);
    });
} else {
    dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory']
    }, function (files) {
        if (files) event.sender.send('selected-file-uploadFile', files[0]);
    });
}});

ipcMain.on('save-file', function (event, data) {
  console.log(data)
 if(os.platform() === 'linux' || os.platform() === 'win32'){
    dialog.showSaveDialog({
        properties: ['showOverwriteConfirmation', 'dontAddToRecent'],
        title: 'Save file from network',
        defaultPath: data.filename
    }, function (filePath) {
      console.log(filePath)
      if (filePath.length > 1) {
        require('fs').writeFileSync(filePath, Buffer.from(data.fileData.data));
      }
    });
} else {
    dialog.showSaveDialog({
        properties: ['showOverwriteConfirmation', 'openDirectory', 'dontAddToRecent'],
        title: 'Save file from network',
        defaultPath: data.filename
    }, function (filePath) {
      console.log(filePath)
      if (filePath.length > 1) {
        require('fs').writeFileSync(filePath, Buffer.from(data.fileData.data));
      }
    });
}});
