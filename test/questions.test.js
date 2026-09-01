import { test } from 'node:test';
import assert from 'node:assert/strict';

import { askAnswers, askVersion, MANUAL_VERSION } from '../lib/questions.js';

const VERSIONS = ['8.14.0', '8.0.0', '7.10.2', '6.2.4', '5.6.16'];

const PRODUCT = { name: 'Test Product', slug: 'test-product', archs: ['linux-x86_64'] };
const TARBALL_ARCH = { id: 'linux-x86_64', name: 'LINUX 64-BIT', suffix: 'linux-x86_64', ext: 'tar.gz' };
const RPM_ARCH = { id: 'rpm-x86_64', name: 'RPM 64-BIT', suffix: 'x86_64', ext: 'rpm' };

// Prompt stubs that record every call; unspecified prompt kinds fail the
// test when reached, so each test declares exactly what it expects asked.
function stubPrompts(calls, handlers = {}) {
    const fail = (kind) => async (options) => {
        throw new Error(`unexpected ${kind} prompt: ${options.message}`);
    };

    return {
        select: fail('select'),
        search: fail('search'),
        input: fail('input'),
        confirm: fail('confirm'),
        ...Object.fromEntries(Object.entries(handlers).map(([kind, handler]) => [
            kind,
            async (options) => {
                calls.push(`${kind}: ${options.message}`);
                return handler(options);
            },
        ])),
    };
}

test('askAnswers never prompts when the preset answers everything', async () => {
    const calls = [];
    const preset = {
        product: PRODUCT,
        arch: TARBALL_ARCH,
        version: '8.14.0',
        extract: false,
        deleteArchive: false,
        confirm: true,
    };

    const answers = await askAnswers(preset, VERSIONS, stubPrompts(calls));

    assert.deepEqual(calls, []);
    assert.deepEqual(answers, preset);
});

test('askAnswers walks the full flow in the original prompt order', async () => {
    const calls = [];
    const prompts = stubPrompts(calls, {
        select: (options) => (options.message === 'Select a product:' ? PRODUCT : TARBALL_ARCH),
        search: () => '8.0.0',
        confirm: (options) => options.message.startsWith('Extract'),
    });

    const answers = await askAnswers({}, VERSIONS, prompts);

    assert.deepEqual(calls, [
        'select: Select a product:',
        'select: Select an architecture / package:',
        'search: Choose a version (type to filter):',
        'confirm: Extract the archive after the download?',
        'confirm: Delete the archive once extracted?',
        'confirm: Are you sure to download Test Product 8.0.0 (LINUX 64-BIT) in the current directory?',
    ]);
    assert.equal(answers.version, '8.0.0');
    assert.equal(answers.extract, true);
    assert.equal(answers.deleteArchive, false);
});

test('askAnswers skips extract and delete prompts for non-archive packages', async () => {
    const calls = [];
    const preset = { product: PRODUCT, arch: RPM_ARCH, version: '8.14.0' };
    const prompts = stubPrompts(calls, { confirm: () => true });

    const answers = await askAnswers(preset, VERSIONS, prompts);

    assert.deepEqual(calls, [
        'confirm: Are you sure to download Test Product 8.14.0 (RPM 64-BIT) in the current directory?',
    ]);
    assert.equal(answers.extract, false);
    assert.equal(answers.deleteArchive, false);
});

test('askAnswers keeps the delete guard when extract was preset for a non-archive package', async () => {
    const calls = [];
    const preset = { product: PRODUCT, arch: RPM_ARCH, version: '8.14.0', extract: true, confirm: true };

    const answers = await askAnswers(preset, VERSIONS, stubPrompts(calls));

    assert.deepEqual(calls, [], 'the delete prompt must not be asked for a non-archive package');
    assert.equal(answers.deleteArchive, false);
});

test('askAnswers only asks about deletion after extraction is accepted', async () => {
    const calls = [];
    const preset = { product: PRODUCT, arch: TARBALL_ARCH, version: '8.14.0', confirm: true };
    const prompts = stubPrompts(calls, { confirm: () => false });

    const answers = await askAnswers(preset, VERSIONS, prompts);

    assert.deepEqual(calls, ['confirm: Extract the archive after the download?']);
    assert.equal(answers.deleteArchive, false);
});

test('askVersion returns the version picked from the search list', async () => {
    const calls = [];
    let source;
    const prompts = stubPrompts(calls, {
        search: (options) => {
            source = options.source;
            return '6.2.4';
        },
    });

    const version = await askVersion({ minVersion: '5.0.0', maxVersion: '7.0.0' }, VERSIONS, prompts);

    assert.equal(version, '6.2.4');
    // The source only offers in-range versions, plus the escape hatch.
    assert.deepEqual(source(''), [MANUAL_VERSION, '6.2.4', '5.6.16']);
});

test('askVersion falls back to manual input from the escape hatch, defaulting to the latest in range', async () => {
    const calls = [];
    const prompts = stubPrompts(calls, {
        search: () => MANUAL_VERSION,
        input: (options) => {
            assert.equal(options.default, '6.2.4', 'the default must be the latest release in range');
            return ' 6.1.0 ';
        },
    });

    const version = await askVersion({ minVersion: '5.0.0', maxVersion: '7.0.0' }, VERSIONS, prompts);

    assert.equal(version, '6.1.0', 'the manual input must be trimmed');
    assert.deepEqual(calls, [
        'search: Choose a version (type to filter):',
        'input: Type a version:',
    ]);
});

test('askVersion goes straight to manual input when the fetch failed', async () => {
    const calls = [];
    const prompts = stubPrompts(calls, {
        input: (options) => {
            assert.equal(options.default, undefined, 'no default without a fetched list');
            return '8.14.0';
        },
    });

    assert.equal(await askVersion(PRODUCT, null, prompts), '8.14.0');
    assert.deepEqual(calls, ['input: Type a version:']);
});

test('askVersion goes straight to manual input when nothing falls in the product range', async () => {
    const calls = [];
    const prompts = stubPrompts(calls, { input: () => '2.4.6' });

    const version = await askVersion({ minVersion: '2.0.0', maxVersion: '5.0.0' }, VERSIONS, prompts);

    assert.equal(version, '2.4.6');
    assert.deepEqual(calls, ['input: Type a version:']);
});
