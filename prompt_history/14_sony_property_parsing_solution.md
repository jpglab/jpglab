# Sony SDIExtDevicePropInfo Dataset Structure - Complete Solution

## Overview

This document details the complete solution for parsing Sony's extended device property information, specifically addressing the ISO parsing issue and providing a generalized approach for all camera settings.

## Problem Statement

We were successfully parsing F-Number and Shutter Speed properties but ISO values were returning as "Unknown". The issue was traced to incorrect offset calculations in the property dataset structure.

## Root Cause

Sony's SDIExtDevicePropInfo dataset includes **reserved bytes** between the header fields (PropertyCode, DataType, GetSet, IsEnabled) and the actual values. The size of these reserved bytes depends on the data type of the property, which we were not accounting for.

## Dataset Structure

### Overall Container Structure

```
[PTP Container Header - 12 bytes]
[Number of Properties - 8 bytes (UINT64, little-endian)]
[Property Dataset 1 - variable length]
[Property Dataset 2 - variable length]
...
[Property Dataset N - variable length]
```

### Individual Property Dataset Structure

| Offset | Size     | Field        | Description                                              |
| ------ | -------- | ------------ | -------------------------------------------------------- |
| 0      | 2        | PropertyCode | UINT16 - Property identifier (e.g., 0x5007 for F-Number) |
| 2      | 2        | DataType     | UINT16 - Data type code                                  |
| 4      | 1        | GetSet       | UINT8 - 0x00=ReadOnly, 0x01=ReadWrite                    |
| 5      | 1        | IsEnabled    | UINT8 - 0x00=Disabled, 0x01=Enabled, 0x02=DisplayOnly    |
| 6      | Variable | Reserved     | **Critical: Reserved bytes (size depends on DataType)**  |
| 6+R    | Variable | CurrentValue | Current value (size depends on DataType)                 |
| 6+R+V  | 1        | FormFlag     | UINT8 - 0x00=None, 0x01=Range, 0x02=Enumeration          |
| 7+R+V  | Variable | FormData     | Optional enumeration or range data                       |

### Reserved Bytes Mapping

| DataType | Type Name | Reserved Bytes | Value Size |
| -------- | --------- | -------------- | ---------- |
| 0x0001   | INT8      | 1 byte         | 1 byte     |
| 0x0002   | UINT8     | 1 byte         | 1 byte     |
| 0x0003   | INT16     | 2 bytes        | 2 bytes    |
| 0x0004   | UINT16    | 2 bytes        | 2 bytes    |
| 0x0005   | INT32     | 4 bytes        | 4 bytes    |
| 0x0006   | UINT32    | 4 bytes        | 4 bytes    |
| 0x0007   | INT64     | 8 bytes        | 8 bytes    |
| 0x0008   | UINT64    | 8 bytes        | 8 bytes    |

### Enumeration Form Structure (FormFlag = 0x02)

When FormFlag is 0x02, additional enumeration data follows:

```
[NumEnumSet - 2 bytes (UINT16)]
[EnumValue[0] - size per DataType]
[EnumValue[1] - size per DataType]
...
[EnumValue[NumEnumSet-1]]
[NumEnumGetSet - 2 bytes (UINT16)]
[EnumValueGetSet[0] - size per DataType]
...
[EnumValueGetSet[NumEnumGetSet-1]]
```

## Common Sony Property Codes

| Code   | Name                   | DataType | Format                     | Example Raw      | Example Formatted |
| ------ | ---------------------- | -------- | -------------------------- | ---------------- | ----------------- |
| 0x5007 | F-Number               | UINT16   | value/100                  | 0x00DC (220)     | f/2.2             |
| 0xD20D | Shutter Speed          | UINT32   | Upper16=num, Lower16=denom | 0x0001_00FA      | 1/250             |
| 0xD21E | ISO Sensitivity (Main) | UINT32   | Direct decimal             | 0x000000C8 (200) | ISO 200           |
| 0xD21D | ISO Sensitivity (Alt1) | UINT32   | Direct decimal             | -                | -                 |
| 0xD21F | ISO Sensitivity (Alt2) | UINT32   | Direct decimal             | -                | -                 |
| 0xD220 | ISO Sensitivity (Alt3) | UINT32   | Direct decimal             | -                | -                 |

