/*
 * Smart Helmet Safety System - ESP8266 Code
 * 
 * This code sends helmet detection, alcohol detection, and battery status
 * to the Flask backend server via HTTP POST requests.
 * 
 * Hardware Requirements:
 * - ESP8266 (NodeMCU or similar)
 * - IR Sensor (for helmet detection)
 * - MQ3 Alcohol Sensor
 * - Relay Module (for ignition control)
 * - Battery monitoring circuit
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================
// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";           // Change to your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Change to your WiFi password

// Flask Server Configuration
const char* serverIP = "192.168.1.100";        // Change to your computer's IP address
const int serverPort = 5001;                   // Flask server port
const char* bikeId = "BIKE123";                // Your bike ID (must match in frontend config.js)

// Sensor Pin Configuration
const int HELMET_SENSOR_PIN = D1;              // IR sensor for helmet detection
const int ALCOHOL_SENSOR_PIN = A0;             // MQ3 alcohol sensor (analog)
const int RELAY_PIN = D2;                      // Relay for ignition control
const int BATTERY_PIN = A0;                    // Battery voltage monitoring (if separate ADC)
const int LED_PIN = D4;                        // Status LED

// Sensor Thresholds
const int ALCOHOL_THRESHOLD = 400;             // Adjust based on your MQ3 sensor
const int HELMET_DETECTION_DELAY = 2000;       // 2 seconds to confirm helmet worn

// Update Interval
const unsigned long UPDATE_INTERVAL = 3000;    // Send status every 3 seconds

// ==================== GLOBAL VARIABLES ====================
WiFiClient wifiClient;
HTTPClient http;

bool helmetWorn = false;
bool alcoholDetected = false;
bool ignitionAllowed = false;
int batteryLevel = 100;
unsigned long lastUpdate = 0;

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n=================================");
  Serial.println("Smart Helmet Safety System");
  Serial.println("ESP8266 - Flask Backend");
  Serial.println("=================================\n");
  
  // Initialize pins
  pinMode(HELMET_SENSOR_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Initially block ignition
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("\nSystem Ready!");
  Serial.println("Monitoring helmet and alcohol status...\n");
}

// ==================== MAIN LOOP ====================
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    connectWiFi();
  }
  
  // Read sensors
  readSensors();
  
  // Control ignition based on conditions
  controlIgnition();
  
  // Send status to server periodically
  if (millis() - lastUpdate >= UPDATE_INTERVAL) {
    sendStatusToServer();
    lastUpdate = millis();
  }
  
  delay(100);
}

// ==================== WIFI CONNECTION ====================
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
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
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Flask Server: http://");
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
    Serial.println("Please check your WiFi credentials and try again.");
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
  
  // Read Battery Level (simplified - adjust based on your circuit)
  // This is a placeholder - implement actual battery monitoring
  batteryLevel = map(analogRead(BATTERY_PIN), 0, 1023, 0, 100);
  batteryLevel = constrain(batteryLevel, 0, 100);
  
  // Debug output
  static unsigned long lastDebug = 0;
  if (millis() - lastDebug > 5000) {  // Print every 5 seconds
    Serial.println("\n--- Sensor Status ---");
    Serial.print("Helmet: ");
    Serial.println(helmetWorn ? "✓ WORN" : "✗ NOT WORN");
    Serial.print("Alcohol: ");
    Serial.println(alcoholDetected ? "✗ DETECTED" : "✓ CLEAR");
    Serial.print("Battery: ");
    Serial.print(batteryLevel);
    Serial.println("%");
    Serial.println("--------------------\n");
    lastDebug = millis();
  }
}

// ==================== CONTROL IGNITION ====================
void controlIgnition() {
  // Ignition allowed only if helmet is worn AND no alcohol detected
  ignitionAllowed = helmetWorn && !alcoholDetected;
  
  if (ignitionAllowed) {
    digitalWrite(RELAY_PIN, HIGH);  // Allow ignition
    digitalWrite(LED_PIN, HIGH);    // Turn on LED
  } else {
    digitalWrite(RELAY_PIN, LOW);   // Block ignition
    digitalWrite(LED_PIN, LOW);     // Turn off LED
  }
}

// ==================== SEND STATUS TO SERVER ====================
void sendStatusToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send data - WiFi not connected");
    return;
  }
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["bikeId"] = bikeId;
  doc["helmetWorn"] = helmetWorn;
  doc["alcoholDetected"] = alcoholDetected;
  doc["battery"] = batteryLevel;
  doc["ignitionStatus"] = ignitionAllowed ? "on" : "blocked";
  
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
      Serial.println("✓ Status sent successfully");
      Serial.println("Response: " + response);
      
      // Parse response to check ignition permission
      StaticJsonDocument<128> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error) {
        bool serverIgnitionAllowed = responseDoc["ignitionAllowed"];
        if (serverIgnitionAllowed != ignitionAllowed) {
          Serial.println("⚠ Server override: Ignition " + String(serverIgnitionAllowed ? "ALLOWED" : "BLOCKED"));
          ignitionAllowed = serverIgnitionAllowed;
          controlIgnition();
        }
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

// ==================== HELPER FUNCTIONS ====================

// Function to test sensors manually
void testSensors() {
  Serial.println("\n=== SENSOR TEST MODE ===");
  Serial.println("Reading sensors for 10 seconds...\n");
  
  for (int i = 0; i < 10; i++) {
    int helmet = digitalRead(HELMET_SENSOR_PIN);
    int alcohol = analogRead(ALCOHOL_SENSOR_PIN);
    
    Serial.print("Helmet Sensor: ");
    Serial.print(helmet);
    Serial.print(" | Alcohol Sensor: ");
    Serial.println(alcohol);
    
    delay(1000);
  }
  
  Serial.println("\n=== TEST COMPLETE ===\n");
}
