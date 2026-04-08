import fs from 'fs';
const code = fs.readFileSync('server.ts', 'utf8');
const match = code.match(/const BIST_SYMBOLS = \[(.*?)\];/s);
if (match) {
  const symbols = match[1].split(',').map(s => s.trim().replace(/"/g, ''));
  const unique = [...new Set(symbols)];
  console.log("Total:", symbols.length);
  console.log("Unique:", unique.length);
}
