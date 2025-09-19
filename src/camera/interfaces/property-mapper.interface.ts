import { DeviceProperty, PropertyValue } from '../properties/device-properties'

/**
 * Property mapper interface for vendor-specific translations
 */
export interface PropertyMapperInterface {
    /**
     * Map a generic property to vendor-specific code
     * @param property - Generic property
     * @returns Vendor-specific property code
     */
    mapToVendor(property: DeviceProperty): number

    /**
     * Map a vendor-specific code to generic property
     * @param vendorCode - Vendor-specific property code
     * @returns Generic property or null if not mapped
     */
    mapFromVendor(vendorCode: number): DeviceProperty | null

    /**
     * Convert a value to vendor-specific format
     * @param property - Property being set
     * @param value - Generic value
     * @returns Vendor-specific value format
     */
    convertValue(property: DeviceProperty, value: PropertyValue): unknown

    /**
     * Parse a vendor-specific value to generic format
     * @param property - Property being read
     * @param rawValue - Vendor-specific value
     * @returns Generic value format
     */
    parseValue(property: DeviceProperty, rawValue: unknown): PropertyValue

    /**
     * Check if a property is supported by this vendor
     * @param property - Property to check
     */
    isSupported(property: DeviceProperty): boolean

    /**
     * Get all supported properties for this vendor
     */
    getSupportedProperties(): DeviceProperty[]
}
