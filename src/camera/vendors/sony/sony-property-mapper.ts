import { PropertyMapperInterface } from '../../interfaces/property-mapper.interface'
import { DeviceProperty, PropertyValue } from '../../properties/device-properties'
import { SonyDeviceProperties, formatFNumber, formatShutterSpeed, formatISO } from './sony-constants'

/**
 * Sony property mapper
 * Maps vendor-agnostic properties to Sony-specific property codes
 */
export class SonyPropertyMapper implements PropertyMapperInterface {
    private readonly genericToVendor = new Map<DeviceProperty, number>([
        // Exposure properties - using exact codes from old architecture
        [DeviceProperty.APERTURE, SonyDeviceProperties.F_NUMBER], // 0x5007
        [DeviceProperty.SHUTTER_SPEED, SonyDeviceProperties.SHUTTER_SPEED], // 0xD20D
        [DeviceProperty.ISO, SonyDeviceProperties.ISO_SENSITIVITY], // 0xD21E

        // Other standard properties
        [DeviceProperty.BATTERY_LEVEL, SonyDeviceProperties.BATTERY_LEVEL],
        [DeviceProperty.WHITE_BALANCE, SonyDeviceProperties.WHITE_BALANCE],
        [DeviceProperty.FOCUS_MODE, SonyDeviceProperties.FOCUS_MODE],
        [DeviceProperty.EXPOSURE_METERING_MODE, SonyDeviceProperties.EXPOSURE_METERING_MODE],
        [DeviceProperty.FLASH_MODE, SonyDeviceProperties.FLASH_MODE],
        [DeviceProperty.EXPOSURE_MODE, SonyDeviceProperties.EXPOSURE_PROGRAM_MODE],
        [DeviceProperty.IMAGE_SIZE, SonyDeviceProperties.IMAGE_SIZE],
        [DeviceProperty.DATE_TIME, SonyDeviceProperties.DATE_TIME],
    ])

    private readonly vendorToGeneric = new Map<number, DeviceProperty>([
        [SonyDeviceProperties.F_NUMBER, DeviceProperty.APERTURE],
        [SonyDeviceProperties.SHUTTER_SPEED, DeviceProperty.SHUTTER_SPEED],
        [SonyDeviceProperties.ISO_SENSITIVITY, DeviceProperty.ISO],
        // Also map alternative ISO properties to the same generic property
        [SonyDeviceProperties.ISO_SENSITIVITY_ALT1, DeviceProperty.ISO],
        [SonyDeviceProperties.ISO_SENSITIVITY_ALT2, DeviceProperty.ISO],
        [SonyDeviceProperties.ISO_SENSITIVITY_ALT3, DeviceProperty.ISO],
    ])

    mapToVendor(property: DeviceProperty): number {
        const vendorCode = this.genericToVendor.get(property)
        if (vendorCode === undefined) {
            throw new Error(`Property ${property} not supported by Sony`)
        }
        return vendorCode
    }

    mapFromVendor(vendorCode: number): DeviceProperty | null {
        return this.vendorToGeneric.get(vendorCode) || null
    }

    convertValue(property: DeviceProperty, value: PropertyValue): unknown {
        switch (property) {
            case DeviceProperty.SHUTTER_SPEED:
                return this.parseShutterSpeed(String(value))

            case DeviceProperty.APERTURE:
                return this.parseAperture(String(value))

            case DeviceProperty.ISO:
                return this.parseISO(value)

            default:
                return value
        }
    }

    parseValue(property: DeviceProperty, rawValue: unknown): PropertyValue {
        switch (property) {
            case DeviceProperty.SHUTTER_SPEED:
                if (rawValue instanceof Uint8Array) {
                    return this.formatShutterSpeedFromBytes(rawValue)
                }
                return formatShutterSpeed(Number(rawValue))

            case DeviceProperty.APERTURE:
                if (typeof rawValue === 'number') {
                    return formatFNumber(rawValue)
                }
                return String(rawValue)

            case DeviceProperty.ISO:
                if (typeof rawValue === 'number') {
                    return formatISO(rawValue)
                }
                return String(rawValue)

            default:
                if (rawValue === null || rawValue === undefined) {
                    return ''
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

    // Private helper methods

    private parseShutterSpeed(value: string): Uint8Array {
        // Parse "1/250" format to Sony's fractional format
        const data = new Uint8Array(8)
        const view = new DataView(data.buffer)

        if (value === 'BULB') {
            view.setUint32(0, 0x00000000, true)
            view.setUint32(4, 0x00000000, true)
            return data
        }

        if (value.startsWith('1/')) {
            const denominator = parseInt(value.substring(2))
            view.setUint32(0, 1, true) // Numerator
            view.setUint32(4, denominator, true) // Denominator
        } else {
            // Handle full seconds like "2"
            const seconds = parseFloat(value.replace('"', ''))
            view.setUint32(0, seconds * 10000, true) // Sony uses 1/10000 seconds
            view.setUint32(4, 10000, true)
        }

        return data
    }

    private parseAperture(value: string): Uint8Array {
        // Convert from "f/2.8" to Sony's format (value * 100)
        const data = new Uint8Array(2)
        const view = new DataView(data.buffer)

        if (value.startsWith('f/')) {
            const fNumber = parseFloat(value.substring(2))
            view.setUint16(0, Math.round(fNumber * 100), true)
        }

        return data
    }

    private parseISO(value: PropertyValue): number {
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase()

            if (lowerValue === 'auto' || lowerValue === 'iso auto') {
                return 0x00ffffff // ISO AUTO
            }

            // Extract numeric ISO value from string like "ISO 400"
            const match = value.match(/\d+/)
            if (match) {
                return parseInt(match[0])
            }
        }

        return Number(value)
    }

    private formatShutterSpeedFromBytes(rawValue: Uint8Array): string {
        if (rawValue.length >= 8) {
            const view = new DataView(rawValue.buffer, rawValue.byteOffset)
            const numerator = view.getUint32(0, true)
            const denominator = view.getUint32(4, true)

            if (numerator === 0 && denominator === 0) {
                return 'BULB'
            }

            if (numerator === 1 && denominator > 1) {
                return `1/${denominator}`
            }

            if (denominator !== 0) {
                const seconds = numerator / denominator
                return seconds >= 1 ? `${seconds}"` : `1/${Math.round(1 / seconds)}`
            }
        }

        return 'Unknown'
    }
}
