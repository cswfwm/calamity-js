// 海星召唤杖的增益：有仆从在场时保持不灭。
export class BrittleStarBuff extends ModBuff {
    SetStaticDefaults() {
        Terraria.Main.buffNoSave[this.Type] = true;
        Terraria.Main.buffNoTimeDisplay[this.Type] = true;
    }

    UpdatePlayer(player, buffIndex) {
        if (player.ownedProjectileCounts[ModProjectile.getTypeByName('BrittleStarMinion')] > 0) {
            player.buffTime[buffIndex] = 18000;
        } else {
            player.DelBuff(buffIndex);
        }
    }
}
