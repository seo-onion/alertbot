#include <WiFi.h>
#include <WiFiUdp.h>

const int MOTOR = 25;  // GPIO que va a la base del transistor del motor; cámbialo si lo conectan a otro pin
WiFiUDP udp;

void setup() {
  pinMode(MOTOR, OUTPUT);
  WiFi.softAP("AlertBOT", "alertbot123");  // la laptop se conecta a esta red; la pulsera queda en 192.168.4.1
  udp.begin(4210);
}

void loop() {
  if (!udp.parsePacket()) return;
  char orden[8];
  udp.read(orden, sizeof orden);
  udp.beginPacket(udp.remoteIP(), udp.remotePort());
  udp.print("OK");  // responde antes de vibrar para que la laptop mida la latencia
  udp.endPacket();
  digitalWrite(MOTOR, HIGH);
  delay(500);
  digitalWrite(MOTOR, LOW);
}
