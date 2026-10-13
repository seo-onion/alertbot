import json
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import pytest

import app


@pytest.fixture
def url(tmp_path, monkeypatch):
    monkeypatch.setattr(app, 'CSV', tmp_path / 'r.csv')
    servidor = ThreadingHTTPServer(('127.0.0.1', 0), app.Servidor)
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    yield f'http://127.0.0.1:{servidor.server_port}'
    servidor.shutdown()


def pedir(url, datos=None):
    cuerpo = None if datos is None else json.dumps(datos).encode()
    with urllib.request.urlopen(urllib.request.Request(url, cuerpo)) as r:
        return r.headers, r.read()


def test_sirve_la_pagina_y_el_wasm_con_su_tipo(url):
    assert pedir(url + '/')[0]['Content-Type'].startswith('text/html')
    assert pedir(url + '/vendor/mediapipe/wasm/vision_wasm_internal.wasm')[0]['Content-Type'] == 'application/wasm'


def test_no_deja_leer_fuera_de_frontend(url):
    with pytest.raises(urllib.error.HTTPError) as e:
        urllib.request.urlopen(url + '/../backend/app.py')
    assert e.value.code == 404


def test_la_reaccion_se_guarda_y_se_descarga_en_csv(url):
    pedir(url + '/reaccion', {'participante': '=P01!', 'repeticion': 3, 'alerta': 'sonido', 'signo': 'ojos cerrados',
                              'reaccion_ms': 412.5, 'reaccion_valida_ms': 412.5})
    cabeceras, csv = pedir(url + '/resultados.csv')
    assert 'attachment' in cabeceras['Content-Disposition']
    assert ',P01,3,sonido,ojos cerrados,412.5,,412.5' in csv.decode()


def test_sin_pulsera_la_latencia_es_nula(url):
    assert json.loads(pedir(url + '/vibrar', {})[1]) == {'latencia_ms': None}
