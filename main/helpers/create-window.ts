import { screen, BrowserWindow, BrowserWindowConstructorOptions, Rectangle, ipcMain } from 'electron';
import { exec, execSync } from 'child_process';
import Store from 'electron-store';
import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';

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


  function bringTallyToForegroundAndSendKeys(keys, delayBeforeY = 2000) {
    return new Promise((resolve, reject) => {
      // Check if the keys array contains "prompt here"
      const promptIndex = keys.findIndex(key => key === "prompt here");
      const percentageIndex = keys.findIndex(key => key === "percentage here");

      // Build the PowerShell command:
      let command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; `;
      // Use Select-Object -First 1 to ensure a single process is returned
      command += `$tallyProcess = Get-Process | Where-Object { $_.ProcessName -like '*Tally*' } | Select-Object -First 1; `;
      command += `if ($tallyProcess) { `;
      command += `(New-Object -ComObject WScript.Shell).AppActivate($tallyProcess.Id); `;

      if (promptIndex === -1) {
        // No "prompt here": join all keys as before.
        const keysString = keys.join('');
        command += `[System.Windows.Forms.SendKeys]::SendWait('${keysString}'); `;
        command += `Start-Sleep -Milliseconds ${delayBeforeY}; `;
      } else {
        // "prompt here" exists: iterate through keys individually.
        keys.forEach(key => {
          if (key === "prompt here") {
            // Wait for 500 milliseconds before proceeding.
            command += `Start-Sleep -Milliseconds 500; `;
          } else if (key === "percentage here") {
            command += `[System.Windows.Forms.SendKeys]::SendWait('%'); `;
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
      content = buffer.slice(3).toString('utf-8');
    }

    // Remove ∩┐╜ characters and invisible Unicode characters
    content = content.replace(/∩┐╜+/g, '').replace(/[^\x20-\x7E\n\r\t<>]/g, '');

    return content;
  }

  // async function exportAndCheckLedger(ledgerNames: string[], isPurchase: boolean): Promise<void> {
  //   try {
  //     // Step 1: Get Tally installation path and set file path
  //     const tallyInstallPath = await getTallyInstallPath();
  //     const exportedFilePath = `${tallyInstallPath}\\master.xml`;
  //     console.log(`Tally installation path: ${tallyInstallPath}`);
  //     console.log(`Exporting file to: ${exportedFilePath}`);

  //     // Step 2: Trigger Tally export (single export for all ledgers)
  //     const keys = ['%e', 'm', 'e', '{ENTER}', 'prompt here', 'y'];
  //     await bringTallyToForegroundAndSendKeys(keys, 1000);
  //     console.log('Tally export triggered successfully.');

  //     // Step 3: Wait to ensure file is fully exported
  //     console.log('Waiting for the file to be exported...');
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     // Step 4: Check if the exported file exists
  //     if (!fs.existsSync(exportedFilePath)) {
  //       throw new Error(`Exported file not found at ${exportedFilePath}.`);
  //     }

  //     // Step 5: Read and clean XML file
  //     let xmlData = fs.readFileSync(exportedFilePath, { encoding: 'utf-8' });
  //     xmlData = removeBOM(xmlData);
  //     console.log("Cleaned XML Data (First 50 chars):", xmlData.slice(0, 50));

  //     // Step 6: Validate XML content
  //     if (!xmlData.trim().startsWith('<ENVELOPE>')) {
  //       throw new Error('File content is not valid XML.');
  //     }

  //     // Step 7: Parse XML
  //     const parsedXml = await parseStringPromise(xmlData, { explicitArray: false });
  //     console.log('Parsed XML Data:', JSON.stringify(parsedXml, null, 2));

  //     // Step 8: Extract LEDGER details
  //     const tallyMessages = parsedXml?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
  //     if (!tallyMessages) {
  //       throw new Error('No TALLYMESSAGE found in the XML file.');
  //     }
  //     const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];
  //     const ledgers = messagesArray.map((msg: any) => msg.LEDGER).filter(Boolean);

  //     // Step 9: Check each ledger and create if missing
  //     for (const ledgerName of ledgerNames) {
  //       // Append "%" for the existence check
  //       const targetLedgerName = `${ledgerName}%`;
  //       const ledgerExists = ledgers.some((ledger: any) =>
  //         ledger.$?.NAME?.toLowerCase() === targetLedgerName.toLowerCase()
  //       );
  //       console.log(`Ledger "${targetLedgerName}" found: ${ledgerExists}`);

  //       if (!ledgerExists) {
  //         // Append "+5" while creating the ledger
  //         const newLedgerName = `${ledgerName}+5`;
  //         console.log(`Creating ledger "${newLedgerName}"...`);

  //         if (isPurchase) {
  //           // Call purchase ledger creation function
  //           await createPurchaseLedger(newLedgerName);
  //         } else {
  //           // If not a purchase ledger, check ledger type based on its name
  //           const lowerName = ledgerName.toLowerCase();
  //           if (lowerName.includes("igst")) {
  //             await createIgstLedger(newLedgerName);
  //           } else if (lowerName.includes("cgst") || lowerName.includes("ut/sgst")) {
  //             await createCgstLedger(newLedgerName);
  //           } else {
  //             // Fallback: if you have a default ledger creation function, call it here.
  //             console.warn(`No creation function defined for ledger type: ${ledgerName}`);
  //           }
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error in exportAndCheckLedger:', error);
  //     throw error;
  //   }
  // }


  async function exportAndCheckLedger(ledgerNames: string | string[], isPurchase: boolean): Promise<void> {
    try {
      // Convert ledgerNames to an array if it isn't already iterable.
      const ledgerNamesArray = Array.isArray(ledgerNames) ? ledgerNames : [ledgerNames];

      // Step 1: Get Tally installation path and set file path
      const tallyInstallPath = await getTallyInstallPath();
      const exportedFilePath = `${tallyInstallPath}\\master.xml`;
      console.log(`Tally installation path: ${tallyInstallPath}`);
      console.log(`Exporting file to: ${exportedFilePath}`);

      // Step 2: Trigger Tally export (single export for all ledgers)
      const keys = ['%e', 'm', 'e', '{ENTER}', 'prompt here', 'y'];
      await bringTallyToForegroundAndSendKeys(keys, 1000);
      console.log('Tally export triggered successfully.');

      // Step 3: Wait to ensure file is fully exported
      console.log('Waiting for the file to be exported...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 4: Check if the exported file exists
      if (!fs.existsSync(exportedFilePath)) {
        throw new Error(`Exported file not found at ${exportedFilePath}.`);
      }

      // Step 5: Read and clean XML file
      let xmlData = fs.readFileSync(exportedFilePath, { encoding: 'utf-8' });
      xmlData = removeBOM(xmlData);
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
      const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];
      const ledgers = messagesArray.map((msg: any) => msg.LEDGER).filter(Boolean);

      // Step 9: Check each ledger and create if missing
      for (const ledgerName of ledgerNamesArray) {
        // Append "%" for the existence check
        const targetLedgerName = isPurchase ? ledgerName : `${ledgerName}%`;
        const ledgerExists = ledgers.some((ledger: any) =>
          ledger.$?.NAME?.toLowerCase() === targetLedgerName.toLowerCase()
        );
        console.log(`Ledger "${targetLedgerName}" found: ${ledgerExists}`);

        if (!ledgerExists) {
          // Append "+5" while creating the ledger
          const newLedgerName = isPurchase ? ledgerName : `${ledgerName}+5`;
          console.log(`Creating ledger "${newLedgerName}"...`);

          if (isPurchase) {
            await createPurchaseLedger(newLedgerName);
          } else {
            const lowerName = ledgerName.toLowerCase();
            if (lowerName.includes("igst")) {
              await createIgstLedger(newLedgerName);
            } else if (lowerName.includes("cgst") || lowerName.includes("ut/sgst")) {
              await createCgstLedger(newLedgerName);
            } else {
              console.warn(`No creation function defined for ledger type: ${ledgerName}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in exportAndCheckLedger:', error);
      throw error;
    }
  }

  async function exportAndCheckItem(item: {
    Product: string;
    HSN: string;
    symbol?: string;
    decimal?: string | number;
    gst?: string | number;
    SGST?: string;
    CGST?: string;
  }): Promise<boolean> {
    try {
      // Step 1: Get Tally installation path and set file path
      const tallyInstallPath = await getTallyInstallPath();
      const exportedFilePath = `${tallyInstallPath}\\master.xml`;
      console.log(`Tally installation path: ${tallyInstallPath}`);
      console.log(`Exporting file to: ${exportedFilePath}`);

      // Step 2: Trigger Tally export for stock items
      const keys = [
        '%e', 'm', 'c', 'type of master', '{ENTER}',
        'stock items', '{ENTER}', '{ESC}', '{ESC}', 'e',
        'prompt here', 'y'
      ];
      await bringTallyToForegroundAndSendKeys(keys, 1000);
      console.log('Tally export triggered successfully.');

      // Step 3: Wait to ensure file is fully exported
      console.log('Waiting for the file to be exported...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 4: Ensure the exported file exists
      if (!fs.existsSync(exportedFilePath)) {
        throw new Error(`Exported file not found at ${exportedFilePath}.`);
      }

      // Step 5: Read and clean XML file
      let xmlData = fs.readFileSync(exportedFilePath, { encoding: 'utf-8' });
      xmlData = removeBOM(xmlData);
      // console.log("Cleaned XML Data (First 50 chars):", xmlData.slice(0, 50));

      console.log(item)
      // Step 6: Validate XML content
      if (!xmlData.trim().startsWith('<ENVELOPE>')) {
        throw new Error('File content is not valid XML.');
      }

      // Step 7: Parse XML
      const parsedXml = await parseStringPromise(xmlData, { explicitArray: false });
      console.log('Parsed XML Data:', JSON.stringify(parsedXml, null, 2));

      // Step 8: Extract STOCKITEM details
      const tallyMessages = parsedXml?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
      if (!tallyMessages) {
        throw new Error('No TALLYMESSAGE found in the XML file.');
      }
      const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];
      const items = messagesArray.map((msg: any) => msg.STOCKITEM).filter(Boolean);

      // Check if the item exists by matching the STOCKITEM's NAME with the item's Product field
      const itemExists = items.some((stockItem: any) =>
        stockItem.$?.NAME?.toLowerCase() === item.Product?.toLowerCase()
      );
      console.log(`Stock item "${item.Product}" found: ${itemExists}`);

      // If the item does not exist, call createItem with dynamic parameters from the item props
      if (!itemExists) {
        const name = item.Product;
        // Use the provided symbol or derive one dynamically from the product name
        const symbol = item.symbol || "pcs";
        // Use the provided decimal value (or assume dynamic input; no static default is provided)
        const decimal = item.decimal !== undefined ? Number(item.decimal) : 0;
        // Use the provided HSN value converted to a number
        const hsn = item.HSN ? Number(item.HSN) : 0;
        // For GST, use the provided value or, if not given, average SGST and CGST if available
        let gstValue: number;
        if (item.gst !== undefined) {
          gstValue = Number(item.gst);
        } else if (item.SGST !== undefined && item.CGST !== undefined) {
          gstValue = (Number(item.SGST) + Number(item.CGST)) / 2;
        } else {
          gstValue = 0;
        }

        console.log(
          `Item "${name}" does not exist. Creating item with symbol "${symbol}", decimal ${decimal}, HSN ${hsn}, and GST ${gstValue}...`
        );
        await createItem(name, symbol, decimal, hsn, gstValue);
      }

      return itemExists;
    } catch (error) {
      console.error('Error in exportAndCheckItem:', error);
      throw error;
    }
  }

  // Function to export, check, and create a unit if missing
  async function exportAndCheckUnit(unit: {
    Name: string;
    conversionRate?: number;
  }): Promise<boolean> {
    try {
      // Step 1: Get Tally installation path and set file path
      const tallyInstallPath = await getTallyInstallPath();
      const exportedFilePath = `${tallyInstallPath}\\master.xml`;
      console.log(`Tally installation path: ${tallyInstallPath}`);
      console.log(`Exporting file to: ${exportedFilePath}`);

      // Step 2: Trigger Tally export for units
      // Adjust the keys to match your Tally sequence for exporting UNIT masters
      const keys = [
        '%e', 'm', 'c', 'type of master', '{ENTER}', 'units', '{ENTER}', '{ESC}', '{ESC}', 'e',
        'prompt here', 'y'
      ];
      await bringTallyToForegroundAndSendKeys(keys, 1000);
      console.log('Tally export for units triggered successfully.');

      // Step 3: Wait to ensure file is fully exported
      console.log('Waiting for the unit file to be exported...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 4: Ensure the exported file exists
      if (!fs.existsSync(exportedFilePath)) {
        throw new Error(`Exported file not found at ${exportedFilePath}.`);
      }

      // Step 5: Read and clean XML file
      let xmlData = fs.readFileSync(exportedFilePath, { encoding: 'utf-8' });
      xmlData = removeBOM(xmlData);
      console.log("Cleaned XML Data (First 50 chars):", xmlData.slice(0, 50));

      // Step 6: Validate XML content
      if (!xmlData.trim().startsWith('<ENVELOPE>')) {
        throw new Error('File content is not valid XML.');
      }

      // Step 7: Parse XML
      const parsedXml = await parseStringPromise(xmlData, { explicitArray: false });
      console.log('Parsed XML Data:', JSON.stringify(parsedXml, null, 2));

      // Step 8: Extract UNIT details
      const tallyMessages = parsedXml?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
      if (!tallyMessages) {
        throw new Error('No TALLYMESSAGE found in the XML file.');
      }
      const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];
      // Assume each TALLYMESSAGE for units contains a UNIT element
      const units = messagesArray.map((msg: any) => msg.UNIT).filter(Boolean);

      // Step 9: Check if the unit exists by matching UNIT's NAME attribute
      const unitExists = units.some((unitElem: any) =>
        unitElem.$?.NAME?.toLowerCase() === unit.Name.toLowerCase()
      );
      console.log(`Unit "${unit.Name}" found: ${unitExists}`);

      // Step 10: If the unit does not exist, create it dynamically
      if (!unitExists) {
        console.log(`Unit "${unit.Name}" does not exist. Creating unit...`);
        await createUnit(
          unit.Name,
          unit.conversionRate // conversion rate provided dynamically
        );
      }

      return unitExists;
    } catch (error) {
      console.error('Error in exportAndCheckUnit:', error);
      throw error;
    }
  }

  // Example createUnit function using dynamic parameters
  async function createUnit(
    name: string,
    conversionRate: number
  ): Promise<void> {
    try {
      // Bring Tally to the foreground and send keys for unit creation.
      // The key sequence below is an example; adjust it to match your Tally workflow.
      await bringTallyToForegroundAndSendKeys([
        'c',
        'u', 'n', 'i', 't',
        '{ENTER}', // Open unit creation window
        name, '{ENTER}', '{ENTER}', '{ENTER}',                    // Enter unit name
        conversionRate !== undefined ? String(conversionRate) : 1,
        '{ENTER}', // Enter conversion rate (default to 1 if missing)
        'prompt here', 'y', '{ESC}', 'prompt here', 'y', '{ESC}'        // Complete and exit
      ]);
      console.log(`Unit created: ${name}`, conversionRate !== undefined ? String(conversionRate) : '1');
    } catch (error) {
      console.error('Error creating unit:', error);
      throw error;
    }
  }


  async function createPurchaseLedger(ledgerName: string): Promise<void> {
    try {

      // Step 1: Press "c"
      await bringTallyToForegroundAndSendKeys(['c', 'l', 'e', 'd', 'g', 'e', 'r', '{ENTER}', ledgerName, '{ENTER}', '{ENTER}', 'p', 'u', 'r', 'c', 'h', 'a', 's', 'e', ' ', 'a', 'c', 'c', 'o', 'u', 'n', 't',
        '{ENTER}', '{ENTER}', 'g', 's', 't', '{ENTER}', 'g', 'o', 'o', 'd', 's', ' ', 'a', 'n', 'd', ' ', 's', 'e', 'r', 'v', 'i', 'c', 'e', 's',
        '{ENTER}', '^a', '{ESC}', 'prompt here', 'y', '{ESC}']);

    } catch (error) {
      console.error('Error creating purchase ledger:', error);
      throw error;
    }
  }


  async function createPurchaseEntry(
    invoiceNumber: number,
    date: string,
    partyName: string,
    purchaseLedger: string,
    items: { name: string, quantity: number, price: number }[],
    isWithinState: boolean,
    cgst: number,
    sgst: number,
    igst: number
  ): Promise<void> {
    try {
      // Format the date as dd-MM-yyyy (for example, 02-11-2024)
      const dateObj = new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const year = dateObj.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      // Build the keys array
      const keys = [
        'v',
        '{F9}',
        '{F2}',
        date,
        '{ENTER}',
        invoiceNumber,
        '{ENTER}',
        '{ENTER}',
        partyName,
        '{ENTER}',
        '^a',
        '^a',
        purchaseLedger,
        '{ENTER}',
      ];

      // Loop through items and add each item entry
      for (const item of items) {
        keys.push(
          item.name, '{ENTER}',
          item.quantity.toString(), '{ENTER}',
          item.price.toString(), '{ENTER}',
          '{ENTER}' // Move to next row
        );
      }

      // Append keys based on whether it's within the state or not
      if (isWithinState) {
        // If within state, add CGST and SGST entries
        keys.push('{ENTER}', '{ENTER}', `Cgst${cgst}`, '{ENTER}', '{ENTER}', `Sgst${sgst}`, '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}',);
      } else {
        // Else add IGST entry
        keys.push('{ENTER}', '{ENTER}', `Igst${igst}%`, '{ENTER}');
      }

      await bringTallyToForegroundAndSendKeys(keys);
    } catch (error) {
      console.error('Error creating purchase ledger:', error);
      throw error;
    }
  }


  async function createIgstLedger(name: string): Promise<void> {
    try {

      // Step 1: Press "c"
      await bringTallyToForegroundAndSendKeys([
        'c', 'l', 'e', 'd', 'g', 'e', 'r', '{ENTER}',
        name, '{ENTER}', '{ENTER}',
        'D', 'u', 't', 'i', 'e', 's', ' ', '&', ' ', 'T', 'a', 'x', 'e', 's', '{ENTER}',
        'G', 'S', 'T', '{ENTER}',
        'I', 'G', 'S', 'T', '{ENTER}', '{ENTER}', '^a', '{ESC}', 'prompt here', 'y', '{ESC}'
      ]);

    } catch (error) {
      console.error('Error creating purchase ledger:', error);
      throw error;
    }
  }

  async function createCgstLedger(name: string): Promise<void> {
    try {

      // Step 1: Press "c"
      await bringTallyToForegroundAndSendKeys([
        'c', 'l', 'e', 'd', 'g', 'e', 'r', '{ENTER}',
        name, '{ENTER}', '{ENTER}',
        'D', 'u', 't', 'i', 'e', 's', ' ', '&', ' ', 'T', 'a', 'x', 'e', 's', '{ENTER}',
        'G', 'S', 'T', '{ENTER}',
        'C', 'G', 'S', 'T', '{ENTER}', '{ENTER}', '^a', '{ESC}', 'prompt here', 'y', '{ESC}'
      ]);

    } catch (error) {
      console.error('Error creating purchase ledger:', error);
      throw error;
    }
  }


  async function createItem(name: string, symbol: string, decimal: number, hsn: number, gst: number): Promise<void> {
    try {
      // Step 1: Bring Tally to foreground and send keys for item creation
      await bringTallyToForegroundAndSendKeys([
        'c', 'i', 't', 'e', 'm', '{ENTER}',  // Open item creation
        name,
        '{ENTER}', '{ENTER}', '{ENTER}', symbol, '{ENTER}',     // Enter item name and confirm
        '{ENTER}', "specify details", '{ENTER}', hsn, '{ENTER}', '{ENTER}', "specify details", '{ENTER}', '{ENTER}', gst, '{ENTER}', '{ENTER}', '{ENTER}', '{ENTER}', 'prompt here', 'y', '{ESC}', '{ESC}', 
        'prompt here', 'y', '{ESC}'  // Create and exit
      ]);
      console.log(decimal, "decimal")
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }


  // Example usage
  (async () => {
    const ledgerName = 'harjaap';
    try {
      // await createPurchaseLedger(ledgerName);
      // await createIgstLedger('Igst 0+5');
      // await createIgstLedger('Igst 5+5');
      // await createIgstLedger('Igst 12+5');
      // await createIgstLedger('Igst 18+5');
      // await createIgstLedger('Igst 28+5');
      //  await createCgstLedger('Cgst 0+5');
      //  await createCgstLedger('Cgst 2.5+5');
      //  await createCgstLedger('Cgst 6+5');
      //  await createCgstLedger('Cgst 9+5');
      //  await createCgstLedger('Cgst 14+5');


      // await createPurchaseEntry(123456, "02-11-2024", "Priyanshu", "Purchase", [
      //   { name: "Item", quantity: 2, price: 100 },
      //   { name: "Item", quantity: 1, price: 50 },
      // ]);


      // if (ledgerExists) {
      //   console.log(`Ledger "${ledgerName}" exists in the exported file.`);
      // } else {
      //   console.log(`Ledger "${ledgerName}" does not exist in the exported file.`);
      // }
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

  ipcMain.handle('create-igst-ledger', async (_, ledgerName: string) => {
    try {
      await createIgstLedger(ledgerName);
      return { success: true, ledgerName };
    } catch (error) {
      // You might want to pass more details for error handling
      return { success: false, error: error.message };
    }
  });



  ipcMain.handle('create-cgst-ledger', async (_, ledgerName: string) => {
    try {
      await createCgstLedger(ledgerName);
      return { success: true, ledgerName };
    } catch (error) {
      // You might want to pass more details for error handling
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-purchase-entry', async (_, invoiceNumber: number, date: string, partyName: string, purchaseLedger: string, items: { name: string, quantity: number, price: number }[], isWitinState: boolean, cgst: number, sgst: number, igst: number) => {
    try {
      await createPurchaseEntry(invoiceNumber, date, partyName, purchaseLedger, items, isWitinState, cgst, sgst, igst);
      return { success: true };
    } catch (error) {
      console.error('Error creating purchase entry:', error);
      return { success: false, error: error.message };
    }
  });


  ipcMain.handle('export-ledger', async (_, ledgerName: string, isPurchase: boolean) => {
    try {
      await exportAndCheckLedger(ledgerName, isPurchase);
      return { success: true, ledgerName };
    } catch (error) {
      console.error('Error creating purchase entry:', error);
      return { success: false, error: error.message };
    }
  });


  ipcMain.handle('export-item', async (_, items: any) => {
    try {
      const responses: Array<{ product: string; exists: boolean }> = [];
      // If items is an array, iterate; otherwise treat it as a single item.
      const itemsArray = Array.isArray(items) ? items : [items];

      for (const item of itemsArray) {
        // Ensure the item object has a Product property.
        if (!item || !item.Product) {
          throw new Error("Invalid item object passed. 'Product' property is required.");
        }
        const exists = await exportAndCheckItem(item);
        responses.push({ product: item.Product, exists });
      }
      return { success: true, responses };
    } catch (error) {
      console.error('Error exporting item:', error);
      return { success: false, error: error.message };
    }
  });


  ipcMain.handle('export-unit', async (_, units: any) => {
    try {
      // Check if units is an array
      if (Array.isArray(units)) {
        const results = [];
        // Loop through each unit in the array
        for (const unit of units) {
          const exists = await exportAndCheckUnit(unit);
          results.push({ name: unit.Name, exists });
        }
        return { success: true, results };
      } else {
        // Fallback for single unit objects
        const exists = await exportAndCheckUnit(units);
        return { success: true, exists };
      }
    } catch (error) {
      console.error('Error exporting unit:', error);
      return { success: false, error: error.message };
    }
  });




  ipcMain.handle('create-item', async (_, itemName: string, symbol: string, decimal: number, hsn: number, gst: number) => {
    try {
      await createItem(itemName, symbol, decimal, hsn, gst);
      return { success: true, itemName };
    } catch (error) {
      console.error('Error creating item:', error);
      return { success: false, error: error.message };
    }
  });


  return win;
};
