// 灾厄的两套额外难度：复仇模式与死亡模式。
// 原版灾厄里这两个开关在角色/世界难度界面，手机上放在模组配置里。
export class CalamityConfig extends ModConfig {
    static Options = {
        Difficulty: ModConfig.Radio('Off', ['Off', 'Revengeance', 'Death']),
    };

    static IsRevengeance() {
        const mode = ModContent.GetInstance(CalamityConfig).Difficulty;
        return mode === 'Revengeance' || mode === 'Death';
    }

    static IsDeath() {
        return ModContent.GetInstance(CalamityConfig).Difficulty === 'Death';
    }

    // 死亡模式给 Boss 额外 25% 速度与攻击频率，对应灾厄原版的难度缩放。
    static SpeedMultiplier() {
        return CalamityConfig.IsDeath() ? 1.25 : 1;
    }
}
