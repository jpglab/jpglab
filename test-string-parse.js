// Test PTP string parsing
const hexData = "0d 44 00 53 00 43 00 30 00 30 00 30 00 31 00 32 00 2e 00 4a 00 50 00 47 00 00 00";

const bytes = hexData.split(' ').map(h => parseInt(h, 16));
const data = new Uint8Array(bytes);
const view = new DataView(data.buffer);

console.log("Testing PTP string parsing:");
console.log("===========================");
console.log("Raw hex:", hexData);
console.log("Total bytes:", data.length);

// Parse the string
const numChars = view.getUint8(0);
console.log("\nCharacter count (including null):", numChars);

// Method 1: Include null terminator
let withNull = '';
for (let i = 0; i < numChars; i++) {
    const charCode = view.getUint16(1 + i * 2, true);
    withNull += String.fromCharCode(charCode);
}
console.log(`String with null: "${withNull}" (length: ${withNull.length})`);
console.log("Last char code:", withNull.charCodeAt(withNull.length - 1));

// Method 2: Skip null terminator
let withoutNull = '';
for (let i = 0; i < numChars; i++) {
    const charCode = view.getUint16(1 + i * 2, true);
    if (charCode !== 0) {
        withoutNull += String.fromCharCode(charCode);
    }
}
console.log(`String without null: "${withoutNull}" (length: ${withoutNull.length})`);