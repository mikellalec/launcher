'use strict'

import {app, protocol, globalShortcut, BrowserWindow, dialog} from 'electron'
import {autoUpdater, UpdateInfo} from 'electron-updater'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null

autoUpdater.on("update-downloaded", async (info: UpdateInfo) => {
  console.warn(`Update downloaded: ${info.version}`)

  if (win instanceof BrowserWindow) {
    const buttonIndex = await dialog.showMessageBox(win, {
      type: "info",
      title: `New version ${info.version}`,
      message: `A new version (${info.version}) of the launcher is out, please update`,
      buttons: ['Update and restart']
    })

    if (buttonIndex.response === 0) {
      const isSilent = true;
      const isForceRunAfter = true;
      autoUpdater.quitAndInstall(isSilent, isForceRunAfter);
    }
  }
})

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

app.allowRendererProcessReuse = false;

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

function createWindow() {
  // Create the browser window.

  win = new BrowserWindow({
    width: 1100,
    height: 720,
    resizable: false,
    frame: false,
    titleBarStyle: 'hidden',
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  const log = require("electron-log")
  log.transports.file.level = "debug"
  autoUpdater.logger = log
  await autoUpdater.checkForUpdatesAndNotify();
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
