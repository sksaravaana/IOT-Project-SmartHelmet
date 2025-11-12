# 🚀 Complete Smart Helmet System Setup Guide

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART HELMET SYSTEM                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   ESP8266        │   RF    │     ESP32        │
│  (On Helmet)     │ ──433──→│   (On Bike)      │
│                  │  MHz    │                  │
│ • Helmet Sensor  │         │ • RF Receiver    │
│ • Alcohol Sensor │         │ • Motor Control  │
│ • RF Transmitter │         │ • LCD Display    │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ WiFi                       │ WiFi
         │ HTTP POST                  │ HTTP POST
         │                            │
         └────────────┬───────────────┘
                      ↓
         ┌────────────────────────┐
         │   Flask Backend        │
         │   (Your Computer)      │
         │   Port 5001            │
         │                        │
         │ • Receives data        │
         │ • Stores in MongoDB    │
         │ • Real-time Socket.IO  │
         └────────────┬───────────┘
                      ↓
         ┌────────────────────────┐
         │   Web Dashboard        │
         │   (Browser)            │
         │   http://localhost:5001│
         │                        │
         │ • Real-time status     │
         │ • Analytics            │
         │ • Admin controls       │
         └────────────────────────┘
```

---

## 🛠️ Hardware Requirements

### ESP8266 (On Helmet)
- NodeMCU ESP8266
- IR Sensor (helmet detection)
- MQ3 Alcohol Sensor
- RF 433MHz Transmitter Module
- LED (status indicator)
- Buzzer (optional)
- Battery pack

### ESP32 (On Bike)
- ESP32 Development Board
- RF 433MHz Receiver Module
- L298N Motor Driver
- DC Motor (ignition simulation)
- LCD I2C Display (16x2)
- Power supply

---

## ⚙️ Step-by-Step Setup

### Step 1: Find Your Computer's IP Address

```bash
ipconfig
```

Look for **IPv4 Address** (e.g., `192.168.1.100`)

---

### Step 2: Configure ESP8266 Transmitter (On Helmet)

**File:** `ESP8266_Transmitter_Complete.ino`

**Change these lines:**

```cpp
// Line 23-24: WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Line 27: Your computer's IP
const char* serverIP = "192.168.1.100";

// Line 29: Bike ID
const char* bikeId = "BIKE123";
```

**Pin Connections:**
| Component | ESP8266 Pin |
|-----------|-------------|
| Helmet Sensor (IR) | D1 |
| Alcohol Sensor (MQ3) | A0 |
| RF Transmitter | D2 |
| LED | D4 |
| Buzzer | D5 |

**Upload to ESP8266:**
1. Open in Arduino IDE
2. Board: NodeMCU 1.0
3. Port: Select your COM port
4. Upload

---

### Step 3: Configure ESP32 Receiver (On Bike)

**File:** `ESP32_Receiver_Complete.ino`

**Change these lines:**

```cpp
// Line 27-28: WiFi credentials (same as ESP8266)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Line 31: Your computer's IP (same as ESP8266)
const char* serverIP = "192.168.1.100";

// Line 33: Bike ID (MUST MATCH ESP8266)
const char* bikeId = "BIKE123";
```

**Pin Connections:**
| Component | ESP32 Pin |
|-----------|-----------|
| RF Receiver | GPIO 4 |
| Motor IN1 | GPIO 26 |
| Motor IN2 | GPIO 27 |
| Motor ENA | GPIO 25 |
| LCD SDA | GPIO 21 |
| LCD SCL | GPIO 22 |

**Upload to ESP32:**
1. Open in Arduino IDE
2. Board: ESP32 Dev Module
3. Port: Select your COM port
4. Upload

---

### Step 4: Start Flask Backend

```bash
cd Flask_HTML_Version\backend
python app.py
```

**You should see:**
```
Starting Flask server on port 5001
Connected to MQTT broker
 * Running on http://0.0.0.0:5001
```

---

### Step 5: Open Web Dashboard

**Browser:** http://localhost:5001

1. Register/Login
2. Go to Dashboard
3. You'll see real-time updates from both ESP8266 and ESP32

---

## 📡 RF Signal Codes

Both ESP8266 and ESP32 use these codes:

| Code | Meaning | Motor Action |
|------|---------|--------------|
| 1001 | START - Helmet OK, No Alcohol | Motor ON |
| 1002 | ALCOHOL - Alcohol Detected | Motor OFF |
| 1003 | NOHELMET - Helmet Not Worn | Motor OFF |
| 1004 | OPEN - Helmet Opened | Motor OFF |

---

## 🔄 Data Flow

### 1. ESP8266 (Helmet) Operation
```
Every 1 second:
  ├─ Read helmet sensor
  ├─ Read alcohol sensor
  └─ Determine status

