import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar } from "recharts";
import { GoogleGenAI } from "@google/genai";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const BIST_STOCKS = [
{ symbol: "THYAO", name: "Türk Hava Yolları", price: 284.50, change: 2.34, volume: 48200000, sector: "Ulaşım" },
{ symbol: "GARAN", name: "Garanti BBVA", price: 112.80, change: -0.88, volume: 112000000, sector: "Bankacılık" },
{ symbol: "AKBNK", name: "Akbank", price: 74.25, change: 1.12, volume: 89000000, sector: "Bankacılık" },
{ symbol: "EREGL", name: "Ereğli Demir Çelik", price: 48.62, change: 3.15, volume: 67000000, sector: "Metal" },
{ symbol: "KCHOL", name: "Koç Holding", price: 198.40, change: 0.55, volume: 23000000, sector: "Holding" },
{ symbol: "SAHOL", name: "Sabancı Holding", price: 143.20, change: 1.88, volume: 31000000, sector: "Holding" },
{ symbol: "BIMAS", name: "BİM Mağazalar", price: 516.00, change: -1.20, volume: 8400000, sector: "Perakende" },
{ symbol: "TOASO", name: "Tofaş Oto", price: 312.75, change: 4.22, volume: 12000000, sector: "Otomotiv" },
{ symbol: "ARCLK", name: "Arçelik", price: 224.80, change: 2.65, volume: 15000000, sector: "Beyaz Eşya" },
{ symbol: "TUPRS", name: "Tüpraş", price: 498.50, change: 0.90, volume: 9200000, sector: "Enerji" },
{ symbol: "SISE", name: "Şişe Cam", price: 57.30, change: 3.80, volume: 42000000, sector: "Cam" },
{ symbol: "DOHOL", name: "Doğan Holding", price: 26.18, change: 5.12, volume: 88000000, sector: "Holding" },
{ symbol: "PETKM", name: "Petkim", price: 38.44, change: 2.98, volume: 55000000, sector: "Kimya" },
{ symbol: "FROTO", name: "Ford Otosan", price: 1124.00, change: 1.45, volume: 3100000, sector: "Otomotiv" },
{ symbol: "ASELS", name: "Aselsan", price: 89.70, change: 6.34, volume: 28000000, sector: "Savunma" },
{ symbol: "KOZAL", name: "Koza Altın", price: 2187.00, change: 3.22, volume: 1800000, sector: "Madencilik" },
{ symbol: "MGROS", name: "Migros", price: 628.50, change: -0.32, volume: 4200000, sector: "Perakende" },
{ symbol: "PGSUS", name: "Pegasus", price: 742.80, change: 4.88, volume: 6700000, sector: "Ulaşım" },
{ symbol: "TAVHL", name: "TAV Havalimanları", price: 348.40, change: 2.10, volume: 7800000, sector: "Ulaşım" },
{ symbol: "YKBNK", name: "Yapı Kredi", price: 39.84, change: 1.55, volume: 145000000, sector: "Bankacılık" },
{ symbol: "EKGYO", name: "Emlak Konut GYO", price: 24.56, change: 7.22, volume: 198000000, sector: "GYO" },
{ symbol: "VESTL", name: "Vestel", price: 41.28, change: 5.44, volume: 62000000, sector: "Elektronik" },
{ symbol: "ODAS", name: "Odaş Elektrik", price: 82.15, change: 8.90, volume: 34000000, sector: "Enerji" },
{ symbol: "SMRTG", name: "Smart Güneş Enerjisi", price: 31.42, change: 9.15, volume: 47000000, sector: "Yenilenebilir" },
{ symbol: "CANTE", name: "Çan2 Termik", price: 18.74, change: 6.88, volume: 91000000, sector: "Enerji" },
];

const CRYPTO_COINS = [
  { symbol: "BTC-USD", name: "Bitcoin", price: 65000, change: 1.2, volume: 35000000000, sector: "Crypto" },
  { symbol: "ETH-USD", name: "Ethereum", price: 3500, change: 0.8, volume: 15000000000, sector: "Crypto" },
  { symbol: "SOL-USD", name: "Solana", price: 145, change: 4.5, volume: 4000000000, sector: "Crypto" },
  { symbol: "BNB-USD", name: "Binance Coin", price: 580, change: -0.5, volume: 1200000000, sector: "Crypto" },
  { symbol: "XRP-USD", name: "XRP", price: 0.62, change: 2.1, volume: 2000000000, sector: "Crypto" },
  { symbol: "ADA-USD", name: "Cardano", price: 0.58, change: -1.2, volume: 500000000, sector: "Crypto" },
  { symbol: "AVAX-USD", name: "Avalanche", price: 54, change: 3.8, volume: 800000000, sector: "Crypto" },
  { symbol: "DOGE-USD", name: "Dogecoin", price: 0.18, change: 8.5, volume: 3000000000, sector: "Crypto" },
  { symbol: "DOT-USD", name: "Polkadot", price: 9.2, change: 0.4, volume: 300000000, sector: "Crypto" },
  { symbol: "LINK-USD", name: "Chainlink", price: 18.5, change: 2.3, volume: 600000000, sector: "Crypto" },
  { symbol: "MATIC-USD", name: "Polygon", price: 0.98, change: -0.2, volume: 400000000, sector: "Crypto" },
  { symbol: "NEAR-USD", name: "Near Protocol", price: 7.4, change: 5.6, volume: 700000000, sector: "Crypto" },
  { symbol: "PEPE-USD", name: "Pepe", price: 0.000008, change: 12.4, volume: 1200000000, sector: "Crypto" },
  { symbol: "FET-USD", name: "Fetch.ai", price: 2.8, change: 6.2, volume: 400000000, sector: "Crypto" },
  { symbol: "RNDR-USD", name: "Render", price: 11.2, change: 4.8, volume: 500000000, sector: "Crypto" },
];

