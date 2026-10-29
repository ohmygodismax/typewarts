import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { lessons } from "../content/lessons";
import { parseProgress } from "../domain/progress";
import { battleWord, newBattle, reduceBattle, turnDuration } from '../domain/battle';
import { corridorStory, epilogueStory, story } from '../content/story';

const oldSave = { xp: 500, unlocked: 4, completed: [0, 1, 2, 3, 4], best: 28, intro: true };

test('old completed saves unlock the corridor without losing progress', () => {
  const p = parseProgress(JSON.stringify(oldSave));
  assert.equal(p.unlocked, 1);
  assert.equal(p.corridorIntro, false);
  assert.equal(p.xp, oldSave.xp);
  assert.equal(p.best, oldSave.best);
  assert.deepEqual(p.completed, [0]);
  const unfinished = parseProgress(JSON.stringify({ ...oldSave, completed: [0, 1, 2, 3] }));
  assert.equal(unfinished.unlocked, 1);
});

test('new chapter progress and viewed story survive saving and loading', () => {
  const p = { ...oldSave, campaignVersion: 2, unlocked: 1, completed: [0, 1], corridorIntro: true };
  assert.deepEqual(parseProgress(JSON.stringify(p)), p);
  assert.equal(parseProgress(JSON.stringify({ ...p, corridorIntro: 'yes' })).unlocked, 0);
  assert.equal(parseProgress(JSON.stringify({ ...p, unlocked: 2 })).unlocked, 0);
});

test('corridor formulas require spaces and tighter timing than the ghost fight', () => {
  assert.equal(lessons.length, 2);
  assert.equal(lessons[1].tasks.length, 6);
  for (const word of lessons[1].tasks) {
    assert.match(word, /^[А-Яа-яёЁ]+(?: [А-Яа-яёЁ]+)+$/);
    assert.ok(turnDuration(1, word) < turnDuration(0, word));
  }
  const average = (n: number) => lessons[n].tasks.reduce((sum, word) => sum + word.length, 0) / lessons[n].tasks.length;
  assert.ok(average(1) > average(0));
});

test('guardian falls after three clean attacks without requiring every formula', () => {
  let s = reduceBattle(newBattle(1), { type: 'start' });
  let turns = 0;
  while (!s.result && turns < 20) {
    assert.equal(s.phase, turns % 2 ? 'defend' : 'attack');
    for (const key of battleWord(s)) s = reduceBattle(s, { type: 'key', key });
    if (s.pendingDamage) s = reduceBattle(s, { type: 'impact', damage: s.pendingDamage });
    turns++;
  }
  assert.equal(s.result, 'win');
  assert.equal(s.cast, 3);
  assert.equal(turns, 5);
  assert.equal(s.hp, 100);
  assert.equal(s.enemyHp, 0);
});

test('guardian deals 25 damage per failed defence, while old enemies still deal 20', () => {
  for (const lesson of [0, 1]) {
    let s = reduceBattle(newBattle(lesson), { type: 'start' });
    const expire = () => {
      const ticks = s.remaining;
      for (let i = 0; i < ticks; i++) s = reduceBattle(s, { type: 'tick' });
    };
    expire();
    assert.equal(s.hp, 100);
    expire();
    assert.equal(s.hp, lesson === 1 ? 75 : 80);
    if (lesson === 1) {
      for (let hit = 1; hit < 4; hit++) { expire(); expire(); }
      assert.equal(s.result, 'lose');
      assert.equal(s.hp, 0);
      assert.equal(reduceBattle(s, { type: 'reset', lesson: 1 }).hp, 100);
    }
  }
});

test('new story remains separate from the prologue and all scene assets exist', () => {
  assert.equal(story.at(-1)?.id, 'challenge');
  assert.equal(corridorStory.length, 8);
  assert.equal(new Set(corridorStory.map(p => p.id)).size, corridorStory.length);
  for (const panel of [...corridorStory, ...epilogueStory]) {
    assert.ok(existsSync(new URL('../../public/assets/' + panel.image, import.meta.url)), panel.image);
  }
  for (const asset of ['armour-guardian.png', 'corridor-battle.png']) {
    assert.ok(existsSync(new URL('../../public/assets/' + asset, import.meta.url)), asset);
  }
});


test('migration distinguishes legacy lesson one from the new guardian level', () => {
  const legacy = { ...oldSave, unlocked: 1, completed: [0] };
  const p = parseProgress(JSON.stringify(legacy));
  assert.equal(p.campaignVersion, 2);
  assert.equal(p.unlocked, 1);
  assert.deepEqual(p.completed, [0]);
  assert.deepEqual(parseProgress(JSON.stringify(p)), p);
  const finished = parseProgress(JSON.stringify({ ...oldSave, unlocked: 5, completed: [0,1,2,3,4,5], corridorIntro: true }));
  assert.deepEqual(finished.completed, [0, 1]);
  assert.equal(finished.corridorIntro, true);
  const fresh = parseProgress(JSON.stringify({ ...oldSave, unlocked: 0, completed: [] }));
  assert.equal(fresh.unlocked, 0);
  assert.deepEqual(fresh.completed, []);
});

test('imperfect attacks still finish the fight after cycling the shorter word list', () => {
  let s = reduceBattle(newBattle(1), { type: 'start' });
  let turns = 0;
  while (!s.result && turns < 30) {
    if (s.phase === 'attack') s = reduceBattle(s, { type: 'key', key: 'я' });
    for (const key of battleWord(s)) s = reduceBattle(s, { type: 'key', key });
    if (s.pendingDamage) s = reduceBattle(s, { type: 'impact', damage: s.pendingDamage });
    turns++;
  }
  assert.equal(s.result, 'win');
  assert.ok(turns > lessons[1].tasks.length);
});
