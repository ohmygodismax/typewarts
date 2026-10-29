import Phaser from "phaser";
import { stageSize, RENDER_SCALE, TEXT_RESOLUTION } from "./display";
import { MechanicalKeyboard } from "./keyboard";
import { story } from "./story";
import {
  lessons,
  parseProgress,
  accuracy,
  finger,
  spells,
  type Progress,
} from "./game";
import { newBattle, reduceBattle, battleWord, type Action } from "./battle";

const GOLD = 0xd8b578,
  INK = 0x0b1521,
  CREAM = 0xf2e8d3;
const assets = {
  classroom: "classroom.png",
  hero: "hero.png",
  ghost: "phantom.png",
  coding: "prologue-coding.png",
  office: "prologue-office.png",
  refusal: "prologue-refusal.png",
  sorting: "prologue-sorting-v2.png",
  arrival: "arrival.png",
  decline: "decline.png",
  keyboardStory: "keyboard-story.png",
  keycap: "keycap.png",
  desk: "desk.png",
  keyboardHousing: "keyboard-housing.png",
};
const imageKeys: Record<string, string> = {
  "classroom.png": "classroom",
  "prologue-coding.png": "coding",
  "prologue-office.png": "office",
  "prologue-refusal.png": "refusal",
  "prologue-sorting-v2.png": "sorting",
  "arrival.png": "arrival",
  "decline.png": "decline",
  "keyboard-story.png": "keyboardStory",
};

/** Loading, story, battle and all controls are drawn by Phaser. No DOM UI. */
class Loading extends Phaser.Scene {
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
      this.load.image(key, "/assets/" + file);
  }
}

