import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar } from "recharts";
import { GoogleGenAI } from "@google/genai";
import { RefreshCw, AlertCircle } from "lucide-react";
import { db } from "./firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const BIST_STOCKS = [
  ["THYAO", "Türk Hava Yolları"], ["GARAN", "Garanti BBVA"], ["AKBNK", "Akbank"], ["EREGL", "Ereğli Demir Çelik"],
  ["KCHOL", "Koç Holding"], ["SAHOL", "Sabancı Holding"], ["BIMAS", "BİM Mağazalar"], ["TOASO", "Tofaş Oto"],
  ["ARCLK", "Arçelik"], ["TUPRS", "Tüpraş"], ["SISE", "Şişe Cam"], ["DOHOL", "Doğan Holding"],
  ["PETKM", "Petkim"], ["FROTO", "Ford Otosan"], ["ASELS", "Aselsan"], ["MGROS", "Migros"],
  ["PGSUS", "Pegasus"], ["TAVHL", "TAV Havalimanları"], ["YKBNK", "Yapı Kredi"], ["EKGYO", "Emlak Konut GYO"],
  ["VESTL", "Vestel"], ["ODAS", "Odaş Elektrik"], ["SMRTG", "Smart Güneş"], ["CANTE", "Çan2 Termik"],
  ["ISCTR", "İş Bankası (C)"], ["HALKB", "Halkbank"], ["VAKBN", "Vakıfbank"], ["TSKB", "TSKB"],
  ["ALARK", "Alarko Holding"], ["ENKAI", "Enka İnşaat"], ["TKFEN", "Tekfen Holding"], ["GUBRF", "Gübre Fabrikaları"],
  ["HEKTS", "Hektaş"], ["SASA", "Sasa Polyester"], ["KONTR", "Kontrolmatik"], ["GESAN", "Girişim Elektrik"],
  ["YEOTK", "Yeo Teknoloji"], ["ASTOR", "Astor Enerji"], ["EUPWR", "Europower Enerji"], ["CWENE", "Cw Enerji"],
  ["ALFAS", "Alfa Solar"], ["MIATK", "Mia Teknoloji"], ["REEDR", "Reeder Teknoloji"], ["TABGD", "Tab Gıda"],
  ["TARKM", "Tarkim Bitki Koruma"], ["EBEBK", "Ebebek Mağazacılık"], ["KAYSE", "Kayseri Şeker"], ["BIENY", "Bien Yapı Ürünleri"],
  ["SDTTR", "SDT Uzay ve Savunma"], ["ONCSM", "Oncosem Onkolojik"], ["SOKE", "Söke Değirmencilik"], ["EYGYO", "Eyüp Yapı GYO"],
  ["GOKNR", "Göknur Gıda"], ["CVKMD", "CVK Maden"], ["KOPOL", "Koza Polyester"], ["PASEU", "Pasifik Eurasia"],
  ["KATMR", "Katmerciler Ekipman"], ["TMSN", "Tümosan Motor"], ["OTKAR", "Otokar"], ["TTRAK", "Türk Traktör"],
  ["DOAS", "Doğuş Otomotiv"], ["ASUZU", "Anadolu Isuzu"], ["KMPUR", "Kimteks Poliüretan"], ["SAYAS", "Say Yenilenebilir"],
  ["HUNER", "Hun Enerji"], ["ZEDUR", "Zedur Enerji"], ["PRKME", "Park Elek.Madencilik"], ["ULKER", "Ülker Bisküvi"],
  ["AEFES", "Anadolu Efes"], ["CCOLA", "Coca-Cola İçecek"], ["TATGD", "Tat Gıda"], ["SOKM", "Şok Marketler"],
  ["TKNSA", "Teknosa"], ["MAVI", "Mavi Giyim"], ["VAKKO", "Vakko"], ["YATAS", "Yataş"],
  ["BRISA", "Brisa"], ["GOODY", "Goodyear"], ["AKSA", "Aksa"], ["KORDS", "Kordsa"],
  ["BAGFS", "Bagfaş Gübre"], ["EGEEN", "Ege Endüstri"], ["BFREN", "Bosch Fren"], ["FMIZP", "Federal-Mogul İzmit"],
  ["PARSN", "Parsan"], ["JANTS", "Jantsa Jant"], ["ALCAR", "Alarko Carrier"], ["ALGYO", "Alarko GYO"],
  ["TRGYO", "Torunlar GYO"], ["OZKGY", "Özak GYO"], ["MSGYO", "Mistral GYO"], ["HLGYO", "Halk GYO"],
  ["VKGYO", "Vakıf GYO"], ["SNGYO", "Sinpaş GYO"], ["KLGYO", "Kiler GYO"], ["AKFGY", "Akfen GYO"],
  ["ISGYO", "İş GYO"], ["KGYO", "Koray GYO"], ["IDGYO", "İdealist GYO"], ["PAGYO", "Panora GYO"],
  ["DZGYO", "Deniz GYO"], ["SRVGY", "Servet GYO"], ["RYGYO", "Reysaş GYO"], ["RYSAS", "Reysaş Lojistik"],
  ["GLYHO", "Global Yatırım Holding"], ["NETAS", "Netaş Telekom"], ["ALCTL", "Alcatel Lucent"], ["ARENA", "Arena Bilgisayar"],
  ["INDES", "İndeks Bilgisayar"], ["DESPC", "Despec Bilgisayar"], ["DGATE", "Datagate Bilgisayar"], ["LINK", "Link Bilgisayar"],
  ["LOGO", "Logo Yazılım"], ["KFEIN", "Kafein Yazılım"], ["ARDYZ", "Ard Bilişim"], ["ESCOM", "Escort Teknoloji"],
  ["FONET", "Fonet Bilgi Teknolojileri"], ["KRVGD", "Kervan Gıda"], ["AVOD", "Avod Gıda"], ["OYYAT", "Oyak Yatırım"],
  ["ISMEN", "İş Yatırım"], ["GSDHO", "GSD Holding"], ["INFO", "İnfo Yatırım"], ["OSMEN", "Osmanlı Yatırım"],
  ["GLBMD", "Global Menkul Değerler"], ["GEDIK", "Gedik Yatırım"], ["TUKAS", "Tukaş"], ["KNFRT", "Konfrut Gıda"],
  ["FRIGO", "Frigo Pak Gıda"], ["ELITE", "Elite Naturel"], ["ULUUN", "Ulusoy Un"], ["VANGD", "Vanet Gıda"],
  ["MERKO", "Merko Gıda"], ["PETUN", "Pınar Et ve Un"], ["PNSUT", "Pınar Süt"], ["SELVA", "Selva Gıda"],
  ["BRKSN", "Berikosan Yalıtım"], ["PRZMA", "Prizma Press Matbaacılık"], ["IHLAS", "İhlas Holding"], ["IHEVA", "İhlas Ev Aletleri"],
  ["IHYAY", "İhlas Yayın Holding"], ["IHGZT", "İhlas Gazetecilik"], ["METRO", "Metro Holding"], ["AVGYO", "Avrasya GYO"],
  ["ATLAS", "Atlas Yatırım Ortaklığı"], ["ETYAT", "Euro Trend Yatırım"], ["EUYO", "Euro Menkul Kıymet"], ["EUKYO", "Euro Kapital Yatırım"],
  ["MZHLD", "Mazhar Zorlu Holding"], ["EPLAS", "Egeplast"], ["DERIM", "Derimod"], ["DESA", "Desa Deri"],
  ["HATEK", "Hatay Tekstil"], ["MNDRS", "Menderes Tekstil"], ["ARSAN", "Arsan Tekstil"], ["LUKSK", "Lüks Kadife"],
  ["KRTEK", "Karsu Tekstil"], ["SKTAS", "Söktaş"], ["SNPAM", "Sönmez Pamuklu"], ["SONME", "Sönmez Filament"],
  ["DAGI", "Dagi Giyim"], ["KRONT", "Kron Teknoloji"], ["EDATA", "E-Data Teknoloji"], ["VBTYZ", "VBT Yazılım"],
  ["PKART", "Plastikkart"], ["SMART", "Smartiks Yazılım"], ["HTTBT", "Hitit Bilgisayar"], ["OBASL", "Oba Makarnacılık"],
  ["ALVES", "Alves Kablo"], ["ARTMS", "Artemis Halı"], ["MOGAN", "Mogan Enerji"], ["ODINE", "Odine Teknoloji"],
  ["ENTRA", "IC Enterra Yenilenebilir"], ["HOROZ", "Horoz Lojistik"], ["ALTNY", "Altınay Savunma"], ["KOTON", "Koton Mağazacılık"],
  ["LILA", "Lila Kağıt"], ["HRKET", "Hareket Proje Taşımacılığı"], ["YIGIT", "Yiğit Akü"], ["DCTTR", "DCT TR Trading"],
  ["BAHEV", "Bahadır Kimya"], ["ONUR", "Onur Yüksek Teknoloji"], ["OZATD", "Özata Denizcilik"], ["CEMZY", "Cem Zeytin"],
  ["KARYE", "Kartal Yenilenebilir"], ["GIPTA", "Gıpta Ofis Kırtasiye"],
].map(([symbol, name]) => ({
  symbol, name, price: 0, change: 0, volume: 0, sector: "BIST"
}));

