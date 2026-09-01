// Product catalog, grouped the same way as the Elastic downloads page.
// `path` is the directory under https://artifacts.elastic.co/downloads/
// and `slug` is the prefix of the artifact filename.
module.exports = [
    {
        group: 'Elastic Stack',
        products: [
            { name: 'Elasticsearch', path: 'elasticsearch', slug: 'elasticsearch' },
            { name: 'Kibana', path: 'kibana', slug: 'kibana' },
            { name: 'Logstash', path: 'logstash', slug: 'logstash' },
        ],
    },
    {
        group: 'Elastic Enterprise Search',
        products: [
            { name: 'App Search', path: 'app-search', slug: 'app-search' },
            { name: 'Enterprise Search', path: 'enterprise-search', slug: 'enterprise-search' },
        ],
    },
    {
        group: 'Elastic Observability',
        products: [
            { name: 'APM Server', path: 'apm-server', slug: 'apm-server' },
            { name: 'Elastic Agent', path: 'elastic-agent', slug: 'elastic-agent' },
            { name: 'Auditbeat', path: 'beats/auditbeat', slug: 'auditbeat' },
            { name: 'Filebeat', path: 'beats/filebeat', slug: 'filebeat' },
            { name: 'Functionbeat', path: 'beats/functionbeat', slug: 'functionbeat' },
            { name: 'Heartbeat', path: 'beats/heartbeat', slug: 'heartbeat' },
            { name: 'Journalbeat', path: 'beats/journalbeat', slug: 'jounalbeat' },
            { name: 'Metricbeat', path: 'beats/metricbeat', slug: 'metricbeat' },
            { name: 'Packetbeat', path: 'beats/packetbeat', slug: 'packetbeat' },
            { name: 'Topbeat', path: 'beats/topbeat', slug: 'topbeat' },
            { name: 'Winlogbeat', path: 'beats', slug: 'winlogbeat' },
        ],
    },
];
