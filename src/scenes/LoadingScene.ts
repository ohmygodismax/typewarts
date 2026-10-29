import Phaser from "phaser";
import { RENDER_SCALE, TEXT_RESOLUTION } from "../runtime/display";
import { GOLD } from "../ui/theme";
import { assets } from "../content/assets";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super("Loading");
  }
  preload() {
    const w = this.scale.width / RENDER_SCALE, h = this.scale.height / RENDER_SCALE;
    this.cameras.main.setOrigin(0, 0).setZoom(RENDER_SCALE);
    this.cameras.main.setBackgroundColor("#09121c");
    this.add
      .text(w / 2, h / 2 - 66, "Typewarts", {
        fontFamily: "Georgia",
        fontSize: "38px",
        resolution: TEXT_RESOLUTION,
        color: "#e4c58d",
      })
      .setOrigin(0.5);
    const label = this.add
      .text(w / 2, h / 2 + 50, "Подготовка заклинаний…", {
        fontFamily: "Arial",
        fontSize: "16px",
        resolution: TEXT_RESOLUTION,
        color: "#a4b0b9",
      })
      .setOrigin(0.5);
    const bar = this.add.graphics();
    const length = Math.min(w - 70, 280);
    const draw = (p: number) => {
      bar.clear();
      bar.fillStyle(0x223142);
      bar.fillRoundedRect((w - length) / 2, h / 2, length, 4, 2);
      bar.fillStyle(GOLD);
      if (p > 0) bar.fillRoundedRect((w - length) / 2, h / 2, length * p, 4, 2);
    };
    draw(0);
    this.load.on("progress", draw);
    let failed = false;
    this.load.on("loaderror", () => {
      failed = true;
      label
        .setText("Не удалось загрузить графику. Обнови страницу.")
        .setWordWrapWidth(w - 40);
    });
    this.load.once("complete", () => {
      if (!failed) this.scene.start("Typewarts");
    });
    for (const [key, file] of Object.entries(assets))
      this.load.image(key, import.meta.env.BASE_URL + "assets/" + file);
  }
}
