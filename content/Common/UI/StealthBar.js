import { RoguePlayer } from '../Players/RoguePlayer.js';

const Main = Terraria.Main;
const FillRect = Microsoft.Xna.Framework.Graphics.SpriteBatch['void Draw(Texture2D texture, Rectangle destinationRectangle, Color color)'];
const DrawString = Microsoft.Xna.Framework.Graphics.SpriteBatch['void DrawString(SpriteFont spriteFont, string text, Vector2 position, Color color, float rotation, Vector2 origin, float scale, SpriteEffects effects, float layerDepth)'];

const BAR_WIDTH = 120;
const BAR_HEIGHT = 10;
const COLD = Color.new(96, 76, 160);
const FULL = Color.new(214, 170, 255);

// 盗贼潜行条：贴在生命/魔力条上方，满潜行时由暗紫变亮紫。
export class StealthBar extends UIState {
    area = null;

    OnInitialize() {
        const area = this.area = new UIElement();
        area.Left.Set(-BAR_WIDTH - 30, 1);
        area.Top.Set(36, 0);
        area.Width.Set(BAR_WIDTH, 0);
        area.Height.Set(BAR_HEIGHT, 0);
        this.Append(area);
    }

    static ModPlayerOf() {
        const player = Main.player[Main.myPlayer];
        return player ? player.GetModPlayer(RoguePlayer) : null;
    }

    static Visible() {
        const stealth = StealthBar.ModPlayerOf();
        return !!stealth && stealth.Stealth > 0 && RoguePlayer.IsRogueWeapon(Main.player[Main.myPlayer].HeldItem);
    }

    Draw(spriteBatch) {
        if (!StealthBar.Visible()) return;
        super.Draw(spriteBatch);
    }

    DrawSelf(spriteBatch) {
        const stealth = StealthBar.ModPlayerOf();
        if (!stealth) return;

        const box = this.area.GetInnerDimensions();
        const x = Math.trunc(box.X);
        const y = Math.trunc(box.Y);
        const pixel = Terraria.GameContent.TextureAssets.MagicPixel.Value;

        FillRect(spriteBatch, pixel, Rectangle.new(x - 2, y - 2, BAR_WIDTH + 4, BAR_HEIGHT + 4), Color.new(0, 0, 0, 160));
        const filled = Math.trunc(BAR_WIDTH * stealth.Stealth);
        if (filled > 0) {
            FillRect(spriteBatch, pixel, Rectangle.new(x, y, filled, BAR_HEIGHT), Color.Lerp(COLD, FULL, stealth.Stealth));
        }

        const font = Terraria.GameContent.FontAssets.MouseText.Value;
        DrawString(spriteBatch, font, Math.trunc(stealth.Stealth * 100) + '/100',
            Vector2.new(x + BAR_WIDTH + 8, y - 4), Color.White, 0, Vector2.Zero, 0.8, 0, 0);
    }
}

// 把潜行条挂进游戏的界面图层，位置在生命/魔力条之前。
export class StealthBarSystem extends ModSystem {
    ui = null;
    bar = null;

    PostSetupContent() {
        this.bar = new StealthBar();
        this.ui = new UserInterface();
        this.ui.SetState(this.bar);
    }

    UpdateUI(gameTime) {
        if (this.ui?.CurrentState) this.ui.Update(gameTime);
    }

    ModifyInterfaceLayers(layers) {
        const index = layers.FindIndex((layer) => layer.Name === 'Vanilla: Resource Bars');
        if (index === -1) return;
        layers.Insert(index, new LegacyGameInterfaceLayer('CalamityJS: Stealth Bar', () => {
            if (this.ui?.CurrentState) this.ui.Draw(Main.spriteBatch, null);
            return true;
        }, InterfaceScaleType.UI));
    }
}
