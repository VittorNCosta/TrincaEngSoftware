"""Validate MobSF v4.5.2 output and emit a sanitized APK-bound decision."""
import datetime
import hashlib
import json
import re


def evaluate(report, apk_sha256, exceptions, today=None):
    today = today or datetime.date.today()
    if not re.fullmatch(r'[a-f0-9]{64}', apk_sha256 or ''):
        raise ValueError('SHA256 de APK inválido')
    if report.get('sha256') != apk_sha256 or report.get('app_type') != 'apk':
        raise ValueError('Relatório não corresponde ao APK')
    if report.get('package_name') != 'br.com.mhvtech.trincamania':
        raise ValueError('Package inesperado')
    for name in ['permissions', 'manifest_analysis', 'network_security', 'code_analysis', 'certificate_analysis']:
        if not isinstance(report.get(name), dict):
            raise ValueError(f'Relatório incompleto: {name}')
    if not isinstance(report['manifest_analysis'].get('manifest_findings'), list):
        raise ValueError('Manifest findings ausentes')
    if not isinstance(report['code_analysis'].get('findings'), dict):
        raise ValueError('Code findings ausentes')
    accepted = {}
    for exception in exceptions:
        expiry = datetime.date.fromisoformat(exception['expires'])
        if not exception.get('owner') or not exception.get('reason') or not exception.get('review'):
            raise ValueError('Exceção sem responsável, justificativa e revisão')
        if expiry < today:
            raise ValueError('Exceção expirada')
        if expiry > today + datetime.timedelta(days=90):
            raise ValueError('Exceção excede 90 dias')
        if exception.get('apk_sha256') != apk_sha256:
            raise ValueError('Exceção não corresponde ao APK')
        accepted[exception['id']] = exception
    findings = []

    def visit(value, location):
        if isinstance(value, dict):
            severity = str(value.get('severity', '')).lower()
            if severity in {'high', 'critical'}:
                # Hash includes content so a changed finding cannot reuse an exception.
                identity = hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()
                findings.append({'id': identity, 'area': location.split('.')[0], 'severity': severity, 'excepted': identity in accepted})
            for key, child in value.items():
                visit(child, f'{location}.{key}')
        elif isinstance(value, list):
            # Certificate analyzer uses [severity, title, description] tuples.
            if value and isinstance(value[0], str) and value[0].lower() in {'high', 'critical'}:
                identity = hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()
                findings.append({'id': identity, 'area': location.split('.')[0], 'severity': value[0].lower(), 'excepted': identity in accepted})
            for index, child in enumerate(value):
                visit(child, f'{location}.{index}')
    for area in ['manifest_analysis', 'network_security', 'code_analysis', 'certificate_analysis', 'binary_analysis']:
        visit(report.get(area, {}), area)
    return {'apk_sha256': apk_sha256, 'scanner': 'MobSF 4.5.2', 'static_only': True,
            'permissions': sorted(report['permissions']), 'findings': findings,
            'passed': not any(not x['excepted'] for x in findings),
            'manual_review_required': ['exported components', 'debug', 'backup', 'network configuration', 'runtime behavior']}
