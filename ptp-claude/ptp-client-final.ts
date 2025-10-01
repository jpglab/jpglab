/**
 * Final Type-Safe PTP Client
 * 
 * Provides full intellisense without duplication by extracting types from definitions
 */

import { 
  PTPDefinitionSet, 
  PropertyDef, 
  OperationDef,
  EventDef,
  ResponseDef 
} from './definitions';
import { PTPStandardInline } from './ptp-standard-inline';
import { globalRegistry } from './vendor-registry';
import { OperationCode } from './operations';
import { ResponseCode } from './responses';
import { EnumValue, EnumCodec } from './enum-codec';

// ============================================================================
// TRANSPORT INTERFACE
// ============================================================================

export interface PTPTransport {
  sendOperation(
    operationCode: number,
    parameters: number[],
    data?: ArrayBuffer
  ): Promise<PTPTransportResponse>;
  
  onEvent(callback: (event: PTPEvent) => void): void;
  open(): Promise<void>;
  close(): Promise<void>;
}

export interface PTPTransportResponse {
  responseCode: number;
  parameters: number[];
  data?: ArrayBuffer;
}

export interface PTPEvent {
  eventCode: number;
  sessionID: number;
  transactionID: number;
  parameters: number[];
}

// ============================================================================
// TYPE EXTRACTION FROM DEFINITIONS
// ============================================================================

/**
 * Extract all property definitions as a union type
 */
type PropertiesOf<D extends PTPDefinitionSet> = D['properties'] extends Map<any, infer P> ? P : never;

/**
 * Extract all operation definitions as a union type
 */
type OperationsOf<D extends PTPDefinitionSet> = D['operations'] extends Map<any, infer O> ? O : never;

/**
 * Extract property names as string literals
 */
type PropertyNamesOf<D extends PTPDefinitionSet> = PropertiesOf<D>['name'];

/**
 * Extract operation names as string literals
 */
type OperationNamesOf<D extends PTPDefinitionSet> = OperationsOf<D>['name'];

/**
 * Get property definition by name
 */
type GetProperty<D extends PTPDefinitionSet, N extends PropertyNamesOf<D>> = 
  Extract<PropertiesOf<D>, { name: N }>;

/**
 * Get operation definition by name
 */
type GetOperation<D extends PTPDefinitionSet, N extends OperationNamesOf<D>> = 
  Extract<OperationsOf<D>, { name: N }>;

/**
 * Extract codec value type from property
 */
type PropertyValueType<P extends PropertyDef> = 
  P['codec'] extends { decode: (buffer: any) => { value: infer V } } ? V : never;

/**
 * Extract parameter type from operation
 */
type OperationParamsType<O extends OperationDef> = 
  O['encodeParameters'] extends (params: infer P) => any ? P : void;

/**
 * Extract result type from operation
 */
type OperationResultType<O extends OperationDef> = 
  O['decodeData'] extends (buffer: any) => infer R ? R :
  O['decodeParameters'] extends (params: any) => infer R ? R : 
  void;

/**
 * For enum properties, extract the valid string values
 */
type EnumStringValues<P extends PropertyDef> = 
  P['codec'] extends EnumCodec<any> 
    ? P['form'] extends { values?: Array<EnumValue<any>> }
      ? P['form']['values'][number]['label']
      : string
    : never;

// ============================================================================
// TYPE-SAFE CLIENT WITH FULL INTELLISENSE
// ============================================================================

/**
 * Type-safe PTP client with intellisense for property/operation names and values
 */
export class PTPClient<D extends PTPDefinitionSet = typeof PTPStandardInline> {
  private sessionID?: number;
  private transactionID: number = 1;
  
  constructor(
    private transport: PTPTransport,
    private definitions: D = PTPStandardInline as D
  ) {}
  
  // ==========================================================================
  // CONNECTION
  // ==========================================================================
  
