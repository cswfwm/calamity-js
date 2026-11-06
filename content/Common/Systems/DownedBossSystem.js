// 荒漠灾虫（Desert Scourge）：灾厄的第一个困难模式前 Boss。
// 数值取自 CalamityMod 2.2.2 的 NPCs/DesertScourge/DesertScourgeHead.cs：
// 生命 4000、伤害 40、防御 4、击退抗性 100%，离开沙漠持续 3 秒后狂暴。
export class DownedBossSystem extends ModSystem {
    static downedDesertScourge = false;

    ClearWorld() {
        DownedBossSystem.downedDesertScourge = false;
    }

    SaveWorldData(tag) {
        if (DownedBossSystem.downedDesertScourge) tag.downedDesertScourge = true;
    }

    LoadWorldData(tag) {
        DownedBossSystem.downedDesertScourge = tag.ContainsKey('downedDesertScourge');
    }

    NetSend(writer) {
        writer.WriteFlags(DownedBossSystem.downedDesertScourge);
    }

    NetReceive(reader) {
        [DownedBossSystem.downedDesertScourge] = reader.ReadFlags();
    }
}
