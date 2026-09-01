// Product catalog, grouped the same way as the Elastic downloads page.
//
// Fields:
//   name          display name
//   note          optional availability hint shown next to the name
//   path          directory under https://artifacts.elastic.co/downloads/
//   slug          prefix of the artifact filename
//   archs         list of architecture ids from lib/architectures.js
//                 (defaults to DEFAULT_ARCHS when omitted)
//   customArchs   inline architecture definitions for legacy naming schemes
//   noArchBefore  versions older than this do not embed the architecture in
//                 the artifact filename
//   minVersion    oldest version available for the product (inclusive); the
//                 interactive version list hides anything older
//   maxVersion    first version past the product's availability (exclusive
//                 upper bound); the interactive version list hides it and
//                 anything newer
//   baseUrl       overrides the artifacts.elastic.co base URL
//
// Every path / filename pattern in this catalog has been verified against the
// live download servers, and so has every minVersion / maxVersion boundary
// (the version right inside the bound exists, the one right outside 404s).

// Beats kept shipping 32-bit Windows builds until 7.x, and use the
// "linux-arm64" suffix for Linux ARM tarballs.
const BEATS_ARCHS = [
    'linux-x86_64',
    'linux-arm64',
    'darwin-x86_64',
    'darwin-aarch64',
    'windows-x86_64',
    'windows-x86',
    'deb-amd64',
    'deb-arm64',
    'rpm-x86_64',
    'rpm-aarch64',
];

// OSS distributions ended with 7.10, before macOS ARM builds existed.
const OSS_STACK_ARCHS = [
    'linux-x86_64',
    'linux-aarch64',
    'darwin-x86_64',
    'windows-x86_64',
    'deb-amd64',
    'deb-arm64',
    'rpm-x86_64',
    'rpm-aarch64',
];

const OSS_BEATS_ARCHS = [
    'linux-x86_64',
    'linux-arm64',
    'darwin-x86_64',
    'windows-x86_64',
    'windows-x86',
    'deb-amd64',
    'deb-arm64',
    'rpm-x86_64',
    'rpm-aarch64',
];

// Apache 2.0 licensed distributions shipped from 6.3.0 to 7.10.2 (the
// license changed with 7.11).
const OSS_RANGE = { minVersion: '6.3.0', maxVersion: '7.11.0' };

