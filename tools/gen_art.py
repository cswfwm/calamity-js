from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'content')

def new(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))

def save(img, rel):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p)
    print('wrote', rel, img.size)

# ---------- 调色板 ----------
SAND_D = (120, 88, 52, 255)
SAND   = (186, 146, 92, 255)
SAND_L = (226, 196, 138, 255)
BONE   = (232, 220, 190, 255)
BONE_D = (166, 150, 118, 255)
DARK   = (46, 34, 24, 255)
STEEL  = (150, 158, 168, 255)
STEEL_D= (92, 100, 112, 255)
WATER  = (86, 168, 206, 255)
WATER_L= (156, 220, 240, 255)
ROGUE  = (150, 96, 196, 255)
ROGUE_L= (206, 160, 246, 255)

def outline(img, color=DARK):
    """给不透明像素加 1px 描边。"""
    w, h = img.size
    src = img.load()
    out = img.copy()
    dst = out.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3] != 0:
                continue
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx, ny = x+dx, y+dy
                if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3] > 128:
                    dst[x, y] = color
                    break
    return out

# ---------- 武器 ----------
def sahara():
    img = new(42, 34); d = ImageDraw.Draw(img)
    # 两道错开的刀身
    for off, col in ((0, (226, 232, 240, 255)), (3, STEEL)):
        d.polygon([(6+off, 30), (30+off, 8), (33+off, 11), (9+off, 33-off)], fill=col)
    d.polygon([(6, 30), (2, 26), (8, 24)], fill=SAND)     # 护手
    d.rectangle([2, 26, 10, 29], fill=SAND_L)
    d.line([(28, 10), (33, 5)], fill=BONE, width=2)          # 尖端高光
    return outline(img)

def barinade():
    img = new(30, 58); d = ImageDraw.Draw(img)
    d.arc([3, 2, 27, 40], 200, 340, fill=SAND, width=4)      # 弓臂
    d.line([(15, 4), (15, 4)], fill=SAND_L)
    d.line([(5, 12), (25, 12)], fill=SAND_L, width=1)
    d.polygon([(4, 10), (26, 10), (15, 20)], fill=WATER)     # 水色弓弦区
    d.line([(15, 8), (15, 44)], fill=BONE, width=1)          # 弦
    d.polygon([(15, 6), (18, 14), (15, 20), (12, 14)], fill=SAND_L)
    d.rectangle([3, 40, 27, 46], fill=SAND_D)                # 握把
    d.rectangle([5, 42, 25, 44], fill=SAND)
    return outline(img)

def sandstream():
    img = new(46, 40); d = ImageDraw.Draw(img)
    d.line([(8, 34), (26, 10)], fill=SAND_D, width=6)        # 杖身
    d.line([(9, 32), (27, 9)], fill=SAND, width=3)
    d.ellipse([24, 2, 40, 18], fill=WATER)                   # 顶端水球
    d.ellipse([27, 5, 37, 15], fill=WATER_L)
    d.ellipse([29, 7, 33, 11], fill=(255, 255, 255, 220))
    for i, y in enumerate(range(20, 30, 3)):                 # 缠绕的沙带
        d.line([(10+i, y+4), (20+i, y)], fill=SAND_L, width=1)
    return outline(img)

def brittle():
    img = new(38, 54); d = ImageDraw.Draw(img)
    d.line([(10, 48), (20, 26)], fill=SAND_D, width=5)       # 杖身
    d.line([(11, 47), (20, 27)], fill=SAND, width=2)
    cx, cy = 20, 16
    import math
    for k in range(5):                                        # 海星
        a = -math.pi/2 + k * 2*math.pi/5
        ex, ey = cx + math.cos(a)*13, cy + math.sin(a)*13
        mx, my = cx + math.cos(a)*6, cy + math.sin(a)*6
        d.polygon([(cx, cy), (mx+math.cos(a-1.2)*5, my+math.sin(a-1.2)*5), (ex, ey),
                   (mx+math.cos(a+1.2)*5, my+math.sin(a+1.2)*5)], fill=ROGUE)
    d.ellipse([cx-4, cy-4, cx+4, cy+4], fill=ROGUE_L)
    d.ellipse([cx-2, cy-2, cx+2, cy+2], fill=(255, 255, 255, 220))
    return outline(img)

