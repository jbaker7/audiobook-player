const {app, BrowserWindow, Menu, dialog, ipcMain} = require('electron');
import StateManager from './manageState.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let currentState = new StateManager(app.getPath('userData'));

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
          id: "library-view-status",
          type: "checkbox"},
        {label: "Theme",
          submenu: [
            {label: "Light",
            id: "light",
            type: "radio",
            click: toggleTheme},
            {label: "Dark",
            id: "dark",
            type: "radio",
            click: toggleTheme}
          ]},
        {label: "Reload",
          role: 'reload'}
    ]
  }
];

let readyToClose = 0;

const createWindow = () => {
  // Create the browser window.
  let windowWidth = 800;
  if(!currentState.libraryIsVisible) {
    windowWidth = 400;
  }
  const mainWindow = new BrowserWindow({
    width: windowWidth,
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
  menu.getMenuItemById("library-view-status").checked = currentState.libraryIsVisible;

  mainWindow.on('close', (e) => { //Let renderer know it's closing so it can send back preferences.
    if (readyToClose === 0) {
        e.preventDefault();
        mainWindow.webContents.send('closing', 'Application is closing.'); 
    }
  })
};

ipcMain.on('prefs', (event, [action, prefs]) => { //Set listener for when preferences are requestion or should be updated.

  if (action === "get") {
    event.reply('prefReply', currentState.getPreferences());
  }

  if (action === "set") {
    currentState.setPreferences(prefs);
  }
})

ipcMain.on('playback', (event, [file, position]) => { //Set listener for when playback position should be updated.
  if (typeof position === "number") {
    currentState.setPlaybackPosition(file, position);
  }
  else {
    let savedPosition = currentState.getPlaybackPosition(file);
    event.returnValue = savedPosition;
  }
})

ipcMain.on('closed', (event, [file, position, prefs]) => {

  readyToClose = 1;
  if (typeof position === "number") {
    currentState.setPlaybackPosition(file, position);
  }
  currentState.setPreferences(prefs);
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

function toggleLibraryView(item, browserWindow, event) {

  let [width, height] = browserWindow.getSize();
  browserWindow.webContents.send("viewChange", item.checked);
  currentState.libraryIsVisible = item.checked;

  if(!item.checked) {
    browserWindow.setSize(width / 2, height);
  }
  else {
    browserWindow.setSize(width * 2, height);
  }
}

function toggleTheme(item, browserWindow, event) {

  currentState.theme = item.id;
  browserWindow.webContents.send("themeChange", item.id);
}

function chooseFolder(item, browserWindow, event) {
  
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(result => {
    if (!result.canceled) {
      currentState.libraryFolder = result.filePaths[0];
      browserWindow.webContents.send("libraryChange", result.filePaths[0]);
    }
  }).catch(err => {
    console.log(err)
  })
}

currentState.initializeState()
  .then((data) => {
    console.log(data)
    if (app.isReady()) {
      createWindow();
    }
    else {
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
    }
  })
  .catch((data) => console.log(data))