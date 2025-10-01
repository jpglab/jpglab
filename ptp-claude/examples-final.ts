/**
 * Final PTP Client Examples with Full Intellisense
 * 
 * Demonstrates type safety and intellisense without duplication
 */

import { 
  PTPClient, 
  Props, 
  Ops,
  WhiteBalanceValues,
  FocusModeValues,
  FlashModeValues
} from './ptp-client-final';
import { MockPTPTransport } from './transport-mock';
import { PTPStandardInline } from './ptp-standard-inline';

// ============================================================================
// EXAMPLE 1: FULL INTELLISENSE FOR PROPERTY NAMES
// ============================================================================

async function propertyIntellisense() {
  console.log('\n=== Property Intellisense ===\n');
  
  const transport = new MockPTPTransport();
  const client = new PTPClient(transport, PTPStandardInline);
  
  await client.connect();
  
  // ✅ Intellisense shows all available properties when typing!
  await client.get('BatteryLevel');     // <- IDE shows: BatteryLevel, FNumber, WhiteBalance, etc.
  await client.get('FNumber');          
  await client.get('WhiteBalance');
  
  // ✅ Return types are correctly inferred
  const battery = await client.get('BatteryLevel');  // number
  const wb = await client.get('WhiteBalance');       // EnumValue
  const fNumber = await client.get('FNumber');       // number
  
  console.log(`Battery: ${battery}%`);
  console.log(`White Balance: ${wb.label}`);
  console.log(`Aperture: f/${fNumber}`);
  
  // ❌ Invalid property names are caught at compile time
  // @ts-expect-error - Invalid property name
  await client.get('InvalidProperty');  // Error: Argument of type '"InvalidProperty"' is not assignable
  
  await client.disconnect();
}

// ============================================================================
// EXAMPLE 2: INTELLISENSE FOR PROPERTY VALUES
// ============================================================================

async function valueIntellisense() {
  console.log('\n=== Value Intellisense ===\n');
  
  const transport = new MockPTPTransport();
  const client = new PTPClient(transport, PTPStandardInline);
  
  await client.connect();
  
  // ✅ For enum properties, intellisense shows valid string values!
  await client.set('WhiteBalance', 'DAYLIGHT');      // <- IDE suggests: DAYLIGHT, FLUORESCENT, etc.
  await client.set('WhiteBalance', 'TUNGSTEN');
  await client.set('WhiteBalance', WhiteBalanceValues.FLASH);  // Or use constant
  
  // ✅ For numeric properties, type checking works
  await client.set('ExposureIndex', 800);        // ✓ number required
  await client.set('FNumber', 5.6);              // ✓ number required
  await client.set('ExposureTime', 1/250);       // ✓ number required
  
  // ❌ Wrong types are caught at compile time
  // @ts-expect-error - Wrong type
  await client.set('ExposureIndex', '800');      // Error: string not assignable to number
  
  // @ts-expect-error - Invalid enum value
  await client.set('WhiteBalance', 'INVALID');   // Error: not a valid WhiteBalance value
  
  await client.disconnect();
}

// ============================================================================
// EXAMPLE 3: OPERATION INTELLISENSE
// ============================================================================

async function operationIntellisense() {
  console.log('\n=== Operation Intellisense ===\n');
  
  const transport = new MockPTPTransport();
  const client = new PTPClient(transport, PTPStandardInline);
  
  await client.connect();
  
  // ✅ Intellisense shows available operations
  await client.operation('GetDeviceInfo');       // <- IDE shows all operations
  await client.operation('InitiateCapture', {    // <- Parameters are typed!
    storageID: 0x00000000,
    objectFormatCode: 0x3801
  });
  
  // ✅ Return types are inferred
  const deviceInfo = await client.operation('GetDeviceInfo');  // Returns device info structure
  const handles = await client.operation('GetObjectHandles', {
    storageID: 0xFFFFFFFF
  });  // Returns number[]
  
  console.log('Device:', deviceInfo.manufacturer);
  console.log(`Found ${handles.length} objects`);
  
  // ❌ Invalid operations caught at compile time
  // @ts-expect-error - Invalid operation
  await client.operation('InvalidOperation');
  
  await client.disconnect();
}

// ============================================================================
// EXAMPLE 4: USING HELPER CONSTANTS
// ============================================================================

