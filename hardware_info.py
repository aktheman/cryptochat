#!/usr/bin/env python3
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT = Path('/home/aktheman/cryptochat')
SERVICE = 'cryptochat'

def run(cmd):
    try:
        out = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.STDOUT)
        return out.strip()
    except subprocess.CalledProcessError as e:
        return f'ERROR: {e.output.strip()}'
    except FileNotFoundError:
        return 'MISSING'

def section(title):
    print(f"\n## {title}\n")

def kv(key, value):
    if value is None:
        value = 'Ukjent'
    print(f'- **{key}:** {value}')

section('System')
kv('Vert', platform.node())
kv('OS', platform.platform())
kv('Ark', platform.machine())
kv('Python', sys.version.split()[0])

cpu = run('grep -m1 "model name" /proc/cpuinfo | cut -d: -f2')
cores = run('nproc')
kv('CPU', cpu)
kv('Kjerner', cores)

mem_total = run("awk '/MemTotal/ {print $2}' /proc/meminfo")
mem_avail = run("awk '/MemAvailable/ {print $2}' /proc/meminfo")
if mem_total and mem_total.isdigit() and mem_avail and mem_avail.isdigit():
    kv('Minne totalt / ledig', f"{int(mem_total)/1024:.0f} MB / {int(mem_avail)/1024:.0f} MB")
else:
    kv('Minne', 'Ikke tilgjengelig')

section('Lagring')
disk = run('df -h / /home 2>/dev/null | tail -n +2')
print('```')
print(disk or 'Ingen data')
print('```')

section('Temperature')
temp_raw = run('cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null')
temp = None
if temp_raw and temp_raw.isdigit():
    temp = f"{int(temp_raw)/1000:.1f}°C"
print('- **CPU-temp:**', temp or 'Ikke tilgjengelig via sysfs')

throttle = run('vcgencmd get_throttled 2>/dev/null')
if throttle.startswith('ERROR'):
    throttle = run('cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq 2>/dev/null')
print('- **Frekvens/throttle:**', throttle or 'Ikke tilgjengelig')

section('Nettverk')
ip = run("hostname -I | awk '{print $1}'")
print('- **IP:**', ip or 'Ikke tilgjengelig')
print('```')
print(run('ss -ltnp') or 'Ingen data')
print('```')

section('CryptoChat status')
service_status = run(f'systemctl status {SERVICE} --no-pager')
print('```')
print(service_status)
print('```')

caddy_status = run('systemctl status caddy --no-pager')
print('```')
print(caddy_status)
print('```')

if PROJECT.exists():
    print('\nProsjektmappe:', PROJECT)
    print('```')
    lines = run('ls -la ' + str(PROJECT)).splitlines()
    for line in lines[:25]:
        print(line)
    print('```')
else:
    kv('Prosjektmappe', f'{PROJECT} mangler')

section('Hurtigvarsel')
live = run('ps -ef | grep -E "gunicorn|flask|cryptochat" | grep -v grep')
print('```')
print(live or 'Ingen kjerneprosesser funnet')
print('```')
