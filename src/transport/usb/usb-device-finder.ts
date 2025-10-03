import { DeviceFinderInterface, DeviceSearchCriteria, DeviceDescriptor } from '@transport/interfaces/device.interface'
import { VendorIDs } from '@ptp/definitions/vendor-ids'
import { getUSBAPI } from './usb-api'

/**
 * USB device finder implementation
 */
export class USBDeviceFinder implements DeviceFinderInterface {
    private usb: USB | null = null

    private async getUSB(): Promise<USB> {
        if (!this.usb) {
            this.usb = await getUSBAPI()
        }
        return this.usb
    }

    /**
     * Find USB devices matching criteria
     */
    async findDevices(criteria: DeviceSearchCriteria): Promise<DeviceDescriptor[]> {
        const usb = await this.getUSB()
        const devices = await usb.getDevices()

        return devices
            .filter(device => {
                if (criteria.vendorId !== undefined && criteria.vendorId !== 0 && device.vendorId !== criteria.vendorId) {
                    return false
                }
                if (criteria.productId !== undefined && criteria.productId !== 0 && device.productId !== criteria.productId) {
                    return false
                }
                return true
            })
            .map(device => ({
                device,
                vendorId: device.vendorId,
                productId: device.productId,
                manufacturer: device.manufacturerName || undefined,
                model: device.productName || undefined,
                serialNumber: device.serialNumber || undefined,
            }))
    }

    /**
     * Request device access
     */
    async requestDevice(criteria: DeviceSearchCriteria): Promise<DeviceDescriptor> {
        const usb = await this.getUSB()

        const filters: USBDeviceFilter[] = []
        
        // If no specific vendor requested, show only supported vendors
        if (criteria.vendorId === undefined || criteria.vendorId === 0) {
            // Add filters for all supported vendors
            Object.values(VendorIDs).forEach(vendorId => {
                filters.push({ vendorId })
            })
        } else if (criteria.vendorId !== undefined) {
            filters.push({ vendorId: criteria.vendorId })
        }
        
        if (criteria.productId !== undefined && criteria.vendorId !== undefined && criteria.vendorId !== 0) {
            filters[0] = { ...filters[0], productId: criteria.productId }
        }

        const device = await usb.requestDevice({ filters })

        return {
            device,
            vendorId: device.vendorId,
            productId: device.productId,
            manufacturer: device.manufacturerName || undefined,
            model: device.productName || undefined,
            serialNumber: device.serialNumber || undefined,
        }
    }

    /**
     * Get all available USB devices
     */
    async getAllDevices(): Promise<DeviceDescriptor[]> {
        const usb = await this.getUSB()
        const devices = await usb.getDevices()

        return devices.map(device => ({
            device,
            vendorId: device.vendorId,
            productId: device.productId,
            manufacturer: device.manufacturerName || undefined,
            model: device.productName || undefined,
            serialNumber: device.serialNumber || undefined,
        }))
    }
}
