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

  createIgstLedger: (ledgerName: string) =>
    ipcRenderer.invoke('create-igst-ledger', ledgerName),

  createCgstLedger: (ledgerName: string) =>
    ipcRenderer.invoke('create-cgst-ledger', ledgerName),

  createPurchaseEntry: (invoiceNumber: string, date: string, partyName: string, purchaseLedger: string, items: { name: string, quantity: number, price: number }[], isWitinState: boolean, cgst: number, sgst: number, igst: number) =>
    ipcRenderer.invoke('create-purchase-entry', invoiceNumber, date, partyName, purchaseLedger, items, isWitinState, cgst, sgst, igst),

  exportLedger: (ledgerName: string, isPurchase: boolean) =>
    ipcRenderer.invoke('export-ledger', ledgerName, isPurchase),

  exportItem: (item: {
    Product: string;
    HSN: string;
    symbol?: string;
    decimal?: string | number;
    gst?: string | number;
    SGST?: string;
    CGST?: string;
  }) =>
    ipcRenderer.invoke('export-item', item),

    exportUnit: (unit: {
      Name: string;
      conversionRate?: number;
    }) =>
      ipcRenderer.invoke('export-unit', unit),

  createItem: (itemName: string, symbol: string, decimal: number, hsn: number, gst: number) =>
    ipcRenderer.invoke('create-item', itemName, symbol, decimal, hsn, gst),

});

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
