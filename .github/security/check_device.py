#!/usr/bin/env python3
"""Limited runtime manifest/permission checks on an explicitly isolated emulator."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

PACKAGE = 'br.com.mhvtech.trincamania'


def inspect_dump(text):
    flags = re.findall(r'(?:pkgFlags|flags)=\[([^\]]*)\]', text)
    if not flags or PACKAGE not in text:
        raise ValueError('Package dump incompleto')
    flags = set(' '.join(flags).split())
    findings = []
    if 'DEBUGGABLE' in flags:
        findings.append('release-debuggable')
    if 'ALLOW_BACKUP' in flags:
        findings.append('backup-enabled-review-required')
    for permission in ['RECORD_AUDIO', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION', 'READ_SMS']:
        if f'android.permission.{permission}' in text:
            findings.append('unexpected-permission-' + permission)
    return findings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--serial', required=True)
    parser.add_argument('--apk', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--commit', required=True)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    digest = hashlib.sha256(args.apk.read_bytes()).hexdigest()
    if manifest.get('sha256') != digest or manifest.get('commit') != args.commit or manifest.get('status') != 'FINISHED' or manifest.get('artifact') != 'app.apk':
        raise ValueError('Build/APK não verificado')
    if not re.fullmatch(r'emulator-\d+', args.serial):
        raise ValueError('Somente emulador dedicado; não aceitar aparelho pessoal')
    adb = lambda *parts: subprocess.check_output(['adb', '-s', args.serial, *parts], text=True, timeout=60)
    if adb('shell', 'getprop', 'ro.kernel.qemu').strip() != '1':
        raise ValueError('Emulador não confirmado')
    adb('install', '-r', str(args.apk.resolve()))
    adb('shell', 'monkey', '-p', PACKAGE, '-c', 'android.intent.category.LAUNCHER', '1')
    findings = inspect_dump(adb('shell', 'dumpsys', 'package', PACKAGE))
    result = {'apk_sha256': hashlib.sha256(args.apk.read_bytes()).hexdigest(), 'automated_checks': ['installed flags', 'declared permissions', 'launch'], 'findings': findings, 'manual_pending': ['storage contents', 'sensitive logs', 'backup extraction', 'traffic capture', 'runtime permission behavior'], 'security_validation_complete': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    # These automated checks cannot attest full dynamic validation.
    if findings:
        raise ValueError('Achados dinâmicos requerem revisão')
    print('Verificações automatizadas passaram; roteiro humano permanece pendente.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'Verificação indisponível/reprovada: {type(error).__name__}')
        raise SystemExit(1)