Every 2 seconds:
  └─ Send RF signal to ESP32 (1001/1002/1003/1004)

Every 3 seconds:
  └─ Send HTTP POST to Flask
     {
       "bikeId": "BIKE123",
       "helmetWorn": true/false,
       "alcoholDetected": true/false,
       "battery": 85,
       "ignitionStatus": "on/blocked",
       "rfCode": 1001
     }
```

### 2. ESP32 (Bike) Operation
```
Continuously:
  └─ Listen for RF signals

When RF received:
  ├─ Display on LCD
  ├─ Control motor (ON/OFF)
  └─ Send HTTP POST to Flask immediately

Every 5 seconds:
  └─ Send status update to Flask
     {
       "bikeId": "BIKE123",
       "helmetWorn": true/false,
       "alcoholDetected": true/false,
       "motorRunning": true/false,
       "status": "Running/Blocked",
       "lastRFCode": 1001,
       "signalAge": 2
     }
```

### 3. Flask Backend Operation
```
Receives POST at /api/hardware/status:
  ├─ Store in MongoDB
  ├─ Emit Socket.IO event to dashboard
  ├─ Create alerts if violations detected
  └─ Respond with ignition permission
     {
       "success": true,
       "ignitionAllowed": true/false,
       "message": "Status updated"
     }
```

### 4. Web Dashboard Operation
```
Socket.IO connection:
  └─ Receives real-time updates
     ├─ Helmet status
     ├─ Alcohol status
     ├─ Motor status
     ├─ Battery level
     └─ Alerts
```

---

## 🧪 Testing the System

### Test 1: Helmet Detection
1. **Without helmet:** 
   - ESP8266 LED: OFF
   - RF Code: 1003 (NOHELMET)
   - ESP32 LCD: "Helmet Not Worn"
   - Motor: OFF
   - Dashboard: Red status

2. **With helmet:**
   - ESP8266 LED: ON
   - RF Code: 1001 (START)
   - ESP32 LCD: "Helmet OK"
   - Motor: ON
   - Dashboard: Green status

### Test 2: Alcohol Detection
1. **Blow on MQ3 sensor:**
   - ESP8266 LED: OFF
   - RF Code: 1002 (ALCOHOL)
   - ESP32 LCD: "Alcohol Detected"
   - Motor: OFF
   - Dashboard: Red alert

### Test 3: System Integration
1. **Check Serial Monitors:**
   - ESP8266: Should show RF sending + HTTP POST success
   - ESP32: Should show RF receiving + Motor control + HTTP POST success

2. **Check Flask Terminal:**
   - Should show incoming POST requests
   - Should show Socket.IO emissions

3. **Check Dashboard:**
   - Should update in real-time
   - Should show correct helmet/alcohol status
   - Should show alerts when violations occur

---

## 🔍 Serial Monitor Output Examples

### ESP8266 Output:
```
=================================
Smart Helmet Safety System
ESP8266 TRANSMITTER (On Helmet)
=================================

✓ RF Transmitter initialized on pin D2
📶 Connecting to WiFi: MyWiFi
✓ WiFi Connected!
📍 IP Address: 192.168.1.150
🌐 Flask Server: http://192.168.1.100:5001

✓ System Ready!
📡 Monitoring helmet and alcohol status...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STATUS CHANGED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪖 Helmet: ✓ WORN
🍺 Alcohol: ✓ CLEAR
🔋 Battery: 85%
🔑 Ignition: ✓ ALLOWED
📡 RF Code: 1001

📡 RF Signal Sent: 1001 → START (Motor ON)
🌐 Server: Status sent successfully
   Server Response: Ignition ALLOWED ✓
```

### ESP32 Output:
```
=================================
Smart Helmet Safety System
ESP32 RECEIVER (On Bike)
=================================

✓ RF Receiver initialized on pin 4
✓ LCD initialized
✓ Motor driver initialized
📶 Connecting to WiFi: MyWiFi
✓ WiFi Connected!
📍 IP Address: 192.168.1.151

✓ System Ready!
📡 Waiting for RF signals from helmet...

📩 RF Received: 1001 → START (Motor ON)
🟢 Motor: ON
🌐 Server: Status sent successfully
   Server Response: Ignition ALLOWED ✓
