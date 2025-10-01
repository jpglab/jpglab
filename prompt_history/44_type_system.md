# Design a Generic, Type-Safe Protocol API System in TypeScript

### **Objective**

Your mission is to architect a foundational TypeScript system for defining and interacting with protocol-based APIs. The design should be robust enough to model a real-world, stateful protocol like the **Picture Transfer Protocol (PTP)**, which is used for communicating with digital cameras.

You are building the **ideal solution from scratch**. Your design must serve as the "single source of truth," from which compile-time safety, a world-class developer experience, and even runtime features like UI generation can be derived.

---

### **Core Principles**

* **First-Principles Design:** Do not replicate existing patterns. Build the optimal system assuming you have complete control.
* **Airtight Type Safety:** Your primary goal is to make invalid states unrepresentable. The compiler should be the developer's most trusted partner, catching logical errors before the code is ever run.
* **Exceptional Developer Experience (DX):** The system must feel intuitive. It should provide instant, accurate IntelliSense (including descriptions and metadata), clear error messages, and guide developers toward correct usage effortlessly.
* **DRY (Don't Repeat Yourself):** A concept (like an operation's name, its opcode, or a response code) should be defined exactly once.
* **Runtime Predictability:** The design must not preclude an efficient runtime implementation. The schema should be accessible at runtime without a heavy performance penalty.

---

### **Key Architectural Requirements**

#### **1. Ergonomic & Self-documenting Schema Definition**

Provide a fluent API (e.g., builder functions) for defining the protocol schema. The schema is the backbone of the entire system and must be strictly typed *itself*.

* **Schema Entities:** The schema must define:
    * **Properties:** Device settings (e.g., `ISO`, `ShutterSpeed`). Must support `read-only` or `read-write` access and define constraints (e.g., a numeric range or an enumerated list of allowed values).
    * **Operations:** Actions the device can perform (e.g., `GetDeviceInfo`, `TakePicture`). Must specify their **ordered parameters** and whether they involve sending or receiving a data payload (but never both).
    * **Events:** Asynchronous notifications sent from the device (e.g., `ObjectAdded`, `PropertyChanged`).
    * **Response Codes:** A global set of codes representing success, failure, or specific error states (e.g., `OK`, `DeviceBusy`, `SessionNotOpen`).
    * **Object Formats:** Codes that identify file and folder types (e.g., `EXIF_JPEG`, `Association` for folders).
* **Strict Inference:** Builders (e.g., `defineOperation({...})`) must infer the most precise types possible, eliminating the need for developers to manually use `as const` or other type assertions.
* **Embedded Metadata:** Definitions must include fields for metadata like `description` to be surfaced in editor tooltips.

#### **2. A State-Aware, Type-Safe API Client**

The system must generate a client type from a schema that enforces protocol rules at compile time, including stateful concepts like sessions.

* **Session and Transaction Management:** The protocol is stateful. The client must manage a **Session ID** and a unique **Transaction ID** for each operation. The type system should ideally prevent session-required operations from being called before a session is opened.
* **Asynchronous Operations:** All device interactions must return `Promise`s that resolve with correctly typed success values or reject with a typed error containing a valid `ResponseCode`.
* **Property Access Control:** The client must enforce the `read-only` / `write-only` access levels. Attempting to set a read-only property must be a type error.
* **Operation Integrity:**
    * Calling a non-existent operation must be a type error.
    * Calling an operation with an incorrect parameter payload (wrong type, missing required parameter, extra parameter, or wrong order) must be a type error.

#### **3. Sophisticated Vendor Extensibility**

Design a mechanism to layer a vendor-specific schema on top of a base schema. The type system must correctly merge the two to produce the final API surface.

* A vendor schema must be able to:
    1.  **Add** new, vendor-exclusive operations, properties, events, and formats.
    2.  **Override** a base property, for example, by widening its set of allowed values.
* The client's type must reflect the correct schema. For instance, a client for a Sony camera should expose Sony-specific operations (like its multi-phase authentication handshake) that are not available on the base client.

#### **4. Transparent and Bidirectional Data Transformation**

The system must automatically handle encoding data sent to the device and decoding data received from it. The goal is to abstract away raw protocol values from the developer.

* **Simple Bidirectional Maps:** For enumerated values (e.g., `WhiteBalance`), the developer must be able to define a **single key-value map** (e.g., `{ 'Auto': 0x01, 'Cloudy': 0x02 }`). The system must use this map to automatically handle **both encoding and decoding** and provide type safety for both the string literal and the numeric code.
* **Custom Transformers:** For complex transformations that cannot be represented by a map (e.g., converting a `Date` object to a proprietary binary format or "1/100s" to a struct), the system should allow providing custom `encode`/`decode` functions.

#### **5. Typed Error and Event Handling**

Errors and events are core to the protocol and must be first-class, type-safe citizens.

* **Globally-Typed Errors:** Errors are **not operation-specific**. The `Promise` returned by any operation must be typed to `reject` with a generic error structure that contains a `code` property, typed as one of the globally-defined `ResponseCodes`.
* **Typed Event Emitter:** The client must function as a type-safe event emitter. `client.on('PropertyChanged', payload => { ... })` must provide a `payload` with the correct type. The system should also account for events caused by **cascading property changes**.

#### **6. File & Storage Abstraction**

The schema and client must model the device's hierarchical storage system. Files and folders are not accessed by name but by numeric handles.

* **Object-Based Interaction:** The client must provide methods to navigate the storage system, such as `getStorageIDs`, `getObjectHandles(storageID)`, `getObjectInfo(handle)`, and `getObject(handle)`.
* **Format-Aware Types:** The types for `getObjectInfo` and `getObject` should be aware of the `ObjectFormat` defined in the schema, allowing for differentiated handling of images versus folders (`Association` types).

---

### **Constraints & What to Avoid**

* ❌ **No Backwards Compatibility:** This is a greenfield project.
* ❌ **No Manual Type Assertions:** The end-user of your system should **never** have to write `as const`, `as`, or `satisfies`.
* ❌ **No Type Evasion:** Avoid `any` and `unknown`. Do not use `@ts-ignore` or `@ts-nocheck`.

---

### **Deliverables**

1.  **`./new-type-system-gemini/`**: Create a new subdirectory for the solution.
2.  **`types.ts`**: Contains the core implementation of the new type system.
3.  **`schema.ts`**: An example file defining a base PTP-like schema and a vendor-specific extension, showcasing all required entities.
4.  **`SUMMARY.md`**: A brief document explaining your design choices and trade-offs.
5.  **`valid-usage.ts`**: A file demonstrating valid usage patterns, including session handling, property access, file downloads, and event listeners.
6.  **`invalid-usage.ts`**: A file demonstrating invalid usage. Each intentional type error must be preceded by a `@ts-expect-error` comment to verify the error is caught correctly.

---

### **Success Criteria**

* **Flawless Compilation:** The entire project **must** compile successfully using `tsc --strict`.
* **Valid Usage Compiles:** The `valid-usage.ts` file must compile with zero type errors.
* **Invalid Usage Verifies Errors:** The `invalid-usage.ts` file must compile with zero errors, with every `@ts-expect-error` directive correctly suppressing a legitimate type error on the subsequent line.