# ⚡ Quick ESP8266 Setup - 5 Minutes

## 🎯 What You Need to Change

### 1. Find Your Computer's IP Address
```bash
ipconfig
```
Look for **IPv4 Address** (e.g., `192.168.1.100`)

---

### 2. Edit ESP8266 Code (`ESP8266_SmartHelmet_Code.ino`)

Change these 3 lines:

```cpp
const char* ssid = "YOUR_WIFI_SSID";           // Line 17: Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Line 18: Your WiFi password
const char* serverIP = "192.168.1.100";        // Line 21: Your computer's IP
```

---

### 3. Upload to ESP8266

1. Open Arduino IDE
2. Select Board: **NodeMCU 1.0**
3. Select Port: **COM3** (or your port)
4. Click **Upload** (→)

---

### 4. Start Flask Server

```bash
cd Flask_HTML_Version\backend
python app.py
```

---

### 5. Open Dashboard

Browser: **http://localhost:5001**

---

## 📊 ESP8266 → Flask Data Flow

```
ESP8266 sends every 3 seconds:
{
  "bikeId": "BIKE123",
  "helmetWorn": true/false,
  "alcoholDetected": true/false,
  "battery": 0-100,
  "ignitionStatus": "on/off/blocked"
}
    ↓
Flask receives at: /api/hardware/status
    ↓
Stores in MongoDB
    ↓
Sends to Dashboard via Socket.IO
    ↓
Dashboard shows real-time data
```

---

## 🔌 Pin Connections

| Component | ESP8266 Pin |
|-----------|-------------|
| Helmet Sensor (IR) | D1 |
| Alcohol Sensor (MQ3) | A0 |
| Relay (Ignition) | D2 |
| LED (Status) | D4 |

---

## ✅ Success Check

### Serial Monitor Shows:
```
✓ WiFi Connected!
IP Address: 192.168.1.150
✓ Status sent successfully
```

### Dashboard Shows:
- Helmet: Worn/Not Worn
- Alcohol: Clear/Detected
- Battery: XX%
- Ignition: Allowed/Blocked

---

## 🐛 Common Issues

### Can't Connect to WiFi
- Check WiFi name and password
- Use 2.4GHz WiFi (not 5GHz)

### Can't Connect to Flask
- Check server IP address
- Ensure Flask is running
- Both on same WiFi network

### No Data in Dashboard
- Check `bikeId` matches: "BIKE123"
- Refresh browser
- Check Flask terminal for requests

---

## 📝 Important: Bike ID Must Match!

**ESP8266 Code:**
```cpp
const char* bikeId = "BIKE123";
```

**Frontend Config** (`frontend/js/config.js`):
```javascript
BIKE_ID: 'BIKE123'
```

**Both must be the same!**

---

## 🚀 That's It!

Your ESP8266 will now send data to Flask every 3 seconds, and you'll see real-time updates in the dashboard!
