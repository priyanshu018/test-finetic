// GET THE LIST OF LEDGER

import { v4 as uuidv4 } from "uuid";
import { XMLParser } from 'fast-xml-parser';
import { postXml } from "../../tally";

export function extractBankHolderDetails(bankDataArray: any): {
  holder_name: string;
  ifsc_code: string;
  account_number: string;
} {
  // Validate input
  if (!bankDataArray) {
    console.warn('Bank data is undefined or null');
    return {
      holder_name: 'Not Available',
      ifsc_code: 'Not Available',
      account_number: 'Not Available'
    };
  }

  if (!Array.isArray(bankDataArray)) {
    console.warn('Bank data is not an array');
    return {
      holder_name: 'Invalid Format',
      ifsc_code: 'Invalid Format',
      account_number: 'Invalid Format'
    };
  }

  if (bankDataArray.length === 0) {
    console.warn('Bank data array is empty');
    return {
      holder_name: 'No Data',
      ifsc_code: 'No Data',
      account_number: 'No Data'
    };
  }

  // Safely extract data with nested optional chaining
  const firstItem = bankDataArray[0] || {};

  try {
    return {
      holder_name: firstItem?.account_holder_information?.holder_name?.trim() || 'Not Provided',
      ifsc_code: firstItem?.account_information?.ifsc_code?.trim() || 'Not Provided',
      account_number: firstItem?.account_information?.account_number?.trim() || 'Not Provided'
    };
  } catch (error) {
    console.error('Error extracting bank details:', error);
    return {
      holder_name: 'Extraction Error',
      ifsc_code: 'Extraction Error',
      account_number: 'Extraction Error'
    };
  }
}

export async function fetchLedgerList(companyName) {
  const xmlPayload = `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Ledgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Ledgers">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME.LIST, PARENT, MASTERID</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

  try {
    const response = await postXml(xmlPayload)

    const xmlText = await response;

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });

    const parsed = parser.parse(xmlText);

    const ledgers = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER;

    if (!ledgers) return [];

    // Always return array
    const ledgerArray = Array.isArray(ledgers) ? ledgers : [ledgers];

    const final = ledgerArray.map((ledger) => {
      const name = ledger?.["LANGUAGENAME.LIST"]?.["NAME.LIST"]?.NAME || ledger.NAME || "";
      const parent = ledger.PARENT || "";
      const masterId = ledger.MASTERID || "";
      return {
        name: typeof name === "string" ? name : name[0]
      };
    });

    return final.filter((l) => l.name);
  } catch (error) {
    console.error("Failed to fetch ledger list:", error);
    return [];
  }
}

export async function generateCashLedgerXML({ name, parent, companyName }) {
  if (!name || !parent) {
    throw new Error("Ledger name and parent are required.");
  }

  const xmlPayload = `
<ENVELOPE>
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
            <NAME>${name}</NAME>
            <PARENT>${parent}</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();


  try {
    const res = await postXml(xmlPayload)

    const result = await res
    console.log("✅ Ledger Created:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to create ledger:", error);
    throw error;
  }
}


