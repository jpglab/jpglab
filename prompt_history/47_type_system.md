Design a comprehensive TypeScript type system that guarantees type safety for all the PTP ISO 15740 protocol objects described in  /Users/kevinschaich/repositories/ptp-mcp/parsed/iso/ptp_iso_15740_reference/ptp_iso_15740_reference.md. This will include proper typing for all data structures, operations, responses, events, and properties.

# Deliverables

1.  **`./new-type-system-claude/`**: Create a new subdirectory for the solution.
2.  **`types.ts`**: Contains the core implementation of the new type system.
3.  **`schema.ts`**: An implementation of all the constants, operations, properties, responses, events, etc. described in the document.
4.  **`valid-usage.ts`**: A file demonstrating valid usage patterns, including stateful interaction, property access, file operations, and event listeners.
5.  **`invalid-usage.ts`**: A file demonstrating invalid usage. Each intentional type error must be preceded by a `@ts-expect-error` comment to verify the error is caught correctly.

# Success Criteria

* **Flawless Compilation:** The entire project **must** compile successfully using `tsc --strict`.
* **Valid Usage Compiles:** The `valid-usage.ts` file must compile with zero type errors.
* **Invalid Usage Verifies Errors:** The `invalid-usage.ts` file must compile with zero errors, with every `@ts-expect-error` directive correctly suppressing a legitimate type error on the subsequent line.

---

# Rules

### 1. Type Safety Requirements

Your type system **must** provide compile-time guarantees for the following scenarios. The implementation should be able to power an API that behaves as described:

**Positive Scenarios (Code that should be valid):**

* **Operations with Parameters:** Calling an operation with a valid set of required parameters must be type-correct.
* **Operations without Parameters:** Calling an operation that requires no parameters must be type-correct.
* **Getting Properties:** Getting a property value should be a valid operation. The returned type should be the *decoded*, developer-friendly type (e.g., a string literal `'ISO 3200'`, not a raw `number`).
* **Setting Properties:** Setting a property with a valid, developer-friendly value must be type-correct. The system should handle the encoding automatically.
* **Vendor-Specific Overrides:** A vendor-specific camera schema should be able to override a base operation, for example, by adding a new required parameter. Calling the operation on the vendor-specific camera with the extended set of parameters must be valid.
* **Vendor-Specific Additions:** A vendor-specific schema can add entirely new operations or properties. Using these new definitions with that vendor's camera must be valid.

**Negative Scenarios (Code that should produce a specific TypeScript error):**

1.  **Invalid Operation Name:** Attempting to use an operation that is not defined in the camera's schema must result in a type error.
2.  **Wrong Parameter Type:** Providing a parameter with a value of the wrong type (e.g., a `string` where a `number` is expected) must result in a type error.
3.  **Missing Required Parameter:** Calling an operation without one of its required parameters must result in a type error.
4.  **Extra, Unknown Parameter:** Calling an operation with a parameter that is not part of its definition must result in a type error.
5.  **Invalid Property Name:** Attempting to get or set a property that is not defined in the camera's schema must result in a type error.
6.  **Invalid Property Value:** Attempting to set a property with a value that is not in its allowed set (e.g., for an enum-like property) must result in a type error.
7.  **Identifier Incompatibility:** The system must prevent an identifier for an `Operation` from being used where an identifier for a `Property` is expected, and vice versa, even if they have the same underlying value (e.g., the same hex code).
8.  **Using Vendor-Specific Operations on Generic Camera:** Attempting to use a vendor-specific operation on a generic camera must result in a type error.
9.  **Wrong Parameter Structure for Overridden Operation:** If a vendor overrides an operation to require more parameters, calling it with the original (base) set of parameters must result in a type error for the missing required parameters.
10. **Invalid Enum Value for Parameter:** Providing a value for a parameter that is not one of the allowed enumerated members must result in a type error.

### 2. Vendor Override System

The system must elegantly handle a hierarchical schema structure.
- It should define a base set of generic PTP operations and properties.
- It must allow vendor-specific schemas (e.g., for Sony) to be defined that can:
    1.  **Inherit** all definitions from the base schema.
    2.  **Override** existing definitions (e.g., changing the parameters of an operation).
    3.  **Add** new, vendor-exclusive definitions.
- The type system must automatically resolve the correct definition based on the camera's schema. For example, when using a Sony schema, an overridden definition for `SHUTTER_SPEED` should be used instead of the generic one.

### 3. Automatic Encoding/Decoding

The system must provide a mechanism for transforming data between its raw (on-the-wire) representation and a developer-friendly, typed representation.
- This mechanism should be co-located with the property or parameter definition it applies to.
- It should support two primary modes:
    1.  **Simple Mapping:** For enum-like values, allow the definition to include a simple key-value object that can be used for both encoding and decoding.
    2.  **Custom Functions:** For complex transformations, allow the definition to include separate `encode` and `decode` functions.
- This transformation should be applied automatically and transparently by the camera's API (e.g., when getting or setting a property).

### 4. Runtime Introspection

The type definitions must be structured in a way that also allows for runtime access to metadata. This is crucial for tasks like logging, debugging, or building dynamic UIs. The system should be able to access an operation's name, code, parameter names, and descriptions at runtime.

### 5. Strictly Typed Definitions

The process of creating a schema (a collection of operations, properties, etc.) must itself be strictly typed. The system should prevent developers from providing a malformed definition object from the start, catching errors in the definition itself, not just in its usage.

### 6. Great Developer Experience (Ergonomics)

The design should guide developers toward correctness and prevent common mistakes.
- It should provide strong IntelliSense and autocompletion for all operations, properties, parameters, and allowed values.
- The system's structure or helper utilities should handle TypeScript intricacies automatically. For instance, developers shouldn't need to remember to manually apply `as const` to have definitions correctly inferred with the narrowest possible types. The API design should make the "easy way" the "correct way."
