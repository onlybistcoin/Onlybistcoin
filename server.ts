import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from "fs";

console.log("[Server] Starting initialization...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- In-Memory Price Cache ---
const inMemoryPrices: Record<string, any> = {};
const inMemoryNews: any[] = [];

import admin from "firebase-admin";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getFirestore as getClientFirestore, collection as clientCollection, doc as clientDoc, writeBatch as clientWriteBatch, getDocs as clientGetDocs, limit as clientLimit, query as clientQuery } from "firebase/firestore";

// Load firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));

import ccxt from "ccxt";
import * as finnhub from "finnhub";
import * as cheerio from "cheerio";
import yahooFinance from 'yahoo-finance2';

// Initialize Firebase Admin (for other things if needed)
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
    console.log(`[Firebase Admin] Initialized with Project ID: ${firebaseConfig.projectId}`);
  }
} catch (err) {
  console.error("[Firebase Admin] Initialization error:", err);
}

// Initialize Firebase Client SDK (Workaround for Firestore permissions)
const clientApp = initializeClientApp(firebaseConfig);
const db = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
console.log(`[Firebase Client] Firestore initialized with Database ID: ${firebaseConfig.firestoreDatabaseId}`);

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

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // CORS and Headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // 1. API routes FIRST (before any middleware)
  app.get("/api/health", (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
  });

  app.get("/api/prices", (req, res) => {
    res.set('Cache-Control', 'no-store');
    const count = Object.keys(inMemoryPrices).length;
    console.log(`[Server] /api/prices requested. Cache size: ${count}`);
    if (count === 0) {
      console.warn("[Server] /api/prices requested but cache is empty");
    }
    res.json(inMemoryPrices);
  });

  app.get("/api/news", (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(inMemoryNews);
  });

  // Debug route
  app.get("/api/debug", (req, res) => {
    res.json({
      pricesCount: Object.keys(inMemoryPrices).length,
      newsCount: inMemoryNews.length,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });

  // 2. General Middleware
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  // --- In-Memory Price Cache ---
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
    "BAHEV", "ONUR", "OZATD", "CEMZY", "KARYE", "GIPTA"
  ];

  const CRYPTO_SYMBOLS = [
    "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT", "AVAX/USDT", "DOGE/USDT", "DOT/USDT", "LINK/USDT",
    "PEPE/USDT", "FET/USDT", "RENDER/USDT", "SHIB/USDT", "LTC/USDT", "BCH/USDT", "UNI/USDT", "ARB/USDT", "TIA/USDT", "OP/USDT",
    "INJ/USDT", "SUI/USDT", "APT/USDT", "STX/USDT", "FIL/USDT", "ATOM/USDT", "IMX/USDT", "HBAR/USDT", "ETC/USDT",
    "ICP/USDT", "RUNE/USDT", "LDO/USDT", "TAO/USDT", "SEI/USDT", "JUP/USDT", "WIF/USDT", "FLOKI/USDT", "BONK/USDT", "ORDI/USDT",
    "GALA/USDT", "VET/USDT", "MKR/USDT", "GRT/USDT", "AAVE/USDT", "ALGO/USDT", "EGLD/USDT", "FLOW/USDT", "QNT/USDT", "AXS/USDT",
    "SAND/USDT", "MANA/USDT", "THETA/USDT", "CHZ/USDT", "EOS/USDT", "NEO/USDT", "IOTA/USDT", "XMR/USDT", "ZEC/USDT", "DASH/USDT",
    "CRV/USDT", "DYDX/USDT", "SNX/USDT", "GMX/USDT", "PENDLE/USDT", "ARKM/USDT", "W/USDT", "ENA/USDT", "1000SATS/USDT", "BOME/USDT",
    "NOT/USDT", "STRK/USDT", "PYTH/USDT", "JTO/USDT", "ALT/USDT", "MANTA/USDT", "BEAM/USDT", "PIXEL/USDT",
    "PORTAL/USDT", "XAI/USDT", "ACE/USDT", "DYM/USDT", "AEVO/USDT", "ETHFI/USDT", "METIS/USDT", "VANRY/USDT",
    "OM/USDT", "ONDO/USDT", "CORE/USDT", "TNSR/USDT", "SAGA/USDT", "TAIKO/USDT", "ZK/USDT", "IO/USDT", "ATH/USDT", "ZRO/USDT",
    "LISTA/USDT", "HMSTR/USDT", "CATI/USDT", "EIGEN/USDT", "SCR/USDT", "GRASS/USDT", "DRIFT/USDT", "MOODENG/USDT", "GOAT/USDT",
    "PNUT/USDT", "ACT/USDT", "HYPE/USDT", "VIRTUAL/USDT", "AI16Z/USDT", "FARTCOIN/USDT", "TRUMP/USDT", "MELANIA/USDT", "SPX/USDT",
    "MOG/USDT", "POPCAT/USDT", "BRETT/USDT", "TURBO/USDT", "BABYDOGE/USDT", "1CAT/USDT", "MYRO/USDT", "COQ/USDT", "WEN/USDT",
    "ZIG/USDT", "GNS/USDT", "JOE/USDT", "PANGOLIN/USDT", "BENQI/USDT", "STEEM/USDT", "HIVE/USDT", "WAXP/USDT", "LOOM/USDT",
    "MTL/USDT", "STPT/USDT", "RAD/USDT", "UMA/USDT", "BAND/USDT", "NMR/USDT", "TRB/USDT", "API3/USDT", "DIA/USDT", "ANKR/USDT",
    "OCEAN/USDT", "AGIX/USDT", "RLC/USDT", "GLM/USDT", "STORJ/USDT", "SC/USDT", "AR/USDT", "LPT/USDT", "AUDIO/USDT", "ENS/USDT",
    "ID/USDT", "GAL/USDT", "HOOK/USDT", "HFT/USDT", "GMT/USDT", "GST/USDT", "SWEAT/USDT", "FITFI/USDT", "SLP/USDT", "ILV/USDT",
    "YGG/USDT", "MC/USDT", "MAGIC/USDT", "ENJ/USDT", "OG/USDT", "CITY/USDT", "BAR/USDT", "PSG/USDT", "JUV/USDT", "ACM/USDT",
    "ASR/USDT", "ATM/USDT", "INTER/USDT", "LAZIO/USDT", "PORTO/USDT", "SANTOS/USDT", "ALPINE/USDT"
  ];

  const COMMODITIES = ["GC=F", "SI=F", "BZ=F", "HG=F", "TRY=X", "XU100.IS", "XU030.IS", "^XU100", "^XU030"];

  // --- CCXT Crypto Worker ---
  const binance = new ccxt.binance({ enableRateLimit: true });
  async function updateCryptoPrices() {
    try {
      // Fetching all tickers is safer than passing a list that might contain delisted/invalid symbols
      const tickers = await binance.fetchTickers();
      let currentBatch = clientWriteBatch(db);
      let count = 0;

      // Create a set for faster lookup
      const symbolSet = new Set(CRYPTO_SYMBOLS);

      for (const symbol in tickers) {
        if (!symbolSet.has(symbol)) continue;

        const ticker = tickers[symbol];
        let docId = symbol.replace("/", "-");
        let price = ticker.last;
        
        if (price === undefined || price === null) continue;

        // Handle 10000 prefixes
        if (docId === "1000SATS-USDT") {
          docId = "10000SATS-USDT";
          price *= 10;
        } else if (["PEPE-USDT", "SHIB-USDT", "FLOKI-USDT", "BONK-USDT", "BOME-USDT", "MOG-USDT", "BABYDOGE-USDT", "1CAT-USDT", "COQ-USDT", "WEN-USDT"].includes(docId)) {
          docId = "10000" + docId;
          price *= 10000;
        }

        const change = ticker.percentage || 0;
        
        inMemoryPrices[docId] = {
          price: price,
          change: change,
          lastUpdated: new Date().toISOString()
        };
        count++;
      }

      console.log(`[Worker] Updated ${count} crypto prices using CCXT`);
    } catch (err) {
      console.error("[Worker] CCXT Crypto update failed:", err);
    }
  }

  // --- BIST/Commodity Worker (Alternative Sources) ---
  async function fetchGoogleFinancePrice(symbol: string) {
    const url = `https://www.google.com/finance/quote/${symbol}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        const $ = cheerio.load(text);
        const price = $('div[data-last-price]').attr('data-last-price');
        if (price) return parseFloat(price.replace(/,/g, ''));
        const price2 = $('.YMlS1d').text();
        if (price2) return parseFloat(price2.replace(/,/g, ''));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(`[GoogleFinance] Failed for ${symbol}:`, (err as Error).message);
    }
    return null;
  }

  async function fetchBistFromBigpara() {
    console.log("[Worker] Fetching BIST from Bigpara...");
    try {
      const urls = [
        "https://bigpara.hurriyet.com.tr/borsa/hisse-fiyatlari/",
        "https://bigpara.hurriyet.com.tr/borsa/canli-borsa/"
      ];
      
      let totalCount = 0;
      for (const url of urls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const text = await res.text();
            const $ = cheerio.load(text);
            
            // Try TR structure
            $('tr').each((_, el) => {
              const cells = $(el).find('td');
              if (cells.length >= 3) {
                const symbol = $(cells[0]).text().trim().split(' ')[0];
                const priceStr = $(cells[1]).text().trim();
                const changeStr = $(cells[2]).text().trim();
                
                if (symbol && symbol.length >= 2 && symbol.length <= 6) {
                  let price = parseFloat(priceStr.replace('.', '').replace(',', '.'));
                  let change = parseFloat(changeStr.replace(',', '.'));
                  
                  if (!isNaN(price)) {
                    inMemoryPrices[symbol] = {
                      price: price,
                      change: isNaN(change) ? 0 : change,
                      lastUpdated: new Date().toISOString(),
                      source: 'Bigpara'
                    };
                    totalCount++;
                  }
                }
              }
            });

            // Try UL structure
            $('.tBody ul').each((_, el) => {
              const symbol = $(el).find('.li_sembol a').text().trim();
              const priceStr = $(el).find('.li_son').text().trim();
              const changeStr = $(el).find('.li_yuzde').text().trim();
              
              if (symbol && priceStr) {
                let price = parseFloat(priceStr.replace('.', '').replace(',', '.'));
                let change = parseFloat(changeStr.replace(',', '.'));
                
                if (!isNaN(price)) {
                  inMemoryPrices[symbol] = {
                    price: price,
                    change: isNaN(change) ? 0 : change,
                    lastUpdated: new Date().toISOString(),
                    source: 'Bigpara-Alt'
                  };
                  totalCount++;
                }
              }
            });
          }
        } catch (e) {
          console.error(`[Worker] Bigpara fetch failed for ${url}:`, (e as Error).message);
        }
      }

      console.log(`[Worker] BIST scraper found ${totalCount} stocks total`);
      return totalCount > 0;
    } catch (err) {
      console.error("[Worker] BIST scraper critical failed:", err);
    }
    return false;
  }

  async function updateBistPrices() {
    console.log("[Worker] updateBistPrices started");
    
    // Try Bigpara first as it's more reliable for BIST
    const bigparaSuccess = await fetchBistFromBigpara();
    
    // Then try Yahoo Finance for anything missing or as a secondary source
    try {
      let count = 0;
      const uniqueSymbols = [...new Set(BIST_SYMBOLS)];
      const chunkSize = 30;
      
      for (let i = 0; i < uniqueSymbols.length; i += chunkSize) {
        const chunk = uniqueSymbols.slice(i, i + chunkSize);
        const yfSymbols = chunk.map(s => `${s}.IS`);
        
        try {
          const results = await yahooFinance.quote(yfSymbols) as any[];
          for (const result of results) {
            const symbol = result.symbol.replace('.IS', '');
            // Only update if not already updated by Bigpara recently, or if Bigpara failed
            if (result.regularMarketPrice) {
              inMemoryPrices[symbol] = {
                price: result.regularMarketPrice,
                change: result.regularMarketChangePercent || 0,
                volume: result.regularMarketVolume || 0,
                lastUpdated: new Date().toISOString(),
                source: 'YahooFinance'
              };
              count++;
            }
          }
        } catch (e) {
          console.error(`[Worker] Yahoo Finance chunk ${i} failed:`, (e as Error).message);
        }
        await new Promise(r => setTimeout(r, 2000)); // 2s delay between chunks
      }
      console.log(`[Worker] Yahoo Finance updated ${count} BIST stocks`);
    } catch (err) {
      console.error("[Worker] BIST update failed:", err);
    }
  }

  async function fetchWithTimeout(url: string, timeoutMs = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async function updateCommodities() {
    console.log("updateCommodities called");
    try {
      let metaCount = 0;

      try {
        const fxRes = await fetchWithTimeout("https://api.exchangerate-api.com/v4/latest/USD");
        if (fxRes.ok) {
          const fxData = await fxRes.json();
          let usdTry = fxData.rates.TRY;
          if (usdTry) {
            inMemoryPrices["TRY=X"] = { price: usdTry, lastUpdated: new Date().toISOString() };
            metaCount++;

            // 3. Update Gold/Silver via Gold-API
            try {
              const goldRes = await fetchWithTimeout("https://api.gold-api.com/price/XAU");
              if (goldRes.ok) {
                const goldData = await goldRes.json();
                let goldPrice = goldData.price;
                if (goldPrice) {
                  const gramGold = (goldPrice / 31.1035) * usdTry;
                  inMemoryPrices["GAU=X"] = { price: gramGold, lastUpdated: new Date().toISOString() };
                  inMemoryPrices["GC=F"] = { price: goldPrice, lastUpdated: new Date().toISOString() };
                  metaCount += 2;
                }
              }
            } catch (e) {
              console.error("Gold API failed:", e);
            }

            try {
              const silverRes = await fetchWithTimeout("https://api.gold-api.com/price/XAG");
              if (silverRes.ok) {
                const silverData = await silverRes.json();
                const silverPrice = silverData.price;
                if (silverPrice) {
                  const gramSilver = (silverPrice / 31.1035) * usdTry;
                  inMemoryPrices["GAG=X"] = { price: gramSilver, lastUpdated: new Date().toISOString() };
                  inMemoryPrices["SI=F"] = { price: silverPrice, lastUpdated: new Date().toISOString() };
                  metaCount += 2;
                }
              }
            } catch (e) {
              console.error("Silver API failed:", e);
            }
          }
        }
      } catch (e) {
        console.error("FX API failed:", e);
      }

      // 4. Indices
      const indices = [
        { sym: "XU100", gSym: "XU100:INDEXIST" },
        { sym: "XU030", gSym: "XU030:INDEXIST" }
      ];
      for (const idx of indices) {
        let price = await fetchGoogleFinancePrice(idx.gSym);
        if (price) {
          inMemoryPrices[idx.sym] = { price: price, lastUpdated: new Date().toISOString(), source: 'GoogleFinance' };
          metaCount++;
        }
      }

      console.log(`[Worker] Updated ${metaCount} FX/Commodity prices`);
    } catch (err) {
      console.error("[Worker] Commodities update failed:", err);
    }
  }

  // --- News Worker (Finnhub) ---
  async function updateNews() {
    if (!finnhubClient) return;
    try {
      finnhubClient.marketNews('general', {}, async (error: any, data: any) => {
        if (error) {
          console.error("[News] Finnhub error:", error);
          return;
        }
        if (data && Array.isArray(data)) {
          // Store in memory instead of Firestore to avoid quota issues
          const formattedNews = data.slice(0, 20).map((item: any) => ({
            id: item.id,
            title: item.headline,
            summary: item.summary,
            url: item.url,
            source: item.source,
            timestamp: new Date(item.datetime * 1000).toISOString(),
            category: item.category
          }));
          
          inMemoryNews.length = 0; // Clear existing
          inMemoryNews.push(...formattedNews);
          
          console.log(`[News] Updated ${inMemoryNews.length} news items in memory`);
        }
      });
    } catch (err) {
      console.error("[News] Update failed:", err);
    }
  }

  // --- Background Loops (Recursive to prevent overlapping) ---
  
  async function loopCrypto() {
    await updateCryptoPrices();
    setTimeout(loopCrypto, 10000); // 10 seconds
  }

  async function loopBist() {
    await updateBistPrices();
    setTimeout(loopBist, 30000); // 30 seconds
  }

  async function loopCommodities() {
    await updateCommodities();
    setTimeout(loopCommodities, 30000); // 30 seconds
  }

  async function loopNews() {
    await updateNews();
    setTimeout(loopNews, 1800000); // 30 minutes
  }

  // Initial run
  loopCrypto();
  loopBist();
  loopCommodities();
  loopNews();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Starting in DEVELOPMENT mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Starting in PRODUCTION mode");
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`[Server] Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
