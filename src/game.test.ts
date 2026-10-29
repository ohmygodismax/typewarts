import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProgress, accuracy, finger, lessons, spells } from "./game";
test("corrupt saves recover safely", () => {
  for (const input of [null, "broken", "{}", '{"xp":0,"unlocked":99}'])
    assert.equal(parseProgress(input).unlocked, 0);
});
test("accuracy includes wrong attempts", () => {
  assert.equal(accuracy(9, 10), 90);
  assert.equal(accuracy(0, 0), 100);
});
test("Russian finger hints", () => {
  assert.equal(finger("м"), "левый указательный");
  assert.equal(finger("о"), "правый указательный");
  assert.equal(finger(" "), "большой палец");
});
test("curriculum has 20 spells and introductory home row", () => {
  assert.equal(new Set(spells).size, 20);
  for (const word of lessons[0].tasks) assert.match(word, /^[фываолдж ]+$/);
  assert.equal(lessons[0].interval, 0);
  assert.ok(lessons[4].interval < lessons[3].interval);
});

import { newBattle, reduceBattle, battleWord, turnDuration } from "./battle";
const enter = (s: ReturnType<typeof newBattle>, text: string) =>
  [...text].reduce((state, key) => {
    const n = reduceBattle(state, { type: "key", key });
    return n.pendingDamage
      ? reduceBattle(n, { type: "impact", damage: n.pendingDamage })
      : n;
  }, s);
test("complete lesson unlocks a win only after all exercises", () => {
  let s = reduceBattle(newBattle(), { type: "start" });
  for (const word of lessons[0].tasks) s = enter(s, word);
  assert.equal(s.result, "win");
  assert.equal(s.enemyHp, 0);
  assert.equal(s.active, false);
});
test("errors weaken damage and reset combo without advancing", () => {
  const initial = reduceBattle(newBattle(), { type: "start" });
  const clean = enter(initial, "ф");
  const wrong = enter(initial, "я");
  assert.equal(wrong.pos, 0);
  assert.equal(wrong.combo, 0);
  const corrected = enter(wrong, "ф");
  assert.ok(corrected.enemyHp > clean.enemyHp);
  assert.equal(corrected.power, 0.65);
  assert.equal(corrected.attempts, 2);
});
test("pause freezes attacks, typing and elapsed time", () => {
  let s = reduceBattle(newBattle(2), { type: "start" });
  const ticksBeforePause = s.duration - 2;
  for (let i = 0; i < ticksBeforePause; i++) s = reduceBattle(s, { type: "tick" });
  s = reduceBattle(s, { type: "pause" });
  assert.deepEqual(reduceBattle(s, { type: "tick" }), s);
  assert.deepEqual(enter(s, "п"), s);
  s = reduceBattle(s, { type: "start" });
  s = reduceBattle(s, { type: "tick" });
  assert.equal(s.hp, 100);
  assert.equal(s.remaining, 1);
});
test("enemy attacks end duel and reset clears result", () => {
  let s = reduceBattle(newBattle(4), { type: "start" });
  for (let i = 0; i < 1000; i++) s = reduceBattle(s, { type: "tick" });
  assert.equal(s.result, "lose");
  assert.equal(s.hp, 0);
  assert.equal(reduceBattle(s, { type: "reset", lesson: 4 }).result, null);
});
test("ten clean exercises activate stronger magic", () => {
  let s = reduceBattle(newBattle(), { type: "start" });
  for (let i = 0; i < 10; i++) s = enter(s, battleWord(s));
  assert.equal(s.combo, 10);
  assert.equal(s.power, 1.8);
});

test("attack and defence alternate; successful defence prevents damage", () => {
  let s = reduceBattle(newBattle(), { type: "start" });
  s = enter(s, battleWord(s));
  assert.equal(s.phase, "defend");
  const hp = s.hp;
  s = enter(s, battleWord(s));
  assert.equal(s.phase, "attack");
  assert.equal(s.hp, hp);
  assert.equal(s.blocked, 1);
});
test("missed defence deals damage but timed-out attack does not", () => {
  let s = reduceBattle(newBattle(), { type: "start" });
  const duration = s.duration;
  for (let i = 0; i < duration; i++) s = reduceBattle(s, { type: "tick" });
  assert.equal(s.phase, "defend");
  assert.equal(s.hp, 100);
  const defend = s.duration;
  for (let i = 0; i < defend; i++) s = reduceBattle(s, { type: "tick" });
  assert.equal(s.hp, 80);
  assert.equal(s.phase, "attack");
  assert.equal(s.task, 0);
});

test("attack damage is applied on projectile impact", () => {
  let s = reduceBattle(newBattle(), { type: "start" });
  s = reduceBattle(s, { type: "key", key: "ф" });
  assert.equal(s.enemyHp, 100);
  assert.ok(s.pendingDamage > 0);
  s = reduceBattle(s, { type: "impact", damage: s.pendingDamage });
  assert.ok(s.enemyHp < 100);
  assert.equal(s.pendingDamage, 0);
});

test("three attack mistakes pass turn to defence without dealing damage", () => {
  let s = reduceBattle(newBattle(), { type: "start" });
  s = enter(s, "я");
  assert.equal(s.triesLeft, 2);
  assert.equal(s.phase, "attack");
  s = enter(s, "яя");
  assert.equal(s.phase, "defend");
  assert.equal(s.enemyHp, 100);
  assert.equal(s.hp, 100);
  assert.equal(s.task, 0);
  s = enter(s, battleWord(s));
  assert.equal(s.phase, "attack");
  assert.equal(s.triesLeft, 3);
});

test("wrong keyboard layout does not consume an attack try", () => {
  const s = reduceBattle(newBattle(), { type: "start" });
  assert.equal(enter(s, "q").triesLeft, 3);
});


test("turn limits are shorter, scale with word length and tighten by lesson", () => {
  assert.equal(turnDuration(0, "ф"), 6);
  assert.equal(turnDuration(1, "люмос"), 7);
  assert.equal(turnDuration(2, "протего"), 8);
  assert.equal(turnDuration(4, "петрификус тоталус"), 12);
  for (let lesson = 0; lesson < lessons.length; lesson++) {
    assert.ok(turnDuration(lesson, "петрификус тоталус") > turnDuration(lesson, "люмос"));
    if (lesson > 0) assert.ok(turnDuration(lesson, "петрификус тоталус") <=
      turnDuration(lesson - 1, "петрификус тоталус"));
    let s = reduceBattle(newBattle(lesson), { type: "start" });
    const initialDuration = s.duration;
    for (let i = 0; i < initialDuration; i++) s = reduceBattle(s, { type: "tick" });
    assert.equal(s.phase, "defend");
    assert.equal(s.duration, initialDuration);
    assert.equal(s.remaining, initialDuration);
  }
});
