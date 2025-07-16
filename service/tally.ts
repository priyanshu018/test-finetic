// @ts-nocheck
import { apiRequest } from './api';
import { parseStringPromise } from 'xml2js';
import {
  createPurchaserLedger as xmlCreatePurchaserLedger,
  createUnits as xmlCreateUnits,
  createStockItems as xmlCreateStockItems,
  createVoucher as xmlCreateVoucher,
  getLedgerNames,
  Unit,
  StockItem,
  VoucherPayload,
} from './commonFunction';

/**
 * Generic helper to POST XML to Tally HTTP interface and return raw XML response.
 */
export async function postXml(xmlData: string): Promise<string> {
  return await apiRequest('', 'POST', xmlData, {}, 'application/xml', 'text');
}

/**
 * Parse the CREATED/EXCEPTIONS counts from a Tally XML response.
 */
function parseResponse(xmlResponse: string) {
  const createdMatch = xmlResponse.match(/<CREATED>(\d+)<\/CREATED>/);
  const exceptionsMatch = xmlResponse.match(/<EXCEPTIONS>(\d+)<\/EXCEPTIONS>/);
  return {
    created: createdMatch ? parseInt(createdMatch[1], 10) : 0,
    exceptions: exceptionsMatch ? parseInt(exceptionsMatch[1], 10) : 0,
  };
}

/**
 * Expected tax ledger names for GST configuration.
 */
const expectedTaxLedgers = [
  'cgst0%', 'cgst2.5%', 'cgst6%', 'cgst9%', 'cgst14%',
  'igst0%', 'igst5%', 'igst12%', 'igst18%', 'igst28%',
  'ut/sgst0%', 'ut/sgst2.5%', 'ut/sgst6%', 'ut/sgst9%', 'ut/sgst14%'
];

/**
 * Filter out expected tax ledgers that are missing from existing names.
 */
function getMissingLedgers(existing: string[]): string[] {
  return expectedTaxLedgers.filter((name) => !existing.includes(name));
}

/**
 * Generate and POST XML to create missing tax ledgers.
 */
async function createLawLedger(ledgers: string[]): Promise<{ success: boolean; data: string }> {
  let xmlPayload = `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
  <REQUESTDATA>`;
  for (const name of ledgers) {
    const taxType = name.toLowerCase().startsWith('igst') ? 'IGST' : 'CGST';
    xmlPayload += `<TALLYMESSAGE xmlns:UDF="TallyUDF">
    <LEDGER Action="Create">
      <NAME>${name}</NAME>
      <PARENT>Duties &amp; Taxes</PARENT>
      <TAXTYPE>${taxType}</TAXTYPE>
    </LEDGER>
</TALLYMESSAGE>`;
  }
  xmlPayload += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
  try {
    const data = await postXml(xmlPayload);
    return { success: true, data };
  } catch {
    return { success: false, data: '' };
  }
}

/**
 * Extract name + GSTIN for each <LEDGER> in XML.
 */
async function extractLedgerNameAndGST(xmlString: string): Promise<Array<{ name: string; gst: string }>> {
  const parsed = await parseStringPromise(xmlString, { explicitArray: false });
  const coll = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION;
  if (!coll) return [];
  const all = Array.isArray(coll.LEDGER) ? coll.LEDGER : [coll.LEDGER];
  const seen = new Set<string>();
  const out: Array<{ name: string; gst: string }> = [];
  for (const lg of all) {
    const name = lg?.$?.NAME || '';
    const gst = lg?.['LEDGSTREGDETAILS.LIST']?.GSTIN?.trim() || '';
    if (gst && !seen.has(gst)) {
      seen.add(gst);
      out.push({ name, gst });
    }
  }
  return out;
}

/**
 * Fetch company names via Tally HTTP.
 */
export async function getCompanyData(xmlData: string) {
  const data = await postXml(xmlData);
  const res: any = await parseStringPromise(data, { explicitArray: false });
  const comps = res?.ENVELOPE?.BODY?.DATA?.COLLECTION?.COMPANY || [];
  const names = Array.isArray(comps)
    ? comps.map((c: any) => c.NAME?._ || c.$?.NAME)
    : [comps.NAME?._ || comps.$?.NAME];
  return { success: true, data: names };
}

export async function getCurrentCompanyData() {
  const xmlData = `<ENVELOPE>
    <HEADER>
      <VERSION>1</VERSION>
      <TALLYREQUEST>Export</TALLYREQUEST>
      <TYPE>Collection</TYPE>
      <ID>CompanyInfo</ID>
    </HEADER>
    <BODY>
      <DESC>
        <TDL>
          <TDLMESSAGE>
            <!-- Define an object that holds the current company name -->
            <OBJECT NAME="CurrentCompany">
              <LOCALFORMULA>CurrentCompany: ##SVCURRENTCOMPANY</LOCALFORMULA>
            </OBJECT>
            <!-- Collection that uses the above object -->
            <COLLECTION NAME="CompanyInfo">
              <OBJECTS>CurrentCompany</OBJECTS>
            </COLLECTION>
          </TDLMESSAGE>
        </TDL>
      </DESC>
    </BODY>
  </ENVELOPE>
  `

  try {
    const data = await postXml(xmlData);
    const res: any = await parseStringPromise(data, { explicitArray: false });

    const raw = res?.ENVELOPE?.BODY?.DATA?.COLLECTION?.CURRENTCOMPANY?.CURRENTCOMPANY;
    const name = typeof raw === "object" ? raw._ : raw;

    if (name) {
      return { success: true, data: name };
    } else {
      return { success: false, error: "Active company name not found." };
    }
  } catch (error) {
    return { success: false, error };
  }
}



