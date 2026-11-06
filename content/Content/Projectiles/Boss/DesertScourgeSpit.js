const { DustID, SoundID } = Terraria.ID;
const NewDust = Terraria.Dust['Dust NewDustDirect(Vector2 Position, int Width, int Height, int Type, float SpeedX, float SpeedY, int Alpha, Color newColor, float Scale)'];

// 荒漠灾虫的沙暴弹幕：复仇模式下由虫身向玩家喷出，无视重力。
export class DesertScourgeSpit extends ModProjectile {
    SetStaticDefaults() {
        Terraria.Main.projFrames[this.Type] = 4;
    }

    SetDefaults() {
        this.Projectile.width = 16;
        this.Projectile.height = 16;
        this.Projectile.hostile = true;
        this.Projectile.friendly = false;
        this.Projectile.tileCollide = false;
        this.Projectile.penetrate = 1;
        this.Projectile.timeLeft = 600;
        this.Projectile.aiStyle = -1;
        this.Projectile.alpha = 255;
    }

    AI(proj) {
        proj.frameCounter++;
        if (proj.frameCounter > 4) {
            proj.frame++;
            proj.frameCounter = 0;
        }
        if (proj.frame >= 4) proj.frame = 0;

        proj.rotation = Vector2.ToRotation(proj.velocity) + MathHelper.PiOver2;

        proj.localAI[0] += 1;
        if (proj.localAI[0] > 4 && proj.alpha > 0) {
            proj.alpha = Math.max(0, proj.alpha - 50);
            const dust = NewDust(proj.position, proj.width, proj.height, DustID.Sand, 0, 0, 100, Color.White, 1);
            dust.noGravity = true;
        }
    }

    OnKill(proj, timeLeft) {
        SoundEngine.PlaySound(SoundID.Dig, proj.Center);
        for (let i = 0; i < 16; i++) {
            const direction = Vector2.RotatedBy(Vector2.Normalize(proj.velocity), Math.random() * Math.PI);
            const dust = NewDust(proj.Center, 16, 16, DustID.Sand, direction.X * 3, direction.Y * 3, 60, Color.White, 1.4);
            dust.noGravity = true;
        }
    }
}
