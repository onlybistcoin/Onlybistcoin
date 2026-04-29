const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/s\.symbol\.split\(''\)\.reduce\(\(acc, char\) => acc \+ char\.charCodeAt\(0\), 0\)/g, "getSymbolSeed(s.symbol)");
code = code.replace(/sym\.split\(''\)\.reduce\(\(acc, char\) => acc \+ char\.charCodeAt\(0\), 0\)/g, "getSymbolSeed(sym)");
code = code.replace(/s\.symbol\.split\(''\)\.reduce\(\(acc: number, char: string\) => acc \+ char\.charCodeAt\(0\), 0\)/g, "getSymbolSeed(s.symbol)");
code = code.replace(/stock\.symbol\.split\(''\)\.reduce\(\(acc: number, char: string\) => acc \+ char\.charCodeAt\(0\), 0\)/g, "getSymbolSeed(stock.symbol)");
code = code.replace(/sym\.split\(''\)\.reduce\(\(acc: number, char: string\) => acc \+ char\.charCodeAt\(0\), 0\)/g, "getSymbolSeed(sym)");
code = code.replace(/symbol\.split\(''\)\.reduce\(\(acc, char\) => acc \+ char\.charCodeAt\(0\), 0\)/g, "getSymbolSeed(symbol)");

fs.writeFileSync('src/App.tsx', code);
