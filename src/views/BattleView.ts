import Phaser from "phaser";
import { MechanicalKeyboard } from "../ui/MechanicalKeyboard";
import { lessons } from "../content/lessons";
import { battleWord } from "../domain/battle";
import { accuracy } from "../domain/typing";
import type { GameScene } from "../scenes/GameScene";

export class BattleView {
  hero?: Phaser.GameObjects.Image;
  ghost?: Phaser.GameObjects.Image;
  spell?: Phaser.GameObjects.Text;
  typedText?: Phaser.GameObjects.Text;
  spellBackdrop?: Phaser.GameObjects.Graphics;
  currentLetter?: Phaser.GameObjects.Text;
  turnLabel?: Phaser.GameObjects.Text;
  timerLabel?: Phaser.GameObjects.Text;
  mechanical?: MechanicalKeyboard;
  hint?: Phaser.GameObjects.Text;
  stats?: Phaser.GameObjects.Text;
  hpBar?: Phaser.GameObjects.Rectangle;
  enemyBar?: Phaser.GameObjects.Rectangle;
  barWidth = 160;
  keyboardTop = 550;
  constructor(private readonly scene: GameScene) {}

  /** Containers own the objects; discard references after the scene clears them. */
  reset() {
    this.mechanical = undefined;
    this.hero = undefined;
    this.ghost = undefined;
    this.spell = undefined;
    this.typedText = undefined;
    this.spellBackdrop = undefined;
    this.currentLetter = undefined;
    this.turnLabel = undefined;
    this.timerLabel = undefined;
    this.hint = undefined;
    this.stats = undefined;
    this.hpBar = undefined;
    this.enemyBar = undefined;
  }

