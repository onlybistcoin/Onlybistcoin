import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from "fs";

console.log("[Server] Starting initialization...");

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- In-Memory Price Cache (Current Reality) ---
const inMemoryPrices: Record<string, any> = {
  "XU100": { price: 14420.77, change: 0.35, source: 'Initial' },
  "XU030": { price: 14550.00, change: 0.40, source: 'Initial' },
  "TRY=X": { price: 42.25, change: 0.15, source: 'Initial' },
  "EURTRY=X": { price: 45.85, change: 0.08, source: 'Initial' },
  "BTC-USDT": { price: 81000.74, change: 1.42, source: 'Initial' },
  "ETH-USDT": { price: 2380.81, change: 0.78, source: 'Initial' },
  "SOL-USDT": { price: 185.00, change: 2.20, source: 'Initial' },
  "BNB-USDT": { price: 615.00, change: 1.10, source: 'Initial' },
  "AVAX-USDT": { price: 42.50, change: -1.10, source: 'Initial' },
  "XRP-USDT": { price: 0.58, change: 0.25, source: 'Initial' },
  "ADA-USDT": { price: 0.42, change: -1.20, source: 'Initial' },
  "DOGE-USDT": { price: 0.18, change: 2.50, source: 'Initial' },
  "PEPE-USDT": { price: 0.0000085, change: 5.30, source: 'Initial' },
  "10000PEPE-USDT": { price: 0.085, change: 5.30, source: 'Initial' },
  "GC=F": { price: 3155.00, change: 0.85, source: 'Initial' },
  "GAU=X": { price: 3250.00, change: 0.95, source: 'Initial' },
  "GAG=X": { price: 38.55, change: 1.45, source: 'Initial' },
  "SAHOL": { price: 104.85, change: 0.30, source: 'Initial' },
  "AKBNK": { price: 83.35, change: 0.40, source: 'Initial' },
  "THYAO": { price: 328.75, change: -1.82, source: 'Initial' },
  "GARAN": { price: 143.10, change: 0.30, source: 'Initial' },
  "EREGL": { price: 45.64, change: 5.69, source: 'Initial' },
  "KCHOL": { price: 221.00, change: -0.64, source: 'Initial' },
  "TUPRS": { price: 290.75, change: -1.72, source: 'Initial' },
  "SISE": { price: 57.86, change: 4.31, source: 'Initial' },
  "ASELS": { price: 441.75, change: -0.88, source: 'Initial' },
  "XU100_change": 0.35, "XU030_change": 0.40, "TRY=X_change": 0.15,
  "BTC-USDT_change": 1.42, "ETH-USDT_change": 0.78, "SOL-USDT_change": 2.20,
  "GAG=X_change": 1.45, "SAHOL_change": 0.30, "AKBNK_change": 0.40
};
const inMemoryNews: any[] = [];

import admin from "firebase-admin";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getFirestore as getClientFirestore } from "firebase/firestore";

// Load firebase config
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(firebaseConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
}

import ccxt from "ccxt";
import * as finnhub from "finnhub";
import * as cheerio from "cheerio";
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

// Initialize Firebase Admin
try {
  if (firebaseConfig.projectId && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
    console.log(`[Firebase Admin] Initialized with Project ID: ${firebaseConfig.projectId}`);
  }
} catch (err) {
  console.error("[Firebase Admin] Initialization error:", err);
}

// Initialize Firebase Client SDK
let db: any = null;
if (firebaseConfig.projectId) {
  const clientApp = initializeClientApp(firebaseConfig);
  db = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
  console.log(`[Firebase Client] Firestore initialized with Database ID: ${firebaseConfig.firestoreDatabaseId}`);
}

// Finnhub Setup
const finnhubKey = process.env.VITE_FINNHUB_API_KEY || "";
let finnhubClient: any = null;

