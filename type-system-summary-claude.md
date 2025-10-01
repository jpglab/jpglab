# PTP Camera Control System - Type System Summary

## Core Communication Model

**Operations are request-response transactions.** Every operation has a unique hex code and follows a strict pattern - you send an operation request and receive a response code indicating success or failure. Operations can optionally include parameters, expect data to be sent to the camera, or expect data back from the camera, but never both sending and receiving data in the same operation.

**Sessions must be established before most operations.** The system requires opening a session with a unique session ID before performing camera operations. Only certain operations like getting device info can be performed outside a session.

**Every transaction has a unique ID.** Operations are tracked with transaction IDs to maintain state and ensure proper sequencing of commands.

## Data Type System

**All data exchanged uses strongly-typed PTP data types.** The system supports primitive types (various sized integers), arrays of primitives, and strings. Every parameter, property value, and data payload must conform to one of these predefined types.

**Parameters are strictly typed and ordered.** Each operation parameter has a specific data type, position in the parameter list, and defined purpose. Parameters can have predefined possible values that constrain what can be sent.

## Property Management

**Properties have multiple layers of constraints.** Camera properties aren't just values - they have data types, units, read/write permissions, and can be constrained by descriptors that define allowed values through either ranges (min/max/step) or enumerated lists.

**Properties require encoding and decoding.** Raw hex values from the camera must be decoded into human-readable formats (like "f/2.8" for aperture or "1/250" for shutter speed), and user inputs must be encoded back to the camera's expected hex format.

**Property changes can cascade.** Setting one property (like switching to manual mode) can automatically change the availability or values of other properties, and the camera will send events to notify about these cascading changes.

## Object and Storage Model

**Objects are organized hierarchically in stores.** The camera has storage areas (memory cards, internal storage) that contain objects (photos, videos, folders). Objects have handles for reference, format codes for type identification, and parent-child relationships for folder structures.

**Objects have metadata before content.** You must first get object information (metadata like size, format, creation date) before retrieving the actual object data. This allows decisions about whether to download objects.

**Associations are special objects.** Folders and albums are represented as association objects that don't have data content but define the hierarchical structure through parent-child relationships.

## Vendor Extensions

**Vendors extend the base PTP protocol.** Manufacturers like Sony add their own operation codes, property codes, and response codes on top of the standard PTP definitions, typically using different hex code ranges to avoid conflicts.

**Vendor operations can have special authentication.** Sony cameras require a multi-phase authentication handshake (SDIO_CONNECT with three phases) before full functionality is available.

**Vendor properties override standard ones.** Vendors often implement their own versions of standard properties with different codes, data types, or encoding schemes while maintaining similar functionality.

## Response and Error Handling

**Every operation results in a response code.** Success isn't assumed - every operation explicitly returns a response code indicating success, failure, or specific error conditions.

**Errors are specific and actionable.** Rather than generic failures, responses indicate specific problems like "store full," "object write protected," or "session not open" to guide error recovery.

**Events provide asynchronous notifications.** The camera can send events to notify about state changes, completed operations, or external changes (like memory card removal) without being polled.

## Format and File Type System

**Objects have standardized format codes.** Every file type (JPEG, RAW, MP4, etc.) has a unique format code that identifies its type independent of file extensions.

**Formats are categorized by type.** Objects are classified as either image ('I') or ancillary ('A') types, affecting how they're handled and what operations are valid.

**Format support varies by vendor.** While PTP defines standard formats, vendors add proprietary formats (like Sony's ARW raw format) with their own codes and handling requirements.