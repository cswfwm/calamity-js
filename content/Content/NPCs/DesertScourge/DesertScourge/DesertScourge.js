import { DownedBossSystem } from '../../../../Common/Systems/DownedBossSystem.js';
import { CalamityConfig } from '../../../../Common/Configs/CalamityConfig.js';

const { NPCID, SoundID, ItemID, BuffID } = Terraria.ID;
const { ItemDropRule } = Terraria.GameContent.ItemDropRules;
const NewNPC = Terraria.NPC['int NewNPC(IEntitySource source, int X, int Y, int Type, int Start, float ai0, float ai1, float ai2, float ai3, int Target)'];
const NewProjectile = Terraria.Projectile['int NewProjectile(IEntitySource spawnSource, float X, float Y, float SpeedX, float SpeedY, int Type, int Damage, float KnockBack, int Owner, float ai0, float ai1, float ai2, NewProjectileModifier modifer)'];
const NewDust = Terraria.Dust['Dust NewDustDirect(Vector2 Position, int Width, int Height, int Type, float SpeedX, float SpeedY, int Alpha, Color newColor, float Scale)'];

// 所有生成物都归属于本机玩家，避免在联机客户端上重复生成。
const SourceOf = () => Terraria.Main.player[Terraria.Main.myPlayer].GetSource_FromThis();

// 每段之间的目标间距，取灾厄原版 60/50/42 的中间节奏。
const SEGMENT_SPACING = 52;
const BURROW_GATE = 600;
const BURROW_RESET_GATE = 1200;
const SPIT_GATE = 300;
const ENRAGE_FRAMES = 180;
const BURROW_DISTANCE = 800;

// 荒漠灾虫：灾厄的第一个困难模式前 Boss。
// 数值全部取自 CalamityMod 2.2.2 的 NPCs/DesertScourge/DesertScourgeHead.cs。
export class DesertScourgeHead extends ModNPC {
    SegmentCount = 0;
    EnrageTimer = ENRAGE_FRAMES;
    SpitTimer = 0;
    BurrowTimer = 0;
    Burrowing = false;
    LungeUpward = false;
    BurrowTargetY = 0;
    Lunged = false;

    SetStaticDefaults() {
        // 自绘贴图只有一帧。
        Terraria.Main.npcFrameCount[this.Type] = 1;
        NPCID.Sets.MPAllowedEnemies[this.Type] = true;
        NPCID.Sets.BossBestiaryPriority.Add(this.Type);
    }

    SetDefaults() {
        this.NPC.width = 104;
        this.NPC.height = 104;
        this.NPC.aiStyle = -1;
        this.NPC.damage = 40;
        this.NPC.defense = 4;
        this.NPC.lifeMax = 4000;
        this.NPC.knockBackResist = 0;
        this.NPC.boss = true;
        this.NPC.noGravity = true;
        this.NPC.noTileCollide = true;
        this.NPC.behindTiles = true;
        this.NPC.npcSlots = 12;
        this.NPC.alpha = 255;
        this.NPC.HitSound = SoundID.NPCHit1;
        this.NPC.DeathSound = SoundID.NPCDeath1;
        this.NPC.value = ModNPC.NPCValue(0, 5, 0, 0);
        this.EnrageTimer = ENRAGE_FRAMES;
    }

    ApplyBuffImmunity(npc) {
        npc.buffImmune[BuffID.Confused] = true;
    }

