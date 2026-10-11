import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { readSketch, MAX_INPUT_BYTES } from '../cli-input.mjs';
test('bounded CLI input accepts UTF-8/BOM and rejects non-files, invalid encoding, binary and oversized data', async()=>{
 const root=await mkdtemp('/tmp/inoquill-input-');
 try {
  await assert.rejects(readSketch(root),/regular file/);
  const file=root+'/source.ino';
  await writeFile(file,'\uFEFFvoid setup(){}');assert.equal(await readSketch(file),'void setup(){}');
  await writeFile(file,Buffer.from([0xff,0xfe,0x61]));await assert.rejects(readSketch(file),/encoded data/);
  await writeFile(file,'void\0setup(){}');await assert.rejects(readSketch(file),/binary/);
  await writeFile(file,'a'.repeat(MAX_INPUT_BYTES));assert.equal((await readSketch(file)).length,MAX_INPUT_BYTES);
  await writeFile(file,'a'.repeat(MAX_INPUT_BYTES+1));await assert.rejects(readSketch(file),/200 KB/);
 } finally {await rm(root,{recursive:true,force:true});}
});
