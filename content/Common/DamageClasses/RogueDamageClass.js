// 灾厄的盗贼职业：继承投掷（Throwing）与通用（Generic）的全部加成，
// 判定为投掷类效果（和原版灾厄 CalamityMod/DamageClasses/RogueDamageClasses.cs 一致）。
export class RogueDamageClass extends DamageClass {
    GetModifierInheritance(damageClass) {
        if (damageClass === DamageClass.Generic) return StatInheritanceData.Full;
        if (damageClass === DamageClass.Throwing) return StatInheritanceData.Full;
        return StatInheritanceData.None;
    }

    GetEffectInheritance(damageClass) {
        return damageClass === DamageClass.Throwing;
    }
}
