/**
 * Sony Vendor Extension Definitions
 * 
 * Example vendor extension showing how to extend standard PTP with vendor-specific
 * operations, properties, events, and responses.
 */

import {
  DefinitionSet,
  operation,
  property,
  event,
  response,
  param,
  dataPhase
} from './definitions';

import {
  Uint8Codec,
  Uint16Codec,
  Uint32Codec,
  Int16Codec,
  StringCodec,
  BufferReader,
  BufferWriter,
  PTPCodec,
  DecodeResult
} from './codec';

import { VendorExtensionID } from './vendor-registry';

// ============================================================================
// SONY VENDOR CODES
// ============================================================================

/**
 * Sony-specific operation codes
 */
export enum SonyOperationCode {
  SET_CONTROL_DEVICE_A = 0x9201,
  SET_CONTROL_DEVICE_B = 0x9202,
  SET_PC_SAVE_INFO = 0x9203,
  SET_STILL_IMAGE_SAVE_DESTINATION = 0x9204,
  GET_SDK_INFO = 0x9205,
  SET_EXTENDED_EVENT_INFO = 0x9206,
  SET_CONTENTS_TRANSFER_CALLBACK_INFO = 0x9207,
  SET_FOCUS_AREA = 0x9208,
  SET_FOCUS_POINT = 0x9209,
  GET_LIVE_VIEW_IMAGE = 0x920A,
  SET_LIVE_VIEW_IMAGE_SIZE = 0x920B,
  GET_SHUTTER_HALF_RESULTS = 0x920C,
  SHUTTER_HALF_PRESS = 0x920D,
  SHUTTER_HALF_RELEASE = 0x920E,
  ZOOM_OPERATION = 0x920F,
  SET_ZOOM_SPEED = 0x9210,
  GET_ZOOM_POSITION = 0x9211
}

/**
 * Sony-specific property codes
 */
export enum SonyPropertyCode {
  DPC_SHUTTER_SPEED = 0xD200,
  DPC_APERTURE = 0xD201,
  DPC_ISO = 0xD202,
  DPC_EXPOSURE_COMPENSATION = 0xD203,
  DPC_SHOOTING_MODE = 0xD204,
  DPC_DRIVE_MODE = 0xD205,
  DPC_FOCUS_MODE = 0xD206,
  DPC_FOCUS_AREA = 0xD207,
  DPC_WHITE_BALANCE_MODE = 0xD208,
  DPC_COLOR_TEMPERATURE = 0xD209,
  DPC_PICTURE_EFFECT = 0xD20A,
  DPC_JPEG_QUALITY = 0xD20B,
  DPC_RAW_COMPRESSION = 0xD20C,
  DPC_ASPECT_RATIO = 0xD20D,
  DPC_IMAGE_SIZE = 0xD20E,
  DPC_VIDEO_RECORD_SETTING = 0xD20F,
  DPC_MOVIE_FORMAT = 0xD210,
  DPC_LENS_MODEL = 0xD211,
  DPC_LENS_STATUS = 0xD212,
  DPC_ZOOM_POSITION = 0xD213,
  DPC_BATTERY_REMAINING = 0xD214
}

/**
 * Sony-specific event codes
 */
export enum SonyEventCode {
  OBJECT_ADDED_IN_SDRAM = 0xC201,
  CAPTURE_COMPLETE_SDRAM = 0xC202,
  RECORDING_STOPPED = 0xC203,
  LIVE_VIEW_IMAGE_AVAILABLE = 0xC204,
  PROPERTY_VALUES_UPDATED = 0xC205,
  ZOOM_POSITION_CHANGED = 0xC206,
  FOCUS_POSITION_CHANGED = 0xC207
}

/**
 * Sony-specific response codes
 */
export enum SonyResponseCode {
  CAMERA_NOT_READY = 0xA201,
  LENS_NOT_ATTACHED = 0xA202,
  FOCUS_NOT_LOCKED = 0xA203,
  LIVE_VIEW_NOT_AVAILABLE = 0xA204,
  RECORDING_IN_PROGRESS = 0xA205,
  ZOOM_LIMIT_REACHED = 0xA206
}