  async connect(): Promise<void> {
    await this.transport.open();
    
    // Get device info
    const deviceInfo = await this.operation('GetDeviceInfo' as OperationNamesOf<D>);
    
    // Set active vendor if found
    if (deviceInfo?.vendorExtensionID) {
      globalRegistry.setActiveVendor(deviceInfo.vendorExtensionID);
      this.definitions = globalRegistry.getDefinitions() as D;
    }
    
    // Open session
    this.sessionID = Math.floor(Math.random() * 0xFFFFFFF) + 1;
    // @ts-ignore - OpenSession might not exist in all definition sets
    await this.operation('OpenSession' as OperationNamesOf<D>, { sessionID: this.sessionID });
  }
  
  async disconnect(): Promise<void> {
    if (this.sessionID) {
      // @ts-ignore - CloseSession might not exist in all definition sets  
      await this.operation('CloseSession' as OperationNamesOf<D>);
    }
    await this.transport.close();
  }
  
  // ==========================================================================
  // TYPE-SAFE PROPERTY ACCESS WITH INTELLISENSE
  // ==========================================================================
  
  /**
   * Get a property value with full type safety and intellisense
   */
  async get<N extends PropertyNamesOf<D>>(
    propertyName: N
  ): Promise<PropertyValueType<GetProperty<D, N>>> {
    const property = this.findProperty(propertyName as string);
    if (!property) {
      throw new Error(`Unknown property: ${propertyName}`);
    }
    
    const response = await this.transport.sendOperation(
      OperationCode.GET_DEVICE_PROP_VALUE,
      [property.code]
    );
    
    if (response.responseCode !== ResponseCode.OK) {
      throw new Error(`Failed to get property ${propertyName}`);
    }
    
    if (!response.data) {
      throw new Error(`No data returned for property ${propertyName}`);
    }
    
    const decoded = property.codec.decode(response.data);
    return decoded.value;
  }
  
  /**
   * Set a property value with full type safety and intellisense
   * 
   * For enum properties, accepts either the EnumValue or string label
   */
  async set<N extends PropertyNamesOf<D>>(
    propertyName: N,
    value: PropertyValueType<GetProperty<D, N>> | EnumStringValues<GetProperty<D, N>>
  ): Promise<void> {
    const property = this.findProperty(propertyName as string);
    if (!property) {
      throw new Error(`Unknown property: ${propertyName}`);
    }
    
    if (property.access === 'r') {
      throw new Error(`Property ${propertyName} is read-only`);
    }
    
    // Handle string values for enum properties
    let actualValue = value;
    if (typeof value === 'string' && property.codec instanceof EnumCodec) {
      // Codec will handle the string conversion
      actualValue = value;
    }
    
    if (property.validate && !property.validate(actualValue)) {
      throw new Error(`Invalid value for property ${propertyName}: ${value}`);
    }
    
    const encoded = property.codec.encode(actualValue);
    
    const response = await this.transport.sendOperation(
      OperationCode.SET_DEVICE_PROP_VALUE,
      [property.code],
      encoded
    );
    
    if (response.responseCode !== ResponseCode.OK) {
      throw new Error(`Failed to set property ${propertyName}`);
    }
  }
  
  // ==========================================================================
  // TYPE-SAFE OPERATION EXECUTION WITH INTELLISENSE
  // ==========================================================================
  
  /**
   * Execute an operation with full type safety and intellisense
   */
  async operation<N extends OperationNamesOf<D>>(
    operationName: N,
    ...args: OperationParamsType<GetOperation<D, N>> extends void 
      ? [] 
      : [OperationParamsType<GetOperation<D, N>>]
  ): Promise<OperationResultType<GetOperation<D, N>>> {
    const operation = this.findOperation(operationName as string);
    if (!operation) {
      throw new Error(`Unknown operation: ${operationName}`);
    }
    
    const params = args[0];
    const encodedParams = operation.encodeParameters?.(params || {}) || [];
    
    const response = await this.transport.sendOperation(
      operation.code,
      encodedParams
    );
    
    if (response.responseCode !== ResponseCode.OK) {
      const responseDef = this.findResponse(response.responseCode);
      throw new Error(
        responseDef 
          ? `${responseDef.name}: ${responseDef.description}` 
          : `PTP Error: 0x${response.responseCode.toString(16)}`
      );
    }
    
    if (response.data && operation.decodeData) {
      return operation.decodeData(response.data);
    }
    
    if (response.parameters.length > 0 && operation.decodeParameters) {
      return operation.decodeParameters(response.parameters);
    }
    
    return undefined as any;
  }
  
