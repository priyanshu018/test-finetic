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
    <ISSIMPLEUNIT>Yes</ISSIMPLEUNIT>
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

export function createStockItems(items: unknown): string {
  // Validate that the input is an array.
  if (!Array.isArray(items)) {
    throw new Error("Payload must be an array of stock item objects.");
  }
  let xmlOutput = ""
  const baseGUID = "bf911d27-633e-4ad7-ba7c-a871d6f9461e-";
  const startingSuffix = 269; // Starting suffix for GUID (example: "00000269")
  const baseAlterID = 1011;   // Starting alterID value

  (items as StockItem[]).forEach((item, index) => {
    const { Product, HSN, SGST, CGST, gst, symbol } = item;

    console.log(Product, HSN, SGST, CGST, gst, symbol)

    // Basic validation for required fields.
    if (
      !Product ||
      !HSN ||
      typeof SGST === "undefined" ||
      typeof CGST === "undefined" ||
      typeof gst === "undefined" ||
      !symbol
    ) {
      // Skip this entry. You can also choose to throw an error or log a warning.
      return "missing argument";
    }

    // Generate a pseudo-unique GUID and ALTERID for each stock item.
    const guidSuffix = (startingSuffix + index).toString().padStart(8, "0");
    const guid = baseGUID + guidSuffix;
    const alterID = baseAlterID + index;

    // Build the XML for the current stock item.
    const xmlItem = `<TALLYMESSAGE xmlns:UDF="TallyUDF">
      <STOCKITEM NAME="${Product}" RESERVEDNAME="">
        <OLDAUDITENTRYIDS.LIST TYPE="Number">
          <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
        </OLDAUDITENTRYIDS.LIST>
        <GUID>${guid}</GUID>
        <PARENT/>
        <CATEGORY>&#4; Not Applicable</CATEGORY>
        <GSTAPPLICABLE>&#4; Applicable</GSTAPPLICABLE>
        <TAXCLASSIFICATIONNAME>&#4; Not Applicable</TAXCLASSIFICATIONNAME>
        <GSTTYPEOFSUPPLY>Goods</GSTTYPEOFSUPPLY>
        <EXCISEAPPLICABILITY>&#4; Applicable</EXCISEAPPLICABILITY>
        <SALESTAXCESSAPPLICABLE/>
        <VATAPPLICABLE>&#4; Applicable</VATAPPLICABLE>
        <COSTINGMETHOD>Avg. Cost</COSTINGMETHOD>
        <VALUATIONMETHOD>Avg. Price</VALUATIONMETHOD>
        <BASEUNITS>${symbol}</BASEUNITS>
        <ADDITIONALUNITS>&#4; Not Applicable</ADDITIONALUNITS>
        <EXCISEITEMCLASSIFICATION>&#4; Not Applicable</EXCISEITEMCLASSIFICATION>
        <VATBASEUNIT>${symbol}</VATBASEUNIT>
        <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
        <ISBATCHWISEON>No</ISBATCHWISEON>
        <ISPERISHABLEON>No</ISPERISHABLEON>
        <ISENTRYTAXAPPLICABLE>No</ISENTRYTAXAPPLICABLE>
        <ISCOSTTRACKINGON>No</ISCOSTTRACKINGON>
        <ISUPDATINGTARGETID>No</ISUPDATINGTARGETID>
        <ISDELETED>No</ISDELETED>
        <ISSECURITYONWHENENTERED>No</ISSECURITYONWHENENTERED>
        <ASORIGINAL>Yes</ASORIGINAL>
        <ISRATEINCLUSIVEVAT>No</ISRATEINCLUSIVEVAT>
        <IGNOREPHYSICALDIFFERENCE>No</IGNOREPHYSICALDIFFERENCE>
        <IGNORENEGATIVESTOCK>No</IGNORENEGATIVESTOCK>
        <TREATSALESASMANUFACTURED>No</TREATSALESASMANUFACTURED>
        <TREATPURCHASESASCONSUMED>No</TREATPURCHASESASCONSUMED>
        <TREATREJECTSASSCRAP>No</TREATREJECTSASSCRAP>
        <HASMFGDATE>No</HASMFGDATE>
        <ALLOWUSEOFEXPIREDITEMS>No</ALLOWUSEOFEXPIREDITEMS>
        <IGNOREBATCHES>No</IGNOREBATCHES>
        <IGNOREGODOWNS>No</IGNOREGODOWNS>
        <ADJDIFFINFIRSTSALELEDGER>No</ADJDIFFINFIRSTSALELEDGER>
        <ADJDIFFINFIRSTPURCLEDGER>No</ADJDIFFINFIRSTPURCLEDGER>
        <CALCONMRP>No</CALCONMRP>
        <EXCLUDEJRNLFORVALUATION>No</EXCLUDEJRNLFORVALUATION>
        <ISMRPINCLOFTAX>No</ISMRPINCLOFTAX>
        <ISADDLTAXEXEMPT>No</ISADDLTAXEXEMPT>
        <ISSUPPLEMENTRYDUTYON>No</ISSUPPLEMENTRYDUTYON>
        <GVATISEXCISEAPPL>No</GVATISEXCISEAPPL>
        <ISADDITIONALTAX>No</ISADDITIONALTAX>
        <ISCESSEXEMPTED>No</ISCESSEXEMPTED>
        <REORDERASHIGHER>No</REORDERASHIGHER>
        <MINORDERASHIGHER>No</MINORDERASHIGHER>
        <ISEXCISECALCULATEONMRP>No</ISEXCISECALCULATEONMRP>
        <INCLUSIVETAX>No</INCLUSIVETAX>
        <GSTCALCSLABONMRP>No</GSTCALCSLABONMRP>
        <MODIFYMRPRATE>No</MODIFYMRPRATE>
        <ALTERID>${alterID}</ALTERID>
        <DENOMINATOR>1</DENOMINATOR>
        <RATEOFVAT>0</RATEOFVAT>
        <VATBASENO>1</VATBASENO>
        <VATTRAILNO>1</VATTRAILNO>
        <VATACTUALRATIO>1</VATACTUALRATIO>
        <SERVICETAXDETAILS.LIST>      </SERVICETAXDETAILS.LIST>
        <VATDETAILS.LIST>      </VATDETAILS.LIST>
        <SALESTAXCESSDETAILS.LIST>      </SALESTAXCESSDETAILS.LIST>
        <GSTDETAILS.LIST>
          <APPLICABLEFROM>20250401</APPLICABLEFROM>
          <TAXABILITY>Taxable</TAXABILITY>
          <SRCOFGSTDETAILS>Specify Details Here</SRCOFGSTDETAILS>
          <GSTCALCSLABONMRP>No</GSTCALCSLABONMRP>
          <ISREVERSECHARGEAPPLICABLE>No</ISREVERSECHARGEAPPLICABLE>
          <ISNONGSTGOODS>No</ISNONGSTGOODS>
          <GSTINELIGIBLEITC>No</GSTINELIGIBLEITC>
          <INCLUDEEXPFORSLABCALC>No</INCLUDEEXPFORSLABCALC>
          <STATEWISEDETAILS.LIST>
            <STATENAME>&#4; Any</STATENAME>
            <RATEDETAILS.LIST>
              <GSTRATEDUTYHEAD>CGST</GSTRATEDUTYHEAD>
              <GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE>
              <GSTRATE>${CGST}</GSTRATE>
            </RATEDETAILS.LIST>
            <RATEDETAILS.LIST>
              <GSTRATEDUTYHEAD>SGST/UTGST</GSTRATEDUTYHEAD>
              <GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE>
              <GSTRATE>${SGST}</GSTRATE>
            </RATEDETAILS.LIST>
            <RATEDETAILS.LIST>
              <GSTRATEDUTYHEAD>IGST</GSTRATEDUTYHEAD>
              <GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE>
              <GSTRATE>${gst}</GSTRATE>
            </RATEDETAILS.LIST>
            <RATEDETAILS.LIST>
              <GSTRATEDUTYHEAD>Cess</GSTRATEDUTYHEAD>
              <GSTRATEVALUATIONTYPE>&#4; Not Applicable</GSTRATEVALUATIONTYPE>
            </RATEDETAILS.LIST>
            <RATEDETAILS.LIST>
              <GSTRATEDUTYHEAD>State Cess</GSTRATEDUTYHEAD>
              <GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE>
            </RATEDETAILS.LIST>
            <GSTSLABRATES.LIST>        </GSTSLABRATES.LIST>
          </STATEWISEDETAILS.LIST>
          <TEMPGSTITEMSLABRATES.LIST>       </TEMPGSTITEMSLABRATES.LIST>
          <TEMPGSTDETAILSLABRATES.LIST>       </TEMPGSTDETAILSLABRATES.LIST>
        </GSTDETAILS.LIST>
        <HSNDETAILS.LIST>
          <APPLICABLEFROM>20250401</APPLICABLEFROM>
          <HSNCODE>${HSN}</HSNCODE>
          <SRCOFHSNDETAILS>Specify Details Here</SRCOFHSNDETAILS>
        </HSNDETAILS.LIST>
        <LANGUAGENAME.LIST>
          <NAME.LIST TYPE="String">
            <NAME>${Product}</NAME>
          </NAME.LIST>
          <LANGUAGEID>1033</LANGUAGEID>
        </LANGUAGENAME.LIST>
        <SCHVIDETAILS.LIST>      </SCHVIDETAILS.LIST>
        <EXCISETARIFFDETAILS.LIST>      </EXCISETARIFFDETAILS.LIST>
        <TCSCATEGORYDETAILS.LIST>      </TCSCATEGORYDETAILS.LIST>
        <TDSCATEGORYDETAILS.LIST>      </TDSCATEGORYDETAILS.LIST>
        <EXCLUDEDTAXATIONS.LIST>      </EXCLUDEDTAXATIONS.LIST>
        <OLDAUDITENTRIES.LIST>      </OLDAUDITENTRIES.LIST>
        <ACCOUNTAUDITENTRIES.LIST>      </ACCOUNTAUDITENTRIES.LIST>
        <AUDITENTRIES.LIST>      </AUDITENTRIES.LIST>
        <OLDMRPDETAILS.LIST>      </OLDMRPDETAILS.LIST>
        <VATCLASSIFICATIONDETAILS.LIST>      </VATCLASSIFICATIONDETAILS.LIST>
        <MRPDETAILS.LIST>      </MRPDETAILS.LIST>
        <REPORTINGUOMDETAILS.LIST>      </REPORTINGUOMDETAILS.LIST>
        <COMPONENTLIST.LIST>      </COMPONENTLIST.LIST>
        <ADDITIONALLEDGERS.LIST>      </ADDITIONALLEDGERS.LIST>
        <SALESLIST.LIST>      </SALESLIST.LIST>
        <PURCHASELIST.LIST>      </PURCHASELIST.LIST>
        <FULLPRICELIST.LIST>      </FULLPRICELIST.LIST>
        <BATCHALLOCATIONS.LIST>      </BATCHALLOCATIONS.LIST>
        <TRADEREXCISEDUTIES.LIST>      </TRADEREXCISEDUTIES.LIST>
        <STANDARDCOSTLIST.LIST>      </STANDARDCOSTLIST.LIST>
        <STANDARDPRICELIST.LIST>      </STANDARDPRICELIST.LIST>
        <EXCISEITEMGODOWN.LIST>      </EXCISEITEMGODOWN.LIST>
        <MULTICOMPONENTLIST.LIST>      </MULTICOMPONENTLIST.LIST>
        <LBTDETAILS.LIST>      </LBTDETAILS.LIST>
        <PRICELEVELLIST.LIST>      </PRICELEVELLIST.LIST>
        <GSTCLASSFNIGSTRATES.LIST>      </GSTCLASSFNIGSTRATES.LIST>
        <EXTARIFFDUTYHEADDETAILS.LIST>      </EXTARIFFDUTYHEADDETAILS.LIST>
        <TEMPGSTITEMSLABRATES.LIST>      </TEMPGSTITEMSLABRATES.LIST>
      </STOCKITEM>
    </TALLYMESSAGE>`;

    xmlOutput += `<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
            </REQUESTDESC>
            <REQUESTDATA>
            ${xmlItem}
             </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>
            `
  });

  console.log(xmlOutput)

  return xmlOutput;
}

