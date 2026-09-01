// Shared architecture / packaging definitions. `suffix` is the architecture
// part of the artifact filename (null when the artifact is platform
// independent) and `ext` is the file extension.
const ARCHITECTURES = {
    'linux-x86_64': { id: 'linux-x86_64', name: 'LINUX 64-BIT', suffix: 'linux-x86_64', ext: 'tar.gz' },
    'linux-aarch64': { id: 'linux-aarch64', name: 'LINUX ARM', suffix: 'linux-aarch64', ext: 'tar.gz' },
    // Beats, Elastic Agent and APM Server name their Linux ARM tarballs
    // "arm64" while Elasticsearch, Kibana and Logstash use "aarch64".
    'linux-arm64': { id: 'linux-arm64', name: 'LINUX ARM', suffix: 'linux-arm64', ext: 'tar.gz' },
    'darwin-x86_64': { id: 'darwin-x86_64', name: 'MACOS 64-BIT', suffix: 'darwin-x86_64', ext: 'tar.gz' },
    'darwin-aarch64': { id: 'darwin-aarch64', name: 'MACOS ARM', suffix: 'darwin-aarch64', ext: 'tar.gz' },
    'windows-x86_64': { id: 'windows-x86_64', name: 'WINDOWS 64-BIT', suffix: 'windows-x86_64', ext: 'zip' },
    'windows-x86': { id: 'windows-x86', name: 'WINDOWS 32-BIT (up to 7.x)', suffix: 'windows-x86', ext: 'zip' },
    'deb-amd64': { id: 'deb-amd64', name: 'DEB 64-BIT', suffix: 'amd64', ext: 'deb' },
    'deb-arm64': { id: 'deb-arm64', name: 'DEB ARM', suffix: 'arm64', ext: 'deb' },
    'rpm-x86_64': { id: 'rpm-x86_64', name: 'RPM 64-BIT', suffix: 'x86_64', ext: 'rpm' },
    'rpm-aarch64': { id: 'rpm-aarch64', name: 'RPM ARM', suffix: 'aarch64', ext: 'rpm' },
    'msi-windows-x86_64': { id: 'msi-windows-x86_64', name: 'WINDOWS 64-BIT (MSI)', suffix: 'windows-x86_64', ext: 'msi' },
    'msi-windows-x86': { id: 'msi-windows-x86', name: 'WINDOWS 32-BIT (MSI)', suffix: 'windows-x86', ext: 'msi' },
    'noarch-tar-gz': { id: 'noarch-tar-gz', name: 'TAR.GZ (platform independent)', suffix: null, ext: 'tar.gz' },
    'noarch-zip': { id: 'noarch-zip', name: 'ZIP (platform independent)', suffix: null, ext: 'zip' },
};

// Architectures offered when a product does not define its own list.
const DEFAULT_ARCHS = [
    'linux-x86_64',
    'linux-aarch64',
    'darwin-x86_64',
    'darwin-aarch64',
    'windows-x86_64',
    'deb-amd64',
    'deb-arm64',
    'rpm-x86_64',
    'rpm-aarch64',
];

// Returns the architecture choices available for a given product.
function architecturesFor(product) {
    if (product.customArchs) {
        return product.customArchs;
    }

    return (product.archs || DEFAULT_ARCHS).map((id) => ARCHITECTURES[id]);
}

module.exports = { ARCHITECTURES, DEFAULT_ARCHS, architecturesFor };
