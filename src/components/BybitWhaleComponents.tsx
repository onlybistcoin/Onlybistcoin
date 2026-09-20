import React, { useState, useEffect, useMemo } from "react";
import { RefreshCw, Search, ArrowLeft, ExternalLink, Zap, AlertTriangle, ShieldCheck, Flame, TrendingUp, TrendingDown } from "lucide-react";

export type TopTraderDeterminationType = 
  | "SHORT_SQUEEZE"
  | "STRONG_WHALE_LONG"
  | "OVER_LONG"
  | "WHALE_SHORT_BIAS"
  | "BALANCED";

export interface BybitRatioItem {
  symbol: string;
  cleanSymbol: string;
  name: string;
  price?: number;
  change?: number;
  buyRatio: number;
  sellRatio: number;
  timestamp: string;
  period: string;
  determination: TopTraderDeterminationType;
  determinationLabel: string;
  determinationDesc: string;
  whaleScore: number;
  whaleBias: "BULLISH_SQUEEZE" | "STRONG_BULLISH" | "OVERBOUGHT_CORRECTION" | "BEARISH_DISTRIBUTION" | "NEUTRAL";
  isShortSqueeze: boolean;
  isOverLong: boolean;
  isStrongWhaleLong: boolean;
  isWhaleShort: boolean;
}

