const { test } = require('node:test');
const assert = require('node:assert/strict');

const { presetAnswers } = require('../lib/cli');

test('presetAnswers resolves product and architecture by their ids', () => {
    const preset = presetAnswers({ product: 'elasticsearch', arch: 'linux-x86_64', productVersion: '8.14.0' });

    assert.equal(preset.product.name, 'Elasticsearch');
    assert.equal(preset.arch.id, 'linux-x86_64');
    assert.equal(preset.version, '8.14.0');
});

test('presetAnswers rejects unknown products and architectures', () => {
    assert.throws(() => presetAnswers({ product: 'nope' }), /Unknown product "nope"/);
    assert.throws(() => presetAnswers({ arch: 'linux-x86_64' }), /--arch requires --product/);
    // The error lists what is actually available for the product.
    assert.throws(
        () => presetAnswers({ product: 'winlogbeat', arch: 'linux-x86_64' }),
        /Unknown architecture "linux-x86_64" for Winlogbeat\. Available: windows-x86_64, windows-x86/
    );
});

test('presetAnswers trims the version and rejects unsafe formats', () => {
    assert.equal(presetAnswers({ productVersion: ' 8.14.0 ' }).version, '8.14.0');
    assert.throws(() => presetAnswers({ productVersion: '../8.14.0' }), /letters, digits, dots and dashes/);
    assert.throws(() => presetAnswers({ productVersion: '8.14.0 linux' }), /letters, digits, dots and dashes/);
});

test('presetAnswers rejects --extract for non-extractable packages', () => {
    assert.throws(
        () => presetAnswers({ product: 'filebeat', arch: 'rpm-x86_64', extract: true }),
        /only tar\.gz, tgz and zip archives can be extracted/
    );
});

test('presetAnswers lets --delete-archive imply --extract', () => {
    const preset = presetAnswers({ product: 'elasticsearch', arch: 'linux-x86_64', deleteArchive: true });

    assert.equal(preset.extract, true);
    assert.equal(preset.deleteArchive, true);
});

test('presetAnswers fills the scripted defaults for --yes', () => {
    const preset = presetAnswers({ yes: true });

    assert.equal(preset.confirm, true);
    assert.equal(preset.extract, false);
    assert.equal(preset.deleteArchive, false);
});

test('presetAnswers keeps flags given alongside --yes', () => {
    const preset = presetAnswers({ product: 'kibana', arch: 'darwin-aarch64', extract: true, yes: true });

    assert.equal(preset.confirm, true);
    assert.equal(preset.extract, true);
    assert.equal(preset.deleteArchive, false);
});
