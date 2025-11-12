/*
 * Smart Helmet Safety System - ESP32 RECEIVER (On Bike)
 * 
 * This code:
 * 1. Receives RF signals from ESP8266 transmitter (on helmet)
 * 2. Controls motor based on received signals
 * 3. Displays status on LCD
 * 4. Sends data to Flask backend server via HTTP POST
 * 
 * Hardware Requirements:
 * - ESP32
 * - RF 433MHz Receiver Module
 * - L298N Motor Driver
 * - LCD I2C Display (16x2)
 * - DC Motor (for ignition simulation)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <RCSwitch.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ==================== CONFIGURATION ====================
// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";           // Change to your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Change to your WiFi password

// Flask Server Configuration
const char* serverIP = "192.168.1.100";        // Change to your computer's IP address
const int serverPort = 5001;                   // Flask server port
const char* bikeId = "BIKE123";                // Your bike ID (must match transmitter)

// Pin Configuration
#define IN1 26                                 // Motor driver IN1
#define IN2 27                                 // Motor driver IN2
#define ENA 25                                 // Motor driver ENA (PWM)
#define RF_RX_PIN 4                            // RF receiver data pin

// Motor Speed
#define MOTOR_SPEED 200                        // PWM value (0-255)

// Update Interval
const unsigned long SERVER_UPDATE_INTERVAL = 5000;  // Send to server every 5 seconds

// ==================== GLOBAL VARIABLES ====================
RCSwitch mySwitch = RCSwitch();
LiquidCrystal_I2C lcd(0x27, 16, 2);            // LCD address 0x27, try 0x3F if not working

bool motorRunning = false;
bool helmetWorn = false;
bool alcoholDetected = false;
String currentStatus = "Waiting...";
unsigned long lastRFReceived = 0;
unsigned long lastServerUpdate = 0;
int lastRFCode = 0;

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n=================================");
  Serial.println("Smart Helmet Safety System");
  Serial.println("ESP32 RECEIVER (On Bike)");
  Serial.println("=================================\n");
  
  // Initialize RF receiver
  mySwitch.enableReceive(RF_RX_PIN);
  Serial.println("✓ RF Receiver initialized on pin 4");
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Helmet");
  lcd.setCursor(0, 1);
  lcd.print("Receiver Ready");
  delay(2000);
  lcd.clear();
  Serial.println("✓ LCD initialized");
  
  // Initialize motor pins
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(ENA, OUTPUT);
  stopMotor();
  Serial.println("✓ Motor driver initialized");
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("\n✓ System Ready!");
  Serial.println("📡 Waiting for RF signals from helmet...\n");
  
  updateLCD("System Ready", "Waiting...");
}

// ==================== MAIN LOOP ====================
void loop() {
  unsigned long currentMillis = millis();
  
  // Check WiFi connection periodically
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected! Reconnecting...");
    connectWiFi();
  }
  
  // Check for RF signals
  if (mySwitch.available()) {
    handleRFSignal();
  }
  
  // Check for timeout (no signal received for 10 seconds)
  if (currentMillis - lastRFReceived > 10000 && motorRunning) {
    Serial.println("⚠ No signal timeout - Stopping motor for safety");
    stopMotor();
    updateLCD("Signal Lost", "Motor Stopped");
    currentStatus = "Signal Timeout";
  }
  
  // Send status to Flask server periodically
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
  } else {
    Serial.println("\n✗ WiFi Connection Failed!");
    Serial.println("⚠ Will continue with RF control only");
  }
}

// ==================== HANDLE RF SIGNAL ====================
void handleRFSignal() {
  unsigned long msg = mySwitch.getReceivedValue();
  lastRFReceived = millis();
  lastRFCode = msg;
  
  Serial.print("📩 RF Received: ");
  Serial.print(msg);
  Serial.print(" → ");
  
  lcd.clear();
  lcd.setCursor(0, 0);
  
  switch (msg) {
    case 1001:  // START - Helmet OK, No Alcohol
      lcd.print("Helmet OK");
      lcd.setCursor(0, 1);
      lcd.print("Motor Starting");
      Serial.println("START (Motor ON)");
      currentStatus = "Running";
      helmetWorn = true;
      alcoholDetected = false;
      startMotor();
      break;
      
    case 1002:  // ALCOHOL - Alcohol Detected
      lcd.print("Alcohol Detected");
      lcd.setCursor(0, 1);
      lcd.print("Not Allowed");
      Serial.println("ALCOHOL (Motor BLOCKED)");
      currentStatus = "Alcohol Detected";
      helmetWorn = true;
      alcoholDetected = true;
      stopMotor();
      break;
      
    case 1003:  // NOHELMET - Helmet Not Worn
      lcd.print("Helmet Not Worn");
      lcd.setCursor(0, 1);
      lcd.print("Not Allowed");
      Serial.println("NOHELMET (Motor BLOCKED)");
      currentStatus = "No Helmet";
      helmetWorn = false;
      alcoholDetected = false;
      stopMotor();
      break;
      
    case 1004:  // OPEN - Helmet Opened
      lcd.print("Helmet Open");
      lcd.setCursor(0, 1);
      lcd.print("Not Allowed");
      Serial.println("OPEN (Motor BLOCKED)");
      currentStatus = "Helmet Opened";
      helmetWorn = false;
      alcoholDetected = false;
      stopMotor();
      break;
      
    default:
      lcd.print("Unknown Signal");
      lcd.setCursor(0, 1);
      lcd.print("Code: ");
      lcd.print(msg);
      Serial.print("Unknown RF Code: ");
      Serial.println(msg);
      currentStatus = "Unknown Signal";
      stopMotor();
      break;
  }
  
  mySwitch.resetAvailable();
  
  // Send immediate update to server on status change
  sendStatusToServer();
}

// ==================== MOTOR CONTROL ====================
void startMotor() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, MOTOR_SPEED);
  motorRunning = true;
  Serial.println("🟢 Motor: ON");
}

void stopMotor() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);
  motorRunning = false;
  Serial.println("🔴 Motor: OFF");
}

// ==================== LCD UPDATE ====================
void updateLCD(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
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
  doc["ignitionStatus"] = motorRunning ? "on" : "blocked";
  doc["motorRunning"] = motorRunning;
  doc["status"] = currentStatus;
  doc["lastRFCode"] = lastRFCode;
  doc["signalAge"] = (millis() - lastRFReceived) / 1000;  // seconds since last signal
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Prepare HTTP POST request
  HTTPClient http;
  String url = "http://" + String(serverIP) + ":" + String(serverPort) + "/api/hardware/status";
  
  http.begin(url);
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
        
        // Server can override local control (optional)
        if (!serverIgnitionAllowed && motorRunning) {
          Serial.println("⚠ Server override: Stopping motor");
          stopMotor();
          updateLCD("Server Block", "Motor Stopped");
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

// ==================== STATUS PRINT ====================
void printStatus() {
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("📊 CURRENT STATUS");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.print("🪖 Helmet: ");
  Serial.println(helmetWorn ? "✓ WORN" : "✗ NOT WORN");
  Serial.print("🍺 Alcohol: ");
  Serial.println(alcoholDetected ? "✗ DETECTED" : "✓ CLEAR");
  Serial.print("🏍️ Motor: ");
  Serial.println(motorRunning ? "✓ RUNNING" : "✗ STOPPED");
  Serial.print("📡 Last RF: ");
  Serial.println(lastRFCode);
  Serial.print("⏱️ Signal Age: ");
  Serial.print((millis() - lastRFReceived) / 1000);
  Serial.println(" seconds");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
