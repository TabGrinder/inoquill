import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const ROOT_FILES = ['package.json','README.md','LICENSE','DISCLAIMER.md','SECURITY.md','CONTRIBUTING.md','CODE_OF_CONDUCT.md','server.mjs','cli.mjs','cli-input.mjs','.gitignore'];
const ROOT_DIRS = ['dist','tests','scripts','docs','wiki','examples','.github'];
const excluded = new Set(['inoquill-source.zip','inoquill-source.zip.sha256','sketchduck-source.zip']);
const files = [];
async function collect(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a,b)=>a.name.localeCompare(b.name))) {
    const name = path.posix.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw Error('Symlinks are excluded from release packages: ' + name);
    if (excluded.has(entry.name)) continue;
    if (entry.isDirectory()) await collect(name);
    else files.push(name);
  }
}
for (const file of ROOT_FILES) files.push(file);
for (const directory of ROOT_DIRS) await collect(directory);
// Dependency-free ZIP, stored entries, fixed DOS timestamp for reproducibility.
const table = Array.from({ length: 256 }, (_, value) => { let c = value; for(let i=0;i<8;i++) c=(c&1)?0xedb88320^(c>>>1):c>>>1; return c>>>0; });
const crc32 = bytes => { let value=0xffffffff; for(const byte of bytes) value=table[(value^byte)&255]^(value>>>8); return (value^0xffffffff)>>>0; };
const chunks=[], central=[]; let offset=0;
for (const file of [...new Set(files)].sort()) {
  const content=await readFile(file), name=Buffer.from('inoquill/'+file), crc=crc32(content);
  const local=Buffer.alloc(30); local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(20,4); local.writeUInt16LE(0x800,6); local.writeUInt16LE(33,12); local.writeUInt32LE(crc,14); local.writeUInt32LE(content.length,18); local.writeUInt32LE(content.length,22); local.writeUInt16LE(name.length,26);
  const item=Buffer.alloc(46); item.writeUInt32LE(0x02014b50,0); item.writeUInt16LE(20,4); item.writeUInt16LE(20,6); item.writeUInt16LE(0x800,8); item.writeUInt16LE(33,14); item.writeUInt32LE(crc,16); item.writeUInt32LE(content.length,20); item.writeUInt32LE(content.length,24); item.writeUInt16LE(name.length,28); item.writeUInt32LE(offset,42);
  chunks.push(local,name,content);central.push(item,name);offset+=local.length+name.length+content.length;
}
const centralBytes=Buffer.concat(central), end=Buffer.alloc(22); end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(files.length,8); end.writeUInt16LE(files.length,10); end.writeUInt32LE(centralBytes.length,12); end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...chunks,centralBytes,end]); await mkdir('releases',{recursive:true});await writeFile('releases/inoquill-source.zip',zip);
await writeFile('releases/inoquill-source.zip.sha256',createHash('sha256').update(zip).digest('hex')+'  inoquill-source.zip\n');
console.log('Prepared deterministic source ZIP: '+files.length+' files, '+zip.length+' bytes.');
