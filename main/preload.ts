import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

contextBridge.exposeInMainWorld('electron', {
  bringTallyToForegroundAndSendKeys: (keys: string[]) =>
    ipcRenderer.invoke('bring-tally-to-foreground-and-send-keys', keys),

  getTaxLedgerData: (xmlData: string) => ipcRenderer.invoke('get-tax-ledger-data', xmlData),

  createPartyName: (xmlData: string, partyName: string, ledgerDetails: {
    name: string;
    parent: string;
    address?: string;
    country?: string;
    state?: string;
    mobile?: string;
    gstin?: string;
  }) => ipcRenderer.invoke('create-party-ledger', xmlData, partyName, ledgerDetails),

  createPurchaserLedger: (xmlData: string, purchaserName: string) => ipcRenderer.invoke("create-purchaser-ledger", xmlData, purchaserName),

  createUnit: (unitData: any) => ipcRenderer.invoke("create-unit", unitData),

  createItem: (itemData: any) => ipcRenderer.invoke("create-item", itemData),

  createPurchaseEntry: (payload: {
    invoiceNumber: string;
    invoiceDate: string;
    partyName: string;
    companyName:string;
    purchaseLedger: string;
    items: {
      name: string;
      quantity: number;
      price: number;
      unit?: string;
    }[];
    sgst: any;
    cgst: any;
    igst: any;
    gstNumber:any;
    isWithinState: boolean;
  }) => ipcRenderer.invoke("create-purchase-entry", payload),
});



contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler



// exportAndCreatePartyNameEntry: (partyName: string, gst: string) =>
//   ipcRenderer.invoke('create-party-name-entry', partyName, gst),

// exportAndCreateLedger: (ledgerName: string, ledgerType: string) =>
//   ipcRenderer.invoke('export-ledger', ledgerName, ledgerType),

// createIgstLedger: (ledgerName: string) =>
//   ipcRenderer.invoke('create-igst-ledger', ledgerName),

// createCgstLedger: (ledgerName: string) =>
//   ipcRenderer.invoke('create-cgst-ledger', ledgerName),

// exportUnit: (unit: {
//   Name: string;
//   conversionRate?: number;
// }) =>
//   ipcRenderer.invoke('export-unit', unit),

// exportItem: (item: {
//   Product: string;
//   HSN: string;
//   symbol?: string;
//   decimal?: string | number;
//   gst?: string | number;
//   SGST?: string;
//   CGST?: string;
// }) =>
//   ipcRenderer.invoke('export-item', item),

// createItem: (itemName: string, symbol: string, decimal: number, hsn: number, gst: number) =>
//   ipcRenderer.invoke('create-item', itemName, symbol, decimal, hsn, gst),

// createPurchaseEntry: (payload: {
//   invoiceNumber: string;
//   invoiceData: string;
//   partyName: string;
//   purchaseLedger: string;
//   items: {
//     name: string;
//     quantity: number;
//     price: number;
//     unit?: string;
//   }[];
//   sgst: string;
//   cgst: string;
//   igst: string;
//   isWithinState: boolean;
// }) =>
//   ipcRenderer.invoke('create-purchase-entry', payload),
