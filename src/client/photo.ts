import { Photo as PhotoType } from './types'
import { promises as fs } from 'fs'
import path from 'path'

export class Photo implements PhotoType {
    public data: Buffer
    public filename: string
    public size: number
    public capturedAt: Date

    constructor(data: Buffer, filename: string, capturedAt?: Date) {
        this.data = data
        this.filename = filename
        this.size = data.length
        this.capturedAt = capturedAt || new Date()
    }

    async save(filePath: string): Promise<void> {
        const dir = path.dirname(filePath)
        try {
            await fs.access(dir)
        } catch {
            await fs.mkdir(dir, { recursive: true })
        }
        await fs.writeFile(filePath, this.data)
    }

    toJSON() {
        return {
            filename: this.filename,
            size: this.size,
            capturedAt: this.capturedAt,
            dataSize: this.data.length,
        }
    }
}
