import test from 'node:test';
import assert from 'node:assert/strict';
import { placeBubble, bubbleTail, overlap } from './comic';

test('dialogue stays inside the frame and avoids faces and captions', () => {
  for (const [width, height] of [[1600, 900], [2100, 900], [1600, 1200]]) {
    const bounds = { x: 64, y: 64, width: width - 128, height: height - 174 };
    const target = { x: width * 0.45, y: height * 0.3 };
    const obstacles = [
      { x: target.x - 65, y: target.y - 65, width: 130, height: 130 },
      { x: 64, y: 64, width: 370, height: 120 },
    ];
    for (const preference of ['top-right', 'bottom-left']) {
      const box = placeBubble(target, 370, 120, bounds, obstacles, preference);
      assert.ok(box.x >= bounds.x && box.y >= bounds.y);
      assert.ok(box.x + box.width <= bounds.x + bounds.width);
      assert.ok(box.y + box.height <= bounds.y + bounds.height);
      assert.ok(obstacles.every(o => overlap(box, o) === 0));
      obstacles.push(box);
    }
  }
});

test('tails point to speakers on all four sides and stop before the face', () => {
  const box = { x: 300, y: 300, width: 370, height: 120 };
  for (const target of [{x:485,y:150}, {x:485,y:600}, {x:100,y:360}, {x:850,y:360}]) {
    const { base, tip } = bubbleTail(box, target);
    assert.ok(base.x === box.x || base.x === box.x + box.width ||
      base.y === box.y || base.y === box.y + box.height);
    assert.ok(Math.abs(Math.hypot(target.x - tip.x, target.y - tip.y) - 22) < 0.001);
  }
});

test('speech and thoughts use separate anatomical anchors', async () => {
  const { dialogueTarget } = await import('./comic');
  const { story } = await import('./story');
  for (const panel of story) {
    if (panel.hero || panel.ghost) continue;
    for (const bubble of panel.bubbles) {
      if (bubble.kind === 'caption') continue;
      assert.ok(bubble.speaker, panel.id);
      const anchors = panel.anchors?.[bubble.speaker];
      assert.ok(anchors, `${panel.id}: ${bubble.speaker}`);
      assert.notDeepEqual(anchors.mouth, anchors.head);
      for (const point of [anchors.mouth, anchors.head]) {
        assert.ok(point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1);
      }
      assert.deepEqual(dialogueTarget(anchors, 'speech'), anchors.mouth);
      assert.deepEqual(dialogueTarget(anchors, 'shout'), anchors.mouth);
      assert.deepEqual(dialogueTarget(anchors, 'thought'), anchors.head);
    }
  }
});
