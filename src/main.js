const {app, BrowserWindow, Menu, dialog, ipcMain} = require('electron');
const StateManager = require('./manageState.js');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let applicationMenuTemplate = [
  {
      label: "Library",
      submenu: [
          {label: "Choose Folder...",
          click: chooseFolder}
      ]
  },
  {
    label: "View",
    submenu: [
        {label: "Show Library",
          click: toggleLibraryView,
          checked: true,
          id: "library-view-status",
          type: 'checkbox'},
        {label: "Reload",
          role: 'reload'}
    ]
  }
];

let currentState = new StateManager(app.getPath('userData'));

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();

  let menu = Menu.buildFromTemplate(applicationMenuTemplate);
  Menu.setApplicationMenu(menu);
};

ipcMain.on('prefs', (event, arg) => {
  event.reply('appPathReply', currentState.getLibraryFolder())
})

function toggleLibraryView(item, browserWindow, event) {

  let [width, height] = browserWindow.getSize();
  browserWindow.webContents.send("viewChange", item.checked);

  if(!item.checked) {
    browserWindow.setSize(width / 2, height);
  }
  else {
    browserWindow.setSize(width * 2, height);
  }
}


function chooseFolder(item, browserWindow, event) {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(result => {
    if (!result.canceled) {
      currentState.setLibraryFolder(result.filePaths[0])
      browserWindow.webContents.send("libraryChange", result.filePaths[0])
    }
  }).catch(err => {
    console.log(err)
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
