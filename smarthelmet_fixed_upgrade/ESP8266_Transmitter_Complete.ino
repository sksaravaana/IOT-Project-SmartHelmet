
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <RCSwitch.h>

// ==================== CONFIGURATION ====================
// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";           // Change to your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Change to your WiFi password

// Flask Server Configuration
const char* serverIP = "192.168.1.100";        // Change to your computer's IP address
const int serverPort = 5001;                   // Flask server port
const char* bikeId = "BIKE123";                // Your bike ID

// Pin Configuration
const int HELMET_SENSOR_PIN = D1;              // IR sensor for helmet detection
const int ALCOHOL_SENSOR_PIN = A0;             // MQ3 alcohol sensor (analog)
const int RF_TX_PIN = D2;                      // RF 433MHz transmitter data pin
const int LED_PIN = D4;                        // Status LED
const int BUZZER_PIN = D5;                     // Buzzer (optional)

// Sensor Thresholds
const int ALCOHOL_THRESHOLD = 400;             // Adjust based on your MQ3 sensor

// RF Signal Codes (must match receiver)
#define RF_CODE_START      1001                // Helmet OK + No Alcohol → Motor ON
#define RF_CODE_ALCOHOL    1002                // Alcohol detected → Motor OFF
#define RF_CODE_NOHELMET   1003                // Helmet not worn → Motor OFF
#define RF_CODE_OPEN       1004                // Helmet opened while riding → Motor OFF

// Update Intervals
const unsigned long SENSOR_CHECK_INTERVAL = 1000;   // Check sensors every 1 second
const unsigned long SERVER_UPDATE_INTERVAL = 3000;  // Send to server every 3 seconds
const unsigned long RF_SEND_INTERVAL = 2000;        // Send RF signal every 2 seconds

// ==================== GLOBAL VARIABLES ====================
WiFiClient wifiClient;
HTTPClient http;
RCSwitch mySwitch = RCSwitch();

bool helmetWorn = false;
bool alcoholDetected = false;
bool ignitionAllowed = false;
int batteryLevel = 100;
int currentRFCode = RF_CODE_NOHELMET;

unsigned long lastSensorCheck = 0;
unsigned long lastServerUpdate = 0;
unsigned long lastRFSend = 0;

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n=================================");
  Serial.println("Smart Helmet Safety System");
  Serial.println("ESP8266 TRANSMITTER (On Helmet)");
  Serial.println("=================================\n");
  
  // Initialize pins
  pinMode(HELMET_SENSOR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Initialize RF transmitter
  mySwitch.enableTransmit(RF_TX_PIN);
  mySwitch.setProtocol(1);        // Protocol 1 (default)
  mySwitch.setPulseLength(350);   // Pulse length
  mySwitch.setRepeatTransmit(3);  // Repeat 3 times for reliability
  
  Serial.println("✓ RF Transmitter initialized on pin D2");
  
  // Connect to WiFi
  connectWiFi();
  
  // Initial beep
  beep(2);
  
  Serial.println("\n✓ System Ready!");
  Serial.println("📡 Monitoring helmet and alcohol status...");
  Serial.println("📤 Sending RF signals to bike receiver");
  Serial.println("🌐 Sending data to Flask server\n");
}

// ==================== MAIN LOOP ====================
void loop() {
  unsigned long currentMillis = millis();
  
  // Check WiFi connection periodically
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected! Reconnecting...");
    connectWiFi();
  }
  
  // Read sensors
  if (currentMillis - lastSensorCheck >= SENSOR_CHECK_INTERVAL) {
    readSensors();
    determineStatus();
    lastSensorCheck = currentMillis;
  }
  
  // Send RF signal to bike receiver
  if (currentMillis - lastRFSend >= RF_SEND_INTERVAL) {
    sendRFSignal();
    lastRFSend = currentMillis;
  }
  
  // Send status to Flask server
  if (currentMillis - lastServerUpdate >= SERVER_UPDATE_INTERVAL) {
    sendStatusToServer();
    lastServerUpdate = currentMillis;
  }
  
  delay(100);
}

// ==================== WIFI CONNECTION ====================
void connectWiFi() {
  Serial.print("📶 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("🌐 Flask Server: http://");
    Serial.print(serverIP);
    Serial.print(":");
    Serial.println(serverPort);
    
    // Blink LED to indicate connection
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(200);
      digitalWrite(LED_PIN, LOW);
      delay(200);
    }
  } else {
    Serial.println("\n✗ WiFi Connection Failed!");
    Serial.println("⚠ Will continue with RF transmission only");
  }
}

