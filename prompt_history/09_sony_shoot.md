We are building an API around Picture Transfer Protocol (PTP). You can find documentation about our progress in the `prompt_history/` folder. You should read through all of those first so you are familiar with the goals and our work so far.

We have also amassed a vast collection of knowledge on PTP (Picture Transfer Protocol). You have access to all of this through tool invocation. You can find more info on this in AGENTS.md. You should reference these documents heavily to influence the design of our system and the low level features.

Additional rules to keep in mind

- We have a wealth of knowledge at our fingertips via notes, basic memory, and MCP tools. Use them.
- Only create notes after asking me and I confirm that the feature we set out to build is working correctly. This will help us avoid creating misinformation in our knowledge base.
- Do all of this in TypeScript with modern tooling including bun, bunx, tsx, vite, and vitest. If you make any webpages they should be in React and be served with Vite.
- Pre-celebration, self promotion, self-aggrandizing, and false hope are not allowed. Be humble and honest when things aren't working completely.
- Always use typescript; never javascript.
- Make everything super easy to run. Keep the `scripts` block of `package.json` tidy and up-to-date. This should match 1-to-1 with any functionality in the app such as various examples or running an app, plus linting/building/formatting etc.
- Use vite or existing tooling rather than rolling your own build toolkit.
- In no way, shape, or form should you implement a "mock" or "stub" solution to revisit later. We are building the real, full solution now.
- ANY vendor-specific code belongs in the `src/vendors` folder. It does not belong in the core or transport layers. Do not make any logic branches in the core or transport layers relating to vendor specific functionality.

Our goals at this stage are just to get the Sony camera to do the 4-step shutter button method to take a photo.

Documentation from Sony is below.

Our authentication/handshake for sony cameras is totally working and we shouldn't modify that at all. Add your implementation to `scripts/test-sony.ts`.

---

# Complete Analysis of `shoot_an_image_and_get_it.sh` Script

This script implements a complete Sony camera control workflow using the PTP (Picture Transfer Protocol) over USB. The script orchestrates a complex sequence of operations to prepare the camera, capture an image, and retrieve it. Here's the detailed breakdown:

## Script Setup and Infrastructure

### FIFO Setup (Lines 4-16)

```bash
FIFO=fifo$$
handler_interrupt() {
    kill $(jobs -p) >& /dev/null
    exit
}
handler_exit() {
    rm -f $FIFO
    exit
}
trap handler_interrupt INT
trap handler_exit EXIT
mkfifo -m 644 $FIFO
```

- Creates a named FIFO (First In, First Out) pipe with process ID suffix for inter-process communication
- Sets up signal handlers to clean up background processes and remove the FIFO on exit
- The FIFO is used to capture output from background processes for parsing

### Utility Functions (Lines 18-27)

```bash
get_event_code() {
    TMP=`echo $2 | sed -e ':a; $!N; $!b a'`
    echo $TMP | sed -e "s/^.*$1=\([^,.]\+\).*\$/\1/g"
}

get_device_property_value() {
    TMP=`echo $2 | sed -e ':a; $!N; $!b a'`
    echo $TMP | sed -e "s/^.*$1\([0-9A-F]\+\).*\$/\1/g"
}
```

These functions parse Sony PTP response data using regex to extract specific values from the device property responses.

## Phase 1: Connection and Authentication (Lines 30-34)

### 1. Open Session (Line 31)

```bash
./control open $@
```

This calls the `Command::open()` function in `command.cpp`, which sends:

- **PTP Operation Code**: `0x1002` (OpenSession)
- **Parameter 1**: `1` (Session ID)
- **Data**: None

**Low-level breakdown**:

- Creates a `GenericBulkContainerHeader` with type `0x0001` (Command Block)
- Sends via USB bulk transfer to camera
- Camera responds with `0x2001` (OK) if successful

### 2. Authentication (Line 34)

```bash
./control auth $@
```

This executes the `Command::auth()` function, which performs Sony's proprietary authentication sequence:

**Step 1**: Send `0x9201` (Sony Auth command) with parameter `1`
**Step 2**: Send `0x9201` with parameter `2`
**Step 3**: Loop sending `0x9202` with parameter `0x012C` until camera returns version `0x012C`
**Step 4**: Send `0x9201` with parameter `3` to complete authentication