## Implementation

### TypeScript Implementation

```typescript
interface PropertyInfo {
    propertyCode: number
    dataType: number
    getSet: number
    isEnabled: number
    currentValue: any
    formFlag: number
    enumValuesSet?: any[]
    enumValuesGetSet?: any[]
    nextOffset: number
}

function parseSDIExtDevicePropInfo(data: Uint8Array, startOffset: number): PropertyInfo | null {
    try {
        const view = new DataView(data.buffer, data.byteOffset + startOffset)
        let offset = 0

        // Read header fields
        const propertyCode = view.getUint16(offset, true)
        offset += 2

        const dataType = view.getUint16(offset, true)
        offset += 2

        const getSet = view.getUint8(offset)
        offset += 1

        const isEnabled = view.getUint8(offset)
        offset += 1

        // Calculate and skip reserved bytes (CRITICAL FIX)
        const reservedSize = getReservedSize(dataType)
        offset += reservedSize

        // Read current value
        const { value: currentValue, size: currentSize } = readPropertyValue(view, offset, dataType)
        offset += currentSize

        // Read form flag
        const formFlag = view.getUint8(offset)
        offset += 1

        const result: PropertyInfo = {
            propertyCode,
            dataType,
            getSet,
            isEnabled,
            currentValue,
            formFlag,
            nextOffset: startOffset + offset,
        }

        // Parse enumeration if present
        if (formFlag === 0x02) {
            // Read Set enumeration
            const numEnumSet = view.getUint16(offset, true)
            offset += 2

            result.enumValuesSet = []
            for (let i = 0; i < numEnumSet; i++) {
                const { value, size } = readPropertyValue(view, offset, dataType)
                result.enumValuesSet.push(value)
                offset += size
            }

            // Read GetSet enumeration
            const numEnumGetSet = view.getUint16(offset, true)
            offset += 2

            result.enumValuesGetSet = []
            for (let i = 0; i < numEnumGetSet; i++) {
                const { value, size } = readPropertyValue(view, offset, dataType)
                result.enumValuesGetSet.push(value)
                offset += size
            }

            result.nextOffset = startOffset + offset
        }

        return result
    } catch (error) {
        return null
    }
}

function getReservedSize(dataType: number): number {
    switch (dataType) {
        case 0x0001:
        case 0x0002:
            return 1 // INT8, UINT8
        case 0x0003:
        case 0x0004:
            return 2 // INT16, UINT16
        case 0x0005:
        case 0x0006:
            return 4 // INT32, UINT32
        case 0x0007:
        case 0x0008:
            return 8 // INT64, UINT64
        case 0x0009:
        case 0x000a:
            return 16 // INT128, UINT128
        default:
            // Array types (0x4xxx) - need special handling
            if ((dataType & 0x4000) === 0x4000) {
                return 4 // Arrays have 4-byte length prefix
            }
            return 0
    }
}

function readPropertyValue(view: DataView, offset: number, dataType: number): { value: any; size: number } {
    switch (dataType) {
        case 0x0001: // INT8
            return { value: view.getInt8(offset), size: 1 }
        case 0x0002: // UINT8
            return { value: view.getUint8(offset), size: 1 }
        case 0x0003: // INT16
            return { value: view.getInt16(offset, true), size: 2 }
        case 0x0004: // UINT16
            return { value: view.getUint16(offset, true), size: 2 }
        case 0x0005: // INT32
            return { value: view.getInt32(offset, true), size: 4 }
        case 0x0006: // UINT32
            return { value: view.getUint32(offset, true), size: 4 }
        case 0x0007: // INT64
            return { value: view.getBigInt64(offset, true), size: 8 }
        case 0x0008: // UINT64
            return { value: view.getBigUint64(offset, true), size: 8 }
        default:
            // Handle arrays and unknown types
            if ((dataType & 0x4000) === 0x4000) {
                const arrayLength = view.getUint32(offset, true)
                const elementType = dataType & 0x3fff
                const elementSize = getDataTypeSize(elementType)
                return { value: 0, size: 4 + arrayLength * elementSize }
            }
            return { value: view.getUint32(offset, true), size: 4 }
    }
}

function getDataTypeSize(dataType: number): number {
    switch (dataType) {
        case 0x0001:
        case 0x0002:
            return 1
        case 0x0003:
        case 0x0004:
            return 2
        case 0x0005:
        case 0x0006:
            return 4
        case 0x0007:
        case 0x0008:
            return 8
        case 0x0009:
        case 0x000a:
            return 16
        default:
            return 4
    }
}
```

