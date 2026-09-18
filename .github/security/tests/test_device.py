import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('device', Path(__file__).parents[1] / 'check_device.py')
device = importlib.util.module_from_spec(spec)
spec.loader.exec_module(device)


class DeviceTests(unittest.TestCase):
    def test_flags_and_permissions(self):
        self.assertEqual(device.inspect_dump('br.com.mhvtech.trincamania flags=[ HAS_CODE ]'), [])
        findings = device.inspect_dump('br.com.mhvtech.trincamania pkgFlags=[ DEBUGGABLE ALLOW_BACKUP ] android.permission.RECORD_AUDIO')
        self.assertEqual(len(findings), 3)

    def test_missing_device_output_fails(self):
        with self.assertRaises(ValueError):
            device.inspect_dump('package not found')


if __name__ == '__main__':
    unittest.main()
