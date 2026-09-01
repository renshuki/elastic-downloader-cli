import { test } from 'node:test';
import assert from 'node:assert/strict';

import { versionsFor } from '../lib/versions.js';
import {
    productChoices,
    architectureChoices,
    filterVersionChoices,
    requireVersion,
    confirmMessage,
    MANUAL_VERSION,
} from '../lib/questions.js';

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

test('filterVersionChoices leads with the escape hatch when no term is typed', () => {
    assert.deepEqual(
        filterVersionChoices(['8.14.0', '7.10.2'], ''),
        [MANUAL_VERSION, '8.14.0', '7.10.2']
    );
    assert.deepEqual(filterVersionChoices(['8.14.0'], undefined), [MANUAL_VERSION, '8.14.0']);
});

test('filterVersionChoices narrows by substring and keeps the escape hatch reachable', () => {
    assert.deepEqual(
        filterVersionChoices(VERSIONS, '7.1'),
        ['7.17.0', '7.10.2', MANUAL_VERSION]
    );
    assert.deepEqual(
        filterVersionChoices(VERSIONS, '8.14.0'),
        ['8.14.0', MANUAL_VERSION]
    );
});

test('filterVersionChoices still offers the escape hatch when nothing matches', () => {
    assert.deepEqual(filterVersionChoices(VERSIONS, '9.9.9'), [MANUAL_VERSION]);
});

test('typed versions are validated against a URL and filename safe format', () => {
    assert.equal(requireVersion('8.14.0'), true);
    assert.equal(requireVersion(' 8.14.0 '), true, 'surrounding whitespace is trimmed');
    assert.equal(requireVersion('8.0.0-rc1'), true, 'pre-releases stay reachable');
    assert.notEqual(requireVersion(''), true);
    assert.notEqual(requireVersion('   '), true);
    assert.notEqual(requireVersion('../../8.14.0'), true, 'path separators are rejected');
    assert.notEqual(requireVersion('8.14.0 linux'), true, 'inner whitespace is rejected');
});

test('product choices show availability notes and group separators', () => {
    const choices = productChoices();
    const labels = choices.filter((choice) => choice.value !== undefined).map((choice) => choice.name);

    assert.ok(labels.includes('Elasticsearch (5.0+)'), 'availability notes must be part of the label');
    assert.ok(labels.includes('X-Pack (5.0 to 6.2)'));
    assert.ok(
        choices.some((choice) => choice.type === 'separator'),
        'group separators must be interleaved with the products'
    );
});

test('architecture choices expose display names and definitions', () => {
    const choices = architectureChoices({ archs: ['windows-x86_64', 'windows-x86'] });

    assert.deepEqual(choices.map((choice) => choice.name), ['WINDOWS 64-BIT', 'WINDOWS 32-BIT (up to 7.x)']);
    assert.equal(choices[0].value.id, 'windows-x86_64');
});

test('confirmMessage warns when the architecture will not apply to a legacy version', () => {
    const product = { name: 'Elasticsearch', noArchBefore: '7.0.0' };
    const arch = { name: 'LINUX 64-BIT', suffix: 'linux-x86_64' };

    assert.match(
        confirmMessage({ product, arch, version: '6.8.23' }),
        /ship a single platform independent package, so "LINUX 64-BIT" will not apply/
    );
    assert.match(
        confirmMessage({ product, arch, version: '7.0.0' }),
        /^Are you sure to download Elasticsearch 7\.0\.0 \(LINUX 64-BIT\)/
    );
});
