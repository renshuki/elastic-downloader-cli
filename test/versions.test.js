const { test } = require('node:test');
const assert = require('node:assert/strict');

const { versionsFor } = require('../lib/versions');
const { buildQuestions, resolvedVersion } = require('../lib/questions');

// Newest first, like the fetched list.
const VERSIONS = ['8.14.0', '8.0.0', '7.17.0', '7.10.2', '7.4.0', '6.8.23', '6.2.4', '5.6.16', '1.3.1'];

test('versionsFor returns the full list for products without bounds', () => {
    assert.deepEqual(versionsFor({}, VERSIONS), VERSIONS);
});

test('versionsFor applies minVersion inclusively', () => {
    assert.deepEqual(
        versionsFor({ minVersion: '6.2.4' }, VERSIONS),
        ['8.14.0', '8.0.0', '7.17.0', '7.10.2', '7.4.0', '6.8.23', '6.2.4']
    );
});

test('versionsFor applies maxVersion exclusively', () => {
    assert.deepEqual(
        versionsFor({ maxVersion: '7.4.0' }, VERSIONS),
        ['6.8.23', '6.2.4', '5.6.16', '1.3.1']
    );
});

test('versionsFor combines both bounds and preserves order', () => {
    assert.deepEqual(
        versionsFor({ minVersion: '6.3.0', maxVersion: '7.11.0' }, VERSIONS),
        ['7.10.2', '7.4.0', '6.8.23']
    );
});

test('versionsFor returns an empty list when nothing is in range', () => {
    assert.deepEqual(versionsFor({ minVersion: '2.0.0', maxVersion: '5.0.0' }, VERSIONS), []);
});

function questionByName(questions, name) {
    const question = questions.find((q) => q.name === name);
    assert.ok(question, `no question named "${name}"`);
    return question;
}

test('version choices are restricted to the selected product', () => {
    const questions = buildQuestions(VERSIONS);
    const version = questionByName(questions, 'version');
    const product = { minVersion: '5.0.0', maxVersion: '6.3.0' };

    assert.equal(version.when({ product }), true);
    // First choice is the manual entry escape hatch, then the in-range
    // versions only.
    assert.deepEqual(version.choices({ product }).slice(1), ['6.2.4', '5.6.16']);
});

test('version list is skipped and manual input offered when nothing is in range', () => {
    const questions = buildQuestions(VERSIONS);
    const product = { minVersion: '2.0.0', maxVersion: '5.0.0' };

    assert.equal(questionByName(questions, 'version').when({ product }), false);

    const manual = questionByName(questions, 'manualVersion');
    assert.equal(manual.when({ product, version: undefined }), true);
    assert.equal(manual.default({ product }), undefined);
});

test('manual input defaults to the latest release within the product range', () => {
    const questions = buildQuestions(VERSIONS);
    const manual = questionByName(questions, 'manualVersion');
    const product = { minVersion: '6.3.0', maxVersion: '7.11.0' };

    assert.equal(manual.default({ product }), '7.10.2');
});

test('resolvedVersion uses the manual input when the version list was skipped', () => {
    assert.equal(resolvedVersion({ version: undefined, manualVersion: '2.4.6' }), '2.4.6');
    assert.equal(resolvedVersion({ version: '8.14.0', manualVersion: undefined }), '8.14.0');
});
