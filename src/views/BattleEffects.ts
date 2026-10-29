import Phaser from "phaser";
import type { GameScene } from "../scenes/GameScene";

export class BattleEffects {
  constructor(private readonly scene: GameScene) {}

  burst(x: number, y: number, color: number, count = 22) {
    const ring = this.scene.add.circle(x, y, 12).setStrokeStyle(3, color);
    this.scene.world.add(ring);
    this.scene.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 420,
      onComplete: () => ring.destroy() });
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = Phaser.Math.Between(35, 100);
      const p = this.scene.add.image(x, y, "spark").setTint(color).setScale(0.25).setBlendMode("ADD");
      this.scene.world.add(p);
      this.scene.tweens.add({ targets: p, x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius, scale: 0, alpha: 0,
        duration: Phaser.Math.Between(350, 650), ease: "Cubic.easeOut",
        onComplete: () => p.destroy() });
    }
  }
  castWord(word: string, damage: number) {
    const start = { x: this.scene.w / 2, y: this.scene.battleView.keyboardTop - 72 };
    const end = { x: this.scene.battleView.ghost?.x ?? this.scene.w * 0.77,
      y: (this.scene.battleView.ghost?.y ?? 300) - (this.scene.battleView.ghost?.displayHeight ?? 180) * 0.55 };
    const color = this.scene.battle.power > 1.5 ? 0xa8f3e3 : 0xffd58a;
    const flying = this.scene.ui.text(start.x, start.y, word.toUpperCase(), this.scene.small ? 25 : 38,
      "#ffe4a9", this.scene.world).setOrigin(0.5).setFontFamily("Georgia");
    const glow = this.scene.add.image(start.x, start.y, "spark").setTint(color).setScale(1.7).setBlendMode("ADD");
    this.scene.world.add(glow);
    this.burst(start.x, start.y, color, 10);
    const travel = { t: 0 };
    let lastTrail = -1;
    this.scene.tweens.add({ targets: travel, t: 1, duration: 850, ease: "Cubic.easeIn",
      onUpdate: () => {
        const t = travel.t;
        const x = Phaser.Math.Linear(start.x, end.x, t);
        const y = Phaser.Math.Linear(start.y, end.y, t) - Math.sin(t * Math.PI) * 65;
        flying.setPosition(x, y).setScale(1 - t * 0.55);
        glow.setPosition(x, y);
        if (t - lastTrail > 0.035) {
          lastTrail = t;
          const trail = this.scene.add.image(x, y, "spark").setTint(color).setScale(0.6).setBlendMode("ADD");
          this.scene.world.add(trail);
          this.scene.tweens.add({ targets: trail, alpha: 0, scale: 0, duration: 300,
            onComplete: () => trail.destroy() });
        }
      },
      onComplete: () => {
        flying.destroy(); glow.destroy();
        this.burst(end.x, end.y, color);
        this.scene.act({ type: "impact", damage });
        this.scene.cameras.main.shake(140, 0.003);
        const ghost = this.scene.battleView.ghost;
        if (ghost) {
          ghost.setTintFill(color);
          this.scene.tweens.add({ targets: ghost, x: ghost.x + 18, duration: 100, yoyo: true,
            onComplete: () => ghost.clearTint() });
        }
      },
    });
  }
  shield() {
    const x = (this.scene.battleView.hero?.x ?? this.scene.w * 0.25) + 38;
    const y = (this.scene.battleView.hero?.y ?? 300) - (this.scene.battleView.hero?.displayHeight ?? 180) * 0.5;
    this.burst(this.scene.battleView.spell?.x ?? x, this.scene.battleView.spell?.y ?? y, 0xa8f3e3, 28);
    const shield = this.scene.add.container(x, y);
    this.scene.world.add(shield);
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.ellipse(0, 0, 110 + i * 20, 155 + i * 20, 0x6ddfcf, 0.06)
        .setStrokeStyle(i === 0 ? 3 : 1, 0xb5f6e8, 0.85);
      shield.add(ring);
    }
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      shield.add(this.scene.add.star(Math.cos(a) * 64, Math.sin(a) * 86, 4, 2, 6, 0xd5fff4));
    }
    shield.setScale(0.35);
    this.scene.tweens.add({ targets: shield, scale: 1, duration: 180, ease: "Back.easeOut",
      onComplete: () => {
        this.scene.tweens.add({ targets: shield, alpha: 0, scale: 1.2, duration: 550,
          onComplete: () => shield.destroy() });
      } });
  }
  fizzle() {
    if (!this.scene.battleView.hero) return;
    // Keep the typing prompt steady on errors.
    const spark = this.scene.add
      .image(this.scene.battleView.hero.x, this.scene.battleView.hero.y - this.scene.battleView.hero.displayHeight * 0.4, "spark")
      .setTint(0xe48b6f)
      .setScale(0.7);
    this.scene.world.add(spark);
    this.scene.tweens.add({
      targets: spark,
      alpha: 0,
      duration: 250,
      onComplete: () => spark.destroy(),
    });
  }
}
