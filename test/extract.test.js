const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const tar = require('tar');

const { isExtractable, extract } = require('../lib/extract');

// extract() unpacks into the current working directory, so each test runs
// from its own temporary directory.
async function withTempCwd(run) {
    const previousCwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecdl-extract-test-'));
    process.chdir(dir);

    try {
        await run();
    } finally {
        process.chdir(previousCwd);
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

test('isExtractable accepts archives and rejects system packages', () => {
    for (const ext of ['tar.gz', 'tgz', 'zip']) {
        assert.ok(isExtractable({ ext }), `.${ext} must be extractable`);
    }

    for (const ext of ['deb', 'rpm', 'msi']) {
        assert.ok(!isExtractable({ ext }), `.${ext} must not be extractable`);
    }
});

test('extract unpacks tar.gz and tgz archives into the current directory', async () => {
    await withTempCwd(async () => {
        fs.mkdirSync('src');
        fs.writeFileSync(path.join('src', 'hello.txt'), 'hello from the archive');

        for (const archive of ['archive.tar.gz', 'archive.tgz']) {
            await tar.c({ gzip: true, file: archive, cwd: 'src' }, ['hello.txt']);

            await extract(archive);

            assert.equal(fs.readFileSync('hello.txt', 'utf8'), 'hello from the archive');
            fs.unlinkSync('hello.txt');
        }
    });
});

test('extract unpacks zip archives into the current directory', async () => {
    await withTempCwd(async () => {
        // Smallest valid zip: a bare end-of-central-directory record (the
        // 0x06054b50 signature followed by 18 zero bytes), i.e. an empty
        // archive. Extracting it must succeed and produce nothing.
        const emptyZip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x05, 0x06]), Buffer.alloc(18)]);
        fs.writeFileSync('empty.zip', emptyZip);

        await extract('empty.zip');

        assert.deepEqual(fs.readdirSync('.'), ['empty.zip'], 'nothing must be extracted from an empty archive');
    });
});

test('extract rejects when the archive is corrupt', async () => {
    await withTempCwd(async () => {
        fs.writeFileSync('broken.tar.gz', 'not really a tarball');
        await assert.rejects(extract('broken.tar.gz'));

        fs.writeFileSync('broken.zip', 'not really a zip either');
        await assert.rejects(extract('broken.zip'));
    });
});
