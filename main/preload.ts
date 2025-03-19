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

  createPurchaseEntry: (ledgerName: string,date:number) =>
    ipcRenderer.invoke('create-purchase-entry', ledgerName,date),

  exportLedger: (ledgerName: string) =>
    ipcRenderer.invoke('export-ledger', ledgerName),

  exportItem: (ledgerName: string) =>
    ipcRenderer.invoke('export-item', ledgerName),

  createItem: (itemName: string,symbol:string,decimal: number,hsn: number,gst:number) =>
    ipcRenderer.invoke('create-item', itemName,symbol,decimal,hsn,gst),

});

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
