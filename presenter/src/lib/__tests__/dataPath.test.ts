import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAtPath, setAtPath, pushAtPath, removeAtPath, pathExistsInShape } from '../dataPath';

test('getAtPath reads nested object and array paths', () => {
  const data = { title: 'Hi', rows: [{ subject: 'Math' }, { subject: 'Art' }] };
  assert.equal(getAtPath(data, 'title'), 'Hi');
  assert.equal(getAtPath(data, 'rows.0.subject'), 'Math');
  assert.equal(getAtPath(data, 'rows.1.subject'), 'Art');
});

test('getAtPath returns undefined for missing or out-of-range paths', () => {
  const data = { rows: [{ subject: 'Math' }] };
  assert.equal(getAtPath(data, 'nope'), undefined);
  assert.equal(getAtPath(data, 'rows.5.subject'), undefined);
  assert.equal(getAtPath(data, 'rows.0.subject.tooDeep'), undefined);
  assert.equal(getAtPath(null, 'anything'), undefined);
});

test('setAtPath replaces a nested value without mutating the original', () => {
  const data = { title: 'Old', rows: [{ subject: 'Math' }] };
  const next = setAtPath(data, 'title', 'New');
  assert.equal(next.title, 'New');
  assert.equal(data.title, 'Old', 'original object must not be mutated');
});

test('setAtPath replaces a value inside an array by index', () => {
  const data = { rows: [{ subject: 'Math' }, { subject: 'Art' }] };
  const next = setAtPath(data, 'rows.1.subject', 'Music');
  assert.equal(next.rows[1].subject, 'Music');
  assert.equal(next.rows[0].subject, 'Math');
  assert.equal(data.rows[1].subject, 'Art', 'original array must not be mutated');
});

test('pushAtPath appends to an existing list', () => {
  const data = { tips: ['a', 'b'] };
  const next = pushAtPath(data, 'tips', 'c');
  assert.deepEqual(next.tips, ['a', 'b', 'c']);
  assert.deepEqual(data.tips, ['a', 'b'], 'original array must not be mutated');
});

test('pushAtPath creates a list when the field does not exist yet', () => {
  const data = {};
  const next = pushAtPath(data, 'tips', 'first');
  assert.deepEqual(next.tips, ['first']);
});

test('removeAtPath removes by index and leaves other items untouched', () => {
  const data = { tips: ['a', 'b', 'c'] };
  const next = removeAtPath(data, 'tips', 1);
  assert.deepEqual(next.tips, ['a', 'c']);
});

test('removeAtPath is a no-op when the field is not an array', () => {
  const data = { title: 'Hi' };
  const next = removeAtPath(data, 'title', 0);
  assert.equal(next, data);
});

test('pathExistsInShape accepts object keys present in the shape', () => {
  const shape = { title: '', rows: [{ subject: '' }] };
  assert.equal(pathExistsInShape(shape, 'title'), true);
  assert.equal(pathExistsInShape(shape, 'rows.0.subject'), true);
});

test('pathExistsInShape rejects fields that do not exist on the shape', () => {
  const shape = { title: '', imageUrl: '' };
  assert.equal(pathExistsInShape(shape, 'subtitle'), false);
  assert.equal(pathExistsInShape(shape, 'title.nested'), false);
});

test('pathExistsInShape rejects array indices when the shape array is empty', () => {
  const shape = { rows: [] as unknown[] };
  assert.equal(pathExistsInShape(shape, 'rows.0.subject'), false);
});

test('pathExistsInShape accepts any index for a non-empty shape array (variable-length lists)', () => {
  const shape = { rows: [{ subject: '' }] };
  assert.equal(pathExistsInShape(shape, 'rows.4.subject'), true);
});

test('pathExistsInShape rejects a dragKey-like top-level segment that is not a real data field', () => {
  const shape = { imageUrl1: '' };
  assert.equal(pathExistsInShape(shape, 'imagePlaceholder1'), false);
});