def scourge():
    img = new(82, 82); d = ImageDraw.Draw(img)
    # 标枪：沿对角线的长杆 + 骨刺枪头
    d.line([(10, 72), (62, 20)], fill=SAND_D, width=7)
    d.line([(11, 70), (60, 21)], fill=SAND, width=4)
    d.line([(14, 66), (52, 28)], fill=SAND_L, width=1)
    d.polygon([(58, 24), (74, 8), (66, 26), (78, 18), (64, 34), (70, 40)], fill=BONE)
    d.polygon([(58, 24), (74, 8), (70, 22)], fill=BONE_D)
    for i in range(4):                                        # 尾羽般的倒刺
        x, y = 18 + i*7, 64 - i*7
        d.polygon([(x, y), (x-6, y+2), (x-2, y+7)], fill=SAND_L)
    d.polygon([(6, 76), (12, 68), (16, 78), (10, 80)], fill=ROGUE)
    return outline(img)

# ---------- 材料 / 饰品 / 消耗品 ----------
def pearl_shard():
    img = new(20, 26); d = ImageDraw.Draw(img)
    d.polygon([(10, 1), (19, 12), (14, 25), (5, 25), (1, 12)], fill=BONE)
    d.polygon([(10, 1), (10, 24), (5, 25), (1, 12)], fill=BONE_D)
    d.polygon([(7, 5), (10, 3), (12, 9), (9, 12)], fill=(255, 255, 255, 230))
    return outline(img)

def ocean_crest():
    img = new(18, 26); d = ImageDraw.Draw(img)
    d.ellipse([1, 8, 17, 24], fill=WATER)
    d.arc([1, 2, 17, 20], 180, 360, fill=WATER_L, width=2)
    d.arc([3, 4, 15, 18], 200, 340, fill=(255, 255, 255, 200), width=1)
    for x, y in ((5, 16), (9, 13), (12, 18)):                 # 浪花
        d.point((x, y), fill=(255, 255, 255, 230))
    return outline(img)

def sand_cloak():
    img = new(30, 44); d = ImageDraw.Draw(img)
    d.polygon([(15, 2), (29, 16), (25, 43), (5, 43), (1, 16)], fill=SAND)
    d.polygon([(15, 2), (15, 42), (5, 43), (1, 16)], fill=SAND_D)
    d.line([(15, 4), (15, 40)], fill=SAND_L)
    d.ellipse([6, 8, 24, 20], fill=ROGUE)                      # 领口的盗贼色宝石
    d.ellipse([11, 11, 19, 19], fill=ROGUE_L)
    return outline(img)

def medallion():
    img = new(38, 46); d = ImageDraw.Draw(img)
    d.line([(19, 2), (19, 14)], fill=BONE_D, width=2)          # 链子
    d.ellipse([2, 12, 36, 44], fill=SAND_D)
    d.ellipse([4, 14, 34, 42], fill=SAND)
    d.ellipse([8, 18, 30, 38], fill=SAND_L)
    d.polygon([(19, 20), (26, 28), (19, 36), (12, 28)], fill=WATER)  # 沙漠中的水
    d.polygon([(19, 22), (23, 28), (19, 33)], fill=WATER_L)
    return outline(img)

def boss_bag():
    img = new(42, 38); d = ImageDraw.Draw(img)
    d.ellipse([2, 10, 40, 37], fill=SAND_D)
    d.ellipse([4, 12, 38, 35], fill=SAND)
    d.rectangle([14, 2, 28, 14], fill=SAND_D)                 # 袋口
    d.rectangle([16, 4, 26, 12], fill=SAND_L)
    d.line([(15, 8), (27, 8)], fill=BONE, width=2)            # 系绳
    d.ellipse([14, 20, 28, 32], fill=ROGUE)                   # 封印
    d.polygon([(21, 22), (25, 26), (21, 30), (17, 26)], fill=ROGUE_L)
    return outline(img)

# ---------- 弹幕 ----------
def blade(slant_right=True):
    img = new(40, 34); d = ImageDraw.Draw(img)
    if slant_right:
        d.polygon([(4, 30), (30, 6), (36, 10), (10, 34)], fill=(230, 236, 244, 255))
        d.polygon([(4, 30), (10, 34), (8, 34), (2, 32)], fill=SAND)
        d.line([(28, 8), (34, 3)], fill=BONE, width=2)
    else:
        d.polygon([(36, 30), (10, 6), (4, 10), (30, 34)], fill=(230, 236, 244, 255))
        d.polygon([(36, 30), (30, 34), (32, 34), (38, 32)], fill=SAND)
        d.line([(12, 8), (6, 3)], fill=BONE, width=2)
    return outline(img)