export function createVoucher(payload) {

  let totalAmount: number = 0; // Initialize totalAmount to 0

  payload.items.forEach(item => {
    // Calculate the item total and round it to two decimal places
    let itemTotal = Math.round((item.price * item.quantity) * 100) / 100;  // This keeps the result as a number with 2 decimals

    // Add the item total to the total amount
    totalAmount += itemTotal;


  });

  console.log(totalAmount, payload.sgst.amount, payload.cgst.amount);
  if (payload.isWithinState) {
    // Add SGST and CGST for in-state transactions
    totalAmount += payload.sgst.amount + payload.cgst.amount;
    // Log the updated totalAmount after adding taxes
  } else {
    // Add IGST for out-of-state transactions
    totalAmount += payload.igst.amount;
  }

  // Create the XML string
  const xmlString = `
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
              <VOUCHER REMOTEID="${uuidv4()}" VCHKEY="${uuidv4()}:00001" VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Invoice Voucher View">
                <OLDAUDITENTRYIDS.LIST TYPE="Number">
                  <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                </OLDAUDITENTRYIDS.LIST>
                <DATE>${payload?.invoiceDate}</DATE>
                <REFERENCEDATE>${payload?.invoiceDate}</REFERENCEDATE>
                <VCHSTATUSDATE>${payload?.invoiceDate}</VCHSTATUSDATE>
                <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
                <VATDEALERTYPE>Regular</VATDEALERTYPE>
                <COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>
                <PARTYGSTIN>${payload.gstNumber}</PARTYGSTIN>
                <PARTYNAME>${payload.partyName}</PARTYNAME>
                <GSTREGISTRATION TAXTYPE="GST" TAXREGISTRATION="">${payload.companyName}</GSTREGISTRATION>
                <VOUCHERTYPENAME>${payload.purchaseLedger}</VOUCHERTYPENAME>
                <PARTYLEDGERNAME>${payload.partyName}</PARTYLEDGERNAME>
                <VOUCHERNUMBER>3</VOUCHERNUMBER>
                <BASICBUYERNAME>${payload.companyName}</BASICBUYERNAME>
                <CMPGSTREGISTRATIONTYPE>Regular</CMPGSTREGISTRATIONTYPE>
                <REFERENCE>${payload.invoiceNumber}</REFERENCE>
                <PARTYMAILINGNAME>${payload.partyName}</PARTYMAILINGNAME>
                <CONSIGNEEMAILINGNAME>${payload.companyName}</CONSIGNEEMAILINGNAME>
                <CONSIGNEECOUNTRYNAME>India</CONSIGNEECOUNTRYNAME>
                <BASICBASEPARTYNAME>${payload.partyName}</BASICBASEPARTYNAME>
                <NUMBERINGSTYLE>Auto Retain</NUMBERINGSTYLE>
                <CSTFORMISSUETYPE>&#4; Not Applicable</CSTFORMISSUETYPE>
                <CSTFORMRECVTYPE>&#4; Not Applicable</CSTFORMRECVTYPE>
                <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
                <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
                <VCHSTATUSTAXADJUSTMENT>Default</VCHSTATUSTAXADJUSTMENT>
                <VCHSTATUSVOUCHERTYPE>${payload.purchaseLedger}</VCHSTATUSVOUCHERTYPE>
                <VCHSTATUSTAXUNIT>${payload.companyName}</VCHSTATUSTAXUNIT>
                <VCHGSTCLASS>&#4; Not Applicable</VCHGSTCLASS>
                <VCHENTRYMODE>Item Invoice</VCHENTRYMODE>
                <EFFECTIVEDATE>20250401</EFFECTIVEDATE>
                <ISELIGIBLEFORITC>Yes</ISELIGIBLEFORITC>
                <ISINVOICE>Yes</ISINVOICE>
                <ISVATDUTYPAID>Yes</ISVATDUTYPAID>
                <ALTERID> 7</ALTERID>
                <MASTERID> 5</MASTERID>
                <VOUCHERKEY>196481868890120</VOUCHERKEY>
                <VOUCHERRETAINKEY>9</VOUCHERRETAINKEY>
                <VOUCHERNUMBERSERIES>Default</VOUCHERNUMBERSERIES>
                
                  ${payload.items.map(item => {
    let itemTotal = item.price * item.quantity;

    return `<ALLINVENTORYENTRIES.LIST>
                      <STOCKITEMNAME>${item.name}</STOCKITEMNAME>
                       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                       <ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>
                       <ISAUTONEGATE>No</ISAUTONEGATE>
                       <ISCUSTOMSCLEARANCE>No</ISCUSTOMSCLEARANCE>
                       <ISTRACKCOMPONENT>No</ISTRACKCOMPONENT>
                       <ISTRACKPRODUCTION>No</ISTRACKPRODUCTION>
                       <ISPRIMARYITEM>No</ISPRIMARYITEM>
                       <ISSCRAP>No</ISSCRAP>
                      <RATE>${item.price}</RATE>
                      <AMOUNT>-${itemTotal}</AMOUNT>
                      <ACTUALQTY>${item.quantity}</ACTUALQTY>
                      <BILLEDQTY>${item.quantity}</BILLEDQTY>
                      <BATCHALLOCATIONS.LIST>
                      <GODOWNNAME>Main Location</GODOWNNAME>
                      <BATCHNAME>Primary Batch</BATCHNAME>
                      <INDENTNO>&#4; Not Applicable</INDENTNO>
                      <ORDERNO>&#4; Not Applicable</ORDERNO>
                      <TRACKINGNUMBER>&#4; Not Applicable</TRACKINGNUMBER>
                      <DYNAMICCSTISCLEARED>No</DYNAMICCSTISCLEARED>
                      <AMOUNT>-${item.price}</AMOUNT>
                      <ACTUALQTY> ${item.quantity} ${item.unit}</ACTUALQTY>
                      <BILLEDQTY> ${item.quantity} ${item.unit}</BILLEDQTY>
                      <ADDITIONALDETAILS.LIST>        </ADDITIONALDETAILS.LIST>
                      <VOUCHERCOMPONENTLIST.LIST>        </VOUCHERCOMPONENTLIST.LIST>
                      </BATCHALLOCATIONS.LIST>
                       <ACCOUNTINGALLOCATIONS.LIST>
                                <OLDAUDITENTRYIDS.LIST TYPE="Number">
                                    <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                                </OLDAUDITENTRYIDS.LIST>
                                <LEDGERNAME>${payload.purchaseLedger}</LEDGERNAME>
                                <GSTCLASS>&#4; Not Applicable</GSTCLASS>
                                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                <LEDGERFROMITEM>No</LEDGERFROMITEM>
                                <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
                                <ISPARTYLEDGER>No</ISPARTYLEDGER>
                                <GSTOVERRIDDEN>No</GSTOVERRIDDEN>
                                <ISGSTASSESSABLEVALUEOVERRIDDEN>No</ISGSTASSESSABLEVALUEOVERRIDDEN>
                                <STRDISGSTAPPLICABLE>No</STRDISGSTAPPLICABLE>
                                <STRDGSTISPARTYLEDGER>No</STRDGSTISPARTYLEDGER>
                                <STRDGSTISDUTYLEDGER>No</STRDGSTISDUTYLEDGER>
                                <CONTENTNEGISPOS>No</CONTENTNEGISPOS>
                                <ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>
                                <ISCAPVATTAXALTERED>No</ISCAPVATTAXALTERED>
                                <ISCAPVATNOTCLAIMED>No</ISCAPVATNOTCLAIMED>
                                <AMOUNT>-${item.quantity * item.price}.00</AMOUNT>
                            </ACCOUNTINGALLOCATIONS.LIST>
                              </ALLINVENTORYENTRIES.LIST>
                    `;
  }).join('')}
              
                <LEDGERENTRIES.LIST>
                  <OLDAUDITENTRYIDS.LIST TYPE="Number">
                    <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                  </OLDAUDITENTRYIDS.LIST>
                  <LEDGERNAME>${payload.partyName}</LEDGERNAME>
                  <GSTCLASS>&#4; Not Applicable</GSTCLASS>
                  <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
                  <AMOUNT>${totalAmount}</AMOUNT>
                  <BILLALLOCATIONS.LIST>
                    <NAME>${payload.invoiceNumber}</NAME>
                    <BILLTYPE>New Ref</BILLTYPE>
                    <TDSDEDUCTEEISSPECIALRATE>No</TDSDEDUCTEEISSPECIALRATE>
                    <AMOUNT>${totalAmount}</AMOUNT>
                  </BILLALLOCATIONS.LIST>
                </LEDGERENTRIES.LIST>
                ${payload.isWithinState ? `
                     <LEDGERENTRIES.LIST>
                            <OLDAUDITENTRYIDS.LIST TYPE="Number">
                                <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                            </OLDAUDITENTRYIDS.LIST>
                            <APPROPRIATEFOR>&#4; Not Applicable</APPROPRIATEFOR>
                            <ROUNDTYPE>&#4; Not Applicable</ROUNDTYPE>
                            <LEDGERNAME>cgst${payload.cgst.percentage}</LEDGERNAME>
                            <GSTCLASS>&#4; Not Applicable</GSTCLASS>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${payload.cgst.amount}.00</AMOUNT>
                            <VATEXPAMOUNT>-${payload.cgst.amount}.00</VATEXPAMOUNT>
                        </LEDGERENTRIES.LIST>
                          <LEDGERENTRIES.LIST>
                            <OLDAUDITENTRYIDS.LIST TYPE="Number">
                                <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                            </OLDAUDITENTRYIDS.LIST>
                            <APPROPRIATEFOR>&#4; Not Applicable</APPROPRIATEFOR>
                            <ROUNDTYPE>&#4; Not Applicable</ROUNDTYPE>
                            <LEDGERNAME>ut/sgst${payload.sgst.percentage}</LEDGERNAME>
                            <GSTCLASS>&#4; Not Applicable</GSTCLASS>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${payload.sgst.amount}.00</AMOUNT>
                            <VATEXPAMOUNT>-${payload.sgst.amount}.00</VATEXPAMOUNT>
                        </LEDGERENTRIES.LIST>
                  ` : `
                   <LEDGERENTRIES.LIST>
                            <OLDAUDITENTRYIDS.LIST TYPE="Number">
                                <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                            </OLDAUDITENTRYIDS.LIST>
                            <APPROPRIATEFOR>&#4; Not Applicable</APPROPRIATEFOR>
                            <ROUNDTYPE>&#4; Not Applicable</ROUNDTYPE>
                            <LEDGERNAME>igst${payload.igst.percentage}</LEDGERNAME>
                            <GSTCLASS>&#4; Not Applicable</GSTCLASS>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${payload.igst.amount}.00</AMOUNT>
                            <VATEXPAMOUNT>-${payload.igst.amount}.00</VATEXPAMOUNT>
                        </LEDGERENTRIES.LIST>
                  `
    }
              </VOUCHER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
  `;

  return xmlString;
}



/** Extracts LEDGER names from a Tally XML string. */
export async function getLedgerNames(xmlData: string): Promise<string[]> {
  const result: any = await parseStringPromise(xmlData, { explicitArray: false });
  const collection = result?.ENVELOPE?.BODY?.DATA?.COLLECTION;
  // if (!collection) throw new Error('Cannot find COLLECTION element');
  const ledgers = Array.isArray(collection?.LEDGER)
    ? collection?.LEDGER
    : [collection?.LEDGER];
  return ledgers?.map((lg: any) => lg?.$?.NAME);
}

export async function getStockItemNames(xmlData: string): Promise<string[]> {
  const result: any = await parseStringPromise(xmlData, { explicitArray: false });

  const collection = result?.ENVELOPE?.BODY?.DATA?.COLLECTION;
  if (!collection) {
    throw new Error('Cannot find COLLECTION element');
  }

  const stockItems = collection?.STOCKITEM;

  const stockArray = Array.isArray(stockItems) ? stockItems : [stockItems];

  const names = stockArray
    .filter((item) => item?.$?.NAME)
    .map((item) => item.$.NAME);

  return names;
}
