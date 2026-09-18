"""Runs only inside the network-isolated MobSF container; never prints credentials."""
import json
import os
import time
import urllib.request
import urllib.parse

base = 'http://127.0.0.1:8000'
key = os.environ['MOBSF_API_KEY']
for attempt in range(60):
    try:
        urllib.request.urlopen(base, timeout=2)
        break
    except Exception:
        if attempt == 59:
            raise RuntimeError('Scanner indisponível')
        time.sleep(2)


def post(route, data, content_type):
    request = urllib.request.Request(base + route, data=data, headers={'Authorization': key, 'Content-Type': content_type})
    with urllib.request.urlopen(request, timeout=900) as response:
        result = json.load(response)
    if not isinstance(result, dict) or result.get('error'):
        raise RuntimeError('Scanner retornou erro ou formato inesperado')
    return result

boundary = 'TrincaManiaApkBoundary'
with open('/tmp/trinca.apk', 'rb') as stream:
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="app.apk"\r\nContent-Type: application/vnd.android.package-archive\r\n\r\n'.encode() + stream.read() + f'\r\n--{boundary}--\r\n'.encode())
upload = post('/api/v1/upload', body, f'multipart/form-data; boundary={boundary}')
data = urllib.parse.urlencode({'hash': upload['hash']}).encode()
post('/api/v1/scan', data, 'application/x-www-form-urlencoded')
report = post('/api/v1/report_json', data, 'application/x-www-form-urlencoded')
with open('/tmp/trinca-report.json', 'w') as stream:
    json.dump(report, stream)
