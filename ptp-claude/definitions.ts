/**
 * PTP Unified Definition System
 * 
 * This module provides a unified way to define PTP elements (operations, properties, events, responses)
 * with all their metadata and codecs in one place.
 */

import { PTPCodec, BufferReader, BufferWriter, DecodeResult } from './codec';
import { DatatypeCode, UINT16, UINT32 } from './basic-types';

// ============================================================================
// BASE DEFINITION INTERFACES
// ============================================================================

/**
 * Base definition for any PTP element
 */
export interface PTPDefinition {
  code: number;
  name: string;
  description?: string;
  vendor?: string;
}

/**
 * Parameter definition with inline codec
 */
export interface ParameterDef<T = any> {
  name: string;
  description?: string;
  codec: PTPCodec<T>;
  optional?: boolean;
  defaultValue?: T;
}

/**
 * Data phase definition
 */
export interface DataPhaseDef<T = any> {
  direction: 'in' | 'out';
  description?: string;
  codec: PTPCodec<T>;
}

// ============================================================================
// OPERATION DEFINITION
// ============================================================================

/**
 * Complete operation definition with all metadata and codecs
 */
export interface OperationDef extends PTPDefinition {
  code: number;
  name: string;
  description?: string;
  parameters?: ParameterDef[];
  dataPhase?: DataPhaseDef;
  responseParameters?: ParameterDef[];
  possibleResponses?: number[];
  
  // Helper methods
  encodeParameters?(params: Record<string, any>): UINT32[];
  decodeParameters?(values: UINT32[]): Record<string, any>;
  encodeData?(data: any): ArrayBuffer;
  decodeData?(buffer: ArrayBuffer): any;
}

// ============================================================================
// PROPERTY DEFINITION
// ============================================================================

/**
 * Complete device property definition with codec and metadata
 */
export interface PropertyDef<T = any> extends PTPDefinition {
  code: number;
  name: string;
  description?: string;
  codec: PTPCodec<T>;
  access: 'r' | 'rw';
  
  // Form constraints
  form?: {
    type: 'none' | 'range' | 'enum';
    values?: T[];  // For enum (can be EnumValue[] for semantic enums)
    min?: T;       // For range
    max?: T;       // For range
    step?: T;      // For range
  };
  
  // Helper methods
  encode?(value: T): ArrayBuffer;
  decode?(buffer: ArrayBuffer, offset?: number): DecodeResult<T>;
  validate?(value: T): boolean;
}

// ============================================================================
// EVENT DEFINITION
// ============================================================================

/**
 * Complete event definition with parameter codecs
 */
export interface EventDef extends PTPDefinition {
  code: number;
  name: string;
  description?: string;
  parameters?: ParameterDef[];
  
  // Helper methods
  decodeParameters?(values: UINT32[]): Record<string, any>;
}

// ============================================================================
// RESPONSE DEFINITION
// ============================================================================

/**
 * Complete response definition
 */
export interface ResponseDef extends PTPDefinition {
  code: number;
  name: string;
  description?: string;
  parameters?: ParameterDef[];
  isError: boolean;
  
  // Helper methods
  decodeParameters?(values: UINT32[]): Record<string, any>;
}

// ============================================================================
// DEFINITION SET
// ============================================================================

/**
 * A complete set of PTP definitions (standard or vendor)
 */
export interface PTPDefinitionSet {
  name: string;
  vendorExtensionID?: number;
  version?: string;
  
  operations: Map<number, OperationDef>;
  properties: Map<number, PropertyDef>;
  events: Map<number, EventDef>;
  responses: Map<number, ResponseDef>;
  
  // Helper methods
  getOperation(code: number): OperationDef | undefined;
  getProperty(code: number): PropertyDef | undefined;
  getEvent(code: number): EventDef | undefined;
  getResponse(code: number): ResponseDef | undefined;
}

// ============================================================================
// DEFINITION BUILDERS
// ============================================================================

/**
 * Builder for creating operation definitions
 */
export class OperationDefBuilder {
  private def: Partial<OperationDef> = {};
  
  code(value: number): this {
    this.def.code = value;
    return this;
  }
  
  name(value: string): this {
    this.def.name = value;
    return this;
  }
  