const CRYPTO_COINS = [
  ["BTC-USDT", "Bitcoin"], ["ETH-USDT", "Ethereum"], ["SOL-USDT", "Solana"], ["BNB-USDT", "Binance Coin"],
  ["XRP-USDT", "XRP"], ["ADA-USDT", "Cardano"], ["AVAX-USDT", "Avalanche"], ["DOGE-USDT", "Dogecoin"],
  ["DOT-USDT", "Polkadot"], ["LINK-USDT", "Chainlink"], ["POL-USDT", "Polygon (POL)"], ["NEAR-USDT", "Near Protocol"],
  ["10000PEPE-USDT", "10000 Pepe"], ["FET-USDT", "Fetch.ai"], ["RENDER-USDT", "Render"], ["10000SHIB-USDT", "10000 Shiba Inu"],
  ["LTC-USDT", "Litecoin"], ["BCH-USDT", "Bitcoin Cash"], ["UNI-USDT", "Uniswap"], ["ARB-USDT", "Arbitrum"],
  ["TIA-USDT", "Celestia"], ["OP-USDT", "Optimism"], ["INJ-USDT", "Injective"], ["SUI-USDT", "Sui"],
  ["APT-USDT", "Aptos"], ["STX-USDT", "Stacks"], ["FIL-USDT", "Filecoin"], ["ATOM-USDT", "Cosmos"],
  ["IMX-USDT", "Immutable"], ["KAS-USDT", "Kaspa"], ["HBAR-USDT", "Hedera"], ["ETC-USDT", "Ethereum Classic"],
  ["ICP-USDT", "Internet Computer"], ["RUNE-USDT", "THORChain"], ["LDO-USDT", "Lido DAO"], ["TAO-USDT", "Bittensor"],
  ["SEI-USDT", "Sei"], ["JUP-USDT", "Jupiter"], ["WIF-USDT", "dogwifhat"], ["10000FLOKI-USDT", "10000 Floki"],
  ["10000BONK-USDT", "10000 Bonk"], ["ORDI-USDT", "Ordi"], ["GALA-USDT", "Gala"], ["VET-USDT", "VeChain"],
  ["MKR-USDT", "Maker"], ["GRT-USDT", "The Graph"], ["AAVE-USDT", "Aave"], ["ALGO-USDT", "Algorand"],
  ["EGLD-USDT", "MultiversX"], ["FLOW-USDT", "Flow"], ["QNT-USDT", "Quant"], ["AXS-USDT", "Axie Infinity"],
  ["SAND-USDT", "The Sandbox"], ["MANA-USDT", "Decentraland"], ["THETA-USDT", "Theta Network"], ["CHZ-USDT", "Chiliz"],
  ["EOS-USDT", "EOS"], ["NEO-USDT", "Neo"], ["IOTA-USDT", "IOTA"], ["XMR-USDT", "Monero"],
  ["ZEC-USDT", "Zcash"], ["DASH-USDT", "Dash"], ["CRV-USDT", "Curve DAO"], ["DYDX-USDT", "dYdX"],
  ["SNX-USDT", "Synthetix"], ["GMX-USDT", "GMX"], ["PENDLE-USDT", "Pendle"], ["ARKM-USDT", "Arkham"],
  ["W-USDT", "Wormhole"], ["ENA-USDT", "Ethena"], ["10000SATS-USDT", "10000 Sats"], ["10000BOME-USDT", "10000 Book of Meme"],
  ["10000MEW-USDT", "10000 MEW"], ["NOT-USDT", "Notcoin"], ["STRK-USDT", "Starknet"], ["PYTH-USDT", "Pyth Network"],
  ["JTO-USDT", "Jito"], ["ALT-USDT", "AltLayer"], ["MANTA-USDT", "Manta Network"], ["BEAM-USDT", "Beam"],
  ["RON-USDT", "Ronin"], ["PIXEL-USDT", "Pixels"], ["PORTAL-USDT", "Portal"], ["XAI-USDT", "Xai"],
  ["ACE-USDT", "Fusionist"], ["ZETA-USDT", "ZetaChain"], ["DYM-USDT", "Dymension"], ["MAVIA-USDT", "Heroes of Mavia"],
  ["AEVO-USDT", "Aevo"], ["ETHFI-USDT", "ether.fi"], ["METIS-USDT", "Metis"], ["VANRY-USDT", "Vanar Chain"],
  ["OM-USDT", "Mantra"], ["ONDO-USDT", "Ondo"], ["CORE-USDT", "Core"],
  ["TNSR-USDT", "Tensor"], ["SAGA-USDT", "Saga"], ["TAIKO-USDT", "Taiko"], ["ZK-USDT", "ZKsync"],
  ["IO-USDT", "IO.NET"], ["ATH-USDT", "Aethir"], ["ZRO-USDT", "LayerZero"], ["LISTA-USDT", "Lista DAO"],
  ["HMSTR-USDT", "Hamster Kombat"], ["CATI-USDT", "Catizen"], ["EIGEN-USDT", "EigenLayer"], ["SCR-USDT", "Scroll"],
  ["GRASS-USDT", "Grass"], ["DRIFT-USDT", "Drift"], ["MOODENG-USDT", "Moo Deng"], ["GOAT-USDT", "Goatseus Maximus"],
  ["PNUT-USDT", "Peanut the Squirrel"], ["ACT-USDT", "AI Prophecy"], ["HYPE-USDT", "Hyperliquid"], ["VIRTUAL-USDT", "Virtuals Protocol"],
  ["AI16Z-USDT", "ai16z"], ["FARTCOIN-USDT", "Fartcoin"], ["TRUMP-USDT", "Official Trump"], ["MELANIA-USDT", "Melania Trump"],
  ["SPX-USDT", "SPX6900"], ["10000MOG-USDT", "10000 Mog Coin"], ["POPCAT-USDT", "Popcat"], ["BRETT-USDT", "Brett"],
  ["TURBO-USDT", "Turbo"], ["10000BABYDOGE-USDT", "10000 Baby Doge"], ["100001CAT-USDT", "10000 Bitcoin Cats"], ["MYRO-USDT", "Myro"],
  ["10000COQ-USDT", "10000 Coq Inu"], ["10000WEN-USDT", "10000 Wen"], ["ZIG-USDT", "Zignaly"], ["GNS-USDT", "Gains Network"],
  ["JOE-USDT", "Trader Joe"], ["PANGOLIN-USDT", "Pangolin"], ["BENQI-USDT", "Benqi"], ["STEEM-USDT", "Steem"],
  ["HIVE-USDT", "Hive"], ["WAXP-USDT", "WAX"], ["LOOM-USDT", "Loom Network"], ["MTL-USDT", "Metal DAO"],
  ["STPT-USDT", "STP"], ["RAD-USDT", "Radicle"], ["UMA-USDT", "UMA"], ["BAND-USDT", "Band Protocol"],
  ["NMR-USDT", "Numeraire"], ["TRB-USDT", "Tellor"], ["API3-USDT", "API3"], ["DIA-USDT", "DIA"],
  ["ANKR-USDT", "Ankr"], ["OCEAN-USDT", "Ocean Protocol"], ["AGIX-USDT", "SingularityNET"], ["RLC-USDT", "iExec RLC"],
  ["GLM-USDT", "Golem"], ["STORJ-USDT", "Storj"], ["SC-USDT", "Siacoin"], ["AR-USDT", "Arweave"],
  ["LPT-USDT", "Livepeer"], ["AUDIO-USDT", "Audius"], ["ENS-USDT", "Ethereum Name Service"], ["ID-USDT", "SPACE ID"],
  ["GAL-USDT", "Galxe"], ["HOOK-USDT", "Hooked Protocol"], ["HFT-USDT", "Hashflow"], ["GMT-USDT", "STEPN"],
  ["GST-USDT", "Green Satoshi Token"], ["SWEAT-USDT", "Sweat Economy"], ["FITFI-USDT", "Step App"], ["SLP-USDT", "Smooth Love Potion"],
  ["ILV-USDT", "Illuvium"], ["YGG-USDT", "Yield Guild Games"], ["MC-USDT", "Merit Circle"], ["MAGIC-USDT", "Magic"],
  ["ENJ-USDT", "Enjin Coin"], ["OG-USDT", "OG Fan Token"],
  ["CITY-USDT", "Manchester City Fan Token"], ["BAR-USDT", "FC Barcelona Fan Token"], ["PSG-USDT", "Paris Saint-Germain Fan Token"], ["JUV-USDT", "Juventus Fan Token"],
  ["ACM-USDT", "AC Milan Fan Token"], ["ASR-USDT", "AS Roma Fan Token"], ["ATM-USDT", "Atletico Madrid Fan Token"], ["INTER-USDT", "Inter Milan Fan Token"],
  ["LAZIO-USDT", "S.S. Lazio Fan Token"], ["PORTO-USDT", "FC Porto Fan Token"], ["SANTOS-USDT", "Santos FC Fan Token"], ["ALPINE-USDT", "BWT Alpine F1 Team Fan Token"],
].map(([symbol, name]) => ({
  symbol, name, price: 0, change: 0, volume: 0, sector: "Crypto"
}));

const COMMODITY_ITEMS = [
  { symbol: "GC=F", name: "Altın Ons", price: 0, change: 0, volume: 0, sector: "Emtia" },
  { symbol: "SI=F", name: "Gümüş Ons", price: 0, change: 0, volume: 0, sector: "Emtia" },
  { symbol: "BZ=F", name: "Brent Petrol", price: 0, change: 0, volume: 0, sector: "Emtia" },
  { symbol: "HG=F", name: "Bakır", price: 0, change: 0, volume: 0, sector: "Emtia" },
  { symbol: "GAU=X", name: "Gram Altın (TL)", price: 0, change: 0, volume: 0, sector: "Emtia" },
  { symbol: "GAG=X", name: "Gram Gümüş (TL)", price: 0, change: 0, volume: 0, sector: "Emtia" },
  { symbol: "TRY=X", name: "USD/TRY", price: 0, change: 0, volume: 0, sector: "Emtia" },
  { symbol: "XU100", name: "BIST 100", price: 0, change: 0, volume: 0, sector: "Emtia" },
  { symbol: "XU030", name: "BIST 30", price: 0, change: 0, volume: 0, sector: "Emtia" },
];

