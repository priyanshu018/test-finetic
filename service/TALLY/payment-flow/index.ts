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

        const originalCategory = txn.category.trim();
        const classification = txn.classification.trim();
        const parent = classificationMap[classification];

        if (!parent) continue;

        // Check if the category already ends with (Direct) or (Indirect)
        const alreadyTagged = /\((Direct|Indirect)\)$/.test(originalCategory);
        const tag = parent.includes("Direct") ? "Direct" : "Indirect";

        const ledgerName = alreadyTagged
            ? originalCategory
            : `${originalCategory} (${tag})`;

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

export function generatePaymentVoucherXMLFromPayload(payments, options: any = {}, accountDetails = [{}]) {
    const {
        companyName = "PrimeDepth Labs",
        date = "20250401",
        voucherType = "Payment",
        narrationPrefix = "",
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



export async function processTransactions(transactions, tallyInfo = [{}], accountDetails = [{}]) {
    // 🧠 Step 1: Extract metadata
    const {
        companyName = "PrimeDepth Labs",
        date = "20250401",
        voucherType = "Payment",
        narrationPrefix = ""
    } = tallyInfo[0] || {};

    const { holder_name = "" } = accountDetails[0] || {};

    // 🧠 Step 2: Enrich each transaction with (Direct)/(Indirect) category
    const formattedTransactions = transactions.map(txn => {
        const classification = txn.classification?.toLowerCase() || "";

        let categoryType = "Indirect";
        if (classification.includes("direct") && !classification.includes("indirect")) {
            categoryType = "Direct";
        }

        return {
            account: accountDetails[0]?.holder_name || "Unknown",
            category: `${txn.category?.trim()} (${categoryType})`,
            amount: txn.amount,
            narration: `${tallyInfo[0]?.narrationPrefix || ""} Payment for ${txn.category?.trim()}`
        };
    });


    // 📋 Step 3: Extract and create missing ledgers
    const { newLedgers } = await extractLedgerCategories(formattedTransactions, { companyName });

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
