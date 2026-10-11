import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
export const MAX_INPUT_BYTES = 200000;
export async function readSketch(file) {
  const handle = await open(file, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0));
  try {
    const info = await handle.stat();
    if (!info.isFile()) throw Error('Input must be a regular file.');
    if (info.size > MAX_INPUT_BYTES) throw Error('Input limit: 200 KB.');
    // A growing file cannot expand this allocation or the amount read.
    const buffer = Buffer.alloc(MAX_INPUT_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > MAX_INPUT_BYTES) throw Error('Input limit: 200 KB.');
    const source = new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, length));
    if (source.includes('\0')) throw Error('Input contains binary data.');
    return source;
  } finally { await handle.close(); }
}
