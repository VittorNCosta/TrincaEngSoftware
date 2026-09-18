#!/usr/bin/env python3
"""Run a pinned, network-isolated MobSF image on a verified APK."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import subprocess
import tempfile
from mobsf_gate import evaluate

IMAGE = 'opensecurity/mobile-security-framework-mobsf@sha256:b1af0d8ed4efad948cd7d74ac3657feb4e8b47a63907b6215454e01b50606181'  # v4.5.2 linux/amd64


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apk', required=True, type=Path)
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--exceptions', required=True, type=Path)
    args = parser.parse_args()
    digest = hashlib.sha256(args.apk.read_bytes()).hexdigest()
    manifest = json.loads(args.manifest.read_text())
    if manifest.get('sha256') != digest or manifest.get('commit') != args.commit or manifest.get('status') != 'FINISHED' or manifest.get('artifact') != 'app.apk':
        raise ValueError('APK/commit/status diverge do manifesto de build')
    name = 'trinca-mobsf-' + secrets.token_hex(6)
    args.output.mkdir(parents=True, exist_ok=True)
    run = lambda *cmd: subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=1200)
    try:
        with tempfile.TemporaryDirectory() as temporary:
            temporary = Path(temporary)
            env = temporary / 'scanner.env'
            env.write_text('MOBSF_API_KEY=' + secrets.token_hex(32) + '\nMOBSF_DOMAIN_MALWARE_SCAN=0\n')
            env.chmod(0o600)
            run('docker', 'pull', IMAGE)
            run('docker', 'run', '-d', '--name', name, '--network', 'none', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--env-file', str(env), IMAGE)
            run('docker', 'cp', str(args.apk.resolve()), name + ':/tmp/trinca.apk')
            run('docker', 'cp', str(Path(__file__).with_name('mobsf_client.py').resolve()), name + ':/tmp/trinca-client.py')
            run('docker', 'exec', name, 'python3', '/tmp/trinca-client.py')
            report_path = temporary / 'report.json'
            run('docker', 'cp', name + ':/tmp/trinca-report.json', str(report_path))
            result = evaluate(json.loads(report_path.read_text()), digest, json.loads(args.exceptions.read_text()))
            result.update({'commit': args.commit, 'image': IMAGE, 'build_id': manifest.get('id')})
            (args.output / 'mobsf-summary.json').write_text(json.dumps(result, indent=2) + '\n')
            if not result['passed']:
                raise ValueError('Achados altos/críticos requerem triagem ou exceção revisada')
    finally:
        subprocess.run(['docker', 'rm', '-f', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # No subprocess output: MobSF startup may contain its private API key.
        print(f'Análise não aprovada: {type(error).__name__}: {error if not isinstance(error, subprocess.SubprocessError) else "scanner falhou/indisponível"}')
        raise SystemExit(1)