export const TOP_100_COINS = [
  { symbol: "BTCUSDT", clean: "BTC", name: "Bitcoin" },
  { symbol: "ETHUSDT", clean: "ETH", name: "Ethereum" },
  { symbol: "SOLUSDT", clean: "SOL", name: "Solana" },
  { symbol: "BNBUSDT", clean: "BNB", name: "BNB" },
  { symbol: "XRPUSDT", clean: "XRP", name: "Ripple" },
  { symbol: "DOGEUSDT", clean: "DOGE", name: "Dogecoin" },
  { symbol: "ADAUSDT", clean: "ADA", name: "Cardano" },
  { symbol: "AVAXUSDT", clean: "AVAX", name: "Avalanche" },
  { symbol: "SUIUSDT", clean: "SUI", name: "Sui Network" },
  { symbol: "LINKUSDT", clean: "LINK", name: "Chainlink" },
  { symbol: "1000PEPEUSDT", clean: "PEPE", name: "Pepe" },
  { symbol: "NEARUSDT", clean: "NEAR", name: "Near Protocol" },
  { symbol: "APTUSDT", clean: "APT", name: "Aptos" },
  { symbol: "DOTUSDT", clean: "DOT", name: "Polkadot" },
  { symbol: "SHIB1000USDT", clean: "SHIB", name: "Shiba Inu" },
  { symbol: "LTCUSDT", clean: "LTC", name: "Litecoin" },
  { symbol: "BCHUSDT", clean: "BCH", name: "Bitcoin Cash" },
  { symbol: "UNIUSDT", clean: "UNI", name: "Uniswap" },
  { symbol: "RENDERUSDT", clean: "RENDER", name: "Render" },
  { symbol: "FETUSDT", clean: "FET", name: "Artificial Superintelligence" },
  { symbol: "TAOUSDT", clean: "TAO", name: "Bittensor" },
  { symbol: "AAVEUSDT", clean: "AAVE", name: "Aave" },
  { symbol: "ARBUSDT", clean: "ARB", name: "Arbitrum" },
  { symbol: "OPUSDT", clean: "OP", name: "Optimism" },
  { symbol: "WIFUSDT", clean: "WIF", name: "Dogwifhat" },
  { symbol: "INJUSDT", clean: "INJ", name: "Injective" },
  { symbol: "TIAUSDT", clean: "TIA", name: "Celestia" },
  { symbol: "STXUSDT", clean: "STX", name: "Stacks" },
  { symbol: "FILUSDT", clean: "FIL", name: "Filecoin" },
  { symbol: "ATOMUSDT", clean: "ATOM", name: "Cosmos" },
  { symbol: "KASUSDT", clean: "KAS", name: "Kaspa" },
  { symbol: "HBARUSDT", clean: "HBAR", name: "Hedera" },
  { symbol: "ETCUSDT", clean: "ETC", name: "Ethereum Classic" },
  { symbol: "ICPUSDT", clean: "ICP", name: "Internet Computer" },
  { symbol: "RUNEUSDT", clean: "RUNE", name: "THORChain" },
  { symbol: "LDOUSDT", clean: "LDO", name: "Lido DAO" },
  { symbol: "SEIUSDT", clean: "SEI", name: "Sei" },
  { symbol: "JUPUSDT", clean: "JUP", name: "Jupiter" },
  { symbol: "1000FLOKIUSDT", clean: "FLOKI", name: "Floki" },
  { symbol: "1000BONKUSDT", clean: "BONK", name: "Bonk" },
  { symbol: "ORDIUSDT", clean: "ORDI", name: "Ordinals" },
  { symbol: "GALAUSDT", clean: "GALA", name: "Gala" },
  { symbol: "VETUSDT", clean: "VET", name: "VeChain" },
  { symbol: "MKRUSDT", clean: "MKR", name: "Maker" },
  { symbol: "GRTUSDT", clean: "GRT", name: "The Graph" },
  { symbol: "ALGOUSDT", clean: "ALGO", name: "Algorand" },
  { symbol: "EGLDUSDT", clean: "EGLD", name: "MultiversX" },
  { symbol: "CRVUSDT", clean: "CRV", name: "Curve DAO" },
  { symbol: "DYDXUSDT", clean: "DYDX", name: "dYdX" },
  { symbol: "PENDLEUSDT", clean: "PENDLE", name: "Pendle" },
  { symbol: "ARKMUSDT", clean: "ARKM", name: "Arkham" },
  { symbol: "ENAUSDT", clean: "ENA", name: "Ethena" },
  { symbol: "10000SATSUSDT", clean: "SATS", name: "Sats" },
  { symbol: "BOMEUSDT", clean: "BOME", name: "BOOK OF MEME" },
  { symbol: "MEWUSDT", clean: "MEW", name: "cat in a dogs world" },
  { symbol: "NOTUSDT", clean: "NOT", name: "Notcoin" },
  { symbol: "STRKUSDT", clean: "STRK", name: "Starknet" },
  { symbol: "PYTHUSDT", clean: "PYTH", name: "Pyth Network" },
  { symbol: "JTOUSDT", clean: "JTO", name: "Jito" },
  { symbol: "MANTAUSDT", clean: "MANTA", name: "Manta Network" },
  { symbol: "BEAMUSDT", clean: "BEAM", name: "Beam" },
  { symbol: "RONUSDT", clean: "RON", name: "Ronin" },
  { symbol: "PIXELUSDT", clean: "PIXEL", name: "Pixels" },
  { symbol: "XAIUSDT", clean: "XAI", name: "Xai" },
  { symbol: "DYMUSDT", clean: "DYM", name: "Dymension" },
  { symbol: "AEVOUSDT", clean: "AEVO", name: "Aevo" },
  { symbol: "ETHFIUSDT", clean: "ETHFI", name: "Ether.fi" },
  { symbol: "METISUSDT", clean: "METIS", name: "Metis" },
  { symbol: "OMUSDT", clean: "OM", name: "MANTRA" },
  { symbol: "ONDOUSDT", clean: "ONDO", name: "Ondo" },
  { symbol: "COREUSDT", clean: "CORE", name: "Core" },
  { symbol: "SAGAUSDT", clean: "SAGA", name: "Saga" },
  { symbol: "ZKUSDT", clean: "ZK", name: "ZKsync" },
  { symbol: "IOUSDT", clean: "IO", name: "io.net" },
  { symbol: "ATHUSDT", clean: "ATH", name: "Aethir" },
  { symbol: "ZROUSDT", clean: "ZRO", name: "LayerZero" },
  { symbol: "HMSTRUSDT", clean: "HMSTR", name: "Hamster Kombat" },
  { symbol: "CATIUSDT", clean: "CATI", name: "Catizen" },
  { symbol: "EIGENUSDT", clean: "EIGEN", name: "EigenLayer" },
  { symbol: "SCRUSDT", clean: "SCR", name: "Scroll" },
  { symbol: "GRASSUSDT", clean: "GRASS", name: "Grass" },
  { symbol: "DRIFTUSDT", clean: "DRIFT", name: "Drift" },
  { symbol: "MOODENGUSDT", clean: "MOODENG", name: "Moo Deng" },
  { symbol: "GOATUSDT", clean: "GOAT", name: "Goatseus Maximus" },
  { symbol: "PNUTUSDT", clean: "PNUT", name: "Peanut the Squirrel" },
  { symbol: "ACTUSDT", clean: "ACT", name: "Act I The AI Prophecy" },
  { symbol: "HYPEUSDT", clean: "HYPE", name: "Hyperliquid" },
  { symbol: "VIRTUALUSDT", clean: "VIRTUAL", name: "Virtuals Protocol" },
  { symbol: "AI16ZUSDT", clean: "AI16Z", name: "ai16z" },
  { symbol: "TRUMPUSDT", clean: "TRUMP", name: "Official Trump" },
  { symbol: "POPCATUSDT", clean: "POPCAT", name: "Popcat" },
  { symbol: "BRETTUSDT", clean: "BRETT", name: "Brett" },
  { symbol: "1000TURBOUSDT", clean: "TURBO", name: "Turbo" },
  { symbol: "1000000BABYDOGEUSDT", clean: "BABYDOGE", name: "Baby Doge Coin" },
  { symbol: "GNSUSDT", clean: "GNS", name: "Gains Network" },
  { symbol: "JOEUSDT", clean: "JOE", name: "Trader Joe" },
  { symbol: "UMAUSDT", clean: "UMA", name: "UMA" },
  { symbol: "TRBUSDT", clean: "TRB", name: "Tellor" },
  { symbol: "API3USDT", clean: "API3", name: "API3" },
  { symbol: "ENSUSDT", clean: "ENS", name: "Ethereum Name Service" }
];

