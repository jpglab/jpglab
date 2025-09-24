// Analyzing the ObjectInfo raw data from Sony camera
const hexData = "00 00 01 00 01 38 00 00 ae 52 aa 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 0d 44 00 53 00 43 00 30 00 30 00 30 00 31 00 32 00 2e 00 4a 00 50 00 47 00 00 00 00";

const bytes = hexData.split(' ').map(h => parseInt(h, 16));
const data = new Uint8Array(bytes);
const view = new DataView(data.buffer);

console.log("Total data length:", data.length, "bytes\n");

let offset = 0;

// Parse according to PTP ObjectInfo specification
console.log("Field breakdown:");
console.log("================");

// 1. StorageID (UINT32)
const storageId = view.getUint32(offset, true);
console.log(`Offset ${offset}: StorageID = 0x${storageId.toString(16).padStart(8, '0')}`);
offset += 4;

// 2. ObjectFormat (UINT16)
const objectFormat = view.getUint16(offset, true);
console.log(`Offset ${offset}: ObjectFormat = 0x${objectFormat.toString(16).padStart(4, '0')} (${objectFormat === 0x3801 ? 'EXIF_JPEG' : 'Unknown'})`);
offset += 2;

// 3. ProtectionStatus (UINT16)
const protectionStatus = view.getUint16(offset, true);
console.log(`Offset ${offset}: ProtectionStatus = 0x${protectionStatus.toString(16).padStart(4, '0')} (${protectionStatus === 0 ? 'No protection' : 'Protected'})`);
offset += 2;

// 4. ObjectCompressedSize (UINT32)
const objectCompressedSize = view.getUint32(offset, true);
console.log(`Offset ${offset}: ObjectCompressedSize = ${objectCompressedSize} bytes (0x${objectCompressedSize.toString(16)})`);
offset += 4;

// 5. ThumbFormat (UINT16)
const thumbFormat = view.getUint16(offset, true);
console.log(`Offset ${offset}: ThumbFormat = 0x${thumbFormat.toString(16).padStart(4, '0')}`);
offset += 2;

// 6. ThumbCompressedSize (UINT32)
const thumbCompressedSize = view.getUint32(offset, true);
console.log(`Offset ${offset}: ThumbCompressedSize = ${thumbCompressedSize} bytes`);
offset += 4;

// 7. ThumbPixWidth (UINT32)
const thumbPixWidth = view.getUint32(offset, true);
console.log(`Offset ${offset}: ThumbPixWidth = ${thumbPixWidth}`);
offset += 4;

// 8. ThumbPixHeight (UINT32)
const thumbPixHeight = view.getUint32(offset, true);
console.log(`Offset ${offset}: ThumbPixHeight = ${thumbPixHeight}`);
offset += 4;

// 9. ImagePixWidth (UINT32)
const imagePixWidth = view.getUint32(offset, true);
console.log(`Offset ${offset}: ImagePixWidth = ${imagePixWidth}`);
offset += 4;

// 10. ImagePixHeight (UINT32)
const imagePixHeight = view.getUint32(offset, true);
console.log(`Offset ${offset}: ImagePixHeight = ${imagePixHeight}`);
offset += 4;

// 11. ImageBitDepth (UINT32)
const imageBitDepth = view.getUint32(offset, true);
console.log(`Offset ${offset}: ImageBitDepth = ${imageBitDepth}`);
offset += 4;

// 12. ParentObject (UINT32)
const parentObject = view.getUint32(offset, true);
console.log(`Offset ${offset}: ParentObject = 0x${parentObject.toString(16).padStart(8, '0')}`);
offset += 4;

// 13. AssociationType (UINT16)
const associationType = view.getUint16(offset, true);
console.log(`Offset ${offset}: AssociationType = 0x${associationType.toString(16).padStart(4, '0')}`);
offset += 2;

// 14. AssociationDesc (UINT32)
const associationDesc = view.getUint32(offset, true);
console.log(`Offset ${offset}: AssociationDesc = 0x${associationDesc.toString(16).padStart(8, '0')}`);
offset += 4;

// 15. SequenceNumber (UINT32)
const sequenceNumber = view.getUint32(offset, true);
console.log(`Offset ${offset}: SequenceNumber = ${sequenceNumber}`);
offset += 4;

console.log(`\nCurrent offset: ${offset}, Remaining bytes: ${data.length - offset}`);

// 16. Filename (String)
if (offset < data.length) {
    const numChars = view.getUint8(offset);
    console.log(`Offset ${offset}: Filename length = ${numChars} characters`);
    offset += 1;
    
    let filename = '';
    for (let i = 0; i < numChars && offset + i * 2 < data.length; i++) {
        const char = view.getUint16(offset + i * 2, true);
        filename += String.fromCharCode(char);
    }
    console.log(`Filename = "${filename}"`);
    offset += numChars * 2;
}

console.log(`\nFinal offset: ${offset}, Total data: ${data.length} bytes`);
console.log(`Missing bytes for full ObjectInfo: ${offset < data.length ? 0 : 'Data ends here, no date fields'}`);