#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <OneWire.h>
#include <DallasTemperature.h>

RF24 radio(9, 10);

const byte rxAddr[6] = "00001";
const byte txAddr[6] = "00002";
const String myRadioKey = "R05";
const int packageSize = 15;
const int LED_YELLOW = 2; // D2
const int TEMP_SENSOR = A3;

unsigned long previousMillis = 0;
const long interval = 15000;

OneWire oneWire(TEMP_SENSOR);
DallasTemperature sensors(&oneWire);

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
}

void setup()
{
  while (!Serial)
    ;

  Serial.begin(9600);
  Serial.println("Init");
  sensors.begin();

  pinMode(LED_YELLOW, OUTPUT);
  digitalWrite(LED_YELLOW, HIGH);
  delay(10);
  digitalWrite(LED_YELLOW, LOW);
  initRadio();
}

void transmitData(String actionType, String actionValue, String actionDesc)
{
  radio.stopListening();
  char package[packageSize] = {0};
  String(myRadioKey + ":" + actionType + ":" + actionValue).toCharArray(package, packageSize);
  bool sent = radio.write(&package, sizeof(package));
  Serial.print(String(actionDesc + ": "));
  Serial.println(package);
  digitalWrite(LED_YELLOW, HIGH);
  delay(10);
  digitalWrite(LED_YELLOW, LOW);
  if (sent)
  {
    Serial.println("Sent");
  }
  radio.startListening();
}

void receiveRadio()
{
  char received[packageSize] = {};
  radio.read(&received, sizeof(received));
  String radioKey = String(received).substring(0, 3);
  String radioType = String(received).substring(4, 7);
  String radioVal = String(received).substring(8, 15);
  Serial.println(radioKey);
  Serial.println(radioType);
  if (radioKey != myRadioKey)
  {
    return;
  }
  digitalWrite(LED_YELLOW, HIGH);
  delay(10);
  digitalWrite(LED_YELLOW, LOW);
  if (radioType == "STP")
  {
    sensors.requestTemperatures();
    transmitData("VAL", String(sensors.getTempCByIndex(0)), "Temp: ");
  }
}

void loop()
{
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval)
  {

    previousMillis = currentMillis;

    sensors.requestTemperatures();
    transmitData("VAL", String(sensors.getTempCByIndex(0)), "Temp: ");
  }
  if (radio.available())
  {
    receiveRadio();
  }
}