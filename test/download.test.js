const { test } = require('node:test');
const assert = require('node:assert/strict');

const { compareVersions, buildFilename, buildUrl, isLegacyNoArch } = require('../lib/download');
const productGroups = require('../lib/products');
const { architecturesFor } = require('../lib/architectures');

function findProduct(slug) {
    const product = productGroups.flatMap((group) => group.products).find((p) => p.slug === slug);
    assert.ok(product, `product "${slug}" is missing from the catalog`);
    return product;
}

function findArch(product, id) {
    const arch = architecturesFor(product).find((a) => a.id === id);
    assert.ok(arch, `architecture "${id}" is not available for "${product.slug}"`);
    return arch;
}

test('compareVersions orders dotted versions numerically', () => {
    assert.ok(compareVersions('7.10.0', '7.9.3') > 0, '7.10.0 must sort after 7.9.3');
    assert.ok(compareVersions('7.9.3', '7.10.0') < 0);
    assert.equal(compareVersions('8.14.0', '8.14.0'), 0);
    assert.ok(compareVersions('10.0.0', '9.99.99') > 0);
    // Missing segments count as zero
    assert.equal(compareVersions('7.10', '7.10.0'), 0);
});

test('buildFilename embeds the architecture for modern versions', () => {
    const elasticsearch = findProduct('elasticsearch');
    const linux = findArch(elasticsearch, 'linux-x86_64');

    assert.equal(
        buildFilename(elasticsearch, linux, '8.14.0'),
        'elasticsearch-8.14.0-linux-x86_64.tar.gz'
    );
});

test('buildFilename drops the architecture before a product noArchBefore version', () => {
    const elasticsearch = findProduct('elasticsearch');

    assert.equal(
        buildFilename(elasticsearch, findArch(elasticsearch, 'linux-x86_64'), '6.8.23'),
        'elasticsearch-6.8.23.tar.gz'
    );
    assert.equal(
        buildFilename(elasticsearch, findArch(elasticsearch, 'windows-x86_64'), '6.8.23'),
        'elasticsearch-6.8.23.zip'
    );
});

test('buildFilename keeps the architecture for products without noArchBefore', () => {
    const kibana = findProduct('kibana');

    assert.equal(
        buildFilename(kibana, findArch(kibana, 'linux-x86_64'), '6.8.23'),
        'kibana-6.8.23-linux-x86_64.tar.gz'
    );
});

test('buildFilename honors the Logstash 7.10.0 boundary exactly', () => {
    const logstash = findProduct('logstash');
    const linux = findArch(logstash, 'linux-x86_64');

    assert.equal(buildFilename(logstash, linux, '7.9.3'), 'logstash-7.9.3.tar.gz');
    assert.equal(buildFilename(logstash, linux, '7.10.0'), 'logstash-7.10.0-linux-x86_64.tar.gz');
});

test('buildFilename produces plain names for platform independent artifacts', () => {
    const enterpriseSearch = findProduct('enterprise-search');
    const hadoop = findProduct('elasticsearch-hadoop');

    assert.equal(
        buildFilename(enterpriseSearch, findArch(enterpriseSearch, 'noarch-tar-gz'), '8.14.0'),
        'enterprise-search-8.14.0.tar.gz'
    );
    assert.equal(
        buildFilename(hadoop, findArch(hadoop, 'noarch-zip'), '8.14.0'),
        'elasticsearch-hadoop-8.14.0.zip'
    );
});

test('buildFilename supports the ODBC driver msi naming', () => {
    const esodbc = findProduct('esodbc');

    assert.equal(
        buildFilename(esodbc, findArch(esodbc, 'msi-windows-x86_64'), '8.19.20'),
        'esodbc-8.19.20-windows-x86_64.msi'
    );
});

test('buildFilename uses custom filename builders for legacy Topbeat packages', () => {
    const topbeat = findProduct('topbeat');

    assert.equal(
        buildFilename(topbeat, findArch(topbeat, 'deb-amd64'), '1.3.1'),
        'topbeat_1.3.1_amd64.deb'
    );
    assert.equal(
        buildFilename(topbeat, findArch(topbeat, 'deb-i386'), '1.3.1'),
        'topbeat_1.3.1_i386.deb'
    );
    assert.equal(
        buildFilename(topbeat, findArch(topbeat, 'rpm-i686'), '1.3.1'),
        'topbeat-1.3.1-i686.rpm'
    );
});

test('isLegacyNoArch flags architecture selections dropped by noArchBefore', () => {
    const elasticsearch = findProduct('elasticsearch');
    const kibana = findProduct('kibana');
    const logstash = findProduct('logstash');
    const enterpriseSearch = findProduct('enterprise-search');

    // The selection is dropped for versions before the boundary
    assert.ok(isLegacyNoArch(elasticsearch, findArch(elasticsearch, 'linux-aarch64'), '6.8.23'));
    assert.ok(isLegacyNoArch(logstash, findArch(logstash, 'linux-x86_64'), '7.9.3'));

    // Modern versions embed the architecture normally
    assert.ok(!isLegacyNoArch(elasticsearch, findArch(elasticsearch, 'linux-aarch64'), '8.14.0'));
    assert.ok(!isLegacyNoArch(logstash, findArch(logstash, 'linux-x86_64'), '7.10.0'));

    // Products without the rule, and platform independent packages, never flag
    assert.ok(!isLegacyNoArch(kibana, findArch(kibana, 'linux-x86_64'), '6.8.23'));
    assert.ok(!isLegacyNoArch(enterpriseSearch, findArch(enterpriseSearch, 'noarch-tar-gz'), '8.14.0'));
});

test('buildUrl uses the artifacts server by default and baseUrl overrides', () => {
    const elasticsearch = findProduct('elasticsearch');
    const topbeat = findProduct('topbeat');

    assert.equal(
        buildUrl(elasticsearch, 'elasticsearch-8.14.0-linux-x86_64.tar.gz'),
        'https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.14.0-linux-x86_64.tar.gz'
    );
    assert.equal(
        buildUrl(topbeat, 'topbeat_1.3.1_amd64.deb'),
        'https://download.elastic.co/beats/topbeat/topbeat_1.3.1_amd64.deb'
    );
});
