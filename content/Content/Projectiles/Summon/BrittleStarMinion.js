const { ProjectileID } = Terraria.ID;

// 海星召唤杖的召唤物：围绕玩家、自动追敌的近战仆从。
export class BrittleStarMinion extends ModProjectile {
    SetStaticDefaults() {
        ProjectileID.Sets.MinionTargetingFeature[this.Type] = true;
        Terraria.Main.projPet[this.Type] = true;
        ProjectileID.Sets.MinionSacrificable[this.Type] = true;
    }

    SetDefaults() {
        this.Projectile.width = 24;
        this.Projectile.height = 24;
        this.Projectile.tileCollide = false;
        this.Projectile.friendly = true;
        this.Projectile.minion = true;
        this.Projectile.minionSlots = 1;
        this.Projectile.penetrate = -1;
        this.Projectile.DamageType = DamageClass.Summon;
    }

    CanCutTiles(proj) {
        return false;
    }

    MinionContactDamage(proj) {
        return true;
    }

    AI(proj) {
        const owner = Terraria.Main.player[proj.owner];
        if (!owner.active || owner.dead) return;

        if (owner.FindBuffIndex(ModBuff.getTypeByName('BrittleStarBuff')) >= 0) proj.timeLeft = 2;

        const idle = Vector2.new(owner.Center.X + (40 + proj.minionPos * 36) * -owner.direction, owner.Center.Y - 50);
        let target = null;
        let best = 700;
        for (let i = 0; i < Terraria.Main.maxNPCs; i++) {
            const npc = Terraria.Main.npc[i];
            if (!npc.active || npc.friendly || npc.dontTakeDamage) continue;
            const distance = Vector2.Distance(npc.Center, proj.Center);
            if (distance < best) {
                best = distance;
                target = npc;
            }
        }

        const destination = target ? target.Center : idle;
        const toDestination = Vector2.Subtract(destination, proj.Center);
        const speed = target ? 11 : 9;
        const desired = Vector2.Multiply(Vector2.Normalize(toDestination), speed);
        proj.velocity = Vector2.Add(proj.velocity, Vector2.Multiply(Vector2.Subtract(desired, proj.velocity), 0.12));
        proj.rotation += 0.12;
    }
}
