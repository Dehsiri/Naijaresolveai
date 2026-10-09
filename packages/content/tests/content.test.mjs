import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent, validateContent } from '../src/loader.ts';

test('1. loadContent loads all game data sets without errors', () => {
  const content = loadContent();
  assert.ok(content.locations.length >= 4, 'Should have at least 4 locations');
  assert.ok(content.actions.length >= 5, 'Should have at least 5 actions');
  assert.ok(content.items.length >= 4, 'Should have at least 4 items');
  assert.ok(content.npcs.length >= 2, 'Should have at least 2 NPCs');
  assert.ok(content.missions.length >= 6, 'Should have all 6 Chapter 1 missions');
  assert.ok(content.events.length >= 8, 'Should have at least 8 random events');
});

test('2. validateContent flags duplicate IDs', () => {
  const bundle = {
    locations: [
      { id: 'loc1', name: 'L1', blurb: 'B1', art: 'a1', reviewStatus: 'draft' },
      { id: 'loc1', name: 'L1 Dup', blurb: 'B2', art: 'a2', reviewStatus: 'draft' }
    ],
    actions: [],
    items: [],
    npcs: [],
    missions: [],
    events: []
  };
  const res = validateContent(bundle);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('Duplicate location id: loc1')));
});

test('3. validateContent flags invalid action location references', () => {
  const bundle = {
    locations: [{ id: 'loc1', name: 'L1', blurb: 'B1', art: 'a1', reviewStatus: 'draft' }],
    actions: [
      {
        id: 'act1',
        label: 'Act 1',
        location: 'unknown_place',
        slots: 1,
        energy: 10,
        money: [100, 200],
        successLine: 's',
        failLine: 'f',
        reviewStatus: 'draft'
      }
    ],
    items: [],
    npcs: [],
    missions: [],
    events: []
  };
  const res = validateContent(bundle);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('references unknown location: unknown_place')));
});

test('4. validateContent flags inverted money ranges', () => {
  const bundle = {
    locations: [{ id: 'loc1', name: 'L1', blurb: 'B1', art: 'a1', reviewStatus: 'draft' }],
    actions: [
      {
        id: 'act1',
        label: 'Act 1',
        location: 'loc1',
        slots: 1,
        energy: 10,
        money: [500, 100],
        successLine: 's',
        failLine: 'f',
        reviewStatus: 'draft'
      }
    ],
    items: [],
    npcs: [],
    missions: [],
    events: []
  };
  const res = validateContent(bundle);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('invalid money range [500, 100]')));
});

test('5. draft string count is reported correctly', () => {
  const content = loadContent();
  const res = validateContent(content);
  assert.equal(res.valid, true);
  assert.ok(res.draftCount > 0);
});
