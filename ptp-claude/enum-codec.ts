/**
 * PTP Enum Codec System
 * 
 * Provides semantic enum handling where values have meaningful names
 */

import { PTPCodec, BufferReader, BufferWriter, DecodeResult } from './codec';
import { UINT16, UINT32, DatatypeCode } from './basic-types';

// ============================================================================
// ENUM VALUE DEFINITION
// ============================================================================

/**
 * Represents an enum value with its code and label
 */
export interface EnumValue<T = number> {
  value: T;
  label: string;
  description?: string;
}

/**
 * Collection of enum values
 */
export type EnumValues<T = number> = EnumValue<T>[];

// ============================================================================
// ENUM CODEC
// ============================================================================

/**
 * Codec for enum values that preserves semantic meaning
 */
export class EnumCodec<T extends number = UINT16> implements PTPCodec<EnumValue<T>> {
  private valueMap = new Map<T, EnumValue<T>>();
  private labelMap = new Map<string, EnumValue<T>>();
  
  constructor(
    public datatypeCode: DatatypeCode,
    public values: EnumValues<T>,
    private baseCodec: PTPCodec<T>
  ) {
    // Build lookup maps
    for (const enumValue of values) {
      this.valueMap.set(enumValue.value, enumValue);
      this.labelMap.set(enumValue.label, enumValue);
    }
  }
  
  encode(enumValue: EnumValue<T> | string | T): ArrayBuffer {
    let value: T;
    
    if (typeof enumValue === 'string') {
      // Encode from label
      const ev = this.labelMap.get(enumValue);
      if (!ev) {
        throw new Error(`Unknown enum label: ${enumValue}`);
      }
      value = ev.value;
    } else if (typeof enumValue === 'number') {
      // Encode from raw value
      value = enumValue as T;
    } else {
      // Encode from EnumValue object
      value = enumValue.value;
    }
    
    return this.baseCodec.encode(value);
  }
  
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<EnumValue<T>> {
    const result = this.baseCodec.decode(buffer, offset);
    const enumValue = this.valueMap.get(result.value);
    
    if (!enumValue) {
      // Return unknown value with hex label
      return {
        value: {
          value: result.value,
          label: `0x${result.value.toString(16).padStart(4, '0')}`,
          description: 'Unknown value'
        },
        bytesRead: result.bytesRead
      };
    }
    
    return {
      value: enumValue,
      bytesRead: result.bytesRead
    };
  }
  
  getSize?(): number {
    return this.baseCodec.getSize?.() || 0;
  }
  
  /**
   * Get all possible values
   */
  getValues(): EnumValues<T> {
    return this.values;
  }
  
  /**
   * Get enum value by label
   */
  getByLabel(label: string): EnumValue<T> | undefined {
    return this.labelMap.get(label);
  }
  
  /**
   * Get enum value by numeric value
   */
  getByValue(value: T): EnumValue<T> | undefined {
    return this.valueMap.get(value);
  }
  
  /**
   * Check if a value is valid
   */
  isValid(value: T | string | EnumValue<T>): boolean {
    if (typeof value === 'string') {
      return this.labelMap.has(value);
    } else if (typeof value === 'number') {
      return this.valueMap.has(value as T);
    } else {
      return this.valueMap.has(value.value);
    }
  }
}

// ============================================================================
// ENUM BUILDERS
// ============================================================================

/**
 * Builder for creating enum value definitions
 */
export class EnumBuilder<T extends number = UINT16> {
  private values: EnumValues<T> = [];
  
  add(value: T, label: string, description?: string): this {
    this.values.push({ value, label, description });
    return this;
  }
  
  build(): EnumValues<T> {
    return this.values;
  }
}

/**
 * Create an enum builder
 */
export function enumValues<T extends number = UINT16>(): EnumBuilder<T> {
  return new EnumBuilder<T>();
}

// ============================================================================
// STANDARD PTP ENUMS
// ============================================================================

/**
 * White Balance enum values
 */
export const WhiteBalanceValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'MANUAL', 'Manual white balance')
  .add(0x0002, 'AUTOMATIC', 'Automatic white balance')
  .add(0x0003, 'ONE_PUSH_AUTOMATIC', 'One-push automatic')
  .add(0x0004, 'DAYLIGHT', 'Daylight')
  .add(0x0005, 'FLUORESCENT', 'Fluorescent')
  .add(0x0006, 'TUNGSTEN', 'Tungsten/Incandescent')
  .add(0x0007, 'FLASH', 'Flash')
  .build();

/**
 * Focus Mode enum values
 */
export const FocusModeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'MANUAL', 'Manual focus')
  .add(0x0002, 'AUTOMATIC', 'Automatic focus')
  .add(0x0003, 'AUTOMATIC_MACRO', 'Automatic macro focus')
  .build();