    AI(npc) {
        const players = Terraria.Main.player;
        if (npc.target < 0 || npc.target === 255 || players[npc.target].dead || !players[npc.target].active) {
            npc.TargetClosest(true);
        }
        const player = players[npc.target];

        this.SpawnSegments(npc);
        this.UpdateEnrage(npc, player);

        if (player.dead) {
            npc.velocity.Y += 1;
            npc.EncourageDespawn(10);
            return;
        }

        const lifeRatio = npc.life / npc.lifeMax;
        const revenge = CalamityConfig.IsRevengeance();
        const death = CalamityConfig.IsDeath();

        // 灾厄原版的速度：普通 10，死亡模式 15，复仇再按生命值加成。
        let maxChaseSpeed = death ? 15 : revenge ? 12.5 : 10;
        maxChaseSpeed += maxChaseSpeed * 0.2 * (1 - lifeRatio);
        if (this.EnrageTimer <= 0) maxChaseSpeed *= 1.25;

        this.BurrowTimer++;
        const burrowReady = this.BurrowTimer >= BURROW_GATE;

        if (this.Burrowing) {
            this.BurrowAI(npc, player, maxChaseSpeed, revenge, death);
            return;
        }

        if (burrowReady && player.Center.Y > npc.Center.Y) this.StartBurrow(npc, player);

        // 复仇模式下的沙暴弹幕
        if (revenge) {
            this.SpitTimer++;
            if (this.SpitTimer >= SPIT_GATE) {
                this.SpitTimer = 0;
                this.SpitSpread(npc, player, 21, 8);
            }
        }

        // 平时绕向玩家，靠近后小幅加速冲刺（灾厄的“咬”）。
        const toPlayer = Vector2.Subtract(player.Center, npc.Center);
        const distance = Vector2.Length(toPlayer);
        const desired = Vector2.Multiply(Vector2.Normalize(toPlayer), distance < 240 ? maxChaseSpeed * 1.4 : maxChaseSpeed);
        npc.velocity = Vector2.Add(npc.velocity, Vector2.Multiply(Vector2.Subtract(desired, npc.velocity), 0.09));

        const speed = Vector2.Length(npc.velocity);
        if (speed > maxChaseSpeed * 1.6) {
            npc.velocity = Vector2.Multiply(Vector2.Normalize(npc.velocity), maxChaseSpeed * 1.6);
        }

        npc.rotation = Vector2.ToRotation(npc.velocity) + MathHelper.PiOver2;
        npc.spriteDirection = npc.velocity.X > 0 ? -1 : 1;
    }

    StartBurrow(npc, player) {
        this.Burrowing = true;
        this.LungeUpward = false;
        this.Lunged = false;
        this.BurrowTimer = 0;
        this.BurrowTargetY = player.Center.Y + BURROW_DISTANCE;
        npc.velocity = Vector2.new(npc.velocity.X * 0.4, 14);
    }

    BurrowAI(npc, player, maxChaseSpeed, revenge, death) {
        // 向下钻，直到到达玩家下方的目标高度，再从脚下冲上来。
        if (!this.LungeUpward) {
            npc.velocity.Y = Math.min(npc.velocity.Y + 0.6, 22);
            npc.velocity.X *= 0.94;
            if (npc.Center.Y >= this.BurrowTargetY) {
                this.LungeUpward = true;
                npc.Center = Vector2.new(player.Center.X, player.Center.Y + 420);
                npc.velocity = Vector2.new(0, -20);
                SoundEngine.PlaySound(SoundID.Roar, npc.Center);
            }
        } else {
            npc.velocity.Y -= 0.25;
            if (npc.velocity.Y < -22) npc.velocity.Y = -22;
            npc.velocity.X *= 0.97;

            // 冲上来的同时向上喷一圈沙弹，正对应灾厄的 lungeUpward 逻辑。
            if (!this.Lunged && npc.Center.Y <= player.Center.Y + 120) {
                this.Lunged = true;
                this.SpitSpread(npc, player,
                    death ? 24 : revenge ? 21 : 18,
                    death ? 8.5 : revenge ? 8 : 7.5, true);
                this.BurrowTimer = 0;
                this.Burrowing = false;
                this.LungeUpward = false;
            }
        }

        if (this.BurrowTimer >= BURROW_RESET_GATE) {
            this.Burrowing = false;
            this.BurrowTimer = 0;
        }

        npc.rotation = Vector2.ToRotation(npc.velocity) + MathHelper.PiOver2;
    }

    UpdateEnrage(npc, player) {
        if (player.ZoneDesert || player.ZoneUndergroundDesert) {
            this.EnrageTimer = ENRAGE_FRAMES;
            return;
        }
        if (this.EnrageTimer > 0) this.EnrageTimer--;
    }

