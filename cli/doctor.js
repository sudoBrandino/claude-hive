/**
 * Claude Hive - Doctor Script
 *
 * Diagnoses common issues with the setup.
 */

import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { request } from 'http';
import chalk from 'chalk';

const CLAUDE_SETTINGS_PATH = join(homedir(), '.claude', 'settings.json');
const HIVE_URL = process.env.CLAUDE_HIVE_URL || 'http://localhost:4520';

export async function doctor() {
  console.log(chalk.cyan('\n🐝 Claude Hive - Diagnostics\n'));

  let issues = 0;

  // Check 1: Claude Code settings exist
  console.log(chalk.white('Checking Claude Code settings...'));
  if (existsSync(CLAUDE_SETTINGS_PATH)) {
    console.log(chalk.green('  ✓ Settings file exists'));

    try {
      const settings = JSON.parse(readFileSync(CLAUDE_SETTINGS_PATH, 'utf8'));

      // Check for Hive hooks
      const hasHiveHooks = settings.hooks && Object.values(settings.hooks).some(
        hooks => hooks.some(h => h.hooks?.some(hook =>
          hook.command?.includes('claude-hive') || hook.command?.includes('send-event.js')
        ))
      );

      if (hasHiveHooks) {
        console.log(chalk.green('  ✓ Hive hooks are installed'));
      } else {
        console.log(chalk.red('  ✗ Hive hooks not found'));
        console.log(chalk.yellow('    Run: npx claude-hive setup'));
        issues++;
      }
    } catch (err) {
      console.log(chalk.red('  ✗ Failed to parse settings:', err.message));
      issues++;
    }
  } else {
    console.log(chalk.red('  ✗ Settings file not found'));
    console.log(chalk.yellow('    Run: npx claude-hive setup'));
    issues++;
  }

  // Check 2: Server is running
  console.log(chalk.white('\nChecking Hive server...'));
  try {
    await checkServer();
    console.log(chalk.green('  ✓ Server is running'));
  } catch (err) {
    console.log(chalk.red('  ✗ Server not reachable'));
    console.log(chalk.yellow('    Run: npx claude-hive'));
    issues++;
  }

  // Check 3: Node.js version
  console.log(chalk.white('\nChecking Node.js...'));
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (major >= 18) {
    console.log(chalk.green(`  ✓ Node.js ${nodeVersion} (>= 18 required)`));
  } else {
    console.log(chalk.red(`  ✗ Node.js ${nodeVersion} (>= 18 required)`));
    issues++;
  }

  // Summary
  console.log('');
  if (issues === 0) {
    console.log(chalk.green('All checks passed! Claude Hive is ready to use.\n'));
  } else {
    console.log(chalk.yellow(`Found ${issues} issue(s). Fix them and run doctor again.\n`));
  }

  return issues;
}

function checkServer() {
  return new Promise((resolve, reject) => {
    const url = new URL('/health', HIVE_URL);

    const req = request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      timeout: 2000
    }, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Status ${res.statusCode}`));
      }
      res.on('data', () => {});
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}