if (finnhubKey) {
  try {
    const finnhubModule: any = (finnhub as any).default || finnhub;
    const DefaultApi = finnhubModule.DefaultApi;
    finnhubClient = new DefaultApi(finnhubKey);
    console.log("[Finnhub] Client initialized successfully");
  } catch (err) {
    console.error("[Finnhub] Initialization error:", err);
  }
}

const app = express();

// 1. Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[Server] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 2. CORS and Headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Server Error]", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 3. API routes
let lastUpdate = 0;
const UPDATE_INTERVAL = 10000; // 10 seconds

app.get("/api/prices", async (req, res) => {
  const now = Date.now();
  // If data is older than 10 seconds, trigger an update in background
  if (now - lastUpdate > UPDATE_INTERVAL) {
    lastUpdate = now;
    console.log("[API] Triggering background price update...");
    
    // Fire and forget update to keep response fast and avoid timeouts/rate limit spam
    Promise.allSettled([
      updateCryptoPrices(),
      updateBistPrices(),
      updateCommodities()
    ]).catch(e => console.error("[API] Background update error:", e));
  }
  
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json(inMemoryPrices);
});

app.get("/api/news", (req, res) => {
  res.set('Cache-Control', 'no-store');
  
  // If inMemoryNews is empty, provide some default mock news
  if (inMemoryNews.length === 0) {
    const mockNews = [
      { id: 1, title: "BIST 100 endeksi güne yükselişle başladı.", source: "Bloomberg HT", time: "10 dk önce", category: "BIST" },
      { id: 2, title: "Bitcoin 70.000 dolar sınırını zorluyor.", source: "CoinDesk", time: "25 dk önce", category: "CRYPTO" },
      { id: 3, title: "Altın fiyatlarında küresel talep artışı sürüyor.", source: "Reuters", time: "45 dk önce", category: "COMMODITY" },
      { id: 4, title: "FED faiz kararı öncesi piyasalarda bekleyiş hakim.", source: "CNBC", time: "1 saat önce", category: "GLOBAL" },
      { id: 5, title: "Teknoloji hisselerinde alım dalgası.", source: "Finans Gündem", time: "2 saat önce", category: "BIST" }
    ];
    return res.json(mockNews);
  }
  
  res.json(inMemoryNews);
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    pricesCount: Object.keys(inMemoryPrices).length
  });
});

app.get("/api/refresh", async (req, res) => {
  console.log("[API] Manual refresh triggered...");
  await Promise.allSettled([
    updateCryptoPrices(),
    updateBistPrices(),
    updateCommodities()
  ]);
  res.json({ status: "refreshed", count: Object.keys(inMemoryPrices).length });
});