/**
 * Exposure Metering Mode enum values
 */
export const ExposureMeteringModeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'AVERAGE', 'Average metering')
  .add(0x0002, 'CENTER_WEIGHTED_AVERAGE', 'Center-weighted average')
  .add(0x0003, 'MULTI_SPOT', 'Multi-spot metering')
  .add(0x0004, 'CENTER_SPOT', 'Center spot metering')
  .build();

/**
 * Flash Mode enum values
 */
export const FlashModeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'AUTO_FLASH', 'Auto flash')
  .add(0x0002, 'FLASH_OFF', 'Flash off')
  .add(0x0003, 'FILL_FLASH', 'Fill flash')
  .add(0x0004, 'RED_EYE_AUTO', 'Red-eye reduction auto')
  .add(0x0005, 'RED_EYE_FILL', 'Red-eye reduction fill')
  .add(0x0006, 'EXTERNAL_SYNC', 'External sync')
  .build();

/**
 * Exposure Program Mode enum values
 */
export const ExposureProgramModeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'MANUAL', 'Manual exposure')
  .add(0x0002, 'AUTOMATIC', 'Program auto')
  .add(0x0003, 'APERTURE_PRIORITY', 'Aperture priority')
  .add(0x0004, 'SHUTTER_PRIORITY', 'Shutter priority')
  .add(0x0005, 'CREATIVE', 'Creative program')
  .add(0x0006, 'ACTION', 'Action program')
  .add(0x0007, 'PORTRAIT', 'Portrait mode')
  .build();

/**
 * Still Capture Mode enum values
 */
export const StillCaptureModeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'SINGLE_SHOT', 'Single shot')
  .add(0x0002, 'BURST', 'Burst/continuous')
  .add(0x0003, 'TIMELAPSE', 'Timelapse')
  .build();

/**
 * Effect Mode enum values
 */
export const EffectModeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'STANDARD', 'Standard/normal')
  .add(0x0002, 'BLACK_WHITE', 'Black & white')
  .add(0x0003, 'SEPIA', 'Sepia tone')
  .build();

/**
 * Focus Metering Mode enum values
 */
export const FocusMeteringModeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'CENTER_SPOT', 'Center spot')
  .add(0x0002, 'MULTI_SPOT', 'Multi-spot')
  .build();

/**
 * Functional Mode enum values
 */
export const FunctionalModeValues = enumValues<UINT16>()
  .add(0x0000, 'STANDARD_MODE', 'Standard mode')
  .add(0x0001, 'SLEEP_STATE', 'Sleep state')
  .build();

/**
 * Protection Status enum values
 */
export const ProtectionStatusValues = enumValues<UINT16>()
  .add(0x0000, 'NO_PROTECTION', 'No protection')
  .add(0x0001, 'READ_ONLY', 'Read-only protected')
  .build();

/**
 * Storage Type enum values
 */
export const StorageTypeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'FIXED_ROM', 'Fixed ROM')
  .add(0x0002, 'REMOVABLE_ROM', 'Removable ROM')
  .add(0x0003, 'FIXED_RAM', 'Fixed RAM')
  .add(0x0004, 'REMOVABLE_RAM', 'Removable RAM')
  .build();

/**
 * Filesystem Type enum values
 */
export const FilesystemTypeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'GENERIC_FLAT', 'Generic flat')
  .add(0x0002, 'GENERIC_HIERARCHICAL', 'Generic hierarchical')
  .build();

/**
 * Access Capability enum values
 */
export const AccessCapabilityValues = enumValues<UINT16>()
  .add(0x0000, 'READ_WRITE', 'Read-write access')
  .add(0x0001, 'READ_ONLY_WITHOUT_DELETE', 'Read-only without delete')
  .add(0x0002, 'READ_ONLY_WITH_DELETE', 'Read-only with delete')
  .build();

/**
 * Association Type enum values
 */
export const AssociationTypeValues = enumValues<UINT16>()
  .add(0x0000, 'UNDEFINED', 'Undefined')
  .add(0x0001, 'GENERIC_FOLDER', 'Generic folder')
  .add(0x0002, 'ALBUM', 'Album')
  .add(0x0003, 'TIME_SEQUENCE', 'Time sequence')
  .add(0x0004, 'HORIZONTAL_PANORAMIC', 'Horizontal panoramic')
  .add(0x0005, 'VERTICAL_PANORAMIC', 'Vertical panoramic')
  .add(0x0006, 'TWO_D_PANORAMIC', '2D panoramic')
  .add(0x0007, 'ANCILLARY_DATA', 'Ancillary data')
  .build();