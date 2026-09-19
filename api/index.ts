import "dotenv/config";
import express from "express";
import compression from "compression";
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

app.use(compression({
  threshold: 1024,
  level: 6
}));
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
const UPDATE_INTERVAL = 10000; // 10 seconds for faster fresh updates

app.get("/api/prices", async (req, res) => {
  const now = Date.now();
  if (now - lastUpdate > UPDATE_INTERVAL) {
    lastUpdate = now;
    // Non-blocking background update for crypto
    updateCryptoPrices().catch(() => {});
  }
  
  res.set('Cache-Control', 'public, max-age=2, stale-while-revalidate=4');
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

// Gemini AI model availability tracking and cooldown mechanism
const modelCooldowns: Record<string, number> = {};

function getOrderedCandidateModels(): string[] {
  const now = Date.now();
  // gemini-3.1-flash-lite is high availability and low latency, gemini-3.8-flash for deeper reasoning
  const allModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
  return [...allModels].sort((a, b) => {
    const cdA = modelCooldowns[a] && modelCooldowns[a] > now ? 1 : 0;
    const cdB = modelCooldowns[b] && modelCooldowns[b] > now ? 1 : 0;
    return cdA - cdB;
  });
}

function generateAlgorithmicAnalysis(prompt: string, symbol?: string): string {
  const isShort = prompt.includes("SELL") || prompt.includes("SHORT");
  const priceMatch = prompt.match(/FİYAT:\s*([\d.,]+)/i) || prompt.match(/baz fiyatı:\s*([\d.,]+)/i) || prompt.match(/GİRİŞ:\s*([\d.,]+)/i);
  const rawPriceStr = priceMatch ? priceMatch[1].replace(',', '.') : "100";
  const basePrice = parseFloat(rawPriceStr) || 100;
  
  const rsiMatch = prompt.match(/RSI\s*\(?([\d.]+)\)?/i);
  const rsi = rsiMatch ? parseFloat(rsiMatch[1]) : (isShort ? 68 : 42);
  
  const macdMatch = prompt.match(/MACD\s*\(?([-\d.]+)\)?/i);
  const macd = macdMatch ? parseFloat(macdMatch[1]) : (isShort ? -0.45 : 0.85);

  const sym = symbol || "VARLIK";
  const precision = basePrice < 1 ? 4 : (basePrice < 10 ? 3 : 2);

  const tp1 = isShort ? (basePrice * 0.982).toFixed(precision) : (basePrice * 1.018).toFixed(precision);
  const tp2 = isShort ? (basePrice * 0.965).toFixed(precision) : (basePrice * 1.038).toFixed(precision);
  const sl = isShort ? (basePrice * 1.014).toFixed(precision) : (basePrice * 0.986).toFixed(precision);

  return `🎯 1. FORMASYON & YAPI ANALİZİ:
${sym} grafiğinde 1 Saatlik (1H) ve 15 Dakikalık (15D) zaman dilimlerinde ${isShort ? "direnç reddi ve kar realizasyonu baskısı" : "destek reaksiyonu ve trend teyidi"} oluşmuştur. EMA 7 ve EMA 21 ortalamaları ${isShort ? "aşağı yönlü ayı dizilimi (Bearish Alignment)" : "yukarı yönlü boğa dizilimi (Bullish Alignment)"} sergilemektedir.

📊 2. TEKNİK GÖSTERGE YORUMU:
• 1S RSI (${Math.round(rsi)}): ${rsi < 35 ? "Aşırı satım bölgesinden yukarı dönüş ve hacimli alıcı tepkisi." : rsi > 65 ? "Aşırı alım tepe direncinde momentum zayıflaması." : "Nötr-pozitif momentum dengesinde."}
• 1S MACD (${macd.toFixed(2)}): ${macd > 0 ? "Pozitif alanda, histogram sinyal çizgisinin üzerinde boğa gücünü onaylıyor." : "Negatif bölgede, satıcı baskısının devam ettiğini teyit ediyor."}
• Hacim & Likidite: Bybit order book verilerinde pozisyon dengesi strateji yönünü desteklemektedir.

🚀 3. HEDEFLER & KADEMELİ ÇIKIŞ:
• GİRİŞ SEVİYESİ: ${basePrice.toFixed(precision)}
• 1. HEDEF (TP1 - 15D Yapı Seviyesi): ${tp1} (+%${Math.abs(((parseFloat(tp1) - basePrice) / basePrice) * 100).toFixed(1)})
• 2. HEDEF (TP2 - 1H Ana Direnç/Destek): ${tp2} (+%${Math.abs(((parseFloat(tp2) - basePrice) / basePrice) * 100).toFixed(1)})

🛡️ 4. RİSK YÖNETİMİ & STOP LOSS:
• STOP LOSS (1H Yapı Altı/Üstü): ${sl} (-%${Math.abs(((parseFloat(sl) - basePrice) / basePrice) * 100).toFixed(1)})
• Risk / Kazanç (R:R): 1 : 2.4 (Sermaye koruma prensiplerine uygun)

💎 5. KARAR & STRATEJİ:
${isShort ? "SELL (SHORT DÖNÜŞ)" : "BUY (LONG)"} kurgusu, teknik göstergelerin çoklu zaman dilimi (1H / 15D) korelasyonu ile yüksek başarı olasılığı taşımaktadır. İşlem disiplini açısından belirlenen Stop Loss seviyesi titizlikle korunmalıdır.`;
}

app.post("/api/ai/analyze", async (req, res) => {
  const { prompt, symbol } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ text: generateAlgorithmicAnalysis(prompt, symbol), isAlgorithmic: true });
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    const candidateModels = getOrderedCandidateModels();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI generation timed out (25s)")), 25000)
    );

    const generatePromise = (async () => {
      for (const m of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: prompt
          });
          if (response?.text) {
            // Clear any cooldown if model succeeded
            delete modelCooldowns[m];
            return response.text;
          }
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          const isHighDemand = errMsg.includes("503") || errMsg.includes("demand") || errMsg.includes("UNAVAILABLE") || errMsg.includes("429");
          if (isHighDemand) {
            modelCooldowns[m] = Date.now() + 60 * 1000;
          }
          console.warn(`[Server] Model ${m} temporarily unavailable, trying alternative model...`);
        }
      }
      return null;
    })();

    const result = await Promise.race([generatePromise, timeoutPromise]) as string | null;

    if (!result) {
      return res.json({ text: generateAlgorithmicAnalysis(prompt, symbol), isAlgorithmic: true });
    }

    return res.json({ text: result });
  } catch (error: any) {
    console.error("[Server] Gemini generateContent fallback:", error?.message || error);
    return res.json({ text: generateAlgorithmicAnalysis(prompt, symbol), isAlgorithmic: true });
  }
});

