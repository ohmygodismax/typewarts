import type { SpeakerAnchors } from "./comic";

export type Bubble = {
  text: string;
  speaker?: "hero" | "ghost" | "hat";
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
  // Mouth and crown positions measured in normalized source-image coordinates.
  anchors?: Partial<Record<"hero" | "ghost" | "hat", SpeakerAnchors>>;
  bubbles: Bubble[];
};
export const story: Panel[] = [
  {
    id: "coding",
    anchors: { hero: { mouth: { x: 0.446, y: 0.292 }, head: { x: 0.449, y: 0.085 } } },
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
        speaker: "hero",
        position: "top-right",
        text: "Навайбкожу игру про Гарри Поттера! Только вместо палочки — клавиатура.",
      },
      {
        kind: "speech",
        speaker: "hero",
        position: "bottom-left",
        text: "Ещё один промпт — и спать.",
      },
    ],
  },
  {
    id: "sleep",
    anchors: { hero: { mouth: { x: 0.454, y: 0.385 }, head: { x: 0.423, y: 0.174 } } },
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
        speaker: "hero",
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
    anchors: { hero: { mouth: { x: 0.476, y: 0.287 }, head: { x: 0.444, y: 0.158 } } },
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
        speaker: "hero",
        position: "top-right",
        text: "Хогвартс?! Я просил создать проект, а не переместить меня в него.",
      },
    ],
  },
  {
    id: "sorting",
    anchors: { hero: { mouth: { x: 0.459, y: 0.393 }, head: { x: 0.423, y: 0.32 } }, hat: { mouth: { x: 0.432, y: 0.252 }, head: { x: 0.402, y: 0.1 } } },
    title: "Распределение",
    image: "prologue-sorting-v2.png",
    alt: "Программист во время распределения в факультет.",
    bubbles: [
      {
        kind: "caption",
        position: "top-left",
        text: "Профессор надел ему на голову старую шляпу.",
      },
      { kind: "shout", speaker: "hat", position: "top-right", text: "ГРИФФИНДОР!" },
      {
        kind: "speech",
        speaker: "hero",
        position: "bottom-left",
        text: "Отлично. Даже во сне распределили без собеседования.",
      },
    ],
  },
  {
    id: "decline",
    anchors: { hero: { mouth: { x: 0.334, y: 0.258 }, head: { x: 0.315, y: 0.115 } } },
    title: "Спасибо, я отказываюсь",
    image: "decline.png",
    alt: "Программист отказывается от поступления.",
    bubbles: [
      {
        kind: "speech",
        speaker: "hero",
        position: "top-right",
        text: "Спасибо, но я отказываюсь от поступления. Я читал книги. Мне это не интересно.",
      },
      {
        kind: "speech",
        speaker: "hero",
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
    anchors: { hero: { mouth: { x: 0.398, y: 0.201 }, head: { x: 0.378, y: 0.12 } }, ghost: { mouth: { x: 0.594, y: 0.158 }, head: { x: 0.603, y: 0.092 } } },
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
        speaker: "ghost",
        position: "top-right",
        text: "Уйти можно. Но сначала — вступительное испытание.",
      },
      {
        kind: "speech",
        speaker: "hero",
        position: "bottom-left",
        text: "Ну конечно. Кнопку «Отказаться» нарисовали, а обработчик не написали.",
      },
    ],
  },
  {
    id: "trouble",
    anchors: { hero: { mouth: { x: 0.398, y: 0.201 }, head: { x: 0.378, y: 0.12 } }, ghost: { mouth: { x: 0.594, y: 0.158 }, head: { x: 0.603, y: 0.092 } } },
    title: "Без горячих клавиш",
    image: "prologue-refusal.png",
    alt: "Программист смотрит на призрака у закрытых дверей.",
    bubbles: [
      {
        kind: "speech",
        speaker: "hero",
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
        speaker: "hero",
        position: "bottom-left",
        text: "Ладно. Кажется, без горячих клавиш отсюда не выйти.",
      },
    ],
  },
  {
    id: "keyboard",
    anchors: { hero: { mouth: { x: 0.358, y: 0.303 }, head: { x: 0.331, y: 0.154 } }, ghost: { mouth: { x: 0.594, y: 0.158 }, head: { x: 0.603, y: 0.092 } } },
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
        speaker: "hero",
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
      { kind: "speech",
        speaker: "ghost", position: "top-right", text: "Ну? Доставай палочку." },
      {
        kind: "speech",
        speaker: "hero",
        position: "bottom-left",
        text: "У меня своя периферия.",
      },
    ],
  },
];