## Value Formatting

### F-Number (Aperture)

```typescript
function formatFNumber(value: number): string {
    // Sony encodes f-number as value * 100
    return `f/${(value / 100).toFixed(1)}`
}
```

### Shutter Speed

```typescript
function formatShutterSpeed(value: number): string {
    if (value === 0x00000000) return 'BULB'
    if (value === 0xffffffff) return 'N/A'

    const numerator = (value >> 16) & 0xffff
    const denominator = value & 0xffff

    if (denominator === 0x000a) {
        // Real number display (e.g., 1.5")
        return `${numerator / 10}"`
    } else if (numerator === 0x0001) {
        // Fraction display (e.g., 1/1000)
        return `1/${denominator}`
    } else {
        return `${numerator}/${denominator}`
    }
}
```

### ISO Sensitivity

```typescript
function formatISO(value: number): string {
    // Special AUTO values
    if (value === 0x00ffffff) return 'ISO AUTO'
    if (value === 0x01ffffff) return 'Multi Frame NR ISO AUTO'
    if (value === 0x02ffffff) return 'Multi Frame NR High ISO AUTO'

    // Check for Multi Frame NR modes (prefix byte)
    const prefix = (value >> 24) & 0xff
    let mode = ''
    if (prefix === 0x01) {
        mode = 'Multi Frame NR '
    } else if (prefix === 0x02) {
        mode = 'Multi Frame NR High '
    }

    // Extract the actual ISO value (lower 24 bits)
    const isoValue = value & 0xffffff

    // Sony uses direct decimal values for ISO
    if (isoValue >= 10 && isoValue <= 1000000) {
        return `${mode}ISO ${isoValue}`
    }

    return 'ISO Unknown'
}
```

## Key Discoveries

1. **Reserved Bytes Pattern**: Sony consistently inserts reserved bytes between header fields and values, with the size matching the data type size.

2. **No Factory Default**: Unlike standard PTP, Sony only provides the current value, not a separate factory default value.

3. **Variable Property Codes**: The same setting (e.g., ISO) may use different property codes on different camera models (0xD21E, 0xD21D, 0xD21F, or 0xD220).

4. **Direct Value Encoding**: Sony uses straightforward decimal encoding for most values (ISO 200 = 0x000000C8), unlike some manufacturers who use logarithmic scales.

5. **Robust Parsing Required**: The dataset contains many vendor-specific properties, so error recovery and validation are essential.

## Testing Results

Using the corrected parsing with reserved bytes:

- **F-Number (0x5007)**: ✅ Successfully parsed as f/2.2 (0x00DC)
- **Shutter Speed (0xD20D)**: ✅ Successfully parsed as 1/250 (0x000100FA)
- **ISO (0xD21E)**: ✅ Successfully parsed as ISO 200 (0x000000C8)

## Conclusion

The critical fix was recognizing that Sony inserts reserved bytes between the property header and values, with the reserved byte count matching the data type size. This alignment requirement ensures proper memory boundaries but was not documented in the PTP specification. With this understanding, we can now reliably parse all camera settings from Sony cameras using the SDIExtDevicePropInfo command (0x9209).
