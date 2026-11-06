import { RogueDamageClass } from '../../../Common/DamageClasses/RogueDamageClass.js';

// 沙流沿用灾厄的做法：本体不显示精灵，靠沙尘表现。
const INVISIBLE = 'Content/Projectiles/CalamityProjectiles/Sandstream';

const { DustID } = Terraria.ID;
const NewDust = Terraria.Dust['Dust NewDustDirect(Vector2 Position, int Width, int Height, int Type, float SpeedX, float SpeedY, int Alpha, Color newColor, float Scale)'];

// 荒漠灾虫的标枪：45 帧后开始受重力，命中体块后钻入地下再从地面冲出追击敌人。
export class ScourgeOfTheDesertProj extends ModProjectile {
    Time = 0;

    // 标枪用的是武器自身的贴图（灾厄原版也这样覆盖 Texture）。
    get Texture() { return 'Content/Items/Weapons/CalamityWeapons/ScourgeOfTheDesert'; }
    HitTiles = false;
    Emerging = false;

    SetDefaults() {
        this.Projectile.width = 50;
        this.Projectile.height = 50;
        this.Projectile.friendly = true;
        this.Projectile.penetrate = 2;
        this.Projectile.DamageType = ModContent.GetInstance(RogueDamageClass);
        this.Projectile.tileCollide = false;
        this.Projectile.timeLeft = 600;
        this.Projectile.extraUpdates = 1;
        this.Projectile.usesLocalNPCImmunity = true;
        this.Projectile.localNPCHitCooldown = 50;
    }

    AI(proj) {
        this.Time++;
        proj.rotation = Vector2.ToRotation(proj.velocity) + MathHelper.PiOver4;

        if (Rand.NextBool(2)) {
            const dust = NewDust(proj.position, proj.width, proj.height, DustID.Sand, 0, 0, 0, Color.White, 0.5);
            dust.noGravity = true;
            dust.velocity = Vector2.Multiply(proj.velocity, -0.5);
        }

        if (!this.HitTiles && this.Time > 45) {
            if (proj.velocity.Y < 0) proj.velocity.Y *= 0.95;
            proj.velocity.Y += 0.15;
            proj.velocity.X *= 0.98;
        }

        if (this.HitTiles && !this.Emerging) {
            this.Emerging = true;
            proj.velocity = Vector2.Multiply(Vector2.Normalize(proj.velocity), 12);
            proj.velocity.Y = -Math.abs(proj.velocity.Y) - 4;
        }
        if (this.Emerging && Vector2.Length(proj.velocity) < 12) {
            proj.velocity = Vector2.Multiply(Vector2.Normalize(proj.velocity), 12);
        }
    }

    OnTileCollide(proj, oldVelocity) {
        this.HitTiles = true;
        proj.velocity = Vector2.Multiply(oldVelocity, 0.5);
        return false;
    }
}

// 水流喷射的沙流：穿透，命中后开始下坠。
export class Sandstream extends ModProjectile {
    Time = 0;

    get Texture() { return INVISIBLE; }
    PostHit = false;

    SetDefaults() {
        this.Projectile.width = 32;
        this.Projectile.height = 32;
        this.Projectile.friendly = true;
        this.Projectile.ignoreWater = true;
        this.Projectile.penetrate = -1;
        this.Projectile.extraUpdates = 2;
        this.Projectile.DamageType = DamageClass.Magic;
        this.Projectile.tileCollide = true;
        this.Projectile.timeLeft = 240;
        this.Projectile.usesLocalNPCImmunity = true;
        this.Projectile.localNPCHitCooldown = -1;
    }

    AI(proj) {
        this.Time++;
        if (this.PostHit) {
            if (this.Time > 15) proj.velocity.X *= 0.9711;
            if (proj.velocity.Y < 15 && this.Time > 15) proj.velocity.Y += 0.16;
        }
        if (Rand.NextBool(2)) {
            const dust = NewDust(proj.Center, 4, 4, DustID.Sand, 0, 0, 0, Color.White, 1.2);
            dust.noGravity = true;
        }
    }

    OnHitNPC(proj, target, hit, damageDone) {
        this.PostHit = true;
        proj.penetrate = 1;
    }
}

// 巴淋内德的箭：穿过一次、命中留沙尘。
export class BarinadeArrow extends ModProjectile {
    SetDefaults() {
        this.Projectile.width = 20;
        this.Projectile.height = 20;
        this.Projectile.friendly = true;
        this.Projectile.DamageType = DamageClass.Ranged;
        this.Projectile.arrow = true;
        this.Projectile.penetrate = 1;
        this.Projectile.timeLeft = 300;
        this.Projectile.extraUpdates = 2;
    }

    AI(proj) {
        proj.rotation = Vector2.ToRotation(proj.velocity) + MathHelper.PiOver2;
        if (Rand.NextBool(3)) {
            const dust = NewDust(proj.Center, 4, 4, DustID.Sand, 0, 0, 100, Color.White, 0.9);
            dust.noGravity = true;
        }
    }
}

// 荒漠灾虫之鞭的刀光：短距离突刺。
export class SaharaSlicersBolt extends ModProjectile {
    SetDefaults() {
        this.Projectile.width = 40;
        this.Projectile.height = 40;
        this.Projectile.friendly = true;
        this.Projectile.DamageType = DamageClass.Melee;
        this.Projectile.penetrate = -1;
        this.Projectile.tileCollide = false;
        this.Projectile.timeLeft = 12;
    }

    AI(proj) {
        proj.velocity = Vector2.Multiply(proj.velocity, 0.9);
        proj.rotation = Vector2.ToRotation(proj.velocity);
    }
}
