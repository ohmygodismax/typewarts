import { lessons } from "./game";
export type Battle = {
  lesson: number;
  task: number;
  pos: number;
  hp: number;
  enemyHp: number;
  attempts: number;
  correct: number;
  combo: number;
  dirty: boolean;
  elapsed: number;
  active: boolean;
  paused: boolean;
  result: null | "win" | "lose";
  cast: number;
  wrong: number;
  attack: number;
  power: number;
  hint: string;
  attackClock: number;
  phase: "attack" | "defend";
  remaining: number;
  duration: number;
  blocked: number;
  turn: number;
  pendingDamage: number;
  triesLeft: number;
};
export type Action =
  | { type: "reset"; lesson: number }
  | { type: "start" }
  | { type: "pause" }
  | { type: "tick" }
  | { type: "key"; key: string }
  | { type: "impact"; damage: number };
// Shared by attack and defence: a short reading allowance plus typing time.
const turnTiming = [
  { minimum: 6, perCharacter: 0.9 },
  { minimum: 5, perCharacter: 0.55 },
];
export function turnDuration(lesson: number, word: string) {
  const timing = turnTiming[lesson];
  return Math.max(timing.minimum, Math.ceil(word.length * timing.perCharacter) + 2);
}
export function newBattle(lesson = 0): Battle {
  const duration = turnDuration(lesson, lessons[lesson].tasks[0]);
  return {
    lesson,
    task: 0,
    pos: 0,
    hp: 100,
    enemyHp: lessons[lesson].enemyHp,
    attempts: 0,
    correct: 0,
    combo: 0,
    dirty: false,
    elapsed: 0,
    active: false,
    paused: false,
    result: null,
    cast: 0,
    wrong: 0,
    attack: 0,
    power: 1,
    hint: lesson === 1 ? "Набирай заклинания целиком, включая пробелы. Удар стража отнимает 25 здоровья." : "Начни дуэль, когда будешь готов.",
    attackClock: 0,
    phase: "attack",
    remaining: duration,
    duration,
    blocked: 0,
    turn: 0,
    pendingDamage: 0,
    triesLeft: 3,
  };
}
export function battleWord(s: Battle) {
  const words = lessons[s.lesson].tasks;
  return words[s.task % words.length].toLowerCase();
}
function nextTurn(s: Battle) {
  s.phase = s.phase === "attack" ? "defend" : "attack";
  s.turn++;
  s.pos = 0;
  s.triesLeft = 3;
  s.dirty = false;
  s.duration = turnDuration(s.lesson, battleWord(s));
  s.remaining = s.duration;
  return s;
}
export function reduceBattle(s: Battle, a: Action): Battle {
  if (a.type === "reset") return newBattle(a.lesson);
  if (a.type === "impact") {
    const damage = Math.min(s.pendingDamage, a.damage);
    const n = {
      ...s,
      pendingDamage: Math.max(0, s.pendingDamage - damage),
      enemyHp: Math.max(0, s.enemyHp - damage),
    };
    if (n.enemyHp < 0.001) {
      n.result = "win";
      n.active = false;
    }
    return n;
  }
  if (a.type === "pause") return s.active ? { ...s, paused: true } : s;
  if (a.type === "start")
    return s.result
      ? s
      : {
          ...s,
          active: true,
          paused: false,
          hint:
            s.phase === "attack"
              ? "Атака: набери слово до конца отсчёта."
              : "Защита: набери слово до конца отсчёта.",
        };
  if (!s.active || s.paused || s.result) return s;
  if (a.type === "tick") {
    const n = {
      ...s,
      elapsed: s.elapsed + 1,
      remaining: Math.max(0, s.remaining - 1),
    };
    if (n.remaining === 0) {
      n.combo = 0;
      if (s.phase === "defend") {
        n.hp = Math.max(0, s.hp - (s.lesson === 1 ? 25 : 20));
        n.attack++;
        n.hint = "Заклинание попало в тебя. Теперь твоя атака!";
      } else n.hint = "Время атаки вышло. Приготовься защищаться.";
      if (n.hp === 0) {
        n.result = "lose";
        n.active = false;
        return n;
      }
      return nextTurn(n);
    }
    return n;
  }
  if (!/^[а-яё ]$/i.test(a.key))
    return { ...s, hint: "Переключи клавиатуру на русскую раскладку." };
  const n = { ...s, attempts: s.attempts + 1 };
  if (a.key.toLowerCase() !== battleWord(s)[s.pos]) {
    n.dirty = true;
    n.combo = 0;
    n.wrong++;
    n.hint = "Не та клавиша. Продолжай с подсвеченной буквы!";
    if (s.phase === "attack") {
      n.triesLeft--;
      if (n.triesLeft === 0) {
        n.hint = "Попытки закончились. Приготовься защищаться!";
        return nextTurn(n);
      }
    }
    return n;
  }
  n.correct++;
  n.pos++;
  if (n.pos < battleWord(s).length) return n;
  n.combo = s.dirty ? 0 : s.combo + 1;
  n.power = s.dirty ? 0.65 : n.combo > 0 && n.combo % 10 === 0 ? 1.8 : 1.25;
  n.task++;
  if (s.phase === "attack") {
    n.cast++;
    n.pendingDamage += 20 * n.power;
    n.hint =
      n.power > 1.5
        ? "Комбо! Заклинание усилено."
        : "Заклинание летит во врага! Теперь защита.";
  } else {
    n.blocked++;
    n.hint = "Щит разбил заклинание! Твоя очередь атаковать.";
  }
  if (n.enemyHp < 0.001) {
    n.enemyHp = 0;
    n.result = "win";
    n.active = false;
    n.pos = 0;
    return n;
  }
  return nextTurn(n);
}
