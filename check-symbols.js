import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const bistMatch = content.match(/const BIST_STOCKS = \[([\s\S]*?)\]\.map/);
if (bistMatch) {
  const str = bistMatch[1];
  const matches = [...str.matchAll(/\["([^"]+)"/g)];
  matches.forEach(m => {
    if (!/^[A-Z0-9=\-\.]+$/.test(m[1])) {
      console.log("Invalid BIST symbol:", JSON.stringify(m[1]));
    }
  });
}
const cryptoMatch = content.match(/const CRYPTO_COINS = \[([\s\S]*?)\]\.map/);
if (cryptoMatch) {
  const str = cryptoMatch[1];
  const matches = [...str.matchAll(/\["([^"]+)"/g)];
  matches.forEach(m => {
    if (!/^[A-Z0-9=\-\.]+$/.test(m[1])) {
      console.log("Invalid Crypto symbol:", JSON.stringify(m[1]));
    }
  });
}
const commMatch = content.match(/const COMMODITY_ITEMS = \[([\s\S]*?)\]\.map/);
if (commMatch) {
  const str = commMatch[1];
  const matches = [...str.matchAll(/\["([^"]+)"/g)];
  matches.forEach(m => {
    if (!/^[A-Z0-9=\-\.]+$/.test(m[1])) {
      console.log("Invalid Commodity symbol:", JSON.stringify(m[1]));
    }
  });
}
