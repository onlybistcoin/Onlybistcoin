import React, { useState, useEffect, useMemo } from "react";
import { RefreshCw, Search, ArrowLeft, ExternalLink, Zap, AlertTriangle, ShieldCheck, Flame } from "lucide-react";

export interface BybitRatioItem {
  symbol: string;
  cleanSymbol: string;
  name?: string;
  price?: number;
  change?: number;
  buyRatio: number;
  sellRatio: number;
  timestamp: string;
  period?: string;
  isShortSqueeze: boolean;
  isOverLong: boolean;
}

const DEFAULT_COINS = [
  { symbol: "BTCUSDT", clean: "BTC", name: "Bitcoin" },
  { symbol: "ETHUSDT", clean: "ETH", name: "Ethereum" },
  { symbol: "SOLUSDT", clean: "SOL", name: "Solana" },
  { symbol: "BNBUSDT", clean: "BNB", name: "BNB" },
  { symbol: "XRPUSDT", clean: "XRP", name: "Ripple" },
  { symbol: "DOGEUSDT", clean: "DOGE", name: "Dogecoin" },
  { symbol: "SUIUSDT", clean: "SUI", name: "Sui Network" },
  { symbol: "1000PEPEUSDT", clean: "PEPE", name: "Pepe" },
  { symbol: "AVAXUSDT", clean: "AVAX", name: "Avalanche" },
  { symbol: "LINKUSDT", clean: "LINK", name: "Chainlink" },
  { symbol: "ADAUSDT", clean: "ADA", name: "Cardano" },
  { symbol: "NEARUSDT", clean: "NEAR", name: "Near Protocol" },
  { symbol: "APTUSDT", clean: "APT", name: "Aptos" },
  { symbol: "RENDERUSDT", clean: "RENDER", name: "Render" },
  { symbol: "DOTUSDT", clean: "DOT", name: "Polkadot" },
  { symbol: "AAVEUSDT", clean: "AAVE", name: "Aave" },
  { symbol: "TAOUSDT", clean: "TAO", name: "Bittensor" },
  { symbol: "INJUSDT", clean: "INJ", name: "Injective" },
  { symbol: "ARBUSDT", clean: "ARB", name: "Arbitrum" },
  { symbol: "OPUSDT", clean: "OP", name: "Optimism" },
  { symbol: "WIFUSDT", clean: "WIF", name: "Dogwifhat" },
  { symbol: "LTCUSDT", clean: "LTC", name: "Litecoin" },
];

// In-memory cache for Bybit batch data per period
const batchCache: Record<string, { data: BybitRatioItem[]; time: number }> = {};
const BATCH_CACHE_TTL = 15000; // 15 seconds cache

