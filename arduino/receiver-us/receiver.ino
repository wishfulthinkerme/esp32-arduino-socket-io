#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

RF24 radio(9, 10);

const byte rxAddr[6] = "00001";
const byte txAddr[6] = "00002";
const String myRadioKey = "R02";
const int packageSize = 15;

const int LED_YELLOW = 2; // D2
const int TRIG_PIN = A5;
const int ECHO_PIN = A4;

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
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
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
  if (radio.available())
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
    if (radioType == "STP")
    {
      int distance = checkDistance();
      transmitData("VAL", String(distance), "CM: ");
    }
    Serial.println(radioType);
    Serial.println(radioVal);
    digitalWrite(LED_YELLOW, HIGH);
    delay(10);
    digitalWrite(LED_YELLOW, LOW);
  }
}
int checkDistance()
{
  long time, distance;

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  time = pulseIn(ECHO_PIN, HIGH);
  distance = time / 58;

  return distance;
}
void loop()
{
  long time;
  int distance = checkDistance();
  if (distance < 10)
  {
    transmitData("VAL", String(distance), "CM: ");
  }
  receiveRadio();
  delay(30);
}