const PATTERN_DATA: Record<string, any> = {
THYAO: { rsi: 38, macd: 0.42, fibLevel: "0.618", patternScore: 78, pattern: "Düşen Kama Kırılımı", potential: 42 },
GARAN: { rsi: 55, macd: -0.12, fibLevel: "0.382", patternScore: 45, pattern: "Yatay Konsolidasyon", potential: 18 },
AKBNK: { rsi: 41, macd: 0.28, fibLevel: "0.5", patternScore: 62, pattern: "Bayrак Formasyonu", potential: 35 },
EREGL: { rsi: 36, macd: 0.65, fibLevel: "0.618", patternScore: 85, pattern: "Düşen Kama Kırılımı ✦", potential: 58 },
KCHOL: { rsi: 52, macd: 0.05, fibLevel: "0.236", patternScore: 38, pattern: "Güçlü Yukarı Trend", potential: 22 },
SAHOL: { rsi: 44, macd: 0.31, fibLevel: "0.5", patternScore: 71, pattern: "Çift Dip", potential: 48 },
BIMAS: { rsi: 62, macd: -0.22, fibLevel: "0.382", patternScore: 29, pattern: "Direnç Bölgesi", potential: 12 },
TOASO: { rsi: 39, macd: 0.78, fibLevel: "0.618", patternScore: 88, pattern: "Düşen Kama Kırılımı ✦", potential: 65 },
ARCLK: { rsi: 42, macd: 0.55, fibLevel: "0.618", patternScore: 76, pattern: "RSI Diverjans + Fib", potential: 52 },
TUPRS: { rsi: 48, macd: 0.18, fibLevel: "0.5", patternScore: 55, pattern: "Simetrik Üçgen", potential: 28 },
SISE: { rsi: 35, macd: 0.82, fibLevel: "0.786", patternScore: 91, pattern: "Düşen Kama Kırılımı ✦", potential: 72 },
DOHOL: { rsi: 33, macd: 0.91, fibLevel: "0.786", patternScore: 93, pattern: "Düşen Kama + RSI Ayrışma ✦", potential: 78 },
PETKM: { rsi: 37, macd: 0.61, fibLevel: "0.618", patternScore: 82, pattern: "Düşen Kama Kırılımı ✦", potential: 55 },
FROTO: { rsi: 58, macd: 0.12, fibLevel: "0.236", patternScore: 42, pattern: "Yükseliş Kanalı", potential: 20 },
ASELS: { rsi: 34, macd: 0.95, fibLevel: "0.786", patternScore: 96, pattern: "Düşen Kama + Hacim ✦✦", potential: 85 },
KOZAL: { rsi: 40, macd: 0.72, fibLevel: "0.618", patternScore: 83, pattern: "RSI Dipten Kalkış + Fib", potential: 62 },
MGROS: { rsi: 55, macd: -0.08, fibLevel: "0.5", patternScore: 32, pattern: "Konsolidasyon", potential: 15 },
PGSUS: { rsi: 36, macd: 0.88, fibLevel: "0.786", patternScore: 89, pattern: "Düşen Kama Kırılımı ✦", potential: 68 },
TAVHL: { rsi: 43, macd: 0.48, fibLevel: "0.618", patternScore: 74, pattern: "Çift Dip + MACD Kesişim", potential: 45 },
YKBNK: { rsi: 45, macd: 0.22, fibLevel: "0.5", patternScore: 58, pattern: "Destek Testi", potential: 32 },
EKGYO: { rsi: 31, macd: 1.02, fibLevel: "0.786", patternScore: 94, pattern: "Düşen Kama + Hacim ✦✦", potential: 82 },
VESTL: { rsi: 33, macd: 0.87, fibLevel: "0.786", patternScore: 90, pattern: "RSI Aşırı Satım + Fib ✦", potential: 71 },
ODAS: { rsi: 30, macd: 1.15, fibLevel: "0.786", patternScore: 97, pattern: "MACD + Hacim Patlaması ✦✦", potential: 90 },
SMRTG: { rsi: 29, macd: 1.18, fibLevel: "0.786", patternScore: 95, pattern: "Düşen Kama + Tüm Sinyaller ✦✦", potential: 88 },
CANTE: { rsi: 32, macd: 0.98, fibLevel: "0.786", patternScore: 92, pattern: "Kırılım + Hacim Artışı ✦", potential: 76 },
"BTC-USD": { rsi: 32, macd: 1.2, fibLevel: "0.618", patternScore: 88, pattern: "Bullish Divergence", potential: 45 },
"ETH-USD": { rsi: 45, macd: 0.5, fibLevel: "0.5", patternScore: 72, pattern: "Ascending Triangle", potential: 32 },
"SOL-USD": { rsi: 28, macd: 1.8, fibLevel: "0.786", patternScore: 94, pattern: "Falling Wedge Breakout", potential: 65 },
"BNB-USD": { rsi: 52, macd: -0.2, fibLevel: "0.382", patternScore: 48, pattern: "Consolidation", potential: 15 },
"XRP-USD": { rsi: 38, macd: 0.8, fibLevel: "0.618", patternScore: 79, pattern: "Double Bottom", potential: 38 },
"ADA-USD": { rsi: 35, macd: 0.4, fibLevel: "0.5", patternScore: 65, pattern: "Rounding Bottom", potential: 28 },
"AVAX-USD": { rsi: 31, macd: 1.1, fibLevel: "0.786", patternScore: 89, pattern: "Cup and Handle", potential: 52 },
"DOGE-USD": { rsi: 25, macd: 2.5, fibLevel: "0.886", patternScore: 96, pattern: "Meme Momentum 🚀", potential: 120 },
"DOT-USD": { rsi: 42, macd: 0.3, fibLevel: "0.5", patternScore: 61, pattern: "Accumulation", potential: 25 },
"LINK-USD": { rsi: 39, macd: 0.9, fibLevel: "0.618", patternScore: 82, pattern: "Channel Breakout", potential: 48 },
"MATIC-USD": { rsi: 48, macd: 0.1, fibLevel: "0.382", patternScore: 52, pattern: "Symmetrical Triangle", potential: 22 },
"NEAR-USD": { rsi: 29, macd: 1.5, fibLevel: "0.786", patternScore: 92, pattern: "Parabolic Move Potential", potential: 75 },
"PEPE-USD": { rsi: 22, macd: 3.2, fibLevel: "0.886", patternScore: 98, pattern: "Extreme Oversold 🐸", potential: 250 },
"FET-USD": { rsi: 34, macd: 1.4, fibLevel: "0.618", patternScore: 91, pattern: "AI Narrative Hype", potential: 85 },
"RNDR-USD": { rsi: 36, macd: 1.2, fibLevel: "0.618", patternScore: 87, pattern: "Bull Flag", potential: 58 },
};

function generateCandleData(basePrice: number, periods = 60) {
  const data = [];
  const validBasePrice = Number.isFinite(basePrice) ? basePrice : 100; // Fallback to 100 if invalid
  let price = validBasePrice * 0.82;
  for (let i = 0; i < periods; i++) {
    const isDown = i < 35;
    const trend = isDown ? -0.003 : 0.008;
    const noise = (Math.random() - 0.48) * 0.025;
    price = price * (1 + trend + noise);
    const high = price * (1 + Math.random() * 0.015);
    const low = price * (1 - Math.random() * 0.015);
    const open = price * (1 + (Math.random() - 0.5) * 0.008);
    data.push({
      i,
      price: +price.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      open: +open.toFixed(2),
      volume: Math.floor(Math.random() * 1000000 + 200000),
      rsi: i < 30 ? 65 - i * 0.8 + Math.random() * 5 : 30 + (i - 30) * 1.2 + Math.random() * 5,
      macd: i < 35 ? -0.5 + i * 0.01 : (i - 35) * 0.05,
    });
  }
  return data;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function BISTAnalyzer() {
const [screen, setScreen] = useState("scanner"); 
const [market, setMarket] = useState<"BIST" | "CRYPTO">("BIST");
const [selectedStock, setSelectedStock] = useState<any>(null);
const [scanning, setScanning] = useState(false);
const [scanProgress, setScanProgress] = useState(0);
const [scanned, setScanned] = useState(false);
const [candidates, setCandidates] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    [...BIST_STOCKS, ...CRYPTO_COINS].forEach(s => { p[s.symbol] = s.price; p[`${s.symbol}_change`] = s.change; });
    return p;
  });
  const [lastUpdated, setLastUpdated] = useState<string>("");
