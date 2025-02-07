// import {
//   screen,
//   BrowserWindow,
//   BrowserWindowConstructorOptions,
//   Rectangle,
// } from 'electron'
// import Store from 'electron-store'

// export const createWindow = (
//   windowName: string,
//   options: BrowserWindowConstructorOptions
// ): BrowserWindow => {
//   const key = 'window-state'
//   const name = `window-state-${windowName}`
//   const store = new Store<Rectangle>({ name })
//   const defaultSize = {
//     width: options.width,
//     height: options.height,
//   }
//   let state = {}

//   const restore = () => store.get(key, defaultSize)

//   const getCurrentPosition = () => {
//     const position = win.getPosition()
//     const size = win.getSize()
//     return {
//       x: position[0],
//       y: position[1],
//       width: size[0],
//       height: size[1],
//     }
//   }

//   const windowWithinBounds = (windowState, bounds) => {
//     return (
//       windowState.x >= bounds.x &&
//       windowState.y >= bounds.y &&
//       windowState.x + windowState.width <= bounds.x + bounds.width &&
//       windowState.y + windowState.height <= bounds.y + bounds.height
//     )
//   }

//   const resetToDefaults = () => {
//     const bounds = screen.getPrimaryDisplay().bounds
//     return Object.assign({}, defaultSize, {
//       x: (bounds.width - defaultSize.width) / 2,
//       y: (bounds.height - defaultSize.height) / 2,
//     })
//   }

//   const ensureVisibleOnSomeDisplay = (windowState) => {
//     const visible = screen.getAllDisplays().some((display) => {
//       return windowWithinBounds(windowState, display.bounds)
//     })
//     if (!visible) {
//       // Window is partially or fully not visible now.
//       // Reset it to safe defaults.
//       return resetToDefaults()
//     }
//     return windowState
//   }

//   const saveState = () => {
//     if (!win.isMinimized() && !win.isMaximized()) {
//       Object.assign(state, getCurrentPosition())
//     }
//     store.set(key, state)
//   }

//   state = ensureVisibleOnSomeDisplay(restore())

//   const win = new BrowserWindow({
//     ...state,
//     ...options,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       ...options.webPreferences,
//     },
//   })

//   win.on('close', saveState)

//   return win
// }


import { screen, BrowserWindow, BrowserWindowConstructorOptions, Rectangle, ipcMain } from 'electron';
import { exec,execSync } from 'child_process';
import Store from 'electron-store';


export const createWindow = (windowName: string, options: BrowserWindowConstructorOptions): BrowserWindow => {
  const key = 'window-state';
  const name = `window-state-${windowName}`;
  const store = new Store<Rectangle>({ name });
  const defaultSize = {
    width: options.width,
    height: options.height,
  };
  let state = {};

  const restore = () => store.get(key, defaultSize);

  const getCurrentPosition = () => {
    const position = win.getPosition();
    const size = win.getSize();
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    };
  };

  const windowWithinBounds = (windowState, bounds) => {
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    );
  };

  const resetToDefaults = () => {
    const bounds = screen.getPrimaryDisplay().bounds;
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2,
    });
  };

  const ensureVisibleOnSomeDisplay = (windowState) => {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(windowState, display.bounds);
    });
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults();
    }
    return windowState;
  };

  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition());
    }
    store.set(key, state);
  };

  state = ensureVisibleOnSomeDisplay(restore());

  const win = new BrowserWindow({
    ...state,
    ...options,
    webPreferences: {
      nodeIntegration: false, // This should be false for security reasons
      contextIsolation: true, // Enable contextIsolation
      ...options.webPreferences,
    },
  });

  win.on('close', saveState);

// Function to get running applications
function getRunningApplications(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const command = `powershell -Command "Get-Process | Where-Object { $_.MainWindowTitle } | Select-Object ProcessName, MainWindowTitle, Id | ConvertTo-Json"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error fetching running apps: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`PowerShell error: ${stderr}`);
        return;
      }
      try {
        const processes = JSON.parse(stdout);
        resolve(processes);
      } catch (parseError) {
        reject(`Failed to parse process list: ${parseError.message}`);
      }
    });
  });
}

// IPC handler to get running applications
ipcMain.handle('get-running-apps', async () => {
  try {
    const runningApps = await getRunningApplications();
    return runningApps;
  } catch (error) {
    throw new Error(`Failed to get running apps: ${error.message}`);
  }
});

// IPC handler to check if Tally is running
ipcMain.handle('is-tally-running', async () => {
  try {
    const runningApps = await getRunningApplications();
    const tallyProcess = runningApps.find((app: any) =>
      app.ProcessName.toLowerCase().includes('tally')
    );
    return !!tallyProcess;
  } catch (error) {
    throw new Error(`Failed to check Tally status: ${error.message}`);
  }
});


// Function to search for Tally in installed applications
function findTallyInstallationPath(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const command = `powershell -Command "Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Where-Object { $_.DisplayName -like '*Tally*' } | Select-Object -ExpandProperty InstallLocation"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error searching for Tally: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`PowerShell error: ${stderr}`);
        return;
      }
      const installPath = stdout.trim();
      resolve(installPath || null);
    });
  });
}

// Function to search for Tally in common directories
function searchCommonDirectories(): string | null {
  const commonPaths = [
    'C:\\Program Files\\Tally.ERP9',
    'C:\\Program Files (x86)\\Tally.ERP9',
    'C:\\Tally.ERP9',
    'C:\\Program Files\\TallyPrime',
    'C:\\Program Files (x86)\\TallyPrime',
    'C:\\TallyPrime'
  ];

  for (const path of commonPaths) {
    try {
      const exePath = `${path}\\Tally.ERP9.exe`;
      execSync(`dir "${exePath}"`);
      return exePath;
    } catch (e) {
      try {
        const exePath = `${path}\\TallyPrime.exe`;
        execSync(`dir "${exePath}"`);
        return exePath;
      } catch (e) {}
    }
  }
  return null;
}

function bringTallyToForeground(): Promise<void> {
  return new Promise((resolve, reject) => {
    // PowerShell command to find Tally process and bring it to the foreground
    const command = `powershell -Command `
      + `"Get-Process | Where-Object { $_.ProcessName -like '*Tally*' } | `
      + `ForEach-Object { (New-Object -ComObject WScript.Shell).AppActivate($_.Id) }"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error bringing Tally to foreground: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`PowerShell error: ${stderr}`);
        return;
      }
      resolve();
    });
  });
}

ipcMain.handle('bring-tally-to-foreground', async () => {
  try {
    await bringTallyToForeground();
    return 'Tally window brought to the foreground';
  } catch (error) {
    throw new Error(`Failed to bring Tally to foreground: ${error.message}`);
  }
});


  return win;
};
