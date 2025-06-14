// GET THE LIST OF LEDGER

// http://localhost:8080/http://localhost:9000

import { XMLParser } from 'fast-xml-parser';

export function extractBankHolderDetails(bankDataArray) {
    if (!Array.isArray(bankDataArray) || bankDataArray.length === 0) {
        throw new Error("Invalid or empty bank data array");
    }

    const firstItem = bankDataArray[0];

    const holderName = firstItem?.account_holder_information?.holder_name || "";
    const ifscCode = firstItem?.account_information?.ifsc_code || "";
    const accountNumber = firstItem?.account_information?.account_number || "";

    return {
        holder_name: holderName,
        ifsc_code: ifscCode,
        account_number: accountNumber
    };
}


export async function fetchLedgerList(companyName = "PrimeDepth Labs") {
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
        const response = await fetch("http://localhost:8080/http://localhost:9000", {
            method: "POST",
            headers: {
                "Content-Type": "text/xml"
            },
            body: xmlPayload
        });

        const xmlText = await response.text();

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
        const res = await fetch("http://localhost:8080/http://localhost:9000", {
            method: "POST",
            headers: { "Content-Type": "text/xml" },
            body: xmlPayload,
        });

        const result = await res.text();
        console.log("✅ Ledger Created:", result);
        return result;
    } catch (error) {
        console.error("❌ Failed to create ledger:", error);
        throw error;
    }
}

export async function extractLedgerCategories(transactions, options = {}) {
    const classificationMap = {
        "Trading Variable (Direct Business)": "Direct Expenses",
        "Trading Variable (Indirect Business)": "Indirect Expenses",
        "Non-Trading Variable (Indirect Business)": "Indirect Expenses",
    };

    const ledgerMap = new Map();

    for (const txn of transactions) {
        if (!txn.category || !txn.classification) continue;

        const categoryName = txn.category.trim();
        const classification = txn.classification.trim();
        const parent = classificationMap[classification];

        if (!parent) continue;

        // New ledger name includes parent tag
        const ledgerName = `${categoryName} (${parent.includes('Direct') ? 'Direct' : 'Indirect'})`;

        const key = `${ledgerName}|||${parent}`;
        if (!ledgerMap.has(key)) {
            ledgerMap.set(key, {
                ledgerName,
                type: parent,
            });
        }
    }

    const existingLedgers = await fetchLedgerList(options.companyName || "PrimeDepth Labs");

    const existingLedgerKeys = new Set(
        existingLedgers.map(l => `${l.name.trim()}|||${l.parent?.trim() || ""}`)
    );

    const newLedgers = [];

    for (const [key, ledger] of ledgerMap) {
        if (!existingLedgerKeys.has(key)) {
            newLedgers.push(ledger);
        }
    }

    return {
        newLedgers,
        xml: newLedgers.length > 0 ? generateTallyLedgerXML(newLedgers) : null,
    };
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

    const response = await fetch("http://localhost:8080/http://localhost:9000", {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xml
    });

    const text = await response.text();
    console.log("🧾 Ledger Creation Response:", text);
    return text;
}


