import { lessons } from "../content/lessons";

export type Progress = {
  campaignVersion: 2;
  xp: number;
  unlocked: number;
  completed: number[];
  best: number;
  intro: boolean;
  corridorIntro?: boolean;
  tutorialSeen?: boolean;
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
      (p.corridorIntro !== undefined && typeof p.corridorIntro !== "boolean") ||
      (p.tutorialSeen !== undefined && typeof p.tutorialSeen !== "boolean")
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