/**
 * Fetch GST-ledger entries via Tally HTTP.
 */
export async function getGSTData(xmlData: string) {
  const data = await postXml(xmlData);
  return await extractLedgerNameAndGST(data);
}

/**
 * Ensure tax-ledgers exist or create them.
 */
export async function getTaxLedgerData(xmlData: string) {
  const data = await postXml(xmlData);
  const existing = await getLedgerNames(data);
  const missing = getMissingLedgers(existing);
  if (missing.length) {
    const resp = await createLawLedger(missing);
    const parsed = parseResponse(resp.data);
    return { success: parsed.created === missing.length, data: parsed, ledgerName: missing };
  }
  return { success: true, data: {}, ledgerName: existing };
}

/**
 * Create a party ledger if not exists.
 */
export async function createPartyName(
  xmlData: string,
  partyName: string,
  detail: any
) {
  const data = await postXml(xmlData);
  const existing = await getLedgerNames(data);
  const exist = existing.includes(partyName);
  if (!exist) {
    // build import XML
    let xml = `<ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER Action="Create">
            <NAME>${detail.name}</NAME>
            <PARENT>${detail.parent}</PARENT>
            ${detail.date && detail.gstin ? `<LEDGSTREGDETAILS.LIST>
              <APPLICABLEFROM>${detail.date}</APPLICABLEFROM>
              <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
              <GSTIN>${detail.gstin}</GSTIN>
            </LEDGSTREGDETAILS.LIST>
            <LEDMAILINGDETAILS.LIST>
              <APPLICABLEFROM>${detail.date}</APPLICABLEFROM>
              <STATE>${detail.state}</STATE>
              <COUNTRY>${detail.country}</COUNTRY>
            </LEDMAILINGDETAILS.LIST>` : ''}
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
    const resp = await postXml(xml);
    const parsed = parseResponse(resp);
    const names = await getLedgerNames(data);
    return { success: true, data: parsed, ledgerName: names };
  }
  return { success: true, isExist: true, data: existing };
}

/**
 * Create a purchaser ledger if not exists.
 */
export async function createPurchaserLedger(
  xmlData: string,
  purchaserName: string
) {
  const data = await postXml(xmlData);
  const existing = await getLedgerNames(data);
  const exist = existing.includes(purchaserName);
  if (!exist) {
    const xml = xmlCreatePurchaserLedger(purchaserName);
    const resp = await apiRequest('', 'POST', xml, {}, 'application/xml', 'text');
    const parsed = parseResponse(resp);
    return { success: parsed.created === 1, data: purchaserName };
  }
  return { success: true, isExist: true, data: purchaserName };
}

/**
 * Create units if missing.
 */
export async function createUnit(units: Unit[]) {
  const data = await postXml(`<ENVELOPE>
    <HEADER><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>Custom List of Units</ID></HEADER>
    <BODY><DESC><TDL><TDLMESSAGE>
      <COLLECTION NAME="Custom List of Units"><TYPE>Units</TYPE><NATIVEMETHOD>MasterID</NATIVEMETHOD><NATIVEMETHOD>GUID</NATIVEMETHOD></COLLECTION>
    </TDLMESSAGE></TDL></DESC></BODY>
</ENVELOPE>`);
  const existNames = await getLedgerNames(data);
  const missing = units.filter((u) => !existNames.includes(u.name));
  if (missing.length) {
    const xml = xmlCreateUnits(missing);
    const resp = await postXml(xml);
    const parsed = parseResponse(resp);
    return { success: parsed.created === missing.length, data: units };
  }
  return { success: true, isExist: [], data: units };
}

/**
 * Create stock items if missing.
 */
export async function createItem(items: StockItem[]) {
  const data = await postXml(`<ENVELOPE>
    <HEADER><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>Custom List of StockItems</ID></HEADER>
    <BODY><DESC><TDL><TDLMESSAGE>
      <COLLECTION NAME="Custom List of StockItems"><TYPE>StockItem</TYPE><NATIVEMETHOD>MasterID</NATIVEMETHOD><NATIVEMETHOD>GUID</NATIVEMETHOD></COLLECTION>
    </TDLMESSAGE></TDL></DESC></BODY>
</ENVELOPE>`);
  const existNames = await getLedgerNames(data);
  const missing = items.filter((it) => !existNames.includes(it.Product));
  console.log(missing)
  if (missing.length) {
    const xml = xmlCreateStockItems(missing);
    console.log(xml, "xml")
    const resp = await postXml(xml);
    const parsed = parseResponse(resp);
    return { success: parsed.created === missing.length, data: items };
  }
  return { success: true, isExist: [], data: items };
}

/**
 * Create a purchase voucher entry.
 */
export async function createPurchaseEntry(payload: VoucherPayload) {
  const xml = xmlCreateVoucher(payload);
  console.log(xml)
  const resp = await postXml(xml);
  const parsed = parseResponse(resp);
  return { success: parsed.created > 0, data: resp };
}