// --- Workers ---
const BIST_SYMBOLS = [
  "THYAO", "GARAN", "AKBNK", "EREGL", "KCHOL", "SAHOL", "BIMAS", "TOASO", "ARCLK", "TUPRS", "SISE", "DOHOL",
  "PETKM", "FROTO", "ASELS", "MGROS", "PGSUS", "TAVHL", "YKBNK", "EKGYO", "VESTL", "ODAS", "SMRTG", "CANTE",
  "ISCTR", "HALKB", "VAKBN", "TSKB", "ALARK", "ENKAI", "TKFEN", "GUBRF", "HEKTS", "SASA", "KONTR", "GESAN",
  "YEOTK", "ASTOR", "EUPWR", "CWENE", "ALFAS", "MIATK", "REEDR", "TABGD", "TARKM", "EBEBK", "KAYSE", "BIENY",
  "SDTTR", "ONCSM", "SOKE", "EYGYO", "GOKNR", "CVKMD", "KOPOL", "PASEU", "KATMR", "TMSN", "OTKAR", "TTRAK",
  "DOAS", "ASUZU", "KMPUR", "SAYAS", "HUNER", "ZEDUR", "PRKME", "ULKER", "AEFES", "CCOLA", "TATGD", "SOKM",
  "TKNSA", "MAVI", "VAKKO", "YATAS", "BRISA", "GOODY", "AKSA", "KORDS", "BAGFS", "EGEEN", "BFREN", "FMIZP",
  "PARSN", "JANTS", "ALCAR", "ALGYO", "TRGYO", "OZKGY", "MSGYO", "HLGYO", "VKGYO", "SNGYO", "KLGYO", "AKFGY",
  "ISGYO", "KGYO", "IDGYO", "PAGYO", "DZGYO", "SRVGY", "RYGYO", "RYSAS", "GLYHO", "NETAS", "ALCTL", "ARENA",
  "INDES", "DESPC", "DGATE", "LINK", "LOGO", "KFEIN", "ARDYZ", "ESCOM", "FONET", "KRVGD", "AVOD", "OYYAT",
  "ISMEN", "GSDHO", "INFO", "OSMEN", "GLBMD", "GEDIK", "TUKAS", "KNFRT", "FRIGO", "ELITE", "ULUUN", "VANGD",
  "MERKO", "PETUN", "PNSUT", "SELVA", "BRKSN", "PRZMA", "IHLAS", "IHEVA", "IHYAY", "IHGZT", "METRO", "AVGYO",
  "ATLAS", "ETYAT", "EUYO", "EUKYO", "MZHLD", "EPLAS", "DERIM", "DESA", "HATEK", "MNDRS", "ARSAN", "LUKSK",
  "KRTEK", "SKTAS", "SNPAM", "SONME", "DAGI", "KRONT", "EDATA", "VBTYZ", "PKART", "SMART", "HTTBT", "OBASL",
  "ALVES", "ARTMS", "MOGAN", "ODINE", "ENTRA", "HOROZ", "ALTNY", "KOTON", "LILA", "HRKET", "YIGIT", "DCTTR",
  "BAHEV", "ONUR", "OZATD", "CEMZY", "KARYE", "GIPTA",
  "TCELL", "TTKOM", "ENJSA", "KRDMD", "ECILC", "DEVA", "SELEC", "MPARK", "LKMNH", "TRILC", "GENIL", "ANGEN",
  "MEDTR", "RTALB", "ZOREN", "AKENR", "AKSEN", "AYDEM", "GWIND", "NATEN", "ESEN", "MAGEN", "BRSAN", "BRYAT",
  "CEMTS", "IZMDC", "KCAER", "BUCIM", "AKCNS", "CIMSA", "NUHCM", "OYAKC", "AFYON", "BTCIM", "BSOKE", "GOLTS",
  "KONYA", "ADEL", "DOCO", "CLEBI", "SUWEN", "BEYAZ", "AYGAZ", "TRCAS", "YKSLN", "TIRE", "KARTN", "ALKA",
  "ALKIM", "EGGUB", "TEZOL", "PRKAB", "ARZUM", "VESBE", "KLSER", "QUAGR", "ISFIN", "QNBFL", "VAKFN", "GARFA",
  "LIDFA", "CRDFA"
];

