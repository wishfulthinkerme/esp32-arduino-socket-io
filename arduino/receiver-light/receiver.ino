#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

RF24 radio(9, 10);

const byte rxAddr[6] = "00001";
const String myRadioKey = "R01";
const int packageSize = 15;
const int LED_YELLOW = 2; // D2
const int LIGHT = A0;

void initRadio()
{
  radio.begin();
  radio.setRetries(15, 15);
  radio.setAutoAck(true);
  radio.enableAckPayload();
  radio.enableDynamicPayloads();
  radio.openReadingPipe(0, rxAddr);

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

void receiveRadio()
{
  char received[packageSize] = {};
  radio.read(&received, sizeof(received));
  String radioKey = String(received).substring(0, 3);
  String radioType = String(received).substring(4, 7);
  String radioVal = String(received).substring(8, 15);

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
  if (radio.available())
  {
    receiveRadio();
  }
}