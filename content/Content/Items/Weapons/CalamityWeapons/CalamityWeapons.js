import { RogueDamageClass } from '../../../../Common/DamageClasses/RogueDamageClass.js';
import { RoguePlayer } from '../../../../Common/Players/RoguePlayer.js';

const { ItemID, ItemUseStyleID, SoundID, AmmoID } = Terraria.ID;
const NewProjectile = Terraria.Projectile['int NewProjectile(IEntitySource spawnSource, float X, float Y, float SpeedX, float SpeedY, int Type, int Damage, float KnockBack, int Owner, float ai0, float ai1, float ai2, NewProjectileModifier modifer)'];

// 荒漠灾虫的五把早期武器，数值取自 CalamityMod 2.2.2 各 Item.cs 的 SetDefaults。

// 沙暴剑（真近战）：左右交替的短剑突刺，每第 4 次挥击改为掷出旋转刀光。
// 手机端没有鼠标右键（Bunny 的 JS 层也没有 AltFunctionUse 钩子），
// 所以把灾厄的右键刀光改成按节奏触发。
export class SaharaSlicers extends ModItem {
    // 灾厄让潜行突袭对任何盗贼武器生效，但沙暴剑是真近战，所以单独结算。
    ModifyHitNPC(item, player, target, modifiers) {
        if (!RoguePlayer.IsStealthFull(player)) return;
        RoguePlayer.ConsumeStealth(player);
        modifiers.SourceDamage.Multiplicative *= RoguePlayer.StrikeMultiplier(item);
    }

    SetDefaults() {
        this.Item.width = 43;
        this.Item.height = 34;
        this.Item.noMelee = true;
        this.Item.noUseGraphic = true;
        this.Item.autoReuse = true;
        this.Item.useStyle = ItemUseStyleID.Shoot;
        this.Item.damage = 20;
        this.Item.DamageType = DamageClass.Melee;
        this.Item.useAnimation = this.Item.useTime = 12;
        this.Item.shoot = ModContent.ProjectileType('SaharaSlicersBlade');
        this.Item.shootSpeed = 3.3;
        this.Item.knockBack = 6;
        this.Item.rare = ItemRarityID.Green;
        this.Item.value = Terraria.Item.sellPrice(0, 1, 0, 0);
    }

    Shoot(item, player, position, velocity, type, damage, knockBack) {
        const source = player.GetProjectileSource_Item(item);
        // 计数放在玩家身上：物品实例会随克隆/放入箱子重建，玩家实例不会。
        const roguePlayer = player.GetModPlayer(RoguePlayer);
        roguePlayer.SwingCounter = (roguePlayer.SwingCounter + 1) % 4;

        if (roguePlayer.SwingCounter === 0) {
            SoundEngine.PlaySound(SoundID.Item7, player.Center);
            NewProjectile(source, position.X, position.Y, velocity.X * 2, velocity.Y * 2,
                ModContent.ProjectileType('SaharaSlicersBolt'), damage, knockBack, player.whoAmI, 0, 0, 0, null);
        } else {
            SoundEngine.PlaySound(SoundID.Item1, player.Center);
            const blade = roguePlayer.SwingCounter % 2 === 0 ? 'SaharaSlicersBladeAlt' : 'SaharaSlicersBlade';
            NewProjectile(source, position.X, position.Y, velocity.X, velocity.Y,
                ModContent.ProjectileType(blade), damage, knockBack, player.whoAmI, 0, 0, 0, null);
        }
        return false;
    }
}

// 巴淋内德（远程弓）：发射专属箭矢。
export class Barinade extends ModItem {
    SetDefaults() {
        this.Item.width = 52;
        this.Item.height = 80;
        this.Item.damage = 5;
        this.Item.DamageType = DamageClass.Ranged;
        this.Item.useTime = 24;
        this.Item.useAnimation = 24;
        this.Item.useStyle = ItemUseStyleID.Shoot;
        this.Item.noMelee = true;
        this.Item.knockBack = 2.2;
        this.Item.rare = ItemRarityID.Green;
        this.Item.value = Terraria.Item.sellPrice(0, 1, 0, 0);
        this.Item.UseSound = SoundID.Item5;
        this.Item.autoReuse = true;
        this.Item.useAmmo = AmmoID.Arrow;
        this.Item.shoot = ModContent.ProjectileType('BarinadeArrow');
        this.Item.shootSpeed = 15;
    }
}