const CRYPTO_SYMBOLS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT", "AVAX/USDT", "DOGE/USDT", "DOT/USDT", "LINK/USDT",
  "USDT/TRY",
  "POL/USDT", "NEAR/USDT", "PEPE/USDT", "FET/USDT", "RENDER/USDT", "SHIB/USDT", "LTC/USDT", "BCH/USDT", "UNI/USDT", "ARB/USDT",
  "TIA/USDT", "OP/USDT", "INJ/USDT", "SUI/USDT", "APT/USDT", "STX/USDT", "FIL/USDT", "ATOM/USDT", "IMX/USDT", "KAS/USDT",
  "HBAR/USDT", "ETC/USDT", "ICP/USDT", "RUNE/USDT", "LDO/USDT", "TAO/USDT", "SEI/USDT", "JUP/USDT", "WIF/USDT", "FLOKI/USDT",
  "BONK/USDT", "ORDI/USDT", "GALA/USDT", "VET/USDT", "MKR/USDT", "GRT/USDT", "AAVE/USDT", "ALGO/USDT", "EGLD/USDT", "FLOW/USDT",
  "QNT/USDT", "AXS/USDT", "SAND/USDT", "MANA/USDT", "THETA/USDT", "CHZ/USDT", "EOS/USDT", "NEO/USDT", "IOTA/USDT", "XMR/USDT",
  "ZEC/USDT", "DASH/USDT", "CRV/USDT", "DYDX/USDT", "SNX/USDT", "GMX/USDT", "PENDLE/USDT", "ARKM/USDT", "W/USDT", "ENA/USDT",
  "SATS/USDT", "BOME/USDT", "MEW/USDT", "NOT/USDT", "STRK/USDT", "PYTH/USDT", "JTO/USDT", "ALT/USDT", "MANTA/USDT", "BEAM/USDT",
  "RON/USDT", "PIXEL/USDT", "PORTAL/USDT", "XAI/USDT", "ACE/USDT", "ZETA/USDT", "DYM/USDT", "MAVIA/USDT", "AEVO/USDT", "ETHFI/USDT",
  "METIS/USDT", "VANRY/USDT", "OM/USDT", "ONDO/USDT", "CORE/USDT", "TNSR/USDT", "SAGA/USDT", "TAIKO/USDT", "ZK/USDT", "IO/USDT",
  "ATH/USDT", "ZRO/USDT", "LISTA/USDT", "HMSTR/USDT", "CATI/USDT", "EIGEN/USDT", "SCR/USDT", "GRASS/USDT", "DRIFT/USDT", "MOODENG/USDT",
  "GOAT/USDT", "PNUT/USDT", "ACT/USDT", "HYPE/USDT", "VIRTUAL/USDT", "AI16Z/USDT", "FARTCOIN/USDT", "TRUMP/USDT", "MELANIA/USDT", "SPX/USDT",
  "MOG/USDT", "POPCAT/USDT", "BRETT/USDT", "TURBO/USDT", "BABYDOGE/USDT", "1CAT/USDT", "MYRO/USDT", "COQ/USDT", "WEN/USDT", "ZIG/USDT",
  "GNS/USDT", "JOE/USDT", "PANGOLIN/USDT", "BENQI/USDT", "STEEM/USDT", "HIVE/USDT", "WAXP/USDT", "LOOM/USDT", "MTL/USDT", "STPT/USDT",
  "RAD/USDT", "UMA/USDT", "BAND/USDT", "NMR/USDT", "TRB/USDT", "API3/USDT", "DIA/USDT", "ANKR/USDT", "OCEAN/USDT", "AGIX/USDT",
  "RLC/USDT", "GLM/USDT", "STORJ/USDT", "SC/USDT", "AR/USDT", "LPT/USDT", "AUDIO/USDT", "ENS/USDT", "ID/USDT", "GAL/USDT",
  "HOOK/USDT", "HFT/USDT", "GMT/USDT", "GST/USDT", "SWEAT/USDT", "FITFI/USDT", "SLP/USDT", "ILV/USDT", "YGG/USDT", "MC/USDT",
  "MAGIC/USDT", "ENJ/USDT", "OG/USDT", "CITY/USDT", "BAR/USDT", "PSG/USDT", "JUV/USDT", "ACM/USDT", "ASR/USDT", "ATM/USDT",
  "INTER/USDT", "LAZIO/USDT", "PORTO/USDT", "SANTOS/USDT", "ALPINE/USDT", "BEAMX/USDT"
];

const binance = new ccxt.binance({ enableRateLimit: true });
let binanceMarketsLoaded = false;

