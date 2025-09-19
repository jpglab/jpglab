import { PropertyMapperInterface } from '../interfaces/property-mapper.interface'
import { DeviceProperty, PropertyValue } from '../properties/device-properties'
import { PTPDeviceProperties } from '../../core/ptp/ptp-constants'

/**
 * Generic property mapper for standard PTP devices
 * Maps vendor-agnostic properties to standard PTP property codes
 */
export class GenericPropertyMapper implements PropertyMapperInterface {
    private readonly genericToVendor = new Map<DeviceProperty, number>([
        // Standard PTP properties
        [DeviceProperty.BATTERY_LEVEL, PTPDeviceProperties.BATTERY_LEVEL],
        [DeviceProperty.WHITE_BALANCE, PTPDeviceProperties.WHITE_BALANCE],
        [DeviceProperty.APERTURE, PTPDeviceProperties.F_NUMBER],
        [DeviceProperty.FOCUS_MODE, PTPDeviceProperties.FOCUS_MODE],
        [DeviceProperty.EXPOSURE_METERING_MODE, PTPDeviceProperties.EXPOSURE_METERING_MODE],
        [DeviceProperty.FLASH_MODE, PTPDeviceProperties.FLASH_MODE],
        [DeviceProperty.EXPOSURE_MODE, PTPDeviceProperties.EXPOSURE_PROGRAM_MODE],
        [DeviceProperty.IMAGE_SIZE, PTPDeviceProperties.IMAGE_SIZE],
        [DeviceProperty.DATE_TIME, PTPDeviceProperties.DATE_TIME],
    ])

    private readonly vendorToGeneric = new Map<number, DeviceProperty>()

    constructor() {
        // Build reverse mapping
        this.genericToVendor.forEach((vendorCode, genericProp) => {
            this.vendorToGeneric.set(vendorCode, genericProp)
        })
    }

    mapToVendor(property: DeviceProperty): number {
        const vendorCode = this.genericToVendor.get(property)
        if (vendorCode === undefined) {
            throw new Error(`Property ${property} not supported by generic mapper`)
        }
        return vendorCode
    }

    mapFromVendor(vendorCode: number): DeviceProperty | null {
        return this.vendorToGeneric.get(vendorCode) || null
    }

    convertValue(property: DeviceProperty, value: PropertyValue): unknown {
        // Generic implementation - pass through most values
        switch (property) {
            case DeviceProperty.APERTURE:
                // Convert f-stop string to numeric value if needed
                if (typeof value === 'string' && value.startsWith('f/')) {
                    const numValue = parseFloat(value.substring(2))
                    return Math.round(numValue * 100) // Standard PTP uses value * 100
                }
                return value

            case DeviceProperty.WHITE_BALANCE:
                // Map string values to PTP constants if needed
                if (typeof value === 'string') {
                    const wbMap: Record<string, number> = {
                        auto: 0x0002,
                        daylight: 0x0004,
                        fluorescent: 0x0005,
                        incandescent: 0x0006,
                        flash: 0x0007,
                        cloudy: 0x8010,
                        shade: 0x8011,
                    }
                    return wbMap[value.toLowerCase()] || 0x0002
                }
                return value

            default:
                return value
        }
    }

    parseValue(property: DeviceProperty, rawValue: unknown): PropertyValue {
        // Generic implementation - parse vendor values back to generic format
        switch (property) {
            case DeviceProperty.APERTURE:
                if (typeof rawValue === 'number') {
                    return `f/${(rawValue / 100).toFixed(1)}`
                }
                return String(rawValue)

            case DeviceProperty.BATTERY_LEVEL:
                if (typeof rawValue === 'number') {
                    return rawValue // Return as percentage
                }
                return 0

            case DeviceProperty.WHITE_BALANCE:
                if (typeof rawValue === 'number') {
                    const wbMap: Record<number, string> = {
                        0x0002: 'auto',
                        0x0004: 'daylight',
                        0x0005: 'fluorescent',
                        0x0006: 'incandescent',
                        0x0007: 'flash',
                        0x8010: 'cloudy',
                        0x8011: 'shade',
                    }
                    return wbMap[rawValue] || 'auto'
                }
                return String(rawValue)

            default:
                // Return as-is for unknown properties
                if (rawValue === null || rawValue === undefined) {
                    return ''
                }
                if (typeof rawValue === 'object' && rawValue instanceof Uint8Array) {
                    // Try to parse as string if it's a byte array
                    const decoder = new TextDecoder()
                    try {
                        return decoder.decode(rawValue)
                    } catch {
                        return String(rawValue)
                    }
                }
                return rawValue as PropertyValue
        }
    }

    isSupported(property: DeviceProperty): boolean {
        return this.genericToVendor.has(property)
    }

    getSupportedProperties(): DeviceProperty[] {
        return Array.from(this.genericToVendor.keys())
    }
}
