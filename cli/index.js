#!/usr/bin/env node
/**
 * Claude Hive CLI
 *
 * Commands:
 *   claude-hive          Start the server
 *   claude-hive setup    Install hooks into Claude Code
 *   claude-hive doctor   Diagnose issues
 *   claude-hive uninstall Remove hooks
 */

import { Command } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const program = new Command();

program
  .name('claude-hive')
  .description('3D visualization for Claude Code agents')
  .version('0.1.0');

program
  .command('start', { isDefault: true })
  .description('Start the Hive server')
  .option('-p, --port <port>', 'Port to listen on', '4520')
  .action(async (options) => {
    process.env.PORT = options.port;
    await import('../server/index.js');
  });

program
  .command('setup')
  .description('Install hooks into Claude Code')
  .option('-d, --docker', 'Use Docker mode (bash/curl hooks, no Node.js required)')
  .action(async (options) => {
    const { setup } = await import('./setup.js');
    await setup({ docker: options.docker });
  });

program
  .command('doctor')
  .description('Diagnose common issues')
  .action(async () => {
    const { doctor } = await import('./doctor.js');
    await doctor();
  });

program
  .command('uninstall')
  .description('Remove hooks from Claude Code')
  .action(async () => {
    const { uninstall } = await import('./setup.js');
    await uninstall();
  });

program.parse();
