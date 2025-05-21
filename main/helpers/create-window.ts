import {
  screen,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Rectangle,
  ipcMain,
} from "electron";
import { exec, execSync } from "child_process";
import Store from "electron-store";
import * as fs from "fs";
import { parseStringPromise } from "xml2js";
import {
  createPartyLedgerXml,
  createPurchaserLedger,
  createStockItems,
  createTaxLedgers,
  createUnits,
  createVoucher,
  VoucherPayload,
} from "../../service/commonFunction";
import axios from "axios";
import { error } from "console";

export const createWindow = (
  windowName: string,
  options: BrowserWindowConstructorOptions
): BrowserWindow => {
  const key = "window-state";
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

  win.on("close", saveState);

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
  ipcMain.handle("get-running-apps", async () => {
    try {
      const runningApps = await getRunningApplications();
      return runningApps;
    } catch (error) {
      throw new Error(`Failed to get running apps: ${error.message}`);
    }
  });

  // IPC handler to check if Tally is running
  ipcMain.handle("is-tally-running", async () => {
    try {
      const runningApps = await getRunningApplications();
      const tallyProcess = runningApps.find((app: any) =>
        app.ProcessName.toLowerCase().includes("tally")
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
      "C:\\Program Files\\Tally.ERP9",
      "C:\\Program Files (x86)\\Tally.ERP9",
      "C:\\Tally.ERP9",
      "C:\\Program Files\\TallyPrime",
      "C:\\Program Files (x86)\\TallyPrime",
      "C:\\TallyPrime",
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
    return str.trim().split(/\s+/).pop() || "";
  }


  function bringTallyToForegroundAndSendKeys(keys, delayBeforeY = 2000) {
    return new Promise((resolve, reject) => {
      // Check for special keys.
      const promptIndex = keys.findIndex((key) => key === "prompt here");
      const openTallyIndex = keys.findIndex((key) => key === "open tally");
      const percentageIndex = keys.findIndex(
        (key) => key === "percentage here"
      );

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
        const filteredKeys = keys.filter((key) => key !== "open tally");
        const keysString = filteredKeys.join("");
        command += `[System.Windows.Forms.SendKeys]::SendWait('${keysString}'); `;
        command += `Start-Sleep -Milliseconds ${delayBeforeY}; `;
      } else {
        // If "prompt here" exists, iterate through keys and handle them individually.
        keys.forEach((key) => {
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
      const command =
        `powershell -Command ` +
        `"$tallyPath = (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Tally.ERP 9' -ErrorAction SilentlyContinue).InstallPath; ` +
        `if (-not $tallyPath) { $tallyPath = (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\WOW6432Node\\Tally.ERP 9' -ErrorAction SilentlyContinue).InstallPath; } ` +
        `if ($tallyPath) { $tallyPath } else { 'C:\\Program Files\\TallyPrime' }"`; // Fallback to default path

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
    const buffer = Buffer.from(content, "utf-8");
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      content = buffer?.slice(3)?.toString("utf-8");
    }

    // Remove ∩┐╜ characters and invisible Unicode characters
    content = content.replace(/∩┐╜+/g, "").replace(/[^\x20-\x7E\n\r\t<>]/g, "");

    return content;
  }


  async function getLedgerNames(xmlData: string): Promise<string[]> {
    try {
      // Parse the XML with explicitArray: false so that single elements are not wrapped in an array.
      const result = await parseStringPromise(xmlData, {
        explicitArray: false,
      });

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
      "ut/sgst9%",
    ];

    // Compare the expected list with the existing list,
    // and return those items that are not present.
    const missing = expectedLedgers.filter(
      (expected) => !existingLedgers.includes(expected)
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
    const exceptionsMatch = xmlResponse.match(
      /<EXCEPTIONS>(\d+)<\/EXCEPTIONS>/
    );
    const responseMatch = xmlResponse.match(/<RESPONSE>(\d+)<\/RESPONSE>/);

    return {
      created: createdMatch ? parseInt(createdMatch[1], 10) : 0,
      exceptions: exceptionsMatch ? parseInt(exceptionsMatch[1], 10) : 0,
    };
  }


  /**
   * Extracts name + GSTIN for every <LEDGER> in a Tally XML string.
   * @param {string} xmlString - Raw XML containing multiple <LEDGER> elements.
   * @returns {Promise<Array<{ name: string, gst: string }>>}
   */
  const extractLedgerNameAndGST = async (xmlString) => {
    // Parse XML into JS object
    const parsed = await parseStringPromise(xmlString, { explicitArray: false });

    // Navigate into the LEDGER collection
    const collection = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION;
    if (!collection) {
      throw new Error('Cannot find COLLECTION element in the XML.');
    }

    // Normalize to array
    const allLedgers = Array.isArray(collection.LEDGER)
      ? collection.LEDGER
      : [collection.LEDGER];

    // Use a Set to track seen GSTINs
    const seenGST = new Set();
    const uniqueEntries = [];

    for (const ledger of allLedgers) {
      const name = ledger.$?.NAME || '';
      const gst = ledger['LEDGSTREGDETAILS.LIST']?.GSTIN?.trim() || '';

      // Only include non-empty GSTIN and skip duplicates
      if (gst && !seenGST.has(gst)) {
        seenGST.add(gst);
        uniqueEntries.push({ name, gst });
      }
    }

    return uniqueEntries;
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
        } else if (
          ledgerName.includes("Cgst") ||
          ledgerName.includes("Ut/Sgst")
        ) {
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
      const contentLength = Buffer.byteLength(xmlPayload, "utf8");

      // Send the XML payload to Tally (adjust the URL if needed)
      const response = await axios.post("http://localhost:9000", xmlPayload, {
        headers: {
          "Content-Type": "application/xml",
          "Content-Length": contentLength, // Setting the Content-Length header.
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
    date?: string;
    gstin?: string;
  }): Promise<any> {
    try {
      // Build XML for optional fields only if their value is present.
      let optionalFields = "";
      if (ledgerDetails.date && ledgerDetails.country && ledgerDetails.gstin) {
        optionalFields += `            <LEDGSTREGDETAILS.LIST>
                            <APPLICABLEFROM>${ledgerDetails?.date}</APPLICABLEFROM>
                            <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
                            <GSTIN>${ledgerDetails?.gstin}</GSTIN>
                        </LEDGSTREGDETAILS.LIST>
                        <LEDMAILINGDETAILS.LIST>
                            <APPLICABLEFROM>${ledgerDetails?.date}</APPLICABLEFROM>
                            <STATE>${ledgerDetails.state}</STATE>
                            <COUNTRY>${ledgerDetails.country}</COUNTRY>
                        </LEDMAILINGDETAILS.LIST>`;
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
      const contentLength = Buffer.byteLength(xmlPayload, "utf8");

      // Send the XML payload to Tally (using GET as per your curl example)
      const response = await axios.get("http://localhost:9000", {
        headers: {
          "Content-Type": "application/xml",
          "Content-Length": contentLength.toString(),
        },
        data: xmlPayload,
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
      const result = await parseStringPromise(xmlData, {
        explicitArray: false,
      });

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

  async function checkUnitNames(
    existData: string[],
    unitsData: Unit[]
  ): Promise<unit[]> {
    try {
      // Find the units that do not exist in the existData
      const nonMatchingUnits = unitsData.filter(
        (unit) => !existData.includes(unit.name)
      );

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
      const result = await parseStringPromise(xmlData, {
        explicitArray: false,
      });

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

  async function checkItemNames(
    existData: string[],
    itemsData: Item[]
  ): Promise<Item[]> {
    try {
      // Find the items that do not exist in the existData
      const nonMatchingItems = itemsData.filter(
        (item) => !existData.includes(item.Product)
      );

      // Return the full objects of items that do not exist in the existData
      return nonMatchingItems;
    } catch (error) {
      console.error("Error checking non-matching item objects:", error);
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------------------------------------

  // IPC handler to bring Tally to the foreground and send multiple keystrokes

  ipcMain.handle(
    "bring-tally-to-foreground-and-send-keys",
    async (_, keys: string[]) => {
      try {
        await bringTallyToForegroundAndSendKeys(keys);
        return `Sent keys "${keys.join(" ")}" to Tally`;
      } catch (error) {
        throw new Error(`Failed to send keys to Tally: ${error.message}`);
      }
    }
  );

  ipcMain.handle("get-company-data", async (_, xmlData: string) => {
    try {
      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, "utf8");

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: "POST",
        url: "http://localhost:9000", // Replace or make configurable as needed.
        headers: {
          "Content-Type": "application/xml",
          "Content-Length": contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });

      // Parse the returned 
      const result = await parseStringPromise(response.data);

      // Navigate to the COMPANY nodes
      // Depending on your XML, adjust these indexes if needed
      const companiesXml =
        result?.ENVELOPE?.BODY?.[0]?.DATA?.[0]?.COLLECTION?.[0]?.COMPANY || [];

      // Extract the company names
      const companyNames = companiesXml.map((companyNode: any) => {
        // Try the <NAME> element first
        if (companyNode.NAME && companyNode.NAME[0]) {
          return companyNode.NAME[0]._;
        }
        // Fallback to the COMPANY@NAME attribute
        if (companyNode.$ && companyNode.$.NAME) {
          return companyNode.$.NAME;
        }
        return null;
      }).filter((name: string | null) => name !== null);

      return {
        success: true,
        data: companyNames,
      };
    } catch (error: any) {
      console.error("Error in send-tally-xml IPC handler:", error);
      return { success: false, error: error.message };
    }
  });


  ipcMain.handle("get-gst-data", async (_, xmlData: string) => {
    try {
      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, "utf8");

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: "POST",
        url: "http://localhost:9000", // Replace or make configurable as needed.
        headers: {
          "Content-Type": "application/xml",
          "Content-Length": contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });

      console.log({ response, xmlData })

      const extractGST = await extractLedgerNameAndGST(response.data)

      return extractGST

    } catch (error: any) {
      console.error("Error in GET GST DATA IPC handler:", error);
      return { success: false, error: error.message };
    }
  })

  ipcMain.handle("get-tax-ledger-data", async (_, xmlData: string) => {
    try {
      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, "utf8");

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: "POST",
        url: "http://localhost:9000", // Replace or make configurable as needed.
        headers: {
          "Content-Type": "application/xml",
          "Content-Length": contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });

      console.log({ response, xmlData })

      const filterResponse = await getLedgerNames(response.data);
      const missingLedgerResponse = getMissingLedgers(filterResponse);

      console.log({ filterResponse, missingLedgerResponse })

      if (missingLedgerResponse?.length > 0) {
        const createLawLedgerResponse = await createLawLedger(
          missingLedgerResponse
        );
        const responseData = parseResponse(createLawLedgerResponse?.data?.data);


        console.log({ createLawLedgerResponse, responseData })

        if (responseData?.created === missingLedgerResponse?.length) {
          return {
            success: true,
            data: responseData,
            ledgerName: missingLedgerResponse,
          };
        } else {
          return {
            success: false,
            data: responseData,
            ledgerName: missingLedgerResponse,
          };
        }
      } else {
        // Return the data to the renderer process.
        return {
          success: true,
          data: response.data,
          ledgerName: filterResponse,
        };
      }
    } catch (error: any) {
      console.error("Error in send-tally-xml IPC handler:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "create-party-ledger",
    async (_, xmlData: string, partyName: string, partyDetailData) => {
      try {
        // Calculate content length (in bytes) from the XML data.
        const contentLength = Buffer.byteLength(xmlData, "utf8");

        // Make the HTTP request to your endpoint.
        const response = await axios({
          method: "POST",
          url: "http://localhost:9000", // Replace or make configurable as needed.
          headers: {
            "Content-Type": "application/xml",
            "Content-Length": contentLength, // Setting the Content-Length header.
          },
          data: xmlData,
        });

        const filterResponse = await getLedgerNames(response.data);
        const missingLedgerResponse = checkPartyNameExist(
          filterResponse,
          partyName
        );

        if (!missingLedgerResponse) {
          const createPartNameLedger = await createPartyNameUsingXmlApi(
            partyDetailData
          );
          const checkCreatedLedgerResponse = await getLedgerNames(
            response.data
          );
          const data = parseResponse(createPartNameLedger?.data);
          return {
            success: true,
            data,
            ledgerName: checkCreatedLedgerResponse,
          };
        } else {
          return {
            success: true,
            isExist: missingLedgerResponse,
            data: filterResponse,
          };
        }

        // Return the data to the renderer process.
      } catch (error: any) {
        console.error("Error in send-tally-xml IPC handler:", error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    "create-purchaser-ledger",
    async (_, xmlData: string, purchaserName: string) => {

      try {
        // Calculate content length (in bytes) from the XML data.
        const contentLength = Buffer.byteLength(xmlData, "utf8");

        // Make the HTTP request to your endpoint.
        const response = await axios({
          method: "POST",
          url: "http://localhost:9000", // Replace or make configurable as needed.
          headers: {
            "Content-Type": "application/xml",
            "Content-Length": contentLength, // Setting the Content-Length header.
          },
          data: xmlData,
        });

        const filterResponse = await getLedgerNames(response.data);
        const missingLedgerResponse = checkPartyNameExist(
          filterResponse,
          purchaserName
        );

        if (!missingLedgerResponse) {
          const createPurchaseLedger = await createPurchaserLedger(
            purchaserName
          );

          // Calculate content length (in bytes) from the XML data.
          const contentLength = Buffer.byteLength(createPurchaseLedger, "utf8");

          const response = await axios({
            method: "GET",
            url: "http://localhost:9000", // Replace or make configurable as needed.
            headers: {
              "Content-Type": "application/xml",
              "Content-Length": contentLength, // Setting the Content-Length header.
            },
            data: createPurchaseLedger,
          });

          const data = parseResponse(response?.data);
          if (data?.created === 1) {
            return {
              success: true,
              isExist: missingLedgerResponse,
              data: purchaserName,
            };
          } else {
            return { success: false, data: purchaserName, error: response };
          }
        } else {
          return {
            success: true,
            isExist: missingLedgerResponse,
            data: purchaserName,
          };
        }
      } catch (error: any) {
        console.error("Error in send-tally-xml IPC handler:", error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle("create-unit", async (_, unitData: any) => {
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
</ENVELOPE>`;

      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, "utf8");

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: "POST",
        url: "http://localhost:9000", // Replace or make configurable as needed.
        headers: {
          "Content-Type": "application/xml",
          "Content-Length": contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });

      const getDataFromXml = await getUnitNames(response?.data);

      const filterResponse = await checkUnitNames(getDataFromXml, unitData);

      if (filterResponse?.length > 0) {
        const xmlResponse = await createUnits(filterResponse);

        const contentLength = Buffer.byteLength(xmlResponse, "utf8");

        const response = await axios({
          method: "GET",
          url: "http://localhost:9000", // Replace or make configurable as needed.
          headers: {
            "Content-Type": "application/xml",
            "Content-Length": contentLength, // Setting the Content-Length header.
          },
          data: xmlResponse,
        });

        console.log("api response UNIT:", response)

        const data = parseResponse(response?.data);

        if (data?.created === filterResponse?.length) {
          return { success: true, isExist: filterResponse, data: unitData };
        } else {
          return { success: false, data: unitData };
        }
      } else {
        return { success: true, isExist: filterResponse, data: unitData };
      }
    } catch (error: any) {
      console.error("Error in send-tally-xml IPC handler:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("create-item", async (_, itemData: any) => {
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
</ENVELOPE>`;

      // Calculate content length (in bytes) from the XML data.
      const contentLength = Buffer.byteLength(xmlData, "utf8");

      // Make the HTTP request to your endpoint.
      const response = await axios({
        method: "POST",
        url: "http://localhost:9000", // Replace or make configurable as needed.
        headers: {
          "Content-Type": "application/xml",
          "Content-Length": contentLength, // Setting the Content-Length header.
        },
        data: xmlData,
      });


      const xmlResponse = await getStockItemNames(response?.data);

      const filterResponse = await checkItemNames(xmlResponse, itemData);

      const xmlDataToCreate = await createStockItems(filterResponse);

      if (xmlResponse?.length == 0) {

        const contentLength = Buffer.byteLength(xmlDataToCreate, "utf8");

        const response = await axios({
          method: "GET",
          url: "http://localhost:9000", // Replace or make configurable as needed.
          headers: {
            "Content-Type": "application/xml",
            "Content-Length": contentLength, // Setting the Content-Length header.
          },
          data: xmlDataToCreate,
        });

        const data = parseResponse(response?.data);

        console.log({ xmlDataToCreate, data })

        if (data?.created === filterResponse?.length) {
          return { success: true, isExist: filterResponse, data: itemData };
        } else {
          return { success: false, data: itemData };
        }
      } else {
        const filterResponse = await checkItemNames(xmlResponse, itemData);

        if (filterResponse?.length > 0) {
          const xmlResponse = await createStockItems(filterResponse);
          const contentLength = Buffer.byteLength(xmlResponse, "utf8");

          const response = await axios({
            method: "GET",
            url: "http://localhost:9000", // Replace or make configurable as needed.
            headers: {
              "Content-Type": "application/xml",
              "Content-Length": contentLength, // Setting the Content-Length header.
            },
            data: xmlResponse,
          });

          const data = parseResponse(response?.data);

          console.log({ xmlDataToCreate, data })


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
      console.error("Error in send-tally-xml IPC handler:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "create-purchase-entry",
    async (
      _,
      payload: {
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
        sgst?: { percentage: string; amount: number };
        cgst?: { percentage: string; amount: number };
        igst?: { percentage: string; amount: number };
        gstNumber: string;
        isWithinState: boolean;
      }
    ) => {
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

        // Call the voucher generator to create the voucher XML.
        const voucherXml = createVoucher(voucherPayload);


        console.log("VOUCHEER XML DATA:", voucherXml);

        const contentLength = Buffer.byteLength(voucherXml, "utf8");

        const response = await axios({
          method: "POST",
          url: "http://localhost:9000", // Replace or make configurable as needed.
          headers: {
            "Content-Type": "application/xml",
            "Content-Length": contentLength, // Setting the Content-Length header.
          },
          data: voucherXml,
        });

        console.log("api response VOUCHER:", response)


        const data = parseResponse(response?.data);

        console.log(data, "data hetre")

        if (data?.created > 0) {
          return { success: true, data: response?.data };
        }
      } catch (error: any) {
        console.error("Error creating purchase entry:", error);
        return { success: false, error: error.message };
      }
    }
  );

  return win;
};
