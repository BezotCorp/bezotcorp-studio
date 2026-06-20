import { resolveCi, printAndWrite } from "./core.mjs";

const eventArg = process.argv.includes("--event")
  ? process.argv[process.argv.indexOf("--event") + 1]
  : "push";

const files = process.argv.filter((arg, index) => {
  if (arg === "--event") return false;
  if (process.argv[index - 1] === "--event") return false;
  return index > 1;
});

if (files.length === 0) {
  throw new Error("Usage: node scripts/ci/resolve-dry.mjs --event push extensions-studio/package.json");
}

printAndWrite(resolveCi({
  eventName: eventArg,
  changedFiles: files,
}));
