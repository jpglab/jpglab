import { SonyCamera } from '@camera/sony-camera'
import { Logger } from '@core/logger'
import { USBTransport } from '@transport/usb/usb-transport'
import { sonyOperationDefinitions } from '@ptp/definitions/vendors/sony/sony-operation-definitions'
import { operationDefinitions as standardOperationDefinitions } from '@ptp/definitions/operation-definitions'

const mergedOperationDefinitions = [...standardOperationDefinitions, ...sonyOperationDefinitions] as const

const logger = new Logger<typeof mergedOperationDefinitions>()
const transport = new USBTransport(logger)
const camera = new SonyCamera(transport, logger)

async function main() {
    await camera.connect()

    // test sony ext-device-prop-info dataset
    const iso = await camera.get('Iso')
    console.log('ISO:', iso)
    const shutterSpeed = await camera.get('ShutterSpeed')
    console.log('Shutter Speed:', shutterSpeed)
    const aperture = await camera.get('Aperture')
    console.log('Exposure:', aperture)

    // test device-info dataset
    const deviceInfo = await camera.send('GetDeviceInfo', {})
    console.log('Device Info:', deviceInfo)

    // // enable live view
    // await camera.set('SetLiveViewEnable', 'ENABLE')

    // // test object-info dataset
    // const objectInfo = await camera.send('GetObjectInfo', {
    //     // this is the liveview dataset
    //     ObjectHandle: 0xffffc002,
    // })

    // // test storage-info dataset
    // const storageInfo = await camera.send('GetStorageInfo', {
    //     StorageID: 0x00000001,
    // })

    await camera.disconnect()
}

main().catch(console.error)
