/**
 * Inline Codec Factories
 * 
 * Factory functions for creating codecs inline at the point of use,
 * keeping everything about a property/operation in one place.
 */

import { PTPCodec, BufferReader, BufferWriter, DecodeResult } from './codec';
import { DatatypeCode, UINT16, UINT32, UINT8, INT16 } from './basic-types';
import { EnumCodec, EnumValues } from './enum-codec';

// ============================================================================
// SCALAR CODEC FACTORIES
// ============================================================================

/**
 * Create a codec for f-stop values (stored as value * 100)
 * Common f-stops are validated during encoding
 */
export function fNumberCodec(): PTPCodec<number> {
  // Common f-stop values (full and third stops)
  const validFStops = [
    1.0, 1.1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8, 3.2, 3.5, 
    4.0, 4.5, 5.0, 5.6, 6.3, 7.1, 8.0, 9.0, 10, 11, 13, 14, 16, 
    18, 20, 22, 25, 29, 32, 36, 40, 45
  ];
  
  return {
    datatypeCode: DatatypeCode.UINT16,
    encode(fStop: number): ArrayBuffer {
      // Find closest valid f-stop
      const closest = validFStops.reduce((prev, curr) => 
        Math.abs(curr - fStop) < Math.abs(prev - fStop) ? curr : prev
      );
      
      if (Math.abs(closest - fStop) > 0.1) {
        throw new Error(`Invalid f-stop: ${fStop}. Use standard f-stop values.`);
      }
      
      const writer = new BufferWriter(2);
      writer.writeUint16(Math.round(fStop * 100));
      return writer.getBuffer();
    },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<number> {
      const reader = new BufferReader(buffer, offset);
      const value = reader.readUint16();
      return { value: value / 100, bytesRead: 2 };
    },
    getSize: () => 2
  };
}

/**
 * Create a codec for focal length (stored as mm * 100)
 */
export function focalLengthCodec(): PTPCodec<number> {
  return {
    datatypeCode: DatatypeCode.UINT32,
    encode(mm: number): ArrayBuffer {
      const writer = new BufferWriter(4);
      writer.writeUint32(Math.round(mm * 100));
      return writer.getBuffer();
    },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<number> {
      const reader = new BufferReader(buffer, offset);
      const value = reader.readUint32();
      return { value: value / 100, bytesRead: 4 };
    },
    getSize: () => 4
  };
}

/**
 * Create a codec for exposure time (special encoding for shutter speeds)
 * Validates against common shutter speeds
 */
export function exposureTimeCodec(): PTPCodec<number> {
  // Common shutter speeds in seconds
  const validSpeeds = [
    // Fast speeds
    1/8000, 1/6400, 1/5000, 1/4000, 1/3200, 1/2500, 1/2000, 
    1/1600, 1/1250, 1/1000, 1/800, 1/640, 1/500, 1/400, 1/320,
    1/250, 1/200, 1/160, 1/125, 1/100, 1/80, 1/60, 1/50, 1/40,
    1/30, 1/25, 1/20, 1/15, 1/13, 1/10, 1/8, 1/6, 1/5, 1/4,
    1/3, 1/2.5, 1/2, 1/1.6, 1/1.3,
    // Slow speeds
    1, 1.3, 1.6, 2, 2.5, 3, 4, 5, 6, 8, 10, 13, 15, 20, 25, 30
  ];
  
  return {
    datatypeCode: DatatypeCode.UINT32,
    encode(seconds: number): ArrayBuffer {
      // Find closest valid speed
      const closest = validSpeeds.reduce((prev, curr) => 
        Math.abs(curr - seconds) < Math.abs(prev - seconds) ? curr : prev
      );
      
      if (Math.abs(closest - seconds) > 0.001) {
        throw new Error(`Invalid shutter speed: ${seconds}s. Use standard shutter speeds.`);
      }
      
      const writer = new BufferWriter(4);
      let encoded: number;
      
      if (seconds < 1) {
        // For exposures < 1 second, store as denominator (1/x)
        encoded = Math.round(1 / seconds);
      } else {
        // For exposures >= 1 second, store as seconds * 10000
        encoded = Math.round(seconds * 10000);
      }
      
      writer.writeUint32(encoded);
      return writer.getBuffer();
    },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<number> {
      const reader = new BufferReader(buffer, offset);
      const value = reader.readUint32();
      let seconds: number;
      
      if (value >= 10000) {
        // Values >= 10000 represent seconds * 10000
        seconds = value / 10000;
      } else {
        // Values < 10000 represent 1/x seconds
        seconds = 1 / value;
      }
      
      return { value: seconds, bytesRead: 4 };
    },
    getSize: () => 4
  };
}