export function computeTopTraderDetermination(buyRatio: number, sellRatio: number, priceChange?: number) {
  // 1. Ağır Balina Short Baskısı (Örn: HMSTR %69.2 Short, %30.8 Long)
  if (sellRatio >= 54.0) {
    // Özel durum: Fiyat sert yükselirken (%2.5+) balinalar short pozisyonda sıkışıyorsa Short Squeeze
    if (priceChange !== undefined && priceChange >= 2.5) {
      return {
        type: "SHORT_SQUEEZE" as TopTraderDeterminationType,
        label: "⚡ TOP 100 SQUEEZE ALARMI",
        desc: `Fiyat yükselirken Top 100 balina %${sellRatio} Short pozisyonda sıkışıyor. Likidasyon avı ile yukarı sert patlama potansiyeli.`,
        score: 92,
        bias: "BULLISH_SQUEEZE" as const,
        color: "#ff9f0a",
        bg: "rgba(255,159,10,0.15)",
        border: "rgba(255,159,10,0.35)"
      };
    }
    return {
      type: "WHALE_SHORT_BIAS" as TopTraderDeterminationType,
      label: "🔴 TOP 100 BALİNA SHORT BASKISI",
      desc: `Top 100 balina ezici çoğunlukla Short pozisyonunda (%${sellRatio} Short / %${buyRatio} Long). Ayı satış baskısı ve dağıtım hakim.`,
      score: 25,
      bias: "BEARISH_DISTRIBUTION" as const,
      color: "#ff453a",
      bg: "rgba(255,69,58,0.15)",
      border: "rgba(255,69,58,0.35)"
    };
  }

  // 2. Balina Aşırı Long Doygunluğu (%68+ Long)
  if (buyRatio >= 68.0) {
    return {
      type: "OVER_LONG" as TopTraderDeterminationType,
      label: "⚠️ TOP 100 BALİNA AŞIRI LONG",
      desc: `Top 100 balina pozisyonu %${buyRatio} Long ile aşırı şişkinlikte. Düzeltme ve Long likidasyon temizliği riski.`,
      score: 35,
      bias: "OVERBOUGHT_CORRECTION" as const,
      color: "#ff453a",
      bg: "rgba(255,69,58,0.15)",
      border: "rgba(255,69,58,0.35)"
    };
  }

  // 3. Güçlü Balina Long Birikimi (%54 - %68 Long)
  if (buyRatio >= 54.0) {
    return {
      type: "STRONG_WHALE_LONG" as TopTraderDeterminationType,
      label: "🟢 TOP 100 BALİNA GÜÇLÜ LONG",
      desc: `Top 100 balina istikrarlı kurumsal boğa birikimi yapıyor (%${buyRatio} Long).`,
      score: 94,
      bias: "STRONG_BULLISH" as const,
      color: "#30d158",
      bg: "rgba(48,209,88,0.15)",
      border: "rgba(48,209,88,0.35)"
    };
  }

  // 4. Hafif Short Baskısı (%50 - %54 Short)
  if (sellRatio >= 50.0) {
    return {
      type: "WHALE_SHORT_BIAS" as TopTraderDeterminationType,
      label: "🔴 TOP 100 BALİNA HAFİF SHORT",
      desc: `Top 100 balina pozisyonlarında satıcılar önde (%${sellRatio} Short / %${buyRatio} Long).`,
      score: 42,
      bias: "BEARISH_DISTRIBUTION" as const,
      color: "#ff453a",
      bg: "rgba(255,69,58,0.12)",
      border: "rgba(255,69,58,0.25)"
    };
  }

  // 5. Hafif Long (%50 - %54 Long)
  if (buyRatio >= 50.0) {
    return {
      type: "BALANCED" as TopTraderDeterminationType,
      label: "🟢 TOP 100 BALİNA HAFİF LONG",
      desc: `Top 100 balina pozisyonlarında alıcılar hafif önde (%${buyRatio} Long).`,
      score: 72,
      bias: "NEUTRAL" as const,
      color: "#30d158",
      bg: "rgba(48,209,88,0.1)",
      border: "rgba(48,209,88,0.2)"
    };
  }

  return {
    type: "BALANCED" as TopTraderDeterminationType,
    label: "⚖️ TOP 100 BALİNA DENGELİ",
    desc: "Top 100 balina pozisyonları nötr ve dengeli seyrediyor.",
    score: 65,
    bias: "NEUTRAL" as const,
    color: "#8b949e",
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.15)"
  };
}

// In-memory client cache
const batchCache: Record<string, { data: BybitRatioItem[]; time: number }> = {};
const BATCH_CACHE_TTL = 20000; // 20s

