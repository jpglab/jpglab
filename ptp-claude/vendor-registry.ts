/**
 * PTP Vendor Extension Registry
 * 
 * Manages vendor-specific PTP extensions and allows merging with standard definitions
 */

import { PTPDefinitionSet, DefinitionSet } from './definitions';
import { PTPStandard } from './ptp-standard';

// ============================================================================
// VENDOR EXTENSION IDS
// ============================================================================

/**
 * Known vendor extension IDs
 */
export enum VendorExtensionID {
  EASTMAN_KODAK = 0x00000001,
  SEIKO_EPSON = 0x00000002,
  AGILENT = 0x00000003,
  POLAROID = 0x00000004,
  AGFA_GEVAERT = 0x00000005,
  MICROSOFT = 0x00000006,
  EQUINOX = 0x00000007,
  VIEWQUEST = 0x00000008,
  STMICROELECTRONICS = 0x00000009,
  NIKON = 0x0000000A,
  CANON = 0x0000000B,
  FOTONATION = 0x0000000C,
  PENTAX = 0x0000000D,
  FUJI = 0x0000000E,
  SONY = 0x00000011,
  SAMSUNG = 0x0000001A,
  PARROT = 0x0000001B,
  PANASONIC = 0x0000001C
}

// ============================================================================
// VENDOR REGISTRY
// ============================================================================

/**
 * Registry for vendor extensions
 */
export class VendorRegistry {
  private vendors = new Map<number, PTPDefinitionSet>();
  private activeVendor?: number;
  private mergedDefinitions?: PTPDefinitionSet;
  
  constructor(private baseDefinitions: PTPDefinitionSet = PTPStandard) {}
  
  /**
   * Register a vendor extension
   */
  registerVendor(vendorId: number, definitions: PTPDefinitionSet) {
    this.vendors.set(vendorId, definitions);
    this.mergedDefinitions = undefined; // Clear cache
  }
  
  /**
   * Get vendor definitions
   */
  getVendor(vendorId: number): PTPDefinitionSet | undefined {
    return this.vendors.get(vendorId);
  }
  
  /**
   * Set the active vendor extension
   */
  setActiveVendor(vendorId: number | undefined) {
    this.activeVendor = vendorId;
    this.mergedDefinitions = undefined; // Clear cache
  }
  
  /**
   * Get the currently active vendor ID
   */
  getActiveVendor(): number | undefined {
    return this.activeVendor;
  }
  
  /**
   * Get merged definitions (base + active vendor)
   */
  getDefinitions(): PTPDefinitionSet {
    if (!this.mergedDefinitions) {
      this.mergedDefinitions = this.buildMergedDefinitions();
    }
    return this.mergedDefinitions;
  }
  
  /**
   * Build merged definition set
   */
  private buildMergedDefinitions(): PTPDefinitionSet {
    const merged = new DefinitionSet(
      'Merged Definitions',
      this.activeVendor,
      this.baseDefinitions.version
    );
    
    // Start with base definitions
    merged.merge(this.baseDefinitions);
    
    // Add vendor extensions if active
    if (this.activeVendor !== undefined) {
      const vendor = this.vendors.get(this.activeVendor);
      if (vendor) {
        // Vendor definitions override base definitions
        merged.merge(vendor, true);
      }
    }
    
    return merged;
  }
  
  /**
   * Check if a code is vendor-defined
   */
  isVendorDefined(code: number): boolean {
    return (code & 0x8000) !== 0;
  }
  
  /**
   * Get vendor-specific code range start
   */
  getVendorCodeBase(category: 'operation' | 'response' | 'event' | 'property' | 'format'): number {
    const bases = {
      operation: 0x9000,
      response: 0xA000,
      event: 0xC000,
      property: 0xD000,
      format: 0xB000
    };
    return bases[category];
  }
  
  /**
   * List all registered vendors
   */
  listVendors(): Array<{ id: number; name: string }> {
    const vendors: Array<{ id: number; name: string }> = [];
    
    for (const [id, defs] of this.vendors) {
      vendors.push({ id, name: defs.name });
    }
    
    return vendors;
  }
  
  /**
   * Clear vendor registry
   */
  clear() {
    this.vendors.clear();
    this.activeVendor = undefined;
    this.mergedDefinitions = undefined;
  }
  
  /**
   * Load vendor from module/file path (for dynamic loading)
   */
  async loadVendor(vendorId: number, modulePath: string): Promise<void> {
    try {
      const module = await import(modulePath);
      
      if (module.default && module.default instanceof DefinitionSet) {
        this.registerVendor(vendorId, module.default);
      } else if (module.vendorDefinitions) {
        this.registerVendor(vendorId, module.vendorDefinitions);
      } else {
        throw new Error(`Module ${modulePath} does not export valid vendor definitions`);
      }
    } catch (error) {
      throw new Error(`Failed to load vendor module ${modulePath}: ${error}`);
    }
  }
}

// ============================================================================
// GLOBAL REGISTRY
// ============================================================================

/**
 * Global vendor registry instance
 */
export const globalRegistry = new VendorRegistry();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get vendor name from ID
 */
export function getVendorName(vendorId: number): string {
  const vendorNames: Record<number, string> = {
    [VendorExtensionID.EASTMAN_KODAK]: 'Eastman Kodak',
    [VendorExtensionID.SEIKO_EPSON]: 'Seiko Epson',
    [VendorExtensionID.AGILENT]: 'Agilent',
    [VendorExtensionID.POLAROID]: 'Polaroid',
    [VendorExtensionID.AGFA_GEVAERT]: 'Agfa-Gevaert',
    [VendorExtensionID.MICROSOFT]: 'Microsoft',
    [VendorExtensionID.EQUINOX]: 'Equinox',
    [VendorExtensionID.VIEWQUEST]: 'ViewQuest',
    [VendorExtensionID.STMICROELECTRONICS]: 'STMicroelectronics',
    [VendorExtensionID.NIKON]: 'Nikon',
    [VendorExtensionID.CANON]: 'Canon',
    [VendorExtensionID.FOTONATION]: 'FotoNation',
    [VendorExtensionID.PENTAX]: 'Pentax',
    [VendorExtensionID.FUJI]: 'Fuji',
    [VendorExtensionID.SONY]: 'Sony',
    [VendorExtensionID.SAMSUNG]: 'Samsung',
    [VendorExtensionID.PARROT]: 'Parrot',
    [VendorExtensionID.PANASONIC]: 'Panasonic'
  };
  
  return vendorNames[vendorId] || `Vendor 0x${vendorId.toString(16).padStart(8, '0')}`;
}

/**
 * Create vendor-specific code
 */
export function makeVendorCode(baseCode: number, offset: number): number {
  return (baseCode & 0xF000) | 0x8000 | (offset & 0x0FFF);
}