async function usingHelpers() {
  console.log('\n=== Using Helper Constants ===\n');
  
  const transport = new MockPTPTransport();
  const client = new PTPClient(transport, PTPStandardInline);
  
  await client.connect();
  
  // ✅ Use Props constant for better intellisense
  await client.get(Props.BatteryLevel);          // Even better intellisense!
  await client.get(Props.WhiteBalance);
  await client.set(Props.FNumber, 2.8);
  
  // ✅ Use enum value constants
  await client.set(Props.WhiteBalance, WhiteBalanceValues.DAYLIGHT);
  await client.set(Props.FocusMode, FocusModeValues.AUTOMATIC);
  await client.set(Props.FlashMode, FlashModeValues.FILL_FLASH);
  
  // ✅ Use Ops constant for operations
  await client.operation(Ops.GetDeviceInfo);
  await client.operation(Ops.InitiateCapture, {
    storageID: 0x00000000
  });
  
  console.log('✓ All operations completed with full type safety');
  
  await client.disconnect();
}

// ============================================================================
// EXAMPLE 5: VALIDATION STILL WORKS
// ============================================================================

async function validation() {
  console.log('\n=== Validation ===\n');
  
  const transport = new MockPTPTransport();
  const client = new PTPClient(transport, PTPStandardInline);
  
  await client.connect();
  
  // ✅ Valid values work
  await client.set('FNumber', 2.8);
  console.log('✓ Valid f-stop: f/2.8');
  
  // ❌ Invalid values caught by codec at runtime
  try {
    await client.set('FNumber', 3.7);  // Not a standard f-stop
  } catch (error) {
    console.log(`❌ Invalid f-stop: ${error.message}`);
  }
  
  // ❌ Read-only properties protected
  try {
    await client.set('BatteryLevel', 100);
  } catch (error) {
    console.log(`❌ Read-only: ${error.message}`);
  }
  
  await client.disconnect();
}

// ============================================================================
// EXAMPLE 6: COMPLETE WORKFLOW
// ============================================================================

async function completeWorkflow() {
  console.log('\n=== Complete Workflow ===\n');
  
  const transport = new MockPTPTransport();
  const client = new PTPClient(transport, PTPStandardInline);
  
  await client.connect();
  
  // Get device info
  const info = await client.operation('GetDeviceInfo');
  console.log(`📷 Connected to ${info.manufacturer} ${info.model}`);
  
  // Check battery
  const battery = await client.get('BatteryLevel');
  console.log(`🔋 Battery: ${battery}%`);
  
  // Configure camera settings
  await client.set('ExposureIndex', 400);        // ISO
  await client.set('FNumber', 5.6);              // Aperture
  await client.set('ExposureTime', 1/250);       // Shutter
  await client.set('WhiteBalance', 'DAYLIGHT');  // WB
  console.log('⚙️  Settings configured');
  
  // Take a photo
  await client.operation('InitiateCapture', {
    storageID: 0x00000000,
    objectFormatCode: 0x3801  // JPEG
  });
  console.log('📸 Photo captured!');
  
  // Get photos
  const handles = await client.operation('GetObjectHandles', {
    storageID: 0xFFFFFFFF,
    objectFormatCode: 0x3801
  });
  console.log(`📁 ${handles.length} photos on camera`);
  
  await client.disconnect();
  console.log('✅ Workflow complete');
}

// ============================================================================
// KEY BENEFITS
// ============================================================================

function showBenefits() {
  console.log('\n=== Key Benefits ===\n');
  
  console.log('✅ FULL INTELLISENSE:');
  console.log('  • Property names autocomplete');
  console.log('  • Property values are type-checked');
  console.log('  • Enum values show valid options');
  console.log('  • Operation parameters are typed');
  
  console.log('\n✅ NO DUPLICATION:');
  console.log('  • Properties defined once in ptp-standard-inline.ts');
  console.log('  • Client extracts types from definitions');
  console.log('  • No redundant registry classes');
  
  console.log('\n✅ TYPE SAFETY:');
  console.log('  • Invalid property names caught at compile time');
  console.log('  • Wrong value types caught at compile time');
  console.log('  • Invalid enum values caught');
  
  console.log('\n✅ RUNTIME VALIDATION:');
  console.log('  • Codecs validate values (f-stops, shutter speeds)');
  console.log('  • Read-only properties protected');
  console.log('  • Graceful error handling');
}

// ============================================================================
// RUN ALL
// ============================================================================

async function runAll() {
  try {
    await propertyIntellisense();
    await valueIntellisense();
    await operationIntellisense();
    await usingHelpers();
    await validation();
    await completeWorkflow();
    showBenefits();
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Uncomment to run:
// runAll();

export {
  propertyIntellisense,
  valueIntellisense,
  operationIntellisense,
  usingHelpers,
  validation,
  completeWorkflow,
  showBenefits
};