  drawBattle() {
    const width = Math.min(1200, (this.scene.w - 64) * 0.85);
    const boardHeight = 340;
    this.keyboardTop = this.scene.h - boardHeight - 24;
    const isKnight = this.scene.battle.lesson === 1;
    this.scene.ui.cover(isKnight ? "corridor" : "classroom", 0, 0, this.scene.w, this.keyboardTop);
    const floor = this.keyboardTop - 20;
    for (const x of [this.scene.w * 0.25, this.scene.w * 0.77]) {
      const shadow = this.scene.add.ellipse(x, floor, this.scene.w * 0.14, 22, 0x060912, 0.48);
      this.scene.world.add(shadow);
    }
    const hero = this.scene.add
      .image(this.scene.w * 0.25, floor + 2, "hero")
      .setOrigin(0.5, 1);
    hero.setScale(Math.max(150, this.keyboardTop * 0.55) / hero.height);
    this.scene.world.add(hero);
    this.hero = hero;
    const ghost = this.scene.add
      .image(this.scene.w * 0.77, isKnight ? floor + 2 : floor - 12, isKnight ? "knight" : "ghost")
      .setOrigin(0.5, 1);
    ghost.setScale(Math.max(120, this.keyboardTop * (isKnight ? 0.73 : 0.52)) / ghost.height);
    this.scene.world.add(ghost);
    this.ghost = ghost;
    if (!isKnight) this.scene.tweens.add({
      targets: ghost,
      y: ghost.y - 5,
      duration: 1900,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
    this.scene.ui.text(
      24,
      18,
      lessons[this.scene.battle.lesson].name,
      this.scene.small ? 18 : 24,
    ).setFontFamily("Georgia");
    this.scene.ui.button(this.scene.w - 35, 33, "Ⅱ", () => this.scene.pause(true), this.scene.hud, 40);
    this.barWidth = Math.min(180, this.scene.w * 0.3);
    const health = (x: number, name: string, color: number) => {
      this.scene.ui.text(x, 59, name, 16);
      this.scene.ui.rect(x + this.barWidth / 2, 83, this.barWidth, 5, 0x1c222c);
      return this.scene.ui.rect(x, 83, this.barWidth, 5, color).setOrigin(0, 0.5);
    };
    this.hpBar = health(24, "Программист", 0xd7a066);
    this.enemyBar = health(this.scene.w - 24 - this.barWidth, isKnight ? "Страж коридора" : "Призрак", isKnight ? 0x80bfe8 : 0xb49be4);
    const desk = this.scene.add.image(this.scene.w / 2, this.keyboardTop + (this.scene.h - this.keyboardTop) / 2, "desk")
      .setDisplaySize(this.scene.w, this.scene.h - this.keyboardTop);
    this.scene.world.add(desk);
    this.mechanical = new MechanicalKeyboard(
      this.scene,
      this.scene.hud,
      (this.scene.w - width) / 2,
      this.keyboardTop + 54,
      width,
    );
    this.turnLabel = this.scene.ui.text(this.scene.w / 2, 108, "", 16, "#edcf91").setOrigin(
      0.5,
    );
    this.timerLabel = this.scene.ui.text(this.scene.w / 2, 131, "", 18, "#f2dab2").setOrigin(
      0.5,
    );
    this.spellBackdrop = this.scene.add.graphics();
    this.scene.hud.add(this.spellBackdrop);
    this.spell = this.scene.ui.text(
      this.scene.w / 2,
      this.keyboardTop - 72,
      "",
      this.scene.small ? 25 : 38,
      "#eee0c0",
    )
      .setFontFamily("Georgia")
      .setOrigin(0.5)
      .setStroke("#131a24", 1);
    this.typedText = this.scene.ui.text(0, 0, "", this.scene.small ? 25 : 38, "#a8eed6")
      .setFontFamily("Georgia")
      .setOrigin(0, 0.5)
      .setStroke("#131a24", 1);
    this.currentLetter = this.scene.ui.text(0, 0, "", 38, "#101b29")
      .setFontFamily("Georgia").setOrigin(0.5);
    this.stats = this.scene.ui.text(
      this.scene.w / 2,
      this.scene.h - 12,
      "",
      14,
      "#e4d8bf",
    ).setOrigin(0.5);
    this.hint = this.scene.ui.text(
      this.scene.w / 2,
      this.keyboardTop - 24,
      "",
      16,
      "#e1caa0",
    )
      .setOrigin(0.5)
      .setAlign("center")
      .setWordWrapWidth(this.scene.w - 40)
      .setStroke("#101722", 2);
    if (!this.scene.battle.active && !this.scene.battle.result)
      this.scene.ui.button(
        this.scene.w / 2,
        this.keyboardTop - 200,
        "Начать дуэль",
        () => this.scene.act({ type: "start" }),
        this.scene.hud,
        190,
      );
    this.updateHud();
  }
  updateHud() {
    const b = this.scene.battle,
      word = battleWord(b).toUpperCase();
    if (!this.spell) return;
    this.spell
      .setText(word)
      .setFontSize(this.scene.small ? 25 : 38)
      .setColor("#9aa6b4");
    const max = this.scene.w * 0.65;
    if (this.spell.width > max)
      this.spell.setFontSize(
        Math.max(13, ((this.scene.small ? 25 : 38) * max) / this.spell.width),
      );
    this.typedText
      ?.setFontSize(this.spell.style.fontSize)
      .setText(word.slice(0, b.pos))
      .setColor(b.phase === "attack" ? "#ffe49b" : "#8ee8ff");
    this.turnLabel?.setText(
      b.phase === "attack" ? "ТВОЯ АТАКА" : "ТВОЯ ЗАЩИТА",
    );
    this.timerLabel?.setText(b.active ? `${b.remaining} сек.${b.phase === "attack" ? `  ·  Попытки: ${b.triesLeft}/3` : ""}` : "");
    this.hpBar?.setDisplaySize((this.barWidth * b.hp) / 100, 5);
    this.enemyBar?.setDisplaySize((this.barWidth * b.enemyHp) / lessons[b.lesson].enemyHp, 5);
    this.mechanical?.highlight(battleWord(b)[b.pos] || "");
    const speed = b.elapsed ? Math.round(b.correct / 5 / (b.elapsed / 60)) : 0;
    this.stats?.setText(
      `${speed} слов/мин · ${accuracy(b.correct, b.attempts)}% · серия ${b.combo}`,
    );
    this.hint?.setText(
      this.scene.saveFailed ? "Прогресс не удалось сохранить." : b.hint,
    );
    this.positionWord();
  }
  positionWord() {
    if (!this.spell) return;
    const x = this.scene.w / 2, y = this.keyboardTop - 72;
    this.spell.setPosition(x, y);
    this.timerLabel?.setPosition(x, y - 50);
    this.turnLabel?.setPosition(x, y - 76);
    const left = x - this.spell.width / 2;
    this.typedText?.setPosition(left, y);
    const word = battleWord(this.scene.battle).toUpperCase();
    const pos = this.scene.battle.pos;
    // Measure in the same font as the prompt; font kerning affects the cursor position.
    const context = this.spell.context;
    const prefix = context.measureText(word.slice(0, pos)).width;
    const advance = context.measureText(word.slice(0, pos + 1)).width - prefix;
    const color = this.scene.battle.phase === "attack" ? 0xffdf83 : 0x8ee8ff;
    const panelHeight = this.spell.height + 16;
    const background = this.spellBackdrop;
    if (background) {
      background.clear();
      background.fillStyle(0x08121e, 0.94);
      background.fillRoundedRect(left - 16, y - panelHeight / 2, this.spell.width + 32, panelHeight, 8);
      background.lineStyle(1, 0x586879, 0.8);
      background.strokeRoundedRect(left - 16, y - panelHeight / 2, this.spell.width + 32, panelHeight, 8);
      if (prefix > 0) {
        background.fillStyle(color);
        background.fillRect(left, y + this.spell.height / 2 + 2, prefix, 3);
      }
      if (word[pos] && !this.scene.battle.result) {
        background.fillStyle(color);
        background.fillRoundedRect(left + prefix - 2, y - this.spell.height / 2 - 2,
          Math.max(8, advance) + 4, this.spell.height + 4, 3);
      }
    }
    this.currentLetter?.setScale(1).setFontSize(this.spell.style.fontSize)
      .setText(word[pos] === " " ? "␣" : word[pos] ?? "")
      .setPosition(left + prefix + advance / 2, y)
      .setVisible(!!word[pos] && !this.scene.battle.result);
    if (this.currentLetter && this.currentLetter.width > advance && advance > 0)
      this.currentLetter.setScale(advance / this.currentLetter.width, 1);
  }

}
