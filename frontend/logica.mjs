export const OJO_IZQ = [362, 385, 387, 263, 373, 380]
export const OJO_DER = [33, 160, 158, 133, 153, 144]
export const ajustes = { factor: 0.7, grados: 20, segundos: 1.0, espera: 3.0, calibracion: 3.0, repeticiones: 10 }

const distancia = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const mediana = v => { const s = [...v].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const redondear = x => Math.round(x * 10) / 10

export const ear = p => (distancia(p[1], p[5]) + distancia(p[2], p[4])) / (2 * distancia(p[0], p[3]))
// MediaPipe entrega la matriz por columnas: (fila f, columna c) = data[c * 4 + f]
export const inclinacion = data => Math.atan2(data[6], data[10]) * 180 / Math.PI
export const diferencia = (a, b) => ((a - b + 180) % 360 + 360) % 360 - 180

export class Detector {
  desde = null

  actualizar(signo, t) {
    if (!signo) {
      this.desde = null
      return false
    }
    this.desde ??= t
    return t - this.desde >= ajustes.segundos
  }
}

export class Monitor {
  base = null
  calibracion = null
  pendiente = null
  esperaHasta = 0
  alertas = 0
  ojos = new Detector()
  cabeza = new Detector()
  sesion = []
  participante = ''
  total = 0
  modo = 'sonido'
  alAlertar = () => {}

  calibrar(t) {
    this.calibracion = { hasta: t + ajustes.calibracion, datos: [] }
  }

  sinRostro() {
    this.ojos.desde = this.cabeza.desde = null
    return this.pendiente ? 'alerta' : 'sin_rostro'
  }

  revisar(e, inc, t) {
    const c = this.calibracion
    if (c) {
      c.datos.push([e, inc])
      if (t < c.hasta || c.datos.length < 10) return 'calibrando'
      this.base = [mediana(c.datos.map(d => d[0])), mediana(c.datos.map(d => d[1]))]
      this.calibracion = null
    }
    if (this.pendiente) return 'alerta'
    if (!this.base) return 'sin_calibrar'
    const cerrados = this.ojos.actualizar(e < this.base[0] * ajustes.factor, t)
    const cabeceo = this.cabeza.actualizar(Math.abs(diferencia(inc, this.base[1])) > ajustes.grados, t)
    if (t < this.esperaHasta) return 'pausa'
    if (!cerrados && !cabeceo) return 'vigilando'
    this.disparar(cerrados ? 'ojos cerrados' : 'cabeceo')
    return 'alerta'
  }

  disparar(signo, tipo = null) {
    let rep = ''
    if (tipo === null && this.sesion.length) {
      tipo = this.sesion.shift()
      rep = this.total - this.sesion.length
    }
    this.pendiente = { id: ++this.alertas, tipo: tipo ?? this.modo, signo, rep, latencia: null }
    this.ojos.desde = this.cabeza.desde = null
    this.alAlertar(this.pendiente)
  }

  probar() {
    if (!this.pendiente) this.disparar('prueba', this.modo)
  }

  iniciarSesion(participante) {
    this.sesion = Array.from({ length: ajustes.repeticiones }, () => ['sonido', 'vibracion']).flat()
    for (let i = this.sesion.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.sesion[i], this.sesion[j]] = [this.sesion[j], this.sesion[i]]
    }
    this.participante = participante || 'sin-codigo'
    this.total = this.sesion.length
  }

  // rt = null cuando la pulsera no respondió
  reaccionar(id, rt, t) {
    const a = this.pendiente
    if (!a || a.id !== id) return null
    this.pendiente = null
    this.esperaHasta = t + ajustes.espera
    const invalida = rt === null || (a.tipo === 'vibracion' && a.latencia === null)
    return {
      id, participante: this.participante, repeticion: a.rep, alerta: a.tipo, signo: a.signo,
      reaccion_ms: rt === null ? '' : redondear(rt),
      latencia_ms: a.latencia ?? '',
      reaccion_valida_ms: invalida ? '' : redondear(rt - (a.latencia ?? 0)),
    }
  }
}
