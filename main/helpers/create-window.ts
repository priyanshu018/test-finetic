import { screen, BrowserWindow, BrowserWindowConstructorOptions, Rectangle, ipcMain } from 'electron';
import { exec, execSync } from 'child_process';
import Store from 'electron-store';
import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';
import { createPartyLedgerXml, createPurchaserLedger, createStockItems, createTaxLedgers, createUnits, createVoucher, VoucherPayload } from '../../service/commonFunction';
import axios from 'axios';
import { error } from 'console';

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

  function getLastWord(str: string): string {
    return str.trim().split(/\s+/).pop() || '';
  }

  // function bringTallyToForegroundAndSendKeys(keys, delayBeforeY = 2000) {
  //   return new Promise((resolve, reject) => {
  //     // Check for special keys.
  //     const promptIndex = keys.findIndex(key => key === "prompt here");
  //     const openTallyIndex = keys.findIndex(key => key === "open tally");
  //     const percentageIndex = keys.findIndex(key => key === "percentage here");

  //     // Build the PowerShell command:
  //     let command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; `;
  //     command += `$tallyProcess = Get-Process | Where-Object { $_.ProcessName -like '*Tally*' } | Select-Object -First 1; `;

  //     // If "open tally" is specified, open Tally if not already running.
  //     if (openTallyIndex !== -1) {
  //       command += `if (-not $tallyProcess) { Start-Process Tally.exe; Start-Sleep -Seconds 3; $tallyProcess = Get-Process | Where-Object { $_.ProcessName -like '*Tally*' } | Select-Object -First 1; } `;
  //     }

  //     // Proceed if Tally process is found.
  //     command += `if ($tallyProcess) { `;
  //     command += `(New-Object -ComObject WScript.Shell).AppActivate($tallyProcess.Id); `;

  //     if (promptIndex === -1) {
  //       // No "prompt here": join all keys as before, but filter out "open tally".
  //       const filteredKeys = keys.filter(key => key !== "open tally");
  //       const keysString = filteredKeys.join('');
  //       command += `[System.Windows.Forms.SendKeys]::SendWait('${keysString}'); `;
  //       command += `Start-Sleep -Milliseconds ${delayBeforeY}; `;
  //     } else {
  //       // "prompt here" exists: iterate through keys individually.
  //       keys.forEach(key => {
  //         if (key === "prompt here") {
  //           command += `Start-Sleep -Milliseconds 500; `;
  //         } else if (key === "percentage here") {
  //           command += `[System.Windows.Forms.SendKeys]::SendWait('%'); `;
  //         } else if (key === "open tally") {
  //           // Already handled above; skip sending this key.
  //           // (No command needed here.)
  //         } else {
  //           command += `[System.Windows.Forms.SendKeys]::SendWait('${key}'); `;
  //         }
  //       });
  //     }

  //     command += `} else { `;
  //     command += `throw 'No Tally process found'; `;
  //     command += `}"`;

  //     exec(command, (error, stdout, stderr) => {
  //       if (error) {
  //         reject(`Error: ${error.message}`);
  //         return;
  //       }
  //       if (stderr) {
  //         reject(`PowerShell error: ${stderr}`);
  //         return;
  //       }
  //       resolve();
  //     });
  //   });
  // }


  function bringTallyToForegroundAndSendKeys(keys, delayBeforeY = 2000) {
    return new Promise((resolve, reject) => {
      // Check for special keys.
      const promptIndex = keys.findIndex(key => key === "prompt here");
      const openTallyIndex = keys.findIndex(key => key === "open tally");
      const percentageIndex = keys.findIndex(key => key === "percentage here");

      // Build the PowerShell command:
      let command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; `;
      command += `$tallyProcess = Get-Process | Where-Object { $_.ProcessName -like '*Tally*' } | Select-Object -First 1; `;
      command += `if ($tallyProcess) { `;

      // If the "open tally" key exists, wait for 3 seconds before activating Tally.
      if (openTallyIndex !== -1) {
        command += `Start-Sleep -Seconds 3; `;
      }

      // Bring Tally to the foreground.
      command += `(New-Object -ComObject WScript.Shell).AppActivate($tallyProcess.Id); `;

      // Send keys: if there's no "prompt here", send all keys (except "open tally") as one string.
      if (promptIndex === -1) {
        const filteredKeys = keys.filter(key => key !== "open tally");
        const keysString = filteredKeys.join('');
        command += `[System.Windows.Forms.SendKeys]::SendWait('${keysString}'); `;
        command += `Start-Sleep -Milliseconds ${delayBeforeY}; `;
      } else {
        // If "prompt here" exists, iterate through keys and handle them individually.
        keys.forEach(key => {
          if (key === "prompt here") {
            command += `Start-Sleep -Milliseconds 500; `;
          } else if (key === "percentage here") {
            command += `[System.Windows.Forms.SendKeys]::SendWait('%'); `;
          } else if (key === "open tally") {
            // Already handled above; skip sending this key.
          } else {
            command += `[System.Windows.Forms.SendKeys]::SendWait('${key}'); `;
          }
        });
      }

      command += `} else { `;
      command += `throw 'No Tally process found'; `;
      command += `}"`;

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
      content = buffer?.slice(3)?.toString('utf-8');
    }

    // Remove ∩┐╜ characters and invisible Unicode characters
    content = content.replace(/∩┐╜+/g, '').replace(/[^\x20-\x7E\n\r\t<>]/g, '');

    return content;
  }

  // // ALL FUNCTION TO START CREATING BILL 
  // async function exportAndGetPartyName(partyName: string, gst: string): Promise<any> {
  //   try {

  //     // Step 1: Get Tally installation path and set file path
  //     const tallyInstallPath = await getTallyInstallPath();
  //     const exportedFilePath = `${tallyInstallPath}\\master.xml`;
  //     console.log(`Tally installation path: ${tallyInstallPath}`);
  //     console.log(`Exporting file to: ${exportedFilePath}`);

  //     // Step 2: Trigger Tally export (single export for all ledgers)
  //     const keys = ['open tally', '%e', 'm', 'e', '{ENTER}', 'prompt here', 'y'];
  //     await bringTallyToForegroundAndSendKeys(keys, 1000);
  //     // console.log('Tally export triggered successfully.');

  //     // Step 3: Wait to ensure file is fully exported
  //     // console.log('Waiting for the file to be exported...');
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     // Step 4: Check if the exported file exists
  //     if (!fs.existsSync(exportedFilePath)) {
  //       throw new Error(`Exported file not found at ${exportedFilePath}.`);
  //     }

  //     // Step 5: Read and clean XML file
  //     let xmlData = fs.readFileSync(exportedFilePath, { encoding: 'utf-8' });
  //     xmlData = removeBOM(xmlData);
  //     // console.log("Cleaned XML Data (First 50 chars):", xmlData.slice(0, 50));

  //     // Step 6: Validate XML content
  //     if (!xmlData.trim().startsWith('<ENVELOPE>')) {
  //       throw new Error('File content is not valid XML.');
  //     }

  //     // Step 7: Parse XML
  //     const parsedXml = await parseStringPromise(xmlData, { explicitArray: false });
  //     // console.log('Parsed XML Data:', JSON.stringify(parsedXml, null, 2));

  //     // Step 8: Extract LEDGER details
  //     const tallyMessages = parsedXml?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
  //     if (!tallyMessages) {
  //       throw new Error('No TALLYMESSAGE found in the XML file.');
  //     }
  //     const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];
  //     const ledgers = messagesArray.map((msg: any) => msg.LEDGER).filter(Boolean);

  //     const targetLedgerName = partyName;
  //     const ledgerExists = ledgers.some((ledger) => {
  //       const ledgerName = ledger.$?.NAME;
  //       const parentElement = ledger.PARENT

  //       const nameMatch = ledgerName?.toLowerCase() === targetLedgerName?.toLowerCase();
  //       const parentMatch = parentElement?.toLowerCase() === "sundry creditors";

  //       // Debug output for each ledger
  //       console.log(`Checking ledger: ${ledgerName}`);
  //       console.log(`Parent value: ${parentElement}`);
  //       console.log(`Name match: ${nameMatch}, Parent match: ${parentMatch}`);

  //       return nameMatch && parentMatch;
  //     });


  //     console.log(`Ledger "${partyName}" found: ${ledgerExists}`);

  //     if (!ledgerExists) {
  //       // await bringTallyToForegroundAndSendKeys(['open tally'])
  //       // await createPartyNameEntry(partyName, gst);
  //       const response = createPartyLedger(partyName, gst)
  //       return response

  //     }

  //     return partyName

  //   } catch (error) {
  //     console.error('Error in exportAndCheckLedger:', error);
  //     throw error;
  //   }
  // }

  // async function createPartyNameEntry(
  //   partyName: string,
  //   gst: string,
  // ): Promise<void> {
  //   try {

  //     // Build the initial keys array for invoice header details
  //     const keys = [
  //       'c',
  //       'l',
  //       'e',
  //       'd',
  //       'g',
  //       'e',
  //       'r',
  //       '{ENTER}',
  //       partyName,
  //       '{ENTER}',
  //       '{ENTER}',
  //       's',
  //       'u',
  //       'n',
  //       'd',
  //       'r',
  //       'y',
  //       ' ',
  //       'c',
  //       'r',
  //       'e',
  //       'd',
  //       'i',
  //       't',
  //       'o',
  //       'r',
  //       's',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       gst,
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       '{ENTER}',
  //       'prompt here',
  //       'y',
  //       '{ESC}',
  //       'prompt here',
  //       'y',
  //       '{ESC}',
  //     ];

  //     await bringTallyToForegroundAndSendKeys(keys);
  //   } catch (error) {
  //     console.error('Error creating purchase ledger:', error);
  //     throw error;
  //   }
  // }

  // async function exportAndCheckLedger(ledgerNames: string | string[], ledgerType: string): Promise<void> {
  //   try {
  //     // Convert ledgerNames to an array if it isn't already iterable.
  //     const ledgerNamesArray = Array.isArray(ledgerNames) ? ledgerNames : ledgerNames;
  //     // Step 1: Get Tally installation path and set file path
  //     const tallyInstallPath = await getTallyInstallPath();
  //     const exportedFilePath = `${tallyInstallPath}\\master.xml`;
  //     console.log(`Tally installation path: ${tallyInstallPath}`);
  //     console.log(`Exporting file to: ${exportedFilePath}`);

  //     // Step 2: Trigger Tally export (single export for all ledgers)
  //     const keys = ['open tally', '%e', 'm', 'e', '{ENTER}', 'prompt here', 'y'];
  //     await bringTallyToForegroundAndSendKeys(keys, 1000);
  //     // console.log('Tally export triggered successfully.');

  //     // Step 3: Wait to ensure file is fully exported
  //     // console.log('Waiting for the file to be exported...');
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     // Step 4: Check if the exported file exists
  //     if (!fs.existsSync(exportedFilePath)) {
  //       throw new Error(`Exported file not found at ${exportedFilePath}.`);
  //     }

  //     // Step 5: Read and clean XML file
  //     let xmlData = fs.readFileSync(exportedFilePath, { encoding: 'utf-8' });
  //     xmlData = removeBOM(xmlData);
  //     // console.log("Cleaned XML Data (First 50 chars):", xmlData.slice(0, 50));

  //     // Step 6: Validate XML content
  //     if (!xmlData.trim().startsWith('<ENVELOPE>')) {
  //       throw new Error('File content is not valid XML.');
  //     }

  //     // Step 7: Parse XML
  //     const parsedXml = await parseStringPromise(xmlData, { explicitArray: false });
  //     // console.log('Parsed XML Data:', JSON.stringify(parsedXml, null, 2));

  //     // Step 8: Extract LEDGER details
  //     const tallyMessages = parsedXml?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
  //     if (!tallyMessages) {
  //       throw new Error('No TALLYMESSAGE found in the XML file.');
  //     }
  //     const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];
  //     const ledgers = messagesArray.map((msg: any) => msg.LEDGER).filter(Boolean);

  //     // Step 9: Check each ledger and create if missing
  //     if (ledgerType === "purchase accounts") {
  //       const targetLedgerName = ledgerNamesArray;
  //       const ledgerExists = ledgers.some((ledger) => {
  //         const ledgerName = ledger.$?.NAME;
  //         const parentElement = ledger.PARENT

  //         const nameMatch = ledgerName?.toLowerCase() === targetLedgerName?.toLowerCase();
  //         const parentMatch = parentElement?.toLowerCase() === "purchase accounts";

  //         // Debug output for each ledger
  //         console.log(`Checking ledger: ${ledgerName}`);
  //         console.log(`Parent value: ${parentElement}`);
  //         console.log(`Name match: ${nameMatch}, Parent match: ${parentMatch}`);

  //         return nameMatch && parentMatch;
  //       });

  //       console.log(`Ledger exists: ${ledgerExists}`);

  //       if (!ledgerExists) {
  //         // await bringTallyToForegroundAndSendKeys(['open tally'])
  //         // await createPurchaseLedger(ledgerNames);
  //         const response = createPurchaserLedger(ledgerNames)
  //         return response
  //       }

  //       return ledgerNames

  //     } else {

  //       const result = []

  //       // await bringTallyToForegroundAndSendKeys(['open tally'])
  //       for (const ledgerName of ledgerNamesArray) {
  //         // Append "%" for the existence check
  //         const targetLedgerName = ledgerType === "purchase accounts" ? ledgerName : ledgerName;


  //         const ledgerExists = ledgers.some((ledger: any) =>
  //           ledger.$?.NAME?.toLowerCase() === targetLedgerName.toLowerCase()
  //         );
  //         console.log(`Ledger "${targetLedgerName}" found: ${ledgerExists}`);

  //         if (!ledgerExists) {
  //           result.push(targetLedgerName)
  //         }


  //         // if (!ledgerExists) {
  //         //   // Append "+5" while creating the ledger
  //         //   const newLedgerName = ledgerType === "purchase accounts" ? ledgerName : `${ledgerName}+5`;
  //         //   console.log(`Creating ledger "${newLedgerName}"...`);

  //         //   const lowerName = ledgerName.toLowerCase();
  //         //   if (lowerName.includes("igst")) {
  //         //     await createIgstLedger(newLedgerName);
  //         //   } else if (lowerName.includes("cgst") || lowerName.includes("ut/sgst")) {
  //         //     await createCgstLedger(newLedgerName);
  //         //   } else {
  //         //     console.warn(`No creation function defined for ledger type: ${ledgerName}`);
  //         //   }

  //         // }
  //       }

  //       const response = createTaxLedgers(result)
  //       return response
  //     }
  //   } catch (error) {
  //     console.error('Error in exportAndCheckLedger:', error);
  //     throw error;
  //   }
  // }

  // async function createPurchaseLedger(ledgerName: string): Promise<void> {
  //   try {
  //     // Step 1: Press "c"
  //     await bringTallyToForegroundAndSendKeys(['c', 'l', 'e', 'd', 'g', 'e', 'r', '{ENTER}', ledgerName, '{ENTER}', '{ENTER}', 'p', 'u', 'r', 'c', 'h', 'a', 's', 'e', ' ', 'a', 'c', 'c', 'o', 'u', 'n', 't',
  //       '{ENTER}', '{ENTER}', 'g', 's', 't', '{ENTER}', 'g', 'o', 'o', 'd', 's', ' ', 'a', 'n', 'd', ' ', 's', 'e', 'r', 'v', 'i', 'c', 'e', 's',
  //       '{ENTER}', '^a', '{ESC}', 'prompt here', 'y', '{ESC}']);

  //   } catch (error) {
  //     console.error('Error creating purchase ledger:', error);
  //     throw error;
  //   }
  // }

  // async function createIgstLedger(name: string): Promise<void> {
  //   try {
  //     // Step 1: Press "c"
  //     await bringTallyToForegroundAndSendKeys([
  //       'c', 'l', 'e', 'd', 'g', 'e', 'r', '{ENTER}',
  //       name, '{ENTER}', '{ENTER}',
  //       'D', 'u', 't', 'i', 'e', 's', ' ', '&', ' ', 'T', 'a', 'x', 'e', 's', '{ENTER}',
  //       'G', 'S', 'T', '{ENTER}',
  //       'I', 'G', 'S', 'T', '{ENTER}', '{ENTER}', '^a', '{ESC}', 'prompt here', 'y', '{ESC}'
  //     ]);

  //   } catch (error) {
  //     console.error('Error creating purchase ledger:', error);
  //     throw error;
  //   }
  // }

  // async function createCgstLedger(name: string): Promise<void> {
  //   try {
  //     // Step 1: Press "c"
  //     await bringTallyToForegroundAndSendKeys([
  //       'c', 'l', 'e', 'd', 'g', 'e', 'r', '{ENTER}',
  //       name, '{ENTER}', '{ENTER}',
  //       'D', 'u', 't', 'i', 'e', 's', ' ', '&', ' ', 'T', 'a', 'x', 'e', 's', '{ENTER}',
  //       'G', 'S', 'T', '{ENTER}',
  //       'C', 'G', 'S', 'T', '{ENTER}', '{ENTER}', '^a', '{ESC}', 'prompt here', 'y', '{ESC}'
  //     ]);

  //   } catch (error) {
  //     console.error('Error creating purchase ledger:', error);
  //     throw error;
  //   }
  // }

  // async function exportAndGetUnits(): Promise<any[]> {
  //   // Step 1: Get Tally installation path and set file path
  //   const tallyInstallPath = await getTallyInstallPath();
  //   const exportedFilePath = `${tallyInstallPath}\\master.xml`;
  //   console.log(`Tally installation path: ${tallyInstallPath}`);
  //   console.log(`Exporting file to: ${exportedFilePath}`);

  //   // Step 2: Trigger Tally export for units
  //   const keys = [
  //     'open tally', '%e', 'm', 'c', 'type of master', '{ENTER}', 'units', '{ENTER}', '{ESC}', '{ESC}', 'e',
  //     'prompt here', 'y'
  //   ];
  //   await bringTallyToForegroundAndSendKeys(keys, 1000);
  //   console.log('Tally export for units triggered successfully.');

  //   // Step 3: Wait to ensure file is fully exported
  //   console.log('Waiting for the unit file to be exported...');
  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  //   // Step 4: Ensure the exported file exists
  //   if (!fs.existsSync(exportedFilePath)) {
  //     throw new Error(`Exported file not found at ${exportedFilePath}.`);
  //   }

  //   // Step 5: Read and clean XML file
  //   let xmlData = fs.readFileSync(exportedFilePath, { encoding: 'utf-8' });
  //   xmlData = removeBOM(xmlData);
  //   console.log("Cleaned XML Data (First 50 chars):", xmlData.slice(0, 50));

  //   // Step 6: Validate XML content
  //   if (!xmlData.trim().startsWith('<ENVELOPE>')) {
  //     throw new Error('File content is not valid XML.');
  //   }

  //   // Step 7: Parse XML
  //   const parsedXml = await parseStringPromise(xmlData, { explicitArray: false });
  //   console.log('Parsed XML Data:', JSON.stringify(parsedXml, null, 2));

  //   // Step 8: Extract UNIT details
  //   const tallyMessages = parsedXml?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
  //   if (!tallyMessages) {
  //     return []; // No units found in the XML export.
  //   }
  //   const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];
  //   // Assume each TALLYMESSAGE for units contains a UNIT element
  //   const units = messagesArray.map((msg: any) => msg.UNIT).filter(Boolean);
  //   return units;
  // }

  // // New function: Check and create units if missing
  // async function exportAndCheckUnits(unitsToCheck: Array<{ name: string; decimal?: number }>): Promise<{ results: Array<{ name: string; exists: boolean }> }> {
  //   // First export once and get the current units.
  //   let existingUnits = await exportAndGetUnits();

  //   // Loop through provided units to see which ones already exist.
  //   const results: Array<{ name: string; exists: boolean }> = [];
  //   const missingUnits: Array<{ name: string; decimal?: number }> = [];

  //   for (const unit of unitsToCheck) {
  //     const exists = existingUnits.some((unitElem: any) => unitElem.$?.NAME?.toLowerCase() === unit?.name?.toLowerCase());
  //     results.push({ name: unit.name, exists });
  //     if (!exists) {
  //       missingUnits.push(unit);
  //     }
  //   }

  //   // await bringTallyToForegroundAndSendKeys(['open tally'])

  //   // If there are missing units, create them all.
  //   if (missingUnits.length > 0) {
  //     console.log(`Missing units: ${missingUnits.map(u => u.name).join(', ')}`);

  //     console.log(missingUnits, "missing units")

  //     // for (const unit of missingUnits) {
  //     //   console.log(`Creating unit "${unit.Name}"...`);
  //     //   await create Unit(unit.Name, unit.conversionRate);
  //     // }
  //     const response = createUnits(missingUnits)
  //     return response
  //     // After creation, re-export and verify that the missing units are now present.
  //     // existingUnits = await exportAndGetUnits();
  //     // Update the results based on the new export.
  //     // for (const result of results) {
  //     //   result.exists = existingUnits.some((unitElem: any) => unitElem.$?.NAME?.toLowerCase() === result.name.toLowerCase());
  //     // }
  //   }

  //   return { results };
  // }

  // // Example createUnit function using dynamic parameters
  // async function createUnit(
  //   name: string,
  //   conversionRate: number
  // ): Promise<void> {
  //   try {
  //     // Bring Tally to the foreground and send keys for unit creation.
  //     // The key sequence below is an example; adjust it to match your Tally workflow.
  //     await bringTallyToForegroundAndSendKeys([
  //       'c',
  //       'u', 'n', 'i', 't',
  //       '{ENTER}', // Open unit creation window
  //       name, '{ENTER}', '{ENTER}', '{ENTER}',                  // Enter unit name
  //       conversionRate !== undefined ? String(conversionRate) : 1,
  //       '{ENTER}', // Enter conversion rate (default to 1 if missing)
  //       'prompt here', 'y', '{ESC}', 'prompt here', 'y', '{ESC}'        // Complete and exit
  //     ]);
  //     console.log(`Unit created: ${name}`, conversionRate !== undefined ? String(conversionRate) : '1');
  //   } catch (error) {
  //     console.error('Error creating unit:', error);
  //     throw error;
  //   }
  // }

  // // Helper function to export the XML file and extract STOCKITEMs
  // async function exportAndGetItems(): Promise<any[]> {
  //   // Step 1: Get Tally installation path and set file path
  //   const tallyInstallPath = await getTallyInstallPath();
  //   const exportedFilePath = `${tallyInstallPath}\\master.xml`;
  //   console.log(`Tally installation path: ${tallyInstallPath}`);
  //   console.log(`Exporting file to: ${exportedFilePath}`);

  //   // Step 2: Trigger Tally export for stock items
  //   const keys = [
  //     'open tally', '%e', 'm', 'c', 'type of master', '{ENTER}',
  //     'stock items', '{ENTER}', '{ESC}', '{ESC}', 'e',
  //     'prompt here', 'y'
  //   ];
  //   await bringTallyToForegroundAndSendKeys(keys, 1000);
  //   console.log('Tally export triggered successfully.');

  //   // Step 3: Wait to ensure file is fully exported
  //   console.log('Waiting for the file to be exported...');
  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  //   // Step 4: Ensure the exported file exists
  //   if (!fs.existsSync(exportedFilePath)) {
  //     throw new Error(`Exported file not found at ${exportedFilePath}.`);
  //   }

  //   // Step 5: Read and clean XML file
  //   let xmlData = fs.readFileSync(exportedFilePath, { encoding: 'utf-8' });
  //   xmlData = removeBOM(xmlData);

  //   // Step 6: Validate XML content
  //   if (!xmlData.trim().startsWith('<ENVELOPE>')) {
  //     throw new Error('File content is not valid XML.');
  //   }

  //   // Step 7: Parse XML
  //   const parsedXml = await parseStringPromise(xmlData, { explicitArray: false });

  //   // Step 8: Extract STOCKITEM details
  //   const tallyMessages = parsedXml?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
  //   if (!tallyMessages) {
  //     return []; // No items found
  //   }
  //   const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];
  //   const items = messagesArray.map((msg: any) => msg.STOCKITEM).filter(Boolean);
  //   return items;
  // }

  // // New function to check and create items if missing
  // async function exportAndCheckItems(itemsToCheck: Array<{
  //   Product: string;
  //   HSN: string;
  //   symbol?: string;
  //   decimal?: string | number;
  //   gst?: string | number;
  //   SGST?: string;
  //   CGST?: string;
  // }>): Promise<{ results: Array<{ product: string; exists: boolean }> }> {
  //   // First, export once and get the list of existing items
  //   let existingItems = await exportAndGetItems();
  //   const results: Array<{ product: string; exists: boolean }> = [];
  //   const missingItems: Array<typeof itemsToCheck[0]> = [];

  //   // Check each item against the exported items
  //   for (const item of itemsToCheck) {
  //     const exists = existingItems.some((stockItem: any) =>
  //       stockItem.$?.NAME?.toLowerCase() === item.Product?.toLowerCase()
  //     );
  //     results.push({ product: item.Product, exists });
  //     if (!exists) {
  //       missingItems.push(item);
  //     }
  //   }

  //   // await bringTallyToForegroundAndSendKeys(['open tally'])

  //   // If there are missing items, create them
  //   if (missingItems.length > 0) {
  //     console.log(`Missing items: ${missingItems.map(i => i.Product).join(', ')}`);
  //     // for (const item of missingItems) {
  //     //   const name = item.Product;
  //     //   const symbol = item.symbol || "pcs";
  //     //   const decimal = item.decimal !== undefined ? Number(item.decimal) : 0;
  //     //   const hsn = item.HSN ? Number(item.HSN) : 0;
  //     //   let gstValue: number;
  //     //   if (item.gst !== undefined) {
  //     //     gstValue = Number(item.gst);
  //     //   } else if (item.SGST !== undefined && item.CGST !== undefined) {
  //     //     gstValue = Number(item.SGST) + Number(item.CGST);
  //     //   } else {
  //     //     gstValue = 0;
  //     //   }
  //     //   console.log(
  //     //     `Item "${name}" does not exist. Creating item with symbol "${symbol}", decimal ${decimal}, HSN ${hsn}, and GST ${gstValue}...`
  //     //   );
  //     //   await createItem(name, symbol, decimal, hsn, gstValue);
  //     // }

  //     // // Re-export to verify that the missing items are now present
  //     // existingItems = await exportAndGetItems();
  //     // // Update the results based on the new export
  //     // for (const result of results) {
  //     //   result.exists = existingItems.some((stockItem: any) =>
  //     //     stockItem.$?.NAME?.toLowerCase() === result.product.toLowerCase()
  //     //   );
  //     // }

  //     const response = createStockItems(missingItems)
  //     return response

  //   }

  //   return { results };
  // }


  // async function createItem(name: string, symbol: string, decimal: number, hsn: number, gst: number): Promise<void> {
  //   try {
  //     console.log("working")
  //     // await bringTallyToForegroundAndSendKeys(['prompt here'])
  //     await bringTallyToForegroundAndSendKeys([
  //       'c', 'i', 't', 'e', 'm', '{ENTER}',  // Open item creation
  //       name,
  //       '{ENTER}', '{ENTER}',
  //       '{ENTER}',
  //       symbol, '{ENTER}',     // Enter item name and confirm
  //       '{ENTER}', "specify details", '{ENTER}', hsn, '{ENTER}', '{ENTER}', "specify details", '{ENTER}', '{ENTER}', gst, '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', 'prompt here', 'y', '{ESC}', '{ESC}',
  //       'prompt here', 'y', '{ESC}'  // Create and exit
  //     ]);
  //   } catch (error) {
  //     console.error('Error creating item:', error);
  //     throw error;
  //   }
  // }

  // async function createPurchaseEntry(
  //   invoiceNumber: string,
  //   date: string,
  //   partyName: string,
  //   purchaseLedger: string,
  //   items: {
  //     name: string;
  //     quantity: number;
  //     price: number;
  //     cgst: number;
  //     sgst: number;
  //     igst: number;
  //   }[],
  //   isWithinState: boolean
  // ): Promise<void> {
  //   try {
  //     // Format the date as dd-MM-yyyy (e.g., 02-11-2024)
  //     function formatDate(date: string | Date): string {
  //       // If the date is a string, check if it's already formatted as dd-mm-yyyy.
  //       if (typeof date === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
  //         return date;
  //       }

  //       // Convert input to a Date object if it isn't already.
  //       const dateObj = date instanceof Date ? date : new Date(date);

  //       const day = String(dateObj.getDate()).padStart(2, '0');
  //       const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  //       const year = dateObj.getFullYear();

  //       return `${day}-${month}-${year}`;
  //     }

  //     // Build the initial keys array for invoice header details
  //     const keys = [
  //       'open tally',
  //       'v',
  //       '{F9}',
  //       '{F2}',
  //       formatDate(date),
  //       '{ENTER}',
  //       invoiceNumber,
  //       '{ENTER}',
  //       '{ENTER}',
  //       partyName,
  //       '{ENTER}',
  //       '^a',
  //       '^a',
  //       // '^a',
  //       purchaseLedger,
  //       '{ENTER}',
  //     ];

  //     // // Loop through items and add each item entry along with its tax details
  //     for (const item of items) {
  //       // Add item details: name, quantity, price
  //       keys.push(
  //         item.name, '{ENTER}',
  //         item.quantity?.toString(), '{ENTER}',
  //         item.price?.toString(), '{ENTER}',
  //         '{ENTER}', '{ENTER}',
  //       );


  //       // keys.push('{ENTER}')

  //       // Insert tax details for the current item
  //       if (isWithinState) {
  //         // For within-state purchases, add CGST and SGST details for this item
  //         keys.push(
  //           // `Cgst${item.cgst}`, 
  //           // '{ENTER}', '{ENTER}',
  //           // `Sgst${item.sgst}`, '{ENTER}', '{ENTER}'
  //         );
  //       } else {
  //         // For out-of-state purchases, add IGST detail for this item
  //         keys.push(

  //           // `Igst${item.igst}%`, '{ENTER}', '{ENTER}'
  //         );
  //       }

  //       // Add keys to finalize this item's entry and move to the next row
  //     }
  //     keys.push('{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}');

  //     // Send the entire keys array to Tally
  //     await bringTallyToForegroundAndSendKeys(keys);
  //   } catch (error) {
  //     console.error('Error creating purchase ledger:', error);
  //     throw error;
  //   }
  // }

  async function getLedgerNames(xmlData: string): Promise<string[]> {
    try {
      // Parse the XML with explicitArray: false so that single elements are not wrapped in an array.
      const result = await parseStringPromise(xmlData, { explicitArray: false });

      // Navigate to the LEDGER elements:
      // Expected path: ENVELOPE -> BODY -> DATA -> COLLECTION -> LEDGER
      const collection = result?.ENVELOPE?.BODY?.DATA?.COLLECTION;
      if (!collection) {
        throw new Error("Cannot find COLLECTION element in the XML.");
      }

      // The LEDGER elements might either be an array or a single object
      const ledgers = collection.LEDGER;
      let ledgerNames: string[] = [];

      if (Array.isArray(ledgers)) {
        ledgerNames = ledgers.map((ledger: any) => ledger.$.NAME);
      } else if (ledgers && ledgers.$) {
        ledgerNames.push(ledgers.$.NAME);
      }

      return ledgerNames;
    } catch (error) {
      console.error("Error parsing XML to get ledger names:", error);
      throw error;
    }
  }

  const getMissingLedgers = (existingLedgers: string[]): string[] => {
    // Expected ledger names list.
    const expectedLedgers = [
      "cgst0%",
      "cgst14%",
      "cgst2.5%",
      "cgst6%",
      "cgst9%",
      "igst0%",
      "igst12%",
      "igst18%",
      "igst28%",
      "igst5%",
      "ut/sgst0%",
      "ut/sgst14%",
      "ut/sgst2.5%",
      "ut/sgst6%",
      "ut/sgst9%"
    ];

    // Compare the expected list with the existing list,
    // and return those items that are not present.
    const missing = expectedLedgers.filter(
      expected => !existingLedgers.includes(expected)
    );

    return missing;
  };

  const checkPartyNameExist = (existingLedgers, expectedPartyName) => {
    return existingLedgers.includes(expectedPartyName);
  };

  /**
 * Parse the CREATED and EXCEPTIONS counts from the given response XML.
 * @param {string} xmlResponse – The raw response string.
 * @returns {{ created: number, exceptions: number }}
 */
  function parseResponse(xmlResponse) {
    const createdMatch = xmlResponse.match(/<CREATED>(\d+)<\/CREATED>/);
    const exceptionsMatch = xmlResponse.match(/<EXCEPTIONS>(\d+)<\/EXCEPTIONS>/);
    const responseMatch = xmlResponse.match(/<RESPONSE>(\d+)<\/RESPONSE>/);

    return {
      created: createdMatch ? parseInt(createdMatch[1], 10) : 0,
      exceptions: exceptionsMatch ? parseInt(exceptionsMatch[1], 10) : 0,
    };
  }

  /**
 * Asynchronously generates an XML payload from the provided ledger names,
 * sends it to the Tally server via HTTP POST, and returns the server response.
 *
 * The TAXTYPE is set based on the following rules:
 * - If the ledger name contains "Igst", TAXTYPE is "IGST"
 * - If the ledger name contains "Cgst" or "Ut/Sgst", TAXTYPE is "CGST"
 *
 * @param ledgers - An array of ledger names.
 * @returns An object containing success status, Tally's response data, and the XML payload.
 */
  async function createLawLedger(ledgers: string[]): Promise<any> {
    try {
      // Build the XML envelope header and body start.
      let xmlPayload = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
`;

      // Loop through the ledger names and generate each TALLYMESSAGE block
      for (const ledgerName of ledgers) {
        // Determine the tax type based on the ledger name.
        let taxType: string;
        if (ledgerName.includes("Igst")) {
          taxType = "IGST";
        } else if (ledgerName.includes("Cgst") || ledgerName.includes("Ut/Sgst")) {
          taxType = "CGST";
        } else {
          taxType = ""; // You may set a default if needed.
        }

        xmlPayload += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER Action="Create">
            <NAME>${ledgerName}</NAME>
            <PARENT>Duties &amp; Taxes</PARENT>
            <TAXTYPE>${taxType}</TAXTYPE>
          </LEDGER>
        </TALLYMESSAGE>
`;
      }

      // Close the XML envelope.
      xmlPayload += `      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlPayload, 'utf8');

      // Send the XML payload to Tally (adjust the URL if needed)
      const response = await axios.post('http://localhost:9000', xmlPayload, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': contentLength, // Setting the Content-Length header.
        },
      });

      return { success: true, data: response };

    } catch (error: any) {
      console.error("Error in importLedgers function:", error);
      return { success: false, error: error.message };
    }
  }

  /**
 * Asynchronously generates an XML payload for a single ledger,
 * sends it to the Tally server via a GET request,
 * and returns the server response.
 *
 * Optional fields such as address, country, state, mobile, and gstin are added only if they have a value.
 *
 * @param ledgerDetails - An object containing details for the ledger to create.
 * @returns An object containing success status, Tally's response data, and the XML payload.
 */
  async function createPartyNameUsingXmlApi(ledgerDetails: {
    name: string;
    parent: string;
    address?: string;
    country?: string;
    state?: string;
    mobile?: string;
    gstin?: string;
  }): Promise<any> {
    try {
      // Build XML for optional fields only if their value is present.
      let optionalFields = "";
      if (ledgerDetails.address) {
        optionalFields += `            <ADDRESS>${ledgerDetails.address}</ADDRESS>\n`;
      }
      if (ledgerDetails.country) {
        optionalFields += `            <COUNTRYOFRESIDENCE>${ledgerDetails.country}</COUNTRYOFRESIDENCE>\n`;
      }
      if (ledgerDetails.state) {
        optionalFields += `            <LEDSTATENAME>${ledgerDetails.state}</LEDSTATENAME>\n`;
      }
      if (ledgerDetails.mobile) {
        optionalFields += `            <LEDGERMOBILE>${ledgerDetails.mobile}</LEDGERMOBILE>\n`;
      }
      if (ledgerDetails.gstin) {
        optionalFields += `            <PARTYGSTIN>${ledgerDetails.gstin}</PARTYGSTIN>\n`;
      }

      // Build the complete XML payload.
      const xmlPayload = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER Action="Create">
            <NAME>${ledgerDetails.name}</NAME>
            <PARENT>${ledgerDetails.parent}</PARENT>
${optionalFields}          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

      // Calculate the content length from the XML payload.
      const contentLength = Buffer.byteLength(xmlPayload, 'utf8');

      // Send the XML payload to Tally (using GET as per your curl example)
      const response = await axios.get('http://localhost:9000', {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': contentLength.toString()
        },
        data: xmlPayload
      });

      return { success: true, data: response.data, xmlPayload };

    } catch (error: any) {
      console.error("Error in createLedger function:", error);
      return { success: false, error: error.message };
    }
  }


  async function getUnitNames(xmlData: string): Promise<string[]> {
    try {
      // Parse the XML with explicitArray: false so that single elements are not wrapped in an array.
      const result = await parseStringPromise(xmlData, { explicitArray: false });

      // Navigate to the UNIT elements:
      // Expected path: ENVELOPE -> BODY -> DATA -> COLLECTION -> UNIT
      const collection = result?.ENVELOPE?.BODY?.DATA?.COLLECTION;
      if (!collection) {
        throw new Error("Cannot find COLLECTION element in the XML.");
      }

      // The UNIT elements might either be an array or a single object
      const units = collection.UNIT;
      let unitNames: string[] = [];

      if (Array.isArray(units)) {
        // If there are multiple units, map through the array to get their names
        unitNames = units.map((unit: any) => unit.$.NAME);
      } else if (units && units.$) {
        // If there's only a single unit, push its name to the array
        unitNames.push(units.$.NAME);
      }

      return unitNames;
    } catch (error) {
      console.error("Error parsing XML to get unit names:", error);
      throw error;
    }
  }

  interface Unit {
    name: string;
    decimal: number;
  }

  async function checkUnitNames(existData: string[], unitsData: Unit[]): Promise<unit[]> {
    try {
      // Find the units that do not exist in the existData
      const nonMatchingUnits = unitsData.filter(unit => !existData.includes(unit.name));

      // Return the full objects of units that do not exist in the existData
      return nonMatchingUnits;
    } catch (error) {
      console.error("Error checking non-matching unit objects:", error);
      throw error;
    }
  }
  /**
   * Function to extract stock item names from XML data.
   * @param xmlData - The XML string to parse.
   * @returns A promise that resolves to an array of stock item names.
   */
  async function getStockItemNames(xmlData: string): Promise<string[]> {
    try {
      // Parse the XML string using xml2js
      const result = await parseStringPromise(xmlData, { explicitArray: false });

      // Navigate to the STOCKITEM elements in the parsed data
      const collection = result?.ENVELOPE?.BODY?.DATA?.COLLECTION;
      if (!collection) {
        throw new Error("Cannot find COLLECTION element in the XML.");
      }

      // Extract stock item names
      const stockItems = collection.STOCKITEM;
      let stockItemNames: string[] = [];

      // Check if there are stock items in the collection and handle missing data safely
      if (stockItems) {
        // If there's only one stock item (not an array)
        if (!Array.isArray(stockItems)) {
          // Ensure the name is available before accessing
          if (stockItems.$ && stockItems.$.NAME) {
            stockItemNames.push(stockItems.$.NAME);
          }
        } else {
          // If there are multiple stock items
          stockItemNames = stockItems
            .map((item: any) => item.$?.NAME) // Safely access the NAME
            .filter((name: string | undefined) => name !== undefined); // Remove undefined values
        }
      }

      // Return the list of stock item names
      return stockItemNames;
    } catch (error) {
      console.error("Error parsing XML to get stock item names:", error);
      throw error;
    }
  }
  interface Item {
    Product: string;
    HSN: string;
    SGST: number;
    CGST: number;
    gst: number;
    symbol: string;
  }

  async function checkItemNames(existData: string[], itemsData: Item[]): Promise<Item[]> {
    try {
      // Find the items that do not exist in the existData
      const nonMatchingItems = itemsData.filter(item => !existData.includes(item.Product));

      // Return the full objects of items that do not exist in the existData
      return nonMatchingItems;
    } catch (error) {
      console.error("Error checking non-matching item objects:", error);
      throw error;
    }
  }


  // ------------------------------------------------------------------------------------------------------------------------

  // IPC handler to bring Tally to the foreground and send multiple keystrokes
 
  ipcMain.handle('bring-tally-to-foreground-and-send-keys', async (_, keys: string[]) => {
    try {
      await bringTallyToForegroundAndSendKeys(keys);
      return `Sent keys "${keys.join(' ')}" to Tally`;
    } catch (error) {
      throw new Error(`Failed to send keys to Tally: ${error.message}`);
    }
  });




  ipcMain.handle('get-tax-ledger-data', async (_, xmlData: string) => {
    try {
      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, 'utf8');

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: 'POST',
        url: 'http://localhost:9000', // Replace or make configurable as needed.
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });

      const filterResponse = await getLedgerNames(response.data)
      const missingLedgerResponse = getMissingLedgers(filterResponse)

      if (missingLedgerResponse?.length > 0) {

        const createLawLedgerResponse = await createLawLedger(missingLedgerResponse)
        const responseData = parseResponse(createLawLedgerResponse?.data?.data)

        if (responseData?.created === missingLedgerResponse?.length + 1) {
          return { success: true, data: responseData, ledgerName: missingLedgerResponse };
        } else {
          return { success: false, data: responseData, ledgerName: missingLedgerResponse };

        }
      } else {
        // Return the data to the renderer process.
        return { success: true, data: response.data, ledgerName: filterResponse };
      }



    } catch (error: any) {
      console.error('Error in send-tally-xml IPC handler:', error);
      return { success: false, error: error.message };
    }
  });


  ipcMain.handle('create-party-ledger', async (_, xmlData: string, partyName: string, partyDetailData) => {
    try {
      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, 'utf8');

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: 'POST',
        url: 'http://localhost:9000', // Replace or make configurable as needed.
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });

      const filterResponse = await getLedgerNames(response.data)
      const missingLedgerResponse = checkPartyNameExist(filterResponse, partyName)

      if (!missingLedgerResponse) {
        const createPartNameLedger = await createPartyNameUsingXmlApi(partyDetailData)
        const checkCreatedLedgerResponse = await getLedgerNames(response.data)
        const data = parseResponse(createPartNameLedger?.data)
        return { success: true, data, ledgerName: checkCreatedLedgerResponse };
      } else {

        return { success: true, isExist: missingLedgerResponse, data: filterResponse };
      }


      // Return the data to the renderer process.
    } catch (error: any) {
      console.error('Error in send-tally-xml IPC handler:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-purchaser-ledger', async (_, xmlData: string, purchaserName: string) => {
    try {
      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, 'utf8');

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: 'POST',
        url: 'http://localhost:9000', // Replace or make configurable as needed.
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });

      const filterResponse = await getLedgerNames(response.data)
      const missingLedgerResponse = checkPartyNameExist(filterResponse, purchaserName)

      if (!missingLedgerResponse) {
        const createPurchaseLedger = await createPurchaserLedger(purchaserName)

        // Calculate content length (in bytes) from the XML data.
        const contentLength = Buffer.byteLength(createPurchaseLedger, 'utf8');

        const response = await axios({
          method: 'GET',
          url: 'http://localhost:9000', // Replace or make configurable as needed.
          headers: {
            'Content-Type': 'application/xml',
            'Content-Length': contentLength, // Setting the Content-Length header.
          },
          data: createPurchaseLedger,
        });

        const data = parseResponse(response?.data)
        if (data?.created === 1) {
          return { success: true, isExist: missingLedgerResponse, data: purchaserName };
        } else {
          return { success: false, data: purchaserName, error: response };
        }
      } else {
        return { success: true, isExist: missingLedgerResponse, data: purchaserName };
      }
    } catch (error: any) {
      console.error('Error in send-tally-xml IPC handler:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-unit', async (_, unitData: any) => {
    try {

      let xmlData = `<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>Custom List of Units</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES />
            <TDL>
                <TDLMESSAGE>
                    <COLLECTION ISMODIFY="No" ISFIXED="No" ISINITIALIZE="Yes" ISOPTION="No" ISINTERNAL="No" NAME="Custom List of Units">
                        <TYPE>Units</TYPE>
                        <NATIVEMETHOD>MasterID</NATIVEMETHOD>
                        <NATIVEMETHOD>GUID</NATIVEMETHOD>
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>`

      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, 'utf8');

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: 'POST',
        url: 'http://localhost:9000', // Replace or make configurable as needed.
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });

      const getDataFromXml = await getUnitNames(response?.data)

      const filterResponse = await checkUnitNames(getDataFromXml, unitData)

      if (filterResponse?.length > 0) {
        const xmlResponse = await createUnits(filterResponse)

        console.log(xmlResponse,"xml response")

        const contentLength = Buffer.byteLength(xmlResponse, 'utf8');

        const response = await axios({
          method: 'GET',
          url: 'http://localhost:9000', // Replace or make configurable as needed.
          headers: {
            'Content-Type': 'application/xml',
            'Content-Length': contentLength, // Setting the Content-Length header.
          },
          data: xmlResponse,
        });

        const data = parseResponse(response?.data)

        if (data?.created === filterResponse?.length) {
          return { success: true, isExist: filterResponse, data: unitData };
        } else {
          return { success: false, data: unitData };
        }
      } else {
        return { success: true, isExist: filterResponse, data: unitData };
      }
    } catch (error: any) {
      console.error('Error in send-tally-xml IPC handler:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-item', async (_, itemData: any) => {
    try {

      let xmlData = `<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>Custom List of StockItems</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES />
            <TDL>
                <TDLMESSAGE>
                    <COLLECTION ISMODIFY="No" ISFIXED="No" ISINITIALIZE="Yes" ISOPTION="No" ISINTERNAL="No" NAME="Custom List of StockItems">
                        <TYPE>StockItem</TYPE>
                        <NATIVEMETHOD>MasterID</NATIVEMETHOD>
                        <NATIVEMETHOD>GUID</NATIVEMETHOD>
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>`

      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, 'utf8');

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: 'POST',
        url: 'http://localhost:9000', // Replace or make configurable as needed.
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });

      const xmlResponse = await getStockItemNames(response?.data)

      const filterResponse = await checkItemNames(xmlResponse, itemData)

      if (xmlResponse?.length === 0) {
        const response = await axios({
          method: 'GET',
          url: 'http://localhost:9000', // Replace or make configurable as needed.
          headers: {
            'Content-Type': 'application/xml',
            'Content-Length': contentLength, // Setting the Content-Length header.
          },
          data: xmlResponse,
        });

        const data = parseResponse(response?.data)

        if (data?.created === filterResponse?.length) {
          return { success: true, isExist: filterResponse, data: itemData };
        } else {
          return { success: false, data: itemData };
        }
      } else {
        const filterResponse = await checkItemNames(xmlResponse, itemData)

        if (filterResponse?.length > 0) {
          const xmlResponse = await createStockItems(filterResponse)
          const contentLength = Buffer.byteLength(xmlResponse, 'utf8');

          const response = await axios({
            method: 'GET',
            url: 'http://localhost:9000', // Replace or make configurable as needed.
            headers: {
              'Content-Type': 'application/xml',
              'Content-Length': contentLength, // Setting the Content-Length header.
            },
            data: xmlResponse,
          });

          const data = parseResponse(response?.data)

          if (data?.created === filterResponse?.length) {
            return { success: true, isExist: filterResponse, data: itemData };
          } else {
            return { success: false, data: itemData };
          }
        } else {
          return { success: true, isExist: filterResponse, data: itemData };
        }

      }



    } catch (error: any) {
      console.error('Error in send-tally-xml IPC handler:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-purchase-entry', async (_, payload: {
    invoiceNumber: string;
    invoiceDate: string;
    partyName: string;
    companyName: string;
    purchaseLedger: string;
    items: {
      name: string;
      quantity: number;
      price: number;
      unit?: string;
    }[];
    sgst: { percentage: string, amount: number };
    cgst: { percentage: string, amount: number };
    igst: { percentage: string, amount: number };
    gstNumber: string;
    isWithinState: boolean;
  }) => {
    try {
      // Destructure payload.
      const {
        invoiceNumber,
        invoiceDate,
        partyName,
        companyName,
        purchaseLedger,
        items,
        sgst,
        cgst,
        igst,
        gstNumber,
        isWithinState,
      } = payload;

      // Build the voucher payload.
      // Now we use the top-level tax values instead of relying on the first item.
      const voucherPayload: VoucherPayload = {
        invoiceNumber,
        invoiceDate, // expects dd-mm-yyyy format
        partyName,
        companyName,
        purchaseLedger,
        items: items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          // Use provided unit if available, otherwise default to "PCS"
          unit: item.unit || "PCS",
        })),
        sgst,
        cgst,
        igst,
        gstNumber,
        isWithinState,
      };


      console.log(voucherPayload, "voucherPayload")

      // Call the voucher generator to create the voucher XML.
      const voucherXml = createVoucher(voucherPayload);

      console.log(voucherXml, "voucherXml");

      // Optionally, persist or further process the voucher.
      // return { success: true, voucherXml };
    } catch (error: any) {
      console.error('Error creating purchase entry:', error);
      return { success: false, error: error.message };
    }
  });

  return win;
};



// ipcMain.handle('create-party-name-entry', async (_, partyName: string, gst: string) => {
//   try {
//     const response = await exportAndGetPartyName(partyName, gst);
//     console.log(response)
//     return { success: true, response };
//   } catch (error) {
//     console.error('Error creating party entry:', error);
//     return { success: false, error: error.message };
//   }
// });

// ipcMain.handle('export-ledger', async (_, ledgerName: string, ledgerType: string) => {
//   try {
//     const response = await exportAndCheckLedger(ledgerName, ledgerType);
//     console.log(response)
//     return { success: true, response };
//   } catch (error) {
//     console.error('Error creating purchase entry:', error);
//     return { success: false, error: error.message };
//   }
// });

// ipcMain.handle('create-igst-ledger', async (_, ledgerName: string) => {
//   try {
//     await createIgstLedger(ledgerName);
//     return { success: true, ledgerName };
//   } catch (error) {
//     // You might want to pass more details for error handling
//     return { success: false, error: error.message };
//   }
// });

// ipcMain.handle('create-cgst-ledger', async (_, ledgerName: string) => {
//   try {
//     await createCgstLedger(ledgerName);
//     return { success: true, ledgerName };
//   } catch (error) {
//     // You might want to pass more details for error handling
//     return { success: false, error: error.message };
//   }
// });

// Updated IPC handler to use the new function
// ipcMain.handle('export-unit', async (_, units: any) => {
//   try {
//     // If units is an array, check all; otherwise, wrap it in an array.
//     // const unitsArray = Array.isArray(units) ? units : [units];
//     // const { results } = await exportAndCheckUnits(unitsArray);
//     // // If a single unit was passed, return its existence directly.
//     // return Array.isArray(units) ? { success: true, results } : { success: true, exists: results[0].exists };
//     const response = await exportAndCheckUnits(units);
//     console.log(response)

//     return { success: true, response };
//   } catch (error) {
//     console.error('Error exporting unit:', error);
//     return { success: false, error: error.message };
//   }
// });

// // Updated IPC handler using the new function
// ipcMain.handle('export-item', async (_, items: any) => {
//   try {
//     // Ensure items is treated as an array
//     // const itemsArray = Array.isArray(items) ? items : [items];
//     // const { results } = await exportAndCheckItems(itemsArray);

//     const response = await exportAndCheckItems(items)
//     console.log(response)

//     return { success: true, responses: response };
//   } catch (error) {
//     console.error('Error exporting item:', error);
//     return { success: false, error: error.message };
//   }
// });

// ipcMain.handle('create-item', async (_, itemName: string, symbol: string, decimal: number, hsn: number, gst: number) => {
//   try {
//     await createItem(itemName, symbol, decimal, hsn, gst);
//     return { success: true, itemName };
//   } catch (error) {
//     console.error('Error creating item:', error);
//     return { success: false, error: error.message };
//   }
// });

// ipcMain.handle('create-purchase-entry', async (_, invoiceNumber: string,
//   date: string,
//   partyName: string,
//   purchaseLedger: string,
//   items: {
//     name: string;
//     quantity: number;
//     price: number;
//     cgst: number;
//     sgst: number;
//     igst: number;
//   }[],
//   isWithinState: boolean) => {
//   try {
//     // await createPurchaseEntry(invoiceNumber, date, partyName, purchaseLedger, items, isWithinState);
//     return { success: true };
//   } catch (error) {
//     console.error('Error creating purchase entry:', error);
//     return { success: false, error: error.message };
//   }
// });
