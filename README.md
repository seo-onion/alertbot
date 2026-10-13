# Alert-BOT

Detecta ojos cerrados y cabeceo con la cámara de la laptop, directamente en el navegador, y mide el tiempo de reacción ante una alerta de sonido o de vibración.

## Versión web

Abre el link del equipo en Chrome, Edge o Firefox y permite la cámara. No hay que instalar nada.

## Versión local (necesaria para la pulsera)

Requiere Python 3.9 o más reciente, sin librerías extra. Dentro de esta carpeta:

```
python backend/app.py
```

En Mac es `python3`, en Windows `py`. Se abre `http://localhost:8765`. Para la vibración, conecta antes la laptop a la WiFi `AlertBOT` (clave `alertbot123`). Para salir: `Ctrl+C`.

## Publicar con Docker

```
docker compose -p alertbot up -d --build
docker compose -p alertbot logs tunel | grep trycloudflare
```

El segundo comando muestra el link https público. Los resultados quedan en el volumen `datos`.

## Pruebas

```
node --test pruebas/*.test.mjs
python -m pytest backend
```

## Pulsera

`pulsera/pulsera.ino`: ábrelo en Arduino IDE con la placa ESP32. Crea la red WiFi `AlertBOT` y responde `OK` a cada orden `V` antes de vibrar.
