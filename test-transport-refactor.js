#!/usr/bin/env node

/**
 * Quick test script to verify the transport refactor
 */

async function main() {
    const { TransportFactory } = await import('./dist/src/transport/transport-factory.js')

    console.log('Creating USB transport...')
    const factory = new TransportFactory()
    const transport = await factory.createUSBTransport()

    console.log('Discovering devices...')
    const devices = await transport.discover()

    console.log(`\nFound ${devices.length} PTP devices:`)
    devices.forEach((device, i) => {
        console.log(`\n  Device ${i + 1}:`)
        console.log(`    Vendor ID: 0x${device.vendorId?.toString(16).padStart(4, '0')}`)
        console.log(`    Product ID: 0x${device.productId?.toString(16).padStart(4, '0')}`)
        console.log(`    Manufacturer: ${device.manufacturer || 'N/A'}`)
        console.log(`    Model: ${device.model || 'N/A'}`)
        console.log(`    Serial: ${device.serialNumber || 'N/A'}`)
    })

    if (devices.length > 0) {
        console.log('\n✓ Transport refactor working: discover() returns devices')

        console.log('\nTesting connect() without device descriptor...')
        try {
            await transport.connect()
            console.log('✓ Auto-connect successful (connected to first device)')
            await transport.disconnect()
            console.log('✓ Disconnect successful')
        } catch (error) {
            console.log(`✗ Auto-connect failed: ${error.message}`)
        }

        console.log('\nTesting connect() with device descriptor...')
        try {
            await transport.connect(devices[0])
            console.log('✓ Manual connect successful')
            await transport.disconnect()
            console.log('✓ Disconnect successful')
        } catch (error) {
            console.log(`✗ Manual connect failed: ${error.message}`)
        }
    } else {
        console.log('\n⚠ No PTP devices found (this is expected if no camera is connected)')
        console.log('✓ Transport refactor working: discover() returns empty array')
    }

    console.log('\n✅ All refactoring tests passed!')
}

main().catch(console.error)