/**
 * Create a codec for exposure bias (stored as EV * 1000)
 */
export function exposureBiasCodec(): PTPCodec<number> {
  return {
    datatypeCode: DatatypeCode.INT16,
    encode(ev: number): ArrayBuffer {
      const writer = new BufferWriter(2);
      writer.writeInt16(Math.round(ev * 1000));
      return writer.getBuffer();
    },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<number> {
      const reader = new BufferReader(buffer, offset);
      const value = reader.readInt16();
      return { value: value / 1000, bytesRead: 2 };
    },
    getSize: () => 2
  };
}

/**
 * Create a codec for percentage values (0-100)
 */
export function percentageCodec(): PTPCodec<number> {
  return {
    datatypeCode: DatatypeCode.UINT8,
    encode(percentage: number): ArrayBuffer {
      const writer = new BufferWriter(1);
      writer.writeUint8(Math.min(100, Math.max(0, Math.round(percentage))));
      return writer.getBuffer();
    },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<number> {
      const reader = new BufferReader(buffer, offset);
      const value = reader.readUint8();
      return { value: Math.min(100, value), bytesRead: 1 };
    },
    getSize: () => 1
  };
}

/**
 * Create a codec for digital zoom (stored as zoom * 100)
 */
export function digitalZoomCodec(): PTPCodec<number> {
  return {
    datatypeCode: DatatypeCode.UINT16,
    encode(zoom: number): ArrayBuffer {
      const writer = new BufferWriter(2);
      writer.writeUint16(Math.round(zoom * 100));
      return writer.getBuffer();
    },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<number> {
      const reader = new BufferReader(buffer, offset);
      const value = reader.readUint16();
      return { value: value / 100, bytesRead: 2 };
    },
    getSize: () => 2
  };
}

/**
 * Create a codec for DateTime strings
 */
