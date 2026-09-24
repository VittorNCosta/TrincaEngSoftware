import datetime
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('gate', Path(__file__).parents[1] / 'mobsf_gate.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
SHA = 'a' * 64


def report():
    return {'sha256': SHA, 'app_type': 'apk', 'package_name': 'br.com.mhvtech.trincamania', 'permissions': {}, 'manifest_analysis': {'manifest_findings': []}, 'code_analysis': {'findings': {}}, 'network_security': {}, 'certificate_analysis': {}}


class GateTests(unittest.TestCase):
    def test_normal_report(self):
        self.assertTrue(gate.evaluate(report(), SHA, [])['passed'])

    def test_known_high_fixture(self):
        fixture = report()
        fixture['manifest_analysis']['manifest_findings'] = [{'severity': 'high', 'rule': 'app_debuggable', 'description': 'SAFE SYNTHETIC FIXTURE'}]
        result = gate.evaluate(fixture, SHA, [])
        self.assertFalse(result['passed'])
        self.assertNotIn('SAFE SYNTHETIC', str(result))
        exception = {'id': result['findings'][0]['id'], 'apk_sha256': SHA, 'owner': 'security', 'reason': 'fixture only', 'review': 'local fixture', 'expires': '2026-10-01'}
        self.assertTrue(gate.evaluate(fixture, SHA, [exception], datetime.date(2026, 9, 18))['passed'])
        with self.assertRaises(ValueError):
            gate.evaluate(fixture, SHA, [exception], datetime.date(2026, 10, 2))

    def test_missing_scanner_or_invalid_report_never_green(self):
        for invalid in [{}, {'error': 'scanner unavailable'}, {**report(), 'sha256': 'b' * 64}, {**report(), 'manifest_analysis': {}}]:
            with self.assertRaises(ValueError):
                gate.evaluate(invalid, SHA, [])

    def test_certificate_high_is_not_ignored(self):
        fixture = report()
        fixture['certificate_analysis'] = {'certificate_findings': [['high', 'debug certificate', 'fixture']]}
        self.assertFalse(gate.evaluate(fixture, SHA, [])['passed'])


if __name__ == '__main__':
    unittest.main()
