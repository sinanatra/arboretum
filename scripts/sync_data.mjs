// Copy the website's datasets from the arboretum-data checkout into static/data.
//
// arboretum-data is the only source for these files; this copy exists so the
// app can serve them locally and include them in a build. This directory is
// git-ignored. The sync refuses uncommitted data so the
// recorded commit always identifies exactly what was copied.
//
// Usage: npm run sync:data [-- path/to/arboretum-data]   (default ../arboretum-data)
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const FILES = ["plants.json", "relations.json", "curators.json"];
export const MANIFEST = "source.json";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "static/data");

export const sha256 = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function main() {
  const source = path.resolve(root, process.argv[2] ?? process.env.ARBORETUM_DATA_DIR ?? "../arboretum-data");
  const git = (...args) => execFileSync("git", ["-C", source, ...args], { encoding: "utf8" }).trim();
  const dataDir = path.join(source, "data");

  for (const name of FILES) {
    if (!fs.existsSync(path.join(dataDir, name))) throw new Error(`missing ${path.join(dataDir, name)}`);
  }
  const dirty = git("status", "--porcelain", "--", ...FILES.map((name) => `data/${name}`));
  if (dirty) throw new Error(`commit the rebuilt data in ${source} before syncing:\n${dirty}`);

  const manifest = {
    repository: "rodighiero/arboretum-data",
    commit: git("rev-parse", "HEAD"),
    committed: git("log", "-1", "--format=%cI"),
    files: {},
  };
  // Stage all copies first so a failure never leaves a partial mix of versions.
  fs.mkdirSync(target, { recursive: true });
  const staging = fs.mkdtempSync(path.join(target, ".sync-"));
  try {
    for (const name of FILES) {
      fs.copyFileSync(path.join(dataDir, name), path.join(staging, name));
      JSON.parse(fs.readFileSync(path.join(staging, name), "utf8"));
      manifest.files[name] = sha256(path.join(staging, name));
    }
    for (const name of FILES) fs.renameSync(path.join(staging, name), path.join(target, name));
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
  fs.writeFileSync(path.join(target, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`synced ${FILES.join(", ")} from ${manifest.repository}@${manifest.commit.slice(0, 7)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
