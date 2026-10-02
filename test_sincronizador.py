"""
Suite de Pruebas Automatizadas de Calidad para el Sincronizador GAMA (v6.5)
Ejecutar con: py test_sincronizador.py
"""
import unittest
from datetime import datetime, date
import re
import os

from sincronizador import (
    parse_fecha_hora,
    parse_trama_alarma,
    traducir_codigo_evento,
    get_chile_offset_info,
    SIA_MAP,
    CID_FALLBACK_MAP
)

class TestSincronizadorGama(unittest.TestCase):

    def setUp(self):
        self.tz_str, self.offset_hours = get_chile_offset_info()

    # ── 1. PRUEBAS DE FECHAS Y HORA (Resolución indestructible) ──
    def test_fechas_chile_estandar(self):
        """ Valida que el formato chileno DD/MM/YYYY se respete siempre y jamás cree fechas futuras """
        # 11 de agosto (DD/MM/YYYY) jamás debe convertirse en 8 de noviembre
        res_ago11 = parse_fecha_hora('11/08/2026', '23:52:21', self.tz_str)
        self.assertTrue(res_ago11.startswith('2026-08-11T23:52:21'), f"11/08/2026 fue mal interpretado como {res_ago11}")

        # 10 de agosto (DD/MM/YYYY) jamás debe convertirse en 8 de octubre
        res_ago10 = parse_fecha_hora('10/08/2026', '20:15:00', self.tz_str)
        self.assertTrue(res_ago10.startswith('2026-08-10T20:15:00'), f"10/08/2026 fue mal interpretado como {res_ago10}")

        # 01 de octubre (DD/MM/YYYY)
        res1 = parse_fecha_hora('01/10/2026', '14:30:00', self.tz_str)
        self.assertTrue(res1.startswith('2026-10-01T14:30:00'))

        # ISO YYYY-MM-DD
        res3 = parse_fecha_hora('2026-10-01', '14:30:00', self.tz_str)
        self.assertTrue(res3.startswith('2026-10-01T14:30:00'))

    def test_fechas_meses_variados(self):
        """ Valida fechas en diversos meses del año """
        # 15 de marzo (p0 > 12 -> día inequívoco)
        res_mar = parse_fecha_hora('15/03/2026', '08:15:20', self.tz_str)
        self.assertTrue(res_mar.startswith('2026-03-15T08:15:20'))

        # 25 de agosto (mes previo válido)
        res_ago = parse_fecha_hora('25/08/2026', '23:59:00', self.tz_str)
        self.assertTrue(res_ago.startswith('2026-08-25T23:59:00'))

    def test_proteccion_anti_futuro(self):
        """ Valida que jamás se emitan fechas en el futuro (ej: noviembre 2026 en octubre 2026) """
        res_fut = parse_fecha_hora('08/11/2026', '12:00:00', self.tz_str)
        # No puede ser noviembre de 2026 (mes 11) si estamos a 2 de octubre
        self.assertFalse('2026-11-08' in res_fut, f"Se emitió una fecha futura no permitida: {res_fut}")

    def test_objetos_nativos_pyodbc(self):
        """ Valida que objetos datetime o date nativos retornados por pyodbc se procesen limpios """
        dt_obj = datetime(2026, 10, 1, 18, 45, 12)
        res_dt = parse_fecha_hora(dt_obj, None, self.tz_str)
        self.assertEqual(res_dt, f"2026-10-01T18:45:12{self.tz_str}")

        d_obj = date(2026, 10, 2)
        res_d = parse_fecha_hora(d_obj, '09:10:05', self.tz_str)
        self.assertEqual(res_d, f"2026-10-02T09:10:05{self.tz_str}")

    def test_parseo_hora_am_pm(self):
        """ Valida soporte de formatos AM/PM y 24h """
        res_pm = parse_fecha_hora('2026-10-01', '03:15:22 PM', self.tz_str)
        self.assertTrue('T15:15:22' in res_pm)

        res_am = parse_fecha_hora('2026-10-01', '12:05:00 AM', self.tz_str)
        self.assertTrue('T00:05:00' in res_am)

    def test_ajuste_horas_mysql(self):
        """ Valida ajuste dinámico entre reloj MySQL (Ecuador UTC-5) y Chile """
        diff_hours = self.offset_hours + 5
        res = parse_fecha_hora('02/10/2026', '09:00:00', self.tz_str, add_hours=diff_hours)
        expected_hour = 9 + diff_hours
        self.assertTrue(f"T{expected_hour:02d}:00:00" in res)

    # ── 2. PRUEBAS DE DECODIFICACIÓN CONTACT ID (CID) ──────────────
    def test_contact_id_decodificacion(self):
        """ Valida tramas reales Contact ID de diversos eventos """
        # Cierre usuario 101
        trama_cl = "5061 18FC28R40100101\x14"
        p_cl = parse_trama_alarma(trama_cl)
        self.assertIsNotNone(p_cl)
        self.assertEqual(p_cl['cuenta'], 'FC28')
        self.assertEqual(p_cl['evento'], 'CIERRE')
        self.assertEqual(p_cl['usuario'], '101')

        # Alarma de Robo Zona 008
        trama_ba = "5061 18FC28E13000008\x14"
        p_ba = parse_trama_alarma(trama_ba)
        self.assertIsNotNone(p_ba)
        self.assertEqual(p_ba['cuenta'], 'FC28')
        self.assertEqual(p_ba['evento'], 'ALARMA DE ROBO')
        self.assertEqual(p_ba['zona'], '008')

        # Autotest
        trama_test = "5021 182921E60200000\x14"
        p_test = parse_trama_alarma(trama_test)
        self.assertIsNotNone(p_test)
        self.assertEqual(p_test['cuenta'], '2921')
        self.assertEqual(p_test['evento'], 'AUTOTEST')

    # ── 3. PRUEBAS DE DECODIFICACIÓN UNIVERSAL SIA (DC-03 / DC-05) ─
    def test_sia_traduccion_completa(self):
        """ Valida que todas las señales críticas SIA se traduzcan al español """
        # Asalto / Holdup (HA)
        trama_ha = "S01001[#C710/HA0001]\x14"
        p_ha = parse_trama_alarma(trama_ha)
        self.assertIsNotNone(p_ha)
        self.assertEqual(p_ha['cuenta'], 'C710')
        self.assertEqual(p_ha['evento'], 'ALARMA DE ASALTO')

        # Emergencia Médica (MA)
        trama_ma = "[#C720|Nri0/MA0002]"
        p_ma = parse_trama_alarma(trama_ma)
        self.assertIsNotNone(p_ma)
        self.assertEqual(p_ma['cuenta'], 'C720')
        self.assertEqual(p_ma['evento'], 'EMERGENCIA MEDICA')

        # Apertura (OP) con usuario 0002
        trama_op = "S01001[#C940|Nri1/OP0002]\x14"
        p_op = parse_trama_alarma(trama_op)
        self.assertIsNotNone(p_op)
        self.assertEqual(p_op['cuenta'], 'C940')
        self.assertEqual(p_op['evento'], 'APERTURA')
        self.assertEqual(p_op['usuario'], '0002')

        # Cierre (CL) con usuario 0040
        trama_cl = "[#C740|Nri0/CL0040]"
        p_cl = parse_trama_alarma(trama_cl)
        self.assertIsNotNone(p_cl)
        self.assertEqual(p_cl['cuenta'], 'C740')
        self.assertEqual(p_cl['evento'], 'CIERRE')
        self.assertEqual(p_cl['usuario'], '0040')

        # Batería Baja Sistema (YT)
        trama_yt = "[#C788/YT0000]"
        p_yt = parse_trama_alarma(trama_yt)
        self.assertIsNotNone(p_yt)
        self.assertEqual(p_yt['cuenta'], 'C788')
        self.assertEqual(p_yt['evento'], 'BATERIA BAJA DEL SISTEMA')

    # ── 4. PRUEBA DE RESILIENCIA Y DEAD-LETTER QUEUE ───────────────
    def test_dead_letter_fallback_jamás_descartar(self):
        """ Valida que tramas exóticas no estándar con cuenta conocida se almacenen con trama cruda """
        trama_exotica = "S01001[#C799|PROTOCOLO_NUEVO_PANEL_DESCONOCIDO_FLAG_01]"
        p_ex = parse_trama_alarma(trama_exotica)
        self.assertIsNotNone(p_ex, "Una trama con cuenta jamás debe ser descartada a None")
        self.assertEqual(p_ex['cuenta'], 'C799')
        self.assertTrue('SEÑAL SIN IDENTIFICAR' in p_ex['evento'])

    # ── 5. PRUEBA DE TIMEZONE OFICIAL DE CHILE ─────────────────────
    def test_timezone_oficial(self):
        """ Valida que el huso horario sea un offset válido (-03:00 o -04:00) """
        self.assertIn(self.tz_str, ['-03:00', '-04:00'])
        self.assertIn(self.offset_hours, [-3, -4])

if __name__ == '__main__':
    unittest.main()
