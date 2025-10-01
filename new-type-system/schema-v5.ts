/**
 * PTP and Sony Schema Definitions using v5 Type System
 * Demonstrates the separated encode/decode/map pattern
 */

import {
    defineOperation,
    defineProperty,
    defineSchema,
    createParameter,
    codes,
    DataType,
    type MapEntry,
} from './types-v5';

// ============================================================================
// PTP Standard Schema
// ============================================================================

export const PTP_SCHEMA = defineSchema({
    vendor: codes.vendor(0x0000),
    name: 'PTP Standard',
    version: '1.0.0',
    operations: [
        defineOperation({
            code: codes.operation(0x1001),
            name: 'GET_DEVICE_INFO',
            description: 'Get device information',
        }),
        
        defineOperation({
            code: codes.operation(0x1002),
            name: 'OPEN_SESSION',
            description: 'Open a new session',
            parameters: [
                createParameter({
                    name: 'sessionId',
                    dataType: DataType.UINT32,
                    description: 'Session ID to open',
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x1003),
            name: 'CLOSE_SESSION',
            description: 'Close the current session',
        }),
        
        defineOperation({
            code: codes.operation(0x1014),
            name: 'GET_DEVICE_PROP_DESC',
            description: 'Get device property description',
            parameters: [
                createParameter({
                    name: 'propertyCode',
                    dataType: DataType.UINT16,
                    description: 'Property code to query',
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x1015),
            name: 'GET_DEVICE_PROP_VALUE',
            description: 'Get device property value',
            parameters: [
                createParameter({
                    name: 'propertyCode',
                    dataType: DataType.UINT16,
                    description: 'Property code to get value for',
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x1016),
            name: 'SET_DEVICE_PROP_VALUE',
            description: 'Set device property value',
            parameters: [
                createParameter({
                    name: 'propertyCode',
                    dataType: DataType.UINT16,
                    description: 'Property code to set value for',
                }),
            ],
            expectsData: true,
            dataDescription: 'New property value',
        }),
    ],
    
    properties: [
        defineProperty({
            code: codes.property(0x5001),
            name: 'BATTERY_LEVEL',
            dataType: DataType.UINT8,
            description: 'Battery level percentage',
            writable: false,
            unit: '%',
        }),
        
        defineProperty({
            code: codes.property(0x5007),
            name: 'F_NUMBER',
            dataType: DataType.UINT16,
            description: 'Aperture f-stop value',
            writable: true,
            unit: 'F-Stop',
            // Custom encode/decode for f-stop values
            encode: (value: string): Uint8Array => {
                const match = value.match(/^f\/(\d+(?:\.\d+)?)$/);
                if (!match) throw new Error(`Invalid aperture: ${value}`);
                const fStop = parseFloat(match[1]);
                const encoded = Math.round(fStop * 10);
                return new Uint8Array([encoded & 0xFF, (encoded >> 8) & 0xFF]);
            },
            decode: (buffer: Uint8Array): string => {
                const value = buffer[0] | (buffer[1] << 8);
                const fStop = value / 10;
                return `f/${fStop}`;
            },
        }),
        
        defineProperty({
            code: codes.property(0x500D),
            name: 'EXPOSURE_TIME',
            dataType: DataType.UINT32,
            description: 'Exposure time',
            writable: true,
            unit: 'Seconds',
            // Custom encode/decode for exposure time
            encode: (value: string): Uint8Array => {
                const match = value.match(/^1\/(\d+)$/);
                if (match) {
                    const denominator = parseInt(match[1]);
                    const buffer = new Uint8Array(4);
                    buffer[0] = 1;
                    buffer[2] = denominator & 0xFF;
                    buffer[3] = (denominator >> 8) & 0xFF;
                    return buffer;
                }
                const seconds = parseFloat(value);
                const numerator = Math.round(seconds * 1000);
                const buffer = new Uint8Array(4);
                buffer[0] = numerator & 0xFF;
                buffer[1] = (numerator >> 8) & 0xFF;
                buffer[2] = 232;  // 1000 & 0xFF
                buffer[3] = 3;    // 1000 >> 8
                return buffer;
            },
            decode: (buffer: Uint8Array): string => {
                const numerator = buffer[0] | (buffer[1] << 8);
                const denominator = buffer[2] | (buffer[3] << 8);
                if (numerator === 1) {
                    return `1/${denominator}`;
                }
                return `${numerator / denominator}`;
            },
        }),
        
        defineProperty({
            code: codes.property(0x500F),
            name: 'EXPOSURE_INDEX',
            dataType: DataType.UINT32,
            description: 'ISO speed',
            writable: true,
            unit: 'ISO',
            // Map-based encoding for common ISO values
            map: [
                { name: 'AUTO', value: 0xFFFFFFFF, description: 'Automatic ISO' },
                { name: 'ISO_100', value: 100, description: 'ISO 100' },
                { name: 'ISO_200', value: 200, description: 'ISO 200' },
                { name: 'ISO_400', value: 400, description: 'ISO 400' },
                { name: 'ISO_800', value: 800, description: 'ISO 800' },
                { name: 'ISO_1600', value: 1600, description: 'ISO 1600' },
                { name: 'ISO_3200', value: 3200, description: 'ISO 3200' },
                { name: 'ISO_6400', value: 6400, description: 'ISO 6400' },
                { name: 'ISO_12800', value: 12800, description: 'ISO 12800' },
            ],
        }),
    ],
});

// ============================================================================
// Sony Extension Schema
// ============================================================================

export const SONY_SCHEMA = defineSchema({
    vendor: codes.vendor(0x054C),
    name: 'Sony Alpha',
    version: '2.0.0',
    operations: [
        // Override PTP OPEN_SESSION with Sony-specific parameters
        defineOperation({
            code: codes.operation(0x1002),
            name: 'OPEN_SESSION',
            description: 'Open a new session (Sony enhanced)',
            parameters: [
                createParameter({
                    name: 'sessionId',
                    dataType: DataType.UINT32,
                    description: 'Session ID to open',
                }),
                createParameter({
                    name: 'vendorData1',
                    dataType: DataType.UINT32,
                    description: 'Sony-specific vendor data 1',
                    optional: true,
                }),
                createParameter({
                    name: 'vendorData2',
                    dataType: DataType.UINT32,
                    description: 'Sony-specific vendor data 2',
                    optional: true,
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x9201),
            name: 'SDIO_CONNECT',
            description: 'Sony SDIO connection control',
            parameters: [
                createParameter({
                    name: 'phase',
                    dataType: DataType.UINT8,
                    description: 'Connection phase',
                    // Map for connection phases
                    map: [
                        { name: 'PHASE_1', value: 1, description: 'Initial connection' },
                        { name: 'PHASE_2', value: 2, description: 'Established connection' },
                        { name: 'PHASE_3', value: 3, description: 'Ready for commands' },
                    ],
                }),
                createParameter({
                    name: 'sessionId',
                    dataType: DataType.UINT32,
                    description: 'Session identifier',
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x9202),
            name: 'SDIO_GET_EXT_DEVICE_INFO',
            description: 'Get Sony extended device information',
            parameters: [
                createParameter({
                    name: 'version',
                    dataType: DataType.UINT32,
                    description: 'Protocol version',
                }),
            ],
        }),
    ],
    
    properties: [
        defineProperty({
            code: codes.property(0xD201),
            name: 'DPC_COMPENSATION',
            dataType: DataType.INT16,
            description: 'DPC compensation value',
            writable: true,
            unit: 'Steps',
        }),
        
        defineProperty({
            code: codes.property(0xD20D),
            name: 'SHUTTER_SPEED',
            dataType: DataType.UINT32,
            description: 'Sony shutter speed control',
            writable: true,
            unit: 'Seconds',
            // Custom encode/decode for shutter speed
            encode: (value: string): Uint8Array => {
                // Parse fractional format like "1/250" or decimal like "2.5"
                const match = value.match(/^1\/(\d+)$/);
                let encoded: number;
                if (match) {
                    const denominator = parseInt(match[1]);
                    // Sony encodes as reciprocal * 1000
                    encoded = Math.round(1000 / denominator);
                } else {
                    const seconds = parseFloat(value);
                    encoded = Math.round(seconds * 1000);
                }
                return new Uint8Array([
                    encoded & 0xFF,
                    (encoded >> 8) & 0xFF,
                    (encoded >> 16) & 0xFF,
                    (encoded >> 24) & 0xFF,
                ]);
            },
            decode: (buffer: Uint8Array): string => {
                const value = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24);
                if (value < 1000) {
                    // Less than 1 second, show as fraction
                    const denominator = Math.round(1000 / value);
                    return `1/${denominator}`;
                }
                return `${value / 1000}`;
            },
        }),
        
        defineProperty({
            code: codes.property(0xD20E),
            name: 'APERTURE',
            dataType: DataType.UINT16,
            description: 'Sony aperture control',
            writable: true,
            unit: 'F-Stop',
            // Same encoding as F_NUMBER
            encode: (value: string): Uint8Array => {
                const match = value.match(/^f\/(\d+(?:\.\d+)?)$/);
                if (!match) throw new Error(`Invalid aperture: ${value}`);
                const fStop = parseFloat(match[1]);
                const encoded = Math.round(fStop * 10);
                return new Uint8Array([encoded & 0xFF, (encoded >> 8) & 0xFF]);
            },
            decode: (buffer: Uint8Array): string => {
                const value = buffer[0] | (buffer[1] << 8);
                const fStop = value / 10;
                return `f/${fStop}`;
            },
        }),
        
        defineProperty({
            code: codes.property(0xD21E),
            name: 'ISO',
            dataType: DataType.UINT32,
            description: 'Sony ISO setting',
            writable: true,
            unit: 'ISO',
            // Custom encode/decode for ISO values
            encode: (value: string): Uint8Array => {
                let isoValue: number;
                if (value === 'AUTO') {
                    isoValue = 0xFFFFFFFF;
                } else {
                    const match = value.match(/^ISO[_ ]?(\d+)$/i);
                    if (!match) throw new Error(`Invalid ISO: ${value}`);
                    isoValue = parseInt(match[1]);
                }
                return new Uint8Array([
                    isoValue & 0xFF,
                    (isoValue >> 8) & 0xFF,
                    (isoValue >> 16) & 0xFF,
                    (isoValue >> 24) & 0xFF,
                ]);
            },
            decode: (buffer: Uint8Array): string => {
                const value = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24);
                if (value === 0xFFFFFFFF) return 'AUTO';
                if (value === 0xFFFFFFFE) return 'ISO -1';  // Special value
                return `ISO ${value}`;
            },
        }),
    ],
});

// ============================================================================
// Sony Camera-Specific Schema
// ============================================================================

export const SONY_CAMERA_SCHEMA = defineSchema({
    vendor: codes.vendor(0x054C),
    name: 'Sony Alpha (extends PTP Standard)',
    version: '2.1.0',
    operations: [
        ...PTP_SCHEMA.operations,
        ...SONY_SCHEMA.operations,
    ],
    properties: [
        ...PTP_SCHEMA.properties,
        ...SONY_SCHEMA.properties,
        
        defineProperty({
            code: codes.property(0xD209),
            name: 'EXPOSURE_BIAS_COMPENSATION',
            dataType: DataType.INT16,
            description: 'Exposure compensation',
            writable: true,
            unit: 'EV',
            // Custom encode/decode for EV values
            encode: (value: string): Uint8Array => {
                // Parse values like "+1.0", "-2.5", "0"
                const evValue = parseFloat(value.replace(/^\+/, ''));
                const encoded = Math.round(evValue * 100);
                return new Uint8Array([
                    encoded & 0xFF,
                    (encoded >> 8) & 0xFF,
                ]);
            },
            decode: (buffer: Uint8Array): string => {
                const value = (buffer[0] | (buffer[1] << 8));
                // Handle signed value
                const signed = value > 32767 ? value - 65536 : value;
                const evValue = signed / 100;
                return evValue >= 0 ? `+${evValue}` : `${evValue}`;
            },
        }),
        
        defineProperty({
            code: codes.property(0xD21B),
            name: 'ISO_CURRENT_SONY',
            dataType: DataType.UINT32,
            description: 'Current ISO value (Sony)',
            writable: false,
            unit: 'ISO',
            // Custom encode/decode matching ISO property
            encode: (value: string): Uint8Array => {
                let isoValue: number;
                if (value === 'AUTO') {
                    isoValue = 0xFFFFFFFF;
                } else {
                    const match = value.match(/^ISO[_ ]?(\d+)$/i);
                    if (!match) throw new Error(`Invalid ISO: ${value}`);
                    isoValue = parseInt(match[1]);
                }
                return new Uint8Array([
                    isoValue & 0xFF,
                    (isoValue >> 8) & 0xFF,
                    (isoValue >> 16) & 0xFF,
                    (isoValue >> 24) & 0xFF,
                ]);
            },
            decode: (buffer: Uint8Array): string => {
                const value = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24);
                if (value === 0xFFFFFFFF) return 'AUTO';
                return `ISO ${value}`;
            },
        }),
        
        defineProperty({
            code: codes.property(0xD21C),
            name: 'PICTURE_EFFECT',
            dataType: DataType.UINT16,
            description: 'Picture effect setting',
            writable: true,
            // Map-based encoding for picture effects
            map: [
                { name: 'OFF', value: 0x0000, description: 'No effect' },
                { name: 'TOY_CAMERA', value: 0x0001, description: 'Toy camera effect' },
                { name: 'POP_COLOR', value: 0x0002, description: 'Pop color effect' },
                { name: 'POSTERIZATION', value: 0x0003, description: 'Posterization effect' },
                { name: 'RETRO', value: 0x0004, description: 'Retro photo effect' },
                { name: 'SOFT_HIGH_KEY', value: 0x0005, description: 'Soft high-key effect' },
                { name: 'PARTIAL_COLOR_RED', value: 0x0006, description: 'Partial color (red)' },
                { name: 'PARTIAL_COLOR_GREEN', value: 0x0007, description: 'Partial color (green)' },
                { name: 'PARTIAL_COLOR_BLUE', value: 0x0008, description: 'Partial color (blue)' },
                { name: 'PARTIAL_COLOR_YELLOW', value: 0x0009, description: 'Partial color (yellow)' },
                { name: 'HIGH_CONTRAST_MONO', value: 0x000A, description: 'High contrast monochrome' },
            ],
        }),
        
        defineProperty({
            code: codes.property(0xD21D),
            name: 'AB_FILTER',
            dataType: DataType.INT8,
            description: 'Amber-Blue filter adjustment',
            writable: true,
            unit: 'Steps',
        }),
        
        defineProperty({
            code: codes.property(0xD21F),
            name: 'GM_FILTER',
            dataType: DataType.INT8,
            description: 'Green-Magenta filter adjustment',
            writable: true,
            unit: 'Steps',
        }),
        
        defineProperty({
            code: codes.property(0xD25F),
            name: 'MEDIA_SLOT_1_STATUS',
            dataType: DataType.UINT8,
            description: 'Memory card slot 1 status',
            writable: false,
            // Map-based encoding for slot status
            map: [
                { name: 'EMPTY', value: 0x00, description: 'No card' },
                { name: 'INACTIVE', value: 0x01, description: 'Card present but inactive' },
                { name: 'ACTIVE', value: 0x02, description: 'Card active' },
            ],
        }),
        
        defineProperty({
            code: codes.property(0xD260),
            name: 'MEDIA_SLOT_2_STATUS',
            dataType: DataType.UINT8,
            description: 'Memory card slot 2 status',
            writable: false,
            // Map-based encoding for slot status
            map: [
                { name: 'EMPTY', value: 0x00, description: 'No card' },
                { name: 'INACTIVE', value: 0x01, description: 'Card present but inactive' },
                { name: 'ACTIVE', value: 0x02, description: 'Card active' },
            ],
        }),
        
        defineProperty({
            code: codes.property(0xD2C1),
            name: 'FOCUS_MODE',
            dataType: DataType.UINT16,
            description: 'Focus mode setting',
            writable: true,
            // Map-based encoding for focus modes
            map: [
                { name: 'MANUAL', value: 0x0001, description: 'Manual focus' },
                { name: 'AF_S', value: 0x0002, description: 'Single AF' },
                { name: 'AF_C', value: 0x8004, description: 'Continuous AF' },
                { name: 'AF_A', value: 0x8005, description: 'Automatic AF' },
                { name: 'DMF', value: 0x8006, description: 'Direct manual focus' },
            ],
        }),
        
        defineProperty({
            code: codes.property(0xD2C2),
            name: 'EXPOSURE_PROGRAM_MODE',
            dataType: DataType.UINT16,
            description: 'Exposure program mode',
            writable: true,
            // Map-based encoding for exposure modes
            map: [
                { name: 'MANUAL', value: 0x0001, description: 'Manual exposure' },
                { name: 'PROGRAM_AUTO', value: 0x0002, description: 'Program auto' },
                { name: 'APERTURE_PRIORITY', value: 0x0003, description: 'Aperture priority' },
                { name: 'SHUTTER_PRIORITY', value: 0x0004, description: 'Shutter priority' },
                { name: 'SCENE_SELECTION', value: 0x8050, description: 'Scene selection' },
                { name: 'INTELLIGENT_AUTO', value: 0x8051, description: 'Intelligent auto' },
                { name: 'SUPERIOR_AUTO', value: 0x8052, description: 'Superior auto' },
            ],
        }),
    ],
});