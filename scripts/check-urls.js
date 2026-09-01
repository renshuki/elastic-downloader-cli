#!/usr/bin/env node

// Maintenance helper: sends a HEAD request to every product / architecture
// combination in the catalog (using a representative version per product)
// and reports the HTTP status, to catch catalog regressions.
//
// Usage: node scripts/check-urls.js [version]
//   When a version is given it overrides the per-product defaults.

const axios = require('axios');
const productGroups = require('../lib/products');
const { architecturesFor } = require('../lib/architectures');
const { buildFilename, buildUrl } = require('../lib/download');

// Representative version per product slug (a version for which the product
// was actually released).
const TEST_VERSIONS = {
    'elasticsearch': '8.14.0',
    'kibana': '8.14.0',
    'logstash': '8.14.0',
    'elastic-agent': '8.14.0',
    'apm-server': '8.14.0',
    'auditbeat': '7.17.0',
    'filebeat': '7.17.0',
    'functionbeat': '7.17.0',
    'heartbeat': '7.17.0',
    'journalbeat': '7.15.2',
    'metricbeat': '7.17.0',
    'packetbeat': '7.17.0',
    'winlogbeat': '7.17.0',
    'topbeat': '1.3.1',
    'app-search': '7.6.2',
    'enterprise-search': '8.14.0',
    'elasticsearch-hadoop': '8.14.0',
    'esodbc': '8.19.20',
    'x-pack': '6.2.4',
};
const OSS_DEFAULT_VERSION = '7.10.2';

async function main() {
    const versionOverride = process.argv[2];
    let failures = 0;

    for (const group of productGroups) {
        console.log(`\n=== ${group.group} ===`);

        for (const product of group.products) {
            const version = versionOverride
                || TEST_VERSIONS[product.slug]
                || (product.slug.endsWith('-oss') && OSS_DEFAULT_VERSION);

            if (!version) {
                console.log(`  ?   ${product.name}: no test version configured`);
                continue;
            }

            for (const arch of architecturesFor(product)) {
                const url = buildUrl(product, buildFilename(product, arch, version));
                const response = await axios.head(url, { validateStatus: () => true, timeout: 15000 });

                if (response.status !== 200) {
                    failures += 1;
                }

                console.log(`  ${response.status}  ${url}`);
            }
        }
    }

    console.log(`\n${failures === 0 ? 'All URLs OK' : `${failures} URL(s) not found`}`);
}

main();
