/**
 * Mock PTP Transport for Testing
 * 
 * Simulates a camera for testing without real hardware
 */

import { PTPTransport, PTPTransportResponse, PTPEvent } from './ptp-client';
import { OperationCode } from './operations';
import { DevicePropCode } from './device-properties';
import { ResponseCode } from './responses';
import { BufferWriter } from './codec';

export class MockPTPTransport implements PTPTransport {
  private eventCallbacks: Array<(event: PTPEvent) => void> = [];
  private deviceProperties = new Map<number, ArrayBuffer>();
  private isOpen = false;
  
  constructor() {
    // Initialize some mock property values
    this.initializeMockProperties();
  }
  
  private initializeMockProperties() {
    // F-Number: f/2.8 (encoded as 280)
    const fnumber = new BufferWriter(2);
    fnumber.writeUint16(280);
    this.deviceProperties.set(DevicePropCode.F_NUMBER, fnumber.getBuffer());
    
    // ISO: 400
    const iso = new BufferWriter(2);
    iso.writeUint16(400);
    this.deviceProperties.set(DevicePropCode.EXPOSURE_INDEX, iso.getBuffer());
    
    // Shutter Speed: 1/250 (encoded as 250)
    const shutter = new BufferWriter(4);
    shutter.writeUint32(250);
    this.deviceProperties.set(DevicePropCode.EXPOSURE_TIME, shutter.getBuffer());
    
    // White Balance: Daylight (0x0004)
    const wb = new BufferWriter(2);
    wb.writeUint16(0x0004);
    this.deviceProperties.set(DevicePropCode.WHITE_BALANCE, wb.getBuffer());
    
    // Battery Level: 75%
    const battery = new BufferWriter(1);
    battery.writeUint8(75);
    this.deviceProperties.set(DevicePropCode.BATTERY_LEVEL, battery.getBuffer());
  }
  
  async open(): Promise<void> {
    this.isOpen = true;
    console.log('[MockTransport] Connection opened');
  }
  
  async close(): Promise<void> {
    this.isOpen = false;
    console.log('[MockTransport] Connection closed');
  }
  
  async sendOperation(
    operationCode: number,
    parameters: number[],
    data?: ArrayBuffer
  ): Promise<PTPTransportResponse> {
    if (!this.isOpen) {
      throw new Error('Transport not open');
    }
    
    console.log(`[MockTransport] Operation: 0x${operationCode.toString(16)}, Params:`, parameters);
    
    switch (operationCode) {
      case OperationCode.GET_DEVICE_INFO:
        return this.mockGetDeviceInfo();
        
      case OperationCode.OPEN_SESSION:
        return { responseCode: ResponseCode.OK, parameters: [] };
        
      case OperationCode.CLOSE_SESSION:
        return { responseCode: ResponseCode.OK, parameters: [] };
        
      case OperationCode.GET_DEVICE_PROP_VALUE:
        return this.mockGetPropertyValue(parameters[0]);
        
      case OperationCode.SET_DEVICE_PROP_VALUE:
        return this.mockSetPropertyValue(parameters[0], data!);
        
      case OperationCode.INITIATE_CAPTURE:
        return this.mockInitiateCapture(parameters);
        
      case OperationCode.GET_OBJECT_HANDLES:
        return this.mockGetObjectHandles();
        
      default:
        return { 
          responseCode: ResponseCode.OPERATION_NOT_SUPPORTED, 
          parameters: [] 
        };
    }
  }
  
  onEvent(callback: (event: PTPEvent) => void): void {
    this.eventCallbacks.push(callback);
  }
  