// ==================== READ SENSORS ====================
void readSensors() {
  // Read Helmet Sensor (IR Sensor)
  // Assuming LOW = helmet detected, HIGH = no helmet
  int helmetSensorValue = digitalRead(HELMET_SENSOR_PIN);
  helmetWorn = (helmetSensorValue == LOW);
  
  // Read Alcohol Sensor (MQ3)
  int alcoholSensorValue = analogRead(ALCOHOL_SENSOR_PIN);
  alcoholDetected = (alcoholSensorValue > ALCOHOL_THRESHOLD);
  
  // Read Battery Level (simplified)
  // You can implement actual battery monitoring here
  batteryLevel = 85;  // Placeholder
}

// ==================== DETERMINE STATUS ====================
void determineStatus() {
  int previousRFCode = currentRFCode;
  
  // Determine what RF code to send
  if (alcoholDetected) {
    currentRFCode = RF_CODE_ALCOHOL;
    ignitionAllowed = false;
    digitalWrite(LED_PIN, LOW);
  } 
  else if (!helmetWorn) {
    currentRFCode = RF_CODE_NOHELMET;
    ignitionAllowed = false;
    digitalWrite(LED_PIN, LOW);
  } 
  else {
    // Helmet worn and no alcohol
    currentRFCode = RF_CODE_START;
    ignitionAllowed = true;
    digitalWrite(LED_PIN, HIGH);
  }
  
  // If status changed, print update
  if (currentRFCode != previousRFCode) {
    Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("📊 STATUS CHANGED");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    printStatus();
    
    // Beep on status change
    if (currentRFCode == RF_CODE_START) {
      beep(1);  // Success beep
    } else {
      beep(3);  // Warning beeps
    }
  }
}

// ==================== SEND RF SIGNAL ====================
void sendRFSignal() {
  mySwitch.send(currentRFCode, 24);  // Send 24-bit code
  
  Serial.print("📡 RF Signal Sent: ");
  Serial.print(currentRFCode);
  Serial.print(" → ");
  
  switch (currentRFCode) {
    case RF_CODE_START:
      Serial.println("START (Motor ON)");
      break;
    case RF_CODE_ALCOHOL:
      Serial.println("ALCOHOL (Motor OFF)");
      break;
    case RF_CODE_NOHELMET:
      Serial.println("NOHELMET (Motor OFF)");
      break;
    case RF_CODE_OPEN:
      Serial.println("OPEN (Motor OFF)");
      break;
  }
}

// ==================== SEND STATUS TO SERVER ====================
void sendStatusToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ Cannot send to server - WiFi not connected");
    return;
  }
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["bikeId"] = bikeId;
  doc["helmetWorn"] = helmetWorn;
  doc["alcoholDetected"] = alcoholDetected;
  doc["battery"] = batteryLevel;
  doc["ignitionStatus"] = ignitionAllowed ? "on" : "blocked";
  doc["rfCode"] = currentRFCode;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Prepare HTTP POST request
  String url = "http://" + String(serverIP) + ":" + String(serverPort) + "/api/hardware/status";
  
  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");
  
  // Send POST request
  int httpCode = http.POST(jsonString);
  
  // Handle response
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK) {
      String response = http.getString();
      Serial.println("🌐 Server: Status sent successfully");
      
      // Parse response
      StaticJsonDocument<128> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error) {
        bool serverIgnitionAllowed = responseDoc["ignitionAllowed"];
        Serial.print("   Server Response: Ignition ");
        Serial.println(serverIgnitionAllowed ? "ALLOWED ✓" : "BLOCKED ✗");
      }
    } else {
      Serial.print("✗ HTTP Error: ");
      Serial.println(httpCode);
    }
  } else {
    Serial.print("✗ Connection failed: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}

// ==================== PRINT STATUS ====================
void printStatus() {
  Serial.print("🪖 Helmet: ");
  Serial.println(helmetWorn ? "✓ WORN" : "✗ NOT WORN");
  
  Serial.print("🍺 Alcohol: ");
  Serial.println(alcoholDetected ? "✗ DETECTED" : "✓ CLEAR");
  
  Serial.print("🔋 Battery: ");
  Serial.print(batteryLevel);
  Serial.println("%");
  
  Serial.print("🔑 Ignition: ");
  Serial.println(ignitionAllowed ? "✓ ALLOWED" : "✗ BLOCKED");
  
  Serial.print("📡 RF Code: ");
  Serial.println(currentRFCode);
  Serial.println();
}

// ==================== BUZZER BEEP ====================
void beep(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }
}

// ==================== HELPER FUNCTIONS ====================

// Manual test function (call from Serial Monitor)
void testSensors() {
  Serial.println("\n=== SENSOR TEST MODE ===");
  Serial.println("Reading sensors for 10 seconds...\n");
  
  for (int i = 0; i < 10; i++) {
    int helmet = digitalRead(HELMET_SENSOR_PIN);
    int alcohol = analogRead(ALCOHOL_SENSOR_PIN);
    
    Serial.print("Helmet: ");
    Serial.print(helmet);
    Serial.print(" | Alcohol: ");
    Serial.println(alcohol);
    
    delay(1000);
  }
  
  Serial.println("\n=== TEST COMPLETE ===\n");
}
