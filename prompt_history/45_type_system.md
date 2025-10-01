# Design a Generic, Type-Safe Protocol API System in TypeScript

### **Objective**

Your mission is to architect a foundational TypeScript system for defining and interacting with protocol-based APIs. The design should be robust enough to model a real-world, stateful protocol, such as those used for communicating with complex hardware like digital cameras, scientific instruments, or IoT devices.

You are building the **ideal solution from scratch**. Your design must serve as the "single source of truth," from which compile-time safety, a world-class developer experience, and even runtime features like UI generation can be derived.

---

### **Core Principles**

* **First-Principles Design:** Do not replicate existing patterns. Build the optimal system assuming you have complete control.
* **Airtight Type Safety:** Your primary goal is to make invalid states unrepresentable. The compiler should be the developer's most trusted partner, catching logical errors before the code is ever run.
* **Exceptional Developer Experience (DX):** The system must feel intuitive. It should provide instant, accurate IntelliSense (including descriptions and metadata), clear error messages, and guide developers toward correct usage effortlessly.
* **DRY (Don't Repeat Yourself):** A concept (like an operation's name or a response code) should be defined exactly once.
* **Runtime Predictability:** The design must not preclude an efficient runtime implementation. The schema should be accessible at runtime without a heavy performance penalty.

---

### **Key Architectural Requirements**

#### **1. Ergonomic & Self-documenting Schema Definition**

Provide an ergonomic method for defining a protocol's schema. This schema is the backbone of the entire system and must be structurally validated by the type system itself.

* **Schema Entities:** The schema must be able to define:
    * **Properties:** Device settings or attributes. Must support different access levels (e.g., read-only vs. read-write) and define value constraints (e.g., a numeric range or an enumerated list of allowed values).
    * **Operations:** Actions the device can perform. Must specify their parameters and the nature of any associated data transfer.
    * **Events:** Asynchronous notifications sent from the device.
    * **Response Codes:** A global set of codes representing the various outcomes of an operation, including success and specific error states.
    * **Object Formats:** Identifiers for different types of files or data structures managed by the device.
* **Strict Inference:** The schema definition process must infer the most precise types possible, eliminating the need for developers to manually use type assertions like `as const`.
* **Embedded Metadata:** Definitions should allow for descriptive metadata that can be surfaced in editor tooltips to aid developers.

#### **2. A State-Aware, Type-Safe API Client**

The system must generate a client type from a schema that enforces protocol rules at compile time, including handling stateful communication.

* **State Management:** The system must support stateful communication, including concepts like sessions and ensuring requests can be reliably matched with their corresponding responses.
* **Asynchronous Operations:** All device interactions are inherently asynchronous and must be handled accordingly, using Promises or a similar model. These should resolve with correctly typed success values or reject with a typed error containing a valid `ResponseCode`.
* **Compile-Time Integrity:** The type system must prevent:
    * Calling operations that do not exist.
    * Providing incorrect parameters (mismatched types, incorrect arity, or extraneous arguments).
    * Attempting to write to a read-only property.
    * Using a value for a property that violates its defined constraints.

#### **3. Sophisticated Vendor Extensibility**

Design a mechanism to layer a vendor-specific schema on top of a base schema. The type system must correctly merge the two to produce the final, concrete API surface for the client.

* A vendor schema must be able to add new, vendor-exclusive entities (operations, properties, etc.) and override or extend base entities.
* The resulting client type must accurately reflect the combined schema, exposing vendor-specific functionality only when the vendor schema is applied.

#### **4. Transparent and Bidirectional Data Transformation**

The system must automatically handle the encoding and decoding of data between a developer-friendly representation and the raw format required by the protocol.

* **Simple Bidirectional Maps:** For values that map directly to protocol codes, the developer should be able to define a single key-value map. The system must use this map to automatically handle both encoding and decoding, providing type safety for both representations.
* **Custom Transformers:** For complex transformations that cannot be represented by a simple map, the system should allow for providing custom `encode` and `decode` logic.

#### **5. Typed Error and Event Handling**

Errors and events are core to the protocol and must be first-class, type-safe citizens.

* **Globally-Typed Errors:** Errors should be based on the globally-defined `ResponseCodes`. The promise returned by any operation must be typed to reject with a generic error structure containing a `code` property that is strictly typed to one of those response codes.
* **Typed Event Emitter:** The client must function as a type-safe event emitter. Subscribing to an event must provide a callback with a correctly typed payload, and attempting to subscribe to a non-existent event must be a type error.

#### **6. File & Storage Abstraction**

The schema and client must be able to model and interact with a device's hierarchical storage system.

* **Object-Based Interaction:** The client must provide a type-safe interface for navigating the storage system, allowing for the discovery, inspection, and retrieval of files and folders.
* **Format-Aware Types:** The types related to storage interaction should be aware of the `ObjectFormat` definitions in the schema, allowing for differentiated handling of various file or data types.

---

### **Constraints & What to Avoid**

* ❌ **No Backwards Compatibility:** This is a greenfield project.
* ❌ **No Manual Type Assertions:** The end-user of your system should **never** have to write `as const`, `as`, or `satisfies`.
* ❌ **No Type Evasion:** Avoid `any` and `unknown`. Do not use `@ts-ignore` or `@ts-nocheck`.

---

### **Deliverables**

1.  **`./new-type-system-claude/`**: Create a new subdirectory for the solution.
2.  **`types.ts`**: Contains the core implementation of the new type system.
3.  **`schema.ts`**: An example file defining a base schema and a vendor-specific extension, showcasing all required entities.
4.  **`SUMMARY.md`**: A brief document explaining your design choices and trade-offs.
5.  **`valid-usage.ts`**: A file demonstrating valid usage patterns, including stateful interaction, property access, file operations, and event listeners.
6.  **`invalid-usage.ts`**: A file demonstrating invalid usage. Each intentional type error must be preceded by a `@ts-expect-error` comment to verify the error is caught correctly.

---

### **Success Criteria**

* **Flawless Compilation:** The entire project **must** compile successfully using `tsc --strict`.
* **Valid Usage Compiles:** The `valid-usage.ts` file must compile with zero type errors.
* **Invalid Usage Verifies Errors:** The `invalid-usage.ts` file must compile with zero errors, with every `@ts-expect-error` directive correctly suppressing a legitimate type error on the subsequent line.