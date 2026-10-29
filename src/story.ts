export type Bubble = {
  text: string;
  kind: "caption" | "speech" | "thought" | "shout";
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};
export type Panel = {
  id: string;
  title: string;
  image: string;
  alt: string;
  hero?: boolean;
  ghost?: boolean;
  crop?: string;
  bubbles: Bubble[];
};
export const story: Panel[] = [
  {
    id: "coding",
    title: "Ещё один проект",
    image: "prologue-coding.png",
    alt: "Уставший программист с открытыми глазами печатает за компьютером; на мониторе код и прототип магической игры.",
    bubbles: [
      {
        kind: "caption",
        position: "top-left",
        text: "Поздняя ночь. Кофе закончился. Идеи — нет.",
      },
      {
        kind: "thought",
        position: "top-right",
        text: "Навайбкожу игру про Гарри Поттера! Только вместо палочки — клавиатура.",
      },
      {
        kind: "speech",
        position: "bottom-left",
        text: "Ещё один промпт — и спать.",
      },
    ],
  },
  {
    id: "sleep",
    title: "Пять минут",
    image: "prologue-office.png",
    alt: "Тот же программист уснул на столе рядом с клавиатурой.",
    bubbles: [
      {
        kind: "caption",
        position: "top-left",
        text: "Первый экран почти готов. Программист — уже нет.",
      },
      {
        kind: "thought",
        position: "top-right",
        text: "Только закрою глаза… На пять минут.",
      },
      {
        kind: "caption",
        position: "bottom-left",
        text: "У Хогвартса оказались другие планы.",
      },
    ],
  },
  {
    id: "arrival",
    title: "Это точно не офис",
    image: "arrival.png",
    alt: "Магический зал Хогвартса и растерянный программист.",
    bubbles: [
      {
        kind: "caption",
        position: "top-left",
        text: "Он очнулся на деревянном табурете. Над головой плыли свечи.",
      },
      {
        kind: "speech",
        position: "top-right",
        text: "Хогвартс?! Я просил создать проект, а не переместить меня в него.",
      },
    ],
  },
  {
    id: "sorting",
    title: "Распределение",
    image: "prologue-sorting-v2.png",
    alt: "Программист во время распределения в факультет.",
    bubbles: [
      {
        kind: "caption",
        position: "top-left",
        text: "Профессор надел ему на голову старую шляпу.",
      },
      { kind: "shout", position: "top-right", text: "ГРИФФИНДОР!" },
      {
        kind: "speech",
        position: "bottom-left",
        text: "Отлично. Даже во сне распределили без собеседования.",
      },
    ],
  },
  {
    id: "decline",
    title: "Спасибо, я отказываюсь",
    image: "decline.png",
    alt: "Программист отказывается от поступления.",
    bubbles: [
      {
        kind: "speech",
        position: "top-right",
        text: "Спасибо, но я отказываюсь от поступления. Я читал книги. Мне это не интересно.",
      },
      {
        kind: "speech",
        position: "bottom-left",
        text: "Особенно ваша техника безопасности.",
      },
      {
        kind: "caption",
        position: "top-left",
        text: "Он снял шляпу и направился к выходу.",
      },
    ],
  },
  {
    id: "refusal",
    title: "Отказ не принят",
    image: "prologue-refusal.png",
    alt: "Двери захлопнулись. Призрак перекрыл выход. Клавиатура осталась на табурете.",
    bubbles: [
      {
        kind: "caption",
        position: "top-left",
        text: "Аплодисменты стихли. Двери захлопнулись.",
      },
      {
        kind: "speech",
        position: "top-right",
        text: "Уйти можно. Но сначала — вступительное испытание.",
      },
      {
        kind: "speech",
        position: "bottom-left",
        text: "Ну конечно. Кнопку «Отказаться» нарисовали, а обработчик не написали.",
      },
    ],
  },
  {
    id: "trouble",
    title: "Без горячих клавиш",
    image: "prologue-refusal.png",
    alt: "Программист смотрит на призрака у закрытых дверей.",
    bubbles: [
      {
        kind: "speech",
        position: "top-left",
        text: "Я же отказался от вступления.",
      },
      {
        kind: "caption",
        position: "top-right",
        text: "Призрак лишь улыбнулся. Свечи начали гаснуть.",
      },
      {
        kind: "thought",
        position: "bottom-left",
        text: "Ладно. Кажется, без горячих клавиш отсюда не выйти.",
      },
    ],
  },
  {
    id: "keyboard",
    title: "Своя периферия",
    image: "keyboard-story.png",
    alt: "Программист держит клавиатуру обеими руками.",
    bubbles: [
      {
        kind: "caption",
        position: "top-left",
        text: "Он вернулся к табурету и поднял клавиатуру. Между клавишами пробежала золотая искра.",
      },
      {
        kind: "speech",
        position: "top-right",
        text: "О. А вот ты молодец. Не бросила.",
      },
    ],
  },
  {
    id: "challenge",
    title: "Первые чары",
    image: "classroom.png",
    hero: true,
    ghost: true,
    alt: "Программист с клавиатурой готовится к дуэли с призраком.",
    bubbles: [
      { kind: "speech", position: "top-right", text: "Ну? Доставай палочку." },
      {
        kind: "speech",
        position: "bottom-left",
        text: "У меня своя периферия.",
      },
    ],
  },
];
