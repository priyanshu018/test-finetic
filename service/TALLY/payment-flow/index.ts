// GET THE LIST OF LEDGER

import { v4 as uuidv4 } from "uuid";
import { XMLParser } from 'fast-xml-parser';
import { postXml } from "../../tally";

function downloadXML(xml: string, filename = 'stockitems.xml') {
  const blob = new Blob([xml], { type: 'application/xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export function extractBankHolderDetails(bankDataArray: any): {
  holder_name: string;
  ifsc_code: string;
  account_number: string;
} {
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
    return result;
  } catch (error) {
    console.error("❌ Failed to create ledger:", error);
    throw error;
  }
}

export async function extractLedgerCategories(transactions: any[], options: any) {
  const ledgerMap: Map<string, { ledgerName: string; type: string }> = new Map();
  const cashLedgers: Map<string, { ledgerName: string; parent: string }> = new Map();
  for (const txn of transactions) {
    if (!txn.category) continue;

    let originalCategory = txn.category.trim();
    const lowerCategory = originalCategory.toLowerCase();

    if (lowerCategory.includes("cash withdrawal") || lowerCategory.includes("cash deposit")) {
      originalCategory = "Cash";
      const ledgerName = "Cash";
      const parent = "Cash-in-Hand";
      const key = `${ledgerName}|||${parent}`;

      if (!cashLedgers.has(key)) {
        cashLedgers.set(key, { ledgerName, parent });
      }

      txn.category = "Cash";
      txn.classification = "Cash";
      continue;
    }

    const isSuspense =
      txn.classification?.toLowerCase?.() === "suspense" ||
      /\bsuspense\s*(account|a\/?c)?\b/i.test(originalCategory);

    if (isSuspense) {
      // strip any trailing " (Direct|Indirect)" tags if present
      const stripped = originalCategory.replace(/\s*\((Direct|Indirect)\)\s*$/i, "").trim();

      // force canonical ledger name
      const ledgerName = "Suspense Account";
      const parent = "Suspense A/c";
      const key = `${ledgerName}|||${parent}`;

      if (!ledgerMap.has(key)) {
        ledgerMap.set(key, { ledgerName, type: parent });
      }

      // normalize txn fields so downstream code sees it correctly
      txn.category = "Suspense Account";
      txn.classification = "Suspense";
      continue;
    }

    const match = originalCategory.match(/\((Direct|Indirect)\)$/i);
    const tag = match ? match[1] : "Unknown";
    const parent = tag === "Direct" ? "Direct Expenses" : "Indirect Expenses";

    const ledgerName = originalCategory;
    const key = `${ledgerName}|||${parent}`;

    if (!ledgerMap.has(key)) {
      ledgerMap.set(key, { ledgerName, type: parent });
    }
  }

  const existingLedgers: any[] = await fetchLedgerList(options.companyName);
  const existingLedgerKeys = new Set(
    existingLedgers.map((l) => `${l.name.trim()}|||${l.parent?.trim() || ""}`)
  );

  const newBusinessLedgers = Array.from(ledgerMap.entries())
    .filter(([key]) => !existingLedgerKeys.has(key))
    .map(([, ledger]) => ledger);

  const newCashLedgers = Array.from(cashLedgers.entries())
    .filter(([key]) => !existingLedgerKeys.has(key))
    .map(([, ledger]) => ledger);

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
    date: dataValue,
  } = options;


  const toLedger = accountDetails[0]?.holder_name?.trim() || "Bank Account";
  if (!toLedger) throw new Error("❌ Missing holder_name in accountDetails");

  const date = dataValue.replace(/-/g, "");

  const tallyMessages = transactions.map((txn: any, index: number) => {
    const amount = txn.amount;
    const baseUUID = uuidv4();
    const fromLedger = txn.category;
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

  const xmlOutput = `
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
${tallyMessages}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
`.trim();

  // downloadXML(xmlOutput);

  return xmlOutput;
}


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

  // downloadXML(xml, "TallyLedger")

  const response = await postXml(xml)
  const text = await response
  return text;
}

export function generatePaymentVoucherXMLFromPayload(payments: any, options: any, accountDetails: any) {
  const {
    companyName,
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
      date,
    } = entry;

    const resolvedAccount = (account || defaultAccount).trim();
    const resolvedCategory = category?.trim();

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

export function generateReceiptVoucherXMLFromPayload(receipts: any, options: any, accountDetails: any) {
  const {
    companyName,
    voucherType,
    narrationPrefix,
  } = options;

  const defaultAccount = accountDetails[0]?.holder_name?.trim() || "UNKNOWN_ACCOUNT";
  const entries = Array.isArray(receipts) ? receipts : [receipts];
  const voucherBlocks = entries.map((entry, index) => {
    const {
      account,
      category,
      amount,
      date,
      narration = `${narrationPrefix} Receipt for ${category}`,
    } = entry;

    const resolvedAccount = (account || defaultAccount).trim();
    const resolvedCategory = category?.trim();

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
    <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
    <NARRATION>${narration}</NARRATION>
    <PARTYLEDGERNAME>${resolvedAccount}</PARTYLEDGERNAME>

    <!-- Party Account (Credit) - Appears in "Account" field -->
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${resolvedAccount}</LEDGERNAME>
      <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>

    <!-- Category Account (Debit) - Appears in "Particulars" -->
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${resolvedCategory}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${amount.toFixed(2)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER>
</TALLYMESSAGE>`.trim();
  }).filter(Boolean).join("\n");

  const xmlOutput = `
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

  return xmlOutput;
}

export async function processTransactions(transactions: any, tallyInfo: any, accountDetails: any) {
  try {
    const {
      companyName,
      date,
      voucherType,
      narrationPrefix
    } = tallyInfo;

    const { holder_name = "" } = accountDetails[0];

    const formattedTransactions = transactions.map(txn => {
      const classification = txn.classification?.toLowerCase() || "";
      const originalCategory = txn.category?.trim() || "";

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

      category = category.replace(/&/g, " n ");

      return {
        account: holder_name || "Unknown",
        category,
        amount: txn.amount,
        type: txn.transaction_type,
        date: txn.date,
        narration: `${narrationPrefix} Payment for ${txn.vendor}`
      };
    });

    const { newLedgers } = await extractLedgerCategories(formattedTransactions, { companyName });

    if (newLedgers.length > 0) {
      await generateTallyLedgerXML(newLedgers);
    }

    await new Promise(res => setTimeout(res, 1000));

    const cashTransactions = formattedTransactions.filter(
      (txn) => txn.category === "Cash"
    );

    const nonCashTransactions = formattedTransactions.filter(
      (txn) => txn.category !== "Cash"
    );

    let voucherXML = "";

    if (cashTransactions.length > 0) {
      const cashXML = generateContraVoucherXMLFromTransactions(
        cashTransactions,
        accountDetails,
        { companyName, date, voucherType, narrationPrefix }
      );
      voucherXML += cashXML;
    }

    const paymentTransactions = nonCashTransactions.filter(t => t.type === "DEBIT");
    const receiptTransactions = nonCashTransactions.filter(t => t.type === "CREDIT");

    if (paymentTransactions.length > 0) {
      const paymentXML = generatePaymentVoucherXMLFromPayload(
        paymentTransactions,
        { companyName, date, voucherType: "Payment", narrationPrefix },
        accountDetails
      );
      voucherXML += `\n${paymentXML}`;
    }

    if (receiptTransactions.length > 0) {
      const receiptXML = generateReceiptVoucherXMLFromPayload(
        receiptTransactions,
        { companyName, date, voucherType: "Receipt", narrationPrefix },
        accountDetails
      );
      voucherXML += `\n${receiptXML}`;
    }
    // downloadXML(voucherXML,"VoucherXml")

    const res = await postXml(voucherXML);
    const result = await res;

    return { status: true, result };
  } catch (error) {
    console.error("❌ Error in processTransactions:", error.message || error);
    throw error;
  }
}

// Step 1 From Where the Bank Flow Started
export async function startTransactionProcessing(transactions: any, tallyInfo: any, accountDetails: any) {

  try {
    const { companyName } = tallyInfo;

    const { holder_name, ifsc_code, account_number } = accountDetails[0];

    const bankLedgerName = holder_name?.trim();

    if (!bankLedgerName) {
      console.error("❌ Missing holder_name in accountDetails");
      throw new Error("❌ Missing holder_name in accountDetails");
    }

    const existingLedgers = await fetchLedgerList(companyName);
    const existingLedgerNames = existingLedgers.map(l => l.name?.trim());

    if (!existingLedgerNames.includes(bankLedgerName)) {
      await generateAccountLedgerXML({
        name: bankLedgerName,
        parent: "Bank Accounts",
        ifsc: ifsc_code,
        accountNumber: account_number,
        accountHolder: bankLedgerName
      });
    }

    const response = await processTransactions(transactions, tallyInfo, accountDetails);

    return response;
  } catch (error) {
    console.error("❌ Error during transaction processing:", error);

    if (process.env.NODE_ENV === "production") {
      console.error(`[${new Date().toISOString()}] startTransactionProcessing error: ${error.message || error}`);
    }

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
    const response = await postXml(xmlPayload);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });

    const parsed = parser.parse(response);

    const dspNames = parsed?.ENVELOPE?.DSPACCNAME || [];
    const plAmts = parsed?.ENVELOPE?.PLAMT || [];

    const accounts = Array.isArray(dspNames) ? dspNames : [dspNames];
    const amounts = Array.isArray(plAmts) ? plAmts : [plAmts];

    const result = accounts.map((acc, index) => ({
      name: acc?.DSPDISPNAME || '',
      amount: amounts[index]?.PLSUBAMT || '',
    }));

    return result;
  } catch (error) {
    console.error("Failed to fetch Profit and Loss report:", error);
    return [];
  }
}