  // ==========================================================================
  // EVENT HANDLING
  // ==========================================================================
  
  onEvent(callback: (eventName: string, params: any) => void): void {
    this.transport.onEvent((event) => {
      const eventDef = this.findEvent(event.eventCode);
      
      if (eventDef) {
        const params = eventDef.decodeParameters?.(event.parameters) || {};
        callback(eventDef.name, params);
      } else {
        callback(`UnknownEvent_0x${event.eventCode.toString(16)}`, {
          parameters: event.parameters
        });
      }
    });
  }
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  private findProperty(name: string): PropertyDef | undefined {
    return Array.from(this.definitions.properties.values())
      .find(p => p.name === name);
  }
  
  private findOperation(name: string): OperationDef | undefined {
    return Array.from(this.definitions.operations.values())
      .find(o => o.name === name);
  }
  
  private findEvent(code: number): EventDef | undefined {
    return this.definitions.events.get(code);
  }
  
  private findResponse(code: number): ResponseDef | undefined {
    return this.definitions.responses.get(code);
  }
}

// ============================================================================
// PROPERTY/OPERATION NAME CONSTANTS FOR CONVENIENCE
// ============================================================================

/**
 * Standard property names extracted from PTPStandardInline
 * These provide better intellisense than strings
 */
export const Props = {
  BatteryLevel: 'BatteryLevel',
  FNumber: 'FNumber',
  FocalLength: 'FocalLength',
  WhiteBalance: 'WhiteBalance',
  FocusMode: 'FocusMode',
  ExposureMeteringMode: 'ExposureMeteringMode',
  FlashMode: 'FlashMode',
  ExposureTime: 'ExposureTime',
  ExposureProgramMode: 'ExposureProgramMode',
  ExposureIndex: 'ExposureIndex',
  ExposureBiasCompensation: 'ExposureBiasCompensation',
  DateTime: 'DateTime',
  StillCaptureMode: 'StillCaptureMode',
  DigitalZoom: 'DigitalZoom'
} as const;

/**
 * Standard operation names
 */
export const Ops = {
  GetDeviceInfo: 'GetDeviceInfo',
  OpenSession: 'OpenSession',
  CloseSession: 'CloseSession',
  GetStorageInfo: 'GetStorageInfo',
  GetObjectHandles: 'GetObjectHandles',
  GetObjectInfo: 'GetObjectInfo',
  GetObject: 'GetObject',
  InitiateCapture: 'InitiateCapture'
} as const;

/**
 * White balance values for convenience
 */
export const WhiteBalanceValues = {
  UNDEFINED: 'UNDEFINED',
  MANUAL: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC',
  ONE_PUSH_AUTOMATIC: 'ONE_PUSH_AUTOMATIC',
  DAYLIGHT: 'DAYLIGHT',
  FLUORESCENT: 'FLUORESCENT',
  TUNGSTEN: 'TUNGSTEN',
  FLASH: 'FLASH'
} as const;

/**
 * Focus mode values
 */
export const FocusModeValues = {
  UNDEFINED: 'UNDEFINED',
  MANUAL: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC',
  AUTOMATIC_MACRO: 'AUTOMATIC_MACRO'
} as const;

/**
 * Flash mode values  
 */
export const FlashModeValues = {
  UNDEFINED: 'UNDEFINED',
  AUTO_FLASH: 'AUTO_FLASH',
  FLASH_OFF: 'FLASH_OFF',
  FILL_FLASH: 'FILL_FLASH',
  RED_EYE_AUTO: 'RED_EYE_AUTO',
  RED_EYE_FILL: 'RED_EYE_FILL',
  EXTERNAL_SYNC: 'EXTERNAL_SYNC'
} as const;