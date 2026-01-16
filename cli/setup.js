/**
 * Claude Hive - Setup Script
 *
 * Installs hooks into Claude Code settings to capture events.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = join(__dirname, '../hooks');
const CLAUDE_SETTINGS_DIR = join(homedir(), '.claude');
const CLAUDE_SETTINGS_PATH = join(CLAUDE_SETTINGS_DIR, 'settings.json');

// Hook configuration to inject
const HIVE_HOOKS = {
  PostToolUse: [
    {
      matcher: '.*',
      hooks: [
        {
          type: 'command',
          command: `node "${join(HOOKS_DIR, 'send-event.js')}"`,
          timeout: 5
        }
      ]
    }
  ],
  Notification: [
    {
      matcher: '.*',
      hooks: [
        {
          type: 'command',
          command: `node "${join(HOOKS_DIR, 'send-event.js')}"`,
          timeout: 5
        }
      ]
    }
  ],
  Stop: [
    {
      matcher: '.*',
      hooks: [
        {
          type: 'command',
          command: `node "${join(HOOKS_DIR, 'send-event.js')}"`,
          timeout: 5
        }
      ]
    }
  ]
};

// Marker to identify Hive hooks
const HIVE_MARKER = '# claude-hive';

export async function setup() {
  console.log(chalk.cyan('\n🐝 Claude Hive - Setup\n'));

  // Ensure .claude directory exists
  if (!existsSync(CLAUDE_SETTINGS_DIR)) {
    mkdirSync(CLAUDE_SETTINGS_DIR, { recursive: true });
    console.log(chalk.green('✓ Created ~/.claude directory'));
  }

  // Read existing settings or create empty object
  let settings = {};
  if (existsSync(CLAUDE_SETTINGS_PATH)) {
    try {
      const content = readFileSync(CLAUDE_SETTINGS_PATH, 'utf8');
      settings = JSON.parse(content);
      console.log(chalk.green('✓ Found existing Claude Code settings'));
    } catch (err) {
      console.log(chalk.yellow('⚠ Could not parse existing settings, creating new'));
    }
  }

  // Initialize hooks object if needed
  if (!settings.hooks) {
    settings.hooks = {};
  }

  // Add Hive hooks (with marker in command for identification)
  for (const [eventName, hookConfigs] of Object.entries(HIVE_HOOKS)) {
    if (!settings.hooks[eventName]) {
      settings.hooks[eventName] = [];
    }

    // Remove any existing Hive hooks first
    settings.hooks[eventName] = settings.hooks[eventName].filter(
      h => !h.hooks?.some(hook => hook.command?.includes('claude-hive') || hook.command?.includes('send-event.js'))
    );

    // Add our hooks
    for (const hookConfig of hookConfigs) {
      settings.hooks[eventName].push(hookConfig);
    }
  }

  // Write updated settings
  writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
  console.log(chalk.green('✓ Installed Hive hooks into Claude Code settings'));

  console.log(chalk.cyan(`
Setup complete! To start monitoring:

  1. Start the Hive server:
     ${chalk.white('npx claude-hive')}

  2. Open the dashboard:
     ${chalk.white('http://localhost:4520')}

  3. Use Claude Code as normal - events will appear in the dashboard!
`));
}

export async function uninstall() {
  console.log(chalk.cyan('\n🐝 Claude Hive - Uninstall\n'));

  if (!existsSync(CLAUDE_SETTINGS_PATH)) {
    console.log(chalk.yellow('No Claude Code settings found'));
    return;
  }

  let settings;
  try {
    settings = JSON.parse(readFileSync(CLAUDE_SETTINGS_PATH, 'utf8'));
  } catch (err) {
    console.log(chalk.red('Failed to read settings:', err.message));
    return;
  }

  if (!settings.hooks) {
    console.log(chalk.yellow('No hooks configured'));
    return;
  }

  // Remove Hive hooks from all event types
  let removed = 0;
  for (const eventName of Object.keys(settings.hooks)) {
    const before = settings.hooks[eventName].length;
    settings.hooks[eventName] = settings.hooks[eventName].filter(
      h => !h.hooks?.some(hook => hook.command?.includes('claude-hive') || hook.command?.includes('send-event.js'))
    );
    removed += before - settings.hooks[eventName].length;

    // Clean up empty arrays
    if (settings.hooks[eventName].length === 0) {
      delete settings.hooks[eventName];
    }
  }

  // Clean up empty hooks object
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
  console.log(chalk.green(`✓ Removed ${removed} Hive hook(s) from Claude Code settings`));
}