const [aiAnalysis, setAiAnalysis] = useState("");
const [aiLoading, setAiLoading] = useState(false);
const [timeframe, setTimeframe] = useState("1S");
const [tab, setTab] = useState("teknik"); 
const [kapNews, setKapNews] = useState<any[]>([]);
const scanIntervalRef = useRef<any>(null);
const [currentTime, setCurrentTime] = useState("");

useEffect(() => {
  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }));
  };
  updateTime();
  const timer = setInterval(updateTime, 10000);
  return () => clearInterval(timer);
}, []);

// CORS hatasını çözen Proxy'li gerçek zamanlı API isteği
useEffect(() => {
  const fetchLivePrices = async () => {
    try {
      const stockSymbols = BIST_STOCKS.map(s => `${s.symbol}.IS`);
      const cryptoSymbols = CRYPTO_COINS.map(s => s.symbol);
      const indexSymbols = ["XU100.IS", "XU030.IS", "TRY=X"];
      const allSymbols = [...stockSymbols, ...cryptoSymbols, ...indexSymbols];
      
      // Yahoo Finance spark endpoint limits the number of symbols per request.
      // Split into batches of 10.
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < allSymbols.length; i += batchSize) {
        batches.push(allSymbols.slice(i, i + batchSize).join(","));
      }

      let allData = {};
      let anySuccess = false;

      for (const batchSymbols of batches) {
        try {
          const res = await fetch(`/api/yahoo?symbols=${batchSymbols}`);
          if (res.ok) {
            const batchData = await res.json();
            allData = { ...allData, ...batchData };
            anySuccess = true;
          }
        } catch (e) {
          console.warn(`Batch fetch error:`, e);
        }
      }
      
      if (anySuccess) {
        setPrices(prev => {
          const next = { ...prev };
          Object.keys(allData).forEach(key => {
            const sym = key.replace(".IS", "");
            const stockData = (allData as any)[key];
            
            if (stockData && stockData.price !== undefined && stockData.price !== null) {
              next[sym] = +stockData.price.toFixed(sym.includes("-USD") ? 4 : 2);
              
              if (stockData.change !== undefined && stockData.change !== null) {
                next[`${sym}_change`] = +stockData.change.toFixed(2);
              } else if (stockData.previousClose) {
                const change = ((stockData.price - stockData.previousClose) / stockData.previousClose) * 100;
                next[`${sym}_change`] = +change.toFixed(2);
              }
            }
          });
          return next;
        });
        setLastUpdated(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (err) {
      console.error("Veri çekilirken hata oluştu:", err);
    }
  };

  fetchLivePrices(); 
  const interval = setInterval(fetchLivePrices, 20000);
  return () => clearInterval(interval);
}, []);

const startScan = useCallback(() => {
  setScanning(true);
  setScanProgress(0);
  setScanned(false);
  setCandidates([]);
  let p = 0;
  const currentStocks = market === "BIST" ? BIST_STOCKS : CRYPTO_COINS;
  scanIntervalRef.current = setInterval(() => {
    p += Math.random() * 4 + 1;
    if (p >= 100) {
      p = 100;
      clearInterval(scanIntervalRef.current);
      setScanning(false);
      setScanned(true);

      // Dynamically calculate potential based on live price changes and mock pattern data
      const found = currentStocks.map(s => {
        const pd = PATTERN_DATA[s.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
        let liveChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
        if (!Number.isFinite(liveChange)) liveChange = 0;
        
        // Calculate a dynamic score: base potential + (liveChange * 5)
        let dynamicPotential = pd.potential + (liveChange * 5);
        // Ensure it stays between 0 and 100
        dynamicPotential = Math.max(0, Math.min(100, dynamicPotential));
        
        return { ...s, dynamicPotential };
      }).filter(s => s.dynamicPotential >= 40)
        .sort((a, b) => b.dynamicPotential - a.dynamicPotential);

      setCandidates(found);
    }
    setScanProgress(Math.min(p, 100));
  }, 80);
}, [prices, market]);

const openDetail = useCallback(async (stock: any) => {
  setSelectedStock(stock);
  setScreen("detail");
  setAiAnalysis("");
  setAiLoading(true);
  const pd = PATTERN_DATA[stock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
  const news = [
    { date: "02.04.2026", title: `${stock.name} - Yönetim Kurulu Kararı`, source: "KAP", type: "pozitif" },
    { date: "01.04.2026", title: `${stock.symbol} için Analist Hedef Fiyat Revizesi`, source: "KAP", type: "nötr" },
    { date: "31.03.2026", title: `${stock.name} büyüme beklentilerini aştı`, source: "X/Twitter", type: "pozitif" },
  ];
  setKapNews(news);
  try {
    const promptPrice = Number.isFinite(Number(prices[stock.symbol] ?? stock.price)) ? Number(prices[stock.symbol] ?? stock.price) : 0;
    const promptChange = Number.isFinite(Number(prices[`${stock.symbol}_change`] ?? stock.change)) ? Number(prices[`${stock.symbol}_change`] ?? stock.change) : 0;
    const isCrypto = stock.symbol.includes("-USD");
    const prompt = `Sen profesyonel bir ${isCrypto ? "Kripto Para" : "Borsa İstanbul"} teknik analistisin. ${stock.symbol} (${stock.name}) için kısa ve etkili teknik analiz yap.

Mevcut veriler:

- Fiyat: ${promptPrice} ${isCrypto ? "USD" : "TL"}
- Günlük Değişim: %${promptChange > 0 ? "+" : ""}${promptChange}
- RSI (1 saat): ${pd.rsi}
- MACD: ${pd.macd > 0 ? "Alım sinyali" : "Satım sinyali"}
- Fibonacci Desteği: ${pd.fibLevel} seviyesi
- Tespit Edilen Formasyon: ${pd.pattern}
- Hedef Potansiyel: %${pd.potential}+

Şu formatta yanıtla (emojiler kullan, kısa ve net ol):
🎯 FORMASYON: [1 cümle]
📊 TEKNİK: RSI, MACD ve Fibonacci hakkında [2-3 cümle]  
⚡ SCALP (1S): 1 saatlik periyot için giriş ve kısa vade kar al (TP) seviyesi [1 cümle]
🎰 RİSK: Dikkat edilmesi gereken stop seviyesi [1 cümle]
💎 SONUÇ: Al/Bekle/Sat önerisi ve neden`;

    // Moving AI Analysis to frontend using process.env.GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API anahtarı bulunamadı. Lütfen Ayarlar -> Secrets kısmından GEMINI_API_KEY ekleyin.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const text = response.text || "Analiz yüklenemedi.";
    setAiAnalysis(text);
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    setAiAnalysis(`⚠️ Analiz şu an yüklenemiyor. Hata: ${err.message}`);
  }
  setAiLoading(false);
}, [prices]);

return (
<div style={{
display: "flex", justifyContent: "center", alignItems: "center",
minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0e1a 100%)",
fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
padding: "20px"
}}>
<div style={{
width: 393, minHeight: 852, maxHeight: 900,
background: "#0d1117",
borderRadius: 55, overflow: "hidden",
boxShadow: "0 0 0 1px #1a1f2e, 0 0 80px rgba(0,200,150,0.15), 0 40px 120px rgba(0,0,0,0.8)",
position: "relative", display: "flex", flexDirection: "column",
border: "1px solid #1e2535"
}}>
<div style={{ padding: "14px 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d1117" }}>
<span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>{currentTime}</span>
<div style={{ width: 120, height: 34, background: "#000", borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 8 }} />
<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
<svg width="17" height="12" viewBox="0 0 17 12" fill="#fff"><rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/><rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/><rect x="9" y="0" width="3" height="12" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1"/></svg>
<svg width="16" height="12" viewBox="0 0 16 12" fill="#fff"><path d="M8 2.5C10.5 2.5 12.8 3.5 14.4 5.2L15.8 3.8C13.8 1.8 11.1 0.5 8 0.5C4.9 0.5 2.2 1.8 0.2 3.8L1.6 5.2C3.2 3.5 5.5 2.5 8 2.5Z" opacity="0.4"/><path d="M8 5.5C9.7 5.5 11.2 6.2 12.4 7.3L13.8 5.9C12.2 4.4 10.2 3.5 8 3.5C5.8 3.5 3.8 4.4 2.2 5.9L3.6 7.3C4.8 6.2 6.3 5.5 8 5.5Z" opacity="0.7"/><circle cx="8" cy="10" r="1.5"/></svg>
<div style={{ background: "#fff", borderRadius: 3, width: 25, height: 12, padding: "0 2px", display: "flex", alignItems: "center" }}>
<div style={{ background: "#30d158", borderRadius: 2, width: "85%", height: 8 }}/>
</div>
</div>
</div>

    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}>
      {screen === "scanner" && <ScannerScreen
        scanning={scanning} scanProgress={scanProgress} scanned={scanned}
        candidates={candidates} prices={prices} lastUpdated={lastUpdated}
        onScan={startScan}
        onViewCandidates={() => setScreen("candidates")}
        onViewScalp={() => setScreen("scalp")}
        stocks={market === "BIST" ? BIST_STOCKS : CRYPTO_COINS}
        market={market} setMarket={setMarket}
      />}
      {screen === "candidates" && <CandidatesScreen
        candidates={candidates} prices={prices} lastUpdated={lastUpdated}
        onBack={() => setScreen("scanner")}
        onSelect={openDetail}
      />}
      {screen === "scalp" && <ScalpScreen
        candidates={candidates} prices={prices} lastUpdated={lastUpdated}
        onBack={() => setScreen("scanner")}
        onSelect={(s: any) => { setTimeframe("1S"); openDetail(s); }}
      />}
      {screen === "detail" && selectedStock && <DetailScreen
        stock={selectedStock} prices={prices}
        patternData={PATTERN_DATA[selectedStock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 }}
        aiAnalysis={aiAnalysis} aiLoading={aiLoading}
        kapNews={kapNews} tab={tab} setTab={setTab}
        timeframe={timeframe} setTimeframe={setTimeframe}
        onBack={() => setScreen("candidates")}
      />}
    </div>

    <BottomNav screen={screen} setScreen={setScreen} candidates={candidates} />
  </div>
</div>
);
}

function ScannerScreen({ scanning, scanProgress, scanned, candidates, prices, lastUpdated, onScan, onViewCandidates, onViewScalp, stocks, market, setMarket }: any) {
const topMovers = [...stocks].sort((a, b) => {
  let changeA = Number(prices[`${a.symbol}_change`] ?? a.change ?? 0);
  if (!Number.isFinite(changeA)) changeA = 0;
  let changeB = Number(prices[`${b.symbol}_change`] ?? b.change ?? 0);
  if (!Number.isFinite(changeB)) changeB = 0;
  return Math.abs(changeB) - Math.abs(changeA);
}).slice(0, 5);
return (
<div style={{ padding: "0 0 20px" }}>
<div style={{ padding: "8px 20px 16px", borderBottom: "1px solid #1a1f2e" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
<div>
<div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{market === "BIST" ? "BİST ANALİZ" : "KRİPTO ANALİZ"}</div>
<div style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Tarayıcı</div>
{lastUpdated && <div style={{ color: "#4a5568", fontSize: 10, marginTop: 2 }}>Güncelleme: {lastUpdated}</div>}
</div>
<div style={{ textAlign: "right" }}>
<div style={{ color: "#30d158", fontSize: 11, fontWeight: 600, background: "rgba(48,209,88,0.1)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(48,209,88,0.3)" }}>● CANLI</div>
<div style={{ color: "#4a5568", fontSize: 11, marginTop: 4 }}>{stocks.length} {market === "BIST" ? "hisse" : "coin"}</div>
</div>
</div>

    <div style={{ display: "flex", background: "#131922", borderRadius: 12, padding: 3, marginTop: 14 }}>
      {[["BIST", "🇹🇷 BİST"], ["CRYPTO", "₿ KRİPTO"]].map(([key, label]) => (
        <button key={key} onClick={() => setMarket(key)} style={{
          flex: 1, padding: "8px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
          background: market === key ? "#00d4aa" : "transparent", color: market === key ? "#000" : "#4a5568",
          transition: "all 0.2s"
        }}>{label}</button>
      ))}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
      {[
        { label: "BIST 100", val: prices["XU100"] ? prices["XU100"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "...", chg: prices["XU100_change"] ? `${prices["XU100_change"] > 0 ? "+" : ""}${prices["XU100_change"]}%` : "", up: prices["XU100_change"] >= 0 },
        { label: "BTC/USD", val: prices["BTC-USD"] ? prices["BTC-USD"].toLocaleString("en-US", { style: "currency", currency: "USD" }) : "...", chg: prices["BTC-USD_change"] ? `${prices["BTC-USD_change"] > 0 ? "+" : ""}${prices["BTC-USD_change"]}%` : "", up: prices["BTC-USD_change"] >= 0 },
        { label: "USD/TRY", val: prices["TRY=X"] ? prices["TRY=X"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "...", chg: prices["TRY=X_change"] ? `${prices["TRY=X_change"] > 0 ? "+" : ""}${prices["TRY=X_change"]}%` : "", up: prices["TRY=X_change"] >= 0 },
      ].map(m => (
        <div key={m.label} style={{ background: "#131922", borderRadius: 12, padding: "10px 10px" }}>
          <div style={{ color: "#4a5568", fontSize: 9, fontWeight: 600, letterSpacing: 1 }}>{m.label}</div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{m.val}</div>
          <div style={{ color: m.up ? "#30d158" : "#ff453a", fontSize: 10, fontWeight: 600 }}>{m.chg}</div>
        </div>
      ))}
    </div>
  </div>

  <div style={{ padding: "20px 20px 16px" }}>
    <div style={{ background: "linear-gradient(135deg, #131922 0%, #0d1117 100%)", borderRadius: 20, padding: 20, border: "1px solid #1a2535" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #00d4aa22, #00b8ff22)", border: "1px solid #00d4aa44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔍</div>
        <div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Formasyon Tarayıcısı</div>
          <div style={{ color: "#4a5568", fontSize: 12 }}>Düşen Kama • RSI • MACD • Fib</div>
        </div>
      </div>

      {scanning && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#00d4aa", fontSize: 12, fontWeight: 600 }}>{market === "BIST" ? "BİST" : "Kripto"} taranıyor...</span>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{Math.round(scanProgress)}%</span>
          </div>
          <div style={{ background: "#1a1f2e", borderRadius: 8, height: 6, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(90deg, #00d4aa, #00b8ff)", width: `${scanProgress}%`, height: "100%", borderRadius: 8, transition: "width 0.1s" }} />
          </div>
          <div style={{ color: "#4a5568", fontSize: 11, marginTop: 6 }}>
            {Math.round(scanProgress / 100 * stocks.length)} / {stocks.length} {market === "BIST" ? "hisse" : "coin"} analiz edildi
          </div>
        </div>
      )}

      {scanned && (
        <div style={{ background: "rgba(0,212,170,0.08)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, border: "1px solid rgba(0,212,170,0.2)" }}>
          <div style={{ color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>✦ {candidates.length} aday tespit edildi</div>
          <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>%50+ potansiyel • Yüksek güven skoru</div>
        </div>
      )}

      <button
        onClick={onScan}
        disabled={scanning}
        style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: scanning ? "#1a1f2e" : "linear-gradient(135deg, #00d4aa, #00b8ff)",
          color: scanning ? "#4a5568" : "#000", border: "none", cursor: scanning ? "not-allowed" : "pointer",
          fontSize: 15, fontWeight: 700, letterSpacing: 0.3
        }}
      >
        {scanning ? "Taranıyor..." : scanned ? "Yeniden Tara" : "🚀 Tüm BİST'i Tara"}
      </button>

      {scanned && (
        <button
          onClick={onViewScalp}
          style={{
            width: "100%", marginTop: 8, padding: "12px", borderRadius: 14,
            background: "rgba(0,212,170,0.1)", color: "#00d4aa", border: "1px solid #00d4aa44",
            cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          ⚡ Scalp Fırsatlarını Gör
        </button>
      )}
      {scanned && (
        <button
          onClick={onViewCandidates}
          style={{
            width: "100%", marginTop: 8, padding: "12px", borderRadius: 14,
            background: "transparent", color: "#6b7280", border: "1px solid #1a1f2e",
            cursor: "pointer", fontSize: 14, fontWeight: 600
          }}
        >
          Tüm Adayları Gör →
        </button>
      )}
    </div>
  </div>

  <div style={{ padding: "0 20px" }}>
    <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Günün Öne Çıkanları</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {topMovers.map(s => (
        <MoverRow key={s.symbol} stock={s} prices={prices} />
      ))}
    </div>
  </div>
</div>
);
}

function MoverRow({ stock, prices }: any) {
let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
if (!Number.isFinite(price)) price = 0;
let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
if (!Number.isFinite(currentChange)) currentChange = 0;
const up = currentChange >= 0;
return (
<div style={{ display: "flex", alignItems: "center", gap: 12, background: "#131922", borderRadius: 14, padding: "12px 14px" }}>
<div style={{ width: 40, height: 40, borderRadius: 12, background: up ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)", border: `1px solid ${up ? "rgba(48,209,88,0.3)" : "rgba(255,69,58,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: up ? "#30d158" : "#ff453a" }}>
{stock.symbol.slice(0, 2)}
</div>
<div style={{ flex: 1 }}>
<div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{stock.symbol}</div>
<div style={{ color: "#4a5568", fontSize: 11 }}>{stock.sector}</div>
</div>
<div style={{ textAlign: "right" }}>
<div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{price.toFixed(2)} ₺</div>
<div style={{ color: up ? "#30d158" : "#ff453a", fontSize: 12, fontWeight: 600 }}>{up ? "+" : ""}{currentChange.toFixed(2)}%</div>
</div>
<MiniSparkline up={up} />
</div>
);
}

function MiniSparkline({ up }: { up: boolean }) {
const data = Array.from({ length: 12 }, (_, i) => ({
v: 50 + Math.sin(i * 0.5) * 10 + (up ? i * 1.5 : -i * 1.5) + Math.random() * 5
}));
return (
<div style={{ width: 50, height: 28 }}>
<ResponsiveContainer width="100%" height="100%">
<LineChart data={data}>
<Line type="monotone" dataKey="v" stroke={up ? "#30d158" : "#ff453a"} strokeWidth={1.5} dot={false} />
</LineChart>
</ResponsiveContainer>
</div>
);
}

function ScalpScreen({ candidates, prices, lastUpdated, onBack, onSelect }: any) {
  // Filter for stocks with high RSI or specific scalp patterns if needed
  // For now, we'll use the same candidates but with a scalp-focused UI
  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ padding: "8px 20px 16px", borderBottom: "1px solid #1a1f2e", background: "linear-gradient(180deg, rgba(0,212,170,0.05) 0%, transparent 100%)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#00d4aa", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 10 }}>
          ← Geri
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Scalp Fırsatları</div>
              <div style={{ background: "#00d4aa", color: "#000", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>1 SAATLİK</div>
            </div>
            <div style={{ color: "#4a5568", fontSize: 13, marginTop: 2 }}>Anlık giriş ve kısa vade kar al noktaları</div>
          </div>
          {lastUpdated && <div style={{ color: "#4a5568", fontSize: 10, marginBottom: 4 }}>{lastUpdated}</div>}
        </div>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {candidates.slice(0, 8).map((stock: any) => {
          const pd = PATTERN_DATA[stock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
          let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
          if (!Number.isFinite(price)) price = 0;
          let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
          if (!Number.isFinite(currentChange)) currentChange = 0;
          const up = currentChange >= 0;
          const isCrypto = stock.symbol.includes("-USD");
          const currency = isCrypto ? "$" : "₺";
          
          const scalpTp = +(price * 1.025).toFixed(isCrypto ? 4 : 2);
          const scalpSl = +(price * 0.985).toFixed(isCrypto ? 4 : 2);

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelect(stock)}
              style={{ background: "#131922", borderRadius: 20, padding: "16px", border: "1px solid rgba(0,212,170,0.2)", cursor: "pointer", textAlign: "left", width: "100%", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "#00d4aa" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{stock.symbol}</div>
                  <div style={{ color: "#4a5568", fontSize: 11 }}>{stock.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{price.toFixed(isCrypto ? 4 : 2)} {currency}</div>
                  <div style={{ color: up ? "#30d158" : "#ff453a", fontSize: 12, fontWeight: 700 }}>{up ? "+" : ""}{currentChange.toFixed(2)}%</div>
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "8px", textAlign: "center" }}>
                  <div style={{ color: "#4a5568", fontSize: 9, fontWeight: 700 }}>GİRİŞ</div>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{price.toFixed(isCrypto ? 4 : 2)}</div>
                </div>
                <div style={{ background: "rgba(48,209,88,0.08)", borderRadius: 12, padding: "8px", textAlign: "center", border: "1px solid rgba(48,209,88,0.2)" }}>
                  <div style={{ color: "#30d158", fontSize: 9, fontWeight: 700 }}>HEDEF</div>
                  <div style={{ color: "#30d158", fontSize: 13, fontWeight: 800 }}>{scalpTp}</div>
                </div>
                <div style={{ background: "rgba(255,69,58,0.08)", borderRadius: 12, padding: "8px", textAlign: "center", border: "1px solid rgba(255,69,58,0.2)" }}>
                  <div style={{ color: "#ff453a", fontSize: 9, fontWeight: 700 }}>STOP</div>
                  <div style={{ color: "#ff453a", fontSize: 13, fontWeight: 800 }}>{scalpSl}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: "rgba(191,90,242,0.1)", color: "#bf5af2", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>RSI: {pd.rsi}</span>
                  <span style={{ background: "rgba(0,184,255,0.1)", color: "#00b8ff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{pd.pattern}</span>
                </div>
                <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 800 }}>Analiz Et →</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CandidatesScreen({ candidates, prices, lastUpdated, onBack, onSelect }: any) {
return (
<div style={{ padding: "0 0 20px" }}>
<div style={{ padding: "8px 20px 16px", borderBottom: "1px solid #1a1f2e" }}>
<button onClick={onBack} style={{ background: "none", border: "none", color: "#00d4aa", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 10 }}>
← Geri
</button>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
<div>
<div style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Adaylar</div>
<div style={{ color: "#4a5568", fontSize: 13, marginTop: 2 }}>%50+ potansiyel • {candidates.length} hisse</div>
</div>
{lastUpdated && <div style={{ color: "#4a5568", fontSize: 10, marginBottom: 4 }}>Güncelleme: {lastUpdated}</div>}
</div>
</div>
  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
    {candidates.map((stock: any, idx: number) => {
      const pd = PATTERN_DATA[stock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
      let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
      if (!Number.isFinite(price)) price = 0;
      let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
      if (!Number.isFinite(currentChange)) currentChange = 0;
      const up = currentChange >= 0;
      const isTop = idx < 3;
      return (
        <button
          key={stock.symbol}
          onClick={() => onSelect(stock)}
          style={{ background: isTop ? "linear-gradient(135deg, #131922, #0d1420)" : "#131922", borderRadius: 18, padding: "14px 16px", border: isTop ? "1px solid rgba(0,212,170,0.3)" : "1px solid #1a1f2e", cursor: "pointer", textAlign: "left", width: "100%" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isTop && <div style={{ fontSize: 16 }}>{["🥇", "🥈", "🥉"][idx]}</div>}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>{stock.symbol}</span>
                  <span style={{ background: "rgba(0,212,170,0.15)", color: "#00d4aa", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, border: "1px solid rgba(0,212,170,0.3)" }}>
                    +%{(Number.isFinite(Number(stock.dynamicPotential ?? pd.potential)) ? Number(stock.dynamicPotential ?? pd.potential) : 0).toFixed(1)}
                  </span>
                </div>
                <div style={{ color: "#4a5568", fontSize: 11, marginTop: 2 }}>{stock.name}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{price.toFixed(2)} ₺</div>
              <div style={{ color: up ? "#30d158" : "#ff453a", fontSize: 12, fontWeight: 600 }}>{up ? "+" : ""}{currentChange.toFixed(2)}%</div>
            </div>
          </div>

          <div style={{ background: "rgba(0,212,170,0.06)", borderRadius: 10, padding: "8px 10px", marginBottom: 10 }}>
            <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700 }}>📐 {pd.pattern}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            <Pill label="RSI" val={pd.rsi} good={pd.rsi < 40} />
            <Pill label="MACD" val={pd.macd > 0 ? "▲" : "▼"} good={pd.macd > 0} />
            <Pill label="FIB" val={pd.fibLevel} good />
            <Pill label="POT." val={`+${(Number.isFinite(Number(stock.dynamicPotential ?? pd.potential)) ? Number(stock.dynamicPotential ?? pd.potential) : 0).toFixed(1)}%`} good={true} />
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#4a5568", fontSize: 10 }}>Güven Skoru</span>
              <span style={{ color: pd.patternScore > 85 ? "#ffd60a" : "#00d4aa", fontSize: 10, fontWeight: 700 }}>{pd.patternScore}/100</span>
            </div>
            <div style={{ background: "#1a1f2e", borderRadius: 4, height: 4 }}>
              <div style={{ background: pd.patternScore > 85 ? "linear-gradient(90deg, #ffd60a, #ff9f0a)" : "linear-gradient(90deg, #00d4aa, #00b8ff)", width: `${pd.patternScore}%`, height: "100%", borderRadius: 4 }} />
            </div>
          </div>
        </button>
      );
    })}
  </div>
</div>
);
}

function Pill({ label, val, good }: any) {
return (
<div style={{ background: good ? "rgba(0,212,170,0.08)" : "rgba(255,69,58,0.08)", borderRadius: 8, padding: "5px 0", textAlign: "center" }}>
<div style={{ color: "#4a5568", fontSize: 9, fontWeight: 600 }}>{label}</div>
<div style={{ color: good ? "#00d4aa" : "#ff453a", fontSize: 12, fontWeight: 700 }}>{val}</div>
</div>
);
}

function DetailScreen({ stock, prices, patternData: pd, aiAnalysis, aiLoading, kapNews, tab, setTab, timeframe, setTimeframe, onBack }: any) {
let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
if (!Number.isFinite(price)) price = 0;
let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
if (!Number.isFinite(currentChange)) currentChange = 0;
const up = currentChange >= 0;
const isCrypto = stock.symbol.includes("-USD");
const currency = isCrypto ? "$" : "₺";
const chartData = useMemo(() => generateCandleData(price), [stock.symbol, price]);

const tp1 = +(price * 1.15).toFixed(isCrypto ? 4 : 2);
const tp2 = +(price * 1.28).toFixed(isCrypto ? 4 : 2);
let potential = Number(stock.dynamicPotential ?? pd.potential ?? 0);
if (!Number.isFinite(potential)) potential = 0;
const tp3 = +(price * (1 + potential / 100)).toFixed(isCrypto ? 4 : 2);
const sl = +(price * 0.92).toFixed(isCrypto ? 4 : 2);
const support = +(price * 0.95).toFixed(isCrypto ? 4 : 2);
const resist = +(price * 1.08).toFixed(isCrypto ? 4 : 2);

// Scalp Levels (Short Term)
const scalpTp1 = +(price * 1.02).toFixed(isCrypto ? 4 : 2);
const scalpTp2 = +(price * 1.04).toFixed(isCrypto ? 4 : 2);
const scalpSl = +(price * 0.985).toFixed(isCrypto ? 4 : 2);

return (
<>
<div style={{ padding: "0 0 20px" }}>
<div style={{ padding: "8px 20px 12px", borderBottom: "1px solid #1a1f2e" }}>
<button onClick={onBack} style={{ background: "none", border: "none", color: "#00d4aa", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}>← Geri</button>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
<div>
<div style={{ color: "#fff", fontSize: 26, fontWeight: 800 }}>{stock.symbol}</div>
<div style={{ color: "#4a5568", fontSize: 12 }}>{stock.name}</div>
</div>
<div style={{ textAlign: "right" }}>
<div style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>{price.toFixed(isCrypto ? 4 : 2)} {currency}</div>
<div style={{ color: up ? "#30d158" : "#ff453a", fontSize: 14, fontWeight: 700 }}>
{up ? "▲" : "▼"} {up ? "+" : ""}{currentChange.toFixed(2)}%
</div>
</div>
</div>
    <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto" }}>
      {[
        { l: "RSI", v: pd.rsi, good: pd.rsi < 40 },
        { l: "MACD", v: pd.macd > 0 ? "ALIŞ" : "SATIŞ", good: pd.macd > 0 },
        { l: "FIB", v: pd.fibLevel, good: true },
        { l: "SKOR", v: `${pd.patternScore}`, good: pd.patternScore > 75 },
        { l: "POT.", v: `+%${potential.toFixed(1)}`, good: true },
      ].map(s => (
        <div key={s.l} style={{ flexShrink: 0, background: "#131922", borderRadius: 10, padding: "8px 12px", border: s.good ? "1px solid rgba(0,212,170,0.2)" : "1px solid rgba(255,69,58,0.2)" }}>
          <div style={{ color: "#4a5568", fontSize: 9, fontWeight: 700 }}>{s.l}</div>
          <div style={{ color: s.good ? "#00d4aa" : "#ff453a", fontSize: 12, fontWeight: 800 }}>{s.v}</div>
        </div>
      ))}
    </div>
  </div>

  <div style={{ padding: "14px 16px 0" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div style={{ color: "#00d4aa", fontSize: 12, fontWeight: 700 }}>📐 {pd.pattern}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {["1S", "4S", "1G"].map(tf => (
          <button key={tf} onClick={() => setTimeframe(tf)} style={{
            padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
            background: timeframe === tf ? "#00d4aa" : "#131922", color: timeframe === tf ? "#000" : "#4a5568"
          }}>{tf}</button>
        ))}
      </div>
    </div>

    <div style={{ background: "#0a0e1a", borderRadius: 16, padding: "10px 0 5px", border: "1px solid #1a1f2e" }}>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
          <defs>
            <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="i" tick={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "#4a5568" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#131922", border: "1px solid #1a1f2e", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#4a5568" }} itemStyle={{ color: "#00d4aa" }} formatter={(v: any) => [`${v.toFixed(2)} ₺`, "Fiyat"]} labelFormatter={() => ""} />
          <ReferenceLine y={timeframe === "1S" ? scalpTp1 : tp1} stroke="#30d158" strokeDasharray="3 3" strokeWidth={1} label={{ value: timeframe === "1S" ? `Scalp TP: ${scalpTp1}` : `TP1: ${tp1}`, position: "right", fontSize: 9, fill: "#30d158" }} />
          <ReferenceLine y={timeframe === "1S" ? scalpSl : sl} stroke="#ff453a" strokeDasharray="3 3" strokeWidth={1} label={{ value: timeframe === "1S" ? `Scalp SL: ${scalpSl}` : `SL: ${sl}`, position: "right", fontSize: 9, fill: "#ff453a" }} />
          <Area type="monotone" dataKey="price" stroke="#00d4aa" strokeWidth={1.5} fill="url(#colorUp)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    {timeframe === "1S" ? (
      <div style={{ marginTop: 12, background: "linear-gradient(135deg, #1a2535 0%, #0a0e1a 100%)", borderRadius: 16, padding: 14, border: "1px solid rgba(0,212,170,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>⚡ Scalp (Çok Kısa Vade) Analizi</div>
          <div style={{ background: "rgba(0,212,170,0.1)", color: "#00d4aa", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>1 SAATLİK</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "GİRİŞ / AL", val: `${price.toFixed(isCrypto ? 4 : 2)} ${currency}`, color: "#fff", bg: "rgba(255,255,255,0.05)" },
            { label: "HEDEF 1 (+2%)", val: `${scalpTp1} ${currency}`, color: "#30d158", bg: "rgba(48,209,88,0.08)" },
            { label: "HEDEF 2 (+4%)", val: `${scalpTp2} ${currency}`, color: "#30d158", bg: "rgba(48,209,88,0.08)" },
            { label: "STOP LOSS (-1.5%)", val: `${scalpSl} ${currency}`, color: "#ff453a", bg: "rgba(255,69,58,0.08)" },
          ].map(t => (
            <div key={t.label} style={{ background: t.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${t.color}33` }}>
              <div style={{ color: "#6b7280", fontSize: 9, fontWeight: 700 }}>{t.label}</div>
              <div style={{ color: t.color, fontSize: 14, fontWeight: 800, marginTop: 2 }}>{t.val}</div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div style={{ marginTop: 12, background: "#0a0e1a", borderRadius: 16, padding: 14, border: "1px solid #1a2535" }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🎯 {timeframe === "4S" ? "4 Saatlik" : "Günlük"} TP / SL Seviyeleri</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "TP 1 (+15%)", val: `${tp1} ${currency}`, color: "#30d158", bg: "rgba(48,209,88,0.08)" },
            { label: "TP 2 (+28%)", val: `${tp2} ${currency}`, color: "#30d158", bg: "rgba(48,209,88,0.08)" },
            { label: `TP 3 (+${potential.toFixed(1)}%)`, val: `${tp3} ${currency}`, color: "#ffd60a", bg: "rgba(255,214,10,0.08)" },
            { label: "STOP LOSS (-8%)", val: `${sl} ${currency}`, color: "#ff453a", bg: "rgba(255,69,58,0.08)" },
          ].map(t => (
            <div key={t.label} style={{ background: t.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${t.color}33` }}>
              <div style={{ color: "#6b7280", fontSize: 9, fontWeight: 700 }}>{t.label}</div>
              <div style={{ color: t.color, fontSize: 14, fontWeight: 800, marginTop: 2 }}>{t.val}</div>
            </div>
          ))}
        </div>
      </div>
    )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div style={{ background: "rgba(0,212,170,0.06)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(0,212,170,0.2)" }}>
          <div style={{ color: "#6b7280", fontSize: 9, fontWeight: 700 }}>DESTEK</div>
          <div style={{ color: "#00d4aa", fontSize: 13, fontWeight: 800 }}>{support} {currency}</div>
        </div>
        <div style={{ background: "rgba(255,159,10,0.06)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,159,10,0.2)" }}>
          <div style={{ color: "#6b7280", fontSize: 9, fontWeight: 700 }}>DİRENÇ</div>
          <div style={{ color: "#ff9f0a", fontSize: 13, fontWeight: 800 }}>{resist} {currency}</div>
        </div>
      </div>
    </div>

    <div style={{ marginTop: 12, background: "#0a0e1a", borderRadius: 16, padding: "10px 0 5px", border: "1px solid #1a1f2e" }}>
      <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, paddingLeft: 14, marginBottom: 4 }}>HACİM</div>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={chartData.slice(-20)} margin={{ top: 0, right: 10, left: -30, bottom: 0 }}>
          <XAxis tick={false} axisLine={false} />
          <YAxis tick={false} axisLine={false} />
          <Bar dataKey="volume" fill="#00d4aa" opacity={0.5} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={{ marginTop: 8, background: "#0a0e1a", borderRadius: 16, padding: "10px 0 5px", border: "1px solid #1a1f2e" }}>
      <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, paddingLeft: 14, marginBottom: 4 }}>RSI (14)</div>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={chartData.slice(-40)} margin={{ top: 0, right: 10, left: -30, bottom: 0 }}>
          <XAxis tick={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: "#4a5568" }} axisLine={false} tickLine={false} />
          <ReferenceLine y={30} stroke="#ff453a" strokeDasharray="2 2" strokeWidth={1} />
          <ReferenceLine y={70} stroke="#30d158" strokeDasharray="2 2" strokeWidth={1} />
          <Line type="monotone" dataKey="rsi" stroke="#bf5af2" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>

  <div style={{ display: "flex", margin: "14px 16px 0", background: "#131922", borderRadius: 12, padding: 3 }}>
    {[["teknik", "🔬 Teknik Analiz"], ["temel", "📰 Temel Analiz"]].map(([key, label]) => (
      <button key={key} onClick={() => setTab(key)} style={{
        flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
        background: tab === key ? "#0d1117" : "transparent", color: tab === key ? "#fff" : "#4a5568"
      }}>{label}</button>
    ))}
  </div>

  {tab === "teknik" && (
    <div style={{ margin: "12px 16px 0", background: "linear-gradient(135deg, #0d1420, #0a0e1a)", borderRadius: 18, padding: 16, border: "1px solid #1a2535" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #bf5af2, #5e5ce6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
        <div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>AI Analiz</div>
          <div style={{ color: "#4a5568", fontSize: 10 }}>Claude Sonnet • Anlık</div>
        </div>
      </div>
      {aiLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[100, 85, 92, 70].map((w, i) => (
            <div key={i} style={{ background: "#1a1f2e", borderRadius: 6, height: 12, width: `${w}%`, animation: "pulse 1.5s infinite" }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
        </div>
      ) : (
        <div style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiAnalysis}</div>
      )}
    </div>
  )}

  {tab === "temel" && (
    <div style={{ margin: "12px 16px 0" }}>
      <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>KAP & X HABERLERI</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {kapNews.map((n: any, i: number) => (
          <div key={i} style={{ background: "#131922", borderRadius: 14, padding: "12px 14px", border: "1px solid #1a1f2e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: n.source === "KAP" ? "rgba(0,184,255,0.15)" : "rgba(191,90,242,0.15)", color: n.source === "KAP" ? "#00b8ff" : "#bf5af2", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{n.source}</span>
                <span style={{ background: n.type === "pozitif" ? "rgba(48,209,88,0.15)" : "rgba(100,100,100,0.15)", color: n.type === "pozitif" ? "#30d158" : "#6b7280", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{n.type}</span>
              </div>
              <span style={{ color: "#4a5568", fontSize: 10 }}>{n.date}</span>
            </div>
            <div style={{ color: "#fff", fontSize: 13, lineHeight: 1.4 }}>{n.title}</div>
          </div>
        ))}

        <div style={{ background: "#131922", borderRadius: 14, padding: 14, border: "1px solid #1a1f2e", marginTop: 4 }}>
          <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>TEMEL METRİKLER</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { l: "F/K Oranı", v: (Math.random() * 8 + 4).toFixed(1) + "x" },
              { l: "PD/DD", v: (Math.random() * 2 + 0.8).toFixed(2) + "x" },
              { l: "Piyasa Değeri", v: (Math.random() * 50 + 5).toFixed(1) + "B ₺" },
              { l: "Temettü Verimi", v: (Math.random() * 5 + 1).toFixed(1) + "%" },
            ].map(m => (
              <div key={m.l}>
                <div style={{ color: "#4a5568", fontSize: 10 }}>{m.l}</div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )}
</>
);
}

function BottomNav({ screen, setScreen, candidates }: any) {
return (
<div style={{ background: "rgba(13,17,23,0.95)", borderTop: "1px solid #1a1f2e", padding: "10px 0 28px", display: "flex", justifyContent: "space-around", backdropFilter: "blur(20px)" }}>
{[
{ key: "scanner", icon: "🔍", label: "Tarayıcı" },
{ key: "scalp", icon: "⚡", label: "Scalp" },
{ key: "candidates", icon: "⭐", label: "Adaylar", badge: candidates.length },
{ key: "detail", icon: "📊", label: "Analiz" },
].map(n => (
<button
key={n.key}
onClick={() => n.key !== "detail" && setScreen(n.key)}
style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative", opacity: n.key === "detail" && screen !== "detail" ? 0.4 : 1 }}
>
<span style={{ fontSize: 22 }}>{n.icon}</span>
<span style={{ fontSize: 10, color: screen === n.key ? "#00d4aa" : "#4a5568", fontWeight: 600 }}>{n.label}</span>
{n.badge && n.badge > 0 ? (
<div style={{ position: "absolute", top: -4, right: -8, background: "#ff453a", borderRadius: 10, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 800 }}>{n.badge}</div>
) : null}
</button>
))}
</div>
);
}
