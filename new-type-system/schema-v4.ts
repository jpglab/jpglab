/**
 * PTP and Sony Schema Definitions using v4 type system
 * 
 * Uses proper assertion-based validation throughout
 * No unsafe 'as' casts - all types are properly validated
 */

import {
    defineOperation,
    defineProperty,
    defineSchema,
    mergeSchemas,
    createParameter,
    DataType,
    codes,
    type Schema,
} from './types-v4'

// ============================================================================
// PTP Standard Schema
// ============================================================================

export const PTP_SCHEMA: Schema = defineSchema({
    vendor: codes.vendor(0x0000),
    name: 'PTP Standard',
    version: '1.1.0',
    
    operations: [
        defineOperation({
            code: codes.operation(0x1002),
            name: 'OPEN_SESSION',
            description: 'Opens a new PTP session',
            parameters: [
                createParameter({
                    name: 'sessionId',
                    dataType: DataType.UINT32,
                    description: 'Unique session identifier',
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x1003),
            name: 'CLOSE_SESSION',
            description: 'Closes the current PTP session',
        }),
        
        defineOperation({
            code: codes.operation(0x1001),
            name: 'GET_DEVICE_INFO',
            description: 'Retrieves device information',
            respondsWithData: true,
        }),
        
        defineOperation({
            code: codes.operation(0x1004),
            name: 'GET_STORAGE_IDS',
            description: 'Gets list of storage device IDs',
            respondsWithData: true,
        }),
        
        defineOperation({
            code: codes.operation(0x1005),
            name: 'GET_STORAGE_INFO',
            description: 'Gets information about a storage device',
            parameters: [
                createParameter({
                    name: 'storageId',
                    dataType: DataType.UINT32,
                    description: 'Storage device identifier',
                }),
            ],
            respondsWithData: true,
        }),
        
        defineOperation({
            code: codes.operation(0x1007),
            name: 'GET_OBJECT_HANDLES',
            description: 'Gets handles for objects in storage',
            parameters: [
                createParameter({
                    name: 'storageId',
                    dataType: DataType.UINT32,
                    description: 'Storage ID (0xFFFFFFFF for all)',
                }),
                createParameter({
                    name: 'objectFormat',
                    dataType: DataType.UINT16,
                    description: 'Object format code (0x0000 for all)',
                }),
                createParameter({
                    name: 'objectParent',
                    dataType: DataType.UINT32,
                    description: 'Parent object (0xFFFFFFFF for root)',
                }),
            ],
            respondsWithData: true,
        }),
        
        defineOperation({
            code: codes.operation(0x100E),
            name: 'INITIATE_CAPTURE',
            description: 'Triggers image capture',
            parameters: [
                createParameter({
                    name: 'storageId',
                    dataType: DataType.UINT32,
                    description: 'Target storage (0x00000000 for default)',
                }),
                createParameter({
                    name: 'objectFormat',
                    dataType: DataType.UINT16,
                    description: 'Capture format (0x0000 for default)',
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x1015),
            name: 'GET_DEVICE_PROP_VALUE',
            description: 'Gets current property value',
            parameters: [
                createParameter({
                    name: 'propertyCode',
                    dataType: DataType.UINT16,
                    description: 'Property code to get',
                }),
            ],
            respondsWithData: true,
        }),
        
        defineOperation({
            code: codes.operation(0x1016),
            name: 'SET_DEVICE_PROP_VALUE',
            description: 'Sets property value',
            parameters: [
                createParameter({
                    name: 'propertyCode',
                    dataType: DataType.UINT16,
                    description: 'Property code to set',
                }),
            ],
            expectsData: true,
        }),
    ],
    
    properties: [
        defineProperty({
            code: codes.property(0x5001),
            name: 'BATTERY_LEVEL',
            dataType: DataType.UINT8,
            description: 'Battery charge level percentage',
            writable: false,
            unit: 'Percentage',
        }),
        
        defineProperty({
            code: codes.property(0x5002),
            name: 'FUNCTIONAL_MODE',
            dataType: DataType.UINT16,
            description: 'Device functional mode',
            writable: true,
            encoder: {
                map: {
                    'STANDARD': 0x0000,
                    'SLEEP': 0x0001,
                }
            },
        }),
        
        defineProperty({
            code: codes.property(0x5005),
            name: 'WHITE_BALANCE',
            dataType: DataType.UINT16,
            description: 'White balance setting',
            writable: true,
            encoder: {
                map: {
                    'AUTO': 0x0002,
                    'DAYLIGHT': 0x0004,
                    'CLOUDY': 0x0006,
                    'TUNGSTEN': 0x0007,
                    'FLUORESCENT': 0x0008,
                    'FLASH': 0x0009,
                    'CUSTOM': 0x000A,
                }
            },
        }),
        
        defineProperty<typeof DataType.UINT16, string>({
            code: codes.property(0x5007),
            name: 'F_NUMBER',
            dataType: DataType.UINT16,
            description: 'Aperture f-stop value',
            writable: true,
            unit: 'F-Stop',
            encoder: {
                encode: (value: string): Uint8Array => {
                    const match = value.match(/^f\/(\d+(?:\.\d+)?)$/)
                    if (!match) throw new Error(`Invalid aperture: ${value}`)
                    const fStop = parseFloat(match[1])
                    const encoded = Math.round(fStop * 10)
                    return new Uint8Array([encoded & 0xFF, (encoded >> 8) & 0xFF])
                },
                decode: (buffer: Uint8Array): string => {
                    const value = buffer[0] | (buffer[1] << 8)
                    const fStop = value / 10
                    return fStop % 1 === 0 ? `f/${fStop}` : `f/${fStop.toFixed(1)}`
                },
            },
        }),
        
        defineProperty<typeof DataType.UINT32, string>({
            code: codes.property(0x500D),
            name: 'EXPOSURE_TIME',
            dataType: DataType.UINT32,
            description: 'Shutter speed',
            writable: true,
            unit: 'Seconds',
            encoder: {
                encode: (value: string): Uint8Array => {
                    let microseconds: number
                    if (value.endsWith('s')) {
                        const seconds = parseFloat(value.slice(0, -1))
                        microseconds = seconds * 1000000
                    } else if (value.startsWith('1/')) {
                        const denominator = parseInt(value.slice(2))
                        microseconds = 1000000 / denominator
                    } else {
                        throw new Error(`Invalid shutter speed: ${value}`)
                    }
                    const buffer = new Uint8Array(4)
                    buffer[0] = microseconds & 0xFF
                    buffer[1] = (microseconds >> 8) & 0xFF
                    buffer[2] = (microseconds >> 16) & 0xFF
                    buffer[3] = (microseconds >> 24) & 0xFF
                    return buffer
                },
                decode: (buffer: Uint8Array): string => {
                    const microseconds = 
                        buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
                    const seconds = microseconds / 1000000
                    if (seconds >= 1) {
                        return `${seconds}s`
                    } else {
                        const denominator = Math.round(1 / seconds)
                        return `1/${denominator}`
                    }
                },
            },
        }),
        
        defineProperty({
            code: codes.property(0x500E),
            name: 'EXPOSURE_PROGRAM_MODE',
            dataType: DataType.UINT16,
            description: 'Exposure mode',
            writable: true,
            encoder: {
                map: {
                    'MANUAL': 0x0001,
                    'AUTO': 0x0002,
                    'APERTURE_PRIORITY': 0x0003,
                    'SHUTTER_PRIORITY': 0x0004,
                    'PROGRAM': 0x0005,
                }
            },
        }),
        
        defineProperty<typeof DataType.UINT32, string>({
            code: codes.property(0x500F),
            name: 'EXPOSURE_INDEX',
            dataType: DataType.UINT32,
            description: 'ISO sensitivity',
            writable: true,
            unit: 'ISO',
            encoder: {
                encode: (value: string): Uint8Array => {
                    let isoValue: number
                    if (value === 'AUTO') {
                        isoValue = 0xFFFFFFFF
                    } else if (value.startsWith('ISO ')) {
                        isoValue = parseInt(value.slice(4))
                    } else {
                        throw new Error(`Invalid ISO: ${value}`)
                    }
                    const buffer = new Uint8Array(4)
                    buffer[0] = isoValue & 0xFF
                    buffer[1] = (isoValue >> 8) & 0xFF
                    buffer[2] = (isoValue >> 16) & 0xFF
                    buffer[3] = (isoValue >> 24) & 0xFF
                    return buffer
                },
                decode: (buffer: Uint8Array): string => {
                    const value = 
                        buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
                    return value === 0xFFFFFFFF ? 'AUTO' : `ISO ${value}`
                },
            },
        }),
        
        defineProperty({
            code: codes.property(0x5010),
            name: 'EXPOSURE_BIAS_COMPENSATION',
            dataType: DataType.INT16,
            description: 'Exposure compensation',
            writable: true,
            unit: 'EV',
        }),
        
        defineProperty({
            code: codes.property(0x5011),
            name: 'DATE_TIME',
            dataType: DataType.STRING,
            description: 'Camera date/time',
            writable: true,
        }),
        
        defineProperty({
            code: codes.property(0x5012),
            name: 'CAPTURE_DELAY',
            dataType: DataType.UINT32,
            description: 'Self-timer delay',
            writable: true,
            unit: 'Milliseconds',
            encoder: {
                map: {
                    'OFF': 0,
                    '2S': 2000,
                    '10S': 10000,
                }
            },
        }),
    ],
})

// ============================================================================
// Sony Vendor Schema
// ============================================================================

export const SONY_SCHEMA: Schema = defineSchema({
    vendor: codes.vendor(0x054C),
    name: 'Sony Alpha',
    version: '2.0.0',
    
    operations: [
        // Override PTP OPEN_SESSION with additional parameters
        defineOperation({
            code: codes.operation(0x1002),
            name: 'OPEN_SESSION',
            description: 'Opens session with Sony extensions',
            parameters: [
                createParameter({
                    name: 'sessionId',
                    dataType: DataType.UINT32,
                    description: 'Session identifier',
                }),
                createParameter({
                    name: 'functionMode',
                    dataType: DataType.UINT16,
                    description: 'Sony function mode',
                    encoder: {
                        map: {
                            'NORMAL': 0x0000,
                            'REMOTE': 0x0001,
                            'PC_SAVE': 0x0002,
                        }
                    },
                }),
                createParameter({
                    name: 'apiVersion',
                    dataType: DataType.UINT32,
                    description: 'API version (e.g., 0x01020000 for v1.2)',
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x9201),
            name: 'SDIO_CONNECT',
            description: 'Establishes SDIO connection',
            parameters: [
                createParameter({
                    name: 'phase',
                    dataType: DataType.UINT8,
                    description: 'Connection phase',
                    encoder: {
                        map: {
                            'PHASE_1': 1,
                            'PHASE_2': 2,
                            'PHASE_3': 3,
                        }
                    },
                    possibleValues: [
                        { name: 'PHASE_1', value: 'PHASE_1', description: 'Initial handshake' },
                        { name: 'PHASE_2', value: 'PHASE_2', description: 'Authentication' },
                        { name: 'PHASE_3', value: 'PHASE_3', description: 'Configuration' },
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
            code: codes.operation(0x9209),
            name: 'SET_STILL_IMAGE_SAVE_DESTINATION',
            description: 'Sets where to save images',
            parameters: [
                createParameter({
                    name: 'destination',
                    dataType: DataType.UINT8,
                    description: 'Save destination',
                    encoder: {
                        map: {
                            'CAMERA': 0x01,
                            'HOST': 0x02,
                            'BOTH': 0x03,
                        }
                    },
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x920F),
            name: 'MOVIE_RECORD',
            description: 'Starts/stops movie recording',
            parameters: [
                createParameter({
                    name: 'action',
                    dataType: DataType.UINT8,
                    description: 'Recording action',
                    encoder: {
                        map: {
                            'STOP': 0x00,
                            'START': 0x01,
                        }
                    },
                }),
            ],
        }),
        
        defineOperation({
            code: codes.operation(0x9400),
            name: 'SET_ZOOM',
            description: 'Controls camera zoom',
            parameters: [
                createParameter({
                    name: 'direction',
                    dataType: DataType.UINT8,
                    description: 'Zoom direction',
                    encoder: {
                        map: {
                            'STOP': 0x00,
                            'WIDE': 0x01,
                            'TELE': 0x02,
                        }
                    },
                }),
                createParameter({
                    name: 'speed',
                    dataType: DataType.UINT8,
                    description: 'Zoom speed (0-7)',
                    possibleValues: [
                        { name: 'SPEED_0', value: 0, description: 'Slowest' },
                        { name: 'SPEED_1', value: 1, description: '' },
                        { name: 'SPEED_2', value: 2, description: '' },
                        { name: 'SPEED_3', value: 3, description: '' },
                        { name: 'SPEED_4', value: 4, description: '' },
                        { name: 'SPEED_5', value: 5, description: '' },
                        { name: 'SPEED_6', value: 6, description: '' },
                        { name: 'SPEED_7', value: 7, description: 'Fastest' },
                    ],
                }),
            ],
        }),
    ],
    
    properties: [
        // Inherit all PTP properties (will be merged)
        ...PTP_SCHEMA.properties,
        
        // Sony-specific properties
        defineProperty({
            code: codes.property(0xD200),
            name: 'DPC_EXTENSION',
            dataType: DataType.ARRAY,
            description: 'Device property extension info',
            writable: false,
        }),
        
        defineProperty({
            code: codes.property(0xD201),
            name: 'AUTOFOCUS_AREA',
            dataType: DataType.UINT16,
            description: 'AF area setting',
            writable: true,
            encoder: {
                map: {
                    'WIDE': 0x0001,
                    'ZONE': 0x0002,
                    'CENTER': 0x0003,
                    'FLEXIBLE_SPOT_S': 0x0101,
                    'FLEXIBLE_SPOT_M': 0x0102,
                    'FLEXIBLE_SPOT_L': 0x0103,
                    'EXPAND_FLEXIBLE_SPOT': 0x0104,
                }
            },
        }),
        
        defineProperty<typeof DataType.UINT32, string>({
            code: codes.property(0xD20D),
            name: 'SHUTTER_SPEED',
            dataType: DataType.UINT32,
            description: 'Sony shutter speed control',
            writable: true,
            unit: 'Seconds',
            encoder: {
                encode: (value: string): Uint8Array => {
                    let microseconds: number
                    if (value.endsWith('s')) {
                        const seconds = parseFloat(value.slice(0, -1))
                        microseconds = seconds * 1000000
                    } else if (value.startsWith('1/')) {
                        const denominator = parseInt(value.slice(2))
                        microseconds = 1000000 / denominator
                    } else {
                        throw new Error(`Invalid shutter speed: ${value}`)
                    }
                    const buffer = new Uint8Array(4)
                    buffer[0] = microseconds & 0xFF
                    buffer[1] = (microseconds >> 8) & 0xFF
                    buffer[2] = (microseconds >> 16) & 0xFF
                    buffer[3] = (microseconds >> 24) & 0xFF
                    return buffer
                },
                decode: (buffer: Uint8Array): string => {
                    const microseconds = 
                        buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
                    const seconds = microseconds / 1000000
                    if (seconds >= 1) {
                        return `${seconds}s`
                    } else {
                        const denominator = Math.round(1 / seconds)
                        return `1/${denominator}`
                    }
                },
            },
        }),
        
        defineProperty<typeof DataType.UINT16, string>({
            code: codes.property(0xD20E),
            name: 'APERTURE',
            dataType: DataType.UINT16,
            description: 'Sony aperture control',
            writable: true,
            unit: 'F-Stop',
            encoder: {
                encode: (value: string): Uint8Array => {
                    const match = value.match(/^f\/(\d+(?:\.\d+)?)$/)
                    if (!match) throw new Error(`Invalid aperture: ${value}`)
                    const fStop = parseFloat(match[1])
                    const encoded = Math.round(fStop * 10)
                    return new Uint8Array([encoded & 0xFF, (encoded >> 8) & 0xFF])
                },
                decode: (buffer: Uint8Array): string => {
                    const value = buffer[0] | (buffer[1] << 8)
                    const fStop = value / 10
                    return fStop % 1 === 0 ? `f/${fStop}` : `f/${fStop.toFixed(1)}`
                },
            },
        }),
        
        defineProperty<typeof DataType.UINT32, string>({
            code: codes.property(0xD21E),
            name: 'ISO',
            dataType: DataType.UINT32,
            description: 'Sony ISO setting',
            writable: true,
            unit: 'ISO',
            encoder: {
                encode: (value: string): Uint8Array => {
                    let isoValue: number
                    if (value === 'AUTO') {
                        isoValue = 0xFFFFFFFF
                    } else if (value.startsWith('ISO ')) {
                        isoValue = parseInt(value.slice(4))
                    } else {
                        throw new Error(`Invalid ISO: ${value}`)
                    }
                    const buffer = new Uint8Array(4)
                    buffer[0] = isoValue & 0xFF
                    buffer[1] = (isoValue >> 8) & 0xFF
                    buffer[2] = (isoValue >> 16) & 0xFF
                    buffer[3] = (isoValue >> 24) & 0xFF
                    return buffer
                },
                decode: (buffer: Uint8Array): string => {
                    const value = 
                        buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
                    return value === 0xFFFFFFFF ? 'AUTO' : `ISO ${value}`
                },
            },
        }),
        
        defineProperty({
            code: codes.property(0xD21B),
            name: 'PICTURE_EFFECT',
            dataType: DataType.UINT16,
            description: 'Picture effect/filter',
            writable: true,
            encoder: {
                map: {
                    'OFF': 0x0000,
                    'TOY_CAMERA': 0x0001,
                    'POP_COLOR': 0x0002,
                    'POSTERIZATION': 0x0003,
                    'RETRO': 0x0004,
                    'SOFT_HIGH_KEY': 0x0005,
                    'PARTIAL_COLOR': 0x0006,
                    'HIGH_CONTRAST_MONO': 0x0007,
                    'SOFT_FOCUS': 0x0008,
                    'HDR_PAINTING': 0x0009,
                    'RICH_TONE_MONO': 0x000A,
                    'MINIATURE': 0x000B,
                    'WATERCOLOR': 0x000C,
                    'ILLUSTRATION': 0x000D,
                }
            },
        }),
        
        defineProperty({
            code: codes.property(0xD21C),
            name: 'AB_FILTER',
            dataType: DataType.INT8,
            description: 'Color filter (Amber-Blue)',
            writable: true,
            unit: 'Steps',
        }),
        
        defineProperty({
            code: codes.property(0xD211),
            name: 'ASPECT_RATIO',
            dataType: DataType.UINT8,
            description: 'Image aspect ratio',
            writable: true,
            encoder: {
                map: {
                    '3:2': 0x01,
                    '16:9': 0x02,
                    '4:3': 0x03,
                    '1:1': 0x04,
                }
            },
        }),
        
        defineProperty({
            code: codes.property(0xD1AC),
            name: 'LIVE_VIEW_IMAGE_SIZE',
            dataType: DataType.UINT8,
            description: 'Live view image size',
            writable: true,
            encoder: {
                map: {
                    'SMALL': 0x01,
                    'MEDIUM': 0x02,
                    'LARGE': 0x03,
                }
            },
        }),
    ],
})

// ============================================================================
// Combined Schema using merge
// ============================================================================

export const SONY_CAMERA_SCHEMA = mergeSchemas(PTP_SCHEMA, SONY_SCHEMA)

// ============================================================================
// Usage Example Functions
// ============================================================================

export function demonstrateUsage() {
    // Access operations by iterating the list
    console.log('PTP Operations:')
    for (const op of PTP_SCHEMA.operations) {
        console.log(`  - ${op.name} (0x${op.code.toString(16).padStart(4, '0')})`)
    }
    
    // Access properties by iterating the list
    console.log('\nSony Properties:')
    for (const prop of SONY_SCHEMA.properties) {
        console.log(`  - ${prop.name}: ${prop.writable ? 'RW' : 'RO'}`)
    }
    
    // Work with merged schema
    console.log('\nMerged Schema:')
    console.log(`  Operations: ${SONY_CAMERA_SCHEMA.operations.length}`)
    console.log(`  Properties: ${SONY_CAMERA_SCHEMA.properties.length}`)
    
    // Find specific operation
    const openSession = SONY_CAMERA_SCHEMA.operations.find(
        op => op.name === 'OPEN_SESSION'
    )
    if (openSession) {
        console.log(`\nOPEN_SESSION has ${openSession.parameters?.length || 0} parameters`)
    }
    
    // Find specific property
    const iso = SONY_CAMERA_SCHEMA.properties.find(
        prop => prop.name === 'ISO'
    )
    if (iso) {
        console.log(`ISO property: ${iso.unit} units, writable: ${iso.writable}`)
    }
}