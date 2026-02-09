const path = require('path');
const fs = require('fs');

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

// Calculate column widths
const fileWidth = Math.max(30, Math.max(...results.map(r => r.file.length)) + 2);
const branchWidth = Math.max(25, Math.max(...results.map(r => r.branches.length)) + 2);
const funcWidth = Math.max(25, Math.max(...results.map(r => r.functions.length)) + 2);

// Print header
console.log('\n┌' + '─'.repeat(fileWidth + 2) + '┬' + '─'.repeat(branchWidth + 2) + '┬' + '─'.repeat(funcWidth + 2) + '┐');
console.log('│ ' + 'File'.padEnd(fileWidth) + ' │ ' + 'Untested Branches'.padEnd(branchWidth) + ' │ ' + 'Untested Functions'.padEnd(funcWidth) + ' │');
console.log('├' + '─'.repeat(fileWidth + 2) + '┼' + '─'.repeat(branchWidth + 2) + '┼' + '─'.repeat(funcWidth + 2) + '┤');

// Print rows
results.forEach(row => {
  console.log('│ ' + row.file.padEnd(fileWidth) + ' │ ' + row.branches.padEnd(branchWidth) + ' │ ' + row.functions.padEnd(funcWidth) + ' │');
});

// Print footer
console.log('└' + '─'.repeat(fileWidth + 2) + '┴' + '─'.repeat(branchWidth + 2) + '┴' + '─'.repeat(funcWidth + 2) + '┘\n');

// Print summary
const totalBranches = results.reduce((sum, r) => sum + r.branchCount, 0);
const totalFuncs = results.reduce((sum, r) => sum + r.funcCount, 0);
console.log(`📊 Summary: ${results.length} files with untested code`);
console.log(`   ├─ Total untested branches: ${totalBranches}`);
console.log(`   └─ Total untested functions: ${totalFuncs}\n`);