export function dateTimeCodec(): PTPCodec<Date> {
  return {
    datatypeCode: DatatypeCode.STR,
    encode(date: Date): ArrayBuffer {
      // Format: YYYYMMDDThhmmss.s
      const year = date.getFullYear().toString().padStart(4, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      const tenths = Math.floor(date.getMilliseconds() / 100).toString();
      
      const str = `${year}${month}${day}T${hours}${minutes}${seconds}.${tenths}`;
      const writer = new BufferWriter();
      writer.writeString(str);
      return writer.getBuffer();
    },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<Date> {
      const reader = new BufferReader(buffer, offset);
      const str = reader.readString();
      
      // Parse YYYYMMDDThhmmss.s format
      const year = parseInt(str.substr(0, 4), 10);
      const month = parseInt(str.substr(4, 2), 10) - 1;
      const day = parseInt(str.substr(6, 2), 10);
      const hours = parseInt(str.substr(9, 2), 10);
      const minutes = parseInt(str.substr(11, 2), 10);
      const seconds = parseInt(str.substr(13, 2), 10);
      const tenths = parseInt(str.substr(16, 1) || '0', 10);
      
      const date = new Date(year, month, day, hours, minutes, seconds, tenths * 100);
      
      return {
        value: date,
        bytesRead: reader.getBytesRead()
      };
    }
  };
}

// ============================================================================
// DATASET CODEC FACTORIES
// ============================================================================

/**
 * Create a codec for DeviceInfo dataset
 */
export function deviceInfoCodec(): PTPCodec<any> {
  return {
    datatypeCode: DatatypeCode.UNDEF,
    encode: () => { throw new Error('DeviceInfo encoding not implemented'); },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<any> {
      const reader = new BufferReader(buffer, offset);
      
      const deviceInfo = {
        standardVersion: reader.readUint16(),
        vendorExtensionID: reader.readUint32(),
        vendorExtensionVersion: reader.readUint16(),
        vendorExtensionDesc: reader.readString(),
        functionalMode: reader.readUint16(),
        operationsSupported: reader.readArray(() => reader.readUint16()),
        eventsSupported: reader.readArray(() => reader.readUint16()),
        devicePropertiesSupported: reader.readArray(() => reader.readUint16()),
        captureFormats: reader.readArray(() => reader.readUint16()),
        imageFormats: reader.readArray(() => reader.readUint16()),
        manufacturer: reader.readString(),
        model: reader.readString(),
        deviceVersion: reader.readString(),
        serialNumber: reader.readString()
      };
      
      return { value: deviceInfo, bytesRead: reader.getBytesRead() };
    }
  };
}

/**
 * Create a codec for StorageInfo dataset
 */
export function storageInfoCodec(): PTPCodec<any> {
  return {
    datatypeCode: DatatypeCode.UNDEF,
    encode: () => { throw new Error('StorageInfo encoding not implemented'); },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<any> {
      const reader = new BufferReader(buffer, offset);
      
      const storageInfo = {
        storageType: reader.readUint16(),
        filesystemType: reader.readUint16(),
        accessCapability: reader.readUint16(),
        maxCapacity: reader.readUint64(),
        freeSpaceInBytes: reader.readUint64(),
        freeSpaceInImages: reader.readUint32(),
        storageDescription: reader.readString(),
        volumeLabel: reader.readString()
      };
      
      return { value: storageInfo, bytesRead: reader.getBytesRead() };
    }
  };
}

/**
 * Create a codec for ObjectInfo dataset
 */
export function objectInfoCodec(): PTPCodec<any> {
  return {
    datatypeCode: DatatypeCode.UNDEF,
    encode: () => { throw new Error('ObjectInfo encoding not implemented'); },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<any> {
      const reader = new BufferReader(buffer, offset);
      
      const objectInfo = {
        storageID: reader.readUint32(),
        objectFormat: reader.readUint16(),
        protectionStatus: reader.readUint16(),
        objectCompressedSize: reader.readUint32(),
        thumbFormat: reader.readUint16(),
        thumbCompressedSize: reader.readUint32(),
        thumbPixWidth: reader.readUint32(),
        thumbPixHeight: reader.readUint32(),
        imagePixWidth: reader.readUint32(),
        imagePixHeight: reader.readUint32(),
        imageBitDepth: reader.readUint32(),
        parentObject: reader.readUint32(),
        associationType: reader.readUint16(),
        associationDesc: reader.readUint32(),
        sequenceNumber: reader.readUint32(),
        filename: reader.readString(),
        captureDate: reader.readString(),
        modificationDate: reader.readString(),
        keywords: reader.readString()
      };
      
      return { value: objectInfo, bytesRead: reader.getBytesRead() };
    }
  };
}

/**
 * Create a codec for raw binary data
 */
export function binaryCodec(): PTPCodec<ArrayBuffer> {
  return {
    datatypeCode: DatatypeCode.UNDEF,
    encode(data: ArrayBuffer): ArrayBuffer {
      return data;
    },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<ArrayBuffer> {
      const data = buffer.slice(offset);
      return { value: data, bytesRead: data.byteLength };
    }
  };
}

/**
 * Create a codec for DevicePropDesc dataset
 */
export function devicePropDescCodec(): PTPCodec<any> {
  return {
    datatypeCode: DatatypeCode.UNDEF,
    encode: () => { throw new Error('DevicePropDesc encoding not implemented'); },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<any> {
      const reader = new BufferReader(buffer, offset);
      
      const propDesc: any = {
        devicePropertyCode: reader.readUint16(),
        datatype: reader.readUint16(),
        getSet: reader.readUint8()
      };
      
      // Read factory default and current values based on datatype
      // This would need the actual datatype codec logic
      
      propDesc.formFlag = reader.readUint8();
      
      // Read form data based on formFlag
      if (propDesc.formFlag === 0x01) {
        // Range form
        // Read min, max, step based on datatype
      } else if (propDesc.formFlag === 0x02) {
        // Enum form
        // Read number of values and array based on datatype
      }
      
      return { value: propDesc, bytesRead: reader.getBytesRead() };
    }
  };
}

// ============================================================================
// ENUM CODEC FACTORY
// ============================================================================

/**
 * Create an inline enum codec with values defined right there
 */
export function inlineEnumCodec<T extends number = UINT16>(
  baseCodec: PTPCodec<T>,
  values: Array<{ value: T; label: string; description?: string }>
): EnumCodec<T> {
  return new EnumCodec(baseCodec.datatypeCode, values, baseCodec);
}