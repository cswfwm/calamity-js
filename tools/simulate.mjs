// 用桩对象模拟 Bunny-Loader 的全局环境，实际 import 一遍模组文件，
// 捕获模块级代码的错误（拼写、未定义全局、导入路径等）。
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

// ---- 通用桩 ----
const passthrough = () => new Proxy(function () {}, {
    get: (t, p) => (p === Symbol.toPrimitive ? () => 0 : passthrough()),
    apply: () => passthrough(),
    construct: () => passthrough(),
});

function makeClass(name) {
    const C = class {
        constructor() { this.__type = name; }
    };
    Object.defineProperty(C, 'name', { value: name });
    // 静态属性随意取用（Sets.xxx[...] = true 之类）
    return new Proxy(C, {
        get(t, p) {
            if (p in t) return t[p];
            if (typeof p === 'string' && /^(new|newArray|CommonMaxStack|Autoload|register|getTypeByName|getInstance)$/.test(p)) {
                if (p === 'new') return () => ({});
                if (p === 'register') return () => 1;
                if (p === 'getTypeByName') return () => 1;
                if (p === 'getInstance') return () => ({});
                return 9999;
            }
            const v = passthrough();
            t[p] = v;
            return v;
        },
    });
}

const classes = ['Item','NPC','Projectile','Player','Main','Dust','SoundID','ItemID','NPCID',
  'ProjectileID','AmmoID','BuffID','TileID','ItemRarityID','ItemUseStyleID','DustID','Lang',
  'MusicLoader','SoundEngine','ModItem','ModNPC','ModProjectile','ModBuff','ModPlayer','ModSystem',
  'Mod','ModContent','ModConfig','ModRecipe','ModLoader','DamageClass','StatInheritanceData',
  'StatModifier','TooltipLine','SoundStyle','ModLocalization','GameContent','ItemDropRule',
  'Conditions','Chains','LeadingConditionRule','UIState','UIElement','UserInterface','UIImage',
  'UIText','UITextPanel','UIImageButton','UserInterface','LegacyGameInterfaceLayer',
  'InterfaceScaleType','Vector2','Color','Rectangle','MathHelper','Rand','Ref','ModDust','ModTile',
  'ModMount','ModPrefix','ModRarity','NPCLoot','NPCSpawnInfo','NPCShop','SpawnCondition',
  'AffectionLevel','EquipLoader','TileObjectData','GenPass','PassLegacy','ModGore','ItemLoot',
  'TextureAssets','FontAssets','SpriteEffects','SpriteBatch','Asset'];
for (const c of classes) globalThis[c] = makeClass(c);
globalThis.UserInterface = class { SetState() {} Update() {} Draw() {} };
globalThis.UIState = class { Append() {} OnInitialize() {} };

// 常用静态成员
globalThis.DamageClass.Generic = makeClass('Generic');
globalThis.DamageClass.Throwing = makeClass('Throwing');
globalThis.DamageClass.Melee = makeClass('Melee');
globalThis.DamageClass.Ranged = makeClass('Ranged');
globalThis.DamageClass.Magic = makeClass('Magic');
globalThis.DamageClass.Summon = makeClass('Summon');
globalThis.StatInheritanceData.Full = {};
globalThis.StatInheritanceData.None = {};
globalThis.ModConfig.Toggle = patch => ({ kind: 'toggle' });
globalThis.ModConfig.Range = (d, o) => ({ kind: 'range' });
globalThis.ModConfig.Radio = (d, c) => ({ kind: 'radio' });
globalThis.ModContent.GetInstance = () => ({ Difficulty: 'Off' });
globalThis.ModRecipe = class {
    SetResult() { return this; } AddIngredient() { return this; } AddTile() { return this; }
    AddRecipeGroup() { return this; } AddCondition() { return this; } Register() { return this; }
    SetProperty() { return this; }
};
globalThis.ModContent = new Proxy(function(){}, { get: () => () => ({}) });
globalThis.ModContent.GetInstance = () => ({ Difficulty: 'Off' });
globalThis.bl = {
    log: (...a) => {},
    chat: () => {},
    error: () => {},
    mod: { id: 'calamityjs', name: 'Calamity JS' },
    defineField: () => {},
    defineMethod: () => {},
    file: {}, directory: {}, path: {},
};