```

---

## 🐛 Troubleshooting

### ESP8266 Issues

**Problem:** WiFi not connecting
```
✗ WiFi Connection Failed!
```
**Solution:**
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP8266 doesn't support 5GHz)
- Move closer to router

**Problem:** Can't send to Flask
```
✗ Connection failed
```
**Solution:**
- Verify Flask is running
- Check serverIP is correct
- Ensure both on same network
- Check Windows Firewall

**Problem:** RF not transmitting
**Solution:**
- Check RF transmitter wiring (VCC, GND, DATA to D2)
- Verify RF module is 433MHz
- Check antenna connection

### ESP32 Issues

**Problem:** Not receiving RF signals
**Solution:**
- Check RF receiver wiring (VCC, GND, DATA to GPIO 4)
- Verify RF module is 433MHz
- Check antenna connection
- Ensure ESP8266 is transmitting (check its Serial Monitor)

**Problem:** LCD not displaying
```
LCD shows nothing
```
**Solution:**
- Check I2C address (try 0x3F if 0x27 doesn't work)
- Verify I2C connections (SDA=21, SCL=22)
- Adjust LCD contrast potentiometer

**Problem:** Motor not running
**Solution:**
- Check L298N connections
- Verify motor power supply (separate from ESP32)
- Test motor directly
- Check IN1, IN2, ENA connections

### Flask Backend Issues

**Problem:** Not receiving data
**Solution:**
- Check Flask terminal for errors
- Verify endpoint: `/api/hardware/status`
- Check MongoDB is running
- Test with curl:
  ```bash
  curl -X POST http://localhost:5001/api/hardware/status -H "Content-Type: application/json" -d "{\"bikeId\":\"BIKE123\",\"helmetWorn\":true}"
  ```

### Dashboard Issues

**Problem:** No real-time updates
**Solution:**
- Check Socket.IO connection (F12 console)
- Verify bikeId matches everywhere
- Refresh browser
- Check Flask Socket.IO logs

---

## 📊 Configuration Checklist

Before running, verify:

### ESP8266 (Helmet)
- [ ] WiFi SSID and password configured
- [ ] Flask server IP configured
- [ ] Bike ID set to "BIKE123"
- [ ] RF transmitter on pin D2
- [ ] Helmet sensor on pin D1
- [ ] Alcohol sensor on pin A0
- [ ] Code uploaded successfully

### ESP32 (Bike)
- [ ] WiFi SSID and password configured (same as ESP8266)
- [ ] Flask server IP configured (same as ESP8266)
- [ ] Bike ID set to "BIKE123" (MUST MATCH)
- [ ] RF receiver on pin GPIO 4
- [ ] Motor driver connected (pins 25, 26, 27)
- [ ] LCD connected (I2C address 0x27 or 0x3F)
- [ ] Code uploaded successfully

### Flask Backend
- [ ] MongoDB running
- [ ] Flask server running on port 5001
- [ ] Endpoint `/api/hardware/status` available
- [ ] Socket.IO enabled

### Frontend
- [ ] Bike ID in `config.js` is "BIKE123"
- [ ] Browser open at http://localhost:5001
- [ ] User logged in
- [ ] Dashboard page open

---

## 🎯 Success Indicators

✅ **ESP8266:** Serial shows "Status sent successfully"
✅ **ESP32:** Serial shows "RF Received" and "Motor: ON"
✅ **Flask:** Terminal shows POST requests
✅ **Dashboard:** Real-time status updates visible
✅ **Motor:** Runs when helmet worn and no alcohol
✅ **LCD:** Shows correct status messages

---

## 🔐 Important Notes

1. **Bike ID Must Match Everywhere:**
   - ESP8266: `bikeId = "BIKE123"`
   - ESP32: `bikeId = "BIKE123"`
   - Frontend: `BIKE_ID: 'BIKE123'`

2. **Same WiFi Network:**
   - ESP8266, ESP32, and computer must all be on the same WiFi

3. **RF Range:**
   - 433MHz RF modules typically work up to 100m in open space
   - Reduce range in buildings/obstacles

4. **Power Supply:**
   - ESP8266: 3.3V or 5V via USB
   - ESP32: 5V via USB
   - Motor: Separate 12V power supply for L298N

5. **Safety:**
   - This is a prototype system
   - For production, add proper safety mechanisms
   - Test thoroughly before real-world use

---

**Your complete Smart Helmet System is ready!** 🚀

All three components (ESP8266, ESP32, Flask) now communicate seamlessly!
