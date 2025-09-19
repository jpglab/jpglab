export interface CameraOptions {
    vendor?: string
    model?: string
    serialNumber?: string

    usb?: {
        vendorId?: number
        productId?: number
    }
    ip?: {
        host: string
        port?: number
        protocol?: 'ptp/ip' | 'upnp'
    }

    timeout?: number
}

export interface CameraDescriptor {
    vendor: string
    model: string
    serialNumber?: string

    usb?: {
        vendorId: number
        productId: number
    }
    ip?: {
        host: string
        port: number
    }
}

export interface Photo {
    data: Buffer
    filename: string
    size: number
    capturedAt: Date
    save(path: string): Promise<void>
}

export interface Frame {
    data: Buffer
    width: number
    height: number
    timestamp: number
}

export type ExposureMode = 'auto' | 'manual' | 'aperture' | 'shutter'
