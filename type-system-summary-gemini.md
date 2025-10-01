# Summary of the Type System

Based on the files in `src/constants/**`, here are the key building blocks and assumptions of the system.

### Core Communication Model

*   **Command and Response:** The system is fundamentally based on a request-response model. The computer sends a **Command** (an "Operation") to the camera, and the camera sends back a **Response** indicating success or a specific error.
*   **Structured Messages:** All communication is wrapped in typed "containers." There are four types: one for sending commands, one for receiving responses, one for sending data, and one for receiving data. This ensures that both sides know how to interpret any message they receive.
*   **Transactions:** Every command-response pair is tracked with a unique Transaction ID, ensuring that responses can be correctly matched to the commands that initiated them.

### Key Concepts

*   **Operations:** These are the verbs of the system—the specific actions the camera can be asked to perform, like `OPEN_SESSION`, `GET_DEVICE_INFO`, or `TAKE_PICTURE`. Each operation has a unique numeric code.
*   **Data Flow with Operations:** An operation can involve a data transfer, but it's a one-way street per operation. An operation can either *send* a block of data to the camera (like setting a complex property) or *receive* a block of data from the camera (like getting device info or a photo), but a single operation cannot do both.
*   **Properties:** These represent the camera's settings, such as `APERTURE`, `ISO`, and `SHUTTER_SPEED`.
    *   **Abstraction:** A critical assumption is that the way a setting is represented for a human (e.g., shutter speed as "1/100s") is different from its raw binary representation sent to the camera. The system defines `encode` and `decode` functions to handle this translation automatically for each property.
    *   **Mutability:** Properties can be read-only or read-write.
    *   **Allowed Values:** The system knows what values are valid for a given property. A property's value can be a range (e.g., ISO 100-6400), an enumerated list (e.g., White Balance can be "Auto", "Daylight", "Cloudy"), or a single value.
*   **Events:** The camera can send messages to the computer without being asked. These "Events" are used to notify the computer of changes that happen on the camera, such as a property being changed manually by the user. This implies the system must be able to listen for these asynchronous notifications.
*   **Responses and Errors:** Every action results in a response code. This provides a standardized way to handle outcomes. Instead of generic failures, the camera can reply with highly specific codes like `DEVICE_BUSY`, `OBJECT_WRITE_PROTECTED`, or `SESSION_NOT_OPEN`.

### File and Storage Model

*   **Storage:** The camera's memory (internal or SD cards) is exposed as one or more "Storage" units. These can be of different types (e.g., fixed internal memory, removable memory card) and have different access levels (e.g., read-only, read-write).
*   **Objects and Handles:** Files and folders on the camera are not accessed by name. Instead, they are treated as generic "Objects." Each object is identified by a unique numeric "Handle."
*   **Formats:** Every object has a "Format" code that describes what it is, such as `EXIF_JPEG` (a JPEG image), `ASSOCIATION` (a folder), or `RAW` (a raw image file). This allows the system to know how to handle the object's data.
*   **Object Retrieval:** To download a file, you don't just ask for it by name. The process is to first get a list of all object handles, then ask for information about a specific handle to see what it is (e.g., its format and size), and finally request the actual object's data.

### Vendor Extensibility

*   **Standard Foundation (PTP):** The system is built on a generic standard called the Picture Transfer Protocol (PTP).
*   **Vendor-Specific Extensions:** The system is designed to be extended by camera manufacturers. Vendors, like Sony, can define their own custom operations, properties, events, and formats. These are identified by unique codes that are separate from the PTP standard, allowing for specialized features (like Sony's specific authentication handshake or live view modes) while still using the same core communication structure.