  description(value: string): this {
    this.def.description = value;
    return this;
  }
  
  parameter<T>(param: ParameterDef<T>): this {
    if (!this.def.parameters) this.def.parameters = [];
    this.def.parameters.push(param);
    return this;
  }
  
  dataPhase<T>(phase: DataPhaseDef<T>): this {
    this.def.dataPhase = phase;
    return this;
  }
  
  responseParameter<T>(param: ParameterDef<T>): this {
    if (!this.def.responseParameters) this.def.responseParameters = [];
    this.def.responseParameters.push(param);
    return this;
  }
  
  build(): OperationDef {
    if (!this.def.code || !this.def.name) {
      throw new Error('Operation definition requires code and name');
    }
    
    // Auto-generate encode/decode methods
    const def = this.def as OperationDef;
    
    if (def.parameters) {
      def.encodeParameters = (params: Record<string, any>) => {
        const result: UINT32[] = [];
        for (const paramDef of def.parameters!) {
          if (params[paramDef.name] !== undefined) {
            // Assuming parameters are always UINT32 for PTP operations
            result.push(params[paramDef.name]);
          } else if (!paramDef.optional) {
            throw new Error(`Missing required parameter: ${paramDef.name}`);
          }
        }
        return result;
      };
      
      def.decodeParameters = (values: UINT32[]) => {
        const result: Record<string, any> = {};
        def.parameters!.forEach((paramDef, index) => {
          if (index < values.length) {
            result[paramDef.name] = values[index];
          }
        });
        return result;
      };
    }
    
    if (def.dataPhase) {
      def.encodeData = (data: any) => def.dataPhase!.codec.encode(data);
      def.decodeData = (buffer: ArrayBuffer) => def.dataPhase!.codec.decode(buffer).value;
    }
    
    return def;
  }
}

/**
 * Builder for creating property definitions
 */
export class PropertyDefBuilder<T = any> {
  private def: Partial<PropertyDef<T>> = {};
  
  code(value: number): this {
    this.def.code = value;
    return this;
  }
  
  name(value: string): this {
    this.def.name = value;
    return this;
  }
  
  description(value: string): this {
    this.def.description = value;
    return this;
  }
  
  codec(value: PTPCodec<T>): this {
    this.def.codec = value;
    return this;
  }
  
  access(value: 'r' | 'rw'): this {
    this.def.access = value;
    return this;
  }
  
  enumValues(values: T[]): this {
    this.def.form = { type: 'enum', values };
    return this;
  }
  
  range(min: T, max: T, step?: T): this {
    this.def.form = { type: 'range', min, max, step };
    return this;
  }
  
  build(): PropertyDef<T> {
    if (!this.def.code || !this.def.name || !this.def.codec || !this.def.access) {
      throw new Error('Property definition requires code, name, codec, and access');
    }
    
    const def = this.def as PropertyDef<T>;
    
    // Auto-generate helper methods
    def.encode = (value: T) => def.codec.encode(value);
    def.decode = (buffer: ArrayBuffer, offset?: number) => def.codec.decode(buffer, offset);
    
    if (def.form) {
      def.validate = (value: T) => {
        if (!def.form) return true;
        
        if (def.form.type === 'enum' && def.form.values) {
          return def.form.values.includes(value);
        }
        
        if (def.form.type === 'range' && def.form.min !== undefined && def.form.max !== undefined) {
          return value >= def.form.min && value <= def.form.max;
        }
        
        return true;
      };
    }
    
    return def;
  }
}

/**
 * Builder for creating event definitions
 */
export class EventDefBuilder {
  private def: Partial<EventDef> = {};
  
  code(value: number): this {
    this.def.code = value;
    return this;
  }
  
  name(value: string): this {
    this.def.name = value;
    return this;
  }
  
  description(value: string): this {
    this.def.description = value;
    return this;
  }
  
  parameter<T>(param: ParameterDef<T>): this {
    if (!this.def.parameters) this.def.parameters = [];
    this.def.parameters.push(param);
    return this;
  }
  
