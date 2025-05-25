// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import { parseStringPromise } from 'xml2js';

/** Unit interface */
export interface Unit {
  name: string;
  decimal: number;
}

/** StockItem interface */
export interface StockItem {
  Product: string;
  HSN: string;
  SGST: number;
  CGST: number;
  gst: number;
  symbol: string;
}

/** Item interface for voucher entries */
export interface Item {
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

/** VoucherPayload interface */
export interface VoucherPayload {
  invoiceNumber: string;
  invoiceDate: string; // dd-mm-yyyy
  partyName: string;
  companyName: string;
  purchaseLedger: string;
  items: Item[];
  sgst?: { percentage: string; amount: number };
  cgst?: { percentage: string; amount: number };
  igst?: { percentage: string; amount: number };
  gstNumber: string;
  isWithinState: boolean;
}

/** Generates XML for creating a purchaser ledger. */
export function createPurchaserLedger(name: string): string {
  if (!name) throw new Error('Purchase name is required');
  return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <LEDGER NAME="${name}" Action="Create">
            <NAME>${name}</NAME>
            <PARENT>Purchase Accounts</PARENT>
            <APPROPRIATEFOR>GST</APPROPRIATEFOR>
            <GSTAPPROPRIATETO>Goods and Services</GSTAPPROPRIATETO>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/** Generates XML for creating multiple units. */
export function createUnits(units: Unit[]): string {
  const messages = units.map((u, i) => {
    const guid = `bf911d27-633e-4ad7-ba7c-a871d6f9461e-${(263 + i)
      .toString()
      .padStart(8, '0')}`;
    const alterID = 1005 + i;
    return `<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <UNIT NAME="${u.name}" RESERVEDNAME="">
    <NAME>${u.name}</NAME>
    <GUID>${guid}</GUID>
    <ALTERID>${alterID}</ALTERID>
    <DECIMALPLACES>${u.decimal}</DECIMALPLACES>
  </UNIT>
</TALLYMESSAGE>`;
  });
  return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        ${messages.join('\n')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/** Generates XML for creating multiple stock items. */
export function createStockItems(items: StockItem[]): string {
  const messages = items.map((it, i) => {
    const guid = `bf911d27-633e-4ad7-ba7c-a871d6f9461e-${(269 + i)
      .toString()
      .padStart(8, '0')}`;
    const alterID = 1011 + i;
    return `<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <STOCKITEM NAME="${it.Product}" RESERVEDNAME="">
    <GUID>${guid}</GUID>
    <ALTERID>${alterID}</ALTERID>
    <BASEUNITS>${it.symbol}</BASEUNITS>
  </STOCKITEM>
</TALLYMESSAGE>`;
  });
  return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        ${messages.join('\n')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/** Generates XML for creating a purchase voucher. */
export function createVoucher(payload: VoucherPayload): string {
  const remoteId = uuidv4();
  const vchKey = `${uuidv4()}:00001`;
  const itemsXml = payload.items
    .map(
      (it) => `<ALLINVENTORYENTRIES.LIST>
  <STOCKITEMNAME>${it.name}</STOCKITEMNAME>
  <RATE>${it.price}</RATE>
  <AMOUNT>-${it.price * it.quantity}</AMOUNT>
  <ACTUALQTY>${it.quantity} ${it.unit}</ACTUALQTY>
</ALLINVENTORYENTRIES.LIST>`
    )
    .join('');
  return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER REMOTEID="${remoteId}" VCHKEY="${vchKey}" VCHTYPE="Purchase" ACTION="Create">
            <DATE>${payload.invoiceDate}</DATE>
            <PARTYLEDGERNAME>${payload.partyName}</PARTYLEDGERNAME>
            <VOUCHERNUMBER>${payload.invoiceNumber}</VOUCHERNUMBER>
            ${itemsXml}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/** Extracts LEDGER names from a Tally XML string. */
export async function getLedgerNames(xmlData: string): Promise<string[]> {
  const result: any = await parseStringPromise(xmlData, { explicitArray: false });
  const collection = result?.ENVELOPE?.BODY?.DATA?.COLLECTION;
  if (!collection) throw new Error('Cannot find COLLECTION element');
  const ledgers = Array.isArray(collection.LEDGER)
    ? collection.LEDGER
    : [collection.LEDGER];
  return ledgers.map((lg: any) => lg.$.NAME);
}