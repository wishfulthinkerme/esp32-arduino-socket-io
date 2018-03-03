#include <WiFi.h>
#include <SocketIOClient.h>

#include <SPI.h>
#include <RF24.h>

#define LED_WIFI 14
#define LED_SOCKET 25
#define LED_YELLOW 35

RF24 radio(5, 17); // CE , CSN
const int packageSize = 32;
const byte rxAddr[6] = "00002"; // Receive Satelite data
// const byte txAddr[6] = "00001"; // Send time() to Satelites
const byte txAddr[6] = "00001"; // Send time() to Satelites

// WIFI connection
char *ssid = "I Am Under Your Bed";
char *password = "iamfriendwiththemonster";
char path[] = "/";
char host[] = "192.168.0.101";
int port = 5002;

// Socket connection
SocketIOClient client;
extern String RID;
extern String Rname;
extern String Rcontent;

void initLed()
{
  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_SOCKET, OUTPUT);
  digitalWrite(LED_WIFI, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  digitalWrite(LED_SOCKET, HIGH);
  delay(1000);
  digitalWrite(LED_WIFI, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_SOCKET, LOW);
  delay(1000);
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
}
void initWifi()
{
  delay(10);
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  digitalWrite(LED_WIFI, HIGH);

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}
void initSocket()
{

  if (!client.connect(host, port))
  {
    Serial.println("connection failed");
    return;
  }
  if (client.connected())
  {
    client.send("connection", "message", "Connected !!!!");
  }
}
void setup()
{
  Serial.begin(115200);
  delay(10);
  initLed();
  initWifi();
  initRadio();
  initSocket();
}

void receiveRadio()
{
  if (radio.available())
  {
    char received[packageSize] = {};
    radio.read(&received, sizeof(received));
    Serial.print("Received: ");
    Serial.println(received);
    client.send("radioData", "data", received);
    digitalWrite(LED_YELLOW, HIGH);
    delay(10);
    digitalWrite(LED_YELLOW, LOW);
  }
}

void transmitData(String actionType, String channel)
{
  radio.stopListening();
  char package[packageSize] = {0};
  byte deviceChannel[6] = "";
  for (int i = 0; i < 5; i++)
  {
    deviceChannel[i] = (byte)channel[i];
  }
  Serial.println(String((char *)deviceChannel));
  String(actionType).toCharArray(package, packageSize);
  ;
  radio.openWritingPipe(deviceChannel);
  delay(10);
  bool sent = radio.write(&package, sizeof(package));

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

void loop()
{

  if (!client.connected())
  {
    digitalWrite(LED_SOCKET, LOW);
    while (!client.connect(host, port))
    {
      delay(1000);
    }
  }
  else
  {
    digitalWrite(LED_SOCKET, HIGH);
  }
  if (client.monitor())
  {
    String data = String(Rcontent);
    int commaIndex = data.indexOf(':');
    int secondCommaIndex = data.indexOf(':', commaIndex + 1);
    String deviceId = data.substring(0, commaIndex);
    String deviceChannel = data.substring(commaIndex + 1, secondCommaIndex);
    transmitData(data, deviceChannel);

    delay(30);
  }
  receiveRadio();
}