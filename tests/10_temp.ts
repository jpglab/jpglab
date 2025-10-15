import { Camera } from '@camera/index'
import { Logger } from '@core/logger'
import { VendorIDs } from '@ptp/definitions/vendor-ids'
import { USBTransport } from '@transport/usb/usb-transport'

const logger = new Logger({showDecodedData: true, showEncodedData: true, collapseUSB: false})
const transport = new USBTransport(logger)
const camera = new Camera(VendorIDs.SONY, transport, logger)

await camera.connect()

await camera.captureImage()

await camera.disconnect()
