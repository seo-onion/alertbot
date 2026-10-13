import csv
import json
import os
import re
import socket
import threading
import time
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

AQUI = Path(__file__).resolve().parent
FRONT = (AQUI.parent / 'frontend').resolve()
CSV = Path(os.environ.get('ALERTBOT_CSV', AQUI.parent / 'resultados.csv'))
HOST = os.environ.get('ALERTBOT_HOST', '127.0.0.1')
PUERTO = 8765
PULSERA = ('192.168.4.1', 4210)
CAMPOS = ['fecha', 'participante', 'repeticion', 'alerta', 'signo', 'reaccion_ms', 'latencia_ms', 'reaccion_valida_ms']
TIPOS = {'.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript',
         '.wasm': 'application/wasm', '.woff2': 'font/woff2'}
lock = threading.Lock()


def guardar(d):
    fila = {c: str(d.get(c, ''))[:40] for c in CAMPOS}
    fila['fecha'] = datetime.now().isoformat(timespec='seconds')
    fila['participante'] = re.sub(r'[^\w-]', '', fila['participante'])
    with lock:
        nuevo = not CSV.exists()
        with open(CSV, 'a', newline='') as f:
            w = csv.writer(f)
            if nuevo:
                w.writerow(CAMPOS)
            w.writerow(fila.values())


def vibrar():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.settimeout(0.5)
        t0 = time.perf_counter()
        try:
            s.sendto(b'V', PULSERA)
            s.recv(16)
            return round((time.perf_counter() - t0) * 500, 1)  # mitad de la ida y vuelta, en ms
        except OSError:
            return None


class Servidor(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def responder(self, cuerpo, tipo, adjunto=None, cache=False):
        self.send_response(200)
        self.send_header('Content-Type', tipo)
        self.send_header('Content-Length', str(len(cuerpo)))
        self.send_header('Cache-Control', 'max-age=86400' if cache else 'no-cache')
        if adjunto:
            self.send_header('Content-Disposition', f'attachment; filename="{adjunto}"')
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_GET(self):
        ruta = self.path.split('?')[0]
        if ruta == '/resultados.csv':
            with lock:
                cuerpo = CSV.read_bytes() if CSV.exists() else (','.join(CAMPOS) + '\r\n').encode()
            return self.responder(cuerpo, 'text/csv; charset=utf-8', f'resultados-{datetime.now():%Y-%m-%d}.csv')
        archivo = (FRONT / (ruta.lstrip('/') or 'index.html')).resolve()
        if FRONT not in archivo.parents or not archivo.is_file():
            return self.send_error(404)
        self.responder(archivo.read_bytes(), TIPOS.get(archivo.suffix, 'application/octet-stream'),
                       cache=archivo.suffix in ('.wasm', '.task', '.woff2'))

    def do_POST(self):
        d = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))) or '{}')
        if self.path == '/reaccion':
            guardar(d)
            return self.responder(b'{}', 'application/json')
        if self.path == '/vibrar':
            return self.responder(json.dumps({'latencia_ms': vibrar()}).encode(), 'application/json')
        self.send_error(404)


if __name__ == '__main__':
    servidor = ThreadingHTTPServer((HOST, PUERTO), Servidor)
    url = f'http://localhost:{PUERTO}'
    print(f'Alert-BOT listo en {url} (Ctrl+C para salir)', flush=True)
    if HOST == '127.0.0.1':
        webbrowser.open(url)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
