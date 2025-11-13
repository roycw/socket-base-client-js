/**
 * Simple test runner for Node.js
 * Provides basic describe/it/beforeEach/afterEach functionality
 */

let currentSuite = null;
let tests = [];
let beforeEaches = [];
let afterEaches = [];
let passed = 0;
let failed = 0;

export function describe(name, fn) {
  const suite = { name, tests: [], beforeEaches: [], afterEaches: [] };
  const prevSuite = currentSuite;
  currentSuite = suite;
  
  fn();
  
  currentSuite = prevSuite;
  
  if (prevSuite) {
    prevSuite.tests.push(suite);
  } else {
    tests.push(suite);
  }
}

export function it(name, fn) {
  if (currentSuite) {
    currentSuite.tests.push({ name, fn, type: 'test' });
  } else {
    tests.push({ name, fn, type: 'test' });
  }
}

export function beforeEach(fn) {
  if (currentSuite) {
    currentSuite.beforeEaches.push(fn);
  } else {
    beforeEaches.push(fn);
  }
}

export function afterEach(fn) {
  if (currentSuite) {
    currentSuite.afterEaches.push(fn);
  } else {
    afterEaches.push(fn);
  }
}

async function runTests(suite, indent = '') {
  const suiteBeforeEaches = suite.beforeEaches || [];
  const suiteAfterEaches = suite.afterEaches || [];
  
  console.log(`${indent}${suite.name}`);
  
  for (const item of suite.tests) {
    if (item.type === 'test') {
      // Run test
      try {
        // Run all beforeEaches (suite and global)
        for (const fn of [...beforeEaches, ...suiteBeforeEaches]) {
          await fn();
        }
        
        await item.fn();
        
        // Run all afterEaches (suite and global)
        for (const fn of [...suiteAfterEaches, ...afterEaches]) {
          await fn();
        }
        
        console.log(`${indent}  ✓ ${item.name}`);
        passed++;
      } catch (error) {
        console.error(`${indent}  ✗ ${item.name}`);
        console.error(`${indent}    ${error.message}`);
        if (error.stack) {
          console.error(error.stack.split('\n').slice(1, 5).join('\n'));
        }
        failed++;
      }
    } else {
      // Nested suite
      await runTests(item, indent + '  ');
    }
  }
}

export async function run() {
  console.log('\nRunning tests...\n');
  
  for (const suite of tests) {
    await runTests(suite);
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log(`${'='.repeat(50)}\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