// 深度链式访问：Terraria.ID.ItemID.X、Terraria.GameContent.ItemDropRules.ItemDropRule[...]
function deepStub(name) {
    return new Proxy(function () {}, {
        get(t, p) {
            if (p === 'then') return undefined;
            if (p === Symbol.toPrimitive) return () => 0;
            if (p === 'new') return () => ({});
            if (typeof p === 'string' && /^[A-Z]/.test(p)) return deepStub(p);
            return deepStub(String(p));
        },
        apply: () => deepStub('call'),
        construct: () => ({}),
    });
}
globalThis.Terraria = deepStub('Terraria');
globalThis.Microsoft = deepStub('Microsoft');
globalThis.System = deepStub('System');

// ---- 收集并 import 所有模组文件（main.js 除外：它靠 loader 实例化 Mod）----
function walk(dir, out = []) {
    for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (f.endsWith('.js')) out.push(p);
    }
    return out;
}

const files = walk('content').filter(f => !f.endsWith('main.js'));
let failed = 0;
const mods = [];
for (const f of files) {
    try {
        mods.push(await import(pathToFileURL(f).href));
    } catch (e) {
        failed++;
        console.log('FAIL import', f, '->', e.message.split('\n')[0]);
    }
}

// main.js 的 Mod 类：loader 会自己实例化，这里手动调一次 Load / PostSetupContent
try {
    const entry = await import(pathToFileURL('content/main.js').href);
    const ModClass = entry.default;
    const inst = new ModClass();
    inst.Load?.();
    inst.PostSetupContent?.();
} catch (e) {
    failed++;
    console.log('FAIL main.js ->', e.message.split('\n')[0]);
}

// 内容类：模拟 register 之后的生命周期调用，抓 SetDefaults / ModifyNPCLoot 之类
const calls = ['SetStaticDefaults', 'PostStaticDefaults', 'SetDefaults', 'PostSetDefaults',
               'AddRecipes', 'AddRecipeGroups', 'ModifyNPCLoot', 'ModifyItemLoot',
               'SetBestiary', 'ApplyBuffImmunity', 'PostSetupContent'];
for (const mod of mods) {
    for (const [name, Exp] of Object.entries(mod)) {
        if (typeof Exp !== 'function' || !/^class\b/.test(Exp.toString().slice(0, 8))) continue;
        if (Exp.Autoload === false) continue;
        let inst;
        try {
            inst = new Exp();
        } catch (e) {
            failed++;
            console.log('FAIL new', name, '->', e.message.split('\n')[0]);
            continue;
        }
        // 给实例补上 loader 注册时注入的字段
        inst.Type = 6196;
        inst.Mod = bl.mod;
        inst.Item = deepStub('Item');
        inst.NPC = deepStub('NPC');
        inst.Projectile = deepStub('Projectile');
        inst.Player = deepStub('Player');
        inst.Happiness = deepStub('Happiness');
        inst.CreateRecipe = () => new ModRecipe();
        inst.CreateRecipeGroup = () => new ModRecipe();
        inst.BossBar = null;
        for (const m of calls) {
            if (typeof inst[m] !== 'function') continue;
            if (m === 'ApplyBuffImmunity') {
                try { inst[m](inst.NPC); } catch (e) { failed++; console.log('FAIL', name + '.' + m, '->', e.message.split('\n')[0]); }
                continue;
            }
            if (m === 'SetBestiary' || m === 'ModifyItemLoot' || m === 'ModifyNPCLoot') {
                try { inst[m](deepStub(m)); } catch (e) { failed++; console.log('FAIL', name + '.' + m, '->', e.message.split('\n')[0]); }
                continue;
            }
            const arg = m.startsWith('SetDefaults') ? (inst.Projectile || inst.NPC || inst.Item) : undefined;
            try { inst[m](arg); } catch (e) {
                failed++;
                console.log('FAIL', name + '.' + m, '->', e.message.split('\n')[0]);
            }
        }
    }
}
console.log(`\n${files.length} 个模块、${mods.length} 批导出；失败 ${failed} 项`);
process.exit(failed ? 1 : 0);