// ============================================================================
// SONY CUSTOM CODECS
// ============================================================================

/**
 * Sony shutter speed codec (special encoding)
 */
const SonyShutterSpeedCodec: PTPCodec<string> = {
  datatypeCode: 0xD200, // Custom datatype
  encode(value: string): ArrayBuffer {
    // Sony encodes shutter speeds as special values
    const speedMap: Record<string, number> = {
      'BULB': 0x00000000,
      '30"': 0x001E0001,
      '15"': 0x000F0001,
      '8"': 0x00080001,
      '4"': 0x00040001,
      '2"': 0x00020001,
      '1"': 0x00010001,
      '1/2': 0x00010002,
      '1/4': 0x00010004,
      '1/8': 0x00010008,
      '1/15': 0x0001000F,
      '1/30': 0x0001001E,
      '1/60': 0x0001003C,
      '1/125': 0x0001007D,
      '1/250': 0x000100FA,
      '1/500': 0x000101F4,
      '1/1000': 0x000103E8,
      '1/2000': 0x000107D0,
      '1/4000': 0x00010FA0,
      '1/8000': 0x00011F40
    };
    
    const encoded = speedMap[value] ?? 0x00010001; // Default to 1"
    const writer = new BufferWriter(4);
    writer.writeUint32(encoded);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<string> {
    const reader = new BufferReader(buffer, offset);
    const value = reader.readUint32();
    
    // Reverse map for decoding
    const speedMap: Record<number, string> = {
      0x00000000: 'BULB',
      0x001E0001: '30"',
      0x000F0001: '15"',
      0x00080001: '8"',
      0x00040001: '4"',
      0x00020001: '2"',
      0x00010001: '1"',
      0x00010002: '1/2',
      0x00010004: '1/4',
      0x00010008: '1/8',
      0x0001000F: '1/15',
      0x0001001E: '1/30',
      0x0001003C: '1/60',
      0x0001007D: '1/125',
      0x000100FA: '1/250',
      0x000101F4: '1/500',
      0x000103E8: '1/1000',
      0x000107D0: '1/2000',
      0x00010FA0: '1/4000',
      0x00011F40: '1/8000'
    };
    
    const shutter = speedMap[value] ?? `0x${value.toString(16).padStart(8, '0')}`;
    return { value: shutter, bytesRead: 4 };
  },
  getSize: () => 4
};

/**
 * Sony aperture codec (f-stop * 100, but with special values)
 */
const SonyApertureCodec: PTPCodec<number> = {
  datatypeCode: 0xD201,
  encode(fStop: number): ArrayBuffer {
    const writer = new BufferWriter(2);
    // Sony uses special encoding: 100 = f/1.0, 140 = f/1.4, etc.
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

/**
 * Focus area codec
 */
interface FocusArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const FocusAreaCodec: PTPCodec<FocusArea> = {
  datatypeCode: 0xD207,
  encode(area: FocusArea): ArrayBuffer {
    const writer = new BufferWriter(8);
    writer.writeUint16(area.x);
    writer.writeUint16(area.y);
    writer.writeUint16(area.width);
    writer.writeUint16(area.height);
    return writer.getBuffer();
  },
  decode(buffer: ArrayBuffer, offset = 0): DecodeResult<FocusArea> {
    const reader = new BufferReader(buffer, offset);
    const area = {
      x: reader.readUint16(),
      y: reader.readUint16(),
      width: reader.readUint16(),
      height: reader.readUint16()
    };
    return { value: area, bytesRead: 8 };
  },
  getSize: () => 8
};

// ============================================================================
// SONY VENDOR DEFINITION SET
// ============================================================================

export const SonyVendorExtension = new DefinitionSet(
  'Sony Vendor Extension',
  VendorExtensionID.SONY,
  '1.0'
);

// ============================================================================
// SONY OPERATIONS
// ============================================================================

SonyVendorExtension.addOperation(
  operation()
    .code(SonyOperationCode.GET_LIVE_VIEW_IMAGE)
    .name('GetLiveViewImage')
    .description('Get current live view image')
    .dataPhase(dataPhase('out', {
      datatypeCode: 0xFFFF,
      encode: () => { throw new Error('Not implemented'); },
      decode: (buffer) => ({ value: buffer, bytesRead: buffer.byteLength })
    }, 'JPEG image data'))
    .build()
);

SonyVendorExtension.addOperation(
  operation()
    .code(SonyOperationCode.SET_LIVE_VIEW_IMAGE_SIZE)
    .name('SetLiveViewImageSize')
    .description('Set live view image dimensions')
    .parameter(param('width', Uint16Codec, 'Image width'))
    .parameter(param('height', Uint16Codec, 'Image height'))
    .build()
);

SonyVendorExtension.addOperation(
  operation()
    .code(SonyOperationCode.SHUTTER_HALF_PRESS)
    .name('ShutterHalfPress')
    .description('Perform shutter half-press (AF/AE)')
    .build()
);

SonyVendorExtension.addOperation(
  operation()
    .code(SonyOperationCode.SHUTTER_HALF_RELEASE)
    .name('ShutterHalfRelease')
    .description('Release shutter half-press')
    .build()
);

SonyVendorExtension.addOperation(
  operation()
    .code(SonyOperationCode.SET_FOCUS_POINT)
    .name('SetFocusPoint')
    .description('Set focus point position')
    .parameter(param('x', Uint16Codec, 'X coordinate'))
    .parameter(param('y', Uint16Codec, 'Y coordinate'))
    .build()
);

SonyVendorExtension.addOperation(
  operation()
    .code(SonyOperationCode.ZOOM_OPERATION)
    .name('ZoomOperation')
    .description('Control zoom')
    .parameter(param('direction', Uint8Codec, '0=stop, 1=wide, 2=tele'))
    .build()
);

SonyVendorExtension.addOperation(
  operation()
    .code(SonyOperationCode.SET_ZOOM_SPEED)
    .name('SetZoomSpeed')
    .description('Set zoom speed')
    .parameter(param('speed', Uint8Codec, 'Speed 0-7'))
    .build()
);

SonyVendorExtension.addOperation(
  operation()
    .code(SonyOperationCode.GET_ZOOM_POSITION)
    .name('GetZoomPosition')
    .description('Get current zoom position')
    .responseParameter(param('position', Uint16Codec, 'Zoom position'))
    .build()
);

// ============================================================================
// SONY PROPERTIES
// ============================================================================

SonyVendorExtension.addProperty(
  property<string>()
    .code(SonyPropertyCode.DPC_SHUTTER_SPEED)
    .name('ShutterSpeed')
    .description('Shutter speed setting')
    .codec(SonyShutterSpeedCodec)
    .access('rw')
    .enumValues(['BULB', '30"', '15"', '8"', '4"', '2"', '1"', '1/2', '1/4', '1/8', 
                 '1/15', '1/30', '1/60', '1/125', '1/250', '1/500', '1/1000', 
                 '1/2000', '1/4000', '1/8000'])
    .build()
);

SonyVendorExtension.addProperty(
  property<number>()
    .code(SonyPropertyCode.DPC_APERTURE)
    .name('Aperture')
    .description('Aperture f-stop value')
    .codec(SonyApertureCodec)
    .access('rw')
    .enumValues([1.0, 1.2, 1.4, 1.8, 2.0, 2.2, 2.5, 2.8, 3.2, 3.5, 4.0, 4.5, 
                 5.0, 5.6, 6.3, 7.1, 8.0, 9.0, 10, 11, 13, 14, 16, 18, 20, 22])
    .build()
);

SonyVendorExtension.addProperty(
  property<number>()
    .code(SonyPropertyCode.DPC_ISO)
    .name('ISO')
    .description('ISO sensitivity')
    .codec(Uint32Codec)
    .access('rw')
    .enumValues([50, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 
                 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000,
                 12800, 16000, 20000, 25600, 32000, 40000, 51200, 64000, 80000,
                 102400, 128000, 160000, 204800])
    .build()
);

SonyVendorExtension.addProperty(
  property<FocusArea>()
    .code(SonyPropertyCode.DPC_FOCUS_AREA)
    .name('FocusArea')
    .description('Focus area selection')
    .codec(FocusAreaCodec)
    .access('rw')
    .build()
);

SonyVendorExtension.addProperty(
  property<number>()
    .code(SonyPropertyCode.DPC_COLOR_TEMPERATURE)
    .name('ColorTemperature')
    .description('Color temperature in Kelvin')
    .codec(Uint16Codec)
    .access('rw')
    .range(2500, 9900, 100)
    .build()
);

SonyVendorExtension.addProperty(
  property<string>()
    .code(SonyPropertyCode.DPC_LENS_MODEL)
    .name('LensModel')
    .description('Attached lens model name')
    .codec(StringCodec)
    .access('r')
    .build()
);

SonyVendorExtension.addProperty(
  property<number>()
    .code(SonyPropertyCode.DPC_ZOOM_POSITION)
    .name('ZoomPosition')
    .description('Current zoom position')
    .codec(Uint16Codec)
    .access('r')
    .range(0, 100, 1)
    .build()
);

SonyVendorExtension.addProperty(
  property<number>()
    .code(SonyPropertyCode.DPC_BATTERY_REMAINING)
    .name('BatteryRemaining')
    .description('Battery remaining percentage')
    .codec(Uint8Codec)
    .access('r')
    .range(0, 100, 1)
    .build()
);

// ============================================================================
// SONY EVENTS
// ============================================================================

SonyVendorExtension.addEvent(
  event()
    .code(SonyEventCode.OBJECT_ADDED_IN_SDRAM)
    .name('ObjectAddedInSDRAM')
    .description('New image captured to camera buffer')
    .parameter(param('objectHandle', Uint32Codec, 'Handle of captured object'))
    .parameter(param('size', Uint32Codec, 'Object size in bytes'))
    .build()
);

SonyVendorExtension.addEvent(
  event()
    .code(SonyEventCode.LIVE_VIEW_IMAGE_AVAILABLE)
    .name('LiveViewImageAvailable')
    .description('New live view frame available')
    .build()
);

SonyVendorExtension.addEvent(
  event()
    .code(SonyEventCode.PROPERTY_VALUES_UPDATED)
    .name('PropertyValuesUpdated')
    .description('Multiple property values changed')
    .parameter(param('count', Uint16Codec, 'Number of changed properties'))
    .build()
);

SonyVendorExtension.addEvent(
  event()
    .code(SonyEventCode.ZOOM_POSITION_CHANGED)
    .name('ZoomPositionChanged')
    .description('Zoom position has changed')
    .parameter(param('position', Uint16Codec, 'New zoom position'))
    .build()
);

// ============================================================================
// SONY RESPONSES
// ============================================================================

SonyVendorExtension.addResponse(
  response()
    .code(SonyResponseCode.CAMERA_NOT_READY)
    .name('CameraNotReady')
    .description('Camera is not ready for operation')
    .isError(true)
    .build()
);

SonyVendorExtension.addResponse(
  response()
    .code(SonyResponseCode.LENS_NOT_ATTACHED)
    .name('LensNotAttached')
    .description('No lens attached to camera')
    .isError(true)
    .build()
);

SonyVendorExtension.addResponse(
  response()
    .code(SonyResponseCode.FOCUS_NOT_LOCKED)
    .name('FocusNotLocked')
    .description('Auto-focus did not achieve lock')
    .isError(true)
    .build()
);

SonyVendorExtension.addResponse(
  response()
    .code(SonyResponseCode.LIVE_VIEW_NOT_AVAILABLE)
    .name('LiveViewNotAvailable')
    .description('Live view is not available')
    .isError(true)
    .build()
);

SonyVendorExtension.addResponse(
  response()
    .code(SonyResponseCode.ZOOM_LIMIT_REACHED)
    .name('ZoomLimitReached')
    .description('Zoom has reached its limit')
    .isError(true)
    .build()
);

// Export as default for easy importing
export default SonyVendorExtension;