const { Main, Utils } = Terraria;
const { SpriteEffects } = Microsoft.Xna.Framework.Graphics;
const { TextureAssets } = Terraria.GameContent;
const GetLerpValue = Utils['float GetLerpValue(float from, float to, float t, bool clamped)'];
const LineHits = Terraria.Collision['bool CheckAABBvLineCollision(Vector2 objectPosition, Vector2 objectDimensions, Vector2 lineStart, Vector2 lineEnd, float lineWidth, ref float collisionPoint)'];

// 沙暴剑的突刺：贴着玩家手部前推的短剑弹幕（灾厄的 SaharaSlicersBlade）。
// 两种变体只在贴图上不同，由武器左右交替发射。
class SaharaBlade extends ModProjectile {
    static FadeInDuration = 4;
    static FadeOutDuration = 4;
    static TotalDuration = 12;

    CollisionWidth(proj) { return 12 * proj.scale; }

    SetDefaults(proj) {
        proj.width = proj.height = 32;
        proj.aiStyle = -1;
        proj.friendly = true;
        proj.penetrate = -1;
        proj.tileCollide = false;
        proj.scale = 1;
        proj.DamageType = DamageClass.Melee;
        proj.ownerHitCheck = true;
        proj.extraUpdates = 1;
        proj.timeLeft = 360;
        proj.usesOwnerLight = true;
    }

    AI(proj) {
        const player = Main.player[proj.owner];
        const timer = ++proj.ai[0];
        if (timer >= SaharaBlade.TotalDuration) {
            proj.Kill();
            return;
        }
        player.heldProj = proj.whoAmI;

        const { FadeInDuration, FadeOutDuration, TotalDuration } = SaharaBlade;
        proj.Opacity = GetLerpValue(0, FadeInDuration, timer, true) * GetLerpValue(TotalDuration, TotalDuration - FadeOutDuration, timer, true);

        const hand = player['Vector2 RotatedRelativePoint(Vector2 pos, bool reverseRotation, bool addGfxOffY, int pushFromOriginHack)'](player.MountedCenter, false, true, 0);
        proj.Center = Vector2.Add(hand, Vector2.Multiply(proj.velocity, timer - 1));
        proj.spriteDirection = proj.velocity.X >= 0 ? 1 : -1;
        proj.rotation = Vector2.ToRotation(proj.velocity) + MathHelper.PiOver2 - MathHelper.PiOver4 * proj.spriteDirection;
    }

    ShouldUpdatePosition(proj) {
        return false;
    }

    Colliding(proj, projHitbox, targetHitbox) {
        const start = proj.Center;
        const end = Vector2.Add(start, Vector2.Multiply(proj.velocity, 6));
        return LineHits(Vector2.new(targetHitbox.X, targetHitbox.Y), Vector2.new(targetHitbox.Width, targetHitbox.Height),
            start, end, this.CollisionWidth(proj), new Ref(0));
    }

    PreDraw(proj, lightColor) {
        const texture = TextureAssets.Projectile[this.Type].Value;
        const origin = Vector2.new(texture.Width / 2, texture.Height / 2);
        const effects = proj.spriteDirection === -1 ? SpriteEffects.FlipHorizontally : SpriteEffects.None;
        Main.spriteBatch['void Draw(Texture2D texture, Vector2 position, Nullable`1 sourceRectangle, Color color, float rotation, Vector2 origin, float scale, SpriteEffects effects, float layerDepth)'](
            texture, Vector2.Subtract(proj.Center, Main.screenPosition), null, lightColor,
            proj.rotation, origin, proj.scale, effects, 0);
        return false;
    }
}

export class SaharaSlicersBlade extends SaharaBlade {
    get Texture() { return 'Content/Projectiles/SaharaBlades/SaharaSlicersBlade'; }
}

export class SaharaSlicersBladeAlt extends SaharaBlade {
    get Texture() { return 'Content/Projectiles/SaharaBlades/SaharaSlicersBladeAlt'; }
}

// 右键投出的刀光：直线飞行，命中两次后消失。
export class SaharaSlicersBolt extends ModProjectile {
    SetDefaults() {
        this.Projectile.width = 24;
        this.Projectile.height = 24;
        this.Projectile.friendly = true;
        this.Projectile.DamageType = DamageClass.Melee;
        this.Projectile.penetrate = 2;
        this.Projectile.tileCollide = true;
        this.Projectile.timeLeft = 120;
        this.Projectile.usesLocalNPCImmunity = true;
        this.Projectile.localNPCHitCooldown = 20;
    }

    AI(proj) {
        proj.rotation = Vector2.ToRotation(proj.velocity);
    }
}
