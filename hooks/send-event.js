#!/usr/bin/env node
/**
 * Claude Hive - Hook Event Sender
 *
 * This script captures Claude Code hook events and forwards them
 * to the Hive server for visualization.
 *
 * Usage: Configured automatically via `claude-hive setup`
 */

import { request } from 'http';

const HIVE_URL = process.env.CLAUDE_HIVE_URL || 'http://localhost:4520';

async function main() {
  // Read JSON from stdin (Claude Code passes hook data this way)
  let inputData = '';

  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    inputData += chunk;
  }

  if (!inputData.trim()) {
    process.exit(0);
  }

  let event;
  try {
    event = JSON.parse(inputData);
  } catch (err) {
    console.error('[Hive] Failed to parse hook input:', err.message);
    process.exit(0); // Don't block Claude on parse errors
  }

  // Add metadata
  event.timestamp = new Date().toISOString();
  event.project_dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  // Send to Hive server
  const url = new URL('/events', HIVE_URL);

  const postData = JSON.stringify(event);

  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 2000 // Don't block Claude for too long
  };

  const req = request(options, (res) => {
    // Silently consume response
    res.on('data', () => {});
    res.on('end', () => process.exit(0));
  });

  req.on('error', (err) => {
    // Silently fail - don't block Claude Code
    process.exit(0);
  });

  req.on('timeout', () => {
    req.destroy();
    process.exit(0);
  });

  req.write(postData);
  req.end();
}

main().catch(() => process.exit(0));