export async function fetchBybitBatch(forceRefresh = false, period = "4h"): Promise<BybitRatioItem[]> {
  const now = Date.now();
  const cached = batchCache[period];
  if (!forceRefresh && cached && (now - cached.time < BATCH_CACHE_TTL)) {
    return cached.data;
  }

  // Try backend proxy first
  try {
    const res = await fetch(`/api/bybit/batch-longshort?period=${period}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const items: BybitRatioItem[] = json.data.map((item: any) => {
          const matched = TOP_100_COINS.find(c => c.symbol === item.symbol);
          const buy = Number(item.buyRatio) || 50;
          const sell = Number(item.sellRatio) || 50;
          const det = computeTopTraderDetermination(buy, sell, item.change);
          return {
            symbol: item.symbol,
            cleanSymbol: matched ? matched.clean : item.symbol.replace("USDT", "").replace("1000", ""),
            name: matched ? matched.name : item.symbol,
            buyRatio: buy,
            sellRatio: sell,
            timestamp: item.timestamp,
            period: item.period || period,
            determination: det.type,
            determinationLabel: det.label,
            determinationDesc: det.desc,
            whaleScore: det.score,
            whaleBias: det.bias,
            isShortSqueeze: det.type === "SHORT_SQUEEZE",
            isOverLong: det.type === "OVER_LONG",
            isStrongWhaleLong: det.type === "STRONG_WHALE_LONG",
            isWhaleShort: det.type === "WHALE_SHORT_BIAS"
          };
        });
        batchCache[period] = { data: items, time: now };
        return items;
      }
    }
  } catch (err) {
    console.warn("Backend Bybit proxy fallback:", err);
  }

  // Client-side fallback for top coins if proxy is busy
  try {
    const fallbackSubset = TOP_100_COINS.slice(0, 20);
    const promises = fallbackSubset.map(async (c) => {
      try {
        const directRes = await fetch(`https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${c.symbol}&period=${period}&limit=1`);
        if (directRes.ok) {
          const d = await directRes.json();
          if (d.retCode === 0 && d.result?.list?.length > 0) {
            const raw = d.result.list[0];
            const buy = Math.round(parseFloat(raw.buyRatio) * 1000) / 10;
            const sell = Math.round(parseFloat(raw.sellRatio) * 1000) / 10;
            const det = computeTopTraderDetermination(buy, sell);
            return {
              symbol: c.symbol,
              cleanSymbol: c.clean,
              name: c.name,
              buyRatio: buy,
              sellRatio: sell,
              timestamp: raw.timestamp,
              period,
              determination: det.type,
              determinationLabel: det.label,
              determinationDesc: det.desc,
              whaleScore: det.score,
              whaleBias: det.bias,
              isShortSqueeze: det.type === "SHORT_SQUEEZE",
              isOverLong: det.type === "OVER_LONG",
              isStrongWhaleLong: det.type === "STRONG_WHALE_LONG",
              isWhaleShort: det.type === "WHALE_SHORT_BIAS"
            } as BybitRatioItem;
          }
        }
      } catch (e) {}
      return null;
    });
    const results = await Promise.all(promises);
    const valid = results.filter(Boolean) as BybitRatioItem[];
    if (valid.length > 0) {
      batchCache[period] = { data: valid, time: now };
    }
    return valid;
  } catch (e) {
    return cached?.data || [];
  }
}

export async function fetchSingleBybitRatio(symbol: string, period = "4h"): Promise<BybitRatioItem | null> {
  const cleanSym = symbol.replace("-", "").toUpperCase();
  let bybitSym = cleanSym.includes("USDT") ? cleanSym : `${cleanSym}USDT`;
  if (bybitSym === "PEPEUSDT") bybitSym = "1000PEPEUSDT";
  if (bybitSym === "SHIBUSDT") bybitSym = "SHIB1000USDT";
  if (bybitSym === "BONKUSDT") bybitSym = "1000BONKUSDT";
  if (bybitSym === "FLOKIUSDT") bybitSym = "1000FLOKIUSDT";

  try {
    const res = await fetch(`/api/bybit/longshort?symbol=${bybitSym}&period=${period}`);
    if (res.ok) {
      const d = await res.json();
      if (d.buyRatio !== undefined) {
        const buy = Number(d.buyRatio);
        const sell = Number(d.sellRatio);
        const det = computeTopTraderDetermination(buy, sell);
        const matched = TOP_100_COINS.find(c => c.symbol === bybitSym);
        return {
          symbol: bybitSym,
          cleanSymbol: matched ? matched.clean : bybitSym.replace("USDT", "").replace("1000", ""),
          name: matched ? matched.name : bybitSym,
          buyRatio: buy,
          sellRatio: sell,
          timestamp: d.timestamp,
          period,
          determination: det.type,
          determinationLabel: det.label,
          determinationDesc: det.desc,
          whaleScore: det.score,
          whaleBias: det.bias,
          isShortSqueeze: det.type === "SHORT_SQUEEZE",
          isOverLong: det.type === "OVER_LONG",
          isStrongWhaleLong: det.type === "STRONG_WHALE_LONG",
          isWhaleShort: det.type === "WHALE_SHORT_BIAS"
        };
      }
    }
  } catch (e) {}

  return null;
}

// -------------------------------------------------------------
// 1. BybitWhaleRadarWidget (Embedded in ScannerScreen - 4S Top 100 Traders)
// -------------------------------------------------------------
export function BybitWhaleRadarWidget({ onViewFull }: { onSelect?: (coin: any) => void; onViewFull?: () => void; prices?: Record<string, number> }) {
  const [data, setData] = useState<BybitRatioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastTime, setLastTime] = useState("");

  const loadData = async (force = false) => {
    if (force) setLoading(true);
    const items = await fetchBybitBatch(force, "4h");
    if (items.length > 0) {
      setData(items);
      setLastTime(new Date().toLocaleTimeString("tr-TR"));
    }
    if (force) setLoading(false);
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 50000);
    return () => clearInterval(interval);
  }, []);

  const squeezeCount = data.filter(d => d.isShortSqueeze).length;
  const strongLongCount = data.filter(d => d.isStrongWhaleLong).length;
  const overlongCount = data.filter(d => d.isOverLong).length;
  const avgLong = data.length > 0 ? Math.round(data.reduce((acc, d) => acc + d.buyRatio, 0) / data.length) : 50;
  const avgShort = 100 - avgLong;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(22,27,34,0.98), rgba(13,17,23,0.98))",
        borderRadius: 18,
        padding: "16px 18px",
        marginBottom: 16,
        border: "1px solid rgba(255,159,10,0.35)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        position: "relative"
      }}
    >
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #ff9f0a, #ff375f)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 4px 12px rgba(255,159,10,0.3)"
            }}
          >
            🐋
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: -0.2 }}>
                BYBİT TOP 100 TRADERS BALİNA RADARI
              </span>
              <span
                style={{
                  background: "rgba(0,212,170,0.15)",
                  color: "#00d4aa",
                  fontSize: 8.5,
                  fontWeight: 900,
                  padding: "2px 6px",
                  borderRadius: 6,
                  border: "1px solid rgba(0,212,170,0.3)"
                }}
              >
                4S ANALİZ
              </span>
            </div>
            <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 600, marginTop: 2 }}>
              Bybit V5 En İyi 100 Yatırımcı (Top 100 Traders) L/S Oranı {lastTime && `• ${lastTime}`}
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            loadData(true);
          }}
          disabled={loading}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid #30363d",
            color: "#8b949e",
            borderRadius: 8,
            padding: "5px 8px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 700
          }}
          title="Yenile"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Metrics Row: 3 Core Determinations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {/* Short Squeeze */}
        <div
          style={{
            background: "rgba(255,159,10,0.08)",
            border: "1px solid rgba(255,159,10,0.3)",
            borderRadius: 12,
            padding: "8px 6px",
            textAlign: "center"
          }}
        >
          <div style={{ color: "#ff9f0a", fontSize: 9.5, fontWeight: 800 }}>⚡ SQUEEZE</div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 2 }}>
            {squeezeCount} <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 600 }}>Coin</span>
          </div>
          <div style={{ color: "#ff9f0a", fontSize: 8, fontWeight: 700, marginTop: 1 }}>%52+ Short</div>
        </div>

        {/* Strong Whale Long */}
        <div
          style={{
            background: "rgba(48,209,88,0.08)",
            border: "1px solid rgba(48,209,88,0.3)",
            borderRadius: 12,
            padding: "8px 6px",
            textAlign: "center"
          }}
        >
          <div style={{ color: "#30d158", fontSize: 9.5, fontWeight: 800 }}>🟢 GÜÇLÜ LONG</div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 2 }}>
            {strongLongCount} <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 600 }}>Coin</span>
          </div>
          <div style={{ color: "#30d158", fontSize: 8, fontWeight: 700, marginTop: 1 }}>%56-%68 Long</div>
        </div>

        {/* Overlong */}
        <div
          style={{
            background: "rgba(255,69,58,0.08)",
            border: "1px solid rgba(255,69,58,0.3)",
            borderRadius: 12,
            padding: "8px 6px",
            textAlign: "center"
          }}
        >
          <div style={{ color: "#ff453a", fontSize: 9.5, fontWeight: 800 }}>⚠️ AŞIRI LONG</div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 2 }}>
            {overlongCount} <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 600 }}>Coin</span>
          </div>
          <div style={{ color: "#ff453a", fontSize: 8, fontWeight: 700, marginTop: 1 }}>%68+ Doygun</div>
        </div>
      </div>

      {/* Top 100 Traders Market Ratio Bar */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid #30363d",
          borderRadius: 12,
          padding: "8px 12px",
          marginBottom: 12
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 800, marginBottom: 4 }}>
          <span style={{ color: "#30d158" }}>Top 100 Balina Long: %{avgLong}</span>
          <span style={{ color: "#ff453a" }}>Top 100 Balina Short: %{avgShort}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "#ff453a", overflow: "hidden", display: "flex", width: "100%" }}>
          <div style={{ width: `${avgLong}%`, background: "#30d158", height: "100%", transition: "width 0.4s" }} />
        </div>
      </div>

      {/* Squeeze Alert Banner if any */}
      {squeezeCount > 0 && (
        <div
          style={{
            background: "rgba(255,159,10,0.12)",
            border: "1px solid rgba(255,159,10,0.35)",
            borderRadius: 10,
            padding: "8px 10px",
            marginBottom: 12,
            fontSize: 10.5,
            color: "#ff9f0a",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span style={{ fontSize: 14 }}>⚡</span>
          <span>
            <strong>Top 100 Traders: {squeezeCount} coinde</strong> Short Squeeze ve likidasyon patlaması saptandı!
          </span>
        </div>
      )}

      {/* CTA Button: Incele */}
      <button
        onClick={onViewFull}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 13,
          fontWeight: 900,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 4px 16px rgba(255,159,10,0.3)",
          letterSpacing: 0.3
        }}
      >
        <span>🔍</span>
        <span>Top 100 Traders Balina Sinyallerini İncele ({data.length > 0 ? `${data.length} Coin` : "100 Coin"})</span>
        <span style={{ fontSize: 15 }}>→</span>
      </button>
    </div>
  );
}

// -------------------------------------------------------------
// 2. BybitWhaleScreen (Full Page Dedicated View)
// -------------------------------------------------------------
export function BybitWhaleScreen({ onBack, onSelect, prices = {} }: { onBack: () => void; onSelect: (coin: any) => void; prices?: Record<string, number> }) {
  const [data, setData] = useState<BybitRatioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "squeeze" | "strong_long" | "overlong" | "short_bias">("all");
  const [sortBy, setSortBy] = useState<"squeeze" | "long" | "short" | "default">("squeeze");
  const [period, setPeriod] = useState<"4h" | "1h" | "15min" | "5min" | "1d">("4h");
  const [showInfo, setShowInfo] = useState(false);
  const [customSymbol, setCustomSymbol] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [lastTime, setLastTime] = useState("");

  const loadData = async (targetPeriod = period) => {
    setLoading(true);
    const items = await fetchBybitBatch(true, targetPeriod);
    if (items.length > 0) {
      setData(items);
      setLastTime(new Date().toLocaleTimeString("tr-TR"));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(period);
    const timer = setInterval(() => loadData(period), 20000);
    return () => clearInterval(timer);
  }, [period]);

  const handleCustomSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymbol.trim()) return;
    setCustomLoading(true);
    const result = await fetchSingleBybitRatio(customSymbol.trim(), period);
    if (result) {
      setData(prev => [result, ...prev.filter(p => p.symbol !== result.symbol)]);
      setCustomSymbol("");
    }
    setCustomLoading(false);
  };

  const filtered = useMemo(() => {
    let list = [...data];
    if (filter === "squeeze") list = list.filter(d => d.isShortSqueeze);
    else if (filter === "strong_long") list = list.filter(d => d.isStrongWhaleLong);
    else if (filter === "overlong") list = list.filter(d => d.isOverLong);
    else if (filter === "short_bias") list = list.filter(d => d.determination === "WHALE_SHORT_BIAS");

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(d => d.symbol.toLowerCase().includes(q) || d.cleanSymbol.toLowerCase().includes(q) || (d.name && d.name.toLowerCase().includes(q)));
    }

    if (sortBy === "squeeze") {
      list.sort((a, b) => b.sellRatio - a.sellRatio);
    } else if (sortBy === "long") {
      list.sort((a, b) => b.buyRatio - a.buyRatio);
    } else if (sortBy === "short") {
      list.sort((a, b) => b.sellRatio - a.sellRatio);
    }
    return list;
  }, [data, filter, search, sortBy]);

  const squeezeCount = data.filter(d => d.isShortSqueeze).length;
  const strongLongCount = data.filter(d => d.isStrongWhaleLong).length;
  const overlongCount = data.filter(d => d.isOverLong).length;
  const shortBiasCount = data.filter(d => d.determination === "WHALE_SHORT_BIAS").length;
  const avgLong = data.length > 0 ? (data.reduce((acc, d) => acc + d.buyRatio, 0) / data.length).toFixed(1) : "50.0";

  const periodLabels: Record<string, string> = {
    "4h": "4 Saat (4S) [Ana Mod]",
    "1h": "1 Saat",
    "15min": "15 Dk",
    "5min": "5 Dk",
    "1d": "24 Saat"
  };

  return (
    <div style={{ padding: "0 0 40px", background: "#0d1117", minHeight: "100%" }}>
      {/* Header Bar */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1f2e", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(13,17,23,0.96)", backdropFilter: "blur(10px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onBack}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid #30363d", color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}
          >
            <ArrowLeft size={13} /> Geri
          </button>
          <div>
            <div style={{ color: "#fff", fontSize: 14.5, fontWeight: 900, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🐋 TOP 100 TRADERS BALİNA RADARI</span>
              <span style={{ fontSize: 9, background: "#ff9f0a", color: "#000", padding: "1px 6px", borderRadius: 4, fontWeight: 900 }}>4S</span>
            </div>
            <div style={{ color: "#8b949e", fontSize: 10 }}>{lastTime ? `Son Güncelleme: ${lastTime} • Bybit V5 Top 100` : "Veriler çekiliyor..."}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setShowInfo(!showInfo)}
            style={{ background: showInfo ? "rgba(0,212,170,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(0,212,170,0.3)", color: "#00d4aa", borderRadius: 8, padding: "6px 9px", cursor: "pointer", fontSize: 11, fontWeight: 800 }}
            title="Top 100 Traders Oranları Nasıl Hesaplanır?"
          >
            ❓ Bilgi
          </button>
          <button
            onClick={() => loadData(period)}
            disabled={loading}
            style={{ background: "rgba(255,159,10,0.15)", border: "1px solid rgba(255,159,10,0.4)", color: "#ff9f0a", borderRadius: 8, padding: "6px 10px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800 }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Tazele
          </button>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Information Guide Card */}
        {showInfo && (
          <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 11.5, lineHeight: 1.6, color: "#c9d1d9" }}>
            <div style={{ color: "#00d4aa", fontWeight: 900, fontSize: 12, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span>ℹ️ Bybit Top 100 Traders (Balina) Oranları ve Sinyal Belirleme Kriterleri</span>
            </div>
            <p style={{ margin: "0 0 6px" }}>
              <strong>1. Top 100 Traders (En İyi 100 Yatırımcı):</strong> Vadeli piyasalarda en yüksek pozisyon büyüklüğüne ve kârlılığa sahip 100 balina hesabının net Long/Short pozisyon dağılımıdır.
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <strong>2. 🔴 Balina Short Baskısı (%50+ Short):</strong> Top 100 balinanın çoğunluğu Short pozisyonundadır (örn. HMSTR %69.2 Short). Ayı baskısı hakimdir, LONG / ALIM tavsiyesi verilmez, SHORT stratejisi desteklenir.
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <strong>3. 🟢 Güçlü Balina Long (%54 - %68 Long):</strong> Top 100 yatırımcının sağlıklı boğa trendi desteği sağladığı ideal kurumsal birikim aralığıdır.
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <strong>4. ⚡ Short Squeeze (%54+ Short & Fiyat Artışı):</strong> Fiyat yukarı patlarken (%2.5+) balinalar shortta sıkışırsa likidasyon avı (Short Squeeze) tetiklenir.
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <strong>5. ⚠️ Aşırı Long Şişkinliği (%68+ Long):</strong> Balina hesapları aşırı alım yönünde doygunluğa ulaştığında sert düzeltmeler ve long likidasyon kaskatları riski doğar.
            </p>
            <p style={{ margin: 0 }}>
              <strong>6. 4 Saatlik (4S) Yapı:</strong> Tüm Bybit balina analizleri piyasadaki gürültüyü filtrelemek için 4 saatlik mum yapısına göre hesaplanmaktadır.
            </p>
          </div>
        )}

        {/* Period Selector Bar */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 3, marginBottom: 14, border: "1px solid #30363d" }}>
          {(["4h", "1h", "15min", "5min", "1d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flex: 1,
                padding: "7px 4px",
                borderRadius: 8,
                fontSize: 10.5,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                background: period === p ? "linear-gradient(135deg, #00d4aa, #00b8ff)" : "transparent",
                color: period === p ? "#000" : "#8b949e",
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Metric Cards Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>
          <div style={{ background: "rgba(48,209,88,0.08)", border: "1px solid rgba(48,209,88,0.3)", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ color: "#30d158", fontSize: 8.5, fontWeight: 800 }}>🟢 GÜÇLÜ LONG</div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 900, marginTop: 2 }}>{strongLongCount}</div>
            <div style={{ color: "#8b949e", fontSize: 7.5 }}>Kurumsal Boğa</div>
          </div>
          <div style={{ background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.3)", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ color: "#ff453a", fontSize: 8.5, fontWeight: 800 }}>🔴 SHORT BASKISI</div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 900, marginTop: 2 }}>{shortBiasCount}</div>
            <div style={{ color: "#8b949e", fontSize: 7.5 }}>Ayı Dağıtımı</div>
          </div>
          <div style={{ background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.3)", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ color: "#ff9f0a", fontSize: 8.5, fontWeight: 800 }}>⚡ SQUEEZE</div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 900, marginTop: 2 }}>{squeezeCount}</div>
            <div style={{ color: "#8b949e", fontSize: 7.5 }}>Short Avı</div>
          </div>
          <div style={{ background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.3)", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ color: "#ff453a", fontSize: 8.5, fontWeight: 800 }}>⚠️ AŞIRI LONG</div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 900, marginTop: 2 }}>{overlongCount}</div>
            <div style={{ color: "#8b949e", fontSize: 7.5 }}>Düzeltme Riski</div>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#8b949e" }} />
            <input
              type="text"
              placeholder="100 Coin içinde ara (Örn: HMSTR, SUI, SOL)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", borderRadius: 10, padding: "8px 10px 8px 32px", color: "#fff", fontSize: 12 }}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 10,
              padding: "0 10px",
              color: "#00d4aa",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            <option value="long">🟢 En Yüksek Long %</option>
            <option value="short">🔴 En Yüksek Short %</option>
            <option value="squeeze">⚡ Squeeze Sıralaması</option>
            <option value="default">📊 Varsayılan Sıralama</option>
          </select>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          <button
            onClick={() => setFilter("all")}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10.5, fontWeight: 800, border: "none", cursor: "pointer", background: filter === "all" ? "#ff9f0a" : "#21262d", color: filter === "all" ? "#000" : "#8b949e", whiteSpace: "nowrap" }}
          >
            Tümü ({data.length})
          </button>
          <button
            onClick={() => setFilter("strong_long")}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10.5, fontWeight: 800, border: "none", cursor: "pointer", background: filter === "strong_long" ? "#30d158" : "rgba(48,209,88,0.12)", color: filter === "strong_long" ? "#000" : "#30d158", whiteSpace: "nowrap" }}
          >
            🟢 Güçlü Long ({strongLongCount})
          </button>
          <button
            onClick={() => setFilter("short_bias")}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10.5, fontWeight: 800, border: "none", cursor: "pointer", background: filter === "short_bias" ? "#ff453a" : "rgba(255,69,58,0.12)", color: filter === "short_bias" ? "#fff" : "#ff453a", whiteSpace: "nowrap" }}
          >
            🔴 Short Baskısı ({shortBiasCount})
          </button>
          <button
            onClick={() => setFilter("squeeze")}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10.5, fontWeight: 800, border: "none", cursor: "pointer", background: filter === "squeeze" ? "linear-gradient(135deg, #ff9f0a, #ff453a)" : "rgba(255,159,10,0.12)", color: filter === "squeeze" ? "#fff" : "#ff9f0a", whiteSpace: "nowrap" }}
          >
            ⚡ Squeeze ({squeezeCount})
          </button>
          <button
            onClick={() => setFilter("overlong")}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10.5, fontWeight: 800, border: "none", cursor: "pointer", background: filter === "overlong" ? "#ff453a" : "rgba(255,69,58,0.12)", color: filter === "overlong" ? "#fff" : "#ff453a", whiteSpace: "nowrap" }}
          >
            ⚠️ Aşırı Long ({overlongCount})
          </button>
        </div>

        {/* Coin Cards List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((item) => {
            const livePrice = prices[`${item.cleanSymbol}-USDT`] || prices[item.symbol];
            const liveChange = prices[`${item.cleanSymbol}-USDT_change`] ?? prices[`${item.symbol}_change`] ?? 0;
            const det = computeTopTraderDetermination(item.buyRatio, item.sellRatio, liveChange);
            
            return (
              <div
                key={item.symbol}
                onClick={() => onSelect({ 
                  symbol: `${item.cleanSymbol}-USDT`, 
                  name: item.name || item.cleanSymbol,
                  price: livePrice,
                  change: liveChange,
                  sector: "Crypto",
                  exchange: "Bybit",
                  side: item.isShortSqueeze ? "long" : (item.isOverLong || item.sellRatio >= 50.0) ? "short" : "long"
                })}
                style={{
                  background: det.bg,
                  borderRadius: 14,
                  padding: 14,
                  border: `1px solid ${det.border}`,
                  cursor: "pointer",
                  transition: "transform 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>{item.cleanSymbol}</span>
                      <span style={{ color: "#8b949e", fontSize: 11 }}>/USDT</span>
                      <span
                        style={{
                          background: det.bg,
                          color: det.color,
                          fontSize: 8.5,
                          fontWeight: 900,
                          padding: "2px 8px",
                          borderRadius: 6,
                          border: `1px solid ${det.border}`
                        }}
                      >
                        {det.label}
                      </span>
                    </div>
                    <div style={{ color: "#8b949e", fontSize: 11, marginTop: 3 }}>
                      {item.name || item.cleanSymbol} • <span style={{ color: "#c9d1d9" }}>{det.desc}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>
                      {livePrice ? `$${livePrice < 1 ? livePrice.toFixed(4) : livePrice.toLocaleString()}` : "Bybit Linear"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <a
                        href={`https://www.bybit.com/trade/usdt/${item.cleanSymbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "#8b949e", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 2, textDecoration: "none", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)" }}
                        title="Bybit Resmi Sayfasında Gör"
                      >
                        Bybit <ExternalLink size={9} />
                      </a>
                      <span style={{ color: "#00d4aa", fontSize: 10, fontWeight: 700 }}>
                        Grafik & Analiz →
                      </span>
                    </div>
                  </div>
                </div>

                {/* Split Bar */}
                <div style={{ height: 8, borderRadius: 4, background: "#ff453a", overflow: "hidden", display: "flex", width: "100%", marginBottom: 6 }}>
                  <div style={{ width: `${item.buyRatio}%`, background: "#30d158", height: "100%", transition: "width 0.4s" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 900 }}>
                  <span style={{ color: "#30d158" }}>🟢 Top 100 Balina Long: %{item.buyRatio}</span>
                  <span style={{ color: "#ff453a" }}>🔴 Top 100 Balina Short: %{item.sellRatio}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. BybitCoinBadge (For Individual Stock / Detail Screen)
// -------------------------------------------------------------
export function BybitCoinBadge({ symbol }: { symbol: string }) {
  const [ratio, setRatio] = useState<BybitRatioItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchSingleBybitRatio(symbol, "4h").then(res => {
      if (mounted) {
        setRatio(res);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [symbol]);

  if (loading) {
    return (
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "6px 10px", fontSize: 10, color: "#8b949e", display: "flex", alignItems: "center", gap: 6 }}>
        <RefreshCw size={10} className="animate-spin" /> Top 100 Balina L/S yükleniyor...
      </div>
    );
  }

  if (!ratio) return null;

  const det = computeTopTraderDetermination(ratio.buyRatio, ratio.sellRatio);

  return (
    <div style={{ background: det.bg, border: `1px solid ${det.border}`, borderRadius: 10, padding: "8px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 9.5, color: "#8b949e", fontWeight: 800 }}>📈 BYBİT V5 TOP 100 BALİNA L/S ORANI (4S)</span>
        <span style={{ fontSize: 8.5, background: det.bg, color: det.color, padding: "2px 6px", borderRadius: 4, fontWeight: 900, border: `1px solid ${det.border}` }}>
          {det.label}
        </span>
      </div>

      <div style={{ height: 6, borderRadius: 3, background: "#ff453a", overflow: "hidden", display: "flex", width: "100%", marginBottom: 4 }}>
        <div style={{ width: `${ratio.buyRatio}%`, background: "#30d158", height: "100%" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 900 }}>
        <span style={{ color: "#30d158" }}>🟢 Top 100 Long: %{ratio.buyRatio}</span>
        <span style={{ color: "#ff453a" }}>🔴 Top 100 Short: %{ratio.sellRatio}</span>
      </div>
    </div>
  );
}