export class Typewarts extends Phaser.Scene {
  progress: Progress = parseProgress(null);
  battle = newBattle();
  mode: "comic" | "battle" = "comic";
  page = 0;
  revealed = 1;
  lastAdvance = -Infinity;
  world!: Phaser.GameObjects.Container;
  hud!: Phaser.GameObjects.Container;
  overlay!: Phaser.GameObjects.Container;
  hero?: Phaser.GameObjects.Image;
  ghost?: Phaser.GameObjects.Image;
  spell?: Phaser.GameObjects.Text;
  typedText?: Phaser.GameObjects.Text;
  turnLabel?: Phaser.GameObjects.Text;
  timerLabel?: Phaser.GameObjects.Text;
  mechanical?: MechanicalKeyboard;
  keyUpHandler = (e: KeyboardEvent) => this.mechanical?.up(e.code);
  hint?: Phaser.GameObjects.Text;
  stats?: Phaser.GameObjects.Text;
  keys = new Map<
    string,
    { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }
  >();
  hpBar?: Phaser.GameObjects.Rectangle;
  enemyBar?: Phaser.GameObjects.Rectangle;
  fingerLabel?: Phaser.GameObjects.Text;
  barWidth = 160;
  modal = false;
  saveFailed = false;
  stageHeight = 400;
  keyboardTop = 550;
  second = 0;
  keyHandler = (e: KeyboardEvent) => this.onKey(e);
  constructor() {
    super("Typewarts");
  }
  create() {
    this.cameras.main.setOrigin(0, 0).setZoom(RENDER_SCALE);
    try {
      this.progress = parseProgress(localStorage.getItem("typewarts-v1"));
    } catch {
      this.progress = parseProgress(null);
    }
    this.mode = this.progress.intro ? "battle" : "comic";
    this.battle = newBattle(this.progress.unlocked);
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 32; r > 0; r--) {
      g.fillStyle(0xffffff, (1 - r / 32) * 0.09);
      g.fillCircle(32, 32, r);
    }
    g.generateTexture("spark", 64, 64);
    g.destroy();
    this.world = this.add.container(0, 0);
    this.hud = this.add.container(0, 0);
    this.overlay = this.add.container(0, 0).setDepth(100);
    this.input.keyboard?.on("keydown", this.keyHandler);
    this.input.keyboard?.on("keyup", this.keyUpHandler);
    this.scale.on("resize", this.render, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.pause, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.pause, this);
    this.events.once("shutdown", () => {
      this.input.keyboard?.off("keydown", this.keyHandler);
      this.input.keyboard?.off("keyup", this.keyUpHandler);
      this.scale.off("resize", this.render, this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.pause, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.pause, this);
    });
    this.render();
  }
  get w() {
    return this.scale.width / RENDER_SCALE;
  }
  get h() {
    return this.scale.height / RENDER_SCALE;
  }
  get small() {
    return false; // Keep the desktop controls while the stage expands with the window.
  }
  text(
    x: number,
    y: number,
    value: string,
    size = 16,
    color = "#e7dfd0",
    parent = this.hud,
  ) {
    const t = this.add.text(x, y, value, {
      fontFamily: "Arial",
      fontSize: size + "px",
      color,
      wordWrap: { width: Math.max(100, this.w - 48) },
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
    parent = this.hud,
  ) {
    const r = this.add.rectangle(x, y, w, h, color, alpha);
    parent.add(r);
    return r;
  }
  button(
    x: number,
    y: number,
    label: string,
    action: () => void,
    parent = this.hud,
    width?: number,
    shortcut?: "Enter",
  ) {
    const t = this.add
      .text(shortcut ? -22 : 0, 0, label, {
        fontFamily: "Georgia",
        fontSize: (this.small ? 13 : 15) + "px",
        color: "#e8d3aa",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5);
    const bw = width ?? t.width + (shortcut ? 90 : 44);
    const height = 44;
    const panel = this.add.graphics();
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
    const c = this.add.container(x, y, [panel, t]);
    if (shortcut) {
      // This key hint is shown only where Enter invokes the same action.
      const keyX = bw / 2 - 29;
      const cap = this.add.image(keyX, 0, "keycap").setDisplaySize(38, 38);
      const glyph = this.add.graphics().lineStyle(2, CREAM);
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
    parent = this.world,
  ) {
    const image = this.add.image(x + w / 2, y + h / 2, key);
    const scale = Math.max(w / image.width, h / image.height);
    image.setScale(scale);
    parent.add(image);
    const mask = this.make.graphics({ x: 0, y: 0 });
    mask.fillStyle(0xffffff);
    mask.fillRect(x, y, w, h);
    image.setMask(mask.createGeometryMask());
    image.once("destroy", () => mask.destroy());
    return image;
  }
  clear() {
    this.tweens.killAll();
    this.world.removeAll(true);
    this.hud.removeAll(true);
    this.overlay.removeAll(true);
    this.keys.clear();
    this.mechanical = undefined;
    this.hero = undefined;
    this.ghost = undefined;
  }
  render() {
    if (this.battle.pendingDamage > 0)
      this.battle = reduceBattle(this.battle, {
        type: "impact",
        damage: this.battle.pendingDamage,
      });
    const wasModal = this.modal;
    this.clear();
    this.modal = false;
    this.cameras.main.setBackgroundColor("#0b1420");
    if (this.mode === "comic") this.drawComic();
    else {
      this.drawBattle();
      if (this.battle.result) this.showResult();
      else if (wasModal || this.battle.paused) this.showPause();
    }
  }
  drawComic() {
    const panel = story[this.page];
    const frame = this.small ? 10 : 24;
    this.rect(this.w / 2, this.h / 2, this.w, this.h, 0x0b1018, 1, this.world);
    const background = this.cover(
      imageKeys[panel.image],
      frame,
      frame,
      this.w - frame * 2,
      this.h - frame * 2,
    );
    if (panel.id === "coding" || panel.id === "sleep") {
      // Frame the working area instead of the empty dark floor in the source art.
      background.setScale(
        Math.max(
          this.w / background.width,
          this.h / (background.height * 0.77),
        ),
      );
      background.setOrigin(0.5, 0).setPosition(this.w * 0.5, -this.h * 0.025);
    }
    const border = this.add.graphics().lineStyle(3, 0xf4eee1, 0.95);
    border.strokeRect(frame, frame, this.w - frame * 2, this.h - frame * 2);
    this.hud.add(border);
    if (panel.hero) {
      const im = this.add
        .image(this.w * 0.4, this.h * 0.94, "hero")
        .setOrigin(0.5, 1);
      im.setScale((this.h * 0.8) / im.height);
      this.world.add(im);
    }
    if (panel.ghost) {
      const im = this.add
        .image(this.w * 0.8, this.h * 0.8, "ghost")
        .setOrigin(0.5, 1);
      im.setScale((this.h * 0.58) / im.height);
      this.world.add(im);
    }
    const margin = this.small ? 22 : Math.max(32, this.w * 0.04);
    const maxW = this.small
      ? this.w - margin * 2
      : Math.min(370, this.w * 0.29);
    const layouts = panel.bubbles.map((b) => {
      const width = this.small
        ? Math.min(maxW, b.kind === "caption" ? 270 : 300)
        : maxW;
      const size =
        b.kind === "shout"
          ? this.small
            ? 25
            : 34
          : b.kind === "caption"
            ? this.small
              ? 17
              : 20
            : this.small
              ? 15
              : 18;
      const txt = this.add.text(0, 0, b.text, {
        fontFamily:
          b.kind === "caption" || b.kind === "shout" ? "Georgia" : "Arial",
        fontSize: size + "px",
        color: "#29251f",
        wordWrap: { width: width - 36 },
        lineSpacing: 5,
        resolution: TEXT_RESOLUTION,
      });
      return { b, width, height: txt.height + 28, txt };
    });
    // Derive placement from measured text, leaving room for tails and the one action.
    const available = this.h - margin - 100;
    const total = layouts.reduce((s, l) => s + l.height, 0);
    const gap = this.small
      ? Math.max(20, (available - total) / Math.max(1, layouts.length - 1))
      : 0;
    let cursor = margin;
    layouts.forEach(({ b, width, height, txt }, i) => {
      if (i >= this.revealed) {
        txt.destroy();
        return;
      }
      let x = margin,
        y = margin;
      if (this.small) {
        x = i === 1 ? this.w - margin - width : margin;
        y = cursor;
        cursor += height + gap;
      } else {
        x = b.position.endsWith("right") ? this.w - margin - width : margin;
        y = b.position.startsWith("bottom") ? this.h - 110 - height : margin;
      }
      const box = this.add.graphics();
      box.fillStyle(
        b.kind === "caption" ? 0xddc695 : b.kind === "shout" ? 0xf3ce85 : CREAM,
      );
      box.lineStyle(2, 0x332a21);
      box.fillRoundedRect(x, y, width, height, b.kind === "caption" ? 3 : 20);
      box.strokeRoundedRect(x, y, width, height, b.kind === "caption" ? 3 : 20);
      if (b.kind === "speech") {
        box.fillTriangle(
          x + 28,
          y + height - 1,
          x + 48,
          y + height - 1,
          x + 29,
          y + height + 18,
        );
      } else if (b.kind === "thought") {
        box.fillCircle(x + 35, y + height + 13, 6);
        box.fillCircle(x + 27, y + height + 28, 3);
      }
      txt.setPosition(x + 18, y + 14);
      this.hud.add([box, txt]);
    });
    this.comicContinue(margin);
  }
  comicContinue(margin: number) {
    const width = Math.min(238, this.w - 32),
      x = this.w - margin - width / 2,
      y = this.h - 42;
    const done = this.revealed >= story[this.page].bubbles.length;
    const label = done
      ? this.page === story.length - 1
        ? "Начать игру"
        : "Следующий кадр"
      : "Продолжить";
    this.button(x, y, label, () => this.nextPage(), this.hud, width, "Enter");
  }

  nextPage() {
    const now = performance.now();
    if (now - this.lastAdvance < 160) return;
    this.lastAdvance = now;
    if (this.revealed < story[this.page].bubbles.length) {
      this.revealed++;
      this.render();
      return;
    }
    if (this.page < story.length - 1) {
      this.page++;
      this.revealed = 1;
      this.render();
    } else {
      this.progress.intro = true;
      this.save();
      this.mode = "battle";
      this.battle = newBattle(this.progress.unlocked);
      this.render();
    }
  }
  drawBattle() {
    const width = 1000;
    const boardHeight = 300;
    this.keyboardTop = this.h - boardHeight - 24;
    this.stageHeight = this.keyboardTop;
    this.cover("classroom", 0, 0, this.w, this.keyboardTop);
    const floor = this.keyboardTop - 20;
    for (const x of [this.w * 0.25, this.w * 0.77]) {
      const shadow = this.add.ellipse(x, floor, this.w * 0.14, 22, 0x060912, 0.48);
      this.world.add(shadow);
    }
    const hero = this.add
      .image(this.w * 0.25, floor + 2, "hero")
      .setOrigin(0.5, 1);
    hero.setScale(Math.max(150, this.keyboardTop * 0.55) / hero.height);
    this.world.add(hero);
    this.hero = hero;
    const ghost = this.add
      .image(this.w * 0.77, floor - 12, "ghost")
      .setOrigin(0.5, 1);
    ghost.setScale(Math.max(120, this.keyboardTop * 0.52) / ghost.height);
    this.world.add(ghost);
    this.ghost = ghost;
    this.tweens.add({
      targets: ghost,
      y: ghost.y - 5,
      duration: 1900,
      yoyo: true,
      repeat: -1,
    });
    this.text(
      24,
      18,
      lessons[this.battle.lesson].name,
      this.small ? 18 : 24,
    ).setFontFamily("Georgia");
    this.button(this.w - 35, 33, "Ⅱ", () => this.pause(true), this.hud, 40);
    this.barWidth = Math.min(180, this.w * 0.3);
    const health = (x: number, name: string, color: number) => {
      this.text(x, 59, name, 16);
      this.rect(x + this.barWidth / 2, 83, this.barWidth, 5, 0x1c222c);
      return this.rect(x, 83, this.barWidth, 5, color).setOrigin(0, 0.5);
    };
    this.hpBar = health(24, "Программист", 0xd7a066);
    this.enemyBar = health(this.w - 24 - this.barWidth, "Призрак", 0xb49be4);
    const desk = this.add.image(this.w / 2, this.keyboardTop + (this.h - this.keyboardTop) / 2, "desk")
      .setDisplaySize(this.w, this.h - this.keyboardTop);
    this.world.add(desk);
    this.mechanical = new MechanicalKeyboard(
      this,
      this.hud,
      (this.w - width) / 2,
      this.keyboardTop + 54,
      width,
    );
    this.turnLabel = this.text(this.w / 2, 108, "", 16, "#edcf91").setOrigin(
      0.5,
    );
    this.timerLabel = this.text(this.w / 2, 131, "", 18, "#f2dab2").setOrigin(
      0.5,
    );
    this.spell = this.text(
      this.w / 2,
      this.keyboardTop - 72,
      "",
      this.small ? 25 : 38,
      "#eee0c0",
    )
      .setFontFamily("Georgia")
      .setOrigin(0.5)
      .setStroke("#131a24", 1);
    this.typedText = this.text(0, 0, "", this.small ? 25 : 38, "#a8eed6")
      .setFontFamily("Georgia")
      .setOrigin(0, 0.5)
      .setStroke("#131a24", 1);
    this.stats = this.text(
      this.w / 2,
      this.h - 12,
      "",
      14,
      "#e4d8bf",
    ).setOrigin(0.5);
    this.hint = this.text(
      this.w / 2,
      this.keyboardTop - 24,
      "",
      16,
      "#e1caa0",
    )
      .setOrigin(0.5)
      .setAlign("center")
      .setWordWrapWidth(this.w - 40)
      .setStroke("#101722", 2);
    if (!this.battle.active && !this.battle.result)
      this.button(
        this.w / 2,
        this.keyboardTop - 140,
        "Начать дуэль",
        () => this.act({ type: "start" }),
        this.hud,
        190,
      );
    this.updateHud();
  }
  updateHud() {
    const b = this.battle,
      word = battleWord(b).toUpperCase();
    if (!this.spell) return;
    this.spell
      .setText(word)
      .setFontSize(this.small ? 25 : 38)
      .setColor(b.phase === "attack" ? "#f0d99e" : "#d3b9ff");
    const max = this.w * (b.phase === "attack" ? 0.43 : 0.65);
    if (this.spell.width > max)
      this.spell.setFontSize(
        Math.max(13, ((this.small ? 25 : 38) * max) / this.spell.width),
      );
    this.typedText
      ?.setFontSize(this.spell.style.fontSize)
      .setText(word.slice(0, b.pos));
    this.turnLabel?.setText(
      b.phase === "attack" ? "ТВОЯ АТАКА" : "ЗАЩИТА — ПЕРЕХВАТИ СЛОВО",
    );
    this.timerLabel?.setText(b.active ? `${b.remaining} сек.${b.phase === "attack" ? `  ·  Попытки: ${b.triesLeft}/3` : ""}` : "");
    this.hpBar?.setDisplaySize((this.barWidth * b.hp) / 100, 5);
    this.enemyBar?.setDisplaySize((this.barWidth * b.enemyHp) / 100, 5);
    this.mechanical?.highlight(battleWord(b)[b.pos] || "");
    const speed = b.elapsed ? Math.round(b.correct / 5 / (b.elapsed / 60)) : 0;
    this.stats?.setText(
      `${speed} слов/мин · ${accuracy(b.correct, b.attempts)}% · серия ${b.combo}`,
    );
    this.hint?.setText(
      this.saveFailed ? "Прогресс не удалось сохранить." : b.hint,
    );
    this.positionWord();
  }
  positionWord() {
    if (!this.spell) return;
    const b = this.battle;
    const travel =
      b.phase === "defend" && b.active
        ? Math.min(
            1,
            (b.duration - b.remaining + this.second / 1000) / b.duration,
          )
        : 0;
    this.spell.setPosition(
      b.phase === "defend" && b.active
        ? Phaser.Math.Linear(this.w * 0.76, this.w * 0.25, travel)
        : this.attackAnchor().x,
      b.phase === "defend" && b.active
        ? Phaser.Math.Linear(
            this.keyboardTop * 0.4,
            this.keyboardTop - 65,
            travel,
          )
        : this.attackAnchor().y,
    );
    if (b.phase === "attack") {
      this.timerLabel?.setPosition(this.spell.x, this.spell.y - 34);
      this.turnLabel?.setPosition(this.spell.x, this.spell.y - 59);
    } else {
      this.timerLabel?.setPosition(this.w / 2, 131);
      this.turnLabel?.setPosition(this.w / 2, 108);
    }
    this.typedText?.setPosition(
      this.spell.x - this.spell.width / 2,
      this.spell.y,
    );
  }
  act(action: Action) {
    const before = this.battle;
    this.battle = reduceBattle(before, action);
    if (action.type === "start") {
      this.second = 0;
      this.overlay.removeAll(true);
      this.modal = false;
      if (!before.active) this.render();
    }
    if (this.battle.cast > before.cast)
      this.castWord(
        battleWord(before),
        this.battle.pendingDamage - before.pendingDamage,
      );
    if (this.battle.turn !== before.turn) this.second = 0;
    if (this.battle.blocked > before.blocked) this.shield();
    if (this.battle.attack > before.attack) {
      this.cameras.main.shake(180, 0.006);
      this.hero?.setTintFill(0xe79682);
      this.time.delayedCall(120, () => this.hero?.clearTint());
    }
    if (this.battle.wrong > before.wrong) this.fizzle();
    this.updateHud();
    if (this.battle.result && !before.result) {
      if (this.battle.result === "win") {
        const b = this.battle;
        this.progress.xp += accuracy(b.correct, b.attempts) >= 95 ? 150 : 100;
        this.progress.unlocked = Math.max(
          this.progress.unlocked,
          Math.min(4, b.lesson + 1),
        );
        this.progress.completed = [
          ...new Set([...this.progress.completed, b.lesson]),
        ];
        this.progress.best = Math.max(
          this.progress.best,
          b.elapsed ? Math.round(b.correct / 5 / (b.elapsed / 60)) : 0,
        );
        this.save();
      }
      this.time.delayedCall(800, () => {
        if (this.mode === "battle" && this.battle.result) this.showResult();
      });
    }
  }
  save() {
    try {
      localStorage.setItem("typewarts-v1", JSON.stringify(this.progress));
      this.saveFailed = false;
    } catch {
      this.saveFailed = true;
    }
  }
  attackAnchor() {
    return { x: this.hero?.x ?? this.w * 0.25,
      y: Math.max(177, (this.hero?.y ?? 300) - (this.hero?.displayHeight ?? 180) - 26) };
  }
  burst(x: number, y: number, color: number, count = 22) {
    const ring = this.add.circle(x, y, 12).setStrokeStyle(3, color);
    this.world.add(ring);
    this.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 420,
      onComplete: () => ring.destroy() });
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = Phaser.Math.Between(35, 100);
      const p = this.add.image(x, y, "spark").setTint(color).setScale(0.25).setBlendMode("ADD");
      this.world.add(p);
      this.tweens.add({ targets: p, x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius, scale: 0, alpha: 0,
        duration: Phaser.Math.Between(350, 650), ease: "Cubic.easeOut",
        onComplete: () => p.destroy() });
    }
  }
  castWord(word: string, damage: number) {
    const start = this.attackAnchor();
    const end = { x: this.ghost?.x ?? this.w * 0.77,
      y: (this.ghost?.y ?? 300) - (this.ghost?.displayHeight ?? 180) * 0.55 };
    const color = this.battle.power > 1.5 ? 0xa8f3e3 : 0xffd58a;
    const flying = this.text(start.x, start.y, word.toUpperCase(), this.small ? 25 : 38,
      "#ffe4a9", this.world).setOrigin(0.5).setFontFamily("Georgia");
    const glow = this.add.image(start.x, start.y, "spark").setTint(color).setScale(1.7).setBlendMode("ADD");
    this.world.add(glow);
    this.burst(start.x, start.y, color, 10);
    const travel = { t: 0 };
    let lastTrail = -1;
    this.tweens.add({ targets: travel, t: 1, duration: 850, ease: "Cubic.easeIn",
      onUpdate: () => {
        const t = travel.t;
        const x = Phaser.Math.Linear(start.x, end.x, t);
        const y = Phaser.Math.Linear(start.y, end.y, t) - Math.sin(t * Math.PI) * 65;
        flying.setPosition(x, y).setScale(1 - t * 0.55);
        glow.setPosition(x, y);
        if (t - lastTrail > 0.035) {
          lastTrail = t;
          const trail = this.add.image(x, y, "spark").setTint(color).setScale(0.6).setBlendMode("ADD");
          this.world.add(trail);
          this.tweens.add({ targets: trail, alpha: 0, scale: 0, duration: 300,
            onComplete: () => trail.destroy() });
        }
      },
      onComplete: () => {
        flying.destroy(); glow.destroy();
        this.burst(end.x, end.y, color);
        this.act({ type: "impact", damage });
        this.cameras.main.shake(140, 0.003);
        const ghost = this.ghost;
        if (ghost) {
          ghost.setTintFill(color);
          this.tweens.add({ targets: ghost, x: ghost.x + 18, duration: 100, yoyo: true,
            onComplete: () => ghost.clearTint() });
        }
      },
    });
  }
  shield() {
    const x = (this.hero?.x ?? this.w * 0.25) + 38;
    const y = (this.hero?.y ?? 300) - (this.hero?.displayHeight ?? 180) * 0.5;
    this.burst(this.spell?.x ?? x, this.spell?.y ?? y, 0xa8f3e3, 28);
    const shield = this.add.container(x, y);
    this.world.add(shield);
    for (let i = 0; i < 3; i++) {
      const ring = this.add.ellipse(0, 0, 110 + i * 20, 155 + i * 20, 0x6ddfcf, 0.06)
        .setStrokeStyle(i === 0 ? 3 : 1, 0xb5f6e8, 0.85);
      shield.add(ring);
    }
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      shield.add(this.add.star(Math.cos(a) * 64, Math.sin(a) * 86, 4, 2, 6, 0xd5fff4));
    }
    shield.setScale(0.35);
    this.tweens.add({ targets: shield, scale: 1, duration: 180, ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({ targets: shield, alpha: 0, scale: 1.2, duration: 550,
          onComplete: () => shield.destroy() });
      } });
  }
  fizzle() {
    if (!this.hero) return;
    this.cameras.main.shake(90, 0.002);
    const spark = this.add
      .image(this.hero.x, this.hero.y - this.hero.displayHeight * 0.4, "spark")
      .setTint(0xe48b6f)
      .setScale(0.7);
    this.world.add(spark);
    this.tweens.add({
      targets: spark,
      alpha: 0,
      duration: 250,
      onComplete: () => spark.destroy(),
    });
  }
  pause(force = false) {
    this.mechanical?.release();
    if (this.mode !== "battle" || this.battle.result || this.modal) return;
    if (this.battle.active)
      this.battle = reduceBattle(this.battle, { type: "pause" });
    if (force || this.battle.active) this.showPause();
  }
  modalBase(title: string, subtitle: string) {
    this.overlay.removeAll(true);
    this.modal = true;
    const shade = this.rect(
      this.w / 2,
      this.h / 2,
      this.w,
      this.h,
      0x030911,
      0.88,
      this.overlay,
    ).setInteractive();
    shade.on("pointerdown", () => {});
    this.text(
      this.w / 2,
      this.h * 0.28,
      title,
      this.small ? 27 : 38,
      "#e6cb99",
      this.overlay,
    )
      .setOrigin(0.5)
      .setFontFamily("Georgia")
      .setAlign("center")
      .setWordWrapWidth(this.w - 40);
    this.text(
      this.w / 2,
      this.h * 0.38,
      subtitle,
      this.small ? 13 : 16,
      "#b9c4c9",
      this.overlay,
    )
      .setOrigin(0.5)
      .setAlign("center")
      .setWordWrapWidth(Math.min(520, this.w - 48));
  }
  showPause() {
    this.modalBase("Магия подождёт", "Можно немного выдохнуть.");
    this.button(
      this.w / 2,
      this.h * 0.51,
      "Продолжить",
      () => {
        if (this.battle.active) this.act({ type: "start" });
        else {
          this.modal = false;
          this.overlay.removeAll(true);
        }
      },
      this.overlay,
      210,
    );
    this.button(
      this.w / 2,
      this.h * 0.51 + 56,
      "Начать урок заново",
      () => this.startLesson(this.battle.lesson),
      this.overlay,
      210,
    );
    this.button(
      this.w / 2,
      this.h * 0.51 + 112,
      "История",
      () => {
        this.mode = "comic";
        this.page = 0;
        this.revealed = 1;
        this.modal = false;
        this.battle = newBattle(this.battle.lesson);
        this.render();
      },
      this.overlay,
      210,
    );
    this.button(
      this.w / 2,
      this.h * 0.51 + 168,
      "Книга заклинаний",
      () => this.showBook(),
      this.overlay,
      210,
    );
  }
  showBook() {
    this.modalBase("Книга заклинаний", "");
    const size = this.small ? 12 : 16;
    spells.forEach((s, i) => {
      const col = this.small ? 0 : i % 2,
        row = this.small ? i : Math.floor(i / 2);
      const y = this.h * 0.35 + row * (this.small ? 19 : 30);
      this.text(
        this.small ? 28 : this.w * 0.25 + col * this.w * 0.28,
        y,
        s,
        size,
        "#cbb78f",
        this.overlay,
      );
    });
    this.button(
      this.w / 2,
      this.h - 35,
      "Назад",
      () => this.showPause(),
      this.overlay,
    );
  }
  showResult() {
    const win = this.battle.result === "win";
    this.modalBase(
      win ? "Заклинание освоено!" : "Попробуем ещё раз",
      win
        ? this.battle.lesson === 4
          ? "Дементор побеждён. Кажется, здесь всё-таки интересно."
          : "«Ладно. Ещё один урок. Из любопытства»."
        : "Призрак оказался быстрее. Клавиатура ещё с нами.",
    );
    this.text(
      this.w / 2,
      this.h * 0.46,
      `${accuracy(this.battle.correct, this.battle.attempts)}% точности`,
      19,
      "#d9ba7e",
      this.overlay,
    ).setOrigin(0.5);
    this.button(
      this.w / 2,
      this.h * 0.57,
      win && this.battle.lesson < 4 ? "Следующий урок" : "Ещё раз",
      () =>
        this.startLesson(
          win ? Math.min(4, this.battle.lesson + 1) : this.battle.lesson,
        ),
      this.overlay,
      220,
    );
  }
  startLesson(n: number) {
    this.battle = newBattle(n);
    this.mode = "battle";
    this.modal = false;
    this.second = 0;
    this.render();
  }
  onKey(e: KeyboardEvent) {
    this.mechanical?.down(e.code);
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (this.mode === "comic") {
      if (e.repeat) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this.nextPage();
      } else if (e.key === "ArrowLeft" && this.page > 0) {
        e.preventDefault();
        this.page--;
        this.revealed = story[this.page].bubbles.length;
        this.render();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (this.modal && !this.battle.result) {
        this.act({ type: "start" });
      } else this.pause(true);
      return;
    }
    if (this.modal || this.battle.result) return;
    if (!this.battle.active && e.key === "Enter") {
      this.act({ type: "start" });
      return;
    }
    if (e.key.length === 1) {
      e.preventDefault();
      this.act({ type: "key", key: e.key });
    }
  }
  update(_time: number, delta: number) {
    if (this.mode === "battle") this.positionWord();
    this.tweens.timeScale = this.modal && this.battle.paused ? 0 : 1;
    if (
      this.mode !== "battle" ||
      !this.battle.active ||
      this.battle.paused ||
      this.modal ||
      this.battle.result
    )
      return;
    this.second += Math.min(delta, 1000);
    if (this.second >= 1000) {
      this.second -= 1000;
      this.act({ type: "tick" });
    }
  }
}

