#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

RF24 radio(9, 10);

const byte rxAddr[6] = "00001";
const byte txAddr[6] = "00002";
const String myRadioKey = "R01";
const int packageSize = 15;
const int LED_YELLOW = 2; // D2
const int LIGHT = A0;

unsigned long previousMillis = 0;
const long interval = 15000;

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

  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LIGHT, OUTPUT);
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
  if (radioType == "LIG" && radioVal == "01")
  {
  Serial.println("On");
    digitalWrite(LIGHT, HIGH);
  }
  if (radioType == "LIG" && radioVal == "00")
  {
  Serial.println("Off");
    digitalWrite(LIGHT, LOW);
  }
}

void loop()
{
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval)
  {
    previousMillis = currentMillis;
  }

  if (radio.available())
  {
    receiveRadio();
  }
}