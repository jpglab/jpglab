/**
 * PTP Codec System
 * Handles encoding and decoding of PTP data types
 */

import {
  INT8, UINT8, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  INT128, UINT128, STR, DatatypeCode, PTPString
} from './basic-types';

// ============================================================================
// CODEC INTERFACES
// ============================================================================

/**
 * Codec for encoding/decoding PTP values
 */
export interface PTPCodec<T> {
  /** Encode a value to bytes */
  encode(value: T, buffer?: ArrayBuffer, offset?: number): ArrayBuffer;
  
  /** Decode bytes to a value */
  decode(buffer: ArrayBuffer, offset?: number): { value: T; bytesRead: number };
  
  /** Get the size in bytes (if fixed size) */
  getSize?(value?: T): number;
  
  /** The PTP datatype code */
  datatypeCode: DatatypeCode;
}

/**
 * Result of a decode operation
 */
export interface DecodeResult<T> {
  value: T;
  bytesRead: number;
}

// ============================================================================
// BUFFER UTILITIES
// ============================================================================

/**
 * Helper class for reading from buffers
 */
export class BufferReader {
  private view: DataView;
  private offset: number;

  constructor(buffer: ArrayBuffer, offset = 0) {
    this.view = new DataView(buffer);
    this.offset = offset;
  }

