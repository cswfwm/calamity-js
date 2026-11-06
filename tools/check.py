#!/usr/bin/env python3
"""静态检查：贴图路径、getTypeByName 引用、本地化键、缓存构造时调用。"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CONTENT = os.path.join(ROOT, 'content')
errors, warnings = [], []

# 1. 收集 content/ 下所有 js 文件里的导出类名 → js 路径
exports = {}          # 类名 -> js 路径
bases = {}            # 类名 -> 直接基类
for dirpath, _, files in os.walk(CONTENT):
    for f in files:
        if not f.endswith('.js'):
            continue
        p = os.path.join(dirpath, f)
        src = open(p, encoding='utf-8').read()
        for m in re.finditer(r'export\s+(?:default\s+)?class\s+(\w+)\s+extends\s+(\w+)', src):
            exports[m.group(1)] = p
            bases[m.group(1)] = m.group(2)

# 2b. 只有内容类（物品/弹幕/NPC/块/增益/尘）才必须有贴图
CONTENT_BASES = ('ModItem','ModProjectile','ModNPC','ModTile','ModWall','ModBuff',
                 'ModDust','ModMount','ModRarity')
for name, p in exports.items():
    base = bases.get(name, '')
    # 中间基类（继承自同一文件里的类，如 SaharaBlade）不在 CONTENT_BASES 里，跳过
    if base not in CONTENT_BASES:
        continue
    if re.search(r'get\s+Texture\s*\(', open(p, encoding='utf-8').read()):
        continue
    tex = os.path.join(os.path.dirname(p), name + '.png')
    if not os.path.exists(tex):
        errors.append(f'缺贴图且没有自定义 Texture: {name} -> {os.path.relpath(tex, ROOT)}')

# 3. 检查代码里 getTypeByName('X') / ProjectileType('X') / ItemType('X') 的引用是否都存在
refs = set()
for dirpath, _, files in os.walk(CONTENT):
    for f in files:
        if not f.endswith('.js'):
            continue
        p = os.path.join(dirpath, f)
        src = open(p, encoding='utf-8').read()
        for pat in (r"getTypeByName\(\s*'(\w+)'", r"ProjectileType\(\s*'(\w+)'",
                    r"ItemType\(\s*'(\w+)'", r"NPCType\(\s*'(\w+)'",
                    r"BuffType\(\s*'(\w+)'", r"TileType\(\s*'(\w+)'"):
            refs.update(re.findall(pat, src))
for r in sorted(refs):
    if r not in exports:
        errors.append(f'引用了不存在的类: {r}')

# 4. 检查 get Texture() 指向的路径是否存在
for dirpath, _, files in os.walk(CONTENT):
    for f in files:
        if not f.endswith('.js'):
            continue
        p = os.path.join(dirpath, f)
        src = open(p, encoding='utf-8').read()
        for t in re.findall(r"return\s+'([\w/]+)'\s*;\s*\}", src):
            full = os.path.join(CONTENT, t + '.png')
            if '/' in t and not os.path.exists(full):
                errors.append(f'{os.path.relpath(p, ROOT)}: get Texture() 指向的贴图不存在: {t}.png')

# 5. 本地化键对齐
loc_path = os.path.join(CONTENT, 'Localization', 'zh-Hans.json')
loc = json.load(open(loc_path, encoding='utf-8'))
loc_en = json.load(open(os.path.join(CONTENT, 'Localization', 'en-US.json'), encoding='utf-8'))
for section in loc:
    if section not in loc_en:
        errors.append(f'英文本地化缺少分区: {section}')
    elif set(loc[section]) != set(loc_en[section]):
        only_zh = set(loc[section]) - set(loc_en[section])
        only_en = set(loc_en[section]) - set(loc[section])
        if only_zh: errors.append(f'{section} 英文缺少: {sorted(only_zh)}')
        if only_en: errors.append(f'{section} 中文缺少: {sorted(only_en)}')

# 6. ModItem/NPC 里在字段初始化时调用 ModContent 的风险提示
for dirpath, _, files in os.walk(CONTENT):
    for f in files:
        if not f.endswith('.js'):
            continue
        p = os.path.join(dirpath, f)
        for i, line in enumerate(open(p, encoding='utf-8'), 1):
            if re.match(r'\s{4}\w+\s*=.*(ModContent|getTypeByName)', line):
                warnings.append(f'{os.path.relpath(p, ROOT)}:{i} 字段初始化时调用 ModContent（实例构造期，可能过早）')

print(f'导出类: {len(exports)}')
for w in warnings: print('WARN', w)
for e in errors: print('ERROR', e)
print(f'\n{len(errors)} 个错误, {len(warnings)} 个警告')
sys.exit(1 if errors else 0)