export function launchGame(parent: HTMLElement) {
  const width = parent.clientWidth || window.innerWidth;
  const height = parent.clientHeight || window.innerHeight;
  const size = stageSize(width, height);
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#09121c",
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
      zoom: width / (size.width * RENDER_SCALE),
      width: size.width * RENDER_SCALE,
      height: size.height * RENDER_SCALE,
    },
    callbacks: {
      postBoot: (game) => {
        const observer = new ResizeObserver(() => {
          const { clientWidth: width, clientHeight: height } = parent;
          if (!width || !height) return;
          const next = stageSize(width, height);
          const renderWidth = next.width * RENDER_SCALE;
          const renderHeight = next.height * RENDER_SCALE;
          const zoom = width / renderWidth;
          if (Math.abs(game.scale.zoom - zoom) > 0.000001) {
            game.scale.setZoom(zoom);
          }
          if (Math.abs(game.scale.width - renderWidth) > 0.01 ||
              Math.abs(game.scale.height - renderHeight) > 0.01) {
            game.scale.resize(renderWidth, renderHeight);
          }
          game.scale.updateBounds();
        });
        observer.observe(parent);
        game.events.once(Phaser.Core.Events.DESTROY, () => observer.disconnect());
      },
    },
    scene: [Loading, Typewarts],
    audio: { noAudio: true },
    render: { antialias: true },
    input: { keyboard: true },
  });
}
