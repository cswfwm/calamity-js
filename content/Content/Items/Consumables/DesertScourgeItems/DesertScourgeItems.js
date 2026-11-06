const { ItemID, ItemUseStyleID, SoundID } = Terraria.ID;
const PlaySound = Terraria.Audio.SoundEngine['void PlaySound(int type, Vector2 position, int style, float pitchOffset)'];
const { ItemDropRule } = Terraria.GameContent.ItemDropRules;

// 荒漠吊坠：在沙漠中使用，召唤荒漠灾虫（灾厄的召唤物）。
export class DesertMedallion extends ModItem {
    SetDefaults() {
        this.Item.width = 30;
        this.Item.height = 26;
        this.Item.maxStack = ModItem.CommonMaxStack;
        this.Item.value = Terraria.Item.sellPrice(0, 0, 20, 0);
        this.Item.rare = ItemRarityID.Blue;
        this.Item.useAnimation = 45;
        this.Item.useTime = 45;
        this.Item.useStyle = ItemUseStyleID.HoldUp;
        this.Item.consumable = true;
    }

    CanUseItem(item, player) {
        return (player.ZoneDesert || player.ZoneUndergroundDesert) && !Terraria.NPC.AnyNPCs(ModNPC.getTypeByName('DesertScourgeHead'));
    }

    UseItem(item, player) {
        if (player.whoAmI !== Terraria.Main.myPlayer) return true;
        PlaySound(SoundID.Roar, player.position, 0, 0);
        if (Terraria.Main.netMode !== 1) {
            Terraria.NPC.SpawnOnPlayer(player.whoAmI, ModNPC.getTypeByName('DesertScourgeHead'), 0, 0, 0, 0);
        }
        return true;
    }

    AddRecipes() {
        this.CreateRecipe()
            .AddIngredient(ModItem.getTypeByName('PearlShard'), 5)
            .AddIngredient(ItemID.SandBlock, 20)
            .AddTile(TileID.Anvils)
            .Register();
    }
}

// 珍珠碎片：荒漠灾虫掉落的合成材料（灾厄原版叫 Pearl Shard）。
export class PearlShard extends ModItem {
    SetStaticDefaults() {
        this.Item.ResearchUnlockCount = 25;
    }

    SetDefaults() {
        this.Item.width = 20;
        this.Item.height = 26;
        this.Item.maxStack = ModItem.CommonMaxStack;
        this.Item.value = Terraria.Item.sellPrice(0, 0, 1, 0);
        this.Item.rare = ItemRarityID.Green;
    }
}

// 荒漠灾虫宝藏袋：专家模式掉落，一次开出经典模式的全部掉落。
export class DesertScourgeBag extends ModItem {
    SetStaticDefaults() {
        ItemID.Sets.BossBag[this.Type] = true;
        ItemID.Sets.PreHardmodeLikeBossBag[this.Type] = true;
    }

    SetDefaults() {
        this.Item.width = 24;
        this.Item.height = 24;
        this.Item.maxStack = ModItem.CommonMaxStack;
        this.Item.consumable = true;
        this.Item.rare = ItemRarityID.Cyan;
        this.Item.expert = true;
    }

    CanRightClick(item) {
        return true;
    }

    ModifyItemLoot(itemLoot) {
        const Common = ItemDropRule['IItemDropRule Common(int itemId, int chanceDenominator, int minimumDropped, int maximumDropped)'];
        itemLoot.Add(ItemDropRule.CoinsBasedOnNPCValue(ModNPC.getTypeByName('DesertScourgeHead')));
        itemLoot.Add(Common(ModItem.getTypeByName('PearlShard'), 1, 30, 40));
        itemLoot.Add(Common(ModItem.getTypeByName('SaharaSlicers'), 5, 1, 1));
        itemLoot.Add(Common(ModItem.getTypeByName('Barinade'), 5, 1, 1));
        itemLoot.Add(Common(ModItem.getTypeByName('SandstreamScepter'), 5, 1, 1));
        itemLoot.Add(Common(ModItem.getTypeByName('BrittleStarStaff'), 5, 1, 1));
        itemLoot.Add(Common(ModItem.getTypeByName('ScourgeOfTheDesert'), 5, 1, 1));
    }
}