  private mockGetDeviceInfo(): PTPTransportResponse {
    const writer = new BufferWriter();
    
    // Standard version (PTP v1.1)
    writer.writeUint16(110);
    
    // Vendor extension ID (Sony)
    writer.writeUint32(0x00000011);
    
    // Vendor extension version
    writer.writeUint16(100);
    
    // Vendor extension description
    writer.writeString('Sony Extension v1.0');
    
    // Functional mode
    writer.writeUint16(0x0000);
    
    // Operations supported (simplified)
    writer.writeUint32(10); // count
    writer.writeUint16(OperationCode.GET_DEVICE_INFO);
    writer.writeUint16(OperationCode.OPEN_SESSION);
    writer.writeUint16(OperationCode.CLOSE_SESSION);
    writer.writeUint16(OperationCode.GET_STORAGE_IDS);
    writer.writeUint16(OperationCode.GET_OBJECT_HANDLES);
    writer.writeUint16(OperationCode.GET_OBJECT);
    writer.writeUint16(OperationCode.INITIATE_CAPTURE);
    writer.writeUint16(OperationCode.GET_DEVICE_PROP_VALUE);
    writer.writeUint16(OperationCode.SET_DEVICE_PROP_VALUE);
    writer.writeUint16(OperationCode.GET_DEVICE_PROP_DESC);
    
    // Events supported
    writer.writeUint32(3); // count
    writer.writeUint16(0x4002); // ObjectAdded
    writer.writeUint16(0x4006); // DevicePropChanged  
    writer.writeUint16(0x400D); // CaptureComplete
    
    // Device properties supported
    writer.writeUint32(5); // count
    writer.writeUint16(DevicePropCode.BATTERY_LEVEL);
    writer.writeUint16(DevicePropCode.F_NUMBER);
    writer.writeUint16(DevicePropCode.EXPOSURE_TIME);
    writer.writeUint16(DevicePropCode.EXPOSURE_INDEX);
    writer.writeUint16(DevicePropCode.WHITE_BALANCE);
    
    // Capture formats
    writer.writeUint32(2); // count
    writer.writeUint16(0x3801); // JPEG
    writer.writeUint16(0x3811); // RAW
    
    // Image formats
    writer.writeUint32(2); // count
    writer.writeUint16(0x3801); // JPEG
    writer.writeUint16(0x3811); // RAW
    
    // Manufacturer
    writer.writeString('Sony Corporation');
    
    // Model
    writer.writeString('Mock Camera A7');
    
    // Device version
    writer.writeString('1.0.0');
    
    // Serial number
    writer.writeString('1234567890');
    
    return {
      responseCode: ResponseCode.OK,
      parameters: [],
      data: writer.getBuffer()
    };
  }
  
  private mockGetPropertyValue(propCode: number): PTPTransportResponse {
    const data = this.deviceProperties.get(propCode);
    
    if (!data) {
      return {
        responseCode: ResponseCode.DEVICE_PROP_NOT_SUPPORTED,
        parameters: []
      };
    }
    
    return {
      responseCode: ResponseCode.OK,
      parameters: [],
      data
    };
  }
  
  private mockSetPropertyValue(propCode: number, data: ArrayBuffer): PTPTransportResponse {
    this.deviceProperties.set(propCode, data);
    
    // Simulate property change event
    setTimeout(() => {
      this.fireEvent({
        eventCode: 0x4006, // DevicePropChanged
        sessionID: 1,
        transactionID: 0,
        parameters: [propCode]
      });
    }, 100);
    
    return {
      responseCode: ResponseCode.OK,
      parameters: []
    };
  }
  
  private mockInitiateCapture(parameters: number[]): PTPTransportResponse {
    // Simulate capture complete event after a delay
    setTimeout(() => {
      this.fireEvent({
        eventCode: 0x400D, // CaptureComplete
        sessionID: 1,
        transactionID: 0,
        parameters: [0x12345678] // Mock object handle
      });
    }, 500);
    
    return {
      responseCode: ResponseCode.OK,
      parameters: []
    };
  }
  
  private mockGetObjectHandles(): PTPTransportResponse {
    const writer = new BufferWriter();
    
    // Return 3 mock object handles
    writer.writeUint32(3); // count
    writer.writeUint32(0x00001001);
    writer.writeUint32(0x00001002);
    writer.writeUint32(0x00001003);
    
    return {
      responseCode: ResponseCode.OK,
      parameters: [],
      data: writer.getBuffer()
    };
  }
  
  private fireEvent(event: PTPEvent) {
    for (const callback of this.eventCallbacks) {
      callback(event);
    }
  }
}