    // 灾厄的沙暴喷吐：以当前朝向为中心，±45° 均匀铺开。
    SpitSpread(npc, player, count, velocity, upward) {
        if (Terraria.Main.netMode === 1) return;
        const type = ModProjectile.getTypeByName('DesertScourgeSpit');
        const baseDir = upward
            ? Vector2.Normalize(Vector2.new(player.Center.X - npc.Center.X, -Math.abs(npc.velocity.Y) - 4))
            : Vector2.Normalize(Vector2.Subtract(player.Center, npc.Center));
        const spread = MathHelper.ToRadians(90);

        for (let i = 0; i < count; i++) {
            const angle = MathHelper.Lerp(-spread, spread, count === 1 ? 0.5 : i / (count - 1));
            const dir = Vector2.RotatedBy(baseDir, angle);
            NewProjectile(SourceOf(npc), npc.Center.X + dir.X * 8, npc.Center.Y + dir.Y * 8,
                dir.X * velocity, dir.Y * velocity, type, 10, 0, 255, 0, 0, 0, null);
            const dust = NewDust(npc.Center, 10, 10, DustID.Sandnado, 0, 0, 0, Color.White, 1.2);
            dust.noGravity = true;
            dust.velocity = Vector2.Multiply(dir, velocity);
        }
    }

    // 分节数量：普通 15，复仇 21，死亡 24（灾厄原版 15/18/21/24 的映射）。
    SpawnSegments(npc) {
        if (this.SegmentCount > 0 || Terraria.Main.netMode === 1) return;
        const count = CalamityConfig.IsDeath() ? 24 : CalamityConfig.IsRevengeance() ? 21 : 15;
        const bodyType = ModNPC.getTypeByName('DesertScourgeBody');
        const tailType = ModNPC.getTypeByName('DesertScourgeTail');

        let previous = npc.whoAmI;
        for (let i = 0; i < count + 1; i++) {
            const isTail = i === count;
            const index = NewNPC(SourceOf(npc), Math.trunc(npc.Center.X), Math.trunc(npc.Center.Y),
                isTail ? tailType : bodyType, 0, 0, previous, npc.whoAmI, 0, 255);
            if (index < 0) break;
            const segment = Terraria.Main.npc[index];
            segment.ai[1] = previous;
            segment.ai[2] = npc.whoAmI;
            segment.realLife = npc.whoAmI;
            Terraria.Main.npc[previous].ai[0] = index;
            previous = index;
        }
        this.SegmentCount = count + 1;
    }

    ModifyNPCLoot(npcLoot) {
        const Common = ItemDropRule['IItemDropRule Common(int itemId, int chanceDenominator, int minimumDropped, int maximumDropped)'];
        // NPC 先于弹幕/物品注册，这里直接用名字取类型会拿到 0，交给掉落表延迟解析。

        // 灾厄原版掉落：材料、贝壳、海星、沙块、弱效治疗药水，外加五选一武器。
        npcLoot.Add(Common(ModItem.getTypeByName('PearlShard'), 1, 5, 9));
        npcLoot.Add(Common(ItemID.Coral, 1, 5, 9));
        npcLoot.Add(Common(ItemID.Seashell, 1, 5, 9));
        npcLoot.Add(Common(ItemID.Starfish, 1, 5, 9));
        npcLoot.Add(Common(ItemID.SandBlock, 1, 5, 15));
        npcLoot.Add(Common(ItemID.LesserHealingPotion, 1, 8, 14));
        // 灾厄的“五选一”武器：每条都是 1/5 概率，实际期望与五选一相同。
        npcLoot.Add(Common(ModItem.getTypeByName('SaharaSlicers'), 5, 1, 1));
        npcLoot.Add(Common(ModItem.getTypeByName('Barinade'), 5, 1, 1));
        npcLoot.Add(Common(ModItem.getTypeByName('SandstreamScepter'), 5, 1, 1));
        npcLoot.Add(Common(ModItem.getTypeByName('BrittleStarStaff'), 5, 1, 1));
        npcLoot.Add(Common(ModItem.getTypeByName('ScourgeOfTheDesert'), 5, 1, 1));
        // 专家模式的宝藏袋
        npcLoot.Add(ItemDropRule.BossBag(ModItem.getTypeByName('DesertScourgeBag')));
    }

