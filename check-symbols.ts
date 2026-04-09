import fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf-8');
const appContent = fs.readFileSync('src/App.tsx', 'utf-8');

const bistSymbolsMatch = serverContent.match(/const BIST_SYMBOLS = \[(.*?)\];/s);
const bistStocksMatch = appContent.match(/const BIST_STOCKS = \[(.*?)\]/s);

if (bistSymbolsMatch && bistStocksMatch) {
  const serverSymbols = bistSymbolsMatch[1].replace(/["'\s]/g, '').split(',');
  const appSymbols = appContent.match(/\["(.*?)",/g)?.map(m => m.replace(/[\[",]/g, '')) || [];
  
  console.log("Server count:", serverSymbols.length);
  console.log("App count:", appSymbols.length);
  
  const missingInServer = appSymbols.filter(s => s && !serverSymbols.includes(s));
  console.log("Missing in server:", missingInServer);
  console.log("First 5 app symbols:", appSymbols.slice(0, 5));
}