module.exports = [
    {
        group: 'Elastic Stack',
        products: [
            // artifacts.elastic.co only hosts the unified 5.0+ releases;
            // older versions live on download.elastic.co under different
            // paths and naming schemes.
            { name: 'Elasticsearch', note: '5.0+', path: 'elasticsearch', slug: 'elasticsearch', noArchBefore: '7.0.0', minVersion: '5.0.0' },
            { name: 'Kibana', note: '5.0+', path: 'kibana', slug: 'kibana', minVersion: '5.0.0' },
            { name: 'Logstash', note: '5.0+', path: 'logstash', slug: 'logstash', noArchBefore: '7.10.0', minVersion: '5.0.0' },
        ],
    },
    {
        group: 'Elastic Observability',
        products: [
            {
                name: 'Elastic Agent', note: '7.8+', path: 'beats/elastic-agent', slug: 'elastic-agent', minVersion: '7.8.0',
                archs: ['linux-x86_64', 'linux-arm64', 'darwin-x86_64', 'darwin-aarch64', 'windows-x86_64', 'deb-amd64', 'deb-arm64', 'rpm-x86_64', 'rpm-aarch64'],
            },
            {
                name: 'APM Server', note: '6.0+', path: 'apm-server', slug: 'apm-server', minVersion: '6.0.0',
                archs: ['linux-x86_64', 'linux-arm64', 'darwin-x86_64', 'windows-x86_64', 'deb-amd64', 'deb-arm64', 'rpm-x86_64', 'rpm-aarch64'],
            },
            { name: 'Auditbeat', note: '6.0+', path: 'beats/auditbeat', slug: 'auditbeat', minVersion: '6.0.0', archs: BEATS_ARCHS },
            { name: 'Filebeat', note: '5.0+', path: 'beats/filebeat', slug: 'filebeat', minVersion: '5.0.0', archs: BEATS_ARCHS },
            {
                // The first published Functionbeat artifact is 6.5.2 (6.5.0
                // and 6.5.1 were never released) and the last one is 8.17.3.
                name: 'Functionbeat', note: '6.5 to 8.17', path: 'beats/functionbeat', slug: 'functionbeat',
                minVersion: '6.5.2', maxVersion: '8.17.4',
                archs: ['linux-x86_64', 'darwin-x86_64', 'windows-x86_64'],
            },
            { name: 'Heartbeat', note: '5.2+', path: 'beats/heartbeat', slug: 'heartbeat', minVersion: '5.2.0', archs: BEATS_ARCHS },
            {
                name: 'Journalbeat', note: '6.5 to 7.15', path: 'beats/journalbeat', slug: 'journalbeat',
                minVersion: '6.5.0', maxVersion: '7.16.0',
                archs: ['linux-x86_64', 'deb-amd64', 'rpm-x86_64'],
            },
            { name: 'Metricbeat', note: '5.0+', path: 'beats/metricbeat', slug: 'metricbeat', minVersion: '5.0.0', archs: BEATS_ARCHS },
            { name: 'Packetbeat', note: '5.0+', path: 'beats/packetbeat', slug: 'packetbeat', minVersion: '5.0.0', archs: BEATS_ARCHS },
            {
                name: 'Winlogbeat', note: '5.0+', path: 'beats/winlogbeat', slug: 'winlogbeat', minVersion: '5.0.0',
                archs: ['windows-x86_64', 'windows-x86'],
            },
            {
                // The last Topbeat release is 1.3.1 (its successor is
                // Metricbeat); the range still shows a few 1.x versions that
                // only Elasticsearch shipped, which do not exist for Topbeat.
                name: 'Topbeat', note: '1.x, legacy', path: 'beats/topbeat', slug: 'topbeat',
                minVersion: '1.0.0', maxVersion: '1.3.2',
                baseUrl: 'https://download.elastic.co/beats/topbeat',
                customArchs: [
                    { id: 'linux-x86_64', name: 'LINUX 64-BIT', suffix: 'x86_64', ext: 'tar.gz' },
                    { id: 'linux-i686', name: 'LINUX 32-BIT', suffix: 'i686', ext: 'tar.gz' },
                    { id: 'darwin', name: 'MACOS', suffix: 'darwin', ext: 'tgz' },
                    { id: 'windows', name: 'WINDOWS', suffix: 'windows', ext: 'zip' },
                    { id: 'deb-amd64', name: 'DEB 64-BIT', ext: 'deb', filename: (slug, version) => `${slug}_${version}_amd64.deb` },
                    { id: 'deb-i386', name: 'DEB 32-BIT', ext: 'deb', filename: (slug, version) => `${slug}_${version}_i386.deb` },
                    { id: 'rpm-x86_64', name: 'RPM 64-BIT', suffix: 'x86_64', ext: 'rpm' },
                    { id: 'rpm-i686', name: 'RPM 32-BIT', suffix: 'i686', ext: 'rpm' },
                ],
            },
        ],
    },
    {
        group: 'Elastic Enterprise Search',
        products: [
            // Standalone App Search downloads only exist from 7.4.0 (7.0 to
            // 7.3 are not hosted on artifacts.elastic.co).
            {
                name: 'App Search', note: '7.4 to 7.6', path: 'app-search', slug: 'app-search',
                minVersion: '7.4.0', maxVersion: '7.7.0', archs: ['noarch-tar-gz'],
            },
            {
                name: 'Enterprise Search', note: '7.7 to 8.x', path: 'enterprise-search', slug: 'enterprise-search',
                minVersion: '7.7.0', maxVersion: '9.0.0', archs: ['noarch-tar-gz'],
            },
        ],
    },
    {
        group: 'Tools and clients',
        products: [
            {
                name: 'Elasticsearch for Apache Hadoop', note: '7.0+', path: 'elasticsearch-hadoop', slug: 'elasticsearch-hadoop',
                minVersion: '7.0.0', archs: ['noarch-zip'],
            },
            {
                name: 'Elasticsearch SQL ODBC Driver', note: '6.5+', path: 'elasticsearch', slug: 'esodbc', minVersion: '6.5.0',
                archs: ['msi-windows-x86_64', 'msi-windows-x86'],
            },
            {
                name: 'X-Pack', note: '5.0 to 6.2', path: 'packs/x-pack', slug: 'x-pack',
                minVersion: '5.0.0', maxVersion: '6.3.0', archs: ['noarch-zip'],
            },
        ],
    },
    {
        group: 'OSS distributions (Apache 2.0, 6.3 to 7.10)',
        products: [
            { name: 'Elasticsearch OSS', path: 'elasticsearch', slug: 'elasticsearch-oss', noArchBefore: '7.0.0', archs: OSS_STACK_ARCHS, ...OSS_RANGE },
            {
                name: 'Kibana OSS', path: 'kibana', slug: 'kibana-oss',
                archs: ['linux-x86_64', 'linux-aarch64', 'darwin-x86_64', 'windows-x86_64', 'deb-amd64', 'rpm-x86_64'],
                ...OSS_RANGE,
            },
            { name: 'Logstash OSS', path: 'logstash', slug: 'logstash-oss', noArchBefore: '7.10.0', archs: OSS_STACK_ARCHS, ...OSS_RANGE },
            {
                name: 'APM Server OSS', note: '6.8 to 7.10', path: 'apm-server', slug: 'apm-server-oss',
                archs: ['linux-x86_64', 'linux-arm64', 'darwin-x86_64', 'windows-x86_64', 'deb-amd64', 'deb-arm64', 'rpm-x86_64', 'rpm-aarch64'],
                ...OSS_RANGE, minVersion: '6.8.0',
            },
            { name: 'Auditbeat OSS', path: 'beats/auditbeat', slug: 'auditbeat-oss', archs: OSS_BEATS_ARCHS, ...OSS_RANGE },
            { name: 'Filebeat OSS', path: 'beats/filebeat', slug: 'filebeat-oss', archs: OSS_BEATS_ARCHS, ...OSS_RANGE },
            { name: 'Heartbeat OSS', path: 'beats/heartbeat', slug: 'heartbeat-oss', archs: OSS_BEATS_ARCHS, ...OSS_RANGE },
            {
                name: 'Journalbeat OSS', note: '6.5 to 7.10', path: 'beats/journalbeat', slug: 'journalbeat-oss',
                archs: ['linux-x86_64', 'deb-amd64', 'rpm-x86_64'],
                ...OSS_RANGE, minVersion: '6.5.0',
            },
            { name: 'Metricbeat OSS', path: 'beats/metricbeat', slug: 'metricbeat-oss', archs: OSS_BEATS_ARCHS, ...OSS_RANGE },
            { name: 'Packetbeat OSS', path: 'beats/packetbeat', slug: 'packetbeat-oss', archs: OSS_BEATS_ARCHS, ...OSS_RANGE },
            {
                name: 'Winlogbeat OSS', path: 'beats/winlogbeat', slug: 'winlogbeat-oss',
                archs: ['windows-x86_64', 'windows-x86'],
                ...OSS_RANGE,
            },
        ],
    },
];
