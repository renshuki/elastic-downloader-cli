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

test('typed versions are validated against a URL and filename safe format', () => {
    // Same validation in both prompts: the manual escape hatch (fetched
    // list) and the plain input (version fetch failed).
    const inputs = [
        questionByName(buildQuestions(VERSIONS), 'manualVersion'),
        questionByName(buildQuestions(null), 'version'),
    ];

    for (const input of inputs) {
        assert.equal(input.validate('8.14.0'), true);
        assert.equal(input.validate(' 8.14.0 '), true, 'surrounding whitespace is trimmed');
        assert.equal(input.validate('8.0.0-rc1'), true, 'pre-releases stay reachable');
        assert.notEqual(input.validate(''), true);
        assert.notEqual(input.validate('   '), true);
        assert.notEqual(input.validate('../../8.14.0'), true, 'path separators are rejected');
        assert.notEqual(input.validate('8.14.0 linux'), true, 'inner whitespace is rejected');
    }
});

test('resolvedVersion uses the manual input when the version list was skipped', () => {
    assert.equal(resolvedVersion({ version: undefined, manualVersion: '2.4.6' }), '2.4.6');
    assert.equal(resolvedVersion({ version: '8.14.0', manualVersion: undefined }), '8.14.0');
});

test('selecting the manual escape hatch asks for input and uses its answer', () => {
    const questions = buildQuestions(VERSIONS);
    // The escape hatch is always the first choice in the search-list.
    const manualLabel = questionByName(questions, 'version').choices({ product: {} })[0];
    const manual = questionByName(questions, 'manualVersion');

    assert.equal(manual.when({ product: {}, version: manualLabel }), true);
    assert.equal(resolvedVersion({ version: manualLabel, manualVersion: '6.2.4' }), '6.2.4');
});

test('picking a version from the list skips the manual input', () => {
    const manual = questionByName(buildQuestions(VERSIONS), 'manualVersion');

    assert.equal(manual.when({ product: {}, version: '8.14.0' }), false);
});
