#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { readSketch } from './cli-input.mjs';
import path from 'node:path';
import { convert, VERSION } from './dist/converter.mjs';
const usage = `InoQuill ${VERSION} by TabGrinder
Arduino keyboard Sketch to DuckyScript

Usage: node cli.mjs INPUT [options]
  --target 1.0|2.0|3.0       Output language (default: 3.0)
  --device ID                Device preset; see the wiki
  --out FILE                 Write a new script file; never overwrite
  --report FILE              Write a new review report
  --loop once|repeat|setup    Entry-point mode (default: once)
  --delay N                  Additional startup delay in milliseconds
  --no-comments              Omit structural comments
  --help                     Show this help

For educational purposes only. Use only with explicit authorization.
Output is source text; review it and follow the loading instructions for your device.
`;
const args = process.argv.slice(2), options = { loop: 'once', initialDelay: 0, comments: true, target: '3.0', device: 'generic' };
let input, output, report;
try {
  if (args.includes('--help')) { process.stdout.write(usage); process.exit(0); }
  for (let i = 0; i < args.length; i++) {
    const argument = args[i];
    if (argument === '--no-comments') options.comments = false;
    else if (['--out', '--report', '--loop', '--delay', '--target', '--device'].includes(argument)) {
      const value = args[++i]; if (!value || value.startsWith('--')) throw Error('Missing value for ' + argument);
      if (argument === '--out') output = value;
      if (argument === '--report') report = value;
      if (argument === '--loop') options.loop = value;
      if (argument === '--target') options.target = value;
      if (argument === '--device') options.device = value;
      if (argument === '--delay') {
        if (!value.trim()) throw Error('Missing numeric value for --delay.');
        options.initialDelay = Number(value);
      }
    } else if (argument.startsWith('-')) throw Error('Unknown option: ' + argument);
    else if (!input) input = argument;
    else throw Error('Only one input file is accepted.');
  }
  if (!input) throw Error('An input sketch is required. Use --help.');
  if (output && report && path.resolve(output) === path.resolve(report)) throw Error('Script and report must use different output paths.');
  const source = await readSketch(input);
  const result = convert(source, options);
  for (const d of result.diagnostics) process.stderr.write(d.severity.toUpperCase() + ' line ' + d.line + ': ' + d.message + '\n');
  if (report) { const { partialScript, ...review } = result; await writeFile(report, JSON.stringify({ ...review, partialOutputExcluded: true }, null, 2) + '\n', { flag: 'wx' }); }
  if (!result.ok) { process.exitCode = 1; }
  else if (output) await writeFile(output, result.script, { flag: 'wx' });
  else process.stdout.write(result.script);
} catch (error) { process.stderr.write('InoQuill: ' + (error.code === 'EEXIST' ? 'Refusing to overwrite an existing file.' : error.message) + '\n'); process.exitCode = 2; }
