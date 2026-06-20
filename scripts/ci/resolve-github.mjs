import { execSync } from "node:child_process";
import { resolveCi, printAndWrite } from "./core.mjs";

function sh(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: "/bin/bash",
  }).trim();
}

const eventName = process.env.GITHUB_EVENT_NAME;

let changedFiles = [];

if (eventName === "pull_request") {
  const base = process.env.GITHUB_BASE_REF;
  if (!base) throw new Error("GITHUB_BASE_REF is required for pull_request events.");

  sh(`git fetch origin "${base}" --depth=1`);
  changedFiles = sh(`git diff --name-only "origin/${base}...HEAD"`).split("\n").filter(Boolean);
} else if (eventName === "push") {
  const before = process.env.GITHUB_EVENT_BEFORE;
  const sha = process.env.GITHUB_SHA || "HEAD";

  if (!before || /^0+$/.test(before)) {
    changedFiles = sh("git diff --name-only HEAD~1 HEAD").split("\n").filter(Boolean);
  } else {
    changedFiles = sh(`git diff --name-only "${before}" "${sha}"`).split("\n").filter(Boolean);
  }
} else if (eventName === "workflow_dispatch") {
  changedFiles = [
    "agent-studio/package.json",
    "extensions-studio/package.json",
  ];
} else {
  throw new Error(`Unsupported GitHub event: ${eventName}`);
}

printAndWrite(resolveCi({
  eventName,
  changedFiles,
}));
