import { describe, it, expect, afterAll } from 'vitest'
import { GenericCamera } from '../src/camera/generic-camera'
import { TransportFactory } from '@transport/transport-factory'
import { TransportInterface } from '@transport/interfaces/transport.interface'
import { Logger } from '@transport/usb/logger'

describe('GenericCamera', () => {
    let transport: TransportInterface
    let camera: GenericCamera
    let logger: Logger

    afterAll(async () => {
        if (camera && transport && transport.isConnected()) {
            try {
                await Promise.race([
                    camera.disconnect(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 2000))
                ])
            } catch (e) {
                // Ignore disconnect errors
            }
        }
    })

    it('should connect to USB transport and camera', async () => {
        const transportFactory = new TransportFactory()
        transport = await transportFactory.createUSBTransport()

        logger = new Logger()
        camera = new GenericCamera(transport, logger)

        await camera.connect({ vendorId: 0, productId: 0 })
        console.log('✅ Camera connected')

        expect(transport.isConnected()).toBe(true)
        expect(camera.sessionId).toBeTruthy()
    })

    it('should disconnect and reconnect', async () => {
        await camera.disconnect()
        expect(camera.sessionId).toBeNull()
        console.log('✅ Camera disconnected')

        await camera.connect({ vendorId: 0, productId: 0 })
        expect(camera.sessionId).toBeTruthy()
        console.log('✅ Camera reconnected')
    })

    it('should handle final disconnection', async () => {
        await camera.disconnect()
        expect(camera.sessionId).toBeNull()
        console.log('✅ Camera disconnected')

        expect(transport.isConnected()).toBe(false)
        console.log('✅ Transport disconnected')
    })
})
