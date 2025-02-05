import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import os from 'os';
import { exec } from 'child_process';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

; (async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})


ipcMain.on('export-and-open-chrome', async (event, { filePath, dataToSave }: any) => {
  // Encode the file path for URL
  await fs.writeFileSync(`${os.tmpdir()}/${filePath}`, dataToSave)
  const encodedPath = encodeURIComponent(`${os.tmpdir()}/${filePath}`);
  const url = `https://www.google.com/search?q=${encodedPath}`;

  let command: string;

  if (os.platform() === 'win32') {
    // Windows
    command = `start chrome "${url}"`;
  } else if (os.platform() === 'darwin') {
    // macOS
    command = `open -a "Google Chrome" "${url}"`;
  } else {
    // Linux (assuming Google Chrome is installed and in PATH)
    command = `google-chrome "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.error(`Failed to open Chrome: ${error.message}`);
    } else {
      console.log(`Chrome opened with URL: ${url}`);
    }
  });
});