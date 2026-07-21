import assert from "node:assert/strict";
import test from "node:test";

async function request(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the Kana Dojo login", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Kana Dojo — Hiragana Practice/);
  assert.match(html, /Find your rhythm/);
  assert.match(html, /Create a new key/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("rejects a malformed user-scoped route", async () => {
  const response = await request("/u/not-a-uuid/practice");
  assert.equal(response.status, 404);
});

test("renders a valid UUIDv4 practice route", async () => {
  const response = await request("/u/5aa92f3c-8df6-43c1-a47f-78008a38c949/practice");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /One word\. Full focus\./);
  assert.match(html, /Adaptive mix/);
});
