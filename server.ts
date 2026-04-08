import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getFirestore as getClientFirestore, collection as clientCollection, doc as clientDoc, writeBatch as clientWriteBatch, getDocs as clientGetDocs, limit as clientLimit, query as clientQuery } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };
import ccxt from "ccxt";
import * as finnhub from "finnhub";
import * as cheerio from "cheerio";

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
  
  app.use(express.json());

  // --- In-Memory Price Cache ---
  const inMemoryPrices: Record<string, any> = {};

  app.get("/api/prices", (req, res) => {
    res.json(inMemoryPrices);
  });

  // --- Symbols ---
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

        const priceDoc = clientDoc(db, "prices", docId);
        currentBatch.set(priceDoc, {
          symbol: docId,
          price: price,
          change: change,
          volume: ticker.quoteVolume || 0,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        count++;

        // Firestore batch limit is 500
        if (count % 400 === 0) {
          await currentBatch.commit();
          currentBatch = clientWriteBatch(db);
        }
      }

      if (count % 400 !== 0) {
        await currentBatch.commit();
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
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
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

  async function updateBistPrices() {
    console.log("updateBistPrices called");
    try {
      let count = 0;
      let batch = clientWriteBatch(db);
      let batchCount = 0;

      // Deduplicate symbols
      const uniqueSymbols = [...new Set(BIST_SYMBOLS)];

      // Process in chunks of 40 to speed up
      const chunkSize = 40;
      for (let i = 0; i < uniqueSymbols.length; i += chunkSize) {
        const chunk = uniqueSymbols.slice(i, i + chunkSize);
        
        const promises = chunk.map(async (symbol) => {
          const price = await fetchGoogleFinancePrice(`${symbol}:IST`);
          return { symbol, price };
        });

        const results = await Promise.all(promises);

        for (const { symbol, price } of results) {
          if (price) {
            inMemoryPrices[symbol] = {
              price: price,
              lastUpdated: new Date().toISOString()
            };

            const priceDoc = clientDoc(db, "prices", symbol);
            batch.set(priceDoc, {
              symbol: symbol,
              price: price,
              lastUpdated: new Date().toISOString()
            }, { merge: true });
            count++;
            batchCount++;
          }

          if (batchCount >= 20) {
            try {
              await batch.commit();
            } catch (e) {
              console.error("Batch commit failed:", e);
            }
            batch = clientWriteBatch(db);
            batchCount = 0;
          }
        }
        
        // Small delay between chunks to avoid getting blocked
        await new Promise(r => setTimeout(r, 500));
      }
      
      if (batchCount > 0) {
        try {
          await batch.commit();
        } catch (e) {
          console.error("Final batch commit failed:", e);
        }
      }
      console.log(`[Worker] Updated ${count} BIST prices in parallel`);
    } catch (err) {
      console.error("[Worker] BIST update failed:", err);
    }
  }

  async function updateCommodities() {
    console.log("updateCommodities called");
    try {
      const metaBatch = clientWriteBatch(db);
      let metaCount = 0;

      const fxRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      if (fxRes.ok) {
        const fxData = await fxRes.json();
        const usdTry = fxData.rates.TRY;
        if (usdTry) {
          inMemoryPrices["TRY=X"] = { price: usdTry, lastUpdated: new Date().toISOString() };
          metaBatch.set(clientDoc(db, "prices", "TRY=X"), {
            symbol: "TRY=X",
            price: usdTry,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
          metaCount++;

          // 3. Update Gold/Silver via Gold-API
          const goldRes = await fetch("https://api.gold-api.com/price/XAU");
          const silverRes = await fetch("https://api.gold-api.com/price/XAG");
          
          if (goldRes.ok) {
            const goldData = await goldRes.json();
            const goldPrice = goldData.price;
            if (goldPrice) {
              const gramGold = (goldPrice / 31.1035) * usdTry;
              inMemoryPrices["GAU=X"] = { price: gramGold, lastUpdated: new Date().toISOString() };
              inMemoryPrices["GC=F"] = { price: goldPrice, lastUpdated: new Date().toISOString() };
              
              metaBatch.set(clientDoc(db, "prices", "GAU=X"), {
                symbol: "GAU=X",
                price: gramGold,
                lastUpdated: new Date().toISOString()
              }, { merge: true });
              metaCount++;
              
              metaBatch.set(clientDoc(db, "prices", "GC=F"), {
                symbol: "GC=F",
                price: goldPrice,
                lastUpdated: new Date().toISOString()
              }, { merge: true });
              metaCount++;
            }
          }

          if (silverRes.ok) {
            const silverData = await silverRes.json();
            const silverPrice = silverData.price;
            if (silverPrice) {
              const gramSilver = (silverPrice / 31.1035) * usdTry;
              inMemoryPrices["GAG=X"] = { price: gramSilver, lastUpdated: new Date().toISOString() };
              inMemoryPrices["SI=F"] = { price: silverPrice, lastUpdated: new Date().toISOString() };

              metaBatch.set(clientDoc(db, "prices", "GAG=X"), {
                symbol: "GAG=X",
                price: gramSilver,
                lastUpdated: new Date().toISOString()
              }, { merge: true });
              metaCount++;

              metaBatch.set(clientDoc(db, "prices", "SI=F"), {
                symbol: "SI=F",
                price: silverPrice,
                lastUpdated: new Date().toISOString()
              }, { merge: true });
              metaCount++;
            }
          }
        }
      }

      // 4. Indices
      const indices = [
        { sym: "XU100", gSym: "XU100:INDEXIST" },
        { sym: "XU030", gSym: "XU030:INDEXIST" }
      ];
      for (const idx of indices) {
        const price = await fetchGoogleFinancePrice(idx.gSym);
        if (price) {
          inMemoryPrices[idx.sym] = { price: price, lastUpdated: new Date().toISOString() };
          metaBatch.set(clientDoc(db, "prices", idx.sym), {
            symbol: idx.sym,
            price: price,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
          metaCount++;
        }
      }

      if (metaCount > 0) {
        try {
          await metaBatch.commit();
        } catch (e) {
          console.error("Commodities batch commit failed (Quota?):", e);
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
          try {
            const batch = clientWriteBatch(db);
            data.slice(0, 10).forEach((item: any) => {
              const newsDoc = clientDoc(db, "news", String(item.id));
              batch.set(newsDoc, {
                id: item.id,
                title: item.headline,
                summary: item.summary,
                url: item.url,
                source: item.source,
                timestamp: new Date(item.datetime * 1000).toISOString(),
                category: item.category
              }, { merge: true });
            });
            await batch.commit();
            console.log(`[News] Updated ${data.length} news items from Finnhub`);
          } catch (commitErr) {
            console.error("[News] Batch commit failed:", commitErr);
          }
        }
      });
    } catch (err) {
      console.error("[News] Update failed:", err);
    }
  }

  // --- Background Loops (Recursive to prevent overlapping) ---
  
  async function loopCrypto() {
    await updateCryptoPrices();
    setTimeout(loopCrypto, 5000); // 5 seconds
  }

  async function loopBist() {
    await updateBistPrices();
    setTimeout(loopBist, 5000); // 5 seconds
  }

  async function loopCommodities() {
    await updateCommodities();
    setTimeout(loopCommodities, 5000); // 5 seconds
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Bulletproof Sync Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
