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
    name: "Первые чары",
    detail: "Домашний ряд · без спешки",
    keys: "фываолдж",
    tasks: [
      "ф",
      "а",
      "о",
      "л",
      "фыва",
      "олдж",
      "фала",
      "вода",
      "два",
      "жало",
      "фыва олдж",
      "вода",
    ],
    interval: 0,
  },
  {
    name: "Класс заклинаний",
    detail: "Новые буквы и первые слова",
    keys: "фываолджйцуке нгшщзхъячсмитьбюэё",
    tasks: [
      // New keys are introduced individually before combinations and spells.
      ...Array.from("йцукенгшщзхъячсмитьбюэёпр"),
      "ми",
      "су",
      "лю",
      "мос",
      "нок",
      "ак",
      "цио",
      "репа",
      "ро",
      ...spells.slice(0, 5),
    ],
    interval: 0,
  },
  {
    name: "Защита от тьмы",
    detail: "Точность под давлением",
    keys: "Все буквы",
    tasks: spells.slice(5, 12),
    interval: 10000,
  },
  {
    name: "Дуэль волшебников",
    detail: "Скорость и реакция",
    keys: "Все буквы",
    tasks: spells.slice(12, 18),
    interval: 7000,
  },
  {
    name: "Битва с дементором",
    detail: "Последняя дуэль в классе",
    keys: "Все буквы",
    tasks: [...spells.slice(16), ...spells.slice(16)],
    interval: 5500,
  },
  {
    name: "Страж коридора",
    detail: "Полные формулы · точность и пробелы",
    keys: "Все буквы и пробел",
    tasks: [
      "Экспеллиармус Редукто",
      "Протего Максима",
      "Петрификус Тоталус",
      "Фините Инкантатем",
      "Инсендио Диффиндо",
      "Протего Тоталум",
      "Левикорпус Иммобулюс",
      "Протего Максима Фините",
      "Редукто Экспеллиармус",
      "Фините Инкантатем Протего",
      "Петрификус Тоталус Экспеллиармус",
      "Протего Максима Фините Инкантатем",
    ],
    interval: 4500,
  },
];
export type Progress = {
  xp: number;
  unlocked: number;
  completed: number[];
  best: number;
  intro: boolean;
  corridorIntro?: boolean;
};
export const emptyProgress: Progress = {
  xp: 0,
  unlocked: 0,
  completed: [],
  best: 0,
  intro: false,
};
export function parseProgress(raw: string | null): Progress {
  try {
    const p = JSON.parse(raw || "null");
    if (
      !p ||
      !Number.isFinite(p.xp) ||
      p.xp < 0 ||
      !Number.isInteger(p.unlocked) ||
      p.unlocked < 0 ||
      p.unlocked >= lessons.length ||
      !Array.isArray(p.completed) ||
      !p.completed.every(
        (x: unknown) => Number.isInteger(x) && Number(x) >= 0 && Number(x) < lessons.length,
      ) ||
      !Number.isFinite(p.best) ||
      p.best < 0 ||
      typeof p.intro !== "boolean" ||
      (p.corridorIntro !== undefined && typeof p.corridorIntro !== "boolean")
    )
      return { ...emptyProgress };
    // Existing players who finished the old final lesson can enter the new chapter.
    return { ...p, unlocked: p.completed.includes(4) ? Math.max(p.unlocked, 5) : p.unlocked,
      corridorIntro: p.corridorIntro ?? false };
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
