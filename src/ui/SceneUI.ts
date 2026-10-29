import Phaser from "phaser";
import { TEXT_RESOLUTION } from "../runtime/display";
import { GOLD, CREAM } from "./theme";
import type { GameScene } from "../scenes/GameScene";

export class SceneUI {
  constructor(private readonly scene: GameScene) {}

  text(
    x: number,
    y: number,
    value: string,
    size = 16,
    color = "#e7dfd0",
    parent = this.scene.hud,
  ) {
    const t = this.scene.add.text(x, y, value, {
      fontFamily: "Arial",
      fontSize: size + "px",
      color,
      wordWrap: { width: Math.max(100, this.scene.w - 48) },
      lineSpacing: 4,
      resolution: TEXT_RESOLUTION,
    });
    parent.add(t);
    return t;
  }
  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    alpha = 1,
    parent = this.scene.hud,
  ) {
    const r = this.scene.add.rectangle(x, y, w, h, color, alpha);
    parent.add(r);
    return r;
  }
  button(
    x: number,
    y: number,
    label: string,
    action: () => void,
    parent = this.scene.hud,
    width?: number,
    shortcut?: "Enter",
  ) {
    const t = this.scene.add
      .text(shortcut ? -22 : 0, 0, label, {
        fontFamily: "Georgia",
        fontSize: (this.scene.small ? 13 : 15) + "px",
        color: "#e8d3aa",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5);
    const bw = width ?? t.width + (shortcut ? 90 : 44);
    const height = 44;
    const panel = this.scene.add.graphics();
    const draw = (hover: boolean, pressed = false) => {
      panel.clear();
      // Cut-corner enamel plaque, independent of the keyboard artwork.
      const outline = [
        new Phaser.Geom.Point(-bw / 2 + 8, -height / 2),
        new Phaser.Geom.Point(bw / 2 - 8, -height / 2),
        new Phaser.Geom.Point(bw / 2, -height / 2 + 8),
        new Phaser.Geom.Point(bw / 2, height / 2 - 8),
        new Phaser.Geom.Point(bw / 2 - 8, height / 2),
        new Phaser.Geom.Point(-bw / 2 + 8, height / 2),
        new Phaser.Geom.Point(-bw / 2, height / 2 - 8),
        new Phaser.Geom.Point(-bw / 2, -height / 2 + 8),
      ];
      panel.fillStyle(pressed ? 0x111c29 : hover ? 0x29394a : 0x162332);
      panel.fillPoints(outline, true);
      panel.lineStyle(1, hover ? 0xf1d8a3 : GOLD, hover ? 1 : 0.7);
      panel.strokePoints(outline, true);
      panel.lineStyle(1, GOLD, 0.22);
      panel.lineBetween(-bw / 2 + 14, -height / 2 + 5, bw / 2 - 14, -height / 2 + 5);
      panel.lineBetween(-bw / 2 + 14, height / 2 - 5, bw / 2 - 14, height / 2 - 5);
      t.setColor(hover ? "#fff0cf" : "#e8d3aa");
    };
    draw(false);
    const c = this.scene.add.container(x, y, [panel, t]);
    if (shortcut) {
      // This key hint is shown only where Enter invokes the same action.
      const keyX = bw / 2 - 29;
      const cap = this.scene.add.image(keyX, 0, "keycap").setDisplaySize(38, 38);
      const glyph = this.scene.add.graphics().lineStyle(2, CREAM);
      glyph.beginPath();
      glyph.moveTo(keyX + 8, -7);
      glyph.lineTo(keyX + 8, 3);
      glyph.lineTo(keyX - 8, 3);
      glyph.moveTo(keyX - 3, -2);
      glyph.lineTo(keyX - 8, 3);
      glyph.lineTo(keyX - 3, 8);
      glyph.strokePath();
      c.add([cap, glyph]);
    }
    c.setSize(bw, height).setInteractive({ useHandCursor: true });
    parent.add(c);
    c.on("pointerover", () => draw(true))
      .on("pointerout", () => draw(false))
      .on("pointerdown", () => draw(true, true))
      .on("pointerup", () => {
        draw(true);
        action();
      });
    return c;
  }
  cover(
    key: string,
    x: number,
    y: number,
    w: number,
    h: number,
    parent = this.scene.world,
  ) {
    const image = this.scene.add.image(x + w / 2, y + h / 2, key);
    const scale = Math.max(w / image.width, h / image.height);
    image.setScale(scale);
    parent.add(image);
    const mask = this.scene.make.graphics({ x: 0, y: 0 });
    mask.fillStyle(0xffffff);
    mask.fillRect(x, y, w, h);
    image.setMask(mask.createGeometryMask());
    image.once("destroy", () => mask.destroy());
    return image;
  }
}
