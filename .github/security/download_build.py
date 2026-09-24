#!/usr/bin/env python3
"""Select only a successful manual build from this repository."""
import json
import os
from pathlib import Path
import re
import subprocess

run_id = os.environ['BUILD_RUN_ID']
repo = os.environ['GITHUB_REPOSITORY']
if not run_id.isdigit():
    raise SystemExit('Run ID inválido')
run = json.loads(subprocess.check_output(['gh', 'api', f'repos/{repo}/actions/runs/{run_id}']))
if run.get('conclusion') != 'success' or run.get('path') != '.github/workflows/build.yml' or run.get('event') != 'workflow_dispatch' or run.get('head_repository', {}).get('full_name') != repo:
    raise SystemExit('Somente build manual concluído do próprio repositório')
sha = run['head_sha']
if not re.fullmatch(r'[a-f0-9]{40}', sha):
    raise SystemExit('SHA inválido')
subprocess.run(['gh', 'run', 'download', run_id, '--repo', repo, '--name', f'eas-{sha}', '--dir', 'security-input'], check=True)
# Upload artifact may preserve relative paths; exactly one APK and manifest are required.
for filename in ['app.apk', 'build-manifest.json']:
    matches = list(Path('security-input').rglob(filename))
    if len(matches) != 1:
        raise SystemExit(f'Esperado um {filename}; AAB não substitui APK')
    os.replace(matches[0], Path('security-input') / filename) if matches[0] != Path('security-input') / filename else None
with open(os.environ['GITHUB_OUTPUT'], 'a') as stream:
    stream.write(f'commit={sha}\n')