export async function fetchBybitBatch(forceRefresh = false, period = "5min"): Promise<BybitRatioItem[]> {
  const now = Date.now();
  const cached = batchCache[period];
  if (!forceRefresh && cached && (now - cached.time < BATCH_CACHE_TTL)) {
    return cached.data;
  }

  // Try backend proxy first
  try {
    const res = await fetch(`/api/bybit/batch-longshort?period=${period}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const items = data.data.map((item: any) => {
          const matched = DEFAULT_COINS.find(c => c.symbol === item.symbol);
          return {
            symbol: item.symbol,
            cleanSymbol: matched ? matched.clean : item.symbol.replace("USDT", "").replace("1000", ""),
            name: matched ? matched.name : item.symbol,
            buyRatio: Number(item.buyRatio) || 50,
            sellRatio: Number(item.sellRatio) || 50,
            timestamp: item.timestamp,
            period: item.period || period,
            isShortSqueeze: item.sellRatio >= 53,
            isOverLong: item.buyRatio >= 68
          };
        });
        batchCache[period] = { data: items, time: now };
        return items;
      }
    }
  } catch (err) {
    console.warn("Backend Bybit proxy failed, trying direct fallback:", err);
  }

  // Direct client fallback if proxy failed
  try {
    const promises = DEFAULT_COINS.slice(0, 10).map(async (c) => {
      try {
        const directRes = await fetch(`https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${c.symbol}&period=${period}&limit=1`);
        if (directRes.ok) {
          const d = await directRes.json();
          if (d.retCode === 0 && d.result?.list?.length > 0) {
            const raw = d.result.list[0];
            const buy = Math.round(parseFloat(raw.buyRatio) * 1000) / 10;
            const sell = Math.round(parseFloat(raw.sellRatio) * 1000) / 10;
            return {
              symbol: c.symbol,
              cleanSymbol: c.clean,
              name: c.name,
              buyRatio: buy,
              sellRatio: sell,
              timestamp: raw.timestamp,
              period,
              isShortSqueeze: sell >= 53,
              isOverLong: buy >= 68
            };
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

export async function fetchSingleBybitRatio(symbol: string, period = "5min"): Promise<BybitRatioItem | null> {
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
      if (d.buyRatio) {
        return {
          symbol: bybitSym,
          cleanSymbol: bybitSym.replace("USDT", "").replace("1000", ""),
          buyRatio: Number(d.buyRatio),
          sellRatio: Number(d.sellRatio),
          timestamp: d.timestamp,
          period,
          isShortSqueeze: d.sellRatio >= 53,
          isOverLong: d.buyRatio >= 68
        };
      }
    }
  } catch (e) {}

  try {
    const direct = await fetch(`https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${bybitSym}&period=${period}&limit=1`);
    if (direct.ok) {
      const d = await direct.json();
      if (d.retCode === 0 && d.result?.list?.length > 0) {
        const raw = d.result.list[0];
        const buy = Math.round(parseFloat(raw.buyRatio) * 1000) / 10;
        const sell = Math.round(parseFloat(raw.sellRatio) * 1000) / 10;
        return {
          symbol: bybitSym,
          cleanSymbol: bybitSym.replace("USDT", "").replace("1000", ""),
          buyRatio: buy,
          sellRatio: sell,
          timestamp: raw.timestamp,
          period,
          isShortSqueeze: sell >= 53,
          isOverLong: buy >= 68
        };
      }
    }
  } catch (e) {}

  return null;
}

// -------------------------------------------------------------
// 1. BybitWhaleRadarWidget (Embedded in ScannerScreen - Lightweight Overview)
// -------------------------------------------------------------
export function BybitWhaleRadarWidget({ onViewFull }: { onSelect?: (coin: any) => void; onViewFull?: () => void; prices?: Record<string, number> }) {
  const [data, setData] = useState<BybitRatioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastTime, setLastTime] = useState("");

  const loadData = async (force = false) => {
    if (force) setLoading(true);
    const items = await fetchBybitBatch(force);
    if (items.length > 0) {
      setData(items);
      setLastTime(new Date().toLocaleTimeString("tr-TR"));
    }
    if (force) setLoading(false);
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 45000);
    return () => clearInterval(interval);
  }, []);

  const squeezeCount = data.filter(d => d.isShortSqueeze).length;
  const overlongCount = data.filter(d => d.isOverLong).length;
  const avgLong = data.length > 0 ? Math.round(data.reduce((acc, d) => acc + d.buyRatio, 0) / data.length) : 50;
  const avgShort = 100 - avgLong;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(22,27,34,0.95), rgba(13,17,23,0.95))",
        borderRadius: 18,
        padding: "16px 18px",
        marginBottom: 16,
        border: "1px solid rgba(255,159,10,0.3)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        position: "relative"
      }}
    >
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "linear-gradient(135deg, #ff9f0a, #ff375f)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 4px 12px rgba(255,159,10,0.3)"
            }}
          >
            🐋
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 900, letterSpacing: -0.2 }}>
                BYBİT V5 BALİNA RADARI
              </span>
              <span
                style={{
                  background: "rgba(48,209,88,0.15)",
                  color: "#30d158",
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "2px 6px",
                  borderRadius: 6,
                  border: "1px solid rgba(48,209,88,0.3)"
                }}
              >
                CANLI
              </span>
            </div>
            <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 600, marginTop: 1 }}>
              Bybit Vadeli 5dk Long / Short Hesap Oranları {lastTime && `• ${lastTime}`}
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

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 8, marginBottom: 12 }}>
        {/* Short Squeeze */}
        <div
          style={{
            background: "rgba(255,159,10,0.08)",
            border: "1px solid rgba(255,159,10,0.25)",
            borderRadius: 12,
            padding: "8px 10px",
            textAlign: "center"
          }}
        >
          <div style={{ color: "#ff9f0a", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span>⚡ SQUEEZE</span>
          </div>
          <div style={{ color: "#fff", fontSize: 17, fontWeight: 900, marginTop: 2 }}>
            {squeezeCount} <span style={{ fontSize: 11, color: "#8b949e", fontWeight: 600 }}>Coin</span>
          </div>
          <div style={{ color: "#ff9f0a", fontSize: 8.5, fontWeight: 700, marginTop: 1 }}>%53+ Short</div>
        </div>

        {/* Overlong */}
        <div
          style={{
            background: "rgba(255,69,58,0.08)",
            border: "1px solid rgba(255,69,58,0.25)",
            borderRadius: 12,
            padding: "8px 10px",
            textAlign: "center"
          }}
        >
          <div style={{ color: "#ff453a", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span>⚠️ AŞIRI LONG</span>
          </div>
          <div style={{ color: "#fff", fontSize: 17, fontWeight: 900, marginTop: 2 }}>
            {overlongCount} <span style={{ fontSize: 11, color: "#8b949e", fontWeight: 600 }}>Coin</span>
          </div>
          <div style={{ color: "#ff453a", fontSize: 8.5, fontWeight: 700, marginTop: 1 }}>%68+ Long</div>
        </div>

        {/* Average Ratio */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, fontWeight: 800, marginBottom: 4 }}>
            <span style={{ color: "#30d158" }}>L: %{avgLong}</span>
            <span style={{ color: "#ff453a" }}>S: %{avgShort}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#ff453a", overflow: "hidden", display: "flex", width: "100%" }}>
            <div style={{ width: `${avgLong}%`, background: "#30d158", height: "100%", transition: "width 0.4s" }} />
          </div>
          <div style={{ color: "#8b949e", fontSize: 8, fontWeight: 600, marginTop: 4, textAlign: "center" }}>
            Piyasa Dengesi
          </div>
        </div>
      </div>

      {/* Squeeze Alert Highlight if any */}
      {squeezeCount > 0 && (
        <div
          style={{
            background: "rgba(255,159,10,0.12)",
            border: "1px solid rgba(255,159,10,0.35)",
            borderRadius: 10,
            padding: "8px 10px",
            marginBottom: 12,
            fontSize: 11,
            color: "#ff9f0a",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span style={{ fontSize: 14 }}>⚡</span>
          <span>
            <strong>{squeezeCount} coinde</strong> Short Squeeze ve likidasyon avı potansiyeli tespit edildi!
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
        <span>Coinleri İncele ({data.length > 0 ? `${data.length} Coin` : "Bybit L/S"})</span>
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
  const [filter, setFilter] = useState<"all" | "squeeze" | "overlong">("all");
  const [period, setPeriod] = useState<"5min" | "15min" | "1h" | "4h" | "1d">("5min");
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
    const timer = setInterval(() => loadData(period), 12000);
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
    let list = data;
    if (filter === "squeeze") list = list.filter(d => d.isShortSqueeze);
    if (filter === "overlong") list = list.filter(d => d.isOverLong);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(d => d.symbol.toLowerCase().includes(q) || d.cleanSymbol.toLowerCase().includes(q) || (d.name && d.name.toLowerCase().includes(q)));
    }
    return list;
  }, [data, filter, search]);

  const squeezeCount = data.filter(d => d.isShortSqueeze).length;
  const overlongCount = data.filter(d => d.isOverLong).length;
  const avgLong = data.length > 0 ? (data.reduce((acc, d) => acc + d.buyRatio, 0) / data.length).toFixed(1) : "50.0";

  const periodLabels: Record<string, string> = {
    "5min": "5 Dk (Anlık)",
    "15min": "15 Dk",
    "1h": "1 Saat",
    "4h": "4 Saat",
    "1d": "24 Saat"
  };

  return (
    <div style={{ padding: "0 0 40px", background: "#0d1117", minHeight: "100%" }}>
      {/* Header Bar */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1f2e", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(13,17,23,0.95)", backdropFilter: "blur(10px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onBack}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid #30363d", color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}
          >
            <ArrowLeft size={13} /> Geri
          </button>
          <div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 900, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🐋 BYBİT BALİNA RADARI</span>
              <span style={{ fontSize: 9, background: "#30d158", color: "#000", padding: "1px 5px", borderRadius: 4, fontWeight: 800 }}>V5 CANLI</span>
            </div>
            <div style={{ color: "#8b949e", fontSize: 10 }}>{lastTime ? `Son Güncelleme: ${lastTime} • ${periodLabels[period]}` : "Veriler çekiliyor..."}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setShowInfo(!showInfo)}
            style={{ background: showInfo ? "rgba(0,212,170,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(0,212,170,0.3)", color: "#00d4aa", borderRadius: 8, padding: "6px 9px", cursor: "pointer", fontSize: 11, fontWeight: 800 }}
            title="Oranlar nasıl çalışır?"
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
              <span>ℹ️ Bybit Long/Short Hesap Oranları Hakkında</span>
            </div>
            <p style={{ margin: "0 0 6px" }}>
              <strong>1. Veri Kaynağı:</strong> Bu sayfadaki oranlar doğrudan Bybit borsasının resmi <strong>V5 Linear Derivatives API</strong>'sinden (<code>/v5/market/account-ratio</code>) anlık olarak çekilmektedir.
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <strong>2. Neden Genelde Long Daha Yüksek?:</strong> Vadeli piyasalarda toplam sözleşme dolar değeri (Open Interest) her zaman 1 Long = 1 Short şeklinde %50-%50 eşittir. Ancak bu oran <strong>Hesap Sayısı Oranıdır (Account Ratio)</strong>. Bireysel traderların büyük kısmı genelde Long açtığı için genel ortalama %60 - %75 Long bandında seyreder.
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <strong>3. ⚡ Short Squeeze Mantığı:</strong> Bir coinde Short oranı %50 - %53 üzerine çıktığında piyasa olağandışı şekilde düşüş yönüne yığılmış demektir. Balinalar ve piyasa yapıcılar bu Short pozisyonları tasfiye etmek (likidasyon avı) için fiyatı sertçe yukarı patlatırlar.
            </p>
            <p style={{ margin: 0 }}>
              <strong>4. Zaman Dilimi:</strong> Aşağıdaki periyot butonlarını kullanarak Bybit'in 5 dakikalık, 15 dakikalık, 1 saatlik, 4 saatlik ve 24 saatlik resmi oranlarını karşılaştırabilirsiniz.
            </p>
          </div>
        )}

        {/* Period Selector Bar */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 3, marginBottom: 14, border: "1px solid #30363d" }}>
          {(["5min", "15min", "1h", "4h", "1d"] as const).map((p) => (
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          <div style={{ background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.3)", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ color: "#ff9f0a", fontSize: 9, fontWeight: 800 }}>SHORT SQUEEZE</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginTop: 2 }}>{squeezeCount}</div>
            <div style={{ color: "#8b949e", fontSize: 8 }}>%53+ Short</div>
          </div>
          <div style={{ background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.3)", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ color: "#ff453a", fontSize: 9, fontWeight: 800 }}>AŞIRI LONG</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginTop: 2 }}>{overlongCount}</div>
            <div style={{ color: "#8b949e", fontSize: 8 }}>%68+ Long</div>
          </div>
          <div style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ color: "#00d4aa", fontSize: 9, fontWeight: 800 }}>PİYASA ORT. L/S</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginTop: 2 }}>%{avgLong}</div>
            <div style={{ color: "#8b949e", fontSize: 8 }}>Ağırlıklı Long</div>
          </div>
        </div>

        {/* Search & Custom Symbol */}
        <form onSubmit={handleCustomSearch} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#8b949e" }} />
            <input
              type="text"
              placeholder="Coin ara veya sembol sorgula (Örn: SUI, PEPE, DOGE)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", borderRadius: 10, padding: "8px 10px 8px 32px", color: "#fff", fontSize: 12 }}
            />
          </div>
        </form>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button
            onClick={() => setFilter("all")}
            style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: filter === "all" ? "#ff9f0a" : "#21262d", color: filter === "all" ? "#000" : "#8b949e" }}
          >
            Tümü ({data.length})
          </button>
          <button
            onClick={() => setFilter("squeeze")}
            style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: filter === "squeeze" ? "linear-gradient(135deg, #ff9f0a, #ff453a)" : "rgba(255,159,10,0.12)", color: filter === "squeeze" ? "#fff" : "#ff9f0a" }}
          >
            ⚡ Squeeze ({squeezeCount})
          </button>
          <button
            onClick={() => setFilter("overlong")}
            style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", background: filter === "overlong" ? "#ff453a" : "rgba(255,69,58,0.12)", color: filter === "overlong" ? "#fff" : "#ff453a" }}
          >
            ⚠️ Aşırı Long ({overlongCount})
          </button>
        </div>

        {/* Coin Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((item) => {
            const livePrice = prices[`${item.cleanSymbol}-USDT`] || prices[item.symbol];
            const itemTime = item.timestamp ? new Date(Number(item.timestamp)).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "";
            return (
              <div
                key={item.symbol}
                onClick={() => onSelect({ symbol: `${item.cleanSymbol}-USDT`, name: item.name || item.cleanSymbol })}
                style={{
                  background: item.isShortSqueeze ? "rgba(255,159,10,0.06)" : item.isOverLong ? "rgba(255,69,58,0.06)" : "#161b22",
                  borderRadius: 14,
                  padding: 14,
                  border: `1px solid ${item.isShortSqueeze ? "rgba(255,159,10,0.4)" : item.isOverLong ? "rgba(255,69,58,0.4)" : "#30363d"}`,
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>{item.cleanSymbol}</span>
                      <span style={{ color: "#8b949e", fontSize: 11 }}>/USDT</span>
                      {item.isShortSqueeze && (
                        <span style={{ background: "rgba(255,159,10,0.25)", color: "#ff9f0a", fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 6, border: "1px solid rgba(255,159,10,0.5)" }}>
                          ⚡ SHORT SQUEEZE ALARMI
                        </span>
                      )}
                      {item.isOverLong && (
                        <span style={{ background: "rgba(255,69,58,0.25)", color: "#ff453a", fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 6, border: "1px solid rgba(255,69,58,0.5)" }}>
                          ⚠️ AŞIRI LONG ŞİŞKİNLİĞİ
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#8b949e", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{item.name || item.cleanSymbol}</span>
                      {itemTime && (
                        <span style={{ color: "#6e7681", fontSize: 10 }}>• Bybit: {itemTime}</span>
                      )}
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
                        Detay →
                      </span>
                    </div>
                  </div>
                </div>

                {/* Split Bar */}
                <div style={{ height: 8, borderRadius: 4, background: "#ff453a", overflow: "hidden", display: "flex", width: "100%", marginBottom: 6 }}>
                  <div style={{ width: `${item.buyRatio}%`, background: "#30d158", height: "100%", transition: "width 0.4s" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 900 }}>
                  <span style={{ color: "#30d158" }}>🟢 Bybit Long: %{item.buyRatio}</span>
                  <span style={{ color: "#ff453a" }}>🔴 Bybit Short: %{item.sellRatio}</span>
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
    fetchSingleBybitRatio(symbol).then(res => {
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
        <RefreshCw size={10} className="animate-spin" /> Bybit L/S yükleniyor...
      </div>
    );
  }

  if (!ratio) return null;

  return (
    <div style={{ background: ratio.isShortSqueeze ? "rgba(255,159,10,0.1)" : ratio.isOverLong ? "rgba(255,69,58,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${ratio.isShortSqueeze ? "rgba(255,159,10,0.3)" : ratio.isOverLong ? "rgba(255,69,58,0.3)" : "#30363d"}`, borderRadius: 10, padding: "8px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 800 }}>📈 BYBİT V5 BALİNA L/S ORANI</span>
        {ratio.isShortSqueeze ? (
          <span style={{ fontSize: 9, background: "rgba(255,159,10,0.25)", color: "#ff9f0a", padding: "1px 6px", borderRadius: 4, fontWeight: 900 }}>
            ⚡ SHORT SQUEEZE
          </span>
        ) : ratio.isOverLong ? (
          <span style={{ fontSize: 9, background: "rgba(255,69,58,0.25)", color: "#ff453a", padding: "1px 6px", borderRadius: 4, fontWeight: 900 }}>
            ⚠️ AŞIRI LONG
          </span>
        ) : (
          <span style={{ fontSize: 9, color: "#30d158", fontWeight: 700 }}>⚖️ DENGELİ</span>
        )}
      </div>

      <div style={{ height: 6, borderRadius: 3, background: "#ff453a", overflow: "hidden", display: "flex", width: "100%", marginBottom: 4 }}>
        <div style={{ width: `${ratio.buyRatio}%`, background: "#30d158", height: "100%" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 900 }}>
        <span style={{ color: "#30d158" }}>🟢 Long: %{ratio.buyRatio}</span>
        <span style={{ color: "#ff453a" }}>🔴 Short: %{ratio.sellRatio}</span>
      </div>
    </div>
  );
}
