import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };
import ccxt from "ccxt";
import * as finnhub from "finnhub";

// Initialize Firebase Admin
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log(`[Firebase] Initialized with Project ID: ${firebaseConfig.projectId}`);
  }
} catch (err) {
  console.error("[Firebase] Initialization error:", err);
}
const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
console.log(`[Firebase] Firestore Database ID: ${firebaseConfig.firestoreDatabaseId}`);

// Finnhub Setup
const finnhubKey = process.env.VITE_FINNHUB_API_KEY || "";
let finnhubClient: any = null;

if (finnhubKey) {
  try {
    // Handle potential ESM/CJS interop issues
    const finnhubModule: any = (finnhub as any).default || finnhub;
    const ApiClient = finnhubModule.ApiClient;
    const DefaultApi = finnhubModule.DefaultApi;

    if (ApiClient && ApiClient.instance) {
      const api_key = ApiClient.instance.authentications['api_key'];
      api_key.apiKey = finnhubKey;
      finnhubClient = new DefaultApi();
      console.log("[Finnhub] Client initialized successfully");
    } else {
      console.warn("[Finnhub] ApiClient.instance not found, attempting alternative initialization");
      // Fallback if the structure is different
      const client = new ApiClient();
      client.authentications['api_key'].apiKey = finnhubKey;
      finnhubClient = new DefaultApi(client);
    }
  } catch (err) {
    console.error("[Finnhub] Initialization error:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

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
    "PORTAL/USDT", "XAI/USDT", "ACE/USDT", "DYM/USDT", "MAVIA/USDT", "AEVO/USDT", "ETHFI/USDT", "METIS/USDT", "VANRY/USDT",
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
      const tickers = await binance.fetchTickers(CRYPTO_SYMBOLS);
      const batch = db.batch();
      let count = 0;

      for (const symbol in tickers) {
        const ticker = tickers[symbol];
        let docId = symbol.replace("/", "-");
        let price = ticker.last;
        
        // Handle 10000 prefixes
        if (docId === "1000SATS-USDT") {
          docId = "10000SATS-USDT";
          price *= 10;
        } else if (["PEPE-USDT", "SHIB-USDT", "FLOKI-USDT", "BONK-USDT", "BOME-USDT", "MOG-USDT", "BABYDOGE-USDT", "1CAT-USDT", "COQ-USDT", "WEN-USDT"].includes(docId)) {
          docId = "10000" + docId;
          price *= 10000;
        }

        const priceDoc = db.collection("prices").doc(docId);
        batch.set(priceDoc, {
          symbol: docId,
          price: price,
          change: ticker.percentage || 0,
          volume: ticker.quoteVolume || 0,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        count++;
      }

      if (count > 0) {
        await batch.commit();
        console.log(`[Worker] Updated ${count} crypto prices using CCXT`);
      }
    } catch (err) {
      console.error("[Worker] CCXT Crypto update failed:", err);
    }
  }

  // --- BIST/Commodity Worker (Improved Yahoo/TradingView Fetch) ---
  async function fetchWithRetry(url: string, options: any, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return res;
        if (res.status === 429) {
          console.log(`[Worker] Rate limited (429), retrying in ${delay * 2}ms...`);
          await new Promise(r => setTimeout(r, delay * 2));
          delay *= 2;
          continue;
        }
        console.error(`[Worker] Fetch status ${res.status} for ${url}`);
        if (i === retries - 1) return res;
      } catch (err: any) {
        if (i === retries - 1) throw err;
        console.log(`[Worker] Fetch failed: ${err.message}, retrying in ${delay}ms... (${i + 1}/${retries})`);
      }
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
    return null;
  }

  async function updateBistPrices() {
    try {
      const allSymbols = BIST_SYMBOLS.map(s => `${s}.IS`).concat(COMMODITIES);
      const batchSize = 40;
      
      for (let i = 0; i < allSymbols.length; i += batchSize) {
        const batchSymbols = allSymbols.slice(i, i + batchSize).join(",");
        const url = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(batchSymbols)}`;
        
        const res = await fetchWithRetry(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://finance.yahoo.com',
            'Referer': 'https://finance.yahoo.com/'
          }
        });
        
        if (res && res.ok) {
          const data = await res.json();
          const quotes = data.quoteResponse?.result || [];
          const batch = db.batch();
          let count = 0;
          
          quotes.forEach((q: any) => {
            let symbol = q.symbol;
            if (symbol.endsWith(".IS")) symbol = symbol.replace(".IS", "");
            if (symbol.startsWith("^")) symbol = symbol.replace("^", "");
            
            const priceDoc = db.collection("prices").doc(symbol);
            batch.set(priceDoc, {
              symbol: symbol,
              price: q.regularMarketPrice,
              change: q.regularMarketChangePercent || 0,
              volume: q.regularMarketVolume || 0,
              lastUpdated: new Date().toISOString()
            }, { merge: true });
            count++;
          });

          // Manual Gram Gold/Silver
          const prices: any = {};
          quotes.forEach((q: any) => prices[q.symbol] = q.regularMarketPrice);
          const usltry = prices["TRY=X"];
          const gold = prices["GC=F"];
          const silver = prices["SI=F"];
          
          if (usltry) {
            if (gold) {
              const gramGold = (gold / 31.1035) * usltry;
              batch.set(db.collection("prices").doc("GAU=X"), {
                symbol: "GAU=X",
                price: gramGold,
                lastUpdated: new Date().toISOString()
              }, { merge: true });
            }
            if (silver) {
              const gramSilver = (silver / 31.1035) * usltry;
              batch.set(db.collection("prices").doc("GAG=X"), {
                symbol: "GAG=X",
                price: gramSilver,
                lastUpdated: new Date().toISOString()
              }, { merge: true });
            }
          }

          if (count > 0) {
            await batch.commit();
            console.log(`[Worker] Updated ${count} BIST/Commodity prices (Batch ${Math.floor(i/batchSize) + 1})`);
          }
        } else if (res) {
          console.error(`[Worker] BIST fetch failed after retries: ${res.status}`);
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error("[Worker] BIST update failed:", err);
    }
  }

  // --- News Worker (Finnhub) ---
  async function updateNews() {
    if (!finnhubClient) return;
    try {
      finnhubClient.marketNews('general', {}, async (error, data) => {
        if (error) {
          console.error("[News] Finnhub error:", error);
          return;
        }
        if (data && Array.isArray(data)) {
          const batch = db.batch();
          data.slice(0, 10).forEach((item: any) => {
            const newsDoc = db.collection("news").doc(String(item.id));
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
        }
      });
    } catch (err) {
      console.error("[News] Update failed:", err);
    }
  }

  // Start background loops
  setInterval(updateCryptoPrices, 10000); 
  setInterval(updateBistPrices, 30000); 
  setInterval(updateNews, 60000); // News every minute
  
  // Initial run
  updateCryptoPrices();
  updateBistPrices();
  updateNews();

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

startServer();
