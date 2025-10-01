# Design a Generic, Type-Safe Protocol API System in TypeScript

### **Objective**

Your mission is to architect a foundational TypeScript system for defining and interacting with protocol-based APIs. Think of it as creating a "lingua franca" for any structured device communication, like PTP for cameras, MIDI for music, or a custom protocol for an IoT device.

You are building the **ideal solution from scratch**. Your design should serve as the "single source of truth," from which compile-time safety, a world-class developer experience, and even runtime features like UI generation can be derived.

---

### **Core Principles**

* **First-Principles Design:** Do not replicate existing patterns. Build the optimal system assuming you have complete control.
* **Airtight Type Safety:** Your primary goal is to make invalid states unrepresentable. The compiler should be the developer's most trusted partner, catching logical errors before the code is ever run.
* **Exceptional Developer Experience (DX):** The system must feel intuitive and empowering. It should provide instant, accurate IntelliSense (including descriptions and metadata), clear error messages, and guide developers toward correct usage effortlessly.
* **DRY (Don't Repeat Yourself):** A concept (like an operation's name, its opcode, or a parameter's type) should be defined exactly once.
* **Runtime Predictability:** While the focus is on the type system, the design must not preclude an efficient runtime implementation. The schema should be accessible at runtime without a heavy performance penalty.

---

### **Key Architectural Requirements**

#### **1. Ergonomic & Self-documenting Schema Definition**

Provide a fluent API (e.g., a set of builder functions) for defining a protocol's schema. The schema is the backbone of the entire system and must be strictly typed *itself*.

* **Schema Entities:** The schema must be able to define:
    * **Properties:** Key-value attributes of the device (e.g., `BatteryLevel`, `ImageQuality`). Must support `read-only`, `write-only`, and `read-write` access levels.
    * **Operations:** Actions the device can perform (e.g., `TakePicture`, `FormatStorage`).
    * **Events:** Asynchronous notifications sent *from* the device (e.g., `ObjectAdded`, `DeviceError`).
* **Strict Inference:** The builders (e.g., `defineOperation({...})`, `defineProperty({...})`) must infer the most precise types possible, eliminating the need for developers to manually use `as const` or other type assertions.
* **Embedded Metadata:** Definitions must include fields for metadata like `description` and `defaultValue`. This metadata should be exposed to the type system to surface in editor tooltips (JSDoc).

#### **2. A Fully Type-Safe API Client**

The system must be able to generate a client type from a schema that enforces protocol rules at compile time. This client is the primary interface for developers.

* **Asynchronous Operations:** All device interactions (getting/setting properties, sending operations) are inherently asynchronous. Client methods must return `Promise`s that resolve with correctly typed success values.
* **Property Access Control:** The client must enforce the `read-only` / `write-only` access levels defined in the schema. For example, `client.setProperty('SerialNumber', ...)` must be a type error if `SerialNumber` is a read-only property.
* **Operation Integrity:**
    * Attempting to call an operation that doesn't exist (`client.sendOperation('NonExistentOperation', ...)` ) must be a type error.
    * Calling an operation with an incorrect parameter payload (wrong type, missing required parameter, or extra unknown parameter) must be a type error.
* **Value Validation:** For properties or parameters defined with a specific set of allowed values (e.g., an enum like `WhiteBalance: ['Auto', 'Cloudy', 'Tungsten']`), attempting to use a value not in that set must be a type error.

#### **3. Sophisticated Vendor Extensibility**

Design a mechanism to layer a vendor-specific schema on top of a base protocol schema. The type system must correctly merge the two, resolving the final, concrete API surface.

* A vendor schema must be able to:
    1.  **Add** new, vendor-exclusive operations, properties, and events.
    2.  **Override** a base operation or property. This includes the ability to **add new parameters** to an operation or **widen the set of allowed values** for a property.
    3.  **Deprecate** a base entity (which should result in a specific TypeScript warning or error).
* The client's type must reflect the correct schema. A client instantiated with a vendor schema should see the vendor's operations, while a base client should not.

#### **4. Transparent Data Transformation**

The system must automatically handle encoding data sent to the device and decoding data received from it, making the process invisible to the end-user.

* This logic should be co-located with the property or parameter definition in the schema.
* Support both simple enum mappings (e.g., `'HighQuality'` ↔ `0x01`) and custom `encode`/`decode` functions for complex data structures.
* The developer should interact with the client using the high-level, "decoded" values, and the system handles the rest.

#### **5. Typed Error and Event Handling**

Real-world protocols include errors and asynchronous events. The type system must make handling them as safe as any other interaction.

* **Typed Errors:** An operation definition should include a list of possible error codes it can produce. The `Promise` returned by `sendOperation` should be typed to `reject` with a specific error type that allows developers to safely check `error.code`.
* **Typed Event Emitter:** The client should function as a type-safe event emitter. `client.on('ObjectAdded', payload => { ... })` must provide a `payload` argument with the correct type as defined in the schema for the `ObjectAdded` event. Listening for a non-existent event must be a type error.

#### **6. Full Runtime Introspection**

The schema definition must exist as a value at runtime. This enables advanced use cases like auto-generating documentation, building dynamic user interfaces, or creating validation libraries without duplicating the schema definition.

---

### **Constraints & What to Avoid**

* ❌ **No Backwards Compatibility:** This is a greenfield project.
* ❌ **No Manual Type Assertions:** The end-user of your system should **never** have to write `as const`, `as`, or `satisfies`. Your builder functions should handle all type inference.
* ❌ **No Type Evasion:** Avoid `any` and `unknown` wherever a more specific type can be derived. Do not use `@ts-ignore` or `@ts-nocheck`.

---

### **Deliverables**

1.  **`./new-type-system-gemini/`**: Create a new subdirectory for the solution.
2.  **`types.ts`**: Contains the core implementation of the new type system (builder functions, generic types, interfaces, etc.).
3.  **`schema.ts`**: An example file defining a base schema and a vendor-specific schema, showcasing all required features (properties with access levels, operations with errors, events, etc.).
4.  **`SUMMARY.md`**: A brief, high-level document explaining your design choices, the trade-offs you made, and how your system meets the core principles.
5.  **`valid-usage.ts`**: A file that demonstrates valid usage patterns, including async/await calls, property access, and typed event listeners.
6.  **`invalid-usage.ts`**: A file demonstrating invalid usage. Each intentional type error must be preceded by a `@ts-expect-error` comment to verify that the type system is catching the error as expected.

---

### **Success Criteria**

* **Flawless Compilation:** The entire project **must** compile successfully using `tsc --strict`.
* **Valid Usage Compiles:** The `valid-usage.ts` file must compile with zero type errors.
* **Invalid Usage Verifies Errors:** The `invalid-usage.ts` file must compile with zero errors. Every `@ts-expect-error` directive must correctly suppress a legitimate type error on the line below it. There must be no unused directives.