async function updateCryptoPrices() {
  try {
    console.log("[Worker] Fetching crypto prices from Binance APIs natively...");
    
    // Fetch Spot AND Futures AND Gate.io
    const [spotRes, futRes, gateRes] = await Promise.allSettled([
      fetch('https://api.binance.com/api/v3/ticker/24hr').then(r => r.json()),
      fetch('https://fapi.binance.com/fapi/v1/ticker/24hr').then(r => r.json()),
      fetch('https://api.gateio.ws/api/v4/spot/tickers').then(r => r.json())
    ]);

    let allTickers: any[] = [];
    if (spotRes.status === 'fulfilled' && Array.isArray(spotRes.value)) {
       allTickers = allTickers.concat(spotRes.value);
    }
    if (futRes.status === 'fulfilled' && Array.isArray(futRes.value)) {
       allTickers = allTickers.concat(futRes.value);
    }
    
    if (allTickers.length === 0) {
      console.warn("[Worker] Both Binance APIs failed or returned no array data.");
      return;
    }

    let count = 0;
    
    for (const t of allTickers) {
      if (!t.symbol || !t.symbol.endsWith('USDT')) continue;
      
      let price = parseFloat(t.lastPrice);
      if (isNaN(price) || price <= 0) continue;
      let change = parseFloat(t.priceChangePercent) || 0;
      
      let docId = t.symbol.replace("USDT", "-USDT");
      if (t.symbol === "BEAMXUSDT") docId = "BEAM-USDT";
      
      inMemoryPrices[docId] = {
        price: price,
        change: change,
        lastUpdated: new Date().toISOString(),
        source: 'Binance API'
      };
      inMemoryPrices[`${docId}_change`] = change;
      count++;
    }

    // Gate.io fallback for missing coins
    let gateCount = 0;
    if (gateRes.status === 'fulfilled' && Array.isArray(gateRes.value)) {
       for (const t of gateRes.value) {
          if (!t.currency_pair || !t.currency_pair.endsWith('_USDT')) continue;
          let docId = t.currency_pair.replace('_USDT', '-USDT');
          
          let price = parseFloat(t.last);
          if (isNaN(price) || price <= 0) continue;
          let change = parseFloat(t.change_percentage) || 0;

          // Only add if not already present from Binance
          if (!inMemoryPrices[docId]) {
             inMemoryPrices[docId] = {
               price: price,
               change: change,
               lastUpdated: new Date().toISOString(),
               source: 'Gate.io'
             };
             inMemoryPrices[`${docId}_change`] = change;
             gateCount++;
          }
       }
    }
    
    console.log(`[Worker] Crypto update complete. Parsed ${count} Binance, ${gateCount} Gate.io tickers.`);

  } catch (err) {
    console.error("[Worker] Crypto update failed:", err);
  }
}

async function updateBistPrices() {
  try {
    // Indices first
    const indices = ["XU100.IS", "XU030.IS"];
    const indexQuotes = await yahooFinance.quote(indices) as any[];
    for (const quote of indexQuotes) {
      let sym = quote.symbol === "XU100.IS" ? "XU100" : "XU030";
      inMemoryPrices[sym] = {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChangePercent || 0,
        lastUpdated: new Date().toISOString(),
        source: 'YahooFinance'
      };
      inMemoryPrices[`${sym}_change`] = quote.regularMarketChangePercent || 0;
    }

    // Batch fetch all BIST stocks (Yahoo Finance supports multiple symbols)
    // We append .IS to each symbol
    const batchSize = 100;
    for (let i = 0; i < BIST_SYMBOLS.length; i += batchSize) {
      const batch = BIST_SYMBOLS.slice(i, i + batchSize).map(s => `${s}.IS`);
      try {
        const quotes = await yahooFinance.quote(batch) as any[];
        for (const quote of quotes) {
          const originalSymbol = quote.symbol.replace('.IS', '');
          if (quote.regularMarketPrice !== undefined) {
            inMemoryPrices[originalSymbol] = {
              price: quote.regularMarketPrice,
              change: quote.regularMarketChangePercent || 0,
              lastUpdated: new Date().toISOString(),
              source: 'YahooFinance'
            };
            inMemoryPrices[`${originalSymbol}_change`] = quote.regularMarketChangePercent || 0;
          }
        }
      } catch (batchErr) {
        console.warn(`[Worker] BIST batch ${i} failed. Trying individually...`);
        // Fallback: try individually
        const individualPromises = batch.map(symbol => yahooFinance.quote(symbol).catch(() => null));
        const individualResults = await Promise.all(individualPromises);
        for (const quote of individualResults) {
          if (quote && quote.regularMarketPrice !== undefined) {
             const originalSymbol = (quote as any).symbol.replace('.IS', '');
             inMemoryPrices[originalSymbol] = {
               price: (quote as any).regularMarketPrice,
               change: (quote as any).regularMarketChangePercent || 0,
               lastUpdated: new Date().toISOString(),
               source: 'YahooFinance'
             };
             inMemoryPrices[`${originalSymbol}_change`] = (quote as any).regularMarketChangePercent || 0;
          }
        }
      }
    }
  } catch (err) {
    console.error("[Worker] BIST update failed:", err);
  }
}

