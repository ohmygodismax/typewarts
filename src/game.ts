export const spells = [
  "Люмос",
  "Нокс",
  "Акцио",
  "Репаро",
  "Алохомора",
  "Протего",
  "Редукто",
  "Инсендио",
  "Диффиндо",
  "Силенцио",
  "Релашио",
  "Конфундо",
  "Экспеллиармус",
  "Левикорпус",
  "Иммобулюс",
  "Риддикулус",
  "Петрификус Тоталус",
  "Вингардиум Левиоса",
  "Экспекто Патронум",
  "Фините Инкантатем",
];
export const lessons = [
  {
    name: "Дуэль с призраком",
    detail: "Короткие заклинания",
    keys: "Все буквы",
    enemyHp: 40,
    tasks: ["Люмос", "Протего", "Редукто", "Протего", "Экспеллиармус", "Фините"],
  },
  {
    name: "Страж коридора",
    detail: "Длинные заклинания · точность и пробелы",
    keys: "Все буквы и пробел",
    enemyHp: 60,
    tasks: [
      "Экспеллиармус Редукто",
      "Протего Максима",
      "Петрификус Тоталус",
      "Фините Инкантатем",
      "Инсендио Диффиндо",
      "Протего Тоталум",
    ],
  },
];
export type Progress = {
  campaignVersion: 2;
  xp: number;
  unlocked: number;
  completed: number[];
  best: number;
  intro: boolean;
  corridorIntro?: boolean;
};
export const emptyProgress: Progress = {
  campaignVersion: 2,
  xp: 0,
  unlocked: 0,
  completed: [],
  best: 0,
  intro: false,
};
export function parseProgress(raw: string | null): Progress {
  try {
    const p = JSON.parse(raw || "null");
    const legacy = p?.campaignVersion === undefined;
    const levelCount = legacy ? 6 : lessons.length;
    if (
      !p ||
      (!legacy && p.campaignVersion !== 2) ||
      !Number.isFinite(p.xp) ||
      p.xp < 0 ||
      !Number.isInteger(p.unlocked) ||
      p.unlocked < 0 ||
      p.unlocked >= levelCount ||
      !Array.isArray(p.completed) ||
      !p.completed.every(
        (x: unknown) => Number.isInteger(x) && Number(x) >= 0 && Number(x) < levelCount,
      ) ||
      !Number.isFinite(p.best) ||
      p.best < 0 ||
      typeof p.intro !== "boolean" ||
      (p.corridorIntro !== undefined && typeof p.corridorIntro !== "boolean")
    )
      return { ...emptyProgress };
    if (legacy) {
      const ghostDone = p.unlocked > 0 || p.completed.length > 0;
      const guardianDone = p.completed.includes(5);
      return { ...p, campaignVersion: 2, unlocked: ghostDone ? 1 : 0,
        completed: guardianDone ? [0, 1] : ghostDone ? [0] : [],
        corridorIntro: p.corridorIntro ?? false };
    }
    return { ...p, corridorIntro: p.corridorIntro ?? false };
  } catch {
    return { ...emptyProgress };
  }
}
export const accuracy = (correct: number, attempts: number) =>
  attempts ? Math.round((correct / attempts) * 100) : 100;
export function finger(key: string) {
  const groups = [
    ["йфя", "левый мизинец"],
    ["цыч", "левый безымянный"],
    ["увс", "левый средний"],
    ["камипе", "левый указательный"],
    ["нртгоь", "правый указательный"],
    ["шлб", "правый средний"],
    ["щдю", "правый безымянный"],
    ["зжэхъё", "правый мизинец"],
    [" ", "большой палец"],
  ];
  return (
    groups.find(([keys]) => keys.includes(key.toLowerCase()))?.[1] ||
    "указательный палец"
  );
}
