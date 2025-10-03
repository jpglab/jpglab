import type { LoggerInterface } from '@transport/usb/logger'

export class BrowserLogger implements LoggerInterface {
    addLog(entry: any): number {
        const id = Date.now() + Math.random()
        console.log(`[${entry.type}] ${entry.message}`, entry)
        return id
    }

    updateEntry(id: number, updates: any): number {
        console.log(`[UPDATE ${id}]`, updates)
        return id
    }
}
