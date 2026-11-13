import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchJson } from "../src/lib/data.js";

test("dataset requests reject HTTP errors even when the response contains JSON", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({
    ok: false, status: 404, json: async () => ({ error: "missing" }),
  }));
  await assert.rejects(fetchJson("data/plants.json"), /HTTP 404/);
});

test("dataset requests preserve data and expose network and JSON failures", async (t) => {
  const response = [{ PLANTID: "001*A" }];
  const mock = t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => response }));
  assert.deepEqual(await fetchJson("data/plants.json"), response);
  mock.mock.mockImplementation(async () => { throw new Error("offline"); });
  await assert.rejects(fetchJson("data/plants.json"), /offline/);
  mock.mock.mockImplementation(async () => ({ ok: true, json: async () => { throw new SyntaxError("invalid JSON"); } }));
  await assert.rejects(fetchJson("data/plants.json"), /invalid JSON/);
});