Each step involves:

- Sending a command via USB bulk out endpoint
- Receiving response data via USB bulk in endpoint
- Parsing response to verify authentication progress

## Phase 2: Camera Mode Configuration (Lines 36-60)

### 3. Set Dial Mode to Host (Line 37)

```bash
./control send --op=0x9205 --p1=0xD25A --size=1 --data=0x01 $@
```

**Operation Code**: `0x9205` = Sony SetDevicePropertyValue
**Device Property**: `0xD25A` = Dial Position Control
**Data**: `0x01` = Host control mode (1 byte)

This tells the camera that the host computer will control camera operations instead of manual dial settings.

**PTP Transaction Details**:

1. Sends command header with operation `0x9205`, parameter `0xD25A`
2. Sends data payload containing single byte `0x01`
3. Receives response confirming property was set

### 4. Wait for Operating Mode API Availability (Lines 39-47)

```bash
cond=""
while [ "$cond" != "01" ]
do
    ./control get 0x5013 $@ --of=$FIFO &
    out=`cat $FIFO`
    echo out=\"$out\"
    cond=`get_device_property_value "IsEnable: " "$out"`
done
```

**Device Property**: `0x5013` = Still Capture Mode
**Purpose**: Wait until the camera's still capture mode API becomes available

**Process**:

1. Calls `./control get 0x5013` which sends `0x9209` (GetAllExtDevicePropInfo)
2. Parser extracts all device properties and finds property `0x5013`
3. Checks `IsEnable` field in the property descriptor
4. Loops until `IsEnable` = `01` (enabled)

### 5. Set Operating Mode to Still Shooting (Line 50)

```bash
./control send --op=0x9205 --p1=0x5013 --size=4 --data=0x00000001 $@
```

**Operation Code**: `0x9205` = Sony SetDevicePropertyValue
**Device Property**: `0x5013` = Still Capture Mode
**Data**: `0x00000001` = Still shooting mode (4 bytes, little-endian)

This configures the camera for still photography mode rather than video or other modes.

### 6. Verify Mode Change (Lines 52-60)

```bash
while [ "$cond" != "00000001" ]
do
    ./control get 0x5013 $@ --of=$FIFO &
    out=`cat $FIFO`
    echo out=\"$out\"
    cond=`get_device_property_value "CurrentValue: " "$out"`
done
```

Polls the camera until the `CurrentValue` of property `0x5013` shows `00000001`, confirming still shooting mode is active.

## Phase 3: Storage Configuration (Lines 62-73)

### 7. Set Save Media to Host Device (Line 63)

```bash
./control send --op=0x9205 --p1=0xD222 --size=2 --data=0x0001 $@
```

**Device Property**: `0xD222` = Save Media
**Data**: `0x0001` = Save to host computer (2 bytes)

This configures the camera to transfer captured images to the host computer rather than saving only to the camera's memory card.

### 8. Verify Save Media Setting (Lines 65-73)

Similar polling loop as before, waiting for property `0xD222` `CurrentValue` to become `0001`.

## Phase 4: Live View Preparation (Lines 75-83)

### 9. Wait for Live View Readiness (Lines 75-83)

```bash
while [ "$cond" != "01" ]
do
    ./control get 0xD221 $@ --of=$FIFO &
    out=`cat $FIFO`
    echo out=\"$out\"
    cond=`get_device_property_value "CurrentValue: " "$out"`
done
```

**Device Property**: `0xD221` = Live View Status
**Purpose**: Ensure live view system is ready before shooting

Waits until the camera's live view system reports ready status (`01`).

## Phase 5: Image Capture Sequence (Lines 85-102)

### 10. Shooting Sequence (Lines 86-92)

```bash
./control send --op=0x9207 --p1=0xD2C1 --data=0x0002 --size=2 $@
sleep 1.5
./control send --op=0x9207 --p1=0xD2C2 --data=0x0002 --size=2 $@
sleep 1.5
./control send --op=0x9207 --p1=0xD2C2 --data=0x0001 --size=2 $@
sleep 1.5
./control send --op=0x9207 --p1=0xD2C1 --data=0x0001 --size=2 $@
```

**Operation Code**: `0x9207` = Sony ControlDeviceProperty
**Device Properties**:

- `0xD2C1` = Shutter Button Control
- `0xD2C2` = Focus Button Control

