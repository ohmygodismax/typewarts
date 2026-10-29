import { GOLD, INK } from "./theme";
import { lessons, spells } from "../content/lessons";
import { newBattle } from "../domain/battle";
import { accuracy } from "../domain/typing";
import type { GameScene } from "../scenes/GameScene";

export class GameMenus {
  tutorialStep: number | null = null;
  tutorialFromMenu = false;
  modal = false;
  constructor(private readonly scene: GameScene) {}

  modalBase(title: string, subtitle: string) {
    this.scene.overlay.removeAll(true);
    this.modal = true;
    const shade = this.scene.ui.rect(
      this.scene.w / 2,
      this.scene.h / 2,
      this.scene.w,
      this.scene.h,
      0x030911,
      0.88,
      this.scene.overlay,
    ).setInteractive();
    shade.on("pointerdown", () => {});
    this.scene.ui.text(
      this.scene.w / 2,
      this.scene.h * 0.28,
      title,
      this.scene.small ? 27 : 38,
      "#e6cb99",
      this.scene.overlay,
    )
      .setOrigin(0.5)
      .setFontFamily("Georgia")
      .setAlign("center")
      .setWordWrapWidth(this.scene.w - 40);
    this.scene.ui.text(
      this.scene.w / 2,
      this.scene.h * 0.38,
      subtitle,
      this.scene.small ? 13 : 16,
      "#b9c4c9",
      this.scene.overlay,
    )
      .setOrigin(0.5)
      .setAlign("center")
      .setWordWrapWidth(Math.min(520, this.scene.w - 48));
  }
  showTutorial(fromMenu = false) {
    this.tutorialStep = 0;
    this.tutorialFromMenu = fromMenu;
    this.scene.battleView.mechanical?.release();
    this.drawTutorial();
  }
  finishTutorial() {
    this.tutorialStep = null;
    this.scene.progress.tutorialSeen = true;
    this.scene.save();
    this.scene.overlay.removeAll(true);
    this.modal = false;
    if (this.tutorialFromMenu) this.showPause();
  }
  drawTutorial() {
    const steps = [
      {
        title: "Победи соперника заклинаниями",
        body: "Слева — твоё здоровье, справа — здоровье соперника. Набирай заклинания, чтобы атаковать и защищаться. Победа — когда здоровье соперника закончится. Если закончится твоё, урок можно повторить.",
        top: 0, bottom: 100,
      },
      {
        title: "Печатай подсвеченное заклинание",
        body: "Переключись на русскую раскладку и набирай слово на своей клавиатуре. Подсвеченная буква — следующая. Большие и маленькие буквы подходят одинаково. Пробелы тоже нужно вводить: они отмечены знаком ␣. Ошибся? Продолжай с той же буквы, стирать ничего не нужно.",
        top: this.scene.battleView.keyboardTop - 108, bottom: this.scene.battleView.keyboardTop - 42,
      },
      {
        title: "Атакуй и защищайся вовремя",
        body: "Ходы чередуются: атака наносит урон, защита создаёт щит. В обоих случаях успей набрать слово до конца отсчёта. В атаке три ошибки передают ход сопернику. Если время защиты истечёт, ты потеряешь здоровье. Заклинание сработает само — Enter нажимать не нужно.",
        top: this.scene.battleView.keyboardTop - 168, bottom: this.scene.battleView.keyboardTop - 42,
      },
      {
        title: "Подсказки всегда под рукой",
        body: "Клавиатура внизу подсвечивает нужную клавишу. Под ней — скорость, точность и серия слов без ошибок. Кнопка Ⅱ справа вверху или Esc открывает меню и ставит дуэль на паузу. Там можно снова открыть обучение. Когда будешь готов, нажми «Начать дуэль».",
        top: this.scene.battleView.keyboardTop, bottom: this.scene.h,
      },
    ];
    const index = this.tutorialStep ?? 0;
    const step = steps[index];
    this.scene.overlay.removeAll(true);
    this.modal = true;
    // Block clicks across the screen, including the undimmed demonstration area.
    this.scene.ui.rect(this.scene.w / 2, this.scene.h / 2, this.scene.w, this.scene.h, 0x030911, 0, this.scene.overlay).setInteractive();
    if (step.top > 0)
      this.scene.ui.rect(this.scene.w / 2, step.top / 2, this.scene.w, step.top, 0x030911, 0.83, this.scene.overlay);
    if (step.bottom < this.scene.h)
      this.scene.ui.rect(this.scene.w / 2, (step.bottom + this.scene.h) / 2, this.scene.w, this.scene.h - step.bottom, 0x030911, 0.83, this.scene.overlay);
    const outline = this.scene.add.graphics().lineStyle(2, GOLD, 0.8);
    outline.strokeRect(12, step.top + 2, this.scene.w - 24, step.bottom - step.top - 4);
    this.scene.overlay.add(outline);
    const width = 840;
    const x = (this.scene.w - width) / 2;
    const y = index === 0 ? 180 : index === 3 ? 110 : this.scene.battleView.keyboardTop + 38;
    this.scene.ui.rect(this.scene.w / 2, y + 137, width, 274, INK, 0.98, this.scene.overlay)
      .setStrokeStyle(1, GOLD, 0.6);
    this.scene.ui.text(x + 28, y + 20, `ОБУЧЕНИЕ · ${index + 1} / ${steps.length} · время остановлено`, 14, "#b9c4c9", this.scene.overlay);
    this.scene.ui.text(x + 28, y + 49, step.title, 28, "#e6cb99", this.scene.overlay).setFontFamily("Georgia");
    this.scene.ui.text(x + 28, y + 94, step.body, 18, "#e7dfd0", this.scene.overlay).setWordWrapWidth(width - 56);
    if (index > 0)
      this.scene.ui.button(x + 96, y + 237, "Назад", () => {
        this.tutorialStep = index - 1;
        this.drawTutorial();
      }, this.scene.overlay, 136);
    else
      this.scene.ui.button(x + 96, y + 237, "Назад", () => {}, this.scene.overlay, 136)
        .disableInteractive().setAlpha(0.35);
    this.scene.ui.button(this.scene.w / 2, y + 237, "Пропустить", () => this.finishTutorial(), this.scene.overlay, 164);
    this.scene.ui.button(x + width - 112, y + 237, index === steps.length - 1 ? "Готово" : "Далее", () => {
      if (index === steps.length - 1) this.finishTutorial();
      else {
        this.tutorialStep = index + 1;
        this.drawTutorial();
      }
    }, this.scene.overlay, 168);
  }
  showPause() {
    this.modalBase("Магия подождёт", "Можно немного выдохнуть.");
    this.scene.ui.button(
      this.scene.w / 2,
      this.scene.h * 0.51,
      "Продолжить",
      () => {
        if (this.scene.battle.active) this.scene.act({ type: "start" });
        else {
          this.modal = false;
          this.scene.overlay.removeAll(true);
        }
      },
      this.scene.overlay,
      210,
    );
    this.scene.ui.button(
      this.scene.w / 2,
      this.scene.h * 0.51 + 56,
      "Начать урок заново",
      () => this.scene.startLesson(this.scene.battle.lesson),
      this.scene.overlay,
      210,
    );
    this.scene.ui.button(
      this.scene.w / 2,
      this.scene.h * 0.51 + 112,
      "История",
      () => {
        this.scene.comic.chapter = this.scene.battle.lesson === 1 ? "corridor" : "intro";
        this.scene.mode = "comic";
        this.scene.comic.page = 0;
        this.scene.comic.revealed = 1;
        this.modal = false;
        this.scene.battle = newBattle(this.scene.battle.lesson);
        this.scene.render();
      },
      this.scene.overlay,
      210,
    );
    this.scene.ui.button(
      this.scene.w / 2,
      this.scene.h * 0.51 + 168,
      "Книга заклинаний",
      () => this.showBook(),
      this.scene.overlay,
      210,
    );
    this.scene.ui.button(this.scene.w / 2, this.scene.h * 0.51 + 224, "Обучение",
      () => this.showTutorial(true), this.scene.overlay, 210);
  }
  showBook() {
    this.modalBase("Книга заклинаний", "");
    const size = this.scene.small ? 12 : 16;
    spells.forEach((s, i) => {
      const col = this.scene.small ? 0 : i % 2,
        row = this.scene.small ? i : Math.floor(i / 2);
      const y = this.scene.h * 0.35 + row * (this.scene.small ? 19 : 30);
      this.scene.ui.text(
        this.scene.small ? 28 : this.scene.w * 0.25 + col * this.scene.w * 0.28,
        y,
        s,
        size,
        "#cbb78f",
        this.scene.overlay,
      );
    });
    this.scene.ui.button(
      this.scene.w / 2,
      this.scene.h - 35,
      "Назад",
      () => this.showPause(),
      this.scene.overlay,
    );
  }
  showResult() {
    const win = this.scene.battle.result === "win";
    if (win && this.scene.battle.lesson === 1) {
      this.scene.comic.chapter = "epilogue";
      this.scene.mode = "comic";
      this.scene.comic.page = 0;
      this.scene.comic.revealed = 1;
      this.modal = false;
      this.scene.second = 0;
      this.scene.render();
      return;
    }
    this.modalBase(
      win ? "Заклинание освоено!" : "Попробуем ещё раз",
      win
        ? this.scene.battle.lesson === 1
          ? "Страж опустил алебарду. Путь к лестнице открыт."
          : this.scene.battle.lesson === 0
          ? "Призрак побеждён. За дверью слышны шаги…"
          : "«Ладно. Ещё один урок. Из любопытства»."
        : this.scene.battle.lesson === 1 ? "Страж оказался быстрее. Попробуй ещё раз — не забывай пробелы."
          : "Призрак оказался быстрее. Клавиатура ещё с нами.",
    );
    this.scene.ui.text(
      this.scene.w / 2,
      this.scene.h * 0.46,
      `${accuracy(this.scene.battle.correct, this.scene.battle.attempts)}% точности`,
      19,
      "#d9ba7e",
      this.scene.overlay,
    ).setOrigin(0.5);
    this.scene.ui.button(
      this.scene.w / 2,
      this.scene.h * 0.57,
      win && this.scene.battle.lesson < lessons.length - 1
        ? this.scene.battle.lesson === 0 ? "В коридор" : "Следующий урок" : "Ещё раз",
      () =>
        this.scene.startLesson(
          win ? Math.min(lessons.length - 1, this.scene.battle.lesson + 1) : this.scene.battle.lesson,
        ),
      this.scene.overlay,
      220,
    );
  }
}
