# Alert-BOT

Detecta ojos cerrados y cabeceo con la cámara de la laptop, directamente en el navegador, y mide el tiempo de reacción ante una alerta de sonido o de vibración.

## Versión web

Abre el link del equipo en Chrome, Edge o Firefox y permite la cámara. No hay que instalar nada.

## Correrlo en tu laptop desde GitHub

No hay nada que compilar: el servidor usa solo Python, sin librerías extra, y la detección corre en el navegador. La versión local es la que se usa con la pulsera.

1. Instala Python 3.9 o más reciente desde [python.org](https://www.python.org/downloads/). En Windows marca **Add python.exe to PATH** en el instalador. Mac y Linux ya suelen traerlo.
2. Descarga el proyecto, de una de estas dos formas:
   - **Sin git:** en esta página, botón verde **Code** → **Download ZIP**. Descomprímelo; la carpeta se llama `alertbot-main`.
   - **Con git:** `git clone https://github.com/seo-onion/alertbot.git`
3. Abre una terminal dentro de esa carpeta:
   - Windows: abre la carpeta, clic derecho en un espacio vacío → **Abrir en Terminal**.
   - Mac: clic derecho en la carpeta → **Nuevo terminal en la carpeta**.
   - Linux: `cd` hasta la carpeta.
4. Corre el comando de tu sistema:

   | Sistema | Comando |
   | --- | --- |
   | Windows | `py backend/app.py` |
   | Mac | `python3 backend/app.py` |
   | Linux | `python3 backend/app.py` |

5. Se abre `http://localhost:8765`. Permite la cámara, presiona **Calibrar ahora** mirando al frente 3 s y luego cierra los ojos 1 s: suena el pitido y presionas ESPACIO.

Para salir: `Ctrl+C` en la terminal. Los resultados quedan en `resultados.csv`, dentro de la carpeta, y también se bajan con **Descargar CSV**.

Para actualizar: con git, `git pull`; sin git, baja el ZIP de nuevo.

| Si ves esto | Arreglo |
| --- | --- |
| `python` o `py` no se reconoce | Reinstala Python marcando **Add python.exe to PATH**, o prueba con `python` en lugar de `py` |
| `Address already in use` | Ya hay un Alert-BOT abierto; ciérralo con `Ctrl+C` en su terminal |
| El navegador no pide la cámara | Entra exactamente a `http://localhost:8765`; con la IP de la laptop no funciona |
| No suena el pitido | Haz clic en cualquier parte de la página; el navegador bloquea el audio hasta el primer clic |

### Con la pulsera

1. Carga `pulsera/pulsera.ino` al ESP32 desde Arduino IDE (placa ESP32).
2. Conecta la laptop a la WiFi `AlertBOT` (clave `alertbot123`).
3. Corre `backend/app.py` como arriba y elige **Vibración** en la página.

La pulsera responde `OK` a cada orden `V` antes de vibrar; con eso la página mide la latencia.

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

La primera necesita Node.js 18 o más reciente; la segunda, `pip install pytest`.
