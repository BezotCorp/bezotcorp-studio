import fs from 'node:fs';
import path from 'node:path';

export const root = process.cwd();

export function exists(file) {
  return fs.existsSync(path.join(root, file));
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function readOptionalJson(file) {
  if (!exists(file)) return {};
  return readJson(file);
}

export function findComponents() {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((dir) => exists(`${dir}/package.json`) || exists(`${dir}/Cargo.toml`))
    .map((dir) => {
      const hasPackage = exists(`${dir}/package.json`);
      const hasCargo = exists(`${dir}/Cargo.toml`);
      const pkg = hasPackage ? readJson(`${dir}/package.json`) : null;
      const ci = readOptionalJson(`${dir}/.studio-ci.json`);

      let type = ci.type ?? 'unknown';
      if (type === 'unknown') {
        if (hasPackage && hasCargo) type = 'mixed';
        else if (hasPackage) type = 'node';
        else if (hasCargo) type = 'rust';
      }

      return {
        name: dir,
        path: dir,
        type,
        events: ci.events ?? ['push', 'pull_request'],
        packageName: pkg?.name ?? null,
        private: pkg?.private === true,
        scripts: pkg?.scripts ?? {},
        dependencies: {
          ...(pkg?.dependencies ?? {}),
          ...(pkg?.devDependencies ?? {}),
          ...(pkg?.optionalDependencies ?? {}),
        },
        ci,
      };
    });
}

function localDependencyName(value, fromComponentPath, components) {
  if (typeof value !== 'string' || !value.startsWith('file:')) return null;
  const resolved = path.normalize(path.join(fromComponentPath, value.slice('file:'.length)));
  return components.find((component) => component.path === resolved)?.name ?? null;
}

export function buildReverseDependencyGraph(components) {
  const dependedBy = new Map(components.map((component) => [component.name, new Set()]));

  for (const component of components) {
    for (const depVersion of Object.values(component.dependencies)) {
      const localDep = localDependencyName(depVersion, component.path, components);
      if (localDep) dependedBy.get(localDep)?.add(component.name);
    }
  }

  return dependedBy;
}

export function directlyChangedComponents(changedFiles, components) {
  const changed = new Set();

  for (const file of changedFiles) {
    for (const component of components) {
      if (file === component.path || file.startsWith(`${component.path}/`)) {
        changed.add(component.name);
      }
    }
  }

  return changed;
}

export function resolveAffected(initial, dependedBy) {
  const affected = new Set(initial);
  const queue = [...initial];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const dependent of dependedBy.get(current) ?? []) {
      if (affected.has(dependent)) continue;
      affected.add(dependent);
      queue.push(dependent);
    }
  }

  return affected;
}

function nodeSteps(component) {
  const steps = [];
  const scripts = component.scripts;
  const wanted = component.ci.steps ?? 'auto';

  const add = (key, name, command) => {
    if (wanted !== 'auto' && !wanted.includes(key)) return;
    if (key !== 'install' && key !== 'pack' && !scripts[key]) return;
    steps.push({ name, command });
  };

  add('install', 'Install dependencies', exists(`${component.path}/package-lock.json`) ? 'npm ci' : 'npm install');
  add('lint', 'Lint', 'npm run lint');
  add('typecheck', 'Typecheck', 'npm run typecheck');
  add('test', 'Test', 'npm test');
  add('build', 'Build', 'npm run build');
  add('build:lib', 'Build library', 'npm run build:lib');
  add('build:skills', 'Build skills catalog', 'npm run build:skills');

  if (!component.private && (wanted === 'auto' || wanted.includes('pack'))) {
    steps.push({ name: 'Verify package contents', command: 'npm pack --dry-run' });
  }

  return steps;
}

function rustSteps(component) {
  const wanted = component.ci.steps ?? 'auto';
  const steps = [
    ['fmt', 'Format check', 'cargo fmt --check'],
    ['clippy', 'Clippy', 'cargo clippy --all-targets --all-features -- -D warnings'],
    ['test', 'Test', 'cargo test --all-features'],
    ['build', 'Build', 'cargo build --all-features'],
  ];

  return steps
    .filter(([key]) => wanted === 'auto' || wanted.includes(key))
    .map(([, name, command]) => ({ name, command }));
}

export function componentSteps(component) {
  if (component.type === 'node') return nodeSteps(component);
  if (component.type === 'rust') return rustSteps(component);
  if (component.type === 'mixed') return [...nodeSteps(component), ...rustSteps(component)];
  return [];
}

export function resolveCi({ changedFiles, eventName }) {
  const components = findComponents();
  const eventComponents = components.filter((component) => component.events.includes(eventName));
  const changed = directlyChangedComponents(changedFiles, components);
  const dependedBy = buildReverseDependencyGraph(components);
  const affected = resolveAffected(changed, dependedBy);

  const matrix = {
    include: eventComponents
      .filter((component) => affected.has(component.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((component) => ({
        name: component.name,
        type: component.type,
        workingDirectory: component.path,
        steps: componentSteps(component),
      }))
      .filter((component) => component.steps.length > 0),
  };

  return {
    eventName,
    changedFiles,
    components: components.map((component) => ({
      name: component.name,
      type: component.type,
      events: component.events,
      packageName: component.packageName,
    })),
    directlyChanged: [...changed],
    affected: [...affected],
    matrix,
  };
}

export function printAndWrite(result) {
  const verbose = process.argv.includes('--verbose') || process.env.CI_VERBOSE === 'true';

  if (verbose) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      JSON.stringify(
        {
          eventName: result.eventName,
          changedFilesCount: result.changedFiles.length,
          directlyChanged: result.directlyChanged,
          affected: result.affected,
          matrix: result.matrix,
        },
        null,
        2,
      ),
    );
  }

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${JSON.stringify(result.matrix)}\n`);
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `has_affected=${result.matrix.include.length > 0 ? 'true' : 'false'}\n`,
    );
  }
}