export function generatePaymentVoucherXMLFromPayload(payments, options: any = {}) {
    const {
        companyName = "PrimeDepth Labs",
        date = "20250401",
        voucherType = "Payment",
        narrationPrefix = "",
    } = options;

    const entries = Array.isArray(payments) ? payments : [payments];

    const voucherBlocks = entries.map((entry, index) => {
        const {
            account,      // e.g., "Dollar Ducks TEST"
            category,     // e.g., "Software Subscription"
            amount,
            narration = `${narrationPrefix} Payment for ${category}`,
        } = entry;

        const voucherNumber = index + 1;
        const uniqueRef = Math.random().toString(36).substring(2, 10).toUpperCase();

        return `
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <VOUCHER VCHTYPE="${voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
    <DATE>${date}</DATE>
    <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
    <PARTYLEDGERNAME>${account}</PARTYLEDGERNAME>
    <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
    <NARRATION>${narration}</NARRATION>

    <!-- Debit Entry -->
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${category}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>

    <!-- Credit Entry -->
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${account}</LEDGERNAME>
      <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${amount.toFixed(2)}</AMOUNT>
      <BANKALLOCATIONS.LIST>
        <DATE>${date}</DATE>
        <INSTRUMENTDATE>${date}</INSTRUMENTDATE>
        <TRANSACTIONTYPE>Cheque</TRANSACTIONTYPE>
        <PAYMENTFAVOURING>${category}</PAYMENTFAVOURING>
        <CHEQUECROSSCOMMENT>A/c Payee</CHEQUECROSSCOMMENT>
        <UNIQUEREFERENCENUMBER>${uniqueRef}</UNIQUEREFERENCENUMBER>
        <PAYMENTMODE>Transacted</PAYMENTMODE>
        <BANKPARTYNAME>${category}</BANKPARTYNAME>
        <AMOUNT>${amount.toFixed(2)}</AMOUNT>
      </BANKALLOCATIONS.LIST>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER>
</TALLYMESSAGE>`.trim();
    }).join("\n");

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
export async function processTransactions(transactions, options = {}) {
    const { newLedgers } = await extractLedgerCategories(transactions);

    if (newLedgers.length > 0) {
        console.log("Creating missing ledgers...");
        await generateTallyLedgerXML(newLedgers);
    }

    // Wait before pushing vouchers
    await new Promise(res => setTimeout(res, 1000));

    // Expect `transactions` to already be in proper format for generatePaymentVoucherXMLFromPayload
    // Format: [{ account, category, amount, narration }, ...]
    const voucherXML = generatePaymentVoucherXMLFromPayload(transactions, {
        companyName: options.companyName || "PrimeDepth Labs",
        date: options.date || "20250401",
        voucherType: options.voucherType || "Payment",
        narrationPrefix: options.narrationPrefix || ""
    });

    const res = await fetch("http://localhost:8080/http://localhost:9000", {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: voucherXML
    });

    const result = await res.text();
    console.log("✅ Voucher Result:", result);
}


export async function startTransactionProcessing(transactions, tallyInfo = [{}], accountDetails = [{}]) {
  console.log("🚀 Starting transaction processing (Bank Ledger + Expense Categories)...");

  try {
    // Extract tally metadata
    const {
      companyName = "PrimeDepth Labs"
    } = tallyInfo[0] || {};

    // Extract bank account details
    const {
      holder_name = "",
      ifsc_code = "",
      account_number = ""
    } = accountDetails[0] || {};

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
    //   await sendToTally(xml); // or whatever function you're using to post XML
      console.log("✅ New expense ledgers created.");
    } else {
      console.log("✅ No new expense ledgers needed.");
    }

  } catch (error) {
    console.error("❌ Error during transaction processing:", error);
    throw error;
  }
}



// export async function startTransactionProcessing(transactions, options = {}) {
//     console.log("🚀 Starting transaction processing...");

//     try {
//         const companyName = options.companyName || "PrimeDepth Labs";

//         // Step 1: Extract and create missing ledgers
//         const { newLedgers, xml } = await extractLedgerCategories(transactions, options);

//         console.log(`🧾 Missing Ledgers in ${companyName}:`, newLedgers.map(l => l.ledgerName));

//         // Step 2: Create category ledgers (batch)
//         if (newLedgers.length > 0) {
//             console.log("📥 Creating category ledgers...");
//             await generateTallyLedgerXML(newLedgers);
//         }

//         // Step 3: Prepare only DEBIT transactions for voucher creation
//         const formattedTransactions = transactions
//             .filter(txn => txn.transaction_type?.toUpperCase() === "DEBIT")
//             .map(txn => ({
//                 account: txn.account?.trim(),
//                 category: txn.category?.trim(),
//                 amount: parseFloat(txn.amount),
//                 narration: `${options.narrationPrefix || ""} ${txn.description || `Payment for ${txn.category}`}`,
//             }));

//         if (formattedTransactions.length === 0) {
//             console.warn("⚠️ No DEBIT transactions found to process.");
//             return;
//         }

//         // Step 4: Send transactions to Tally
//         await processTransactions(formattedTransactions, options);

//         console.log("✅ All transactions processed successfully.");
//     } catch (error) {
//         console.error("❌ Failed during transaction processing:", error);
//         throw error;
//     }
// }
