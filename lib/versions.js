const axios = require('axios');
const CLI = require('clui');

const versionStatus = new CLI.Spinner('Fetching available versions...  ');

const GITHUB_TAGS_URL = 'https://api.github.com/repos/elastic/elasticsearch/tags?per_page=100';
const ARTIFACTS_API_URL = 'https://artifacts-api.elastic.co/v1/versions';
const MAX_PAGES = 15;
const RELEASE_VERSION = /^\d+\.\d+\.\d+$/;

// Every product in the catalog follows the unified Elastic Stack versioning,
// so the elasticsearch repository tags provide a version list which works
// for all of them (even legacy products such as Topbeat 1.x or X-Pack 5.x
// align with the Elasticsearch versions of their time). This is why a single
// repository is used here instead of one repository per product, which does
// not exist for every product.
async function fetchFromGithubTags() {
    const versions = [];
    let url = GITHUB_TAGS_URL;

    for (let page = 0; url && page < MAX_PAGES; page++) {
        const response = await axios.get(url, { timeout: 10000 });

        response.data.forEach((tag) => {
            const version = tag.name.replace(/^v/, '');
            if (RELEASE_VERSION.test(version)) {
                versions.push(version);
            }
        });

        // Follow the pagination Link header until the last page.
        const link = response.headers.link || '';
        const next = link.split(',').find((part) => part.includes('rel="next"'));
        url = next ? next.slice(next.indexOf('<') + 1, next.indexOf('>')) : null;
    }

    return versions;
}

// Fallback endpoint: only lists the currently maintained release branches,
// but better than nothing when the GitHub API is unreachable (e.g. rate
// limited).
async function fetchFromArtifactsApi() {
    const response = await axios.get(ARTIFACTS_API_URL, { timeout: 10000 });

    return response.data.versions
        .filter((version) => RELEASE_VERSION.test(version))
        .reverse();
}

// Returns the list of released versions (newest first), or null when none of
// the endpoints could be reached; the caller then falls back to manual input.
async function fetchVersions() {
    versionStatus.start();

    try {
        const versions = await fetchFromGithubTags();
        if (versions.length > 0) {
            return versions;
        }
    } catch {
        // Fall through to the artifacts API.
    } finally {
        versionStatus.stop();
    }

    versionStatus.start();

    try {
        return await fetchFromArtifactsApi();
    } catch {
        return null;
    } finally {
        versionStatus.stop();
    }
}

module.exports = { fetchVersions };
