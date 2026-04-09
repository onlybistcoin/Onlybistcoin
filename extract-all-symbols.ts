
import fs from 'fs';

const appContent = fs.readFileSync('src/App.tsx', 'utf-8');

const bistMatch = appContent.match(/const BIST_STOCKS = \[([\s\S]*?)\];/);
const cryptoMatch = appContent.match(/const CRYPTO_STOCKS = \[([\s\S]*?)\];/);
const commodityMatch = appContent.match(/const COMMODITY_STOCKS = \[([\s\S]*?)\];/);

function extractSymbols(match: any) {
  if (!match) return [];
  const content = match[1];
  const symbols: string[] = [];
  const regex = /\["([^"]+)"/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    symbols.push(m[1]);
  }
  return symbols;
}

const bistSymbols = extractSymbols(bistMatch);
const cryptoSymbols = extractSymbols(cryptoMatch);
const commoditySymbols = extractSymbols(commodityMatch);

console.log("BIST Symbols:", JSON.stringify(bistSymbols));
console.log("Crypto Symbols:", JSON.stringify(cryptoSymbols));
console.log("Commodity Symbols:", JSON.stringify(commoditySymbols));
