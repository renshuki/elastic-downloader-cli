// Each architecture maps to the filename suffix and extension used by
// artifacts hosted on artifacts.elastic.co.
module.exports = [
    { name: 'LINUX 64-BIT', suffix: 'linux-x86_64', ext: 'tar.gz' },
    { name: 'LINUX ARM', suffix: 'linux-aarch64', ext: 'tar.gz' },
    { name: 'MACOS 64-BIT', suffix: 'darwin-x86_64', ext: 'tar.gz' },
    { name: 'MACOS ARM', suffix: 'darwin-aarch64', ext: 'tar.gz' },
    { name: 'WINDOWS', suffix: 'windows-x86_64', ext: 'zip' },
    { name: 'DEB 64-BIT', suffix: 'amd64', ext: 'deb' },
    { name: 'DEB ARM', suffix: 'arm64', ext: 'deb' },
    { name: 'RPM 64-BIT', suffix: 'x86_64', ext: 'rpm' },
    { name: 'RPM ARM', suffix: 'aarch64', ext: 'rpm' },
];