// 水流喷射（魔法）：16 点伤害、7 魔力，发射可穿透的沙流。
export class SandstreamScepter extends ModItem {
    SetDefaults() {
        this.Item.width = 50;
        this.Item.height = 56;
        this.Item.damage = 16;
        this.Item.DamageType = DamageClass.Magic;
        this.Item.mana = 7;
        this.Item.useAnimation = this.Item.useTime = 20;
        this.Item.useStyle = ItemUseStyleID.Shoot;
        this.Item.noMelee = true;
        this.Item.knockBack = 1;
        this.Item.rare = ItemRarityID.Green;
        this.Item.value = Terraria.Item.sellPrice(0, 1, 0, 0);
        this.Item.UseSound = SoundID.Item72;
        this.Item.autoReuse = true;
        this.Item.shoot = ModContent.ProjectileType('Sandstream');
        this.Item.shootSpeed = 11;
    }
}

// 海星召唤杖：召唤一只海星替你作战。
export class BrittleStarStaff extends ModItem {
    SetStaticDefaults() {
        ItemID.Sets.GamepadWholeScreenUseRange[this.Type] = true;
        ItemID.Sets.LockOnIgnoresCollision[this.Type] = true;
        ItemID.Sets.StaffMinionSlotsRequired[this.Type] = 1;
    }

    SetDefaults() {
        this.Item.width = 44;
        this.Item.height = 64;
        this.Item.damage = 10;
        this.Item.mana = 10;
        this.Item.useAnimation = this.Item.useTime = 36;
        this.Item.useStyle = ItemUseStyleID.Shoot;
        this.Item.noMelee = true;
        this.Item.knockBack = 2;
        this.Item.rare = ItemRarityID.Green;
        this.Item.value = Terraria.Item.sellPrice(0, 1, 0, 0);
        this.Item.UseSound = SoundID.Item44;
        this.Item.autoReuse = true;
        this.Item.DamageType = DamageClass.Summon;
        this.Item.buffType = ModBuff.getTypeByName('BrittleStarBuff');
        this.Item.shoot = ModContent.ProjectileType('BrittleStarMinion');
    }

    Shoot(item, player) {
        player.AddBuff(item.buffType, 2, false);
        return true;
    }
}

// 荒漠灾虫（盗贼标枪）：落地后钻出并追击敌人，潜行突袭时穿透更多。
export class ScourgeOfTheDesert extends ModItem {
    SetDefaults() {
        this.Item.width = 112;
        this.Item.height = 116;
        this.Item.damage = 12;
        this.Item.noMelee = true;
        this.Item.noUseGraphic = true;
        this.Item.useStyle = ItemUseStyleID.Swing;
        this.Item.useAnimation = this.Item.useTime = 24;
        this.Item.knockBack = 3.5;
        this.Item.UseSound = SoundID.Item1;
        this.Item.autoReuse = true;
        this.Item.rare = ItemRarityID.Green;
        this.Item.value = Terraria.Item.sellPrice(0, 1, 0, 0);
        this.Item.shoot = ModContent.ProjectileType('ScourgeOfTheDesertProj');
        this.Item.shootSpeed = 12;
        this.Item.DamageType = ModContent.GetInstance(RogueDamageClass);
    }

    Shoot(item, player, position, velocity, type, damage, knockBack) {
        // 潜行满时投出三柄标枪，和灾厄的潜行突袭一致。
        const strike = player.GetModPlayer(RoguePlayer).TakeStealthStrike(player, item);
        const count = strike > 1 ? 3 : 1;
        const source = player.GetProjectileSource_Item(item);
        for (let i = 0; i < count; i++) {
            const v = count > 1 ? Vector2.RotatedBy(velocity, (i - 1) * 0.22) : velocity;
            NewProjectile(source, position.X, position.Y, v.X, v.Y, type,
                Math.round(damage * strike), knockBack, player.whoAmI, 0, 0, 0, null);
        }
        return false;
    }
}
