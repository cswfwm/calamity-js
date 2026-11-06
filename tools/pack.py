#!/usr/bin/env python3
"""把模组目录打成启动器可导入的 .bmod（zip）包。"""
import json, os, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
manifest = json.load(open(os.path.join(ROOT, 'manifest.json'), encoding='utf-8'))
name = manifest.get('id', 'mod')
version = manifest.get('version', '0.0.0')
out_dir = os.path.join(ROOT, 'dist')
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, f'{name}-{version}.bmod')

files = [f for f in ('manifest.json', 'icon.png', 'icon_small.png', 'banner.png',
                     'description.md', 'changelog.md', 'license.md')
         if os.path.exists(os.path.join(ROOT, f))]
for dirpath, _, names in os.walk(os.path.join(ROOT, 'content')):
    for n in names:
        files.append(os.path.relpath(os.path.join(dirpath, n), ROOT))

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(os.path.join(ROOT, f), f.replace(os.sep, '/'))

print(out, f'{os.path.getsize(out)/1024:.1f} KB, {len(files)} files')
