import { SonyCamera } from './sony-camera'
import { USBTransport } from '@transport/usb/usb-transport'
import { Logger } from '@transport/usb/logger'

const logger = new Logger()
const transport = new USBTransport(logger)
const camera = new SonyCamera(transport, logger)

async function main() {
    await camera.connect()
    console.log('Camera connected successfully')
}

main()
