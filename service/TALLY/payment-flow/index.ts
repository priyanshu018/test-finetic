// GET THE LIST OF LEDGER

// http://localhost:8080/http://localhost:9000

import { XMLParser } from 'fast-xml-parser';

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
    const accountMap = new Map();   // { accountName => { ifsc, accountNumber, accountHolder } }
    const categorySet = new Set();

    for (const txn of transactions) {
        // Prepare account map
        if (txn.account && !accountMap.has(txn.account.trim())) {
            accountMap.set(txn.account.trim(), {
                name: txn.account.trim(),
                ifsc: txn.ifsc || "",
                accountNumber: txn.accountNumber || "",
                accountHolder: txn.accountHolder || txn.account.trim(),
            });
        }

        // Collect categories
        if (txn.category) {
            categorySet.add(txn.category.trim());
        }
    }

    const allLedgerNames = [...accountMap.keys(), ...categorySet];

    // Fetch existing ledgers from Tally
    const existingLedgers = await fetchLedgerList(options.companyName || "PrimeDepth Labs");
    const existingLedgerNames = existingLedgers.map(l => l.name.trim());

    // Step 1: Create missing account ledgers
    for (const [accountName, details] of accountMap.entries()) {
        if (!existingLedgerNames.includes(accountName)) {
            console.log(`🏦 Creating account ledger: ${accountName}`);
            await generateAccountLedgerXML(details);
        }
    }

    // Step 2: Identify missing category ledgers
    const newCategories = [...categorySet].filter(name => !existingLedgerNames.includes(name));
    const newLedgers = newCategories.map(name => ({
        ledgerName: name,
        type: "Indirect Expenses",
    }));

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

// export async function startTransactionProcessing(transactions, options = {}) {
//     console.log("first")
//     try {
//         const companyName = options.companyName || "PrimeDepth Labs";

//         const { newLedgers, xml } = await extractLedgerCategories(transactions);

//         console.log(`🧾 Missing Ledgers in ${companyName}:`, newLedgers.map(l => l.ledgerName));

//         return { newLedgers, xml };
//     } catch (error) {
//         console.error("❌ Failed during ledger extraction:", error);
//         throw error;
//     }
// }


export async function startTransactionProcessing(transactions, options = {}) {
    console.log("🚀 Starting transaction processing...");

    try {
        const companyName = options.companyName || "PrimeDepth Labs";

        // Step 1: Extract and create missing ledgers
        const { newLedgers, xml } = await extractLedgerCategories(transactions, options);

        console.log(`🧾 Missing Ledgers in ${companyName}:`, newLedgers.map(l => l.ledgerName));

        // Step 2: Create category ledgers (batch)
        if (newLedgers.length > 0) {
            console.log("📥 Creating category ledgers...");
            await generateTallyLedgerXML(newLedgers);
        }

        // Step 3: Prepare only DEBIT transactions for voucher creation
        const formattedTransactions = transactions
            .filter(txn => txn.transaction_type?.toUpperCase() === "DEBIT")
            .map(txn => ({
                account: txn.account?.trim(),
                category: txn.category?.trim(),
                amount: parseFloat(txn.amount),
                narration: `${options.narrationPrefix || ""} ${txn.description || `Payment for ${txn.category}`}`,
            }));

        if (formattedTransactions.length === 0) {
            console.warn("⚠️ No DEBIT transactions found to process.");
            return;
        }

        // Step 4: Send transactions to Tally
        await processTransactions(formattedTransactions, options);

        console.log("✅ All transactions processed successfully.");
    } catch (error) {
        console.error("❌ Failed during transaction processing:", error);
        throw error;
    }
}

