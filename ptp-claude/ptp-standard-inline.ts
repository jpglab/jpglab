/**
 * PTP Standard Definitions with Inline Codecs
 * 
 * All definitions are self-contained with codecs defined at point of use
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
  Uint32ArrayCodec,
  BufferReader,
  BufferWriter,
} from './codec';

import {
  inlineEnumCodec,
  deviceInfoCodec,
  storageInfoCodec,
  objectInfoCodec,
  binaryCodec,
  fNumberCodec,
  focalLengthCodec,
  exposureTimeCodec,
  exposureBiasCodec,
  percentageCodec,
  digitalZoomCodec
} from './inline-codecs';

import { OperationCode } from './operations';
import { DevicePropCode } from './device-properties';
import { EventCode } from './events';
import { ResponseCode } from './responses';
import { DatatypeCode } from './basic-types';
import { EnumValue } from './enum-codec';

// ============================================================================
// STANDARD PTP DEFINITION SET
// ============================================================================

export const PTPStandardInline = new DefinitionSet('PTP Standard v1.1', undefined, '1.1');

// ============================================================================
// OPERATIONS
// ============================================================================

PTPStandardInline.addOperation(
  operation()
    .code(OperationCode.GET_DEVICE_INFO)
    .name('GetDeviceInfo')
    .description('Get device information')
    .dataPhase(dataPhase('out', deviceInfoCodec(), 'DeviceInfo dataset'))
    .build()
);

PTPStandardInline.addOperation(
  operation()
    .code(OperationCode.GET_STORAGE_INFO)
    .name('GetStorageInfo')
    .description('Get storage information')
    .parameter(param('storageID', Uint32Codec, 'Storage ID'))
    .dataPhase(dataPhase('out', storageInfoCodec(), 'StorageInfo dataset'))
    .build()
);

PTPStandardInline.addOperation(
  operation()
    .code(OperationCode.GET_OBJECT_INFO)
    .name('GetObjectInfo')
    .description('Get object information')
    .parameter(param('objectHandle', Uint32Codec, 'Object handle'))
    .dataPhase(dataPhase('out', objectInfoCodec(), 'ObjectInfo dataset'))
    .build()
);

PTPStandardInline.addOperation(
  operation()
    .code(OperationCode.GET_OBJECT)
    .name('GetObject')
    .description('Get object data')
    .parameter(param('objectHandle', Uint32Codec, 'Object handle'))
    .dataPhase(dataPhase('out', binaryCodec(), 'Object binary data'))
    .build()
);

// ============================================================================
// PROPERTIES WITH INLINE CODECS
// ============================================================================

// Battery Level - simple range, no custom codec needed
PTPStandardInline.addProperty(
  property<number>()
    .code(DevicePropCode.BATTERY_LEVEL)
    .name('BatteryLevel')
    .description('Battery level percentage')
    .codec(Uint8Codec)
    .access('r')
    .range(0, 100, 1)
    .build()
);

// F-Number - custom codec handles encoding and validation
PTPStandardInline.addProperty(
  property<number>()
    .code(DevicePropCode.F_NUMBER)
    .name('FNumber')
    .description('Aperture f-stop value')
    .codec(fNumberCodec())  // Codec handles f/2.8 <-> 280 conversion
    .access('rw')
    .build()
);

// Focal Length - inline codec for mm values
PTPStandardInline.addProperty(
  property<number>()
    .code(DevicePropCode.FOCAL_LENGTH)
    .name('FocalLength')
    .description('Focal length in mm')
    .codec(focalLengthCodec())
    .access('r')
    .build()
);

// White Balance - inline enum codec with semantic values
PTPStandardInline.addProperty(
  property<EnumValue>()
    .code(DevicePropCode.WHITE_BALANCE)
    .name('WhiteBalance')
    .description('White balance mode')
    .codec(inlineEnumCodec(Uint16Codec, [
      { value: 0x0000, label: 'UNDEFINED', description: 'Undefined' },
      { value: 0x0001, label: 'MANUAL', description: 'Manual white balance' },
      { value: 0x0002, label: 'AUTOMATIC', description: 'Automatic white balance' },
      { value: 0x0003, label: 'ONE_PUSH_AUTOMATIC', description: 'One-push automatic' },
      { value: 0x0004, label: 'DAYLIGHT', description: 'Daylight' },
      { value: 0x0005, label: 'FLUORESCENT', description: 'Fluorescent' },
      { value: 0x0006, label: 'TUNGSTEN', description: 'Tungsten/Incandescent' },
      { value: 0x0007, label: 'FLASH', description: 'Flash' }
    ]))
    .access('rw')
    .build()
);

// Focus Mode - inline enum codec
PTPStandardInline.addProperty(
  property<EnumValue>()
    .code(DevicePropCode.FOCUS_MODE)
    .name('FocusMode')
    .description('Focus mode')
    .codec(inlineEnumCodec(Uint16Codec, [
      { value: 0x0000, label: 'UNDEFINED', description: 'Undefined' },
      { value: 0x0001, label: 'MANUAL', description: 'Manual focus' },
      { value: 0x0002, label: 'AUTOMATIC', description: 'Automatic focus' },
      { value: 0x0003, label: 'AUTOMATIC_MACRO', description: 'Automatic macro focus' }
    ]))
    .access('rw')
    .build()
);

// Flash Mode - inline enum codec
PTPStandardInline.addProperty(
  property<EnumValue>()
    .code(DevicePropCode.FLASH_MODE)
    .name('FlashMode')
    .description('Flash mode')
    .codec(inlineEnumCodec(Uint16Codec, [
      { value: 0x0000, label: 'UNDEFINED', description: 'Undefined' },
      { value: 0x0001, label: 'AUTO_FLASH', description: 'Auto flash' },
      { value: 0x0002, label: 'FLASH_OFF', description: 'Flash off' },
      { value: 0x0003, label: 'FILL_FLASH', description: 'Fill flash' },
      { value: 0x0004, label: 'RED_EYE_AUTO', description: 'Red-eye reduction auto' },
      { value: 0x0005, label: 'RED_EYE_FILL', description: 'Red-eye reduction fill' },
      { value: 0x0006, label: 'EXTERNAL_SYNC', description: 'External sync' }
    ]))
    .access('rw')
    .build()
);

// Exposure Time - codec handles shutter speed encoding
PTPStandardInline.addProperty(
  property<number>()
    .code(DevicePropCode.EXPOSURE_TIME)
    .name('ExposureTime')
    .description('Exposure time in seconds')
    .codec(exposureTimeCodec())  // Handles 1/250 <-> value encoding
    .access('rw')
    .build()
);

// Exposure Bias - range property, codec handles EV encoding
PTPStandardInline.addProperty(
  property<number>()
    .code(DevicePropCode.EXPOSURE_BIAS_COMPENSATION)
    .name('ExposureBiasCompensation')
    .description('Exposure bias in EV')
    .codec(exposureBiasCodec())  // Handles EV <-> INT16 encoding
    .access('rw')
    .range(-3.0, 3.0, 0.333)
    .build()
);

// ISO - simple enum, no special encoding needed
PTPStandardInline.addProperty(
  property<number>()
    .code(DevicePropCode.EXPOSURE_INDEX)
    .name('ExposureIndex')
    .description('ISO sensitivity')
    .codec(Uint16Codec)  // Direct values, no special encoding
    .access('rw')
    .enumValues([100, 200, 400, 800, 1600, 3200, 6400, 12800])
    .build()
);

// Exposure Program Mode - inline enum codec
PTPStandardInline.addProperty(
  property<EnumValue>()
    .code(DevicePropCode.EXPOSURE_PROGRAM_MODE)
    .name('ExposureProgramMode')
    .description('Exposure program mode')
    .codec(inlineEnumCodec(Uint16Codec, [
      { value: 0x0000, label: 'UNDEFINED', description: 'Undefined' },
      { value: 0x0001, label: 'MANUAL', description: 'Manual exposure' },
      { value: 0x0002, label: 'AUTOMATIC', description: 'Program auto' },
      { value: 0x0003, label: 'APERTURE_PRIORITY', description: 'Aperture priority' },
      { value: 0x0004, label: 'SHUTTER_PRIORITY', description: 'Shutter priority' },
      { value: 0x0005, label: 'CREATIVE', description: 'Creative program' },
      { value: 0x0006, label: 'ACTION', description: 'Action program' },
      { value: 0x0007, label: 'PORTRAIT', description: 'Portrait mode' }
    ]))
    .access('rw')
    .build()
);

// Still Capture Mode - inline enum codec
PTPStandardInline.addProperty(
  property<EnumValue>()
    .code(DevicePropCode.STILL_CAPTURE_MODE)
    .name('StillCaptureMode')
    .description('Still capture mode')
    .codec(inlineEnumCodec(Uint16Codec, [
      { value: 0x0000, label: 'UNDEFINED', description: 'Undefined' },
      { value: 0x0001, label: 'SINGLE_SHOT', description: 'Single shot' },
      { value: 0x0002, label: 'BURST', description: 'Burst/continuous' },
      { value: 0x0003, label: 'TIMELAPSE', description: 'Timelapse' }
    ]))
    .access('rw')
    .build()
);

// Digital Zoom - range property, codec handles zoom encoding
PTPStandardInline.addProperty(
  property<number>()
    .code(DevicePropCode.DIGITAL_ZOOM)
    .name('DigitalZoom')
    .description('Digital zoom factor')
    .codec(digitalZoomCodec())  // Handles 2.5x <-> 250 encoding
    .access('rw')
    .range(1.0, 4.0, 0.1)
    .build()
);

// Date/Time - string property
PTPStandardInline.addProperty(
  property<string>()
    .code(DevicePropCode.DATE_TIME)
    .name('DateTime')
    .description('Device date and time')
    .codec(StringCodec)
    .access('rw')
    .build()
);

// ============================================================================
// EVENTS
// ============================================================================

PTPStandardInline.addEvent(
  event()
    .code(EventCode.OBJECT_ADDED)
    .name('ObjectAdded')
    .description('New object added to storage')
    .parameter(param('objectHandle', Uint32Codec, 'Handle of added object'))
    .build()
);

PTPStandardInline.addEvent(
  event()
    .code(EventCode.DEVICE_PROP_CHANGED)
    .name('DevicePropChanged')
    .description('Device property value changed')
    .parameter(param('devicePropCode', Uint16Codec, 'Changed property code'))
    .build()
);

PTPStandardInline.addEvent(
  event()
    .code(EventCode.CAPTURE_COMPLETE)
    .name('CaptureComplete')
    .description('Capture operation completed')
    .parameter(param('transactionID', Uint32Codec, 'Transaction ID of capture'))
    .build()
);

// ============================================================================
// RESPONSES
// ============================================================================

PTPStandardInline.addResponse(
  response()
    .code(ResponseCode.OK)
    .name('OK')
    .description('Operation completed successfully')
    .isError(false)
    .build()
);

PTPStandardInline.addResponse(
  response()
    .code(ResponseCode.DEVICE_BUSY)
    .name('DeviceBusy')
    .description('Device is busy')
    .isError(true)
    .parameter(param('timeUntilReady', Uint32Codec, 'Milliseconds until ready', true))
    .build()
);

export default PTPStandardInline;