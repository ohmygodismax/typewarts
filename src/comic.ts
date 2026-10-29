export type Point = { x: number; y: number };
export type SpeakerAnchors = { mouth: Point; head: Point };

export function dialogueTarget(anchors: SpeakerAnchors, kind: string): Point {
  return kind === "thought" ? anchors.head : anchors.mouth;
}

export type Box = Point & { width: number; height: number };

export function overlap(a: Box, b: Box) {
  return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
}

/** Find nearby space without covering faces, captions or other dialogue. */
export function placeBubble(target: Point, width: number, height: number,
  bounds: Box, obstacles: Box[], preferred: string): Box {
  const gap = 70;
  const candidates: Box[] = [];
  for (const side of [preferred, 'top-right', 'top-left', 'bottom-right', 'bottom-left']) {
    for (const distance of [gap, gap + 100, gap + 220]) {
      const right = side.endsWith('right'), bottom = side.startsWith('bottom');
      candidates.push({
        x: Math.max(bounds.x, Math.min(bounds.x + bounds.width - width,
          target.x + (right ? distance : -distance - width))),
        y: Math.max(bounds.y, Math.min(bounds.y + bounds.height - height,
          target.y + (bottom ? distance : -distance - height))),
        width, height,
      });
    }
  }
  const score = (b: Box) => obstacles.reduce((sum, o) => sum + overlap(b, o) * 10000, 0) +
    Math.hypot(b.x + width / 2 - target.x, b.y + height / 2 - target.y);
  return candidates.reduce((best, b) => score(b) < score(best) ? b : best);
}

/** Tail base lies on a straight edge, away from rounded corners. */
export function bubbleTail(box: Box, target: Point) {
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const dx = target.x - cx, dy = target.y - cy;
  const vertical = Math.abs(dy) / box.height > Math.abs(dx) / box.width;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const base = vertical
    ? { x: clamp(target.x, box.x + 32, box.x + box.width - 32), y: dy < 0 ? box.y : box.y + box.height }
    : { x: dx < 0 ? box.x : box.x + box.width, y: clamp(target.y, box.y + 24, box.y + box.height - 24) };
  const length = Math.hypot(target.x - base.x, target.y - base.y);
  const fraction = Math.max(0, 1 - 22 / Math.max(1, length));
  return {
    base,
    a: { x: base.x - (vertical ? 10 : 0), y: base.y - (vertical ? 0 : 10) },
    b: { x: base.x + (vertical ? 10 : 0), y: base.y + (vertical ? 0 : 10) },
    tip: { x: base.x + (target.x - base.x) * fraction, y: base.y + (target.y - base.y) * fraction },
  };
}
