import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { lessons, parseProgress } from './game';
import { battleWord, newBattle, reduceBattle, turnDuration } from './battle';
import { corridorStory, epilogueStory, story } from './story';

const oldSave = { xp: 500, unlocked: 4, completed: [0, 1, 2, 3, 4], best: 28, intro: true };

test('old completed saves unlock the corridor without losing progress', () => {
  const p = parseProgress(JSON.stringify(oldSave));
  assert.equal(p.unlocked, 5);
  assert.equal(p.corridorIntro, false);
  assert.equal(p.xp, oldSave.xp);
  assert.equal(p.best, oldSave.best);
  assert.deepEqual(p.completed, oldSave.completed);
  const unfinished = parseProgress(JSON.stringify({ ...oldSave, completed: [0, 1, 2, 3] }));
  assert.equal(unfinished.unlocked, 4);
});

test('new chapter progress and viewed story survive saving and loading', () => {
  const p = { ...oldSave, unlocked: 5, completed: [0, 1, 2, 3, 4, 5], corridorIntro: true };
  assert.deepEqual(parseProgress(JSON.stringify(p)), p);
  assert.equal(parseProgress(JSON.stringify({ ...p, corridorIntro: 'yes' })).unlocked, 0);
  assert.equal(parseProgress(JSON.stringify({ ...p, unlocked: 6 })).unlocked, 0);
});

test('corridor formulas require spaces and tighter timing than the fifth lesson', () => {
  assert.equal(lessons.length, 6);
  assert.equal(lessons[5].tasks.length, 12);
  for (const word of lessons[5].tasks) {
    assert.match(word, /^[А-Яа-яёЁ]+(?: [А-Яа-яёЁ]+)+$/);
    assert.ok(turnDuration(5, word) < turnDuration(4, word));
  }
  const average = (n: number) => lessons[n].tasks.reduce((sum, word) => sum + word.length, 0) / lessons[n].tasks.length;
  assert.ok(average(5) > average(4));
});

test('all twelve formulas complete the guardian fight with the usual attack-defence cycle', () => {
  let s = reduceBattle(newBattle(5), { type: 'start' });
  for (let task = 0; task < lessons[5].tasks.length; task++) {
    assert.equal(s.task, task);
    assert.equal(s.phase, task % 2 ? 'defend' : 'attack');
    for (const key of battleWord(s)) s = reduceBattle(s, { type: 'key', key });
    if (s.pendingDamage) s = reduceBattle(s, { type: 'impact', damage: s.pendingDamage });
    if (task < lessons[5].tasks.length - 1) assert.equal(s.result, null);
  }
  assert.equal(s.result, 'win');
  assert.equal(s.hp, 100);
  assert.equal(s.enemyHp, 0);
});

test('guardian deals 25 damage per failed defence, while old enemies still deal 20', () => {
  for (const lesson of [4, 5]) {
    let s = reduceBattle(newBattle(lesson), { type: 'start' });
    const expire = () => {
      const ticks = s.remaining;
      for (let i = 0; i < ticks; i++) s = reduceBattle(s, { type: 'tick' });
    };
    expire();
    assert.equal(s.hp, 100);
    expire();
    assert.equal(s.hp, lesson === 5 ? 75 : 80);
    if (lesson === 5) {
      for (let hit = 1; hit < 4; hit++) { expire(); expire(); }
      assert.equal(s.result, 'lose');
      assert.equal(s.hp, 0);
      assert.equal(reduceBattle(s, { type: 'reset', lesson: 5 }).hp, 100);
    }
  }
});

test('new story remains separate from the prologue and all scene assets exist', () => {
  assert.equal(story.at(-1)?.id, 'challenge');
  assert.equal(corridorStory.length, 8);
  assert.equal(new Set(corridorStory.map(p => p.id)).size, corridorStory.length);
  for (const panel of [...corridorStory, ...epilogueStory]) {
    assert.ok(existsSync(new URL('../public/assets/' + panel.image, import.meta.url)), panel.image);
  }
  for (const asset of ['armour-guardian.png', 'corridor-battle.png']) {
    assert.ok(existsSync(new URL('../public/assets/' + asset, import.meta.url)), asset);
  }
});