  readInt8(): INT8 {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readUint8(): UINT8 {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readInt16(): INT16 {
    const value = this.view.getInt16(this.offset, true); // little-endian
    this.offset += 2;
    return value;
  }

  readUint16(): UINT16 {
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  readInt32(): INT32 {
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readUint32(): UINT32 {
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readInt64(): INT64 {
    const low = this.view.getUint32(this.offset, true);
    const high = this.view.getInt32(this.offset + 4, true);
    this.offset += 8;
    return (BigInt(high) << 32n) | BigInt(low);
  }

  readUint64(): UINT64 {
    const low = this.view.getUint32(this.offset, true);
    const high = this.view.getUint32(this.offset + 4, true);
    this.offset += 8;
    return (BigInt(high) << 32n) | BigInt(low);
  }

  readInt128(): INT128 {
    const low = this.readUint64();
    const high = this.readInt64();
    return (high << 64n) | low;
  }

  readUint128(): UINT128 {
    const low = this.readUint64();
    const high = this.readUint64();
    return (high << 64n) | low;
  }

  readString(): STR {
    const length = this.readUint8();
    if (length === 0) return '';
    
    const chars: number[] = [];
    for (let i = 0; i < length; i++) {
      chars.push(this.readUint16());
    }
    
    // Remove null terminator if present
    if (chars[chars.length - 1] === 0) {
      chars.pop();
    }
    
    return String.fromCharCode(...chars);
  }

  readArray<T>(itemReader: () => T, count?: number): T[] {
    const actualCount = count ?? this.readUint32();
    const result: T[] = [];
    for (let i = 0; i < actualCount; i++) {
      result.push(itemReader());
    }
    return result;
  }

  getBytesRead(): number {
    return this.offset;
  }

  getRemainingBytes(): number {
    return this.view.byteLength - this.offset;
  }
}

/**
 * Helper class for writing to buffers
 */
export class BufferWriter {
  private buffer: ArrayBuffer;
  private view: DataView;
  private offset: number;

  constructor(initialSize = 1024) {
    this.buffer = new ArrayBuffer(initialSize);
    this.view = new DataView(this.buffer);
    this.offset = 0;
  }

  private ensureCapacity(needed: number) {
    const required = this.offset + needed;
    if (required > this.buffer.byteLength) {
      const newSize = Math.max(required, this.buffer.byteLength * 2);
      const newBuffer = new ArrayBuffer(newSize);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer, 0, this.offset));
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer);
    }
  }

  writeInt8(value: INT8) {
    this.ensureCapacity(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
  }

  writeUint8(value: UINT8) {
    this.ensureCapacity(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }

  writeInt16(value: INT16) {
    this.ensureCapacity(2);
    this.view.setInt16(this.offset, value, true); // little-endian
    this.offset += 2;
  }

  writeUint16(value: UINT16) {
    this.ensureCapacity(2);
    this.view.setUint16(this.offset, value, true);
    this.offset += 2;
  }

  writeInt32(value: INT32) {
    this.ensureCapacity(4);
    this.view.setInt32(this.offset, value, true);
    this.offset += 4;
  }

  writeUint32(value: UINT32) {
    this.ensureCapacity(4);
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
  }

  writeInt64(value: INT64) {
    this.ensureCapacity(8);
    const low = Number(value & 0xFFFFFFFFn);
    const high = Number((value >> 32n) & 0xFFFFFFFFn);
    this.view.setUint32(this.offset, low, true);
    this.view.setInt32(this.offset + 4, high, true);
    this.offset += 8;
  }

  writeUint64(value: UINT64) {
    this.ensureCapacity(8);
    const low = Number(value & 0xFFFFFFFFn);
    const high = Number((value >> 32n) & 0xFFFFFFFFn);
    this.view.setUint32(this.offset, low, true);
    this.view.setUint32(this.offset + 4, high, true);
    this.offset += 8;
  }

  writeInt128(value: INT128) {
    const low = value & ((1n << 64n) - 1n);
    const high = value >> 64n;
    this.writeUint64(low);
    this.writeInt64(high);
  }

  writeUint128(value: UINT128) {
    const low = value & ((1n << 64n) - 1n);
    const high = value >> 64n;
    this.writeUint64(low);
    this.writeUint64(high);
  }

  writeString(value: STR) {
    const chars = value.split('').map(c => c.charCodeAt(0));
    chars.push(0); // Add null terminator
    
    this.writeUint8(chars.length);
    for (const char of chars) {
      this.writeUint16(char);
    }
  }

  writeArray<T>(items: T[], itemWriter: (item: T) => void, includeCount = true) {
    if (includeCount) {
      this.writeUint32(items.length);
    }
    for (const item of items) {
      itemWriter(item);
    }
  }

  getBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this.offset);
  }

  getBytesWritten(): number {
    return this.offset;
  }
}

// ============================================================================
// BASIC TYPE CODECS
// ============================================================================

export const Int8Codec: PTPCodec<INT8> = {
  datatypeCode: DatatypeCode.INT8,
  encode(value: INT8): ArrayBuffer {
    const writer = new BufferWriter(1);
    writer.writeInt8(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<INT8> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readInt8(), bytesRead: 1 };
  },
  getSize: () => 1
};

export const Uint8Codec: PTPCodec<UINT8> = {
  datatypeCode: DatatypeCode.UINT8,
  encode(value: UINT8): ArrayBuffer {
    const writer = new BufferWriter(1);
    writer.writeUint8(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<UINT8> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readUint8(), bytesRead: 1 };
  },
  getSize: () => 1
};

export const Int16Codec: PTPCodec<INT16> = {
  datatypeCode: DatatypeCode.INT16,
  encode(value: INT16): ArrayBuffer {
    const writer = new BufferWriter(2);
    writer.writeInt16(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<INT16> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readInt16(), bytesRead: 2 };
  },
  getSize: () => 2
};

export const Uint16Codec: PTPCodec<UINT16> = {
  datatypeCode: DatatypeCode.UINT16,
  encode(value: UINT16): ArrayBuffer {
    const writer = new BufferWriter(2);
    writer.writeUint16(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<UINT16> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readUint16(), bytesRead: 2 };
  },
  getSize: () => 2
};

export const Int32Codec: PTPCodec<INT32> = {
  datatypeCode: DatatypeCode.INT32,
  encode(value: INT32): ArrayBuffer {
    const writer = new BufferWriter(4);
    writer.writeInt32(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<INT32> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readInt32(), bytesRead: 4 };
  },
  getSize: () => 4
};

export const Uint32Codec: PTPCodec<UINT32> = {
  datatypeCode: DatatypeCode.UINT32,
  encode(value: UINT32): ArrayBuffer {
    const writer = new BufferWriter(4);
    writer.writeUint32(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<UINT32> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readUint32(), bytesRead: 4 };
  },
  getSize: () => 4
};

export const Int64Codec: PTPCodec<INT64> = {
  datatypeCode: DatatypeCode.INT64,
  encode(value: INT64): ArrayBuffer {
    const writer = new BufferWriter(8);
    writer.writeInt64(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<INT64> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readInt64(), bytesRead: 8 };
  },
  getSize: () => 8
};

export const Uint64Codec: PTPCodec<UINT64> = {
  datatypeCode: DatatypeCode.UINT64,
  encode(value: UINT64): ArrayBuffer {
    const writer = new BufferWriter(8);
    writer.writeUint64(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<UINT64> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readUint64(), bytesRead: 8 };
  },
  getSize: () => 8
};

export const Int128Codec: PTPCodec<INT128> = {
  datatypeCode: DatatypeCode.INT128,
  encode(value: INT128): ArrayBuffer {
    const writer = new BufferWriter(16);
    writer.writeInt128(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<INT128> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readInt128(), bytesRead: 16 };
  },
  getSize: () => 16
};

export const Uint128Codec: PTPCodec<UINT128> = {
  datatypeCode: DatatypeCode.UINT128,
  encode(value: UINT128): ArrayBuffer {
    const writer = new BufferWriter(16);
    writer.writeUint128(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<UINT128> {
    const reader = new BufferReader(buffer, offset);
    return { value: reader.readUint128(), bytesRead: 16 };
  },
  getSize: () => 16
};

export const StringCodec: PTPCodec<STR> = {
  datatypeCode: DatatypeCode.STR,
  encode(value: STR): ArrayBuffer {
    const writer = new BufferWriter();
    writer.writeString(value);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<STR> {
    const reader = new BufferReader(buffer, offset);
    const value = reader.readString();
    return { value, bytesRead: reader.getBytesRead() };
  }
};

// ============================================================================
// ARRAY CODECS
// ============================================================================

export function createArrayCodec<T>(
  itemCodec: PTPCodec<T>,
  arrayDatatypeCode: DatatypeCode
): PTPCodec<T[]> {
  return {
    datatypeCode: arrayDatatypeCode,
    encode(values: T[]): ArrayBuffer {
      const writer = new BufferWriter();
      writer.writeUint32(values.length);
      
      for (const value of values) {
        const encoded = itemCodec.encode(value);
        const bytes = new Uint8Array(encoded);
        for (const byte of bytes) {
          writer.writeUint8(byte);
        }
      }
      
      return writer.getBuffer();
    },
    decode(buffer: ArrayBuffer, offset = 0): DecodeResult<T[]> {
      const reader = new BufferReader(buffer, offset);
      const count = reader.readUint32();
      const values: T[] = [];
      let totalBytesRead = 4;
      
      for (let i = 0; i < count; i++) {
        const result = itemCodec.decode(buffer, offset + totalBytesRead);
        values.push(result.value);
        totalBytesRead += result.bytesRead;
      }
      
      return { value: values, bytesRead: totalBytesRead };
    }
  };
}

// Create array codecs for basic types
export const Int8ArrayCodec = createArrayCodec(Int8Codec, DatatypeCode.AINT8);
export const Uint8ArrayCodec = createArrayCodec(Uint8Codec, DatatypeCode.AUINT8);
export const Int16ArrayCodec = createArrayCodec(Int16Codec, DatatypeCode.AINT16);
export const Uint16ArrayCodec = createArrayCodec(Uint16Codec, DatatypeCode.AUINT16);
export const Int32ArrayCodec = createArrayCodec(Int32Codec, DatatypeCode.AINT32);
export const Uint32ArrayCodec = createArrayCodec(Uint32Codec, DatatypeCode.AUINT32);
export const Int64ArrayCodec = createArrayCodec(Int64Codec, DatatypeCode.AINT64);
export const Uint64ArrayCodec = createArrayCodec(Uint64Codec, DatatypeCode.AUINT64);
export const Int128ArrayCodec = createArrayCodec(Int128Codec, DatatypeCode.AINT128);
export const Uint128ArrayCodec = createArrayCodec(Uint128Codec, DatatypeCode.AUINT128);

// ============================================================================
// CODEC MAP
// ============================================================================

/**
 * Map of datatype codes to their codecs
 */
export const CODEC_MAP = new Map<DatatypeCode, PTPCodec<any>>([
  [DatatypeCode.INT8, Int8Codec],
  [DatatypeCode.UINT8, Uint8Codec],
  [DatatypeCode.INT16, Int16Codec],
  [DatatypeCode.UINT16, Uint16Codec],
  [DatatypeCode.INT32, Int32Codec],
  [DatatypeCode.UINT32, Uint32Codec],
  [DatatypeCode.INT64, Int64Codec],
  [DatatypeCode.UINT64, Uint64Codec],
  [DatatypeCode.INT128, Int128Codec],
  [DatatypeCode.UINT128, Uint128Codec],
  [DatatypeCode.STR, StringCodec],
  [DatatypeCode.AINT8, Int8ArrayCodec],
  [DatatypeCode.AUINT8, Uint8ArrayCodec],
  [DatatypeCode.AINT16, Int16ArrayCodec],
  [DatatypeCode.AUINT16, Uint16ArrayCodec],
  [DatatypeCode.AINT32, Int32ArrayCodec],
  [DatatypeCode.AUINT32, Uint32ArrayCodec],
  [DatatypeCode.AINT64, Int64ArrayCodec],
  [DatatypeCode.AUINT64, Uint64ArrayCodec],
  [DatatypeCode.AINT128, Int128ArrayCodec],
  [DatatypeCode.AUINT128, Uint128ArrayCodec],
]);

/**
 * Get a codec for a datatype code
 */
export function getCodec(datatypeCode: DatatypeCode): PTPCodec<any> | undefined {
  return CODEC_MAP.get(datatypeCode);
}

/**
 * Encode a value using its datatype code
 */
export function encodeValue(value: any, datatypeCode: DatatypeCode): ArrayBuffer {
  const codec = getCodec(datatypeCode);
  if (!codec) {
    throw new Error(`No codec found for datatype ${DatatypeCode[datatypeCode]}`);
  }
  return codec.encode(value);
}

/**
 * Decode a value using its datatype code
 */
export function decodeValue(buffer: ArrayBuffer, datatypeCode: DatatypeCode, offset = 0): DecodeResult<any> {
  const codec = getCodec(datatypeCode);
  if (!codec) {
    throw new Error(`No codec found for datatype ${DatatypeCode[datatypeCode]}`);
  }
  return codec.decode(buffer, offset);
}