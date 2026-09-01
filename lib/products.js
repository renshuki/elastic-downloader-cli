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
//   baseUrl       overrides the artifacts.elastic.co base URL
//
// Every path / filename pattern in this catalog has been verified against the
// live download servers.

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

module.exports = [
    {
        group: 'Elastic Stack',
        products: [
            { name: 'Elasticsearch', path: 'elasticsearch', slug: 'elasticsearch', noArchBefore: '7.0.0' },
            { name: 'Kibana', path: 'kibana', slug: 'kibana' },
            { name: 'Logstash', path: 'logstash', slug: 'logstash', noArchBefore: '7.10.0' },
        ],
    },
    {
        group: 'Elastic Observability',
        products: [
            {
                name: 'Elastic Agent', note: '7.8+', path: 'beats/elastic-agent', slug: 'elastic-agent',
                archs: ['linux-x86_64', 'linux-arm64', 'darwin-x86_64', 'darwin-aarch64', 'windows-x86_64', 'deb-amd64', 'deb-arm64', 'rpm-x86_64', 'rpm-aarch64'],
            },
            {
                name: 'APM Server', note: '6.2+', path: 'apm-server', slug: 'apm-server',
                archs: ['linux-x86_64', 'linux-arm64', 'darwin-x86_64', 'windows-x86_64', 'deb-amd64', 'deb-arm64', 'rpm-x86_64', 'rpm-aarch64'],
            },
            { name: 'Auditbeat', note: '6.0+', path: 'beats/auditbeat', slug: 'auditbeat', archs: BEATS_ARCHS },
            { name: 'Filebeat', path: 'beats/filebeat', slug: 'filebeat', archs: BEATS_ARCHS },
            {
                name: 'Functionbeat', note: '6.5 to 8.x', path: 'beats/functionbeat', slug: 'functionbeat',
                archs: ['linux-x86_64', 'darwin-x86_64', 'windows-x86_64'],
            },
            { name: 'Heartbeat', path: 'beats/heartbeat', slug: 'heartbeat', archs: BEATS_ARCHS },
            {
                name: 'Journalbeat', note: '6.5 to 7.15', path: 'beats/journalbeat', slug: 'journalbeat',
                archs: ['linux-x86_64', 'deb-amd64', 'rpm-x86_64'],
            },
            { name: 'Metricbeat', path: 'beats/metricbeat', slug: 'metricbeat', archs: BEATS_ARCHS },
            { name: 'Packetbeat', path: 'beats/packetbeat', slug: 'packetbeat', archs: BEATS_ARCHS },
            {
                name: 'Winlogbeat', path: 'beats/winlogbeat', slug: 'winlogbeat',
                archs: ['windows-x86_64', 'windows-x86'],
            },
            {
                name: 'Topbeat', note: '1.x, legacy', path: 'beats/topbeat', slug: 'topbeat',
                baseUrl: 'https://download.elastic.co/beats/topbeat',
                customArchs: [
                    { id: 'linux-x86_64', name: 'LINUX 64-BIT', suffix: 'x86_64', ext: 'tar.gz' },
                    { id: 'linux-i686', name: 'LINUX 32-BIT', suffix: 'i686', ext: 'tar.gz' },
                    { id: 'darwin', name: 'MACOS', suffix: 'darwin', ext: 'tgz' },
                    { id: 'windows', name: 'WINDOWS', suffix: 'windows', ext: 'zip' },
                    { id: 'deb-amd64', name: 'DEB 64-BIT', filename: (slug, version) => `${slug}_${version}_amd64.deb` },
                    { id: 'rpm-x86_64', name: 'RPM 64-BIT', suffix: 'x86_64', ext: 'rpm' },
                ],
            },
        ],
    },
    {
        group: 'Elastic Enterprise Search',
        products: [
            { name: 'App Search', note: '7.0 to 7.6', path: 'app-search', slug: 'app-search', archs: ['noarch-tar-gz'] },
            { name: 'Enterprise Search', note: '7.7 to 8.x', path: 'enterprise-search', slug: 'enterprise-search', archs: ['noarch-tar-gz'] },
        ],
    },
    {
        group: 'Tools and clients',
        products: [
            { name: 'Elasticsearch for Apache Hadoop', path: 'elasticsearch-hadoop', slug: 'elasticsearch-hadoop', archs: ['noarch-zip'] },
            {
                name: 'Elasticsearch SQL ODBC Driver', note: '6.5+', path: 'elasticsearch', slug: 'esodbc',
                archs: ['msi-windows-x86_64', 'msi-windows-x86'],
            },
            { name: 'X-Pack', note: '5.0 to 6.2', path: 'packs/x-pack', slug: 'x-pack', archs: ['noarch-zip'] },
        ],
    },
    {
        group: 'OSS distributions (Apache 2.0, 6.3 to 7.10)',
        products: [
            { name: 'Elasticsearch OSS', path: 'elasticsearch', slug: 'elasticsearch-oss', noArchBefore: '7.0.0', archs: OSS_STACK_ARCHS },
            {
                name: 'Kibana OSS', path: 'kibana', slug: 'kibana-oss',
                archs: ['linux-x86_64', 'linux-aarch64', 'darwin-x86_64', 'windows-x86_64', 'deb-amd64', 'rpm-x86_64'],
            },
            { name: 'Logstash OSS', path: 'logstash', slug: 'logstash-oss', noArchBefore: '7.10.0', archs: OSS_STACK_ARCHS },
            {
                name: 'APM Server OSS', note: '6.8 to 7.10', path: 'apm-server', slug: 'apm-server-oss',
                archs: ['linux-x86_64', 'linux-arm64', 'darwin-x86_64', 'windows-x86_64', 'deb-amd64', 'deb-arm64', 'rpm-x86_64', 'rpm-aarch64'],
            },
            { name: 'Auditbeat OSS', path: 'beats/auditbeat', slug: 'auditbeat-oss', archs: OSS_BEATS_ARCHS },
            { name: 'Filebeat OSS', path: 'beats/filebeat', slug: 'filebeat-oss', archs: OSS_BEATS_ARCHS },
            { name: 'Heartbeat OSS', path: 'beats/heartbeat', slug: 'heartbeat-oss', archs: OSS_BEATS_ARCHS },
            {
                name: 'Journalbeat OSS', note: '6.5 to 7.10', path: 'beats/journalbeat', slug: 'journalbeat-oss',
                archs: ['linux-x86_64', 'deb-amd64', 'rpm-x86_64'],
            },
            { name: 'Metricbeat OSS', path: 'beats/metricbeat', slug: 'metricbeat-oss', archs: OSS_BEATS_ARCHS },
            { name: 'Packetbeat OSS', path: 'beats/packetbeat', slug: 'packetbeat-oss', archs: OSS_BEATS_ARCHS },
            {
                name: 'Winlogbeat OSS', path: 'beats/winlogbeat', slug: 'winlogbeat-oss',
                archs: ['windows-x86_64', 'windows-x86'],
            },
        ],
    },
];
