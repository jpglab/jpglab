// Browser polyfills for Node.js built-ins
import { Buffer } from 'buffer'
import process from 'process'

// Make Buffer and process available globally
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
    (window as any).process = process;
    (window as any).global = window;
}

// Export for use in modules
export { Buffer, process };