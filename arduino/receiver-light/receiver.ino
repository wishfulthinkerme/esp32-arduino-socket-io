#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <TrueRandom.h>
#include <EEPROM.h>

RF24 radio(9, 10);

// Security - Channel & uniqId
const int uniqIdSize = 16;
const int channelSize = 6;
String uniqId;

struct Setup
{
  char id[uniqIdSize];
  char channel[channelSize];
};

// Radio
byte rxAddr[channelSize] = "00000";       // Our base will set this up
const byte txAddr[channelSize] = "00002"; // Always the same

// Pins
const int packageSize = 32;
const int LED_YELLOW = 2;
const int LIGHT = A0;

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

void initSetup()
{
  Setup currentSetup;
  EEPROM.get(0, currentSetup);

  if (String(currentSetup.id).length() != 15 || String(currentSetup.channel).length() != 5)
  {
    Setup newSetup;
    String channelNumber = "0" + String(TrueRandom.random(1000, 9999));
    generateUniqId().toCharArray(newSetup.id, uniqIdSize);
    channelNumber.toCharArray(newSetup.channel, channelSize);

    EEPROM.put(0, newSetup);
    currentSetup = newSetup;
  }
  uniqId = String(currentSetup.id);
  strcpy(rxAddr, currentSetup.channel);
  delay(30);
}

void setup()
{
  while (!Serial)
    ;
  Serial.begin(9600);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LIGHT, OUTPUT);
  initSetup();
  Serial.println(uniqId);
  Serial.println(String((char *)rxAddr));
  initRadio();

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
  blinkLed();
  radio.startListening();
}

void receiveRadio()
{
  char received[packageSize] = {};
  radio.read(&received, sizeof(received));

  char deviceId[15], channelId[6], radioType[5], radioVal[6];
  int result = sscanf(received, "%15[^:]:%6[^:]:%5[^:]:%s", &deviceId, &channelId, &radioType, &radioVal);

  if (String(deviceId) != uniqId)
  {
    return;
  }
  // SET LIGHT
  if (String(radioType) == "SETV")
  {
    setLight(String(radioVal));
  }

  blinkLed();
}

void setLight(String val)
{
  if (val == "ON")
  {
    digitalWrite(LIGHT, HIGH);
  }
  else
  {
    digitalWrite(LIGHT, LOW);
  }
  transmitData("VALUE", val);
}

void loop()
{
  ;

  if (radio.available())
  {
    receiveRadio();
  }
}