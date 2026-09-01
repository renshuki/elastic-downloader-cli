const { test } = require('node:test');
const assert = require('node:assert/strict');

const productGroups = require('../lib/products');
const { ARCHITECTURES, DEFAULT_ARCHS, architecturesFor } = require('../lib/architectures');
const { compareVersions } = require('../lib/download');

const allProducts = productGroups.flatMap((group) => group.products);

test('every group has a name and at least one product', () => {
    for (const group of productGroups) {
        assert.equal(typeof group.group, 'string');
        assert.ok(Array.isArray(group.products) && group.products.length > 0, `group "${group.group}" is empty`);
    }
});

test('every product declares name, path and slug, and slugs are unique', () => {
    const slugs = new Set();

    for (const product of allProducts) {
        assert.equal(typeof product.name, 'string', `product without a name (slug: ${product.slug})`);
        assert.equal(typeof product.path, 'string', `"${product.slug}" has no artifacts path`);
        assert.equal(typeof product.slug, 'string', `"${product.name}" has no slug`);
        assert.ok(!slugs.has(product.slug), `duplicate slug "${product.slug}"`);
        slugs.add(product.slug);
    }
});

test('every product architecture id resolves to a definition', () => {
    for (const id of DEFAULT_ARCHS) {
        assert.ok(ARCHITECTURES[id], `DEFAULT_ARCHS references unknown architecture "${id}"`);
    }

    for (const product of allProducts) {
        for (const id of product.archs || []) {
            assert.ok(ARCHITECTURES[id], `"${product.slug}" references unknown architecture "${id}"`);
        }
    }
});

test('every product resolves to a non-empty, well-formed architecture list', () => {
    for (const product of allProducts) {
        const architectures = architecturesFor(product);
        assert.ok(architectures.length > 0, `"${product.slug}" has no architectures`);

        for (const arch of architectures) {
            assert.equal(typeof arch.id, 'string', `"${product.slug}" has an architecture without an id`);
            assert.equal(typeof arch.name, 'string', `"${product.slug}" / "${arch.id}" has no display name`);
            // Every architecture needs a package type; a missing ext once
            // produced ".undefined" in user facing messages.
            assert.equal(typeof arch.ext, 'string', `"${product.slug}" / "${arch.id}" has no ext`);
            assert.ok(arch.ext.length > 0, `"${product.slug}" / "${arch.id}" has an empty ext`);

            const hasCustomFilename = typeof arch.filename === 'function';
            const hasSuffix = arch.suffix === null || typeof arch.suffix === 'string';
            assert.ok(
                hasCustomFilename || hasSuffix,
                `"${product.slug}" / "${arch.id}" defines neither a suffix nor a filename builder`
            );
        }
    }
});

test('version boundaries and base URLs are well-formed where declared', () => {
    for (const product of allProducts) {
        for (const field of ['noArchBefore', 'minVersion', 'maxVersion']) {
            if (product[field] !== undefined) {
                assert.match(
                    product[field],
                    /^\d+\.\d+\.\d+$/,
                    `"${product.slug}" has a malformed ${field} "${product[field]}"`
                );
            }
        }

        if (product.minVersion !== undefined && product.maxVersion !== undefined) {
            assert.ok(
                compareVersions(product.minVersion, product.maxVersion) < 0,
                `"${product.slug}" has minVersion "${product.minVersion}" not below maxVersion "${product.maxVersion}"`
            );
        }

        if (product.baseUrl !== undefined) {
            assert.match(product.baseUrl, /^https:\/\//, `"${product.slug}" baseUrl must use https`);
            assert.ok(!product.baseUrl.endsWith('/'), `"${product.slug}" baseUrl must not end with a slash`);
        }
    }
});
