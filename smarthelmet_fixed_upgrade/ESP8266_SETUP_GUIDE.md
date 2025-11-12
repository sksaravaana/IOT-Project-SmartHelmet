# 🔌 ESP8266 Setup Guide for Smart Helmet System

## 📋 Overview

This guide will help you configure your ESP8266 to send helmet detection, alcohol detection, and battery status to your Flask backend server.

---

## 🛠️ Hardware Requirements

1. **ESP8266** (NodeMCU, Wemos D1 Mini, or similar)
2. **IR Sensor** - For helmet detection
3. **MQ3 Alcohol Sensor** - For alcohol detection
4. **Relay Module** - For ignition control
5. **Battery Monitoring Circuit** (optional)
6. **LED** - Status indicator
7. **Jumper Wires**
8. **Power Supply** (5V for ESP8266)

---

## 📡 Step 1: Find Your Computer's IP Address

Your ESP8266 needs to know where your Flask server is running.

### On Windows:
```bash
ipconfig
```

Look for **IPv4 Address** under your active network adapter.
Example: `192.168.1.100`

### Important:
- ✅ Both ESP8266 and your computer must be on the **same WiFi network**
- ✅ Note down this IP address - you'll need it in Step 3

---

## 🔧 Step 2: Install Arduino IDE Libraries

### Required Libraries:
1. **ESP8266WiFi** (Built-in with ESP8266 board)
2. **ESP8266HTTPClient** (Built-in)
3. **ArduinoJson** (Install from Library Manager)

### How to Install ArduinoJson:
1. Open Arduino IDE
2. Go to **Sketch → Include Library → Manage Libraries**
3. Search for **"ArduinoJson"**
4. Install version **6.x.x** (latest stable)

---

## ⚙️ Step 3: Configure ESP8266 Code

Open the file: **ESP8266_SmartHelmet_Code.ino**

### Change These Settings:

```cpp
// 1. WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";           // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password

// 2. Flask Server Configuration
const char* serverIP = "192.168.1.100";        // YOUR COMPUTER'S IP (from Step 1)
const int serverPort = 5001;                   // Flask port (default: 5001)
const char* bikeId = "BIKE123";                // Your bike ID

// 3. Sensor Thresholds (adjust based on your sensors)
const int ALCOHOL_THRESHOLD = 400;             // MQ3 sensor threshold
```

### Important: Bike ID Must Match!
The `bikeId` in ESP8266 code **must match** the `BIKE_ID` in your frontend config:

**Frontend Config** (`Flask_HTML_Version/frontend/js/config.js`):
```javascript
BIKE_ID: 'BIKE123'  // Must match ESP8266 bikeId
```

---

## 🔌 Step 4: Hardware Connections

### Pin Connections:

| Component | ESP8266 Pin | Notes |
|-----------|-------------|-------|
| **IR Sensor (Helmet)** | D1 | Digital input |
| **MQ3 Alcohol Sensor** | A0 | Analog input |
| **Relay Module** | D2 | Digital output (ignition control) |
| **Status LED** | D4 | Digital output |
| **GND** | GND | Common ground |
| **VCC** | 3.3V or 5V | Depending on sensor |

### Wiring Diagram:
```
ESP8266 NodeMCU
┌─────────────────┐
│                 │
│  D1 ────────────┼──→ IR Sensor (Helmet Detection)
│  D2 ────────────┼──→ Relay Module (Ignition Control)
│  D4 ────────────┼──→ LED (Status Indicator)
│  A0 ────────────┼──→ MQ3 Sensor (Alcohol Detection)
│  GND ───────────┼──→ Common Ground
│  3V3/5V ────────┼──→ Power Supply
│                 │
└─────────────────┘
```

---

## 📤 Step 5: Upload Code to ESP8266

### In Arduino IDE:

1. **Select Board:**
   - Tools → Board → ESP8266 Boards → NodeMCU 1.0 (or your board)

2. **Select Port:**
   - Tools → Port → COM3 (or your port)

3. **Set Upload Speed:**
   - Tools → Upload Speed → 115200

4. **Upload:**
   - Click the **Upload** button (→)
   - Wait for "Done uploading"

5. **Open Serial Monitor:**
   - Tools → Serial Monitor
   - Set baud rate to **115200**

---

## 🖥️ Step 6: Start Flask Server

Make sure your Flask server is running:

```bash
cd Flask_HTML_Version\backend
python app.py
```

You should see:
```
Starting Flask server on port 5001
 * Running on http://0.0.0.0:5001
```

---

## 📊 Step 7: Monitor ESP8266 Output

### In Serial Monitor, you should see:

```
=================================
Smart Helmet Safety System
ESP8266 - Flask Backend
=================================

Connecting to WiFi: YourWiFiName
.....
✓ WiFi Connected!
IP Address: 192.168.1.150
Flask Server: http://192.168.1.100:5001

System Ready!
Monitoring helmet and alcohol status...

--- Sensor Status ---
Helmet: ✓ WORN
Alcohol: ✓ CLEAR
Battery: 85%
--------------------

✓ Status sent successfully
Response: {"success":true,"ignitionAllowed":true,"message":"Status updated successfully"}
```

---

## 🌐 Step 8: View Data in Web Dashboard

