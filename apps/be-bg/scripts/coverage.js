const path = require('node:path');
const fs = require('node:fs');

const coveragePath = path.join(__dirname, '../coverage/coverage-final.json');
if (!fs.existsSync(coveragePath)) {
  console.error('Coverage file not found at:', coveragePath);
  process.exit(1);
}

const c = require(coveragePath);

const results = [];

Object.entries(c).forEach(([f, d]) => {
  const untestedBranches = new Set();
  const untestedFuncs = new Set();
  
  // Parse branches
  if (d.branchMap) {
    Object.entries(d.branchMap).forEach(([branchId, branch]) => {
      if (d.b && d.b[branchId] && d.b[branchId].every(count => count === 0)) {
        untestedBranches.add(branch.loc.start.line);
      }
    });
  }
  
  // Parse functions
  if (d.fnMap) {
    Object.entries(d.fnMap).forEach(([funcId, func]) => {
      if (d.f && d.f[funcId] === 0) {
        untestedFuncs.add(func.loc.start.line);
      }
    });
  }
  
  if (untestedBranches.size > 0 || untestedFuncs.size > 0) {
    const branchLines = Array.from(untestedBranches).sort((a, b) => a - b);
    const funcLines = Array.from(untestedFuncs).sort((a, b) => a - b);
    
    results.push({
      file: f.replace(process.cwd(), ''),
      branches: branchLines.length > 0 ? branchLines.join(', ') : '—',
      functions: funcLines.length > 0 ? funcLines.join(', ') : '—',
      branchCount: branchLines.length,
      funcCount: funcLines.length
    });
  }
});

// Sort by total untested count
results.sort((a, b) => (b.branchCount + b.funcCount) - (a.branchCount + a.funcCount));

// Print header
console.log('\n📊 UNTESTED LINES BY BRANCH & FUNCTION\n');
console.log('File'.padEnd(45) + ' | ' + 'Untested Branches'.padEnd(25) + ' | ' + 'Untested Functions');
console.log('-'.repeat(45) + '-+-' + '-'.repeat(25) + '-+-' + '-'.repeat(30));

// Print rows
results.forEach(row => {
  console.log(row.file.padEnd(45) + ' | ' + row.branches.padEnd(25) + ' | ' + row.functions);
});

// Print summary
console.log('-'.repeat(110) + '\n');
const totalBranches = results.reduce((sum, r) => sum + r.branchCount, 0);
const totalFuncs = results.reduce((sum, r) => sum + r.funcCount, 0);
console.log(`✅ Files: ${results.length}  |  Untested Branches: ${totalBranches}  |  Untested Functions: ${totalFuncs}\n`);