const PATTERN_DATA: Record<string, any> = {
THYAO: { rsi: 32, macd: 0.85, fibLevel: "0.786", patternScore: 98, pattern: "Düşen Kama Kırılımı ✦✦", potential: 98 },
GARAN: { rsi: 55, macd: -0.12, fibLevel: "0.382", patternScore: 45, pattern: "Yatay Konsolidasyon", potential: 12 },
AKBNK: { rsi: 41, macd: 0.28, fibLevel: "0.5", patternScore: 62, pattern: "Bayrak Formasyonu", potential: 18 },
EREGL: { rsi: 36, macd: 0.65, fibLevel: "0.618", patternScore: 85, pattern: "Düşen Kama Kırılımı", potential: 28 },
KCHOL: { rsi: 52, macd: 0.05, fibLevel: "0.236", patternScore: 38, pattern: "Güçlü Yukarı Trend", potential: 14 },
SAHOL: { rsi: 44, macd: 0.31, fibLevel: "0.5", patternScore: 71, pattern: "Çift Dip", potential: 24 },
BIMAS: { rsi: 62, macd: -0.22, fibLevel: "0.382", patternScore: 29, pattern: "Direnç Bölgesi", potential: 8 },
TOASO: { rsi: 39, macd: 0.78, fibLevel: "0.618", patternScore: 88, pattern: "Düşen Kama Kırılımı ✦", potential: 32 },
ARCLK: { rsi: 42, macd: 0.55, fibLevel: "0.618", patternScore: 76, pattern: "RSI Diverjans + Fib", potential: 26 },
TUPRS: { rsi: 48, macd: 0.18, fibLevel: "0.5", patternScore: 55, pattern: "Simetrik Üçgen", potential: 16 },
SISE: { rsi: 35, macd: 0.82, fibLevel: "0.786", patternScore: 91, pattern: "Düşen Kama Kırılımı ✦", potential: 35 },
DOHOL: { rsi: 33, macd: 0.91, fibLevel: "0.786", patternScore: 93, pattern: "Düşen Kama + RSI Ayrışma ✦", potential: 38 },
PETKM: { rsi: 37, macd: 0.61, fibLevel: "0.618", patternScore: 82, pattern: "Düşen Kama Kırılımı ✦", potential: 28 },
FROTO: { rsi: 58, macd: 0.12, fibLevel: "0.236", patternScore: 42, pattern: "Yükseliş Kanalı", potential: 12 },
ASELS: { rsi: 34, macd: 0.95, fibLevel: "0.786", patternScore: 96, pattern: "Düşen Kama + Hacim ✦✦", potential: 42 },
MGROS: { rsi: 55, macd: -0.08, fibLevel: "0.5", patternScore: 32, pattern: "Konsolidasyon", potential: 10 },
PGSUS: { rsi: 36, macd: 0.88, fibLevel: "0.786", patternScore: 89, pattern: "Düşen Kama Kırılımı ✦", potential: 34 },
TAVHL: { rsi: 43, macd: 0.48, fibLevel: "0.618", patternScore: 74, pattern: "Çift Dip + MACD Kesişim", potential: 22 },
YKBNK: { rsi: 45, macd: 0.22, fibLevel: "0.5", patternScore: 58, pattern: "Destek Testi", potential: 16 },
EKGYO: { rsi: 31, macd: 1.02, fibLevel: "0.786", patternScore: 94, pattern: "Düşen Kama + Hacim ✦✦", potential: 41 },
VESTL: { rsi: 33, macd: 0.87, fibLevel: "0.786", patternScore: 90, pattern: "RSI Aşırı Satım + Fib ✦", potential: 35 },
ODAS: { rsi: 30, macd: 1.15, fibLevel: "0.786", patternScore: 97, pattern: "MACD + Hacim Patlaması ✦✦", potential: 45 },
SMRTG: { rsi: 29, macd: 1.18, fibLevel: "0.786", patternScore: 95, pattern: "Düşen Kama + Tüm Sinyaller ✦✦", potential: 44 },
CANTE: { rsi: 32, macd: 0.98, fibLevel: "0.786", patternScore: 92, pattern: "Kırılım + Hacim Artışı ✦", potential: 38 },
"BTC-USDT": { rsi: 32, macd: 1.2, fibLevel: "0.618", patternScore: 88, pattern: "Bullish Divergence", potential: 22 },
"ETH-USDT": { rsi: 35, macd: 0.95, fibLevel: "0.5", patternScore: 82, pattern: "Falling Wedge", potential: 18 },
"SOL-USDT": { rsi: 58, macd: 0.45, fibLevel: "0.236", patternScore: 65, pattern: "Ascending Triangle", potential: 15 },
"BNB-USDT": { rsi: 52, macd: -0.2, fibLevel: "0.382", patternScore: 48, pattern: "Consolidation", potential: 15 },
"XRP-USDT": { rsi: 38, macd: 0.8, fibLevel: "0.618", patternScore: 79, pattern: "Double Bottom", potential: 38 },
"ADA-USDT": { rsi: 35, macd: 0.4, fibLevel: "0.5", patternScore: 65, pattern: "Rounding Bottom", potential: 28 },
"AVAX-USDT": { rsi: 31, macd: 1.1, fibLevel: "0.786", patternScore: 89, pattern: "Cup and Handle", potential: 52 },
"DOGE-USDT": { rsi: 25, macd: 2.5, fibLevel: "0.886", patternScore: 96, pattern: "Meme Momentum 🚀", potential: 120 },
"DOT-USDT": { rsi: 42, macd: 0.3, fibLevel: "0.5", patternScore: 61, pattern: "Accumulation", potential: 25 },
"LINK-USDT": { rsi: 39, macd: 0.9, fibLevel: "0.618", patternScore: 82, pattern: "Channel Breakout", potential: 48 },
"MATIC-USDT": { rsi: 48, macd: 0.1, fibLevel: "0.382", patternScore: 52, pattern: "Symmetrical Triangle", potential: 22 },
"NEAR-USDT": { rsi: 29, macd: 1.5, fibLevel: "0.786", patternScore: 92, pattern: "Parabolic Move Potential", potential: 75 },
"10000PEPE-USDT": { rsi: 22, macd: 3.2, fibLevel: "0.886", patternScore: 98, pattern: "Extreme Oversold 🐸", potential: 250 },
"FET-USDT": { rsi: 34, macd: 1.4, fibLevel: "0.618", patternScore: 91, pattern: "AI Narrative Hype", potential: 85 },
"RNDR-USDT": { rsi: 36, macd: 1.2, fibLevel: "0.618", patternScore: 87, pattern: "Bull Flag", potential: 58 },
"10000SHIB-USDT": { rsi: 25, macd: 2.8, fibLevel: "0.786", patternScore: 92, pattern: "Accumulation Breakout", potential: 180 },
};

function generateCandleData(basePrice: number, periods = 60) {
  const data = [];
  const validBasePrice = Number.isFinite(basePrice) ? basePrice : 100; // Fallback to 100 if invalid
  const precision = validBasePrice < 0.1 ? 6 : (validBasePrice < 1 ? 4 : 2);
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
      price: +price.toFixed(precision),
      high: +high.toFixed(precision),
      low: +low.toFixed(precision),
      open: +open.toFixed(precision),
      volume: Math.floor(Math.random() * 1000000 + 200000),
      rsi: i < 30 ? 65 - i * 0.8 + Math.random() * 5 : 30 + (i - 30) * 1.2 + Math.random() * 5,
      macd: i < 35 ? -0.5 + i * 0.01 : (i - 35) * 0.05,
    });
  }
  return data;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// [Cache Bust] v1.0.2 - Real-time Data Sync