1. Open browser: **http://localhost:5001**
2. Login to your account
3. Go to **Dashboard**
4. You should see **real-time updates** from ESP8266:
   - Helmet Status: Worn/Not Worn
   - Alcohol Status: Clear/Detected
   - Battery Level: XX%
   - Ignition Status: Allowed/Blocked

---

## 🔍 Data Flow Diagram

```
┌──────────────┐
│   ESP8266    │
│  (Hardware)  │
└──────┬───────┘
       │ WiFi
       │ HTTP POST
       │ /api/hardware/status
       ↓
┌──────────────┐
│    Flask     │
│   Backend    │
│  (Port 5001) │
└──────┬───────┘
       │ Socket.IO
       │ Real-time
       ↓
┌──────────────┐
│   Browser    │
│  Dashboard   │
│ (Frontend)   │
└──────────────┘
```

---

## 📝 JSON Data Format

### ESP8266 Sends to Flask:
```json
{
  "bikeId": "BIKE123",
  "helmetWorn": true,
  "alcoholDetected": false,
  "battery": 85,
  "ignitionStatus": "on"
}
```

### Flask Responds:
```json
{
  "success": true,
  "ignitionAllowed": true,
  "message": "Status updated successfully"
}
```

---

## 🎯 Ignition Control Logic

### Ignition is ALLOWED when:
- ✅ Helmet is worn (`helmetWorn: true`)
- ✅ No alcohol detected (`alcoholDetected: false`)

### Ignition is BLOCKED when:
- ❌ Helmet not worn
- ❌ Alcohol detected
- ❌ Admin manually blocks via dashboard

---

## 🐛 Troubleshooting

### ESP8266 Can't Connect to WiFi
```
✗ WiFi Connection Failed!
```
**Solution:**
- Check WiFi SSID and password in code
- Ensure 2.4GHz WiFi (ESP8266 doesn't support 5GHz)
- Move ESP8266 closer to router

### Can't Connect to Flask Server
```
✗ Connection failed: connection refused
```
**Solution:**
- Verify Flask server is running
- Check `serverIP` matches your computer's IP
- Ensure both devices on same network
- Check Windows Firewall (allow port 5001)

### No Data in Dashboard
**Solution:**
- Check Serial Monitor for successful POST requests
- Verify `bikeId` matches in both ESP8266 and frontend
- Refresh browser page
- Check browser console (F12) for errors

### Sensors Not Working
**Solution:**
- Check wiring connections
- Verify sensor power supply (3.3V or 5V)
- Adjust `ALCOHOL_THRESHOLD` based on your sensor
- Use `testSensors()` function to debug

---

## 🔧 Advanced Configuration

### Change Update Interval
```cpp
const unsigned long UPDATE_INTERVAL = 3000;  // 3 seconds (default)
// Change to 5000 for 5 seconds, 1000 for 1 second
```

### Adjust Alcohol Sensor Sensitivity
```cpp
const int ALCOHOL_THRESHOLD = 400;  // Lower = more sensitive
// Test your sensor and adjust accordingly
```

### Add More Sensors
You can add additional sensors by:
1. Define new pin constants
2. Read sensor in `readSensors()` function
3. Add data to JSON in `sendStatusToServer()`

---

## 📊 Testing Without Hardware

### Simulate Sensor Data:
Modify the `readSensors()` function:
```cpp
void readSensors() {
  // Simulate helmet worn
  helmetWorn = true;
  
  // Simulate no alcohol
  alcoholDetected = false;
  
  // Simulate battery
  batteryLevel = 85;
}
```

---

## 🔐 Security Notes

### For Production:
1. ✅ Use HTTPS instead of HTTP
2. ✅ Add authentication token to ESP8266 requests
3. ✅ Encrypt WiFi credentials
4. ✅ Use static IP for ESP8266
5. ✅ Implement request rate limiting

---

## 📞 API Endpoint Reference

### Hardware Status Endpoint
- **URL:** `http://YOUR_IP:5001/api/hardware/status`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **No Authentication Required** (for hardware)

### Request Body:
```json
{
  "bikeId": "string (required)",
  "helmetWorn": "boolean",
  "alcoholDetected": "boolean",
  "battery": "number (0-100)",
  "ignitionStatus": "string (on/off/blocked)"
}
```

### Response:
```json
{
  "success": true,
  "ignitionAllowed": true,
  "message": "Status updated successfully"
}
```

---

## ✅ Quick Checklist

Before running:
- [ ] Arduino IDE installed with ESP8266 board support
- [ ] ArduinoJson library installed
- [ ] WiFi credentials configured in code
- [ ] Flask server IP address configured
- [ ] Bike ID matches in ESP8266 and frontend
- [ ] Hardware connections verified
- [ ] Flask server running
- [ ] MongoDB running
- [ ] Both devices on same WiFi network

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ ESP8266 connects to WiFi
- ✅ Serial Monitor shows "Status sent successfully"
- ✅ Flask server logs show incoming requests
- ✅ Dashboard shows real-time sensor data
- ✅ Ignition control responds to helmet/alcohol status

---

**Your Smart Helmet System is now connected!** 🚀

For issues, check:
1. Serial Monitor output
2. Flask server terminal
3. Browser console (F12)
4. MongoDB data
