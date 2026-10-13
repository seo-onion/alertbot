import assert from 'node:assert/strict'
import test from 'node:test'
import { ajustes, Detector, diferencia, ear, inclinacion, Monitor } from '../frontend/logica.mjs'

test('EAR de ojo abierto y cerrado', () => {
  assert.equal(ear([[0, 0], [3, 3], [7, 3], [10, 0], [7, -3], [3, -3]]), 0.6)
  assert.ok(ear([[0, 0], [3, 0.2], [7, 0.2], [10, 0], [7, -0.2], [3, -0.2]]) < 0.05)
})

test('la inclinación sale de la matriz guardada por columnas', () => {
  const a = Math.PI / 6, c = Math.cos(a), s = Math.sin(a)
  assert.equal(Math.round(inclinacion([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1])), 30)
})

test('la diferencia de ángulos cruza 180°', () => {
  assert.equal(diferencia(179, -179), -2)
  assert.equal(diferencia(-179, 179), 2)
})

test('el signo debe durar el tiempo mínimo', () => {
  const d = new Detector()
  assert.ok(!d.actualizar(true, 0))
  assert.ok(!d.actualizar(true, 0.9))
  assert.ok(d.actualizar(true, 1.0))
  assert.ok(!d.actualizar(false, 1.1))
  assert.ok(!d.actualizar(true, 1.2))
})

test('ojos cerrados 1 s disparan la alerta y la reacción arma la fila', () => {
  const m = new Monitor()
  m.base = [0.3, 0]
  for (let i = 0; i < 10; i++) m.revisar(0.1, 0, i / 10)
  assert.equal(m.pendiente, null)
  assert.equal(m.revisar(0.1, 0, 1.0), 'alerta')
  const fila = m.reaccionar(m.pendiente.id, 412.5, 1.5)
  assert.equal(fila.reaccion_valida_ms, 412.5)
  assert.equal(m.revisar(0.1, 0, 2.0), 'pausa')
})

test('un parpadeo normal no alerta', () => {
  const m = new Monitor()
  m.base = [0.3, 0]
  for (const t of [0, 0.1, 0.2]) m.revisar(0.1, 0, t)
  m.revisar(0.3, 0, 0.3)
  m.revisar(0.1, 0, 1.1)
  assert.equal(m.pendiente, null)
})

test('la calibración usa la mediana y fija el umbral', () => {
  const m = new Monitor()
  m.calibrar(0)
  for (let i = 0; i < 31; i++) m.revisar(i === 5 ? 0.9 : 0.25, 2, i / 10)
  assert.deepEqual(m.base, [0.25, 2])
})

test('probar alerta no gasta repeticiones de la sesión', () => {
  const m = new Monitor()
  m.iniciarSesion('P1')
  m.probar()
  assert.equal(m.pendiente.signo, 'prueba')
  assert.equal(m.pendiente.rep, '')
  assert.equal(m.sesion.length, 20)
})

test('la sesión trae 10 de cada alerta y numera las repeticiones', () => {
  const m = new Monitor()
  m.iniciarSesion('P1')
  assert.equal(m.sesion.filter(x => x === 'sonido').length, 10)
  m.disparar('ojos cerrados')
  assert.equal(m.pendiente.rep, 1)
})

test('sin respuesta de la pulsera la vibración es inválida', () => {
  const m = new Monitor()
  m.modo = 'vibracion'
  m.probar()
  assert.equal(m.reaccionar(m.pendiente.id, 300, 1).reaccion_valida_ms, '')
})

test('los ajustes cambian el tiempo mínimo', () => {
  ajustes.segundos = 2
  const d = new Detector()
  d.actualizar(true, 0)
  assert.ok(!d.actualizar(true, 1.5))
  assert.ok(d.actualizar(true, 2))
  ajustes.segundos = 1
})
