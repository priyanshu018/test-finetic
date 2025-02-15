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
import { exec, execSync } from 'child_process';
import Store from 'electron-store';
import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';
import { coolGray } from 'tailwindcss/colors';

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
        } catch (e) { }
      }
    }
    return null;
  }

  function bringTallyToForegroundAndSendKeys(keys: string[], delayBeforeY: number = 2000): Promise<void> {
    return new Promise((resolve, reject) => {
      // Convert the keys array into a single string for PowerShell
      const keysString = keys.join('');
  
      // PowerShell command to find Tally process, bring it to the foreground, and send keys
      const command = `powershell -Command `
        + `"$tallyProcess = Get-Process | Where-Object { $_.ProcessName -like '*Tally*' }; `
        + `if ($tallyProcess) { `
        + `  (New-Object -ComObject WScript.Shell).AppActivate($tallyProcess.Id); `
        + `  Start-Sleep -Milliseconds 500; ` // Wait for the window to come to the foreground
        + `  [System.Windows.Forms.SendKeys]::SendWait('${keysString}'); `
        + `  Start-Sleep -Milliseconds ${delayBeforeY}; ` // Wait for the overwrite prompt
        + `  [System.Windows.Forms.SendKeys]::SendWait('y'); ` // Send 'y' to confirm overwrite
        + `} else { `
        + `  throw 'No Tally process found'; `
        + `}"`;
  
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${error.message}`);
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
  
  function getTallyInstallPath(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check both 32-bit and 64-bit registry paths
      const command = `powershell -Command `
        + `"$tallyPath = (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Tally.ERP 9' -ErrorAction SilentlyContinue).InstallPath; `
        + `if (-not $tallyPath) { $tallyPath = (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\WOW6432Node\\Tally.ERP 9' -ErrorAction SilentlyContinue).InstallPath; } `
        + `if ($tallyPath) { $tallyPath } else { 'C:\\Program Files\\TallyPrime' }"`; // Fallback to default path
  
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          reject(`PowerShell error: ${stderr}`);
          return;
        }
        resolve(stdout.trim()); // Return the installation path
      });
    });
  }


  function removeBOM(content: string): string {
    const buffer = Buffer.from(content, 'utf-8');
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      content = buffer.slice(3).toString('utf-8');
    }
  
    // Remove ∩┐╜ characters and invisible Unicode characters
    content = content.replace(/∩┐╜+/g, '').replace(/[^\x20-\x7E\n\r\t<>]/g, ''); 
  
    return content;
  }
  
  async function exportAndCheckLedger(ledgerName: string): Promise<boolean> {
    try {
      // Step 1: Get Tally installation path
      const tallyInstallPath = await getTallyInstallPath();
      const exportedFilePath = `${tallyInstallPath}\\master.xml`;
  
      console.log(`Tally installation path: ${tallyInstallPath}`);
      console.log(`Exporting file to: ${exportedFilePath}`);
  
      // Step 2: Trigger Tally export
      const keys = ['%e', 'm', 'e', '{ENTER}'];
      await bringTallyToForegroundAndSendKeys(keys, 1000);
      console.log('Tally export triggered successfully.');
  
      // Step 3: Wait to ensure file is fully exported
      console.log('Waiting for the file to be exported...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
  
      // Step 4: Ensure the file exists
      if (!fs.existsSync(exportedFilePath)) {
        throw new Error(`Exported file not found at ${exportedFilePath}.`);
      }
  
      // Step 5: Read and clean XML file
      let xmlData = fs.readFileSync(exportedFilePath, { encoding: 'utf-8' });
      xmlData = removeBOM(xmlData);
  
      // Debug: Log cleaned XML start
      console.log("Cleaned XML Data (First 50 chars):", xmlData.slice(0, 50));
  
      // Step 6: Validate XML content
      if (!xmlData.trim().startsWith('<ENVELOPE>')) {
        throw new Error('File content is not valid XML.');
      }
  
      // Step 7: Parse XML
      const parsedXml = await parseStringPromise(xmlData, { explicitArray: false });
      console.log('Parsed XML Data:', JSON.stringify(parsedXml, null, 2));
  
      // Step 8: Extract LEDGER details
      const tallyMessages = parsedXml?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
  
      if (!tallyMessages) {
        throw new Error('No TALLYMESSAGE found in the XML file.');
      }
  
      // Ensure TALLYMESSAGE is an array
      const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];
  
      // Extract all LEDGER elements
      const ledgers = messagesArray.map((msg: any) => msg.LEDGER).filter(Boolean);
  
      // Check if ledger exists by matching `ledger.$.NAME`
      const ledgerExists = ledgers.some((ledger: any) => 
        ledger.$?.NAME?.toLowerCase() === ledgerName.toLowerCase()
      );
  
      console.log(`Ledger "${ledgerName}" found: ${ledgerExists}`);
      return ledgerExists;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
  
  // Example usage
  (async () => {
    const ledgerName = 'priyanshu';
    try {
      const ledgerExists = await exportAndCheckLedger(ledgerName);
      if (ledgerExists) {
        console.log(`Ledger "${ledgerName}" exists in the exported file.`);
      } else {
        console.log(`Ledger "${ledgerName}" does not exist in the exported file.`);
      }
    } catch (error) {
      console.error('Failed to export or check ledger:', error);
    }
  })();
  
  // IPC handler to bring Tally to the foreground and send multiple keystrokes
  ipcMain.handle('bring-tally-to-foreground-and-send-keys', async (_, keys: string[]) => {
    try {
      await bringTallyToForegroundAndSendKeys(keys);
      return `Sent keys "${keys.join(' ')}" to Tally`;
    } catch (error) {
      throw new Error(`Failed to send keys to Tally: ${error.message}`);
    }
  });


  return win;
};
