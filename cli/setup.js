/**
 * Claude Hive - Setup Script
 *
 * Installs hooks into Claude Code settings to capture events.
 * Supports both native (Node.js) and Docker (bash/curl) modes.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = join(__dirname, '../hooks');
const CLAUDE_SETTINGS_DIR = join(homedir(), '.claude');
const CLAUDE_SETTINGS_PATH = join(CLAUDE_SETTINGS_DIR, 'settings.json');

// Get hook command based on mode
function getHookCommand(mode = 'native') {
  if (mode === 'docker') {
    // Bash script - no Node.js required on host
    const scriptPath = join(HOOKS_DIR, 'send-event.sh');
    return `bash "${scriptPath}"`;
  }
  // Native mode - uses Node.js
  return `node "${join(HOOKS_DIR, 'send-event.js')}"`;
}

// Build hook configuration
function buildHooks(mode) {
  const command = getHookCommand(mode);

  return {
    PostToolUse: [
      {
        matcher: '.*',
        hooks: [{ type: 'command', command, timeout: 5 }]
      }
    ],
    Notification: [
      {
        matcher: '.*',
        hooks: [{ type: 'command', command, timeout: 5 }]
      }
    ],
    Stop: [
      {
        matcher: '.*',
        hooks: [{ type: 'command', command, timeout: 5 }]
      }
    ]
  };
}

export async function setup(options = {}) {
  const mode = options.docker ? 'docker' : 'native';

  console.log(chalk.cyan('\n🐝 Claude Hive - Setup\n'));
  console.log(chalk.white(`Mode: ${mode === 'docker' ? 'Docker (bash/curl)' : 'Native (Node.js)'}\n`));

  // Make bash script executable
  if (mode === 'docker') {
    const bashScript = join(HOOKS_DIR, 'send-event.sh');
    if (existsSync(bashScript)) {
      try {
        chmodSync(bashScript, '755');
      } catch (err) {
        // Ignore chmod errors on Windows
      }
    }
  }

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

  const HIVE_HOOKS = buildHooks(mode);

  // Add Hive hooks
  for (const [eventName, hookConfigs] of Object.entries(HIVE_HOOKS)) {
    if (!settings.hooks[eventName]) {
      settings.hooks[eventName] = [];
    }

    // Remove any existing Hive hooks first
    settings.hooks[eventName] = settings.hooks[eventName].filter(
      h => !h.hooks?.some(hook =>
        hook.command?.includes('claude-hive') ||
        hook.command?.includes('send-event.js') ||
        hook.command?.includes('send-event.sh')
      )
    );

    // Add our hooks
    for (const hookConfig of hookConfigs) {
      settings.hooks[eventName].push(hookConfig);
    }
  }

  // Write updated settings
  writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
  console.log(chalk.green('✓ Installed Hive hooks into Claude Code settings'));

  if (mode === 'docker') {
    console.log(chalk.cyan(`
Setup complete! To start monitoring:

  1. Start the container:
     ${chalk.white('docker compose up -d')}

  2. Open the dashboard:
     ${chalk.white('http://localhost:4520')}

  3. Use Claude Code as normal - events will appear in the dashboard!

  Note: Requires ${chalk.yellow('curl')} and ${chalk.yellow('jq')} on your system.
  Install with: ${chalk.white('brew install jq')} or ${chalk.white('apt install jq')}
`));
  } else {
    console.log(chalk.cyan(`
Setup complete! To start monitoring:

  1. Start the Hive server:
     ${chalk.white('npm start')}

  2. Open the dashboard:
     ${chalk.white('http://localhost:4520')}

  3. Use Claude Code as normal - events will appear in the dashboard!
`));
  }
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
      h => !h.hooks?.some(hook =>
        hook.command?.includes('claude-hive') ||
        hook.command?.includes('send-event.js') ||
        hook.command?.includes('send-event.sh')
      )
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