export async function generateAccountLedgerXML({
  name,
  parent = "Bank Accounts",
  ifsc,
  accountNumber,
  accountHolder
}: {
  name: string;
  parent?: string;
  ifsc: string;
  accountNumber: string;
  accountHolder: string;
}) {
  const xmlPayload = `
<ENVELOPE>
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
            <NAME>${name}</NAME>
            <PARENT>${parent}</PARENT>
            <IFSCODE>${ifsc}</IFSCODE>
            <BANKDETAILS>${accountNumber}</BANKDETAILS>
            <BANKACCHOLDERNAME>${accountHolder}</BANKACCHOLDERNAME>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();


  try {
    const res = await postXml(xmlPayload)

    const result = await res
    console.log("✅ Ledger Created:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to create ledger:", error);
    throw error;
  }
}


// export async function extractLedgerCategories(transactions, options: any) {
//   console.log({ transactions, options })
//   const classificationMap = {
//     "Trading Variable (Direct Business)": "Direct Expenses",
//     "Trading Variable (Indirect Business)": "Indirect Expenses",
//     "Non-Trading Variable (Indirect Business)": "Indirect Expenses"
//   };

//   const ledgerMap: any = new Map();
//   const cashLedgers: any = new Map();

//   for (const txn of transactions) {
//     if (!txn.category || !txn.classification) continue;

//     const originalCategory = txn.category.trim();
//     const classification = txn.classification.trim();

//     // 🧾 Business Ledger
//     if (classificationMap[classification]) {
//       const parent = classificationMap[classification];
//       const alreadyTagged = /\((Direct|Indirect)\)$/.test(originalCategory);
//       const tag = parent.includes("Direct") ? "Direct" : "Indirect";

//       const ledgerName = alreadyTagged ? originalCategory : `${originalCategory} (${tag})`;
//       const key = `${ledgerName}|||${parent}`;

//       if (!ledgerMap.has(key)) {
//         ledgerMap.set(key, { ledgerName, type: parent });
//       }
//     }

//     // 💵 Cash Ledger
//     if (
//       classification.toLowerCase().includes("cash withdrawal") ||
//       classification.toLowerCase().includes("cash deposit")
//     ) {
//       const ledgerName = originalCategory;
//       const parent = "Cash-in-Hand";
//       const key = `${ledgerName}|||${parent}`;

//       if (!cashLedgers.has(key)) {
//         cashLedgers.set(key, { ledgerName, parent });
//       }
//     }
//   }

//   const existingLedgers: any = await fetchLedgerList(options.companyName);

//   const existingLedgerKeys = new Set(
//     existingLedgers.map(l => `${l.name.trim()}|||${l.parent?.trim() || ""}`)
//   );

//   const newBusinessLedgers: any = [];
//   for (const [key, ledger] of ledgerMap) {
//     if (!existingLedgerKeys.has(key)) {
//       newBusinessLedgers.push(ledger);
//     }
//   }

//   const newCashLedgers = [];
//   for (const [key, ledger] of cashLedgers) {
//     if (!existingLedgerKeys.has(key)) {
//       newCashLedgers.push(ledger);
//     }
//   }

//   // 🧾 Generate XML for business ledgers
//   const businessXML = newBusinessLedgers.length > 0
//     ? generateTallyLedgerXML(newBusinessLedgers)
//     : null;

//   // 💵 Generate XML for each cash ledger (awaited)
//   const cashXMLs = [];
//   for (const ledger of newCashLedgers) {
//     const xml = await generateCashLedgerXML({
//       name: ledger.ledgerName,
//       parent: ledger.parent,
//       companyName: options.companyName
//     });
//     if (xml) cashXMLs.push(xml);
//   }

//   return {
//     newLedgers: [...newBusinessLedgers, ...newCashLedgers],
//     xml: [businessXML, ...cashXMLs].filter(Boolean).join("\n")
//   };
// }


export async function extractLedgerCategories(transactions: any[], options: any) {
  const ledgerMap: Map<string, { ledgerName: string; type: string }> = new Map();
  const cashLedgers: Map<string, { ledgerName: string; parent: string }> = new Map();

  for (const txn of transactions) {
    if (!txn.category) continue;

    const originalCategory = txn.category.trim();
    const lowerCategory = originalCategory.toLowerCase();

    // 💵 Handle Cash Ledgers
    if (lowerCategory.includes("cash withdrawal") || lowerCategory.includes("cash deposit")) {
      const ledgerName = originalCategory;
      const parent = "Cash-in-Hand";
      const key = `${ledgerName}|||${parent}`;

      if (!cashLedgers.has(key)) {
        cashLedgers.set(key, { ledgerName, parent });
      }
      continue;
    }

    // 🧾 Handle Business Ledgers (Direct/Indirect)
    const match = originalCategory.match(/\((Direct|Indirect)\)$/i);
    const tag = match ? match[1] : "Unknown";
    const parent = tag === "Direct" ? "Direct Expenses" : "Indirect Expenses";

    const ledgerName = originalCategory; // Already tagged like "X (Direct)"
    const key = `${ledgerName}|||${parent}`;

    if (!ledgerMap.has(key)) {
      ledgerMap.set(key, { ledgerName, type: parent });
    }
  }

  // Fetch existing ledgers from Tally
  const existingLedgers: any[] = await fetchLedgerList(options.companyName);
  const existingLedgerKeys = new Set(
    existingLedgers.map((l) => `${l.name.trim()}|||${l.parent?.trim() || ""}`)
  );

  // Get new ledgers not present in Tally
  const newBusinessLedgers = Array.from(ledgerMap.entries())
    .filter(([key]) => !existingLedgerKeys.has(key))
    .map(([, ledger]) => ledger);

  const newCashLedgers = Array.from(cashLedgers.entries())
    .filter(([key]) => !existingLedgerKeys.has(key))
    .map(([, ledger]) => ledger);

  // Generate XML
  const businessXML = newBusinessLedgers.length > 0
    ? generateTallyLedgerXML(newBusinessLedgers)
    : null;

  const cashXMLs = [];
  for (const ledger of newCashLedgers) {
    const xml = await generateCashLedgerXML({
      name: ledger.ledgerName,
      parent: ledger.parent,
      companyName: options.companyName,
    });
    if (xml) cashXMLs.push(xml);
  }

  return {
    newLedgers: [...newBusinessLedgers, ...newCashLedgers],
    xml: [businessXML, ...cashXMLs].filter(Boolean).join("\n"),
  };
}



export function generateContraVoucherXMLFromTransactions(transactions: any, accountDetails: any, options: any) {
  const {
    companyName,
    date,
  } = options;

  const fromLedger = "Cash Withdrawal";
  const toLedger = accountDetails[0]?.holder_name?.trim() || "Bank Account";

  if (!toLedger) throw new Error("❌ Missing holder_name in accountDetails");

  const voucherMessages = transactions.map((txn, index) => {
    const amount = txn.amount;
    const date = txn.date.replace(/-/g, "");
    const baseUUID = uuidv4();
    const voucherUUID = `${baseUUID}-0000000${index + 1}`;
    const vchKey = `${voucherUUID}:0000000${index + 3}`;
    const guid = `${baseUUID}-00000005`;
    const uniqueRef = Math.random().toString(36).substring(2, 10).toUpperCase();

    return `
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <VOUCHER REMOTEID="${voucherUUID}" VCHKEY="${vchKey}" VCHTYPE="Contra" ACTION="Create" OBJVIEW="Accounting Voucher View">
    <OLDAUDITENTRYIDS.LIST TYPE="Number">
      <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
    </OLDAUDITENTRYIDS.LIST>
    <DATE>${date}</DATE>
    <REFERENCEDATE>${date}</REFERENCEDATE>
    <VCHSTATUSDATE>${date}</VCHSTATUSDATE>
    <GUID>${guid}</GUID>
    <VOUCHERTYPENAME>Contra</VOUCHERTYPENAME>
    <PARTYLEDGERNAME>${fromLedger}</PARTYLEDGERNAME>
    <VOUCHERNUMBER>${index + 1}</VOUCHERNUMBER>

    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${fromLedger}</LEDGERNAME>
      <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
      <AMOUNT>${amount.toFixed(2)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>

    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${toLedger}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
      <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
      <BANKALLOCATIONS.LIST>
        <DATE>${date}</DATE>
        <INSTRUMENTDATE>${date}</INSTRUMENTDATE>
        <NAME>${uniqueRef}</NAME>
        <TRANSACTIONTYPE>Cash</TRANSACTIONTYPE>
        <TRANSACTIONNAME>Cash</TRANSACTIONNAME>
        <UNIQUEREFERENCENUMBER>${uniqueRef}</UNIQUEREFERENCENUMBER>
        <PAYMENTMODE>Transacted</PAYMENTMODE>
        <ISCONNECTEDPAYMENT>No</ISCONNECTEDPAYMENT>
        <CHEQUEPRINTED>1</CHEQUEPRINTED>
        <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
      </BANKALLOCATIONS.LIST>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER>
</TALLYMESSAGE>
`.trim();
  }).join("\n");

  return `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
${voucherMessages}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();
}


// STEP 2: XML Generator (already provided)
export async function generateTallyLedgerXML(entries = []) {
  const ledgerEntries = Array.isArray(entries) ? entries : [entries];

  const tallyMessages = ledgerEntries.map(({ ledgerName, type }) => `
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <LEDGER NAME="${ledgerName}" RESERVEDNAME="">
        <NAME.LIST>
          <NAME>${ledgerName}</NAME>
        </NAME.LIST>
        <PARENT>${type}</PARENT>
        <GSTAPPLICABLE>Applicable</GSTAPPLICABLE>
        <GSTTYPEOFSUPPLY>Services</GSTTYPEOFSUPPLY>
        <ISCOSTCENTRESON>Yes</ISCOSTCENTRESON>
        <GSTDETAILS.LIST>
          <APPLICABLEFROM>20250401</APPLICABLEFROM>
          <GSTINELIGIBLEITC>Yes</GSTINELIGIBLEITC>
        </GSTDETAILS.LIST>
      </LEDGER>
    </TALLYMESSAGE>
  `).join("");

  const xml = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        ${tallyMessages}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  const response = await postXml(xml)

  const text = await response
  console.log("🧾 Ledger Creation Response:", text);
  return text;
}

export function generatePaymentVoucherXMLFromPayload(payments: any, options: any, accountDetails: any) {
  const {
    companyName,
    date,
    voucherType,
    narrationPrefix,
  } = options;

  const defaultAccount = accountDetails[0]?.holder_name?.trim() || "UNKNOWN_ACCOUNT";
  const entries = Array.isArray(payments) ? payments : [payments];

  const voucherBlocks = entries.map((entry, index) => {
    const {
      account,
      category,
      amount,
      narration = `${narrationPrefix} Payment for ${category}`,
    } = entry;

    const resolvedAccount = (account || defaultAccount).trim();
    const resolvedCategory = category?.trim();

    // Skip invalid entries
    if (!resolvedAccount || !resolvedCategory || amount == null) {
      console.warn(`⚠️ Skipping voucher entry due to missing fields:`, entry);
      return '';
    }

    const voucherNumber = index + 1;
    const uniqueRef = Math.random().toString(36).substring(2, 10).toUpperCase();

    return `
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <VOUCHER VCHTYPE="${voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
    <DATE>${date}</DATE>
    <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
    <PARTYLEDGERNAME>${resolvedAccount}</PARTYLEDGERNAME>
    <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
    <NARRATION>${narration}</NARRATION>

    <!-- Debit Entry -->
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${resolvedCategory}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>

    <!-- Credit Entry -->
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${resolvedAccount}</LEDGERNAME>
      <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${amount.toFixed(2)}</AMOUNT>
      <BANKALLOCATIONS.LIST>
        <DATE>${date}</DATE>
        <INSTRUMENTDATE>${date}</INSTRUMENTDATE>
        <TRANSACTIONTYPE>Cheque</TRANSACTIONTYPE>
        <PAYMENTFAVOURING>${resolvedCategory}</PAYMENTFAVOURING>
        <CHEQUECROSSCOMMENT>A/c Payee</CHEQUECROSSCOMMENT>
        <UNIQUEREFERENCENUMBER>${uniqueRef}</UNIQUEREFERENCENUMBER>
        <PAYMENTMODE>Transacted</PAYMENTMODE>
        <BANKPARTYNAME>${resolvedCategory}</BANKPARTYNAME>
        <AMOUNT>${amount.toFixed(2)}</AMOUNT>
      </BANKALLOCATIONS.LIST>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER>
</TALLYMESSAGE>`.trim();
  }).filter(Boolean).join("\n");

  return `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
${voucherBlocks}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();
}

export async function processTransactions(transactions: any, tallyInfo: any, accountDetails: any) {
  // 🧠 Step 1: Extract metadata
  const {
    companyName,
    date,
    voucherType,
    narrationPrefix
  } = tallyInfo;

  const { holder_name = "" } = accountDetails[0];

  // 🧠 Step 2: Enrich each transaction with appropriate category labeling
  const formattedTransactions = transactions.map(txn => {
    const classification = txn.classification?.toLowerCase();
    const originalCategory = txn.category?.trim();

    // ✅ Skip tagging for cash-related
    const isCash = ["cash withdrawal", "cash deposit"].some(type =>
      classification.includes(type)
    );

    let category = originalCategory;
    if (!isCash) {
      let tag = "Indirect";
      if (classification.includes("direct") && !classification.includes("indirect")) {
        tag = "Direct";
      }
      category = `${originalCategory} (${tag})`;
    }

    return {
      account: holder_name || "Unknown",
      category,
      amount: txn.amount,
      narration: `${narrationPrefix} Payment for ${originalCategory}`
    };
  });

  // 📋 Step 3: Extract and create missing ledgers
  const { newLedgers } = await extractLedgerCategories(formattedTransactions, { companyName });

  console.log({ newLedgers })

  if (newLedgers.length > 0) {
    console.log("📥 Creating missing ledgers...");
    await generateTallyLedgerXML(newLedgers);
  }

  // ⏳ Step 4: Wait for ledger sync
  await new Promise(res => setTimeout(res, 1000));

  // 🧾 Step 5: Generate voucher XML
  const voucherXML = generatePaymentVoucherXMLFromPayload(
    formattedTransactions,
    { companyName, date, voucherType, narrationPrefix },
    accountDetails
  );

  // 🚀 Step 6: Send to Tally
  console.log({ voucherXML })
  const res = await postXml(voucherXML)
  const result = await res
  console.log("✅ Voucher Result:", result);
}


export async function startTransactionProcessing(transactions: any, tallyInfo: any, accountDetails: any) {
  console.log("🚀 Starting transaction processing (Bank Ledger + Expense Categories)...");

  console.log({ tallyInfo, transactions, accountDetails })

  try {
    // Extract tally metadata
    const {
      companyName
    } = tallyInfo;

    // Extract bank account details
    const {
      holder_name,
      ifsc_code,
      account_number
    } = accountDetails[0];

    const bankLedgerName = holder_name?.trim();

    if (!bankLedgerName) {
      throw new Error("❌ Missing holder_name in accountDetails");
    }

    // Step 0: Fetch all ledgers and check if bank exists
    const existingLedgers = await fetchLedgerList(companyName);
    const existingLedgerNames = existingLedgers.map(l => l.name?.trim());

    if (!existingLedgerNames.includes(bankLedgerName)) {
      console.log(`🏦 Bank ledger "${bankLedgerName}" not found. Creating...`);

      await generateAccountLedgerXML({
        name: bankLedgerName,
        parent: "Bank Accounts",
        ifsc: ifsc_code,
        accountNumber: account_number,
        accountHolder: bankLedgerName
      });

      console.log("✅ Bank ledger created successfully.");
    } else {
      console.log(`✅ Bank ledger "${bankLedgerName}" already exists.`);
    }

    // ✅ Step 1: Extract ledger categories from transactions
    const { newLedgers, xml } = await extractLedgerCategories(transactions, { companyName });

    if (newLedgers.length > 0 && xml) {
      console.log(`🧾 Found ${newLedgers.length} new expense ledgers to create.`);
      processTransactions(transactions, tallyInfo, accountDetails)
      console.log("✅ New expense ledgers created.");
    } else {
      console.log("✅ No new expense ledgers needed.");
    }

  } catch (error) {
    console.error("❌ Error during transaction processing:", error);
    throw error;
  }
}
export async function fetchProfitAndLossReport(companyName) {
  const xmlPayload = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Profit and Loss</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

  try {
    const response = await postXml(xmlPayload); // raw XML text from Tally

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });

    const parsed = parser.parse(response);

    const dspNames = parsed?.ENVELOPE?.DSPACCNAME || [];
    const plAmts = parsed?.ENVELOPE?.PLAMT || [];

    // Ensure both are arrays (Tally might send a single object if only one entry)
    const accounts = Array.isArray(dspNames) ? dspNames : [dspNames];
    const amounts = Array.isArray(plAmts) ? plAmts : [plAmts];

    // Pair up name and amount
    const result = accounts.map((acc, index) => ({
      name: acc?.DSPDISPNAME || '',
      amount: amounts[index]?.PLSUBAMT || '',
    }));

    return result; // Final structured array
  } catch (error) {
    console.error("Failed to fetch Profit and Loss report:", error);
    return [];
  }
}