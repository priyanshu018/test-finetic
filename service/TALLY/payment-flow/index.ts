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

export async function extractLedgerCategories(transactions) {
    const seen = new Set();
    const results = [];

    const existingLedgers = await fetchLedgerList();
    const existingNames = new Set(
        existingLedgers.map((l) => l.name.trim().toLowerCase())
    );

    for (const txn of transactions) {
        const { category, classification } = txn;
        if (!category || !classification) continue;

        let type = null;
        if (/Direct Business/i.test(classification)) {
            type = "Direct Expenses";
        } else if (/Indirect Business/i.test(classification)) {
            type = "Indirect Expenses";
        } else {
            continue;
        }

        const normalizedCategory = category.trim().toLowerCase();
        const key = `${normalizedCategory}__${type.toLowerCase()}`;

        const isAlreadyInTally = existingNames.has(normalizedCategory);

        if (!seen.has(key) && !isAlreadyInTally) {
            seen.add(key);
            results.push({
                ledgerName: category.trim(),
                type,
            });
        }
    }

    // Skip XML generation and API call if nothing to create
    if (results.length === 0) {
        console.log("✅ All ledgers already exist in Tally. Skipping creation.");
        return {
            newLedgers: [],
            xml: null,
            message: "All ledgers already present. No API call made.",
        };
    }

    // Otherwise, generate and send to Tally
    const xmlPayload = await generateTallyLedgerXML(results);

    return {
        newLedgers: results,
        xml: xmlPayload,
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
</ENVELOPE>`.trim();

    // Now send it to Tally
    try {
        const response = await fetch("http://localhost:8080/http://localhost:9000", {
            method: "POST",
            headers: {
                "Content-Type": "text/xml",
            },
            body: xml,
        });

        const result = await response.text();
        console.log("✅ Tally response:", result);
        return result;
    } catch (error) {
        console.error("❌ Failed to send to Tally:", error);
        return null;
    }
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
            account,
            category,
            amount,
            narration = `${narrationPrefix} Payment for ${category}`
        } = entry;

        const voucherNumber = index + 1;
        const voucherGUID = `GUID-${voucherNumber}-${Date.now()}`;

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
        <UNIQUEREFERENCENUMBER>${Math.random().toString(36).substring(2, 10).toUpperCase()}</UNIQUEREFERENCENUMBER>
        <PAYMENTMODE>Transacted</PAYMENTMODE>
        <BANKPARTYNAME>${category}</BANKPARTYNAME>
        <AMOUNT>${amount.toFixed(2)}</AMOUNT>
      </BANKALLOCATIONS.LIST>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER>
</TALLYMESSAGE>`;
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
</ENVELOPE>`;
}

