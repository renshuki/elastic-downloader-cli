#!/usr/bin/env node

// Maintenance helper: sends a HEAD request to every product / architecture
// combination in the catalog (using a representative version per product)
// and reports the HTTP status, to catch catalog regressions.
//
// Usage: node scripts/check-urls.js [version]
//   When a version is given it overrides the per-product defaults.
//
// Exits with status 1 when any combination fails, so it can be used in CI.

const axios = require('axios');
const productGroups = require('../lib/products');
const { architecturesFor } = require('../lib/architectures');
const { buildFilename, buildUrl } = require('../lib/download');

// Representative version per product slug (a version for which the product
// was actually released). Entries can either be a plain version string or an
// object with a `default` version and per-architecture overrides in `byArch`,
// for products whose architectures do not all exist at a single version
// (e.g. Beats: 32-bit Windows ended with 7.x while macOS ARM started in 8.0).
const BEATS_VERSIONS = { default: '7.17.0', byArch: { 'darwin-aarch64': '8.14.0' } };

const TEST_VERSIONS = {
    'elasticsearch': '8.14.0',
    'kibana': '8.14.0',
    'logstash': '8.14.0',
    'elastic-agent': '8.14.0',
    'apm-server': '8.14.0',
    'auditbeat': BEATS_VERSIONS,
    'filebeat': BEATS_VERSIONS,
    'functionbeat': '7.17.0',
    'heartbeat': BEATS_VERSIONS,
    'journalbeat': '7.15.2',
    'metricbeat': BEATS_VERSIONS,
    'packetbeat': BEATS_VERSIONS,
    'winlogbeat': '7.17.0',
    'topbeat': '1.3.1',
    'app-search': '7.6.2',
    'enterprise-search': '8.14.0',
    'elasticsearch-hadoop': '8.14.0',
    'esodbc': '8.19.20',
    'x-pack': '6.2.4',
};
const OSS_DEFAULT_VERSION = '7.10.2';

function versionFor(product, arch, override) {
    if (override) {
        return override;
    }

    const spec = TEST_VERSIONS[product.slug]
        || (product.slug.endsWith('-oss') && OSS_DEFAULT_VERSION);

    if (!spec) {
        return null;
    }

    if (typeof spec === 'string') {
        return spec;
    }

    return (spec.byArch && spec.byArch[arch.id]) || spec.default;
}

async function main() {
    const versionOverride = process.argv[2];
    let failures = 0;

    for (const group of productGroups) {
        console.log(`\n=== ${group.group} ===`);

        for (const product of group.products) {
            for (const arch of architecturesFor(product)) {
                const version = versionFor(product, arch, versionOverride);

                // A product missing from TEST_VERSIONS must fail the run,
                // otherwise newly added catalog entries would silently lose
                // coverage.
                if (!version) {
                    failures += 1;
                    console.log(`  MISSING  ${product.name} / ${arch.id}: no test version configured`);
                    continue;
                }

                const url = buildUrl(product, buildFilename(product, arch, version));
                let status;

                // A transport error (timeout, DNS, connection reset) must not
                // abort the run: record it and keep checking the rest.
                try {
                    const response = await axios.head(url, { validateStatus: () => true, timeout: 15000 });
                    status = String(response.status);
                } catch (err) {
                    status = `ERR(${err.code || err.message})`;
                }

                if (status !== '200') {
                    failures += 1;
                }

                console.log(`  ${status.padEnd(3)}  ${url}`);
            }
        }
    }

    console.log(`\n${failures === 0 ? 'All URLs OK' : `${failures} URL(s) failed`}`);
    process.exitCode = failures === 0 ? 0 : 1;
}

main();
