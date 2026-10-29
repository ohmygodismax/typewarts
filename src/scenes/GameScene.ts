import Phaser from "phaser";
import { RENDER_SCALE } from "../runtime/display";
import { lessons } from "../content/lessons";
import { parseProgress, type Progress } from "../domain/progress";
import { accuracy } from "../domain/typing";
import { newBattle, reduceBattle, battleWord, type Action } from "../domain/battle";
import { SceneUI } from "../ui/SceneUI";
import { ComicView } from "../views/ComicView";
import { BattleView } from "../views/BattleView";
import { BattleEffects } from "../views/BattleEffects";
import { GameMenus } from "../ui/GameMenus";

/** Owns Phaser lifecycle, battle actions, and transitions between screens. */
export class GameScene extends Phaser.Scene {
  readonly ui = new SceneUI(this);
  readonly comic = new ComicView(this);
  readonly battleView = new BattleView(this);
  readonly effects = new BattleEffects(this);
  readonly menus = new GameMenus(this);
  progress: Progress = parseProgress(null);
  battle = newBattle();
  mode: "comic" | "battle" | "ending" = "comic";
  world!: Phaser.GameObjects.Container;
  hud!: Phaser.GameObjects.Container;
  overlay!: Phaser.GameObjects.Container;
  keyUpHandler = (e: KeyboardEvent) => this.battleView.mechanical?.up(e.code);
  // System layout switchers can take focus without hiding the game.
  blurHandler = () => this.battleView.mechanical?.release();
  saveFailed = false;
  second = 0;
  keyHandler = (e: KeyboardEvent) => this.onKey(e);
  get w() {
    return this.scale.width / RENDER_SCALE;
  }
  get h() {
    return this.scale.height / RENDER_SCALE;
  }
  get small() {
    return false; // Keep the desktop controls while the stage expands with the window.
  }
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
    if (this.progress.intro && this.progress.unlocked === 1 && !this.progress.corridorIntro) {
      this.comic.chapter = "corridor";
      this.mode = "comic";
    }
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
    this.game.events.on(Phaser.Core.Events.BLUR, this.blurHandler);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.pause, this);
    this.events.once("shutdown", () => {
      this.input.keyboard?.off("keydown", this.keyHandler);
      this.input.keyboard?.off("keyup", this.keyUpHandler);
      this.scale.off("resize", this.render, this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.blurHandler);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.pause, this);
    });
    this.render();
  }
  clear() {
    this.tweens.killAll();
    this.world.removeAll(true);
    this.hud.removeAll(true);
    this.overlay.removeAll(true);
    this.battleView.reset();
  }
  render() {
    if (this.battle.pendingDamage > 0)
      this.battle = reduceBattle(this.battle, {
        type: "impact",
        damage: this.battle.pendingDamage,
      });
    const wasModal = this.menus.modal;
    this.clear();
    this.menus.modal = false;
    this.cameras.main.setBackgroundColor("#0b1420");
    if (this.mode === "comic") this.comic.drawComic();
    else if (this.mode === "ending") this.comic.drawEnding();
    else {
      this.battleView.drawBattle();
      if (this.menus.tutorialStep !== null) this.menus.drawTutorial();
      else if (!this.progress.tutorialSeen && this.battle.lesson === 0 && !this.battle.active && !this.battle.result) this.menus.showTutorial();
      else if (this.battle.result) this.menus.showResult();
      else if (wasModal || this.battle.paused) this.menus.showPause();
    }
  }
  act(action: Action) {
    const before = this.battle;
    this.battle = reduceBattle(before, action);
    if (action.type === "start") {
      this.second = 0;
      this.overlay.removeAll(true);
      this.menus.modal = false;
      if (!before.active) this.render();
    }
    if (this.battle.cast > before.cast)
      this.effects.castWord(
        battleWord(before),
        this.battle.pendingDamage - before.pendingDamage,
      );
    if (this.battle.turn !== before.turn) this.second = 0;
    if (this.battle.blocked > before.blocked) this.effects.shield();
    if (this.battle.attack > before.attack) {
      this.cameras.main.shake(180, 0.006);
      this.battleView.hero?.setTintFill(0xe79682);
      this.time.delayedCall(120, () => this.battleView.hero?.clearTint());
    }
    if (this.battle.wrong > before.wrong) this.effects.fizzle();
    this.battleView.updateHud();
    if (this.battle.result && !before.result) {
      if (this.battle.result === "win") {
        const b = this.battle;
        this.progress.xp += accuracy(b.correct, b.attempts) >= 95 ? 150 : 100;
        this.progress.unlocked = Math.max(
          this.progress.unlocked,
          Math.min(lessons.length - 1, b.lesson + 1),
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
        if (this.mode === "battle" && this.battle.result) this.menus.showResult();
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
  pause(force = false) {
    this.battleView.mechanical?.release();
    if (this.mode !== "battle" || this.battle.result || this.menus.modal) return;
    if (this.battle.active)
      this.battle = reduceBattle(this.battle, { type: "pause" });
    if (force || this.battle.active) this.menus.showPause();
  }
  restartGame() {
    this.progress = parseProgress(null);
    this.menus.tutorialStep = null;
    this.battle = newBattle(0);
    this.comic.chapter = "intro";
    this.mode = "comic";
    this.comic.page = 0;
    this.comic.revealed = 1;
    this.comic.lastAdvance = -Infinity;
    this.menus.modal = false;
    this.second = 0;
    this.save();
    this.render();
  }
  startLesson(n: number) {
    this.battle = newBattle(n);
    this.mode = "battle";
    if (n === 1 && !this.progress.corridorIntro) {
      this.comic.chapter = "corridor";
      this.mode = "comic";
      this.comic.page = 0;
      this.comic.revealed = 1;
    }
    this.menus.modal = false;
    this.second = 0;
    this.render();
  }
  onKey(e: KeyboardEvent) {
    if (this.mode === "ending") return;
    if (this.menus.tutorialStep !== null) {
      if (["Escape", "Enter", "ArrowRight", "ArrowLeft", " "].includes(e.key)) e.preventDefault();
      if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Escape") this.menus.finishTutorial();
      else if (e.key === "ArrowLeft" && this.menus.tutorialStep > 0) {
        this.menus.tutorialStep--;
        this.menus.drawTutorial();
      } else if (e.key === "Enter" || e.key === "ArrowRight") {
        if (this.menus.tutorialStep === 3) this.menus.finishTutorial();
        else {
          this.menus.tutorialStep++;
          this.menus.drawTutorial();
        }
      }
      return;
    }
    this.battleView.mechanical?.down(e.code);
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (this.mode === "comic") {
      if (e.repeat) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this.comic.nextPage();
      } else if (e.key === "ArrowLeft" && this.comic.page > 0) {
        e.preventDefault();
        this.comic.page--;
        this.comic.revealed = this.comic.currentStory[this.comic.page].bubbles.length;
        this.render();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (this.menus.modal && !this.battle.result) {
        this.act({ type: "start" });
      } else this.pause(true);
      return;
    }
    if (this.menus.modal || this.battle.result) return;
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
    this.tweens.timeScale = this.menus.modal && this.battle.paused ? 0 : 1;
    if (
      this.mode !== "battle" ||
      !this.battle.active ||
      this.battle.paused ||
      this.menus.modal ||
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
