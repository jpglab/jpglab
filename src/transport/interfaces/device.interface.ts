import { TransportType } from './transport-types'

export interface DeviceDescriptor {
    vendorId?: number
    productId?: number
    serialNumber?: string

    manufacturer?: string
    model?: string
    vendor?: string

    usb?: {
        vendorId: number
        productId: number
        path?: string
    }
    ip?: {
        host: string
        port?: number
        protocol?: 'ptp/ip' | 'upnp'
    }

    firmwareVersion?: string
    batteryLevel?: number

    transportType?: TransportType

    device?: USBDevice
}
