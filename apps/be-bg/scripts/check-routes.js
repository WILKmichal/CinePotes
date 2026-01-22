#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const routesFile = path.join(__dirname, '../routes.txt');
const testDir = path.join(__dirname, '../bruno/test_ci');

// Read routes from routes.txt
const routes = fs
  .readFileSync(routesFile, 'utf-8')
  .split('\n')
  .filter(line => line.trim());

// Get all .bru files recursively from bruno/test_ci
function getAllBruFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.bru')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

const bruFiles = getAllBruFiles(testDir);

// Convert routes to searchable format
// E.g., "GET /auth/login" -> "GET_auth_login"
function routeToFileName(route) {
  const [method, ...pathParts] = route.split(' ');
  const pathStr = pathParts.join(' ').replace(/\//g, '_').replace(/^_/, '').replace(/{.*?}/g, 'by_id');
  return `${method}_${pathStr}`; /* --NOSONAR */
}

// Check if a route has a corresponding test
function findTestForRoute(route) {
  const searchPattern = routeToFileName(route);
  return bruFiles.find(file => {
    const fileName = path.basename(file, '.bru');
    return fileName === searchPattern || fileName.startsWith(searchPattern);
  });
}

// Results
const results = {
  found: [],
  missing: []
};

routes.forEach(route => {
  const test = findTestForRoute(route);
  if (test) {
    results.found.push({ route, test: path.relative(testDir, test) });
  } else {
    results.missing.push(route);
  }
});

// Output results
console.log('\n📋 Route Test Coverage Report\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log(`\n✅ Routes with tests (${results.found.length}):`);
results.found.forEach(({ route, test }) => {
  console.log(`   ${route}`);
  console.log(`      → ${test}`);
});

if (results.missing.length > 0) {
  console.log(`\n❌ Routes missing tests (${results.missing.length}):`);
  results.missing.forEach(route => {
    console.log(`   ${route}`);
  });
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\nTotal routes: ${routes.length}`);
console.log(`Coverage: ${((results.found.length / routes.length) * 100).toFixed(1)}%\n`);

// Exit with error code if there are missing tests
process.exit(results.missing.length > 0 ? 1 : 0);
