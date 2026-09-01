import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

import { download } from '../lib/download.js';

const ARCH = { id: 'linux-x86_64', name: 'LINUX 64-BIT', suffix: 'linux-x86_64', ext: 'tar.gz' };

// Runs a download against a local HTTP server so the network behavior of
// download() can be exercised offline, from a fresh temporary directory.
async function withServer(handler, run) {
    const server = http.createServer(handler);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const product = {
        name: 'Test Product',
        path: 'test',
        slug: 'test-product',
        baseUrl: `http://127.0.0.1:${server.address().port}`,
    };
    const filename = `${product.slug}-1.0.0-${ARCH.suffix}.${ARCH.ext}`;

    const previousCwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecdl-test-'));
    process.chdir(dir);

    try {
        await run(product, filename);
    } finally {
        process.chdir(previousCwd);
        await new Promise((resolve) => server.close(resolve));
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

test('download resolves and writes the file on success', async () => {
    await withServer(
        (req, res) => {
            res.writeHead(200, { 'Content-Length': '5' });
            res.end('hello');
        },
        async (product, filename) => {
            const result = await download({ product, arch: ARCH, version: '1.0.0' });

            assert.equal(result, filename);
            assert.equal(fs.readFileSync(filename, 'utf8'), 'hello');
        }
    );
});

test('download rejects with "File not found" on 404', async () => {
    await withServer(
        (req, res) => {
            res.writeHead(404);
            res.end('missing');
        },
        async (product, filename) => {
            await assert.rejects(
                download({ product, arch: ARCH, version: '1.0.0' }),
                { message: 'File not found :/' }
            );
            assert.ok(!fs.existsSync(filename), 'no file must be created on 404');
        }
    );
});

test('download surfaces the status of non-404 failures', async () => {
    await withServer(
        (req, res) => {
            res.writeHead(503);
            res.end('unavailable');
        },
        async (product, filename) => {
            await assert.rejects(
                download({ product, arch: ARCH, version: '1.0.0' }),
                { message: 'Download failed (HTTP 503) :/' }
            );
            assert.ok(!fs.existsSync(filename), 'no file must be created on failure');
        }
    );
});

test('download rejects when the target file already exists', async () => {
    await withServer(
        (req, res) => {
            res.writeHead(200);
            res.end('new content');
        },
        async (product, filename) => {
            fs.writeFileSync(filename, 'leftover');

            await assert.rejects(
                download({ product, arch: ARCH, version: '1.0.0' }),
                { message: `File already exists! Abort. (${filename})` }
            );
            assert.equal(fs.readFileSync(filename, 'utf8'), 'leftover', 'the existing file must be untouched');
        }
    );
});

test('download rejects and removes the partial file when the transfer stalls', async () => {
    await withServer(
        (req, res) => {
            // Send some data, then go silent without closing the connection.
            res.writeHead(200, { 'Content-Length': '1000' });
            res.write('partial data');
        },
        async (product, filename) => {
            await assert.rejects(
                download({ product, arch: ARCH, version: '1.0.0' }, { stallTimeoutMs: 200 }),
                /Download stalled/
            );
            assert.ok(!fs.existsSync(filename), 'the partial file must be removed');
        }
    );
});

test('download rejects and removes the partial file when the stream drops', async () => {
    await withServer(
        (req, res) => {
            // Announce more data than will be sent, then drop the connection.
            res.writeHead(200, { 'Content-Length': '1000' });
            res.write('partial data');
            setTimeout(() => res.destroy(), 50);
        },
        async (product, filename) => {
            await assert.rejects(download({ product, arch: ARCH, version: '1.0.0' }));
            assert.ok(!fs.existsSync(filename), 'the partial file must be removed');
        }
    );
});
