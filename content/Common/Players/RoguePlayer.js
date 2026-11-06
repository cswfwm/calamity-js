import { RogueDamageClass } from '../DamageClasses/RogueDamageClass.js';

// 数值取自灾厄 CalamityPlayer.UpdateRogueStealth：站定 2 秒（120 帧）充满，移动时充能减缓。
const STEALTH_FULL_FRAMES = 120;

const RogueClass = () => ModContent.GetInstance(RogueDamageClass);

export class RoguePlayer extends ModPlayer {
    // 0..1，界面上 ×100 显示，和灾厄一致。
    Stealth = 0;
    // 沙暴剑的左右交替计数。
    SwingCounter = 0;

    ResetEffects(player) {
        if (!RoguePlayer.IsRogueWeapon(player.HeldItem)) this.Stealth = 0;
    }

    PostUpdateEquips(player) {
        if (!RoguePlayer.IsRogueWeapon(player.HeldItem)) return;

        const moving = Math.abs(player.velocity.X) > 0.08 || Math.abs(player.velocity.Y) > 0.08;
        const gen = moving ? 0.8 : 1;
        this.Stealth = Math.min(1, this.Stealth + gen / STEALTH_FULL_FRAMES);
    }

    // 满潜行时的这一次出手吃掉潜行，换成潜行突袭的额外伤害。
    TakeStealthStrike(player, item) {
        if (this.Stealth < 1) return 1;
        this.Stealth = 0;
        return RoguePlayer.StrikeMultiplier(item);
    }

    // 灾厄的公式：使用时间越长，潜行突袭的收益越高（12 帧约 2.1 倍，24 帧约 2.4 倍）。
    static StrikeMultiplier(item) {
        const useTime = Math.max(1, Math.max(item.useTime, item.useAnimation));
        return 0.75 + 0.75 * (Math.log(useTime + 2) / Math.log(4));
    }

    static IsRogueWeapon(item) {
        return !!item && !item.IsAir && item.CountsAsClass(RogueClass());
    }

    static IsStealthFull(player) {
        return player.GetModPlayer(RoguePlayer).Stealth >= 1;
    }

    static ConsumeStealth(player) {
        player.GetModPlayer(RoguePlayer).Stealth = 0;
    }

    SaveData(tag) {
        tag.Stealth = this.Stealth;
    }

    LoadData(tag) {
        this.Stealth = tag.ContainsKey('Stealth') ? Math.min(1, Math.max(0, tag.GetFloat('Stealth'))) : 0;
    }
}
