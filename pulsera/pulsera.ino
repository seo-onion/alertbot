#include <BLEDevice.h>
#include <BLEServer.h>

const int MOTOR = 3;  // GPIO que va a la base del transistor del motor; cámbialo si lo conectan a otro pin
const char *SERVICIO = "2ccd091a-b41e-45bc-8c69-c1bd623320ee";  // los mismos UUID que en frontend/index.html
const char *ORDEN = "baeae5b5-1a39-426a-9fdd-ced41d29097c";
volatile bool vibrar = false;

struct AlEscribir : BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override { vibrar = true; }  // la escritura se confirma antes de vibrar; con eso la página mide la latencia
};

struct AlDesconectar : BLEServerCallbacks {
  void onDisconnect(BLEServer *s) override { BLEDevice::startAdvertising(); }  // vuelve a aparecer para la próxima conexión
};

void setup() {
  pinMode(MOTOR, OUTPUT);
  BLEDevice::init("AlertBOT");
  BLEServer *servidor = BLEDevice::createServer();
  servidor->setCallbacks(new AlDesconectar());
  BLEService *servicio = servidor->createService(SERVICIO);
  servicio->createCharacteristic(ORDEN, BLECharacteristic::PROPERTY_WRITE)->setCallbacks(new AlEscribir());
  servicio->start();
  BLEAdvertising *anuncio = BLEDevice::getAdvertising();
  anuncio->addServiceUUID(SERVICIO);
  anuncio->setScanResponse(true);
  BLEDevice::startAdvertising();
}

void loop() {
  delay(1);
  if (!vibrar) return;
  vibrar = false;
  digitalWrite(MOTOR, HIGH);
  delay(500);
  digitalWrite(MOTOR, LOW);
}