**Shooting Sequence**:

1. **Half-press shutter** (`0xD2C1` = `0x0002`): Initiates autofocus and metering
2. **Half-press focus** (`0xD2C2` = `0x0002`): Additional focus confirmation
3. **Release focus** (`0xD2C2` = `0x0001`): Release focus button
4. **Full-press shutter** (`0xD2C1` = `0x0001`): Actually capture the image

The 1.5-second delays allow the camera time to process each step (autofocus, exposure calculation, etc.).

### 11. Wait for Image Capture Completion (Lines 93-102)

```bash
COMPLETE=0x8000
cond="0x0000"
while [ $(($cond & $COMPLETE)) -ne $(($COMPLETE)) ]
do
    ./control get 0xD215 $@ --of=$FIFO &
    out=`cat $FIFO`
    echo $out
    cond=0x`get_device_property_value "CurrentValue: " "$out"`
done
```

**Device Property**: `0xD215` = Capture Status
**Completion Flag**: `0x8000` = Image capture completed bit

Uses bitwise AND to check if the capture completion bit (`0x8000`) is set in the status value. This ensures the image has been fully captured and processed before attempting to retrieve it.

## Phase 6: Image Retrieval (Lines 103-106)

### 12. Get Object Information (Line 104)

```bash
./control recv --op=0x1008 --p1=0xffffc001 $@
```

**Operation Code**: `0x1008` = GetObjectInfo (Standard PTP)
**Object Handle**: `0xffffc001` = Most recent captured image

This retrieves metadata about the captured image (size, format, etc.) but not the actual image data.

**PTP Transaction**:

1. Sends command with operation `0x1008` and handle `0xffffc001`
2. Receives object info structure containing:
    - Object format (JPEG, etc.)
    - File size
    - Creation date
    - Other metadata

### 13. Get Actual Image Data (Line 106)

```bash
./control getobject 0xffffc001 $@ --of=shoot.jpg
```

This calls `Command::getobject()` which sends:
**Operation Code**: `0x1009` = GetObject (Standard PTP)
**Object Handle**: `0xffffc001` = Most recent captured image
**Output**: Saves to `shoot.jpg` file

**Low-level Process**:

1. Sends GetObject command with handle
2. Camera responds with large data payload containing JPEG image
3. Data is received in chunks via USB bulk transfers
4. Raw JPEG data is written directly to `shoot.jpg`

## Phase 7: Session Cleanup (Lines 110-111)

### 14. Close Session (Line 111)

```bash
./control close $@
```

Sends PTP operation `0x1003` (CloseSession) to properly terminate the PTP session and release camera resources.

## Low-Level PTP Protocol Details

### USB Communication Layer

The communication happens through libusb-1.0 with these endpoints:

- **Bulk OUT**: Commands and data to camera
- **Bulk IN**: Responses and data from camera
- **Interrupt IN**: Asynchronous events from camera

### PTP Packet Structure

Each PTP transaction uses a `GenericBulkContainerHeader`:

```c
typedef struct _GenericBulkContainerHeader {
  uint32_t length;        // Total packet length
  uint16_t type;          // 0x0001=Command, 0x0002=Data, 0x0003=Response, 0x0004=Event
  uint16_t code;          // Operation/Response/Event code
  uint32_t transaction_id; // Incremental transaction ID
} GenericBulkContainerHeader;
```

### Sony PTP Extensions

Sony extends standard PTP with proprietary operations:

- `0x9201`, `0x9202`: Authentication
- `0x9205`: SetDevicePropertyValue
- `0x9207`: ControlDeviceProperty
- `0x9209`: GetAllExtDevicePropInfo

### Device Property System

Sony cameras expose hundreds of properties (exposure, ISO, focus, etc.) through 16-bit property codes. Each property has:

- **DevicePropertyCode**: Unique identifier
- **DataType**: Value type (uint8, uint16, uint32, string, etc.)
- **GetSet**: Read-only or read-write
- **IsEnable**: Whether property is currently available
- **DefaultValue**: Factory default
- **CurrentValue**: Current setting
- **FormFlag**: Constraints (none, range, enumeration)

This comprehensive system allows the script to precisely control every aspect of the camera's operation, from basic settings to complex shooting sequences, all through standardized PTP commands over USB.
