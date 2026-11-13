import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { FILES, MANIFEST, sha256 } from "./sync_data.mjs";

const dir = new URL("../static/data/", import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL(MANIFEST, dir), "utf8"));

test("static/data holds exactly the synced datasets", () => {
  const present = fs.readdirSync(dir).filter((name) => name !== MANIFEST && !name.startsWith(".")).sort();
  assert.deepEqual(present, [...FILES].sort());
  assert.deepEqual(Object.keys(manifest.files).sort(), [...FILES].sort());
});

test("synced datasets match the recorded arboretum-data commit", () => {
  assert.match(manifest.commit, /^[0-9a-f]{40}$/);
  for (const name of FILES) {
    assert.equal(sha256(new URL(name, dir)), manifest.files[name], `${name} was edited or partially synced; rerun npm run sync:data`);
  }
});
