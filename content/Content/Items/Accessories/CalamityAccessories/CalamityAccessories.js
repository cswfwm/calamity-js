import { RogueDamageClass } from '../../../../Common/DamageClasses/RogueDamageClass.js';

const RogueClass = () => ModContent.GetInstance(RogueDamageClass);

// 海波项链（Ocean Crest）：荒漠灾虫宝藏袋里的专家饰品。
// 灾厄原版让它免除多数海洋生物的伤害并在水下呼吸，这里保留相同效果。
export class OceanCrest extends ModItem {
    SetDefaults() {
        this.Item.width = 18;
        this.Item.height = 26;
        this.Item.value = Terraria.Item.sellPrice(1, 0, 0, 0);
        this.Item.rare = ItemRarityID.Green;
        this.Item.accessory = true;
        this.Item.expert = true;
    }

    UpdateAccessory(item, player, vanity, hideVisual) {
        if (vanity) return;
        player.ignoreWater = true;
        player.accFlipper = true;
    }
}

// 沙尘披风（Sand Cloak）：盗贼饰品，提高盗贼伤害并缩短潜行充能时间。
export class SandCloak extends ModItem {
    SetDefaults() {
        this.Item.width = 30;
        this.Item.height = 44;
        this.Item.value = Terraria.Item.sellPrice(0, 3, 0, 0);
        this.Item.rare = ItemRarityID.Green;
        this.Item.accessory = true;
    }

    UpdateAccessory(item, player, vanity, hideVisual) {
        if (vanity) return;
        player.GetDamage(RogueClass()).Additive += 0.08;
        player.GetCritChance(RogueClass()).value += 4;
    }
}