def bolt():
    img = new(14, 36); d = ImageDraw.Draw(img)
    d.polygon([(7, 1), (13, 16), (7, 35), (1, 16)], fill=ROGUE_L)
    d.polygon([(7, 3), (7, 33), (2, 16)], fill=ROGUE)
    d.line([(7, 4), (7, 30)], fill=(255, 255, 255, 200))
    return outline(img)

def arrow():
    img = new(14, 40); d = ImageDraw.Draw(img)
    d.line([(7, 8), (7, 34)], fill=SAND_D, width=2)           # 杆
    d.polygon([(7, 1), (12, 12), (7, 9), (2, 12)], fill=WATER)  # 水箭头
    d.polygon([(7, 3), (10, 10), (7, 8), (4, 10)], fill=WATER_L)
    d.polygon([(3, 30), (7, 36), (11, 30), (7, 32)], fill=SAND_L)  # 尾羽
    return outline(img)

def star_minion():
    import math
    img = new(34, 34); d = ImageDraw.Draw(img)
    cx = cy = 17
    for k in range(5):
        a = -math.pi/2 + k * 2*math.pi/5
        ex, ey = cx + math.cos(a)*15, cy + math.sin(a)*15
        mx1 = cx + math.cos(a-1.1)*6; my1 = cy + math.sin(a-1.1)*6
        mx2 = cx + math.cos(a+1.1)*6; my2 = cy + math.sin(a+1.1)*6
        d.polygon([(cx, cy), (mx1, my1), (ex, ey), (mx2, my2)], fill=ROGUE)
    d.ellipse([cx-6, cy-6, cx+6, cy+6], fill=ROGUE_L)
    d.ellipse([cx-3, cy-3, cx+3, cy+3], fill=(255, 255, 255, 230))
    for x, y in ((9, 9), (25, 12), (12, 25)):                  # 眼睛
        d.point((x, y), fill=DARK)
    return outline(img)

def spit_frame():
    img = new(16, 30); d = ImageDraw.Draw(img)
    d.ellipse([3, 1, 13, 13], fill=SAND)
    d.ellipse([5, 3, 11, 11], fill=SAND_L)
    d.polygon([(4, 11), (12, 11), (8, 29)], fill=SAND_D)       # 沙尾
    d.point((7, 7), fill=DARK)
    return outline(img)

def buff_icon():
    import math
    img = new(32, 32); d = ImageDraw.Draw(img)
    cx = cy = 16
    for k in range(5):
        a = -math.pi/2 + k * 2*math.pi/5
        ex, ey = cx + math.cos(a)*13, cy + math.sin(a)*13
        mx1 = cx + math.cos(a-1.1)*5; my1 = cy + math.sin(a-1.1)*5
        mx2 = cx + math.cos(a+1.1)*5; my2 = cy + math.sin(a+1.1)*5
        d.polygon([(cx, cy), (mx1, my1), (ex, ey), (mx2, my2)], fill=ROGUE)
    d.ellipse([cx-5, cy-5, cx+5, cy+5], fill=ROGUE_L)
    return outline(img)

# ---------- NPC ----------
def worm_head():
    img = new(158, 118); d = ImageDraw.Draw(img)
    d.ellipse([8, 22, 150, 118], fill=SAND)                    # 头部主体
    d.ellipse([22, 34, 136, 112], fill=SAND_L)
    d.polygon([(20, 78), (58, 40), (52, 88)], fill=BONE)       # 上颚
    d.polygon([(138, 78), (100, 40), (106, 88)], fill=BONE)
    d.polygon([(32, 92), (58, 62), (56, 104)], fill=BONE_D)
    d.polygon([(126, 92), (100, 62), (102, 104)], fill=BONE_D)
    d.ellipse([62, 52, 96, 86], fill=DARK)                      # 口
    d.ellipse([70, 60, 88, 78], fill=(88, 40, 40, 255))
    for x, y in ((40, 52), (118, 52)):                          # 眼
        d.ellipse([x-7, y-7, x+7, y+7], fill=(230, 120, 40, 255))
        d.ellipse([x-3, y-3, x+3, y+3], fill=DARK)
    for i in range(5):                                          # 背棘
        x = 26 + i*24
        d.polygon([(x, 34), (x+8, 10), (x+16, 34)], fill=BONE_D)
    return outline(img)