  build(): EventDef {
    if (!this.def.code || !this.def.name) {
      throw new Error('Event definition requires code and name');
    }
    
    const def = this.def as EventDef;
    
    if (def.parameters) {
      def.decodeParameters = (values: UINT32[]) => {
        const result: Record<string, any> = {};
        def.parameters!.forEach((paramDef, index) => {
          if (index < values.length) {
            result[paramDef.name] = values[index];
          }
        });
        return result;
      };
    }
    
    return def;
  }
}

/**
 * Builder for creating response definitions
 */
export class ResponseDefBuilder {
  private def: Partial<ResponseDef> = {};
  
  code(value: number): this {
    this.def.code = value;
    return this;
  }
  
  name(value: string): this {
    this.def.name = value;
    return this;
  }
  
  description(value: string): this {
    this.def.description = value;
    return this;
  }
  
  isError(value: boolean): this {
    this.def.isError = value;
    return this;
  }
  
  parameter<T>(param: ParameterDef<T>): this {
    if (!this.def.parameters) this.def.parameters = [];
    this.def.parameters.push(param);
    return this;
  }
  
  build(): ResponseDef {
    if (this.def.code === undefined || !this.def.name || this.def.isError === undefined) {
      throw new Error('Response definition requires code, name, and isError');
    }
    
    const def = this.def as ResponseDef;
    
    if (def.parameters) {
      def.decodeParameters = (values: UINT32[]) => {
        const result: Record<string, any> = {};
        def.parameters!.forEach((paramDef, index) => {
          if (index < values.length) {
            result[paramDef.name] = values[index];
          }
        });
        return result;
      };
    }
    
    return def;
  }
}

// ============================================================================
// DEFINITION SET IMPLEMENTATION
// ============================================================================

/**
 * Default implementation of PTPDefinitionSet
 */
export class DefinitionSet implements PTPDefinitionSet {
  operations = new Map<number, OperationDef>();
  properties = new Map<number, PropertyDef>();
  events = new Map<number, EventDef>();
  responses = new Map<number, ResponseDef>();
  
  constructor(
    public name: string,
    public vendorExtensionID?: number,
    public version?: string
  ) {}
  
  getOperation(code: number): OperationDef | undefined {
    return this.operations.get(code);
  }
  
  getProperty(code: number): PropertyDef | undefined {
    return this.properties.get(code);
  }
  
  getEvent(code: number): EventDef | undefined {
    return this.events.get(code);
  }
  
  getResponse(code: number): ResponseDef | undefined {
    return this.responses.get(code);
  }
  
  // Builder methods for fluent API
  addOperation(def: OperationDef): this {
    this.operations.set(def.code, def);
    return this;
  }
  
  addProperty(def: PropertyDef): this {
    this.properties.set(def.code, def);
    return this;
  }
  
  addEvent(def: EventDef): this {
    this.events.set(def.code, def);
    return this;
  }
  
  addResponse(def: ResponseDef): this {
    this.responses.set(def.code, def);
    return this;
  }
  
  /**
   * Merge another definition set, optionally overriding existing definitions
   */
  merge(other: PTPDefinitionSet, override = false): this {
    for (const [code, def] of other.operations) {
      if (override || !this.operations.has(code)) {
        this.operations.set(code, def);
      }
    }
    
    for (const [code, def] of other.properties) {
      if (override || !this.properties.has(code)) {
        this.properties.set(code, def);
      }
    }
    
    for (const [code, def] of other.events) {
      if (override || !this.events.has(code)) {
        this.events.set(code, def);
      }
    }
    
    for (const [code, def] of other.responses) {
      if (override || !this.responses.has(code)) {
        this.responses.set(code, def);
      }
    }
    
    return this;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a parameter definition
 */
export function param<T>(
  name: string,
  codec: PTPCodec<T>,
  description?: string,
  optional = false
): ParameterDef<T> {
  return { name, codec, description, optional };
}

/**
 * Create a data phase definition
 */
export function dataPhase<T>(
  direction: 'in' | 'out',
  codec: PTPCodec<T>,
  description?: string
): DataPhaseDef<T> {
  return { direction, codec, description };
}

/**
 * Create builders
 */
export const operation = () => new OperationDefBuilder();
export const property = <T = any>() => new PropertyDefBuilder<T>();
export const event = () => new EventDefBuilder();
export const response = () => new ResponseDefBuilder();