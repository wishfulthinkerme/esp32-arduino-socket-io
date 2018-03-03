#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <TrueRandom.h>
#include <EEPROM.h>

RF24 radio(9, 10);

// Security - Channel & uniqId
const int uniqIdSize = 15;
String uniqId;

// Radio
const int channelSize = 5;
byte rxAddr[channelSize] = "00000";       // Our base will set this up
const byte txAddr[channelSize] = "00002"; // Always the same
const String myRadioKey = "R05";

// Pins
const int packageSize = 32;
const int LED_YELLOW = 2;

// Intervals
unsigned long previousMillis = 0;
const long heartBeatInterval = 10000;

void saveUniqId()
{
  uniqId = generateUniqId();
  for (int i = 0; i < uniqIdSize; i++)
  {
    EEPROM.write(i, uniqId[i]);
  }
}

void initUniqId()
{
  for (int i = 0; i < uniqIdSize; i++)
  {
    char value = EEPROM.read(i);
    if (!value)
    {
      Serial.println("Save new id");
      saveUniqId();
    }
    uniqId = uniqId + String(value);
  }
}

String generateUniqId()
{
  int a, b, c, d;
  String id = "";
  a = TrueRandom.random(100, 999);
  b = TrueRandom.random(100, 999);
  c = TrueRandom.random(100, 999);
  d = TrueRandom.random(100, 999);
  id = String(a) + "-" + String(b) + "-" + String(c) + "-" + String(d);
  return id;
}

void initRadio()
{
  radio.begin();
  radio.setRetries(15, 15);
  radio.setAutoAck(true);
  radio.enableAckPayload();
  radio.enableDynamicPayloads();
  radio.openReadingPipe(0, rxAddr);
  radio.openWritingPipe(txAddr);
  radio.startListening();
  const String initPackage = String((char *)rxAddr);
  transmitData("CHANNEL", initPackage);
  transmitData("TYPE", "LIGHT");
}

void createChannel()
{
  int channelId = TrueRandom.random(1000, 9999);
  String t = String(channelId);
  t = "0" + t;
  for (int i = 0; i <= channelSize; i++)
  {
    EEPROM.write(uniqIdSize + i, (byte)t[i]);
  }
}

void initChannel()
{
  byte temp[channelSize] = "";
  int b = 0;
  for (int i = uniqIdSize; i < uniqIdSize + channelSize; i++)
  {
    byte value = EEPROM.read(i);
    if (!value)
    {
      Serial.println("new channel");
      createChannel();
      break;
    }
    temp[b] = value;
    b++;
  }

  strncpy(rxAddr, temp, channelSize);
}

void setup()
{
  while (!Serial)
    ;
  Serial.begin(9600);
  Serial.println("Init");
  initChannel(); // Set or create channel id like 12345
  initUniqId();  // Set or create uuid like 123-123-123-123
  initRadio();

  Serial.println(uniqId);
  Serial.println(String((char *)rxAddr));

  pinMode(LED_YELLOW, OUTPUT);
  blinkLed();
}

void blinkLed()
{
  digitalWrite(LED_YELLOW, HIGH);
  delay(10);
  digitalWrite(LED_YELLOW, LOW);
}

void transmitData(String actionType, String actionValue)
{
  radio.stopListening();
  char package[packageSize] = {0};
  String(String(uniqId) + ":" + actionType + ":" + actionValue).toCharArray(package, packageSize);
  bool sent = radio.write(&package, sizeof(package));
  Serial.println(package);
  blinkLed();
  radio.startListening();
}

void receiveRadio()
{
  char received[packageSize] = {};
  radio.read(&received, sizeof(received));
  String radioType = String(received).substring(4, 7);
  String radioVal = String(received).substring(8, 15);
  int commaIndex = String(received).indexOf(':');
  int secondCommaIndex = String(received).indexOf(':', commaIndex + 1);
  String deviceId = String(received).substring(0, commaIndex);
  if (deviceId != uniqId)
  {
    return;
  }
  blinkLed();
}

void heartBeat(unsigned long currentMillis)
{

  if (currentMillis - previousMillis >= heartBeatInterval)
  {
    // Send Heartbeat that you are alive
    previousMillis = currentMillis;
    transmitData("HEARTBEAT", "OK");
  }
}

void loop()
{
  unsigned long currentMillis = millis();
  heartBeat(currentMillis);
  if (radio.available())
  {
    receiveRadio();
  }
}