    OnKill(npc) {
        DownedBossSystem.downedDesertScourge = true;
        for (let i = 0; i < Terraria.Main.maxNPCs; i++) {
            const other = Terraria.Main.npc[i];
            if (!other.active || other.whoAmI === npc.whoAmI) continue;
            if ((other.ModNPC instanceof DesertScourgeBody || other.ModNPC instanceof DesertScourgeTail) &&
                Math.trunc(other.ai[2]) === npc.whoAmI) {
                other.active = false;
            }
        }
    }
}

// 身体：灾厄原版 104×104、伤害 16、防御 6，生命跟随头部。
export class DesertScourgeBody extends ModNPC {
    SetStaticDefaults() {
        Terraria.Main.npcFrameCount[this.Type] = 1;
    }

    SetDefaults() {
        this.NPC.width = 104;
        this.NPC.height = 104;
        this.NPC.aiStyle = -1;
        this.NPC.damage = 16;
        this.NPC.defense = 6;
        this.NPC.lifeMax = 4200;
        this.NPC.knockBackResist = 0;
        this.NPC.boss = true;
        this.NPC.noGravity = true;
        this.NPC.noTileCollide = true;
        this.NPC.behindTiles = true;
        this.NPC.dontCountMe = true;
        this.NPC.alpha = 255;
        this.NPC.HitSound = SoundID.NPCHit1;
        this.NPC.DeathSound = SoundID.NPCDeath1;
    }

    AI(npc) {
        const head = Terraria.Main.npc[Math.trunc(npc.ai[2])];
        if (!head.active) {
            npc.active = false;
            return;
        }
        npc.life = head.life;
        npc.lifeMax = head.lifeMax;
        DesertScourgeBody.Follow(npc, SEGMENT_SPACING);
    }

    // 用速度而非直接改位置跟随前一段：位置更新发生在 AI 之后。
    static Follow(npc, spacing) {
        const previous = Terraria.Main.npc[Math.trunc(npc.ai[1])];
        if (!previous.active) {
            npc.active = false;
            return;
        }
        const toPrevious = Vector2.Subtract(previous.Center, npc.Center);
        const distance = Vector2.Length(toPrevious);
        npc.velocity = distance > spacing
            ? Vector2.Multiply(Vector2.Normalize(toPrevious), Math.min(distance - spacing, 30))
            : Vector2.Zero;
        npc.rotation = Vector2.ToRotation(toPrevious) + MathHelper.PiOver2;
    }
}

// 尾巴：灾厄原版 104×104、伤害 14、防御 9。
export class DesertScourgeTail extends ModNPC {
    SetStaticDefaults() {
        // 尾巴贴图只有一帧。
        Terraria.Main.npcFrameCount[this.Type] = 1;
    }

    SetDefaults() {
        this.NPC.width = 104;
        this.NPC.height = 104;
        this.NPC.aiStyle = -1;
        this.NPC.damage = 14;
        this.NPC.defense = 9;
        this.NPC.lifeMax = 4200;
        this.NPC.knockBackResist = 0;
        this.NPC.boss = true;
        this.NPC.noGravity = true;
        this.NPC.noTileCollide = true;
        this.NPC.behindTiles = true;
        this.NPC.dontCountMe = true;
        this.NPC.alpha = 255;
        this.NPC.HitSound = SoundID.NPCHit1;
        this.NPC.DeathSound = SoundID.NPCDeath1;
    }

    AI(npc) {
        const head = Terraria.Main.npc[Math.trunc(npc.ai[2])];
        if (!head.active) {
            npc.active = false;
            return;
        }
        npc.life = head.life;
        npc.lifeMax = head.lifeMax;
        DesertScourgeBody.Follow(npc, SEGMENT_SPACING);
    }
}