async function updateCommodities() {
  try {
    const yfSymbols = ["TRY=X", "GC=F", "SI=F", "BZ=F", "HG=F"];
    const quotes = await yahooFinance.quote(yfSymbols) as any[];
    const prices: Record<string, number> = {};
    const changes: Record<string, number> = {};

    for (const quote of quotes) {
      prices[quote.symbol] = quote.regularMarketPrice;
      changes[quote.symbol] = quote.regularMarketChangePercent || 0;
      
      inMemoryPrices[quote.symbol] = {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChangePercent || 0,
        lastUpdated: new Date().toISOString(),
        source: 'YahooFinance'
      };
      inMemoryPrices[`${quote.symbol}_change`] = quote.regularMarketChangePercent || 0;
    }

    // Calculate Gram Gold (GAU=X) and Gram Silver (GAG=X)
    if (prices["TRY=X"]) {
      if (prices["GC=F"]) {
        const gramGoldPrice = (prices["GC=F"] / 31.1035) * prices["TRY=X"];
        inMemoryPrices["GAU=X"] = {
          price: gramGoldPrice,
          change: changes["GC=F"], // Simplified change
          lastUpdated: new Date().toISOString(),
          source: 'Calculated'
        };
      }
      if (prices["SI=F"]) {
        // 1 troy ounce = 31.1034768 grams
        const gramSilverPrice = (prices["SI=F"] / 31.1034768) * (prices["TRY=X"] || 1);
        inMemoryPrices["GAG=X"] = {
          price: gramSilverPrice,
          change: changes["SI=F"], // Use silver futures change
          lastUpdated: new Date().toISOString(),
          source: 'Calculated'
        };
        // Also store change separately for App.tsx
        inMemoryPrices["GAG=X_change"] = changes["SI=F"];
      }
      
      // USDT/TRY calculation if not already from Binance
      if (prices["TRY=X"] && !inMemoryPrices["USDT-TRY"]) {
        inMemoryPrices["USDT-TRY"] = {
          price: prices["TRY=X"] * 1.001, // USDT usually slightly higher than USD
          change: changes["TRY=X"],
          lastUpdated: new Date().toISOString(),
          source: 'Calculated'
        };
        inMemoryPrices["USDT-TRY_change"] = changes["TRY=X"];
      }
    }
    console.log(`[Worker] Commodities update cycle complete.`);
  } catch (err) {
    console.error("[Worker] Commodities failed:", err);
  }
}

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn("[Server] dist directory not found. Static serving might fail.");
      app.get('*', (req, res) => {
        res.status(404).send("Production build not found. Please run 'npm run build'.");
      });
    }
  }
}

async function startServer() {
  await setupVite();

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    
    // Start background loops AFTER server is listening
    console.log("[Server] Starting background price updates...");
    updateCryptoPrices();
    updateBistPrices();
    updateCommodities();

    setInterval(updateCryptoPrices, 10000); // 10 seconds
    setInterval(updateBistPrices, 30000); // 30 seconds
    setInterval(updateCommodities, 60000); // 1 minute
  });
}

startServer().catch(err => {
  console.error("[Server] Failed to start:", err);
});

export default app;
