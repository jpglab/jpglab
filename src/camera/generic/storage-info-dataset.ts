import { createDataView, sliceBuffer, decodePTPValue, getPTPValueSize } from '@core/buffers'
import { DataType, HexCode } from '@constants/types'
import { PTPStorageTypes, PTPFilesystemTypes } from '@constants/ptp/storage'

/** StorageInfo data set
 *
 * This data set is used to hold the state information for a storage device. See Table 11.
 *
 * | Dataset field      | Field order | Length<br>(bytes) | Data type |
 * |--------------------|-------------|-------------------|-----------|
 * | StorageType        | 1           | 2                 | UINT16    |
 * | FilesystemType     | 2           | 2                 | UINT16    |
 * | AccessCapability   | 3           | 2                 | UINT16    |
 * | MaxCapacity        | 4           | 8                 | UINT64    |
 * | FreeSpaceInBytes   | 5           | 8                 | UINT64    |
 * | FreeSpaceInImages  | 6           | 4                 | UINT32    |
 * | StorageDescription | 7           | Variable          | String    |
 * | VolumeLabel        | 8           | Variable          | String    |
 */

export type StorageInfo = {
    storageType: HexCode // DataType.UINT16
    filesystemType: HexCode // DataType.UINT16
    accessCapability: HexCode // DataType.UINT16
    maxCapacity: bigint // DataType.UINT64
    freeSpaceInBytes: bigint // DataType.UINT64
    freeSpaceInImages: number // DataType.UINT32
    storageDescription: string // DataType.STRING
    volumeLabel: string // DataType.STRING
}

export type StorageInfoParsed = {
    storageType: HexCode
    storageTypeName: string
    filesystemType: HexCode
    filesystemTypeName: string
    accessCapability: HexCode
    accessCapabilityDescription: string
    maxCapacity: bigint
    freeSpaceInBytes: bigint
    freeSpaceInImages: number
    storageDescription: string
    volumeLabel: string
    capacityPercentUsed: number
    isWritable: boolean
    isRemovable: boolean
}

export const parseStorageInfo = (data: Uint8Array): StorageInfoParsed => {
    // Check minimum data size (2+2+2+8+8+4 = 26 bytes for fixed fields)
    if (data.length < 26) {
        throw new Error(`Invalid StorageInfo data: expected at least 26 bytes, got ${data.length}`)
    }

    const view = createDataView(data)
    let offset = 0

    // 1. StorageType (UINT16)
    const storageType = view.getUint16(offset, true)
    offset += 2

    // 2. FilesystemType (UINT16)
    const filesystemType = view.getUint16(offset, true)
    offset += 2

    // 3. AccessCapability (UINT16)
    const accessCapability = view.getUint16(offset, true)
    offset += 2

    // 4. MaxCapacity (UINT64)
    const maxCapacity = view.getBigUint64(offset, true)
    offset += 8

    // 5. FreeSpaceInBytes (UINT64)
    const freeSpaceInBytes = view.getBigUint64(offset, true)
    offset += 8

    // 6. FreeSpaceInImages (UINT32)
    const freeSpaceInImages = view.getUint32(offset, true)
    offset += 4

    // 7. StorageDescription (String)
    const storageDescription = decodePTPValue(sliceBuffer(data, offset), DataType.STRING) as string
    const storageDescriptionLength = getPTPValueSize(DataType.STRING, sliceBuffer(data, offset))
    offset += storageDescriptionLength

    // 8. VolumeLabel (String)
    const volumeLabel = decodePTPValue(sliceBuffer(data, offset), DataType.STRING) as string

    // Parse storage type using constants
    const storageTypeInfo = Object.values(PTPStorageTypes).find(t => t.code === storageType)
    const storageTypeName = storageTypeInfo?.name || `Unknown_0x${storageType.toString(16).padStart(4, '0')}`

    // Parse filesystem type using constants
    const filesystemTypeEntry = Object.entries(PTPFilesystemTypes).find(([_, value]) => value === filesystemType)
    const filesystemTypeName = filesystemTypeEntry
        ? filesystemTypeEntry[0]
        : `Unknown_0x${filesystemType.toString(16).padStart(4, '0')}`

    // Parse access capability
    const accessCapabilityDescription = (() => {
        const capabilities: string[] = []

        if (accessCapability & 0x0001) capabilities.push('ReadWrite')
        else capabilities.push('ReadOnly')

        if (accessCapability & 0x0002) capabilities.push('ReadWriteDeleteDisabled')
        if (accessCapability & 0x0004) capabilities.push('Removable')

        return capabilities.join(', ') || 'None'
    })()

    // Calculate capacity percentage used
    const usedCapacity = maxCapacity - freeSpaceInBytes
    const capacityPercentUsed = maxCapacity > 0n ? Number((usedCapacity * 100n) / maxCapacity) : 0

    // Determine if writable (bit 0 of AccessCapability)
    const isWritable = (accessCapability & 0x0001) !== 0

    // Determine if removable (bit 2 of AccessCapability)
    const isRemovable = (accessCapability & 0x0004) !== 0

    return {
        storageType,
        storageTypeName,
        filesystemType,
        filesystemTypeName,
        accessCapability,
        accessCapabilityDescription,
        maxCapacity,
        freeSpaceInBytes,
        freeSpaceInImages,
        storageDescription,
        volumeLabel,
        capacityPercentUsed,
        isWritable,
        isRemovable,
    }
}
