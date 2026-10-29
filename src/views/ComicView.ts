import Phaser from "phaser";
import { TEXT_RESOLUTION } from "../runtime/display";
import { CREAM } from "../ui/theme";
import { imageKeys } from "../content/assets";
import { story, corridorStory, epilogueStory, type Speaker } from "../content/story";
import { placeBubble, bubbleTail, dialogueTarget, type Point, type Box, type SpeakerAnchors } from "../domain/comicLayout";
import { accuracy } from "../domain/typing";
import { newBattle } from "../domain/battle";
import type { GameScene } from "../scenes/GameScene";

export class ComicView {
  chapter: "intro" | "corridor" | "epilogue" = "intro";
  get currentStory() {
    return this.chapter === "epilogue" ? epilogueStory : this.chapter === "corridor" ? corridorStory : story;
  }
  page = 0;
  revealed = 1;
  lastAdvance = -Infinity;
  constructor(private readonly scene: GameScene) {}

  drawComic() {
    const panel = this.currentStory[this.page];
    const frame = this.scene.small ? 10 : 24;
    this.scene.ui.rect(this.scene.w / 2, this.scene.h / 2, this.scene.w, this.scene.h, 0x0b1018, 1, this.scene.world);
    const background = this.scene.ui.cover(
      imageKeys[panel.image],
      frame,
      frame,
      this.scene.w - frame * 2,
      this.scene.h - frame * 2,
    );
    if (panel.id === "coding" || panel.id === "sleep") {
      // Frame the working area instead of the empty dark floor in the source art.
      background.setScale(
        Math.max(
          this.scene.w / background.width,
          this.scene.h / (background.height * 0.77),
        ),
      );
      background.setOrigin(0.5, 0).setPosition(this.scene.w * 0.5, -this.scene.h * 0.025);
    }
    const border = this.scene.add.graphics().lineStyle(3, 0xf4eee1, 0.95);
    border.strokeRect(frame, frame, this.scene.w - frame * 2, this.scene.h - frame * 2);
    this.scene.hud.add(border);
    const anchors: Partial<Record<Speaker, SpeakerAnchors>> = {};
    const imagePoint = (image: Phaser.GameObjects.Image, point: Point): Point => ({
      x: image.x + (point.x - image.originX) * image.displayWidth,
      y: image.y + (point.y - image.originY) * image.displayHeight,
    });
    for (const [speaker, points] of Object.entries(panel.anchors ?? {})) {
      anchors[speaker as keyof typeof anchors] = {
        mouth: imagePoint(background, points.mouth),
        head: imagePoint(background, points.head),
      };
    }
    if (panel.hero) {
      const im = this.scene.add
        .image(this.scene.w * 0.4, this.scene.h * 0.94, "hero")
        .setOrigin(0.5, 1);
      im.setScale((this.scene.h * 0.8) / im.height);
      anchors.hero = { mouth: imagePoint(im, { x: 0.694, y: 0.143 }),
        head: imagePoint(im, { x: 0.65, y: 0.025 }) };
      this.scene.world.add(im);
    }
    if (panel.ghost) {
      const im = this.scene.add
        .image(this.scene.w * 0.8, this.scene.h * 0.8, "ghost")
        .setOrigin(0.5, 1);
      im.setScale((this.scene.h * 0.58) / im.height);
      anchors.ghost = { mouth: imagePoint(im, { x: 0.405, y: 0.158 }),
        head: imagePoint(im, { x: 0.425, y: 0.065 }) };
      this.scene.world.add(im);
    }
    const margin = this.scene.small ? 22 : Math.max(32, this.scene.w * 0.04);
    const maxW = this.scene.small
      ? this.scene.w - margin * 2
      : Math.min(370, this.scene.w * 0.29);
    const layouts = panel.bubbles.map((b) => {
      const width = this.scene.small
        ? Math.min(maxW, b.kind === "caption" ? 270 : 300)
        : maxW;
      const size =
        b.kind === "shout"
          ? this.scene.small
            ? 25
            : 34
          : b.kind === "caption"
            ? this.scene.small
              ? 17
              : 20
            : this.scene.small
              ? 15
              : 18;
      const txt = this.scene.add.text(0, 0, b.text, {
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
    const bounds = { x: margin, y: margin, width: this.scene.w - margin * 2, height: this.scene.h - margin - 110 };
    const obstacles: Box[] = Object.values(anchors).map(({ mouth, head }) => ({
      x: Math.min(mouth.x, head.x) - 60, y: Math.min(mouth.y, head.y) - 25,
      width: Math.abs(mouth.x - head.x) + 120, height: Math.abs(mouth.y - head.y) + 60,
    }));
    const positioned = new Map<number, Box>();
    // Reserve captions before placing dialogue, including still-hidden bubbles.
    layouts.forEach(({ b, width, height }, i) => {
      if (b.kind !== "caption") return;
      const rect = {
        x: b.position.endsWith("right") ? this.scene.w - margin - width : margin,
        y: b.position.startsWith("bottom") ? this.scene.h - 110 - height : margin,
        width, height,
      };
      positioned.set(i, rect);
      obstacles.push(rect);
    });
    layouts.forEach(({ b, width, height }, i) => {
      if (b.kind === "caption") return;
      const speaker = b.speaker ? anchors[b.speaker] : undefined;
      const target = speaker ? dialogueTarget(speaker, b.kind) : undefined;
      const rect = placeBubble(target ?? { x: this.scene.w / 2, y: this.scene.h / 2 },
        width, height, bounds, obstacles, b.position);
      positioned.set(i, rect);
      obstacles.push({ x: rect.x - 12, y: rect.y - 12, width: width + 24, height: height + 24 });
    });
    layouts.forEach(({ b, width, height, txt }, i) => {
      if (i >= this.revealed) {
        txt.destroy();
        return;
      }
      const rect = positioned.get(i)!;
      const { x, y } = rect;
      const box = this.scene.add.graphics();
      const fill = b.kind === "caption" ? 0xddc695 : b.kind === "shout" ? 0xf3ce85 : CREAM;
      const speaker = b.speaker ? anchors[b.speaker] : undefined;
      const target = speaker ? dialogueTarget(speaker, b.kind) : undefined;
      const tail = target ? bubbleTail(rect, target) : undefined;
      box.fillStyle(fill);
      box.lineStyle(2, 0x332a21);
      if (tail && b.kind !== "thought") {
        box.fillTriangle(tail.a.x, tail.a.y, tail.tip.x, tail.tip.y, tail.b.x, tail.b.y);
        box.strokeTriangle(tail.a.x, tail.a.y, tail.tip.x, tail.tip.y, tail.b.x, tail.b.y);
      }
      box.fillRoundedRect(x, y, width, height, b.kind === "caption" ? 3 : 20);
      box.strokeRoundedRect(x, y, width, height, b.kind === "caption" ? 3 : 20);
      if (tail && b.kind !== "thought") {
        // Remove only the shared base so the outlined tail joins the bubble.
        box.lineStyle(3, fill);
        box.lineBetween(tail.a.x, tail.a.y, tail.b.x, tail.b.y);
      } else if (tail) {
        for (const [fraction, radius] of [[0.25, 7], [0.62, 5], [1, 3]]) {
          const cx = tail.base.x + (tail.tip.x - tail.base.x) * fraction;
          const cy = tail.base.y + (tail.tip.y - tail.base.y) * fraction;
          box.fillCircle(cx, cy, radius);
          box.strokeCircle(cx, cy, radius);
        }
      }
      txt.setPosition(x + 18, y + 14);
      this.scene.hud.add([box, txt]);
    });
    this.comicContinue(margin);
  }
  comicContinue(margin: number) {
    const width = Math.min(238, this.scene.w - 32),
      x = this.scene.w - margin - width / 2,
      y = this.scene.h - 24 - 22 - 20;
    const done = this.revealed >= this.currentStory[this.page].bubbles.length;
    const label = done
      ? this.page === this.currentStory.length - 1
        ? this.chapter === "epilogue" ? "Далее" : this.chapter === "corridor" ? "К испытанию" : "Начать игру"
        : "Следующий кадр"
      : "Продолжить";
    this.scene.ui.button(x, y, label, () => this.nextPage(), this.scene.hud, width, "Enter");
  }

  nextPage() {
    const now = performance.now();
    if (now - this.lastAdvance < 160) return;
    this.lastAdvance = now;
    if (this.revealed < this.currentStory[this.page].bubbles.length) {
      this.revealed++;
      this.scene.render();
      return;
    }
    if (this.page < this.currentStory.length - 1) {
      this.page++;
      this.revealed = 1;
      this.scene.render();
    } else {
      if (this.chapter === "epilogue") {
        this.scene.mode = "ending";
        this.scene.render();
        return;
      }
      if (this.chapter === "corridor") this.scene.progress.corridorIntro = true;
      else this.scene.progress.intro = true;
      this.scene.save();
      this.scene.mode = "battle";
      this.scene.battle = newBattle(this.chapter === "corridor" ? 1 : this.scene.progress.unlocked);
      this.scene.render();
    }
  }
  drawEnding() {
    this.scene.ui.cover("awakening", 0, 0, this.scene.w, this.scene.h);
    const shade = this.scene.ui.rect(this.scene.w / 2, this.scene.h / 2, this.scene.w, this.scene.h, 0x050912, 1).setAlpha(0);
    const title = this.scene.ui.text(this.scene.w / 2, this.scene.h * 0.44, "Продолжение следует…", 46, "#e6cb99")
      .setFontFamily("Georgia").setOrigin(0.5).setAlpha(0);
    const result = this.scene.ui.text(this.scene.w / 2, this.scene.h * 0.54,
      `Страж побеждён · ${accuracy(this.scene.battle.correct, this.scene.battle.attempts)}% точности`, 17, "#b9c4c9")
      .setOrigin(0.5).setAlpha(0);
    this.scene.tweens.add({ targets: shade, alpha: 1, duration: 900 });
    this.scene.tweens.add({ targets: [title, result], alpha: 1, delay: 900, duration: 650,
      onComplete: () => {
        this.scene.ui.button(this.scene.w / 2, this.scene.h * 0.67, "Начать игру сначала", () => this.scene.restartGame(), this.scene.hud, 240);
      } });
  }
}