def worm_body():
    img = new(158, 118); d = ImageDraw.Draw(img)
    d.ellipse([4, 18, 154, 118], fill=SAND_D)
    d.ellipse([10, 24, 148, 112], fill=SAND)
    d.ellipse([26, 40, 132, 100], fill=SAND_L)
    d.ellipse([56, 52, 102, 90], fill=SAND)
    for i in range(5):                                          # 环节纹
        y = 34 + i*16
        d.arc([18, y, 140, y+22], 200, 340, fill=SAND_D, width=2)
    for i in range(5):                                          # 背棘
        x = 26 + i*26
        d.polygon([(x, 30), (x+7, 10), (x+14, 30)], fill=BONE_D)
    return outline(img)

def worm_tail():
    img = new(158, 116); d = ImageDraw.Draw(img)
    d.ellipse([4, 20, 154, 116], fill=SAND_D)
    d.ellipse([12, 26, 146, 110], fill=SAND)
    d.polygon([(20, 60), (79, 96), (138, 60), (79, 44)], fill=SAND_L)   # 尾鳍
    for i in range(4):
        x = 34 + i*26
        d.polygon([(x, 32), (x+7, 14), (x+14, 32)], fill=BONE_D)
    return outline(img)

def boss_icon():
    img = new(50, 42); d = ImageDraw.Draw(img)
    d.ellipse([2, 6, 48, 42], fill=SAND)
    d.ellipse([8, 11, 42, 38], fill=SAND_L)
    d.polygon([(8, 26), (20, 14), (18, 30)], fill=BONE)
    d.polygon([(42, 26), (30, 14), (32, 30)], fill=BONE)
    d.ellipse([19, 18, 31, 30], fill=DARK)
    for x, y in ((15, 18), (35, 18)):
        d.ellipse([x-3, y-3, x+3, y+3], fill=(230, 120, 40, 255))
    return outline(img)

save(sahara(),        'Content/Items/Weapons/CalamityWeapons/SaharaSlicers.png')
save(barinade(),      'Content/Items/Weapons/CalamityWeapons/Barinade.png')
save(sandstream(),    'Content/Items/Weapons/CalamityWeapons/SandstreamScepter.png')
save(brittle(),       'Content/Items/Weapons/CalamityWeapons/BrittleStarStaff.png')
save(scourge(),       'Content/Items/Weapons/CalamityWeapons/ScourgeOfTheDesert.png')
save(pearl_shard(),   'Content/Items/Consumables/DesertScourgeItems/PearlShard.png')
save(ocean_crest(),   'Content/Items/Accessories/CalamityAccessories/OceanCrest.png')
save(sand_cloak(),    'Content/Items/Accessories/CalamityAccessories/SandCloak.png')
save(medallion(),     'Content/Items/Consumables/DesertScourgeItems/DesertMedallion.png')
save(boss_bag(),      'Content/Items/Consumables/DesertScourgeItems/DesertScourgeBag.png')
save(blade(True),     'Content/Projectiles/SaharaBlades/SaharaSlicersBlade.png')
save(blade(False),    'Content/Projectiles/SaharaBlades/SaharaSlicersBladeAlt.png')
save(bolt(),          'Content/Projectiles/SaharaBlades/SaharaSlicersBolt.png')
save(arrow(),         'Content/Projectiles/CalamityProjectiles/BarinadeArrow.png')
save(star_minion(),   'Content/Projectiles/Summon/BrittleStarMinion.png')
save(buff_icon(),     'Content/Buffs/BrittleStarBuff.png')
save(worm_head(),     'Content/NPCs/DesertScourge/DesertScourge/DesertScourgeHead.png')
save(worm_body(),     'Content/NPCs/DesertScourge/DesertScourge/DesertScourgeBody.png')
save(worm_tail(),     'Content/NPCs/DesertScourge/DesertScourge/DesertScourgeTail.png')
save(boss_icon(),     'Content/NPCs/DesertScourge/DesertScourge/DesertScourgeHead_Head_Boss.png')

# 4 帧的沙暴弹幕
sheet = new(16, 120)
for i in range(4):
    f = spit_frame().resize((16 - i, 30 - i*2), Image.NEAREST) if i else spit_frame()
    sheet.alpha_composite(f, (i // 2, i*30))
save(sheet, 'Content/Projectiles/Boss/DesertScourgeSpit.png')

# 不可见的沙流弹幕（1x1 透明）
save(new(1, 1), 'Content/Projectiles/CalamityProjectiles/Sandstream.png')
