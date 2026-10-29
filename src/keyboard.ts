import Phaser from "phaser";
import { TEXT_RESOLUTION } from "./display";
export class MechanicalKeyboard {
  keys = new Map<
    string,
    {
      body: Phaser.GameObjects.Image;
      label: Phaser.GameObjects.Text;
      y: number;
      char: string;
    }
  >();
  pressed = new Set<string>();
  target = "";
  constructor(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
  ) {
    const unit = width / 23.5,
      gap = unit * 0.10,
      rowStep = unit * 0.65,
      h = rowStep * 0.87;
    // The key bed occupies the recessed interior of the painted housing.
    const bedHeight = rowStep * 6.25;
    const caseWidth = width / 0.85;
    const caseHeight = bedHeight / 0.40;
    const plate = scene.add.image(x - caseWidth * 0.08, y - caseHeight * 0.28, "keyboardHousing")
      .setOrigin(0).setDisplaySize(caseWidth, caseHeight);
    parent.add(plate);
    const key = (
      code: string,
      label: string,
      c: number,
      r: number,
      w = 1,
      char = "",
    ) => {
      const xx = x + c * unit + (w * unit - gap) / 2,
        yy = y + r * rowStep + h / 2;
      const body = scene.add.image(xx, yy, "keycap")
        .setDisplaySize(w * unit - gap + 4, h + 5);
      const txt = scene.add
        .text(xx, yy, label, {
          fontFamily: "Arial",
          fontSize: (label.length > 2 ? 12 : 16) + "px",
          color: "#f4e8d0",
          align: "center",
          resolution: TEXT_RESOLUTION,
          fontStyle: "normal",
        })
        .setOrigin(0.5);
      parent.add([body, txt]);
      this.keys.set(code, { body, label: txt, y: yy, char });
    };
    key("Escape", "Esc", 0, 0);
    for (let i = 1; i <= 12; i++)
      key("F" + i, "F" + i, 1.5 + i + (i > 4 ? 0.3 : 0) + (i > 8 ? 0.3 : 0), 0);
    [
      ["PrintScreen", "Prt"],
      ["ScrollLock", "Scr"],
      ["Pause", "Pause"],
    ].forEach(([c, l], i) => key(c, l, 15.7 + i, 0));
    const row = (r: number, items: [string, string, number?, string?][]) => {
      let c = 0;
      for (const [code, label, w = 1, char = ""] of items) {
        key(code, label, c, r, w, char);
        c += w;
      }
    };
    row(1.35, [
      ["Backquote", "Ё", 1, "ё"],
      ...Array.from("1234567890").map(
        (n) => ["Digit" + n, n, 1, n] as [string, string, number, string],
      ),
      ["Minus", "−", 1, "-"],
      ["Equal", "=", 1, "="],
      ["Backspace", "⌫", 2],
    ]);
    const letters = (codes: string[], ru: string) =>
      codes.map(
        (c, i) =>
          ["Key" + c, ru[i].toUpperCase(), 1, ru[i]] as [
            string,
            string,
            number,
            string,
          ],
      );
    row(2.35, [
      ["Tab", "Tab", 1.5],
      ...letters(
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        "йцукенгшщз",
      ),
      ["BracketLeft", "Х", 1, "х"],
      ["BracketRight", "Ъ", 1, "ъ"],
      ["Backslash", "\\", 1.5, "\\"],
    ]);
    row(3.35, [
      ["CapsLock", "Caps", 1.8],
      ...letters(["A", "S", "D", "F", "G", "H", "J", "K", "L"], "фывапролд"),
      ["Semicolon", "Ж", 1, "ж"],
      ["Quote", "Э", 1, "э"],
      ["Enter", "Enter ↵", 2.2],
    ]);
    row(4.35, [
      ["ShiftLeft", "Shift", 2.3],
      ...letters(["Z", "X", "C", "V", "B", "N", "M"], "ячсмить"),
      ["Comma", "Б", 1, "б"],
      ["Period", "Ю", 1, "ю"],
      ["Slash", ".", 1, "."],
      ["ShiftRight", "Shift", 2.7],
    ]);
    row(5.35, [
      ["ControlLeft", "Ctrl", 1.3],
      ["MetaLeft", "Win", 1.2],
      ["AltLeft", "Alt", 1.3],
      ["Space", "", 6.2, " "],
      ["AltRight", "Alt", 1.3],
      ["MetaRight", "Win", 1.2],
      ["ContextMenu", "☰", 1.2],
      ["ControlRight", "Ctrl", 1.3],
    ]);
    [
      ["Insert", "Ins"],
      ["Home", "Home"],
      ["PageUp", "PgUp"],
      ["Delete", "Del"],
      ["End", "End"],
      ["PageDown", "PgDn"],
    ].forEach(([c, l], i) =>
      key(c, l, 15.7 + (i % 3), 1.35 + Math.floor(i / 3)),
    );
    key("ArrowUp", "↑", 16.7, 4.35);
    key("ArrowLeft", "←", 15.7, 5.35);
    key("ArrowDown", "↓", 16.7, 5.35);
    key("ArrowRight", "→", 17.7, 5.35);
    [
      ["NumLock", "Num"],
      ["NumpadDivide", "/"],
      ["NumpadMultiply", "*"],
      ["NumpadSubtract", "−"],
    ].forEach(([c, l], i) => key(c, l, 19.5 + i, 1.35));
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        const n = String(7 - r * 3 + c);
        key("Numpad" + n, n, 19.5 + c, 2.35 + r, 1, n);
      }
    key("NumpadAdd", "+", 22.5, 2.35);
    key("NumpadEnter", "↵", 22.5, 4.35);
    key("Numpad0", "0", 19.5, 5.35, 2, "0");
    key("NumpadDecimal", ".", 21.5, 5.35, 1, ".");
  }
  paint() {
    for (const [code, k] of this.keys) {
      const down = this.pressed.has(code),
        next = !!this.target && k.char === this.target;
      k.body
        .setY(k.y + (down ? 3 : 0))
        .setTint(down ? 0xffd480 : next ? 0xffe7a8 : 0xffffff);
      k.label
        .setY(k.y + (down ? 3 : 0))
        .setColor(down ? "#fff6db" : next ? "#ffe1a0" : "#f4e8d0");
    }
  }
  down(code: string) {
    this.pressed.add(code);
    this.paint();
  }
  up(code: string) {
    this.pressed.delete(code);
    this.paint();
  }
  highlight(char: string) {
    this.target = char;
    this.paint();
  }
  release() {
    this.pressed.clear();
    this.paint();
  }
}