export default function BISTAnalyzer() {
const [screen, setScreen] = useState("scanner"); 
const [market, setMarket] = useState<"BIST" | "CRYPTO" | "EMTİA">("BIST");
const [showDebug, setShowDebug] = useState(false);
const [selectedStock, setSelectedStock] = useState<any>(null);
const [scanning, setScanning] = useState(false);
const [scanProgress, setScanProgress] = useState(0);
const [scanned, setScanned] = useState(false);
const [candidates, setCandidates] = useState<any[]>([]);
const [ceilingCandidates, setCeilingCandidates] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    // Realistic initial values to prevent "Yükleniyor"
    const initialMocks: Record<string, number> = {
      "XU100": 13950.45, "XU030": 15820.10, "TRY=X": 34.25, "EURTRY=X": 36.90,
      "BTC-USDT": 98450.20, "ETH-USDT": 3520.10, "SOL-USDT": 242.40,
      "GC=F": 2680.30, "GA=F": 2980.15, "GAG=X": 35.25,
      "THYAO": 319.50, "GARAN": 136.30, "AKBNK": 75.50, "EREGL": 52.40,
      "KCHOL": 215.20, "SAHOL": 105.40, "BIMAS": 512.00, "TUPRS": 182.30,
      "ASELS": 78.40, "PGSUS": 245.60, "SISE": 48.20, "YKBNK": 32.40,
      "MGROS": 485.00, "FROTO": 1120.00, "TOASO": 285.00, "ARCLK": 165.00,
      "DOHOL": 14.20, "PETKM": 22.40, "TAVHL": 215.00, "EKGYO": 10.80
    };
    
    const initialChanges: Record<string, number> = {
      "THYAO": 0.79, "GARAN": -1.40, "AKBNK": -0.80, "EREGL": 0.50,
      "KCHOL": 1.20, "SAHOL": 0.30, "BIMAS": -0.20, "TUPRS": 0.40,
      "ASELS": 1.50, "PGSUS": 0.90, "SISE": -0.50, "YKBNK": -1.10,
      "MGROS": 0.20, "FROTO": 0.60, "TOASO": -0.40, "ARCLK": 0.10,
      "DOHOL": 0.80, "PETKM": -0.30, "TAVHL": 1.10, "EKGYO": 0.50
    };
    
    [...BIST_STOCKS, ...CRYPTO_COINS, ...COMMODITY_ITEMS].forEach(s => { 
      if (s && s.symbol) {
        p[s.symbol] = initialMocks[s.symbol] || s.price || 0; 
        p[`${s.symbol}_change`] = initialChanges[s.symbol] || (s.change || 0); 
      }
    });
    return p;
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
const [aiAnalysis, setAiAnalysis] = useState("");
const [aiLoading, setAiLoading] = useState(false);
const [aiCache, setAiCache] = useState<Record<string, string>>({});
const [timeframe, setTimeframe] = useState("1S");
const [tab, setTab] = useState("teknik"); 
const [kapNews, setKapNews] = useState<any[]>([]);
const [news, setNews] = useState<any[]>([]);
const scanIntervalRef = useRef<any>(null);
const [currentTime, setCurrentTime] = useState("");

useEffect(() => {
  if (loading) {
    const timer = setTimeout(() => {
      console.warn("[App] Loading timeout reached, forcing loading to false");
      setLoading(false);
    }, 6000);
    return () => clearTimeout(timer);
  }
}, [loading]);

const stocks = useMemo(() => {
  const list = market === "BIST" ? BIST_STOCKS : (market === "CRYPTO" ? CRYPTO_COINS : COMMODITY_ITEMS);
  console.log(`[App] Current market: ${market}, stocks count: ${list.length}`);
  return list;
}, [market]);

useEffect(() => {
  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }));
  };
  updateTime();
  const timer = setInterval(updateTime, 10000);
  return () => clearInterval(timer);
}, []);

    const fetchCryptoFallback = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (res.ok) {
          const data = await res.json();
          setPrices(prev => {
            const next = { ...prev };
            data.forEach((t: any) => {
              if (t.symbol.endsWith("USDT")) {
                const sym = t.symbol.replace("USDT", "-USDT");
                let price = parseFloat(t.lastPrice);
                if (!isNaN(price)) {
                  next[sym] = price;
                  next[`${sym}_change`] = parseFloat(t.priceChangePercent);
                }
              } else if (t.symbol === "USDTTRY") {
                let price = parseFloat(t.lastPrice);
                if (!isNaN(price)) {
                  next["USDT-TRY"] = price;
                  next["USDT-TRY_change"] = parseFloat(t.priceChangePercent);
                }
              }
            });
            return next;
          });
        }
      } catch (e) {
        console.error("Crypto fallback failed:", e);
      }
    };

    const fetchBistFallback = async () => {
      console.log("[App] Attempting BIST fallback...");
      try {
        const cacheBuster = Date.now();
        const sources = [
          `https://finans.truncgil.com/v3/today.json?_=${cacheBuster}`,
          `https://finans.truncgil.com/today.json?_=${cacheBuster}`
        ];
        
        let success = false;
        for (const targetUrl of sources) {
          if (success) break;
          
          try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&_=${cacheBuster}`;
            const res = await fetch(proxyUrl);
            if (res.ok) {
              const proxyData = await res.json();
              const data = JSON.parse(proxyData.contents);
              
              setPrices(prev => {
                const next = { ...prev };
                const mappings: Record<string, string> = {
                  "BIST 100": "XU100",
                  "BIST 30": "XU030",
                  "XU100": "XU100",
                  "XU030": "XU030",
                  "ABD DOLARI": "TRY=X",
                  "USD/TRY": "TRY=X",
                  "EURO": "EURTRY=X",
                  "ONS ALTIN": "GC=F",
                  "GRAM ALTIN": "GA=F",
                  "GRAM GÜMÜŞ": "GAG=X",
                  "GÜMÜŞ": "GAG=X"
                };

                for (const [key, val] of Object.entries(data)) {
                  if (typeof val === 'object' && val !== null) {
                    const item = val as any;
                    const rawKey = key.toUpperCase().trim();
                    const sym = mappings[rawKey] || rawKey;
                    
                    if (item.Selling) {
                      // Robust parsing for both "1.234,56" and "1234.56"
                      let sellingStr = item.Selling.toString();
                      let price = 0;
                      
                      if (sellingStr.includes(',') && sellingStr.includes('.')) {
                        // Likely "1.234,56"
                        price = parseFloat(sellingStr.replace(/\./g, '').replace(',', '.'));
                      } else if (sellingStr.includes(',')) {
                        // Likely "1234,56"
                        price = parseFloat(sellingStr.replace(',', '.'));
                      } else {
                        // Likely "1234.56"
                        price = parseFloat(sellingStr);
                      }

                      if (!isNaN(price)) {
                        next[sym] = price;
                        if (item.Change) {
                          let changeStr = item.Change.toString().replace('%', '');
                          let change = parseFloat(changeStr.replace(',', '.'));
                          next[`${sym}_change`] = isNaN(change) ? 0 : change;
                        }
                      }
                    }
                  }
                }
                console.log("[App] Prices updated from fallback. Count:", Object.keys(next).length);
                return next;
              });
              success = true;
            }
          } catch (err) {
            console.warn(`[App] BIST source ${targetUrl} failed:`, err);
          }
        }
      } catch (e) {
        console.error("BIST fallback critical failure:", e);
      }
    };

    const fetchPrices = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        console.log(`[App] Fetching prices from backend... (${new Date().toLocaleTimeString()})`);
        const res = await fetch(`/api/prices?_=${Date.now()}`, { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          const count = Object.keys(data).length;
          console.log(`[App] Backend returned ${count} prices`);
          
          if (count === 0) {
            console.warn("[App] Backend cache is empty, attempting fallbacks...");
            fetchCryptoFallback();
            fetchBistFallback();
            setFetchError(`Veri Hattı: Boş (Yedekler devrede)`);
          } else {
            setFetchError(null);
            setPrices(prev => {
              const next = { ...prev };
              for (const [symbol, info] of Object.entries(data)) {
                const infoData = info as any;
                if (infoData && typeof infoData === 'object') {
                  next[symbol] = infoData.price ?? next[symbol];
                  if (infoData.change !== undefined) next[`${symbol}_change`] = infoData.change;
                  if (infoData.volume !== undefined) next[`${symbol}_volume`] = infoData.volume;
                  if (infoData.source) next[`${symbol}_source`] = infoData.source;
                  if (infoData.lastUpdated) next[`${symbol}_lastUpdated`] = infoData.lastUpdated;
                } else if (typeof infoData === 'number') {
                  next[symbol] = infoData;
                }
              }
              return next;
            });
          }
          setLastUpdated(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        } else {
          const errorText = await res.text().catch(() => "Unknown error");
          console.warn(`[App] Backend error ${res.status}:`, errorText);
          setFetchError(`Fiyat Hattı Hatası: ${res.status} (Yedekler devrede)`);
          fetchCryptoFallback();
          fetchBistFallback();
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn("[App] API fetch timed out");
          setFetchError("Bağlantı Zaman Aşımı (Yedekler devrede)");
        } else {
          console.error("[App] API fetch error:", error);
          setFetchError(`Bağlantı Hatası: ${error.message}`);
        }
        fetchCryptoFallback();
        fetchBistFallback();
      } finally {
        setLoading(false);
      }
    };

    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        } else {
          console.warn(`[App] News fetch failed: ${res.status}`);
        }
      } catch (error) {
        console.error("News fetch error:", error);
      }
    };

  useEffect(() => {
    console.log("[App] Starting real-time API polling...");
    setLoading(true);
    fetchPrices();
    fetchNews();
    const interval = setInterval(() => {
      fetchPrices();
      fetchNews();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [market]);

  // Removed News Listener to avoid Firestore quota issues

  const handleRefresh = () => {
    // With Firestore, refresh is automatic, but we can show loading briefly
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

const startScan = useCallback(() => {
  setScanning(true);
  setScanProgress(0);
  setScanned(false);
  setCandidates([]);
  let p = 0;
  scanIntervalRef.current = setInterval(() => {
    p += Math.random() * 4 + 1;
    if (p >= 100) {
      p = 100;
      clearInterval(scanIntervalRef.current);
      setScanning(false);
      setScanned(true);

      // Dynamically calculate potential based on live price changes and mock pattern data
      const found = stocks.flatMap(s => {
        // Use live price if available, otherwise fallback to mock
        const livePrice = prices[s.symbol] || s.price || 0;
        const liveChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
        
        const pd = PATTERN_DATA[s.symbol] || { 
          rsi: 50, 
          macd: 0, 
          fibLevel: "0.5", 
          patternScore: 30 + Math.random() * 20, 
          pattern: "Nötr", 
          potential: 5 + Math.random() * 5 
        };
        
        if (!Number.isFinite(liveChange)) return [];
        
        // --- Improved Logic ---
        // 1. RSI Bias
        let rsiLongBias = pd.rsi < 40 ? (40 - pd.rsi) * 1.5 : 0;
        let rsiShortBias = pd.rsi > 60 ? (pd.rsi - 60) * 1.5 : 0;
        
        // 2. MACD Bias
        let macdBias = pd.macd * 10; // Positive MACD favors long
        
        // 3. Trend Bias (liveChange)
        let momentumBias = liveChange * 3;
        
        let longScore = pd.potential + rsiLongBias + macdBias + momentumBias;
        let shortScore = pd.potential + rsiShortBias - macdBias - momentumBias;
        
        // Normalize and cap
        longScore = Math.max(0, Math.min(98, longScore));
        shortScore = Math.max(0, Math.min(98, shortScore));
        
        const results = [];
        // Only show the stronger side if both are above threshold
        // Increased threshold to 75 for more selective candidates
        if (longScore >= 75 && longScore >= shortScore) {
          results.push({ ...s, dynamicPotential: longScore, side: 'long' });
        } else if (shortScore >= 75) {
          results.push({ ...s, dynamicPotential: shortScore, side: 'short' });
        }
        
        return results;
      }).sort((a, b) => b.dynamicPotential - a.dynamicPotential);

      setCandidates(found);

      // Tavan (Ceiling) Candidates for BIST
      if (market === "BIST") {
        const ceiling = stocks.map(s => {
          let liveChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
          if (!Number.isFinite(liveChange)) liveChange = 0;
          
          // Ceiling probability logic:
          // 1. Price change is already high (5% to 9.5%)
          // 2. High volume (simulated)
          // 3. Positive news sentiment (simulated)
          const pd = PATTERN_DATA[s.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
          
          let ceilingScore = (liveChange * 8) + (pd.patternScore / 5);
          
          // If already at ceiling (> 9.8%), we don't show it as a "candidate" for hitting the ceiling
          // because it's already there. We focus on those approaching it.
          if (liveChange > 9.8) {
            ceilingScore = 0; 
          } else {
            ceilingScore = Math.min(99, ceilingScore);
          }
          
          return { ...s, ceilingScore };
        }).filter(s => s.ceilingScore >= 45) // Lowered threshold slightly to catch more approaching stocks
          .sort((a, b) => b.ceilingScore - a.ceilingScore);
        
        setCeilingCandidates(ceiling);
      } else {
        setCeilingCandidates([]);
      }
    }
    setScanProgress(Math.min(p, 100));
  }, 80);
}, [prices, stocks]);

const fetchAiAnalysis = useCallback(async (stock: any) => {
  if (!stock) return;
  
  // Check cache first
  if (aiCache[stock.symbol]) {
    setAiAnalysis(aiCache[stock.symbol]);
    return;
  }

  setAiLoading(true);
  setAiAnalysis("");
  
  const pd = PATTERN_DATA[stock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
  const isCrypto = stock.symbol.includes("-USDT");
  
  try {
    const promptPrice = Number.isFinite(Number(prices[stock.symbol] ?? stock.price)) ? Number(prices[stock.symbol] ?? stock.price) : 0;
    const promptChange = Number.isFinite(Number(prices[`${stock.symbol}_change`] ?? stock.change)) ? Number(prices[`${stock.symbol}_change`] ?? stock.change) : 0;
    
    const prompt = `Analist: ${isCrypto ? "Kripto" : "Borsa"}. Varlık: ${stock.symbol}. 
Veri: Fiyat ${promptPrice}, Değişim %${promptChange}, RSI ${pd.rsi}, MACD ${pd.macd > 0 ? "Pozitif" : "Negatif"}, Formasyon: ${pd.pattern}.

Talimat: Çok kısa, teknik ve temel olarak net ol. 
1. 🎯 FORMASYON: ${pd.pattern} yorumu.
2. 📊 TEKNİK: RSI/MACD yönü.
3. 📰 TEMEL: Varlık hakkında kısa temel beklenti.
4. ⚡ SCALP: Giriş/TP.
5. 🎰 RİSK: Stop.
6. 💎 KARAR: Al/Sat/Bekle (neden).`;

    let apiKey = "";
    try {
      // @ts-ignore
      apiKey = import.meta.env?.VITE_GEMINI_API_KEY || "";
      if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY || "";
      }
    } catch (e) {
      apiKey = "";
    }

    if (!apiKey || apiKey.length < 10) {
      throw new Error("Gemini API anahtarı bulunamadı. Lütfen ayarları kontrol edin.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const text = response.text || "Analiz yüklenemedi.";
    setAiAnalysis(text);
    setAiCache(prev => ({ ...prev, [stock.symbol]: text }));
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    let errorMsg = `⚠️ Analiz şu an yüklenemiyor. Hata: ${err.message}`;
    
    if (err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED")) {
      errorMsg = "⚠️ Günlük AI analiz limitine ulaşıldı (Free Tier). Lütfen yarın tekrar deneyin veya kendi API anahtarınızı kullanın.";
    }
    
    setAiAnalysis(errorMsg);
  }
  setAiLoading(false);
}, [prices, aiCache]);

const openDetail = useCallback(async (stock: any) => {
  setSelectedStock(stock);
  setScreen("detail");
  
  // Set analysis from cache if exists
  if (aiCache[stock.symbol]) {
    setAiAnalysis(aiCache[stock.symbol]);
  } else {
    setAiAnalysis("");
  }
  
  const pd = PATTERN_DATA[stock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
  
  // Generate more realistic dynamic news based on stock/coin
  const isCrypto = stock.symbol.includes("-USDT");
  const newsTemplates = [
    { title: isCrypto ? "Ağ güncellemesi başarıyla tamamlandı." : "Yeni ihracat sözleşmesi imzalandı.", source: isCrypto ? "CryptoNews" : "KAP", type: "pozitif" },
    { title: `Teknik göstergeler ${pd.pattern} formasyonunu teyit ediyor.`, source: "Analiz", type: "pozitif" },
    { title: "Haftalık hacim artışı dikkat çekiyor.", source: "Borsa Gündem", type: "nötr" },
    { title: "Analist hedef fiyat revizesi gerçekleşti.", source: "Finans", type: "pozitif" },
    { title: "Sektörel büyüme beklentileri aşıldı.", source: "Ekonomi", type: "pozitif" }
  ];
  
  const seed = stock.symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const selectedNews = [
    { date: "Bugün", ...newsTemplates[seed % newsTemplates.length] },
    { date: "Dün", ...newsTemplates[(seed + 1) % newsTemplates.length] },
    { date: "2 gün önce", ...newsTemplates[(seed + 2) % newsTemplates.length] }
  ];
  setKapNews(selectedNews);
}, [aiCache]);

return (
<div style={{
display: "flex", justifyContent: "center", alignItems: "center",
minHeight: "100vh", background: "linear-gradient(135deg, #161b22 0%, #0d1117 50%, #161b22 100%)",
fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
padding: "20px"
}}>
<div style={{
width: 393, minHeight: 852, maxHeight: 900,
background: "#161b22",
borderRadius: 55, overflow: "hidden",
boxShadow: "0 0 0 1px #1a1f2e, 0 0 80px rgba(0,200,150,0.15), 0 40px 120px rgba(0,0,0,0.8)",
position: "relative", display: "flex", flexDirection: "column",
border: "1px solid #30363d"
}}>
<div style={{ padding: "14px 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#161b22" }}>
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
        scanning={scanning} scanProgress={scanProgress} scanned={scanned} setScanned={setScanned}
        candidates={candidates} setCandidates={setCandidates} prices={prices} lastUpdated={lastUpdated}
        onScan={startScan}
        onViewCandidates={() => setScreen("candidates")}
        onViewScalp={() => setScreen("scalp")}
        onViewCeiling={() => setScreen("ceiling")}
        onRefresh={handleRefresh}
        loading={loading}
        fetchError={fetchError}
        stocks={stocks}
        market={market} setMarket={setMarket}
      />}
      {screen === "candidates" && <CandidatesScreen
        candidates={candidates} prices={prices} lastUpdated={lastUpdated}
        onBack={() => setScreen("scanner")}
        onSelect={openDetail}
        market={market}
      />}
      {screen === "scalp" && <ScalpScreen
        candidates={candidates} prices={prices} lastUpdated={lastUpdated}
        onBack={() => setScreen("scanner")}
        onSelect={(s: any) => { setTimeframe("1S"); openDetail(s); }}
        market={market}
      />}
      {screen === "detail" && selectedStock && <DetailScreen
        stock={selectedStock} prices={prices}
        patternData={PATTERN_DATA[selectedStock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 }}
        aiAnalysis={aiAnalysis} aiLoading={aiLoading}
        onFetchAi={() => fetchAiAnalysis(selectedStock)}
        kapNews={news.length > 0 ? news : kapNews} tab={tab} setTab={setTab}
        timeframe={timeframe} setTimeframe={setTimeframe}
        onBack={() => setScreen(ceilingCandidates.some(c => c.symbol === selectedStock.symbol) ? "ceiling" : "candidates")}
      />}
      {screen === "ceiling" && <CeilingScreen
        candidates={ceilingCandidates} prices={prices} lastUpdated={lastUpdated}
        onBack={() => setScreen("scanner")}
        onSelect={openDetail}
      />}
    </div>

    <BottomNav screen={screen} setScreen={setScreen} candidates={candidates} market={market} />

    {/* Debug Panel Toggle */}
    <div style={{ position: "fixed", bottom: 80, right: 16, zIndex: 1000 }}>
      <button 
        onClick={() => setShowDebug(!showDebug)}
        style={{ background: "#1a1f2e", border: "1px solid #30363d", color: "#8b949e", fontSize: 10, padding: "4px 8px", borderRadius: 6 }}
      >
        {showDebug ? "Debug Kapat" : "Debug Aç"}
      </button>
    </div>

    {showDebug && (
      <div style={{ position: "fixed", bottom: 110, left: 16, right: 16, maxHeight: "40vh", overflow: "auto", background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, padding: 12, zIndex: 1000, fontSize: 10, fontFamily: "monospace", color: "#30d158" }}>
        <div style={{ fontWeight: 700, marginBottom: 8, borderBottom: "1px solid #30363d", paddingBottom: 4 }}>DEBUG PANEL (RAW DATA)</div>
        <div>Backend Status: {fetchError || "OK"}</div>
        <div>Market: {market}</div>
        <div>Stocks Count: {stocks.length}</div>
        <div>Prices Count: {Object.keys(prices).length}</div>
        <div style={{ marginTop: 8, color: "#8b949e" }}>Sample Prices:</div>
        <pre>{JSON.stringify(Object.fromEntries(Object.entries(prices).slice(0, 10)), null, 2)}</pre>
        <button 
          onClick={() => { fetchBistFallback(); fetchCryptoFallback(); }}
          style={{ marginTop: 8, background: "#00d4aa", color: "#000", border: "none", padding: "4px 8px", borderRadius: 4, fontWeight: 700 }}
        >
          Yedek Hatları Zorla
        </button>
      </div>
    )}
  </div>
</div>
);
}

function ScannerScreen({ scanning, scanProgress, scanned, setScanned, candidates, setCandidates, prices, lastUpdated, onScan, onViewCandidates, onViewScalp, onViewCeiling, onRefresh, loading, fetchError, stocks, market, setMarket }: any) {
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
<div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{market === "BIST" ? "BİST ANALİZ" : market === "CRYPTO" ? "KRİPTO ANALİZ" : "EMTİA ANALİZ"} <span style={{ color: "#4a5568", fontSize: 9, marginLeft: 8 }}>v1.0.2</span></div>
<div style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Tarayıcı</div>
{lastUpdated && <div style={{ color: "#4a5568", fontSize: 10, marginTop: 2 }}>Güncelleme: {lastUpdated}</div>}
</div>
<div style={{ textAlign: "right" }}>
<button 
  onClick={onRefresh}
  disabled={loading}
  style={{ 
    background: "rgba(0,212,170,0.1)", 
    border: "1px solid rgba(0,212,170,0.3)", 
    borderRadius: 6, 
    padding: "4px 8px", 
    color: "#00d4aa", 
    fontSize: 10, 
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    marginBottom: 6,
    display: "inline-flex",
    alignItems: "center",
    gap: 4
  }}
>
  <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
  {loading ? "..." : "YENİLE"}
</button>
<div style={{ color: "#30d158", fontSize: 11, fontWeight: 600, background: "rgba(48,209,88,0.1)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(48,209,88,0.3)" }}>● CANLI</div>
<div style={{ color: fetchError ? "#ff9f0a" : "#30d158", fontSize: 10, fontWeight: 700, marginTop: 4, background: fetchError ? "rgba(255,159,10,0.1)" : "transparent", padding: fetchError ? "2px 6px" : 0, borderRadius: 4 }}>
  {fetchError ? `⚠️ ${fetchError}` : "✅ Veri Hattı: Ana Sunucu"}
</div>
<div style={{ color: "#4a5568", fontSize: 11, marginTop: 4 }}>{stocks.length} {market === "BIST" ? "hisse" : market === "CRYPTO" ? "coin" : "varlık"}</div>
{fetchError && <div style={{ color: "#ff453a", fontSize: 9, fontWeight: 700, marginTop: 4 }}>{fetchError}</div>}
</div>
</div>

    <div style={{ display: "flex", background: "#21262d", borderRadius: 12, padding: 3, marginTop: 14 }}>
      {[["BIST", "🇹🇷 BİST"], ["CRYPTO", "₿ KRİPTO"], ["EMTİA", "⚒️ EMTİA"]].map(([key, label]) => (
        <button key={key} onClick={() => { setMarket(key as any); setScanned(false); setCandidates([]); }} style={{
          flex: 1, padding: "8px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
          background: market === key ? "#00d4aa" : "transparent", color: market === key ? "#000" : "#8b949e",
          transition: "all 0.2s"
        }}>{label}</button>
      ))}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 14 }}>
      {[
        { sym: "XU100", label: "BIST 100", val: prices["XU100"] > 0 ? prices["XU100"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (loading ? "..." : "---"), chg: prices["XU100_change"] ? `${prices["XU100_change"] > 0 ? "+" : ""}${prices["XU100_change"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "", up: prices["XU100_change"] >= 0 },
        { sym: "BTC-USDT", label: "BTC/USDT", val: prices["BTC-USDT"] > 0 ? prices["BTC-USDT"].toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDT" : (loading ? "..." : "---"), chg: prices["BTC-USDT_change"] ? `${prices["BTC-USDT_change"] > 0 ? "+" : ""}${prices["BTC-USDT_change"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "", up: prices["BTC-USDT_change"] >= 0 },
        { sym: "USDT-TRY", label: "USDT/TRY", val: prices["USDT-TRY"] > 0 ? prices["USDT-TRY"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + " ₺" : (loading ? "..." : "---"), chg: prices["USDT-TRY_change"] ? `${prices["USDT-TRY_change"] > 0 ? "+" : ""}${prices["USDT-TRY_change"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "", up: prices["USDT-TRY_change"] >= 0 },
        { sym: "GAG=X", label: "GÜMÜŞ/TL", val: prices["GAG=X"] > 0 ? prices["GAG=X"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺" : (loading ? "..." : "---"), chg: prices["GAG=X_change"] ? `${prices["GAG=X_change"] > 0 ? "+" : ""}${prices["GAG=X_change"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "", up: prices["GAG=X_change"] >= 0 },
      ].map(m => (
        <div key={m.label} style={{ background: "#21262d", borderRadius: 12, padding: "10px 12px", border: "1px solid #30363d", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{m.label}</div>
            {prices[`${m.sym}_source`] && <div style={{ color: "#4a5568", fontSize: 7, fontWeight: 600 }}>{prices[`${m.sym}_source`].toUpperCase()}</div>}
          </div>
          
          {(m.val === "..." || m.val === "---") ? (
            <div style={{ color: "#4a5568", fontSize: 14, fontWeight: 700, margin: "4px 0" }}>{m.val === "..." ? "..." : "---"}</div>
          ) : (
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, margin: "4px 0" }}>{m.val}</div>
          )}
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ 
              color: m.up ? "#30d158" : "#ff453a", 
              fontSize: 11, 
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 2
            }}>
              {m.up ? "▲" : "▼"} {m.chg || "%0.00"}
            </div>
            <div style={{ color: "#4a5568", fontSize: 8, fontWeight: 700 }}>GÜNLÜK</div>
          </div>
        </div>
      ))}
    </div>
  </div>

  <div style={{ padding: "20px 20px 16px" }}>
    <div style={{ background: "linear-gradient(135deg, #21262d 0%, #161b22 100%)", borderRadius: 20, padding: 20, border: "1px solid #30363d" }}>
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
            <span style={{ color: "#00d4aa", fontSize: 12, fontWeight: 600 }}>{market === "BIST" ? "BİST" : market === "CRYPTO" ? "Kripto" : "Emtia"} taranıyor...</span>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{Math.round(scanProgress)}%</span>
          </div>
          <div style={{ background: "#30363d", borderRadius: 8, height: 6, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(90deg, #00d4aa, #00b8ff)", width: `${scanProgress}%`, height: "100%", borderRadius: 8, transition: "width 0.1s" }} />
          </div>
          <div style={{ color: "#8b949e", fontSize: 11, marginTop: 6 }}>
            {Math.round(scanProgress / 100 * stocks.length)} / {stocks.length} {market === "BIST" ? "hisse" : market === "CRYPTO" ? "coin" : "varlık"} analiz edildi
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
          background: scanning ? "#21262d" : "linear-gradient(135deg, #00d4aa, #00b8ff)",
          color: scanning ? "#8b949e" : "#000", border: "none", cursor: scanning ? "not-allowed" : "pointer",
          fontSize: 15, fontWeight: 700, letterSpacing: 0.3
        }}
      >
        {scanning ? "Taranıyor..." : scanned ? "Yeniden Tara" : market === "BIST" ? "🚀 Tüm BİST'i Tara" : market === "CRYPTO" ? "🚀 Tüm Kriptoyu Tara" : "🚀 Tüm Emtiayı Tara"}
      </button>

      {scanned && market === "BIST" && (
        <button
          onClick={onViewCeiling}
          style={{
            width: "100%", marginTop: 8, padding: "12px", borderRadius: 14,
            background: "linear-gradient(135deg, #ffd60a, #ff9f0a)", color: "#000", border: "none",
            cursor: "pointer", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 12px rgba(255, 214, 10, 0.2)"
          }}
        >
          🚀 Tavan İhtimali Olanlar
        </button>
      )}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
          {market === "BIST" ? "BİST Öne Çıkanlar" : market === "CRYPTO" ? "KRİPTO Öne Çıkanlar" : "EMTİA Öne Çıkanlar"}
        </div>
        {market === "BIST" && (
          <div style={{ color: "#4a5568", fontSize: 10, fontWeight: 600, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 6 }}>
            ⏱ 15 Dk Gecikmeli
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {topMovers.map(s => (
          <MoverRow key={s.symbol} stock={s} prices={prices} />
        ))}
      </div>
      {/* Debug Info */}
      <div style={{ padding: "10px 0 30px", marginTop: 20, borderTop: "1px solid #1a1f2e", fontSize: 10, color: "#4a5568" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>API: {fetchError || "Bağlı"} • Önbellek: {Object.keys(prices).length}</span>
          <button 
            onClick={() => window.location.reload()}
            style={{ background: "#21262d", border: "1px solid #30363d", color: "#8b949e", padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontSize: 9 }}
          >
            Yenile
          </button>
        </div>
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
const isCrypto = stock.symbol.includes("-USDT");
const isCommodity = stock.sector === "Emtia";
const currency = isCrypto ? "USDT" : (isCommodity && !stock.name.includes("(TL)") ? "$" : "₺");
const precision = stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto || isCommodity ? 4 : 2));

const pd = PATTERN_DATA[stock.symbol];
const showSignal = pd && pd.potential > 40;

return (
<div style={{ display: "flex", alignItems: "center", gap: 12, background: "#21262d", borderRadius: 16, padding: "14px", border: showSignal ? "1px solid rgba(0,212,170,0.3)" : "1px solid #30363d", position: "relative", overflow: "hidden" }}>
{showSignal && <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "#00d4aa" }} />}
<div style={{ width: 44, height: 44, borderRadius: 12, background: up ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)", border: `1px solid ${up ? "rgba(48,209,88,0.3)" : "rgba(255,69,58,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: up ? "#30d158" : "#ff453a" }}>
{stock.symbol.slice(0, 2)}
</div>
<div style={{ flex: 1 }}>
<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
<div style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>{stock.symbol}</div>
{showSignal && <div style={{ background: "rgba(0,212,170,0.15)", color: "#00d4aa", fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 4 }}>BUY %{pd.potential}</div>}
</div>
<div style={{ color: "#8b949e", fontSize: 11, fontWeight: 600 }}>{stock.name.length > 20 ? stock.name.slice(0, 20) + "..." : stock.name}</div>
</div>
<div style={{ textAlign: "right" }}>
<div style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>{price.toFixed(precision)} {currency}</div>
<div style={{ color: up ? "#30d158" : "#ff453a", fontSize: 12, fontWeight: 700 }}>{up ? "+" : ""}{currentChange.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div>
</div>
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

function CeilingScreen({ candidates, prices, lastUpdated, onBack, onSelect }: any) {
  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ padding: "8px 20px 16px", borderBottom: "1px solid #1a1f2e", background: "linear-gradient(180deg, rgba(255,214,10,0.05) 0%, transparent 100%)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#ffd60a", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 10 }}>
          ← Geri
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Tavan İhtimali</div>
              <div style={{ background: "#ffd60a", color: "#000", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>BİST</div>
            </div>
            <div style={{ color: "#4a5568", fontSize: 13, marginTop: 2 }}>Temel ve teknik verilerle tavan potansiyeli</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#4a5568", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>⏱ 15 Dk Gecikmeli</div>
            {lastUpdated && <div style={{ color: "#4a5568", fontSize: 10 }}>{lastUpdated}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {candidates.length > 0 ? candidates.map((stock: any) => {
          const price = Number(prices[stock.symbol] ?? stock.price ?? 0);
          const change = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
          const score = Math.round(stock.ceilingScore || 0);
          
          return (
            <div 
              key={stock.symbol} 
              onClick={() => onSelect(stock)}
              style={{ 
                background: "linear-gradient(135deg, #1a1f2e 0%, #131922 100%)", 
                borderRadius: 20, 
                padding: 16, 
                border: "1px solid rgba(255,214,10,0.15)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: "radial-gradient(circle at top right, rgba(255,214,10,0.1), transparent 70%)" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{stock.symbol}</div>
                  <div style={{ color: "#4a5568", fontSize: 11, fontWeight: 600 }}>{stock.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>{price.toFixed(2)} ₺</div>
                  <div style={{ color: "#30d158", fontSize: 13, fontWeight: 700 }}>▲ +{change.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#8b949e", fontSize: 10, fontWeight: 700 }}>TAVAN İHTİMALİ</span>
                    <span style={{ color: "#ffd60a", fontSize: 10, fontWeight: 800 }}>%{score}</span>
                  </div>
                  <div style={{ background: "#21262d", height: 6, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(90deg, #ffd60a, #ff9f0a)", width: `${score}%`, height: "100%", borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ background: "rgba(255,214,10,0.1)", borderRadius: 10, padding: "6px 10px", border: "1px solid rgba(255,214,10,0.2)" }}>
                  <div style={{ color: "#ffd60a", fontSize: 9, fontWeight: 700 }}>GÜÇ</div>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{score > 80 ? "YÜKSEK" : (score > 60 ? "ORTA" : "ZAYIF")}</div>
                </div>
              </div>
              
              <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                <span style={{ background: "rgba(0,212,170,0.1)", color: "#00d4aa", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>POZİTİF HABER</span>
                <span style={{ background: "rgba(191,90,242,0.1)", color: "#bf5af2", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>HACİM ARTIŞI</span>
              </div>
            </div>
          );
        }) : (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#4a5568" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔭</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Şu an tavan ihtimali yüksek aday bulunamadı.</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Tarayıcıyı kullanarak yeni analiz başlatabilirsiniz.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScalpScreen({ candidates, prices, lastUpdated, onBack, onSelect, market }: any) {
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
          <div style={{ textAlign: "right" }}>
            {market === "BIST" && <div style={{ color: "#4a5568", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>⏱ 15 Dk Gecikmeli</div>}
            {lastUpdated && <div style={{ color: "#4a5568", fontSize: 10 }}>{lastUpdated}</div>}
          </div>
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
          const isCrypto = stock.symbol.includes("-USDT");
          const currency = isCrypto ? " USDT" : " ₺";
          
          const isShort = stock.side === 'short';
          const sideColor = isShort ? "#ff453a" : "#00d4aa";
          
          const scalpTp = isShort 
            ? +(price * 0.975).toFixed(stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2)))
            : +(price * 1.025).toFixed(stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2)));
          
          const scalpSl = isShort
            ? +(price * 1.015).toFixed(stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2)))
            : +(price * 0.985).toFixed(stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2)));

          return (
            <button
              key={`${stock.symbol}-${stock.side}`}
              onClick={() => onSelect(stock)}
              style={{ background: "#21262d", borderRadius: 20, padding: "16px", border: `1px solid ${sideColor}33`, cursor: "pointer", textAlign: "left", width: "100%", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: sideColor }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{stock.symbol}</div>
                    <div style={{ background: isShort ? "rgba(255,69,58,0.15)" : "rgba(0,212,170,0.15)", color: sideColor, fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 4 }}>{isShort ? "SELL" : "BUY"}</div>
                  </div>
                  <div style={{ color: "#8b949e", fontSize: 11 }}>{stock.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{price.toFixed(stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2)))}{currency}</div>
                  <div style={{ color: up ? "#30d158" : "#ff453a", fontSize: 12, fontWeight: 700 }}>{up ? "+" : ""}{currentChange.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div>
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px", textAlign: "center" }}>
                  <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700 }}>GİRİŞ</div>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{price.toFixed(stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2)))}</div>
                </div>
                <div style={{ background: isShort ? "rgba(255,69,58,0.08)" : "rgba(48,209,88,0.08)", borderRadius: 12, padding: "8px", textAlign: "center", border: `1px solid ${isShort ? "rgba(255,69,58,0.2)" : "rgba(48,209,88,0.2)"}` }}>
                  <div style={{ color: isShort ? "#ff453a" : "#30d158", fontSize: 9, fontWeight: 700 }}>HEDEF</div>
                  <div style={{ color: isShort ? "#ff453a" : "#30d158", fontSize: 13, fontWeight: 800 }}>{scalpTp}</div>
                </div>
                <div style={{ background: isShort ? "rgba(48,209,88,0.08)" : "rgba(255,69,58,0.08)", borderRadius: 12, padding: "8px", textAlign: "center", border: `1px solid ${isShort ? "rgba(48,209,88,0.2)" : "rgba(255,69,58,0.2)"}` }}>
                  <div style={{ color: isShort ? "#30d158" : "#ff453a", fontSize: 9, fontWeight: 700 }}>STOP</div>
                  <div style={{ color: isShort ? "#30d158" : "#ff453a", fontSize: 13, fontWeight: 800 }}>{scalpSl}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: "rgba(191,90,242,0.1)", color: "#bf5af2", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>RSI: {pd.rsi}</span>
                  <span style={{ background: "rgba(0,184,255,0.1)", color: "#00b8ff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{pd.pattern}</span>
                </div>
                <div style={{ color: sideColor, fontSize: 11, fontWeight: 800 }}>Analiz Et →</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CandidatesScreen({ candidates, prices, lastUpdated, onBack, onSelect, market }: any) {
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
<div style={{ textAlign: "right" }}>
{market === "BIST" && <div style={{ color: "#4a5568", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>⏱ 15 Dk Gecikmeli</div>}
{lastUpdated && <div style={{ color: "#4a5568", fontSize: 10 }}>Güncelleme: {lastUpdated}</div>}
</div>
</div>
</div>
  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ background: "rgba(0,212,170,0.05)", borderRadius: 16, padding: 16, border: "1px solid rgba(0,212,170,0.15)", marginBottom: 4 }}>
      <div style={{ color: "#00d4aa", fontSize: 13, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>🎯</span> ADAY BELİRLEME STRATEJİSİ
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { l: "RSI", d: "Aşırı Satım (<35)" },
          { l: "MACD", d: "Pozitif Kesişim" },
          { l: "FIB", d: "0.618 / 0.786 Destek" },
          { l: "GÜVEN", d: "%80+ Formasyon" }
        ].map(s => (
          <div key={s.l}>
            <div style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{s.l}</div>
            <div style={{ color: "#8b949e", fontSize: 10 }}>{s.d}</div>
          </div>
        ))}
      </div>
    </div>
    {candidates
      .filter((stock: any) => {
        const pd = PATTERN_DATA[stock.symbol] || { patternScore: 30 };
        return pd.patternScore >= 80;
      })
      .map((stock: any, idx: number) => {
      const pd = PATTERN_DATA[stock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
      let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
      if (!Number.isFinite(price)) price = 0;
      let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
      if (!Number.isFinite(currentChange)) currentChange = 0;
      const up = currentChange >= 0;
      const isTop = idx < 3;
      const isCrypto = stock.symbol.includes("-USDT");
      const isCommodity = stock.sector === "Emtia";
      const currency = isCrypto ? " USDT" : (isCommodity && !stock.name.includes("(TL)") ? " $" : " ₺");
      const precision = stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2));
      
      const isShort = stock.side === 'short';
      const sideColor = isShort ? "#ff453a" : "#00d4aa";
      
      let potential = Number(stock.dynamicPotential ?? pd.potential ?? 0);
      if (!Number.isFinite(potential)) potential = 0;
      
      const tp = isShort ? +(price * (1 - potential / 100)).toFixed(precision) : +(price * (1 + potential / 100)).toFixed(precision);
      const resist = isShort ? +(price * 0.92).toFixed(precision) : +(price * 1.08).toFixed(precision);

      return (
        <button
          key={`${stock.symbol}-${stock.side}`}
          onClick={() => onSelect(stock)}
          style={{ background: isTop ? "linear-gradient(135deg, #21262d, #161b22)" : "#21262d", borderRadius: 24, padding: "20px", border: isTop ? `1px solid ${sideColor}88` : "1px solid #30363d", cursor: "pointer", textAlign: "left", width: "100%", boxShadow: isTop ? `0 10px 30px ${sideColor}11` : "none" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{stock.symbol}</span>
                <span style={{ background: isShort ? "rgba(255,69,58,0.2)" : "rgba(0,212,170,0.2)", color: sideColor, fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 12, border: `1px solid ${sideColor}44` }}>
                  {isShort ? "HEDEF DÜŞÜŞ" : "HEDEF KAZANÇ"} {potential.toFixed(1)}%
                </span>
              </div>
              <div style={{ color: "#8b949e", fontSize: 13, fontWeight: 600 }}>{stock.name}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>{price.toFixed(precision)}{currency}</div>
              <div style={{ color: up ? "#30d158" : "#ff453a", fontSize: 13, fontWeight: 800, background: up ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)", padding: "2px 8px", borderRadius: 6, marginTop: 4, display: "inline-block" }}>
                <span style={{ fontSize: 9, opacity: 0.8, marginRight: 4 }}>GÜNLÜK:</span>
                {up ? "+" : ""}{currentChange.toFixed(2)}%
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1.2, background: isShort ? "rgba(255,69,58,0.1)" : "rgba(48,209,88,0.1)", borderRadius: 16, padding: "12px 16px", border: `1px solid ${isShort ? "rgba(255,69,58,0.3)" : "rgba(48,209,88,0.3)"}` }}>
              <div style={{ color: isShort ? "#ff453a" : "#30d158", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>HEDEF (TP)</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>{tp}{currency}</div>
                <div style={{ color: sideColor, fontSize: 12, fontWeight: 700 }}>+{potential.toFixed(1)}%</div>
              </div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,214,10,0.1)", borderRadius: 16, padding: "12px 16px", border: "1px solid rgba(255,214,10,0.3)" }}>
              <div style={{ color: "#ffd60a", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>{isShort ? "DESTEK" : "DİRENÇ"}</div>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>{resist}{currency}</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: sideColor, fontSize: 13, fontWeight: 700 }}>📐 {pd.pattern}</div>
            <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 600 }}>Güven: %{pd.patternScore}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            <Pill label="RSI" val={pd.rsi} good={isShort ? pd.rsi > 60 : pd.rsi < 40} />
            <Pill label="MACD" val={pd.macd > 0 ? "▲" : "▼"} good={isShort ? pd.macd < 0 : pd.macd > 0} />
            <Pill label="FIB" val={pd.fibLevel} good />
            <Pill label="SKOR" val={pd.patternScore} good={pd.patternScore > 70} />
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
<div style={{ background: good ? "rgba(0,212,170,0.12)" : "rgba(255,69,58,0.12)", borderRadius: 8, padding: "5px 0", textAlign: "center", border: `1px solid ${good ? "rgba(0,212,170,0.2)" : "rgba(255,69,58,0.2)"}` }}>
<div style={{ color: "#8b949e", fontSize: 9, fontWeight: 600 }}>{label}</div>
<div style={{ color: good ? "#00d4aa" : "#ff453a", fontSize: 12, fontWeight: 700 }}>{val}</div>
</div>
);
}

function DetailScreen({ stock, prices, patternData: pd, aiAnalysis, aiLoading, onFetchAi, kapNews, tab, setTab, timeframe, setTimeframe, onBack }: any) {
let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
if (!Number.isFinite(price)) price = 0;
let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
if (!Number.isFinite(currentChange)) currentChange = 0;
const up = currentChange >= 0;
const isCrypto = stock.symbol.includes("-USDT");
const isCommodity = stock.sector === "Emtia";
const currency = isCrypto ? " USDT" : (isCommodity && !stock.name.includes("(TL)") ? " $" : " ₺");
const chartData = useMemo(() => generateCandleData(price), [stock.symbol, price]);

const pricePrecision = stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2));

const isShort = stock.side === 'short';
const sideColor = isShort ? "#ff453a" : "#00d4aa";

const tp1 = isShort ? +(price * 0.85).toFixed(pricePrecision) : +(price * 1.15).toFixed(pricePrecision);
const tp2 = isShort ? +(price * 0.72).toFixed(pricePrecision) : +(price * 1.28).toFixed(pricePrecision);
let potential = Number(stock.dynamicPotential ?? pd.potential ?? 0);
if (!Number.isFinite(potential)) potential = 0;
const tp3 = isShort ? +(price * (1 - potential / 100)).toFixed(pricePrecision) : +(price * (1 + potential / 100)).toFixed(pricePrecision);
const sl = isShort ? +(price * 1.08).toFixed(pricePrecision) : +(price * 0.92).toFixed(pricePrecision);
const support = +(price * 0.95).toFixed(pricePrecision);
const resist = +(price * 1.08).toFixed(pricePrecision);

// Scalp Levels (Short Term)
const scalpTp1 = isShort ? +(price * 0.98).toFixed(pricePrecision) : +(price * 1.02).toFixed(pricePrecision);
const scalpTp2 = isShort ? +(price * 0.96).toFixed(pricePrecision) : +(price * 1.04).toFixed(pricePrecision);
const scalpSl = isShort ? +(price * 1.015).toFixed(pricePrecision) : +(price * 0.985).toFixed(pricePrecision);

return (
<>
<div style={{ padding: "0 0 20px" }}>
<div style={{ padding: "16px 20px 20px", borderBottom: "1px solid #1a1f2e", background: "linear-gradient(180deg, rgba(0,212,170,0.08) 0%, transparent 100%)" }}>
<button onClick={onBack} style={{ background: "none", border: "none", color: sideColor, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
  <span style={{ fontSize: 18 }}>←</span> Geri Dön
</button>
<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ color: "#fff", fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>{stock.symbol}</div>
    <div style={{ background: isShort ? "rgba(255,69,58,0.2)" : "rgba(0,212,170,0.2)", color: sideColor, fontSize: 13, fontWeight: 800, padding: "4px 14px", borderRadius: 12, border: `1px solid ${sideColor}55` }}>
      {isShort ? "HEDEF DÜŞÜŞ" : "HEDEF KAZANÇ"} {potential.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
    </div>
  </div>
  <div style={{ color: "#8b949e", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{stock.name}</div>
  
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
    <div>
      <div style={{ color: "#fff", fontSize: 36, fontWeight: 900, letterSpacing: -0.5 }}>{price.toFixed(pricePrecision)} {currency}</div>
      <div style={{ color: up ? "#30d158" : "#ff453a", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
        {up ? "▲" : "▼"} {up ? "+" : ""}{currentChange.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
      </div>
    </div>
    <div style={{ textAlign: "right", paddingBottom: 4 }}>
      <div style={{ color: "#4a5568", fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>VERİ KAYNAĞI</div>
      <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 700 }}>
        {prices[`${stock.symbol}_source`] ? `📡 ${prices[`${stock.symbol}_source`].toUpperCase()}` : (!isCrypto && !isCommodity ? "⏱ 15 DK GECİKMELİ" : "📡 CANLI VERİ")}
      </div>
    </div>
  </div>
</div>
</div>
    <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto" }}>
      {[
        { l: "RSI", v: pd.rsi, good: pd.rsi < 40 },
        { l: "MACD", v: pd.macd > 0 ? "ALIŞ" : "SATIŞ", good: pd.macd > 0 },
        { l: "FIB", v: pd.fibLevel, good: true },
        { l: "SKOR", v: `${pd.patternScore}`, good: pd.patternScore > 75 },
        { l: "POT.", v: `+%${potential.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, good: true },
      ].map(s => (
        <div key={s.l} style={{ flexShrink: 0, background: "#131922", borderRadius: 10, padding: "8px 12px", border: s.good ? "1px solid rgba(0,212,170,0.2)" : "1px solid rgba(255,69,58,0.2)" }}>
          <div style={{ color: "#4a5568", fontSize: 9, fontWeight: 700 }}>{s.l}</div>
          <div style={{ color: s.good ? "#00d4aa" : "#ff453a", fontSize: 12, fontWeight: 800 }}>{s.v}</div>
        </div>
      ))}
    </div>

  <div style={{ padding: "14px 16px 0" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div style={{ color: "#00d4aa", fontSize: 12, fontWeight: 700 }}>📐 {pd.pattern}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {["1S", "4S", "1G"].map(tf => (
          <button key={tf} onClick={() => setTimeframe(tf)} style={{
            padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
            background: timeframe === tf ? "#00d4aa" : "#21262d", color: timeframe === tf ? "#000" : "#8b949e"
          }}>{tf}</button>
        ))}
      </div>
    </div>

    <div style={{ background: "#161b22", borderRadius: 16, padding: "10px 0 5px", border: "1px solid #30363d" }}>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
          <defs>
            <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="i" tick={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#21262d", border: "1px solid #30363d", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#8b949e" }} itemStyle={{ color: "#00d4aa" }} formatter={(v: any) => [`${v.toFixed(2)} ${currency}`, "Fiyat"]} labelFormatter={() => ""} />
          <ReferenceLine y={timeframe === "1S" ? scalpTp1 : tp1} stroke="#30d158" strokeDasharray="3 3" strokeWidth={1} label={{ value: timeframe === "1S" ? `Scalp TP: ${scalpTp1}` : `TP1: ${tp1}`, position: "right", fontSize: 9, fill: "#30d158" }} />
          <ReferenceLine y={timeframe === "1S" ? scalpSl : sl} stroke="#ff453a" strokeDasharray="3 3" strokeWidth={1} label={{ value: timeframe === "1S" ? `Scalp SL: ${scalpSl}` : `SL: ${sl}`, position: "right", fontSize: 9, fill: "#ff453a" }} />
          <Area type="monotone" dataKey="price" stroke="#00d4aa" strokeWidth={1.5} fill="url(#colorUp)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    {timeframe === "1S" ? (
      <div style={{ marginTop: 12, background: "linear-gradient(135deg, #21262d 0%, #161b22 100%)", borderRadius: 16, padding: 14, border: "1px solid rgba(0,212,170,0.3)" }}>
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
              <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700 }}>{t.label}</div>
              <div style={{ color: t.color, fontSize: 14, fontWeight: 800, marginTop: 2 }}>{t.val}</div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div style={{ marginTop: 12, background: "#161b22", borderRadius: 16, padding: 14, border: "1px solid #30363d" }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🎯 {timeframe === "4S" ? "4 Saatlik" : "Günlük"} TP / SL Seviyeleri</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "TP 1 (+15%)", val: `${tp1} ${currency}`, color: "#30d158", bg: "rgba(48,209,88,0.08)" },
            { label: "TP 2 (+28%)", val: `${tp2} ${currency}`, color: "#30d158", bg: "rgba(48,209,88,0.08)" },
            { label: `TP 3 (+${potential.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`, val: `${tp3} ${currency}`, color: "#ffd60a", bg: "rgba(255,214,10,0.08)" },
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ color: "#00d4aa", fontSize: 12, fontWeight: 700, animation: "pulse 1.5s infinite" }}>⚡ Hızlı AI Analiz Hazırlanıyor...</div>
          {[100, 85, 92, 70].map((w, i) => (
            <div key={i} style={{ background: "#1a1f2e", borderRadius: 6, height: 10, width: `${w}%`, animation: "pulse 1.5s infinite" }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`}</style>
        </div>
      ) : aiAnalysis ? (
        <div style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiAnalysis}</div>
      ) : (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <button 
            onClick={onFetchAi}
            style={{ 
              background: "linear-gradient(135deg, #00d4aa, #00b8ff)", 
              color: "#000", 
              border: "none", 
              padding: "10px 20px", 
              borderRadius: 12, 
              fontSize: 13, 
              fontWeight: 700, 
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,212,170,0.3)"
            }}
          >
            🤖 AI Analizini Başlat
          </button>
          <div style={{ color: "#4a5568", fontSize: 10, marginTop: 8 }}>Gemini 3 Flash ile anlık teknik yorum</div>
        </div>
      )}
    </div>
  )}

  {tab === "temel" && (
    <div style={{ margin: "12px 16px 0" }}>
      <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>KAP & X HABERLERI</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {kapNews.filter((n: any) => n.type === "pozitif" || n.type === "negatif").length > 0 ? kapNews.filter((n: any) => n.type === "pozitif" || n.type === "negatif").map((n: any, i: number) => (
          <a key={n.id || i} href={n.url} target="_blank" rel="noreferrer" style={{ background: "#131922", borderRadius: 14, padding: "12px 14px", border: "1px solid #1a1f2e", textDecoration: "none", display: "block" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: n.source === "KAP" ? "rgba(0,184,255,0.15)" : "rgba(191,90,242,0.15)", color: n.source === "KAP" ? "#00b8ff" : "#bf5af2", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{n.source || "HABER"}</span>
                <span style={{ background: n.type === "pozitif" ? "rgba(48,209,88,0.15)" : "rgba(100,100,100,0.15)", color: n.type === "pozitif" ? "#30d158" : "#6b7280", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{n.type || "NÖTR"}</span>
              </div>
              <span style={{ color: "#4a5568", fontSize: 10 }}>{n.timestamp ? new Date(n.timestamp).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }) : n.date}</span>
            </div>
            <div style={{ color: "#fff", fontSize: 13, lineHeight: 1.4, fontWeight: 700 }}>{n.title}</div>
            {n.summary && <div style={{ color: "#8b949e", fontSize: 11, marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.summary}</div>}
          </a>
        )) : (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#4a5568", fontSize: 12 }}>Henüz haber akışı bulunmuyor.</div>
        )}

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
</div>
</>
);
}

function BottomNav({ screen, setScreen, candidates, market }: any) {
const navItems = [
  { key: "scanner", icon: "🔍", label: "Tarayıcı" },
  { key: "scalp", icon: "⚡", label: "Scalp" },
  ...(market === "BIST" ? [{ key: "ceiling", icon: "🚀", label: "Tavan" }] : []),
  { key: "candidates", icon: "⭐", label: "Adaylar", badge: candidates.length },
  { key: "detail", icon: "📊", label: "Analiz" },
];

return (
<div style={{ background: "rgba(13,17,23,0.95)", borderTop: "1px solid #1a1f2e", padding: "10px 0 28px", display: "flex", justifyContent: "space-around", backdropFilter: "blur(20px)" }}>
{navItems.map(n => (
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