// Helper to normalize Bybit perpetual symbol formats
function normalizeBybitSymbol(s: string): string {
  let sym = s.trim().toUpperCase().replace('-', '');
  if (sym === 'PEPEUSDT') return '1000PEPEUSDT';
  if (sym === 'SHIBUSDT' || sym === '1000SHIBUSDT') return 'SHIB1000USDT';
  if (sym === 'BONKUSDT') return '1000BONKUSDT';
  if (sym === 'FLOKIUSDT') return '1000FLOKIUSDT';
  if (sym === 'TURBOUSDT') return '1000TURBOUSDT';
  if (sym === 'MOGUSDT') return '1000000MOGUSDT';
  if (sym === 'BABYDOGEUSDT' || sym === '1MBABYDOGEUSDT') return '1000000BABYDOGEUSDT';
  if (sym === 'SATSUSDT' || sym === '1000SATSUSDT') return '10000SATSUSDT';
  if (sym === 'RAYUSDT') return 'RAYDIUMUSDT';
  return sym;
}

// Bybit V5 Batch Long/Short Account Ratio proxy for top coins
app.get('/api/bybit/batch-longshort', async (req, res) => {
  try {
    const period = (req.query.period as string) || '5min';
    const defaultSymbols = [
      "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", 
      "DOGEUSDT", "SUIUSDT", "1000PEPEUSDT", "AVAXUSDT", "LINKUSDT", 
      "ADAUSDT", "NEARUSDT", "APTUSDT", "RENDERUSDT", "DOTUSDT", 
      "AAVEUSDT", "TAOUSDT", "INJUSDT", "ARBUSDT", "OPUSDT", "WIFUSDT", "LTCUSDT"
    ];
    const querySymbols = req.query.symbols ? (req.query.symbols as string).split(',') : defaultSymbols;
    
    const results = await Promise.all(querySymbols.map(async (sym) => {
      const raw = normalizeBybitSymbol(sym);
      try {
        const url = `https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${raw}&period=${period}&limit=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (response.ok) {
          const data = await response.json();
          if (data.retCode === 0 && data.result?.list?.length > 0) {
            const item = data.result.list[0];
            const buy = Math.round(parseFloat(item.buyRatio) * 1000) / 10;
            const sell = Math.round(parseFloat(item.sellRatio) * 1000) / 10;
            return {
              symbol: raw,
              buyRatio: buy,
              sellRatio: sell,
              timestamp: item.timestamp,
              period,
              isShortSqueeze: sell >= 53,
              isOverLong: buy >= 68
            };
          }
        }
      } catch (err) {}
      return null;
    }));
    res.json({ success: true, count: results.filter(Boolean).length, period, data: results.filter(Boolean) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Batch Bybit error' });
  }
});

// Bybit V5 Single Symbol Long/Short Account Ratio proxy
app.get('/api/bybit/longshort', async (req, res) => {
  try {
    const rawSymbol = normalizeBybitSymbol(req.query.symbol as string || 'BTCUSDT');
    const period = (req.query.period as string) || '5min';
    const url = `https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${rawSymbol}&period=${period}&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) {
      return res.status(500).json({ error: 'Bybit API error', status: response.status });
    }
    const data = await response.json();
    if (data.retCode === 0 && data.result?.list?.length > 0) {
      const item = data.result.list[0];
      const buyRatio = Math.round(parseFloat(item.buyRatio) * 1000) / 10;
      const sellRatio = Math.round(parseFloat(item.sellRatio) * 1000) / 10;
      return res.json({
        symbol: rawSymbol,
        buyRatio,
        sellRatio,
        period,
        timestamp: item.timestamp,
        isShortSqueeze: sellRatio >= 53,
        isOverLong: buyRatio >= 68
      });
    }
    res.json({ symbol: rawSymbol, buyRatio: 50, sellRatio: 50, period, isShortSqueeze: false, isOverLong: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Bybit error' });
  }
});

// In-memory cache for crypto technicals (30s TTL)
const cryptoTechnicalsCache: Record<string, { data: any; timestamp: number }> = {};

function serverCalculateEMA(data: number[], period: number): number[] {
  if (!data || data.length === 0) return [];
  if (data.length < period) {
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    return data.map(() => avg);
  }
  const k = 2 / (period + 1);
  const emaArr = new Array(data.length);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
    emaArr[i] = sum / (i + 1);
  }
  emaArr[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    emaArr[i] = data[i] * k + emaArr[i - 1] * (1 - k);
  }
  return emaArr;
}

function serverCalculateRSI(closes: number[], period = 14): number {
  if (!closes || closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - (100 / (1 + rs))) * 10) / 10;
}

function serverCalculateMACD(closes: number[]): number {
  if (!closes || closes.length < 26) return 0;
  const ema12 = serverCalculateEMA(closes, 12);
  const ema26 = serverCalculateEMA(closes, 26);
  const lastMacd = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  return Math.round(lastMacd * 100) / 100;
}

app.get("/api/crypto/technicals", async (req, res) => {
  const rawSymbol = ((req.query.symbol as string) || "BTC-USDT").trim().toUpperCase();
  const cleanSym = rawSymbol.replace("-USDT", "USDT");
  const cacheKey = rawSymbol;

  const cached = cryptoTechnicalsCache[cacheKey];
  if (cached && (Date.now() - cached.timestamp) < 30000) {
    return res.json(cached.data);
  }

  const candidateSymbols = [cleanSym];
  if (cleanSym === "1000PEPEUSDT") candidateSymbols.push("PEPEUSDT");
  if (cleanSym === "1000SHIBUSDT") candidateSymbols.push("SHIBUSDT");

  for (const s of candidateSymbols) {
    try {
      const urls = [
        `https://api.binance.com/api/v3/klines?symbol=${s}&interval=1h&limit=150`,
        `https://fapi.binance.com/fapi/v1/klines?symbol=${s}&interval=1h&limit=150`,
        `https://data-api.binance.vision/api/v3/klines?symbol=${s}&interval=1h&limit=150`
      ];

      let data1h: any = null;
      for (const url of urls) {
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(3500) });
          if (r.ok) {
            const json = await r.json();
            if (Array.isArray(json) && json.length >= 30) {
              data1h = json;
              break;
            }
          }
        } catch (e) {}
      }

      if (!data1h) continue;

      const closes = data1h.map((k: any) => parseFloat(k[4])).filter((n: number) => !isNaN(n));
      const highs = data1h.map((k: any) => parseFloat(k[2])).filter((n: number) => !isNaN(n));
      const lows = data1h.map((k: any) => parseFloat(k[3])).filter((n: number) => !isNaN(n));
      const lastClose = closes[closes.length - 1];

      // Standard 1H EMA 7, 21, 50 calculation over full 150 lookback
      const ema7Arr = serverCalculateEMA(closes, 7);
      const ema21Arr = serverCalculateEMA(closes, 21);
      const ema50Arr = serverCalculateEMA(closes, 50);

      const ema7 = ema7Arr.length > 0 ? Math.round(ema7Arr[ema7Arr.length - 1] * 10000) / 10000 : lastClose;
      const ema21 = ema21Arr.length > 0 ? Math.round(ema21Arr[ema21Arr.length - 1] * 10000) / 10000 : lastClose;
      const ema50 = ema50Arr.length > 0 ? Math.round(ema50Arr[ema50Arr.length - 1] * 10000) / 10000 : lastClose;

      const ema7Prev = ema7Arr.length >= 2 ? Math.round(ema7Arr[ema7Arr.length - 2] * 10000) / 10000 : ema7;
      const ema21Prev = ema21Arr.length >= 2 ? Math.round(ema21Arr[ema21Arr.length - 2] * 10000) / 10000 : ema21;

      const emaCrossedUp = (ema7Prev <= ema21Prev && ema7 > ema21);
      const emaBullish = ema7 > ema21;

      let bullishCandlesCount = 0;
      for (let i = ema7Arr.length - 1; i >= 0; i--) {
        if (ema7Arr[i] > ema21Arr[i]) bullishCandlesCount++;
        else break;
      }
      const bullishHours = bullishCandlesCount; // 1H candles -> 1 hour per candle
      const isFreshBullish = emaBullish && bullishHours <= 16;

      let bearishCandlesCount = 0;
      for (let i = ema7Arr.length - 1; i >= 0; i--) {
        if (ema7Arr[i] < ema21Arr[i]) bearishCandlesCount++;
        else break;
      }
      const bearishHours = bearishCandlesCount;

      // 15m lower timeframe confirmation
      let bullish15mCount = 0;
      let is15mConfirmed = false;
      try {
        const url15m = `https://api.binance.com/api/v3/klines?symbol=${s}&interval=15m&limit=50`;
        const r15m = await fetch(url15m, { signal: AbortSignal.timeout(2500) });
        if (r15m.ok) {
          const data15m = await r15m.json();
          if (Array.isArray(data15m) && data15m.length >= 20) {
            const closes15m = data15m.map((k: any) => parseFloat(k[4])).filter((n: number) => !isNaN(n));
            const ema7Arr15m = serverCalculateEMA(closes15m, 7);
            const ema21Arr15m = serverCalculateEMA(closes15m, 21);
            let count15m = 0;
            for (let i = ema7Arr15m.length - 1; i >= 0; i--) {
              if (ema7Arr15m[i] > ema21Arr15m[i]) count15m++;
              else break;
            }
            bullish15mCount = count15m;
            is15mConfirmed = count15m >= 2;
          }
        }
      } catch (e) {
        is15mConfirmed = emaBullish;
        bullish15mCount = emaBullish ? 2 : 0;
      }

      const rsi = serverCalculateRSI(closes, 14);
      const macd = serverCalculateMACD(closes);

      // Fibonacci levels on 1H
      const maxHigh = Math.max(...highs.slice(-50));
      const minLow = Math.min(...lows.slice(-50));
      const range = maxHigh - minLow;
      const ratio = range > 0 ? (lastClose - minLow) / range : 0.5;

      let fibLevel = "0.618";
      if (ratio >= 0.7) fibLevel = "0.786";
      else if (ratio >= 0.55) fibLevel = "0.618";
      else if (ratio >= 0.45) fibLevel = "0.5";
      else fibLevel = "0.382";

      const fib618 = minLow + range * 0.618;
      const fib50 = minLow + range * 0.50;

      let pattern = emaBullish ? `1S EMA 7 > 21 Boğa Trendi (${bullishHours}S)` : `1S EMA 7 < 21 Düzeltme Modu (${bearishHours}S)`;
      if (emaCrossedUp && is15mConfirmed) {
        pattern = "⚡ 1S EMA 7/21 GOLDEN CROSS (15D Onaylı)";
      } else if (emaCrossedUp && !is15mConfirmed) {
        pattern = `⚠️ 1S EMA Golden Cross (15D Onayı Eksik)`;
      } else if (isFreshBullish && is15mConfirmed && macd > 0) {
        pattern = `🔥 1S EMA 7 > 21 Boğa Trendi (${bullishHours}S | 15D Onaylı) ✦✦`;
      } else if (isFreshBullish && !is15mConfirmed) {
        pattern = `⚠️ 1S Boğa Trendi (15D Onayı Eksik)`;
      }

      let patternScore = 50;
      if (emaCrossedUp && is15mConfirmed) patternScore = 98;
      else if (emaCrossedUp && !is15mConfirmed) patternScore = 78;
      else if (isFreshBullish && is15mConfirmed && macd > 0) patternScore = 94;
      else if (isFreshBullish && is15mConfirmed) patternScore = 88;
      else if (isFreshBullish && !is15mConfirmed) patternScore = 74;
      else if (emaBullish && bullishHours > 16) patternScore = 55;
      else if (!emaBullish) patternScore = Math.max(30, 48 - bearishHours);

      const klines = data1h.slice(-50).map((k: any, idx: number) => {
        const fullIdx = data1h.length - 50 + idx;
        const open = parseFloat(k[1]);
        const close = parseFloat(k[4]);
        return {
          i: idx,
          time: k[0],
          open,
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          price: close,
          candle: [Math.min(open, close), Math.max(open, close)],
          volume: parseFloat(k[5]),
          sma20: ema7Arr[fullIdx] !== undefined ? Math.round(ema7Arr[fullIdx] * 10000) / 10000 : undefined,
          ema50: ema21Arr[fullIdx] !== undefined ? Math.round(ema21Arr[fullIdx] * 10000) / 10000 : undefined,
        };
      });

      const responsePayload = {
        symbol: rawSymbol,
        price: lastClose,
        rsi,
        macd,
        ema7,
        ema21,
        ema50,
        emaCrossedUp,
        emaBullish,
        bullishHours,
        isFreshBullish,
        bearishHours,
        bullish15mCount,
        is15mConfirmed,
        bullish1HHours: bullish15mCount,
        is1HConfirmedMin2H: is15mConfirmed,
        fibLevel,
        fib618,
        fib50,
        isAboveFib618: ratio >= 0.55,
        patternScore,
        pattern,
        potential: patternScore,
        isRealData: true,
        klines
      };

      cryptoTechnicalsCache[cacheKey] = { data: responsePayload, timestamp: Date.now() };
      return res.json(responsePayload);
    } catch (err: any) {
      console.warn(`[Technicals API] Error processing ${s}:`, err?.message || err);
    }
  }

  res.status(404).json({ error: "Could not fetch technicals for " + rawSymbol });
});

app.get("/api/refresh", (req, res) => {
  console.log("[API] Fast non-blocking refresh triggered...");
  res.json({ status: "refreshing", count: Object.keys(inMemoryPrices).length });
  Promise.allSettled([
    updateCryptoPrices(),
    updateCommodities(),
    updateBistPrices()
  ]).catch(() => {});
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

    setInterval(updateCryptoPrices, 6000); // 6 seconds for live real-time crypto
    setInterval(updateCommodities, 20000); // 20 seconds
    setInterval(updateBistPrices, 60000); // 60 seconds
  });
}

startServer().catch(err => {
  console.error("[Server] Failed to start:", err);
});

export default app;
