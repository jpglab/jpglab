/**
 * Unified WebUSB API accessor
 * Works in both browser and Node.js environments
 */

let usbApiInstance: USB | null = null

export async function getUSBAPI(): Promise<USB> {
    if (usbApiInstance) {
        return usbApiInstance
    }

    // Check if we're in a browser environment
    if (isWebEnvironment()) {
        usbApiInstance = navigator.usb
        return usbApiInstance
    }

    // Node.js environment - use node-usb's WebUSB implementation
    const usb = await import('usb')
    usbApiInstance = usb.webusb
    return usbApiInstance
}

/**
 * Check if we're in a web browser environment
 */
export function isWebEnvironment(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator
}
