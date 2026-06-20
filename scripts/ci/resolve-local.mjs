import { execSync } from "node:child_process";
import { resolveCi, printAndWrite } from "./core.mjs";

function sh(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: "/bin/bash",
  }).trim();
}

const mode = process.argv[2] ?? "pr";
const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "dev";

let eventName;
let diffCommand;

if (mode === "push") {
  eventName = "push";
  diffCommand = "git diff --name-only @{u}..HEAD";
} else if (mode === "pr") {
  eventName = "pull_request";
  sh(`git fetch origin "${base}" --depth=1`);
  diffCommand = `git diff --name-only "origin/${base}...HEAD"`;
} else {
  throw new Error("Usage: node scripts/ci/resolve-local.mjs pr --base dev OR node scripts/ci/resolve-local.mjs push");
}

const changedFiles = sh(diffCommand).split("\n").filter(Boolean);

printAndWrite(resolveCi({
  eventName,
  changedFiles,
}));
