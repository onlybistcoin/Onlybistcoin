import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar } from "recharts";
import { GoogleGenAI } from "@google/genai";
import { RefreshCw, AlertCircle } from "lucide-react";
import { db, testConnection } from "./firebase";
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
  ["TCELL", "Turkcell"], ["TTKOM", "Türk Telekom"], ["ENJSA", "Enerjisa"], ["KRDMD", "Kardemir D"],
  ["ECILC", "Eczacıbaşı İlaç"], ["DEVA", "Deva Holding"], ["SELEC", "Selçuk Ecza Deposu"], ["MPARK", "MLP Sağlık"],
  ["LKMNH", "Lokman Hekim"], ["TRILC", "Türk İlaç"], ["GENIL", "Gen İlaç"], ["ANGEN", "Anatolia Tanı"],
  ["MEDTR", "MedITERA"], ["RTALB", "RTA Laboratuvarları"], ["ZOREN", "Zorlu Enerji"], ["AKENR", "Ak Enerji"],
  ["AKSEN", "Aksa Enerji"], ["AYDEM", "Aydem Enerji"], ["GWIND", "Galata Wind"], ["NATEN", "Naturel Enerji"],
  ["ESEN", "Esenboğa Elektrik"], ["MAGEN", "Margün Enerji"], ["BRSAN", "Borusan Boru"], ["BRYAT", "Borusan Yatırım"],
  ["CEMTS", "Çemtaş"], ["IZMDC", "İzmir Demir Çelik"], ["KCAER", "Kocaer Çelik"], ["BUCIM", "Bursa Çimento"],
  ["AKCNS", "Akçansa"], ["CIMSA", "Çimsa"], ["NUHCM", "Nuh Çimento"], ["OYAKC", "Oyak Çimento"],
  ["AFYON", "Afyon Çimento"], ["BTCIM", "Batıçim"], ["BSOKE", "Batısöke"], ["GOLTS", "Göltaş Çimento"],
  ["KONYA", "Konya Çimento"], ["ADEL", "Adel Kalemcilik"], ["DOCO", "DO & CO"], ["CLEBI", "Çelebi"],
  ["SUWEN", "Suwen"], ["BEYAZ", "Beyaz Filo"], ["AYGAZ", "Aygaz"], ["TRCAS", "Turcas Petrol"],
  ["YKSLN", "Yükselen Çelik"], ["TIRE", "Mondi Turkey"], ["KARTN", "Kartonsan"], ["ALKA", "Alkim Kağıt"],
  ["ALKIM", "Alkim Kimya"], ["EGGUB", "Ege Gübre"], ["TEZOL", "Europap Tezol"], ["PRKAB", "Türk Prysmian Kablo"],
  ["ARZUM", "Arzum"], ["VESBE", "Vestel Beyaz Eşya"], ["KLSER", "Kaleseramik"], ["QUAGR", "Qua Granite"],
  ["ISFIN", "İş Finansal Kiralama"], ["QNBFL", "QNB Finansal Kiralama"], ["VAKFN", "Vakıf Finansal Kiralama"],
  ["GARFA", "Garanti Faktoring"], ["LIDFA", "Lider Faktoring"], ["CRDFA", "Creditwest Faktoring"]
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
TCELL: { rsi: 38, macd: 0.45, fibLevel: "0.618", patternScore: 81, pattern: "Yükselen Üçgen", potential: 25 },
TTKOM: { rsi: 41, macd: 0.35, fibLevel: "0.5", patternScore: 72, pattern: "Destek Dönüşü", potential: 20 },
ENJSA: { rsi: 44, macd: 0.25, fibLevel: "0.382", patternScore: 65, pattern: "Kanal İçi Hareket", potential: 15 },
KRDMD: { rsi: 35, macd: 0.75, fibLevel: "0.786", patternScore: 88, pattern: "Düşen Kama Kırılımı ✦", potential: 30 },
ECILC: { rsi: 31, macd: 0.95, fibLevel: "0.786", patternScore: 92, pattern: "RSI Pozitif Uyumsuzluk ✦", potential: 35 },
DEVA: { rsi: 48, macd: 0.15, fibLevel: "0.5", patternScore: 55, pattern: "Yatay Bant", potential: 12 },
SELEC: { rsi: 39, macd: 0.55, fibLevel: "0.618", patternScore: 78, pattern: "Çanak Tamamlama", potential: 22 },
MPARK: { rsi: 52, macd: 0.05, fibLevel: "0.236", patternScore: 45, pattern: "Zirve Konsolidasyonu", potential: 10 },
LKMNH: { rsi: 36, macd: 0.65, fibLevel: "0.618", patternScore: 84, pattern: "İkili Dip", potential: 28 },
TRILC: { rsi: 29, macd: 1.15, fibLevel: "0.786", patternScore: 95, pattern: "Aşırı Satım Tepkisi ✦✦", potential: 42 },
GENIL: { rsi: 42, macd: 0.35, fibLevel: "0.5", patternScore: 68, pattern: "Bayrak Formasyonu", potential: 18 },
ANGEN: { rsi: 34, macd: 0.85, fibLevel: "0.786", patternScore: 89, pattern: "Düşen Trend Kırılımı ✦", potential: 32 },
MEDTR: { rsi: 45, macd: 0.25, fibLevel: "0.5", patternScore: 62, pattern: "Destek Testi", potential: 15 },
RTALB: { rsi: 32, macd: 0.95, fibLevel: "0.786", patternScore: 91, pattern: "Hacimli Kırılım ✦", potential: 38 },
ZOREN: { rsi: 37, macd: 0.55, fibLevel: "0.618", patternScore: 82, pattern: "Simetrik Üçgen", potential: 25 },
AKENR: { rsi: 41, macd: 0.45, fibLevel: "0.5", patternScore: 75, pattern: "Yükselen Kanal Alt Bandı", potential: 20 },
AKSEN: { rsi: 46, macd: 0.15, fibLevel: "0.382", patternScore: 58, pattern: "Konsolidasyon", potential: 14 },
AYDEM: { rsi: 33, macd: 0.85, fibLevel: "0.786", patternScore: 90, pattern: "Düşen Kama Kırılımı ✦", potential: 34 },
GWIND: { rsi: 39, macd: 0.65, fibLevel: "0.618", patternScore: 79, pattern: "Çift Dip", potential: 24 },
NATEN: { rsi: 43, macd: 0.35, fibLevel: "0.5", patternScore: 71, pattern: "Destek Dönüşü", potential: 18 },
ESEN: { rsi: 35, macd: 0.75, fibLevel: "0.786", patternScore: 87, pattern: "RSI Diverjans", potential: 30 },
MAGEN: { rsi: 38, macd: 0.55, fibLevel: "0.618", patternScore: 80, pattern: "Yükselen Üçgen", potential: 26 },
BRSAN: { rsi: 42, macd: 0.45, fibLevel: "0.5", patternScore: 74, pattern: "Bayrak Formasyonu", potential: 22 },
BRYAT: { rsi: 45, macd: 0.25, fibLevel: "0.382", patternScore: 65, pattern: "Yatay Bant", potential: 16 },
CEMTS: { rsi: 36, macd: 0.65, fibLevel: "0.618", patternScore: 85, pattern: "İkili Dip", potential: 28 },
IZMDC: { rsi: 31, macd: 0.95, fibLevel: "0.786", patternScore: 93, pattern: "Aşırı Satım Tepkisi ✦✦", potential: 40 },
KCAER: { rsi: 40, macd: 0.55, fibLevel: "0.618", patternScore: 77, pattern: "Çanak Tamamlama", potential: 24 },
BUCIM: { rsi: 44, macd: 0.35, fibLevel: "0.5", patternScore: 69, pattern: "Destek Testi", potential: 18 },
AKCNS: { rsi: 47, macd: 0.15, fibLevel: "0.382", patternScore: 55, pattern: "Konsolidasyon", potential: 12 },
CIMSA: { rsi: 39, macd: 0.65, fibLevel: "0.618", patternScore: 81, pattern: "Yükselen Kanal Alt Bandı", potential: 25 },
NUHCM: { rsi: 42, macd: 0.45, fibLevel: "0.5", patternScore: 73, pattern: "Bayrak Formasyonu", potential: 20 },
OYAKC: { rsi: 35, macd: 0.75, fibLevel: "0.786", patternScore: 88, pattern: "Düşen Kama Kırılımı ✦", potential: 32 },
AFYON: { rsi: 33, macd: 0.85, fibLevel: "0.786", patternScore: 91, pattern: "RSI Pozitif Uyumsuzluk ✦", potential: 36 },
BTCIM: { rsi: 41, macd: 0.55, fibLevel: "0.618", patternScore: 76, pattern: "Simetrik Üçgen", potential: 22 },
BSOKE: { rsi: 38, macd: 0.65, fibLevel: "0.618", patternScore: 80, pattern: "Çift Dip", potential: 26 },
GOLTS: { rsi: 45, macd: 0.25, fibLevel: "0.5", patternScore: 64, pattern: "Yatay Bant", potential: 15 },
KONYA: { rsi: 48, macd: 0.15, fibLevel: "0.382", patternScore: 52, pattern: "Zirve Konsolidasyonu", potential: 10 },
ADEL: { rsi: 36, macd: 0.75, fibLevel: "0.618", patternScore: 86, pattern: "İkili Dip", potential: 30 },
DOCO: { rsi: 42, macd: 0.45, fibLevel: "0.5", patternScore: 72, pattern: "Destek Dönüşü", potential: 18 },
CLEBI: { rsi: 39, macd: 0.55, fibLevel: "0.618", patternScore: 79, pattern: "Yükselen Üçgen", potential: 24 },
SUWEN: { rsi: 34, macd: 0.85, fibLevel: "0.786", patternScore: 90, pattern: "Düşen Trend Kırılımı ✦", potential: 35 },
BEYAZ: { rsi: 31, macd: 0.95, fibLevel: "0.786", patternScore: 94, pattern: "Aşırı Satım Tepkisi ✦✦", potential: 42 },
AYGAZ: { rsi: 44, macd: 0.35, fibLevel: "0.5", patternScore: 68, pattern: "Bayrak Formasyonu", potential: 16 },
TRCAS: { rsi: 37, macd: 0.65, fibLevel: "0.618", patternScore: 83, pattern: "Simetrik Üçgen", potential: 28 },
YKSLN: { rsi: 40, macd: 0.55, fibLevel: "0.618", patternScore: 78, pattern: "Çanak Tamamlama", potential: 22 },
TIRE: { rsi: 46, macd: 0.25, fibLevel: "0.382", patternScore: 60, pattern: "Konsolidasyon", potential: 14 },
KARTN: { rsi: 35, macd: 0.75, fibLevel: "0.786", patternScore: 87, pattern: "Düşen Kama Kırılımı ✦", potential: 32 },
ALKA: { rsi: 38, macd: 0.65, fibLevel: "0.618", patternScore: 81, pattern: "Çift Dip", potential: 26 },
ALKIM: { rsi: 41, macd: 0.45, fibLevel: "0.5", patternScore: 75, pattern: "Yükselen Kanal Alt Bandı", potential: 20 },
EGGUB: { rsi: 33, macd: 0.85, fibLevel: "0.786", patternScore: 92, pattern: "RSI Pozitif Uyumsuzluk ✦", potential: 38 },
TEZOL: { rsi: 43, macd: 0.35, fibLevel: "0.5", patternScore: 70, pattern: "Destek Testi", potential: 18 },
PRKAB: { rsi: 36, macd: 0.75, fibLevel: "0.618", patternScore: 85, pattern: "İkili Dip", potential: 28 },
ARZUM: { rsi: 39, macd: 0.55, fibLevel: "0.618", patternScore: 79, pattern: "Yükselen Üçgen", potential: 24 },
VESBE: { rsi: 45, macd: 0.25, fibLevel: "0.5", patternScore: 63, pattern: "Yatay Bant", potential: 15 },
KLSER: { rsi: 32, macd: 0.95, fibLevel: "0.786", patternScore: 93, pattern: "Hacimli Kırılım ✦", potential: 40 },
QUAGR: { rsi: 30, macd: 1.05, fibLevel: "0.786", patternScore: 96, pattern: "Aşırı Satım Tepkisi ✦✦", potential: 45 },
ISFIN: { rsi: 42, macd: 0.45, fibLevel: "0.5", patternScore: 74, pattern: "Bayrak Formasyonu", potential: 22 },
QNBFL: { rsi: 47, macd: 0.15, fibLevel: "0.382", patternScore: 54, pattern: "Konsolidasyon", potential: 12 },
VAKFN: { rsi: 38, macd: 0.65, fibLevel: "0.618", patternScore: 80, pattern: "Çift Dip", potential: 25 },
GARFA: { rsi: 41, macd: 0.55, fibLevel: "0.618", patternScore: 77, pattern: "Simetrik Üçgen", potential: 20 },
LIDFA: { rsi: 35, macd: 0.75, fibLevel: "0.786", patternScore: 88, pattern: "Düşen Kama Kırılımı ✦", potential: 30 },
CRDFA: { rsi: 34, macd: 0.85, fibLevel: "0.786", patternScore: 89, pattern: "Düşen Trend Kırılımı ✦", potential: 32 },
"BTC-USDT": { rsi: 32, macd: 1.2, fibLevel: "0.618", patternScore: 88, pattern: "Bullish Divergence", potential: 22 },
"ETH-USDT": { rsi: 35, macd: 0.95, fibLevel: "0.5", patternScore: 82, pattern: "Falling Wedge", potential: 18 },
"SOL-USDT": { rsi: 58, macd: 0.45, fibLevel: "0.236", patternScore: 65, pattern: "Ascending Triangle", potential: 15 },
"BNB-USDT": { rsi: 78, macd: -0.8, fibLevel: "0.786", patternScore: 85, pattern: "Aşırı Alım + Negatif Uyumsuzluk (Satış)", potential: 15 },
"XRP-USDT": { rsi: 82, macd: -1.2, fibLevel: "0.618", patternScore: 89, pattern: "Çift Tepe Formasyonu (Satış)", potential: 22 },
"ADA-USDT": { rsi: 75, macd: -0.5, fibLevel: "0.5", patternScore: 78, pattern: "Yükselen Kama Kırılımı (Satış)", potential: 18 },
"AVAX-USDT": { rsi: 31, macd: 1.1, fibLevel: "0.786", patternScore: 89, pattern: "Cup and Handle", potential: 52 },
"DOGE-USDT": { rsi: 38, macd: -0.45, fibLevel: "0.618", patternScore: 82, pattern: "Azalan Üçgen", potential: 25 },
"DOT-USDT": { rsi: 85, macd: -1.5, fibLevel: "0.236", patternScore: 92, pattern: "Dirençten Dönüş (Satış)", potential: 25 },
"LINK-USDT": { rsi: 39, macd: 0.9, fibLevel: "0.618", patternScore: 82, pattern: "Channel Breakout", potential: 48 },
"MATIC-USDT": { rsi: 72, macd: -0.9, fibLevel: "0.382", patternScore: 81, pattern: "OBO Formasyonu (Satış)", potential: 28 },
"NEAR-USDT": { rsi: 29, macd: 1.5, fibLevel: "0.786", patternScore: 92, pattern: "Parabolic Move Potential", potential: 75 },
"10000PEPE-USDT": { rsi: 32, macd: 0.85, fibLevel: "0.786", patternScore: 94, pattern: "Dip Dönüşü 🐸", potential: 45 },
"FET-USDT": { rsi: 34, macd: 1.4, fibLevel: "0.618", patternScore: 91, pattern: "AI Narrative Hype", potential: 85 },
"RNDR-USDT": { rsi: 36, macd: 1.2, fibLevel: "0.618", patternScore: 87, pattern: "Bull Flag", potential: 58 },
"10000SHIB-USDT": { rsi: 35, macd: 0.65, fibLevel: "0.618", patternScore: 88, pattern: "Akümülasyon Kırılımı", potential: 35 },
};

function generateCandleData(basePrice: number, periods = 60) {
  const data: any[] = [];
  const validBasePrice = Number.isFinite(basePrice) ? basePrice : 100;
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

  // Calculate SMA 20 and EMA 50
  for (let i = 0; i < data.length; i++) {
    // SMA 20
    if (i >= 19) {
      const slice = data.slice(i - 19, i + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.price, 0);
      data[i].sma20 = +(sum / 20).toFixed(precision);
    }
    
    // EMA 50 (Simple approximation for the mock data)
    if (i === 0) {
      data[i].ema50 = data[i].price;
    } else {
      const k = 2 / (50 + 1);
      data[i].ema50 = +(data[i].price * k + data[i - 1].ema50 * (1 - k)).toFixed(precision);
    }
  }

  return data;
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
// Safe implementation of JSON.stringify to handle cyclic structures
import { isSandboxed, safeStorage, safeJsonParse } from "./utils";

// ─── UTILS ──────────────────────────────────────────────────────────────────
const safeJsonStringify = (obj: any) => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.warn("[JSON] Stringify failed, using fallback:", e);
    return "{}";
  }
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// [Cache Bust] v1.0.2 - Real-time Data Sync
export default function BISTAnalyzer() {
  useEffect(() => {
    // Defer Firebase connection test
    if (!isSandboxed()) {
      testConnection().catch(err => console.error("[Firebase] Connection test failed:", err));
    }
  }, []);

const [screen, setScreen] = useState("scanner"); 
const [market, setMarket] = useState<"BIST" | "CRYPTO" | "EMTİA">("BIST");
const [showDebug, setShowDebug] = useState(false);
const [selectedStock, setSelectedStock] = useState<any>(null);
const [scanning, setScanning] = useState<Record<string, boolean>>({ BIST: false, CRYPTO: false, EMTİA: false });
const [scanProgress, setScanProgress] = useState<Record<string, number>>({ BIST: 0, CRYPTO: 0, EMTİA: 0 });
const [scanned, setScanned] = useState<Record<string, boolean>>(() => {
  const saved = safeStorage.getItem("scanned");
  return safeJsonParse(saved, { BIST: false, CRYPTO: false, EMTİA: false });
});
const [candidates, setCandidates] = useState<Record<string, any[]>>(() => {
  const saved = safeStorage.getItem("candidates");
  return safeJsonParse(saved, { BIST: [], CRYPTO: [], EMTİA: [] });
});
const [ceilingCandidates, setCeilingCandidates] = useState<Record<string, any[]>>(() => {
  const saved = safeStorage.getItem("ceilingCandidates");
  return safeJsonParse(saved, { BIST: [], CRYPTO: [], EMTİA: [] });
});
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    // Realistic initial values to prevent "Yükleniyor"
    const initialMocks: Record<string, number> = {
      "XU100": 14073.79, "XU030": 15200.50, "TRY=X": 44.60, "EURTRY=X": 52.50,
      "BTC-USDT": 71082.90, "ETH-USDT": 3540.20, "SOL-USDT": 145.60,
      "GC=F": 4749.57, "GA=F": 6812.73, "GAG=X": 108.92,
      "THYAO": 323.25, "GARAN": 140.40, "AKBNK": 78.40, "EREGL": 55.00,
      "KCHOL": 250.00, "SAHOL": 110.00, "BIMAS": 450.00, "TUPRS": 200.00,
      "ASELS": 70.00, "PGSUS": 1100.00, "SISE": 60.00, "YKBNK": 45.00,
      "MGROS": 550.00, "FROTO": 1200.00, "TOASO": 300.00, "ARCLK": 180.00,
      "DOHOL": 20.00, "PETKM": 30.00, "TAVHL": 250.00, "EKGYO": 15.00
    };
    
    const initialChanges: Record<string, number> = {
      "XU100": 0.52, "XU030": 0.45, "TRY=X": 0.11, "EURTRY=X": 0.46,
      "BTC-USDT": -3.45, "ETH-USDT": -1.20, "SOL-USDT": -2.40,
      "GC=F": -0.36, "GA=F": -0.26, "GAG=X": 0.86,
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
const [aiCache, setAiCache] = useState<Record<string, string>>(() => {
  const saved = safeStorage.getItem("aiCache");
  return safeJsonParse(saved, {});
});
const [timeframe, setTimeframe] = useState("1S");
const [tab, setTab] = useState("teknik"); 
const [portfolios, setPortfolios] = useState<Record<string, any>>(() => {
  const saved = safeStorage.getItem("portfolios");
  return safeJsonParse(saved, {});
});
const [tradeHistory, setTradeHistory] = useState<any[]>(() => {
  const saved = safeStorage.getItem("tradeHistory");
  const parsed = safeJsonParse(saved);
  if (parsed && Array.isArray(parsed)) return parsed;
  // Mock history for the last week
  const now = new Date();
  return [
    { symbol: "THYAO", side: "long", pnl: 4.25, status: "TP", market: "BIST", closedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString() },
    { symbol: "BTC-USDT", side: "short", pnl: 12.80, status: "TP", market: "CRYPTO", closedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1).toISOString() },
    { symbol: "EREGL", side: "long", pnl: -2.10, status: "SL", market: "BIST", closedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString() },
    { symbol: "ETH-USDT", side: "long", pnl: 8.45, status: "TP", market: "CRYPTO", closedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4).toISOString() },
    { symbol: "GC=F", side: "long", pnl: 1.15, status: "TP", market: "EMTİA", closedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  ];
});
const [portfolioLoading, setPortfolioLoading] = useState(false);
const [portfolioError, setPortfolioError] = useState<string | null>(null);
const [portfolioStats, setPortfolioStats] = useState<Record<string, any>>(() => {
  const saved = safeStorage.getItem("portfolioStats");
  return safeJsonParse(saved, {
    BIST: { daily: 0, weekly: 0, monthly: 0 },
    CRYPTO: { daily: 0, weekly: 0, monthly: 0 },
    EMTİA: { daily: 0, weekly: 0, monthly: 0 }
  });
});
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

  // ─── PERSISTENCE ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => safeStorage.setItem("portfolios", safeJsonStringify(portfolios)), 1000);
    return () => clearTimeout(t);
  }, [portfolios]);
  
  useEffect(() => {
    const t = setTimeout(() => safeStorage.setItem("tradeHistory", safeJsonStringify(tradeHistory)), 1000);
    return () => clearTimeout(t);
  }, [tradeHistory]);
  
  useEffect(() => {
    const t = setTimeout(() => safeStorage.setItem("portfolioStats", safeJsonStringify(portfolioStats)), 1000);
    return () => clearTimeout(t);
  }, [portfolioStats]);
  
  useEffect(() => {
    const t = setTimeout(() => safeStorage.setItem("scanned", safeJsonStringify(scanned)), 1000);
    return () => clearTimeout(t);
  }, [scanned]);
  
  useEffect(() => {
    const t = setTimeout(() => safeStorage.setItem("candidates", safeJsonStringify(candidates)), 1000);
    return () => clearTimeout(t);
  }, [candidates]);
  
  useEffect(() => {
    const t = setTimeout(() => safeStorage.setItem("ceilingCandidates", safeJsonStringify(ceilingCandidates)), 1000);
    return () => clearTimeout(t);
  }, [ceilingCandidates]);
  
  useEffect(() => {
    const t = setTimeout(() => safeStorage.setItem("aiCache", safeJsonStringify(aiCache)), 1000);
    return () => clearTimeout(t);
  }, [aiCache]);

  // Periodic cleanup of old trade history (older than 7 days)
  useEffect(() => {
    const interval = setInterval(() => {
      const sevenDaysAgo = Date.now() - (1000 * 60 * 60 * 24 * 7);
      setTradeHistory(prev => {
        const safePrev = prev || [];
        const cleaned = safePrev.filter(h => new Date(h.closedAt).getTime() > sevenDaysAgo);
        return cleaned.length === safePrev.length ? safePrev : cleaned;
      });
    }, 1000 * 60 * 60); // Every hour
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoFallback = useCallback(async () => {
    const tryFetch = async (url: string) => {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (e) { return null; }
      return null;
    };

    try {
      const cacheBuster = Date.now();
      // Try direct first, then proxy
      let data = await tryFetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?_=${cacheBuster}`);
      if (!data) {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://fapi.binance.com/fapi/v1/ticker/24hr?_=${cacheBuster}`)}`;
        const proxyRes = await tryFetch(proxyUrl);
        if (proxyRes && proxyRes.contents) {
          try {
            data = JSON.parse(proxyRes.contents);
          } catch (e) {
            console.warn("Failed to parse Binance proxy contents:", e);
          }
        }
      }

      if (data && Array.isArray(data)) {
        setPrices(prev => {
          const next = { ...prev };
          data.forEach((t: any) => {
            if (t.symbol && t.symbol.endsWith("USDT")) {
              const sym = t.symbol.replace("USDT", "-USDT");
              let price = parseFloat(t.lastPrice);
              if (!isNaN(price) && price > 0) {
                next[sym] = price;
                next[`${sym}_change`] = parseFloat(t.priceChangePercent);
              }
            }
          });
          return next;
        });
      } else {
        // Mock crypto data if fetch fails
        setPrices(prev => {
          const next = { ...prev };
          CRYPTO_COINS.forEach(coin => {
            const sym = coin.symbol;
            if (!next[sym]) {
              const seed = sym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              let basePrice = 10 + (seed % 500);
              if (sym === 'BTC-USDT') basePrice = 71082.90;
              if (sym === 'ETH-USDT') basePrice = 3540.20;
              if (sym === 'SOL-USDT') basePrice = 145.60;
              
              const randomChange = (Math.sin(Date.now() / 10000 + seed) * 10);
              next[sym] = +(basePrice * (1 + randomChange / 100)).toFixed(2);
              next[`${sym}_change`] = +randomChange.toFixed(2);
            }
          });
          return next;
        });
      }

      let spotData = await tryFetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=USDTTRY&_=${cacheBuster}`);
      if (!spotData) {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.binance.com/api/v3/ticker/24hr?symbol=USDTTRY&_=${cacheBuster}`)}`;
        const proxyRes = await tryFetch(proxyUrl);
        if (proxyRes && proxyRes.contents) {
          try {
            spotData = JSON.parse(proxyRes.contents);
          } catch (e) {
            console.warn("Failed to parse Binance spot proxy contents:", e);
          }
        }
      }

      if (spotData && spotData.lastPrice) {
        setPrices(prev => {
          const next = { ...prev };
          let price = parseFloat(spotData.lastPrice);
          if (!isNaN(price) && price > 0) {
            next["USDT-TRY"] = price;
            next["USDT-TRY_change"] = parseFloat(spotData.priceChangePercent);
          }
          return next;
        });
      } else {
        setPrices(prev => {
          const next = { ...prev };
          if (!next["USDT-TRY"]) {
            next["USDT-TRY"] = 44.60 + (Math.sin(Date.now() / 10000) * 0.5);
            next["USDT-TRY_change"] = +(Math.sin(Date.now() / 10000) * 0.1).toFixed(2);
          }
          return next;
        });
      }
    } catch (e) {
      console.error("Crypto fallback failed:", e);
    }
  }, []);

  const fetchBistFallback = useCallback(async () => {
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
            let data = null;
            // Try direct fetch first
            try {
              const directRes = await fetch(targetUrl);
              if (directRes.ok) {
                data = await directRes.json();
              }
            } catch (e) {
              console.warn("Direct fetch failed, trying proxy...", e);
            }

            // Fallback to proxy if direct fails
            if (!data) {
              const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&_=${cacheBuster}`;
              const res = await fetch(proxyUrl);
              if (res.ok) {
                const proxyData = await res.json();
                if (proxyData.contents) {
                  try {
                    data = JSON.parse(proxyData.contents);
                  } catch (e) {
                    console.warn("Failed to parse proxy contents:", e);
                  }
                }
              }
            }

            if (data) {
              setPrices(prev => {
                const next = { ...prev };
                const mappings: Record<string, string> = {
                  "BIST 100": "XU100",
                  "BIST 30": "XU030",
                  "XU100": "XU100",
                  "XU030": "XU030",
                  "ABD DOLARI": "TRY=X",
                  "USD/TRY": "TRY=X",
                  "DOLAR": "TRY=X",
                  "USD": "TRY=X",
                  "EURO": "EURTRY=X",
                  "EUR": "EURTRY=X",
                  "ONS ALTIN": "GC=F",
                  "ALTIN": "GC=F",
                  "ONS": "GC=F",
                  "GRAM ALTIN": "GA=F",
                  "GRAM-ALTIN": "GA=F",
                  "GRAM GÜMÜŞ": "GAG=X",
                  "GÜMÜŞ": "GAG=X",
                  "GUMUS": "GAG=X"
                };

                for (const [key, val] of Object.entries(data)) {
                  if (typeof val === 'object' && val !== null) {
                    const item = val as any;
                    const rawKey = key.toUpperCase().trim();
                    const sym = mappings[rawKey] || rawKey;
                    
                    if (item.Selling) {
                      // Robust parsing for both "1.234,56" and "1234.56"
                      let sellingStr = item.Selling.toString().replace('$', '').replace('€', '').replace('₺', '').trim();
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

                      if (!isNaN(price) && price > 0) {
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
                
                // Truncgil no longer provides BIST stocks, so we mock them for preview mode
                BIST_STOCKS.forEach(stock => {
                  const sym = stock.symbol;
                  if (!next[sym]) {
                    // Generate a stable random price based on symbol name
                    const seed = sym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const basePrice = 10 + (seed % 200);
                    const randomChange = (Math.sin(Date.now() / 10000 + seed) * 5); // -5% to +5%
                    next[sym] = +(basePrice * (1 + randomChange / 100)).toFixed(2);
                    next[`${sym}_change`] = +randomChange.toFixed(2);
                  }
                });
                
                COMMODITY_ITEMS.forEach(item => {
                  const sym = item.symbol;
                  if (!next[sym]) {
                    const seed = sym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const basePrice = 50 + (seed % 2000);
                    const randomChange = (Math.sin(Date.now() / 10000 + seed) * 3);
                    next[sym] = +(basePrice * (1 + randomChange / 100)).toFixed(2);
                    next[`${sym}_change`] = +randomChange.toFixed(2);
                  }
                });
                
                if (!next["XU100"]) {
                  next["XU100"] = 14073.79 + (Math.sin(Date.now() / 10000) * 100);
                  next["XU100_change"] = +(Math.sin(Date.now() / 10000) * 2).toFixed(2);
                }
                if (!next["XU030"]) {
                  next["XU030"] = 15200.50 + (Math.sin(Date.now() / 10000) * 120);
                  next["XU030_change"] = +(Math.sin(Date.now() / 10000) * 2.2).toFixed(2);
                }
                if (!next["TRY=X"]) {
                  next["TRY=X"] = 44.60 + (Math.sin(Date.now() / 10000) * 0.5);
                  next["TRY=X_change"] = +(Math.sin(Date.now() / 10000) * 0.1).toFixed(2);
                }
                if (!next["EURTRY=X"]) {
                  next["EURTRY=X"] = 52.50 + (Math.sin(Date.now() / 10000) * 0.6);
                  next["EURTRY=X_change"] = +(Math.sin(Date.now() / 10000) * 0.15).toFixed(2);
                }
                if (!next["GC=F"]) {
                  next["GC=F"] = 4749.57 + (Math.sin(Date.now() / 10000) * 20);
                  next["GC=F_change"] = +(Math.sin(Date.now() / 10000) * 0.8).toFixed(2);
                }
                if (!next["GA=F"]) {
                  next["GA=F"] = 6812.73 + (Math.sin(Date.now() / 10000) * 15);
                  next["GA=F_change"] = +(Math.sin(Date.now() / 10000) * 0.7).toFixed(2);
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
        
        // If all sources failed, still mock BIST stocks
        if (!success) {
          setPrices(prev => {
            const next = { ...prev };
            BIST_STOCKS.forEach(stock => {
              const sym = stock.symbol;
              if (!next[sym]) {
                const seed = sym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const basePrice = 10 + (seed % 200);
                const randomChange = (Math.sin(Date.now() / 10000 + seed) * 5);
                next[sym] = +(basePrice * (1 + randomChange / 100)).toFixed(2);
                next[`${sym}_change`] = +randomChange.toFixed(2);
              }
            });
            
            COMMODITY_ITEMS.forEach(item => {
              const sym = item.symbol;
              if (!next[sym]) {
                const seed = sym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const basePrice = 50 + (seed % 2000);
                const randomChange = (Math.sin(Date.now() / 10000 + seed) * 3);
                next[sym] = +(basePrice * (1 + randomChange / 100)).toFixed(2);
                next[`${sym}_change`] = +randomChange.toFixed(2);
              }
            });
            
            if (!next["XU100"]) {
              next["XU100"] = 14073.79 + (Math.sin(Date.now() / 10000) * 100);
              next["XU100_change"] = +(Math.sin(Date.now() / 10000) * 2).toFixed(2);
            }
            if (!next["XU030"]) {
              next["XU030"] = 15200.50 + (Math.sin(Date.now() / 10000) * 120);
              next["XU030_change"] = +(Math.sin(Date.now() / 10000) * 2.2).toFixed(2);
            }
            if (!next["TRY=X"]) {
              next["TRY=X"] = 44.60 + (Math.sin(Date.now() / 10000) * 0.5);
              next["TRY=X_change"] = +(Math.sin(Date.now() / 10000) * 0.1).toFixed(2);
            }
            if (!next["EURTRY=X"]) {
              next["EURTRY=X"] = 52.50 + (Math.sin(Date.now() / 10000) * 0.6);
              next["EURTRY=X_change"] = +(Math.sin(Date.now() / 10000) * 0.15).toFixed(2);
            }
            if (!next["GC=F"]) {
              next["GC=F"] = 4749.57 + (Math.sin(Date.now() / 10000) * 20);
              next["GC=F_change"] = +(Math.sin(Date.now() / 10000) * 0.8).toFixed(2);
            }
            if (!next["GA=F"]) {
              next["GA=F"] = 6812.73 + (Math.sin(Date.now() / 10000) * 15);
              next["GA=F_change"] = +(Math.sin(Date.now() / 10000) * 0.7).toFixed(2);
            }
            return next;
          });
        }
    } catch (e) {
      console.error("BIST fallback critical failure:", e);
    }
  }, []);

  const fetchPrices = useCallback(async () => {
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
          
          // Check if crypto data is missing (e.g. Vercel IP blocked by Binance)
          if (!data["BTC-USDT"]) {
            console.warn("[App] Backend response missing crypto data, triggering crypto fallback...");
            fetchCryptoFallback();
          }
          
          setPrices(prev => {
            const next = { ...prev };
            for (const [symbol, info] of Object.entries(data)) {
              const infoData = info as any;
              if (infoData && typeof infoData === 'object') {
                // Only update if we have a valid positive price
                if (infoData.price && infoData.price > 0) {
                  next[symbol] = infoData.price;
                }
                if (infoData.change !== undefined) next[`${symbol}_change`] = infoData.change;
                if (infoData.volume !== undefined) next[`${symbol}_volume`] = infoData.volume;
                if (infoData.source) next[`${symbol}_source`] = infoData.source;
                if (infoData.lastUpdated) next[`${symbol}_lastUpdated`] = infoData.lastUpdated;
              } else if (typeof infoData === 'number' && infoData > 0) {
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
        setFetchError(`Fiyat Hattı Hatası: ${res.status}`);
        fetchCryptoFallback();
        fetchBistFallback();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn("[App] API fetch timed out");
        setFetchError("Bağlantı Zaman Aşımı");
      } else if (error.message && (error.message.includes("pattern") || error.message.includes("URL"))) {
        console.warn("[App] Invalid URL context, using fallbacks.");
        setFetchError(`Bağlantı Hatası (URL): ${error.message}`);
      } else {
        console.error("[App] API fetch error:", error);
        setFetchError(`Bağlantı Hatası: ${error.message}`);
      }
      fetchCryptoFallback();
      fetchBistFallback();
    } finally {
      setLoading(false);
    }
  }, [fetchCryptoFallback, fetchBistFallback]);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      if (res.ok) setNews(await res.json());
    } catch (error) { console.error("News fetch error:", error); }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPrices();
    fetchNews();
    const interval = setInterval(() => { fetchPrices(); fetchNews(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices, fetchNews]);

  // Removed News Listener to avoid Firestore quota issues

  const handleRefresh = () => {
    setLoading(true);
    fetchPrices();
    fetchNews();
  };

const startScan = useCallback(() => {
  const targetMarket = market;
  if (scanning[targetMarket]) return;

  if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

  setScanning(prev => ({ ...prev, [targetMarket]: true }));
  setScanProgress(prev => ({ ...prev, [targetMarket]: 0 }));
  setScanned(prev => ({ ...prev, [targetMarket]: false }));
  setCandidates(prev => ({ ...prev, [targetMarket]: [] }));
  
  let p = 0;
  scanIntervalRef.current = setInterval(() => {
    p += Math.random() * 5 + 2;
    if (p >= 100) {
      p = 100;
      clearInterval(scanIntervalRef.current);
      setScanning(prev => ({ ...prev, [targetMarket]: false }));
      setScanned(prev => ({ ...prev, [targetMarket]: true }));

      // Dynamically calculate potential based on live price changes and mock pattern data
      const found = stocks.flatMap(s => {
        // Use live price if available, otherwise fallback to mock
        const livePrice = prices[s.symbol] || s.price || 0;
        const liveChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
        
        let pd = PATTERN_DATA[s.symbol];
        if (!pd) {
          const isCrypto = s.symbol.includes("USDT");
          const volMult = isCrypto ? 2 : 1;
          
          if (liveChange > 3 * volMult) {
            pd = {
              rsi: 65 + Math.random() * 20,
              macd: -0.1 - Math.random(),
              fibLevel: "0.786",
              patternScore: 60 + Math.random() * 30,
              pattern: "Aşırı Alım (Düzeltme Beklentisi)",
              potential: 3 + Math.random() * 5
            };
          } else if (liveChange < -3 * volMult) {
            pd = {
              rsi: 15 + Math.random() * 20,
              macd: 0.1 + Math.random(),
              fibLevel: "0.236",
              patternScore: 60 + Math.random() * 30,
              pattern: "Aşırı Satım (Tepki Beklentisi)",
              potential: 3 + Math.random() * 5
            };
          } else {
            pd = { 
              rsi: 40 + Math.random() * 20, 
              macd: (Math.random() - 0.5) * 2, 
              fibLevel: "0.5", 
              patternScore: 30 + Math.random() * 20, 
              pattern: "Yatay Seyir", 
              potential: 2 + Math.random() * 3 
            };
          }
        }
        
        if (!Number.isFinite(liveChange)) return [];
        
        // --- Improved Logic ---
        // 1. RSI Bias
        let rsiLongBias = pd.rsi < 40 ? (40 - pd.rsi) * 1.5 : 0;
        let rsiShortBias = pd.rsi > 60 ? (pd.rsi - 60) * 1.5 : 0;
        
        // 2. MACD Bias
        let macdBias = pd.macd * 10; // Positive MACD favors long
        
        // 3. Trend Bias (liveChange)
        let momentumBias = liveChange * 3;
        
        let techLong = pd.potential + rsiLongBias + macdBias + momentumBias;
        let techShort = pd.potential + rsiShortBias - macdBias - momentumBias;
        techLong = Math.max(0, Math.min(100, techLong));
        techShort = Math.max(0, Math.min(100, techShort));

        const isCrypto = s.symbol.includes("USDT");
        const isCommodity = s.sector === "Emtia";
        const isBist = !isCrypto && !isCommodity;

        // Generate consistent pseudo-random scores based on symbol
        const seed = s.symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const pseudoRandom = (offset: number) => {
          let x = Math.sin(seed + offset) * 10000;
          return x - Math.floor(x);
        };

        let longScore = 0;
        let shortScore = 0;
        let fundBullish = 30 + (pseudoRandom(1) * 70);
        let whaleBullish = 30 + (pseudoRandom(2) * 70);
        let globalBullish = 30 + (pseudoRandom(3) * 70);

        if (isBist) {
          // %60 Teknik, %40 Temel
          longScore = (techLong * 0.6) + (fundBullish * 0.4);
          shortScore = (techShort * 0.6) + ((100 - fundBullish) * 0.4);
        } else if (isCrypto) {
          // %70 Teknik, %30 Balina
          longScore = (techLong * 0.7) + (whaleBullish * 0.3);
          shortScore = (techShort * 0.7) + ((100 - whaleBullish) * 0.3);
        } else {
          // %50 Teknik, %50 Temel/Haber/Dünya Gündemi
          longScore = (techLong * 0.5) + (globalBullish * 0.5);
          shortScore = (techShort * 0.5) + ((100 - globalBullish) * 0.5);
        }
        
        // Normalize and cap
        longScore = Math.max(0, Math.min(98, longScore));
        shortScore = Math.max(0, Math.min(98, shortScore));
        
        // Simulate 12 Moving Averages (SMA/EMA 5,10,20,50,100,200)
        let maBuyCount = Math.round((longScore / 100) * 12);
        let maSellCount = Math.round((shortScore / 100) * 12);
        
        // Add some noise
        maBuyCount = Math.min(12, Math.max(0, maBuyCount + (Math.random() > 0.5 ? 1 : 0)));
        maSellCount = Math.min(12, Math.max(0, maSellCount + (Math.random() > 0.5 ? 1 : 0)));

        // Simulate Whale Activity
        let whale = { action: "YOK", amount: "" };
        if (longScore >= 70 && Math.random() > 0.3) {
          whale = { action: "ALIM", amount: isCrypto ? `${(Math.random() * 5 + 1).toFixed(1)}M$` : `${(Math.random() * 50 + 10).toFixed(0)}M ₺` };
        } else if (shortScore >= 70 && Math.random() > 0.3) {
          whale = { action: "SATIM", amount: isCrypto ? `${(Math.random() * 5 + 1).toFixed(1)}M$` : `${(Math.random() * 50 + 10).toFixed(0)}M ₺` };
        }

        const results = [];
        // Only show the stronger side if both are above threshold
        // Threshold set to 65 for candidates AND 8/12 moving averages must give buy/sell
        if (longScore >= 65 && maBuyCount >= 8 && longScore >= shortScore) {
          results.push({ ...s, dynamicPotential: longScore, side: 'long', maBuyCount, whale, techScore: techLong, fundScore: fundBullish, whaleScore: whaleBullish, globalScore: globalBullish });
        } else if (shortScore >= 65 && maSellCount >= 8) {
          results.push({ ...s, dynamicPotential: shortScore, side: 'short', maSellCount, whale, techScore: techShort, fundScore: 100 - fundBullish, whaleScore: 100 - whaleBullish, globalScore: 100 - globalBullish });
        }
        
        return results;
      }).sort((a, b) => b.dynamicPotential - a.dynamicPotential);

      setCandidates(prev => ({ ...prev, [targetMarket]: found }));

      // Tavan (Ceiling) Candidates for BIST
      if (targetMarket === "BIST") {
        const ceiling = stocks.map(s => {
          let liveChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
          if (!Number.isFinite(liveChange)) liveChange = 0;
          
          const pd = PATTERN_DATA[s.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
          
          let ceilingScore = (liveChange * 8) + (pd.patternScore / 5);
          
          if (liveChange > 9.8) {
            ceilingScore = 0; 
          } else {
            ceilingScore = Math.min(99, ceilingScore);
          }
          
          return { ...s, ceilingScore };
        }).filter(s => s.ceilingScore >= 45)
          .sort((a, b) => b.ceilingScore - a.ceilingScore);
        
        setCeilingCandidates(prev => ({ ...prev, [targetMarket]: ceiling }));
      } else {
        setCeilingCandidates(prev => ({ ...prev, [targetMarket]: [] }));
      }
    }
    setScanProgress(prev => ({ ...prev, [targetMarket]: Math.min(p, 100) }));
  }, 80);
}, [prices, stocks, market, scanning]);

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
    
    const isShort = stock.side === 'short';
    const systemDecision = isShort ? "SAT (SHORT)" : "AL (LONG)";
    const whaleInfo = stock.whale && stock.whale.action !== "YOK" ? `Balina Aktivitesi: ${stock.whale.action} (${stock.whale.amount})` : "Belirgin balina aktivitesi yok.";
    
    const prompt = `Analist: ${isCrypto ? "Kripto" : "Borsa"}. Varlık: ${stock.symbol}. 
Sistem Sinyali: ${systemDecision}.
${whaleInfo}
Veri: Fiyat ${promptPrice}, Değişim %${promptChange}, RSI ${pd.rsi}, MACD ${pd.macd > 0 ? "Pozitif" : "Negatif"}, Formasyon: ${pd.pattern}.

Talimat: Çok kısa, teknik ve temel olarak net ol. 
Sistem bu varlık için ${systemDecision} sinyali verdi. Analizini bu yöne odaklanarak (veya neden bu yönün seçildiğini açıklayarak) yap. Özellikle ${whaleInfo} verisini dikkate al.

1. 🎯 FORMASYON: ${pd.pattern} yorumu.
2. 📊 TEKNİK: RSI/MACD yönü.
3. 📰 TEMEL: Varlık hakkında kısa temel beklenti.
4. ⚡ SCALP: Giriş/TP.
5. 🎰 RİSK: Stop.
6. 💎 KARAR: ${systemDecision} (neden).`;

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

const calculateAssetScore = useCallback((s: any, currentPrices: any) => {
  const safePrices = currentPrices || {};
  const liveChange = Number(safePrices[`${s.symbol}_change`] ?? s.change ?? 0);
  let pd = PATTERN_DATA[s.symbol];
  if (!pd) {
    const isCrypto = s.symbol.includes("USDT");
    const volMult = isCrypto ? 2 : 1;
    if (liveChange > 3 * volMult) {
      pd = { rsi: 75, macd: -0.5, fibLevel: "0.786", patternScore: 80, pattern: "Aşırı Alım", potential: 5 };
    } else if (liveChange < -3 * volMult) {
      pd = { rsi: 25, macd: 0.5, fibLevel: "0.236", patternScore: 80, pattern: "Aşırı Satım", potential: 5 };
    } else {
      pd = { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 40, pattern: "Yatay", potential: 3 };
    }
  }

  let rsiLongBias = pd.rsi < 40 ? (40 - pd.rsi) * 1.5 : 0;
  let rsiShortBias = pd.rsi > 60 ? (pd.rsi - 60) * 1.5 : 0;
  let macdBias = pd.macd * 10;
  let momentumBias = liveChange * 3;
  
  let techLong = pd.potential + rsiLongBias + macdBias + momentumBias;
  let techShort = pd.potential + rsiShortBias - macdBias - momentumBias;
  techLong = Math.max(0, Math.min(100, techLong));
  techShort = Math.max(0, Math.min(100, techShort));

  const isCrypto = s.symbol.includes("USDT");
  const isCommodity = s.sector === "Emtia";
  const isBist = !isCrypto && !isCommodity;

  const seed = s.symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const pseudoRandom = (offset: number) => {
    let x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  let longScore = 0;
  let shortScore = 0;
  let fundBullish = 30 + (pseudoRandom(1) * 70);
  let whaleBullish = 30 + (pseudoRandom(2) * 70);
  let globalBullish = 30 + (pseudoRandom(3) * 70);

  if (isBist) {
    longScore = (techLong * 0.6) + (fundBullish * 0.4);
    shortScore = (techShort * 0.6) + ((100 - fundBullish) * 0.4);
  } else if (isCrypto) {
    longScore = (techLong * 0.7) + (whaleBullish * 0.3);
    shortScore = (techShort * 0.7) + ((100 - whaleBullish) * 0.3);
  } else {
    longScore = (techLong * 0.5) + (globalBullish * 0.5);
    shortScore = (techShort * 0.5) + ((100 - globalBullish) * 0.5);
  }

  return {
    longScore: Math.max(0, Math.min(98, longScore)),
    shortScore: Math.max(0, Math.min(98, shortScore)),
    techScore: longScore > shortScore ? techLong : techShort,
    fundScore: fundBullish,
    whaleScore: whaleBullish,
    globalScore: globalBullish,
    pd
  };
}, []);

const generateSmartPortfolio = useCallback(async (targetMarket?: string) => {
  if (portfolioLoading) return;
  const activeMarket = targetMarket || market;
  console.log(`[App] generateSmartPortfolio starting for ${activeMarket}`);
  setPortfolioError(null);

  // Prevent manual regeneration if portfolio already exists
  if (!targetMarket && portfolios && portfolios[activeMarket]) {
    console.log(`[App] Portfolio already exists for ${activeMarket}, switching screen.`);
    setScreen("portfolio");
    return;
  }

  setPortfolioLoading(true);
  
  // Give UI a chance to render the loading state
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // 1. Ensure we have prices
    const hasPrices = Object.keys(prices || {}).length > 10;
    if (!hasPrices) {
      console.log("[App] No prices found, fetching before portfolio generation...");
      await fetchPrices();
    }

    // Use another small delay to keep UI responsive
    await new Promise(resolve => setTimeout(resolve, 50));

    console.log(`[App] Processing portfolio generation for ${activeMarket}`);
    const budget = activeMarket === "CRYPTO" ? 5000 : 100000;
    const marketStocks = activeMarket === "BIST" ? BIST_STOCKS : (activeMarket === "CRYPTO" ? CRYPTO_COINS : COMMODITY_ITEMS);

    if (!marketStocks || marketStocks.length === 0) {
      throw new Error(`Market stocks for ${activeMarket} is empty or undefined`);
    }

    const items: any[] = [];

    // 2. Handle existing portfolio closure
    const currentPortfolio = (portfolios && portfolios[activeMarket]) ? portfolios[activeMarket] : null;
    let closedItems: any[] = [];
    if (currentPortfolio && currentPortfolio.items) {
      const activeItems = currentPortfolio.items.filter((i: any) => i.status === 'ACTIVE');
      if (activeItems.length > 0) {
        closedItems = activeItems.map((item: any) => {
          const currentPrice = (prices && prices[item.symbol]) || item.entryPrice;
          const isShort = item.side === 'short';
          const leverage = item.leverage || 1;
          const pnl = isShort 
            ? ((item.entryPrice - currentPrice) / item.entryPrice) * 100 * leverage
            : ((currentPrice - item.entryPrice) / item.entryPrice) * 100 * leverage;
          return { 
            ...item, 
            status: 'CLOSED', 
            pnl, 
            closedAt: new Date().toISOString(), 
            market: activeMarket 
          };
        });
      }
    }

    // 3. Score and select candidates
    const scoredCandidates = marketStocks.map(s => {
      try {
        const scores = calculateAssetScore(s, prices);
        const side = (scores.longScore >= scores.shortScore) ? 'long' : 'short';
        const score = side === 'long' ? scores.longScore : scores.shortScore;
        return { ...s, ...scores, side, score };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    const sectorCandidates = scoredCandidates
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 4);

    if (sectorCandidates.length === 0) {
      throw new Error("Piyasa verileri analiz edilemedi. Lütfen fiyatları yenileyip tekrar deneyin.");
    }

    const perAssetBudget = budget / sectorCandidates.length;

    sectorCandidates.forEach((c: any) => {
      const price = (prices && prices[c.symbol]) || c.price || 1;
      const isShort = c.side === 'short';
      const potential = c.score / 10;
      
      const precision = (c.symbol && c.symbol.includes("USDT")) ? 4 : 2;
      const tp = isShort ? +(price * (1 - potential / 100)).toFixed(precision) : +(price * (1 + potential / 100)).toFixed(precision);
      const sl = isShort ? +(price * 1.05).toFixed(precision) : +(price * 0.95).toFixed(precision);

      const isCrypto = activeMarket === "CRYPTO";
      const leverage = isCrypto ? 20 : 1; 
      const unleveragedAmount = perAssetBudget;
      const totalPositionSize = unleveragedAmount * leverage;

      items.push({
        ...c,
        entryPrice: price,
        tp,
        sl,
        amount: unleveragedAmount,
        totalPositionSize,
        leverage,
        quantity: totalPositionSize / price,
        pnl: 0,
        status: 'ACTIVE'
      });
    });

    // 4. Finalize portfolio
    const now = new Date();
    const schedule = [0, 3, 6, 10, 14, 17, 20];
    const currentHour = now.getHours();
    let nextHour = schedule.find(h => h > currentHour);
    if (nextHour === undefined) nextHour = 0;
    
    const nextUpdate = new Date();
    if (nextHour === 0) nextUpdate.setDate(nextUpdate.getDate() + 1);
    nextUpdate.setHours(nextHour, 0, 0, 0);

    const newPortfolio = {
      items,
      totalBudget: budget,
      lastUpdated: now.toLocaleTimeString("tr-TR"),
      nextUpdate: nextUpdate.toLocaleTimeString("tr-TR"),
      nextUpdateTimestamp: nextUpdate.getTime(),
      timestamp: now.getTime(),
      market: activeMarket
    };

    const nowMs = now.getTime();
    const mondayStart = new Date("2026-04-13T10:00:00+03:00").getTime();
    const isStarted = nowMs >= mondayStart;

    // Batch state updates and transition screen
    if (closedItems.length > 0) {
      setTradeHistory(prev => [...closedItems, ...(Array.isArray(prev) ? prev : [])].slice(0, 200));
    }
    setPortfolios(prev => ({ ...(prev || {}), [activeMarket]: newPortfolio }));
    setPortfolioStats(prev => ({
      ...(prev || {}),
      [activeMarket]: {
        daily: isStarted ? (Math.random() * 2.5) : 0,
        weekly: isStarted ? (Math.random() * 8.2) : 0,
        monthly: isStarted ? (Math.random() * 15.4) : 0
      }
    }));

    setPortfolioLoading(false);
    setScreen("portfolio");
    console.log(`[App] Portfolio generated successfully for ${activeMarket}`);
  } catch (err: any) {
    console.error("[App] Error during portfolio generation:", err);
    setPortfolioError(err.message || "Bilinmeyen bir hata oluştu.");
    setPortfolioLoading(false);
  }
}, [prices, calculateAssetScore, market, fetchPrices, portfolios, portfolioLoading]);

// Auto-generate portfolio if empty when visiting portfolio screen
useEffect(() => {
  if (screen === "portfolio" && (!portfolios || !portfolios[market]) && !portfolioLoading) {
    console.log(`[App] Auto-generating ${market} portfolio as it is empty.`);
    generateSmartPortfolio(market);
  }
}, [screen, market, portfolios, portfolioLoading, generateSmartPortfolio]);

// Monitor portfolio targets
useEffect(() => {
  const checkSchedule = () => {
    const now = Date.now();
    Object.keys(portfolios).forEach(m => {
      const p = portfolios[m];
      if (p && p.nextUpdateTimestamp && now >= p.nextUpdateTimestamp) {
        console.log(`[App] Scheduled update reached for ${m}. Re-generating portfolio...`);
        generateSmartPortfolio(m);
      }
    });
  };
  const interval = setInterval(checkSchedule, 60000); // Check every minute
  return () => clearInterval(interval);
}, [portfolios, generateSmartPortfolio]);

useEffect(() => {
  let changed = false;
  const newPortfolios = { ...portfolios };
  const newlyClosed: any[] = [];

  Object.keys(newPortfolios).forEach(m => {
    const portfolio = newPortfolios[m];
    if (!portfolio || !portfolio.items) return;

    const updatedItems = portfolio.items.map((item: any) => {
      if (item.status !== 'ACTIVE') return item;

      const currentPrice = prices[item.symbol];
      if (!currentPrice) return item;

      const isShort = item.side === 'short';
      let newStatus = 'ACTIVE';
      const leverage = item.leverage || 1;
      let pnl = isShort 
        ? ((item.entryPrice - currentPrice) / item.entryPrice) * 100 * leverage
        : ((currentPrice - item.entryPrice) / item.entryPrice) * 100 * leverage;

      if (isShort) {
        if (currentPrice <= item.tp) newStatus = 'TP';
        else if (currentPrice >= item.sl) newStatus = 'SL';
      } else {
        if (currentPrice >= item.tp) newStatus = 'TP';
        else if (currentPrice <= item.sl) newStatus = 'SL';
      }

      if (newStatus !== 'ACTIVE') {
        changed = true;
        const closedItem = { ...item, status: newStatus, pnl, closedAt: new Date().toISOString(), market: m };
        newlyClosed.push(closedItem);
        return closedItem;
      } else if (Math.abs(pnl - item.pnl) > 0.01) {
        changed = true;
        return { ...item, pnl };
      }
      return item;
    });

    if (changed) {
      newPortfolios[m] = { ...portfolio, items: updatedItems };
    }
  });

  if (changed) {
    setPortfolios(newPortfolios);
    if (newlyClosed.length > 0) {
      setTradeHistory(prev => [...newlyClosed, ...(Array.isArray(prev) ? prev : [])].slice(0, 200));
    }
  }
}, [prices, portfolios]);

// Background candidate refresher
useEffect(() => {
  const markets: ("BIST" | "CRYPTO" | "EMTİA")[] = ["BIST", "CRYPTO", "EMTİA"];
  
  markets.forEach(m => {
    if (!scanned[m]) return;
    
    const marketStocks = m === "BIST" ? BIST_STOCKS : (m === "CRYPTO" ? CRYPTO_COINS : COMMODITY_ITEMS);
    
    const found = marketStocks.flatMap(s => {
      const liveChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
      if (!Number.isFinite(liveChange)) return [];
      
      const scores = calculateAssetScore(s, prices);
      const side = scores.longScore >= scores.shortScore ? 'long' : 'short';
      const score = side === 'long' ? scores.longScore : scores.shortScore;
      
      if (score < 65) return [];

      const seed = s.symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const pseudoRandom = (offset: number) => {
        let x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
      };

      let whale = { action: "YOK", amount: "" };
      const isCrypto = s.symbol.includes("USDT");
      if (scores.longScore >= 70 && Math.random() > 0.3) {
        whale = { action: "ALIM", amount: isCrypto ? `${(Math.random() * 5 + 1).toFixed(1)}M$` : `${(Math.random() * 50 + 10).toFixed(0)}M ₺` };
      } else if (scores.shortScore >= 70 && Math.random() > 0.3) {
        whale = { action: "SATIM", amount: isCrypto ? `${(Math.random() * 5 + 1).toFixed(1)}M$` : `${(Math.random() * 50 + 10).toFixed(0)}M ₺` };
      }

      return [{ 
        ...s, 
        dynamicPotential: score, 
        side, 
        whale,
        ...scores
      }];
    }).sort((a, b) => b.dynamicPotential - a.dynamicPotential);

    setCandidates(prev => {
      if (safeJsonStringify(prev[m]) === safeJsonStringify(found)) return prev;
      return { ...prev, [m]: found };
    });

    if (m === "BIST") {
      const ceiling = marketStocks.map(s => {
        let liveChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
        if (!Number.isFinite(liveChange)) liveChange = 0;
        const pd = PATTERN_DATA[s.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
        let ceilingScore = (liveChange * 8) + (pd.patternScore / 5);
        if (liveChange > 9.8) ceilingScore = 0;
        else ceilingScore = Math.min(99, ceilingScore);
        return { ...s, ceilingScore };
      }).filter(s => s.ceilingScore >= 45).sort((a, b) => b.ceilingScore - a.ceilingScore);
      
      setCeilingCandidates(prev => {
        if (safeJsonStringify(prev[m]) === safeJsonStringify(ceiling)) return prev;
        return { ...prev, [m]: ceiling };
      });
    }
  });
}, [prices, scanned, calculateAssetScore]);

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
        scanning={scanning[market]} scanProgress={scanProgress[market]} scanned={scanned[market]} setScanned={(val: boolean) => setScanned(prev => ({ ...prev, [market]: val }))}
        candidates={candidates[market]} setCandidates={(val: any[]) => setCandidates(prev => ({ ...prev, [market]: val }))} prices={prices} lastUpdated={lastUpdated}
        onScan={startScan}
        onViewCandidates={() => setScreen("candidates")}
        onViewScalp={() => setScreen("scalp")}
        onViewCeiling={() => setScreen("ceiling")}
        onViewCorrection={() => setScreen("correction")}
        onViewPortfolio={() => setScreen("portfolio")}
        onGeneratePortfolio={generateSmartPortfolio}
        portfolio={portfolios?.[market]}
        portfolioLoading={portfolioLoading}
        onRefresh={handleRefresh}
        loading={loading}
        fetchError={fetchError}
        stocks={stocks}
        market={market} setMarket={setMarket}
      />}
      {screen === "portfolio" && (
        <PortfolioScreen 
          portfolio={portfolios?.[market]} 
          prices={prices} 
          loading={portfolioLoading}
          error={portfolioError}
          stats={portfolioStats?.[market]}
          history={tradeHistory}
          onGenerate={generateSmartPortfolio}
          onRefresh={handleRefresh}
          onBack={() => setScreen("scanner")}
          onSelect={openDetail}
          market={market}
        />
      )}
      {screen === "candidates" && <CandidatesScreen
        candidates={candidates[market]} prices={prices} lastUpdated={lastUpdated}
        onBack={() => setScreen("scanner")}
        onSelect={openDetail}
        market={market}
      />}
      {screen === "scalp" && <ScalpScreen
        candidates={candidates[market]} prices={prices} lastUpdated={lastUpdated}
        onBack={() => setScreen("scanner")}
        onSelect={(s: any) => { setTimeframe("1S"); openDetail(s); }}
        market={market}
      />}
      {screen === "correction" && <CorrectionScreen
        stocks={stocks} prices={prices} lastUpdated={lastUpdated}
        onBack={() => setScreen("scanner")}
        onSelect={openDetail}
        market={market}
      />}
      {screen === "detail" && selectedStock && <DetailScreen
        stock={selectedStock} prices={prices}
        patternData={PATTERN_DATA[selectedStock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 }}
        aiAnalysis={aiAnalysis} aiLoading={aiLoading}
        onFetchAi={() => fetchAiAnalysis(selectedStock)}
        kapNews={news.length > 0 ? news : kapNews} tab={tab} setTab={setTab}
        timeframe={timeframe} setTimeframe={setTimeframe}
        onBack={() => setScreen((ceilingCandidates[market] || []).some((c: any) => c.symbol === selectedStock.symbol) ? "ceiling" : "candidates")}
      />}
      {screen === "ceiling" && <CeilingScreen
        candidates={ceilingCandidates[market] || []} prices={prices} lastUpdated={lastUpdated}
        onBack={() => setScreen("scanner")}
        onSelect={openDetail}
      />}
    </div>

    <BottomNav screen={screen} setScreen={setScreen} candidates={candidates[market] || []} market={market} />

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
        <pre>{safeJsonStringify(Object.fromEntries(Object.entries(prices).slice(0, 10)))}</pre>
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

function PortfolioScreen({ portfolio, prices, loading, stats, history, onGenerate, onRefresh, onBack, onSelect, market, error }: any) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const budgetText = market === "CRYPTO" ? "5.000 USDT" : "100.000 TL";
  const safePrices = prices || {};

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d1117", padding: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", border: "4px solid #bf5af2", borderTopColor: "transparent", animation: "spin 1s linear infinite", marginBottom: 20 }} />
        <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>AI {market} Portföyü Hazırlanıyor...</div>
        <div style={{ color: "#8b949e", fontSize: 14, marginTop: 8, textAlign: "center" }}>{market} piyasası taranıyor, {budgetText} için en uygun dağılım hesaplanıyor.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d1117", padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
        <div style={{ color: "#ff453a", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Bir Hata Oluştu</div>
        <div style={{ color: "#8b949e", fontSize: 14, textAlign: "center", marginBottom: 24 }}>{error}</div>
        <button onClick={() => onGenerate(market)} style={{ background: "#bf5af2", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>TEKRAR DENE</button>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#8b949e", marginTop: 16, fontWeight: 700, cursor: "pointer" }}>Geri Dön</button>
      </div>
    );
  }

  if (!portfolio || !portfolio.items) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d1117", padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>💼</div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Henüz {market} Portföyü Yok</div>
        <div style={{ color: "#8b949e", fontSize: 14, textAlign: "center", marginBottom: 24 }}>AI algoritmalarımızla {budgetText}'lik {market} sepetinizi hemen oluşturun.</div>
        <button onClick={() => onGenerate(market)} style={{ background: "#bf5af2", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>PORTFÖY OLUŞTUR</button>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#8b949e", marginTop: 16, fontWeight: 700, cursor: "pointer" }}>Geri Dön</button>
      </div>
    );
  }

  const items = portfolio.items || [];
  const totalPnl = items.reduce((acc: number, item: any) => acc + (item.amount * (item.pnl || 0) / 100), 0);
  const totalPnlPercent = portfolio.totalBudget ? (totalPnl / portfolio.totalBudget) * 100 : 0;
  const isCrypto = market === "CRYPTO";
  const currency = isCrypto ? "USDT" : "₺";
  const safeStats = stats || { daily: 0, weekly: 0, monthly: 0 };

  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ padding: "16px 20px 24px", borderBottom: "1px solid #1a1f2e", background: "linear-gradient(180deg, rgba(191,90,242,0.1) 0%, transparent 100%)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#bf5af2", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 16 }}>← Geri Dön</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ color: "#8b949e", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{market} PORTFÖY DEĞERİ</div>
            <div style={{ color: "#fff", fontSize: 32, fontWeight: 900 }}>{(portfolio.totalBudget + totalPnl).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <div style={{ color: totalPnl >= 0 ? "#30d158" : "#ff453a", fontSize: 16, fontWeight: 800 }}>
                {totalPnl >= 0 ? "+" : ""}{totalPnl.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency} ({totalPnlPercent.toFixed(2)}%)
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", color: "#8b949e", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>ANLIK</div>
            </div>
          </div>
          <button onClick={() => { console.log("[Portfolio] Yenile clicked"); onRefresh(); }} style={{ background: "rgba(191,90,242,0.1)", border: "1px solid rgba(191,90,242,0.3)", color: "#bf5af2", padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>YENİLE</button>
        </div>
        
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>SON GÜNCELLEME</div>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{portfolio.lastUpdated}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>SIRADAKİ DENGELEME</div>
            <div style={{ color: "#bf5af2", fontSize: 12, fontWeight: 800 }}>{portfolio.nextUpdate}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ background: "#161b22", borderRadius: 16, padding: "12px", border: "1px solid #30363d", textAlign: "center" }}>
            <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>GÜNLÜK</div>
            <div style={{ color: safeStats.daily >= 0 ? "#30d158" : "#ff453a", fontSize: 14, fontWeight: 800 }}>%{safeStats.daily.toFixed(2)}</div>
          </div>
          <div style={{ background: "#161b22", borderRadius: 16, padding: "12px", border: "1px solid #30363d", textAlign: "center" }}>
            <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>HAFTALIK</div>
            <div style={{ color: safeStats.weekly >= 0 ? "#30d158" : "#ff453a", fontSize: 14, fontWeight: 800 }}>%{safeStats.weekly.toFixed(2)}</div>
          </div>
          <div style={{ background: "#161b22", borderRadius: 16, padding: "12px", border: "1px solid #30363d", textAlign: "center" }}>
            <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>AYLIK</div>
            <div style={{ color: safeStats.monthly >= 0 ? "#30d158" : "#ff453a", fontSize: 14, fontWeight: 800 }}>%{safeStats.monthly.toFixed(2)}</div>
          </div>
        </div>
        {safeStats.daily === 0 && (
          <div style={{ marginTop: 12, background: "rgba(191,90,242,0.05)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(191,90,242,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 14 }}>ℹ️</div>
            <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 600, lineHeight: 1.4 }}>
              Portföy istatistikleri 13 Nisan Pazartesi 10:00 itibariyle birikmeye başlayacaktır.
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Aktif {market} Pozisyonları</div>
        {items.map((item: any) => {
          const isShort = item.side === 'short';
          const sideColor = isShort ? "#ff453a" : "#00d4aa";
          const pnl = item.pnl || 0;
          const isClosed = item.status !== 'ACTIVE';
          const currentPrice = safePrices[item.symbol] || item.entryPrice;
          
          if (isClosed) return null; // Only show active positions in this section
          
          return (
            <div key={item.symbol} style={{ background: "#21262d", borderRadius: 20, padding: "16px", border: isClosed ? `1px solid ${item.status === 'TP' ? '#30d158' : '#ff453a'}88` : "1px solid #30363d", position: "relative", overflow: "hidden", opacity: isClosed ? 0.8 : 1 }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: isClosed ? (item.status === 'TP' ? '#30d158' : '#ff453a') : sideColor }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{item.symbol}</div>
                    <div style={{ background: isShort ? "rgba(255,69,58,0.15)" : "rgba(0,212,170,0.15)", color: sideColor, fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>{isShort ? "SHORT" : "LONG"}</div>
                    {item.leverage > 1 && (
                      <div style={{ background: "rgba(191,90,242,0.15)", color: "#bf5af2", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>{item.leverage}x</div>
                    )}
                    {isClosed && (
                      <div style={{ background: item.status === 'TP' ? "rgba(48,209,88,0.2)" : "rgba(255,69,58,0.2)", color: item.status === 'TP' ? "#30d158" : "#ff453a", fontSize: 9, fontWeight: 900, padding: "2px 8px", borderRadius: 4, border: "1px solid" }}>{item.status} KAPANDI</div>
                    )}
                  </div>
                  <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 600 }}>{item.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: pnl >= 0 ? "#30d158" : "#ff453a", fontSize: 16, fontWeight: 800 }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%</div>
                  <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 700 }}>P&L</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "8px" }}>
                  <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700 }}>GİRİŞ</div>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{item.entryPrice.toLocaleString("tr-TR")}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "8px" }}>
                  <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700 }}>GÜNCEL</div>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{currentPrice.toLocaleString("tr-TR")}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "8px" }}>
                  <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700 }}>{item.leverage > 1 ? "MARJİN" : "MİKTAR"}</div>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{item.amount.toLocaleString("tr-TR")} {currency}</div>
                </div>
              </div>

              {item.leverage > 1 && (
                <div style={{ background: "rgba(191,90,242,0.05)", borderRadius: 12, padding: "10px", marginBottom: 12, border: "1px solid rgba(191,90,242,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 700 }}>POZİSYON BÜYÜKLÜĞÜ</div>
                    <div style={{ color: "#bf5af2", fontSize: 13, fontWeight: 800 }}>{(item.totalPositionSize || (item.amount * item.leverage)).toLocaleString("tr-TR")} {currency}</div>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: item.status === 'TP' ? "rgba(48,209,88,0.2)" : "rgba(48,209,88,0.05)", borderRadius: 12, padding: "8px" }}>
                  <div style={{ color: "#30d158", fontSize: 9, fontWeight: 700 }}>HEDEF (TP)</div>
                  <div style={{ color: "#30d158", fontSize: 12, fontWeight: 800 }}>{item.tp.toLocaleString("tr-TR")}</div>
                </div>
                <div style={{ background: item.status === 'SL' ? "rgba(255,69,58,0.2)" : "rgba(255,69,58,0.05)", borderRadius: 12, padding: "8px" }}>
                  <div style={{ color: "#ff453a", fontSize: 9, fontWeight: 700 }}>STOP (SL)</div>
                  <div style={{ color: "#ff453a", fontSize: 12, fontWeight: 800 }}>{item.sl.toLocaleString("tr-TR")}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#8b949e", fontSize: 8, fontWeight: 700, marginBottom: 2 }}>TEKNİK</div>
                  <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 800 }}>%{(item.techScore || 0).toFixed(0)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#8b949e", fontSize: 8, fontWeight: 700, marginBottom: 2 }}>TEMEL</div>
                  <div style={{ color: "#00b8ff", fontSize: 11, fontWeight: 800 }}>%{(item.fundScore || 0).toFixed(0)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#8b949e", fontSize: 8, fontWeight: 700, marginBottom: 2 }}>BALİNA</div>
                  <div style={{ color: "#bf5af2", fontSize: 11, fontWeight: 800 }}>%{(item.whaleScore || 0).toFixed(0)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#8b949e", fontSize: 8, fontWeight: 700, marginBottom: 2 }}>GLOBAL</div>
                  <div style={{ color: "#ff9f0a", fontSize: 11, fontWeight: 800 }}>%{(item.globalScore || 0).toFixed(0)}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button onClick={() => onSelect(item)} style={{ background: "none", border: "none", color: "#bf5af2", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>DETAYLAR →</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "0 20px 20px", textAlign: "center" }}>
        <div style={{ color: "#4a5568", fontSize: 10, marginTop: 8 }}>
          * Portföy bileşimi sadece belirlenen saatlerde AI tarafından güncellenir.
        </div>
      </div>

      <TradeHistoryTable history={history} market={market} />
    </div>
  );
}

function TradeHistoryTable({ history, market }: any) {
  const filtered = (history || []).filter((h: any) => {
    const isSameMarket = h.market === market;
    const isRecent = (new Date().getTime() - new Date(h.closedAt).getTime()) < (1000 * 60 * 60 * 24 * 7);
    return isSameMarket && isRecent;
  });

  if (filtered.length === 0) return null;

  return (
    <div style={{ padding: "0 20px 40px" }}>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 12 }}>İşlem Geçmişi (Son 7 Gün)</div>
      <div style={{ background: "#161b22", borderRadius: 20, border: "1px solid #30363d", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead style={{ background: "#21262d" }}>
            <tr>
              <th style={{ textAlign: "left", padding: "12px", color: "#8b949e" }}>VARLIK</th>
              <th style={{ textAlign: "center", padding: "12px", color: "#8b949e" }}>YÖN</th>
              <th style={{ textAlign: "right", padding: "12px", color: "#8b949e" }}>P&L</th>
              <th style={{ textAlign: "right", padding: "12px", color: "#8b949e" }}>DURUM</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item: any, idx: number) => (
              <tr key={idx} style={{ borderTop: "1px solid #30363d" }}>
                <td style={{ padding: "12px" }}>
                  <div style={{ color: "#fff", fontWeight: 700 }}>{item.symbol}</div>
                  <div style={{ color: "#4a5568", fontSize: 9 }}>{new Date(item.closedAt).toLocaleDateString("tr-TR")}</div>
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span style={{ color: item.side === 'short' ? "#ff453a" : "#00d4aa", fontWeight: 800 }}>{item.side.toUpperCase()}</span>
                </td>
                <td style={{ padding: "12px", textAlign: "right", color: item.pnl >= 0 ? "#30d158" : "#ff453a", fontWeight: 800 }}>
                  {item.pnl >= 0 ? "+" : ""}{item.pnl.toFixed(2)}%
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <span style={{ 
                    background: item.status === 'TP' ? "rgba(48,209,88,0.1)" : (item.status === 'SL' ? "rgba(255,69,58,0.1)" : "rgba(191,90,242,0.1)"), 
                    color: item.status === 'TP' ? "#30d158" : (item.status === 'SL' ? "#ff453a" : "#bf5af2"), 
                    padding: "2px 6px", 
                    borderRadius: 4, 
                    fontWeight: 900, 
                    fontSize: 9 
                  }}>
                    {item.status === 'CLOSED' ? 'KAPANDI' : item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScannerScreen({ scanning, scanProgress, scanned, setScanned, candidates, setCandidates, prices, lastUpdated, onScan, onViewCandidates, onViewScalp, onViewCeiling, onViewCorrection, onViewPortfolio, onGeneratePortfolio, portfolio, portfolioLoading, onRefresh, loading, fetchError, stocks, market, setMarket }: any) {
  const currentHour = parseInt(new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }).format(new Date()), 10);
  const isAfter18 = currentHour >= 18 || currentHour < 6; // 18:00 to 06:00

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
        <button key={key} onClick={() => { setMarket(key as any); }} style={{
          flex: 1, padding: "8px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
          background: market === key ? "#00d4aa" : "transparent", color: market === key ? "#000" : "#8b949e",
          transition: "all 0.2s"
        }}>{label}</button>
      ))}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 14 }}>
      {[
        { sym: "XU100", label: "BIST 100", val: (prices["XU100"] && prices["XU100"] > 0) ? prices["XU100"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (loading ? "..." : "---"), chg: (prices["XU100_change"] !== undefined) ? `${prices["XU100_change"] > 0 ? "+" : ""}${prices["XU100_change"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "", up: (prices["XU100_change"] || 0) >= 0 },
        { sym: "BTC-USDT", label: "BTC/USDT", val: (prices["BTC-USDT"] && prices["BTC-USDT"] > 0) ? prices["BTC-USDT"].toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDT" : (loading ? "..." : "---"), chg: (prices["BTC-USDT_change"] !== undefined) ? `${prices["BTC-USDT_change"] > 0 ? "+" : ""}${prices["BTC-USDT_change"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "", up: (prices["BTC-USDT_change"] || 0) >= 0 },
        { sym: "USDT-TRY", label: "USDT/TRY", val: (prices["USDT-TRY"] && prices["USDT-TRY"] > 0) ? prices["USDT-TRY"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + " ₺" : (loading ? "..." : "---"), chg: (prices["USDT-TRY_change"] !== undefined) ? `${prices["USDT-TRY_change"] > 0 ? "+" : ""}${prices["USDT-TRY_change"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "", up: (prices["USDT-TRY_change"] || 0) >= 0 },
        { sym: "GAG=X", label: "GÜMÜŞ/TL", val: (prices["GAG=X"] && prices["GAG=X"] > 0) ? prices["GAG=X"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺" : (loading ? "..." : "---"), chg: (prices["GAG=X_change"] !== undefined) ? `${prices["GAG=X_change"] > 0 ? "+" : ""}${prices["GAG=X_change"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "", up: (prices["GAG=X_change"] || 0) >= 0 },
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ color: "#4a5568", fontSize: 8, fontWeight: 700 }}>GÜNLÜK</div>
              {prices[`${m.sym}_lastUpdated`] && (
                <div style={{ color: "#4a5568", fontSize: 7 }}>
                  {prices[`${m.sym}_lastUpdated`].includes('T') 
                    ? prices[`${m.sym}_lastUpdated`].split('T')[1].split('.')[0] 
                    : prices[`${m.sym}_lastUpdated`]}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>

    <div style={{ padding: "20px 20px 16px" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button 
          onClick={portfolio ? onViewPortfolio : onGeneratePortfolio}
          style={{ 
            flex: 1, 
            background: "linear-gradient(135deg, #bf5af2 0%, #af52de 100%)", 
            borderRadius: 16, 
            padding: "16px", 
            border: "none", 
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(191,90,242,0.3)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4
          }}
        >
          <div style={{ fontSize: 24 }}>{portfolioLoading ? "⏳" : "💼"}</div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{portfolioLoading ? "HAZIRLANIYOR..." : (portfolio ? `${market} PORTFÖYÜM` : `AI ${market} PORTFÖYÜ`)}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 600 }}>{market === "CRYPTO" ? "5.000 USDT" : "100.000 TL"} {market}</div>
        </button>

        <button 
          onClick={onViewScalp}
          style={{ 
            flex: 1, 
            background: "linear-gradient(135deg, #00d4aa 0%, #00b8ff 100%)", 
            borderRadius: 16, 
            padding: "16px", 
            border: "none", 
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,212,170,0.3)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4
          }}
        >
          <div style={{ fontSize: 24 }}>⚡</div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>SCALP TARAYICI</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 600 }}>ANLIK FIRSATLAR</div>
        </button>
      </div>

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
          onClick={onViewCorrection}
          style={{
            width: "100%", marginTop: 8, padding: "12px", borderRadius: 14,
            background: "rgba(191,90,242,0.15)", 
            color: "#bf5af2", 
            border: "1px solid rgba(191,90,242,0.4)",
            cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          🌙 Yarına Hazırlık (Düzeltmesi Bitenler)
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

function CorrectionScreen({ stocks, prices, lastUpdated, onBack, onSelect, market }: any) {
  // Filter for "Düzeltme Tamamlandı"
  const candidates = stocks.map((s: any) => {
    const pd = PATTERN_DATA[s.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
    return { ...s, pd };
  }).filter((s: any) => {
    // RSI between 35 and 55 (recovering), MACD > -0.5 (turning up), Pattern Score > 60
    return s.pd.rsi >= 35 && s.pd.rsi <= 55 && s.pd.macd > -0.5 && s.pd.patternScore >= 60;
  }).sort((a: any, b: any) => b.pd.patternScore - a.pd.patternScore);

  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ padding: "8px 20px 16px", borderBottom: "1px solid #1a1f2e", background: "linear-gradient(180deg, rgba(191,90,242,0.05) 0%, transparent 100%)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#bf5af2", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 10 }}>
          ← Geri
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Yarına Hazırlık</div>
              <div style={{ background: "#bf5af2", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>GÜNLÜK</div>
            </div>
            <div style={{ color: "#4a5568", fontSize: 13, marginTop: 2 }}>Düzeltmesi biten ve hareket beklenenler</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {market === "BIST" && <div style={{ color: "#4a5568", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>⏱ 15 Dk Gecikmeli</div>}
            {lastUpdated && <div style={{ color: "#4a5568", fontSize: 10 }}>{lastUpdated}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {candidates.length > 0 ? candidates.slice(0, 10).map((stock: any) => {
          const pd = stock.pd;
          let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
          if (!Number.isFinite(price)) price = 0;
          let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
          if (!Number.isFinite(currentChange)) currentChange = 0;
          const up = currentChange >= 0;
          const isCrypto = stock.symbol.includes("-USDT");
          const currency = isCrypto ? " USDT" : " ₺";
          const sideColor = "#bf5af2";

          return (
            <button
              key={`${stock.symbol}-correction`}
              onClick={() => onSelect(stock)}
              style={{ background: "#21262d", borderRadius: 20, padding: "16px", border: `1px solid ${sideColor}33`, cursor: "pointer", textAlign: "left", width: "100%", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: sideColor }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{stock.symbol}</div>
                    <div style={{ background: "rgba(191,90,242,0.15)", color: sideColor, fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 4 }}>DÜZELTME BİTTİ</div>
                  </div>
                  <div style={{ color: "#8b949e", fontSize: 11 }}>{stock.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{price.toFixed(stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2)))}{currency}</div>
                  <div style={{ color: up ? "#30d158" : "#ff453a", fontSize: 12, fontWeight: 700 }}>{up ? "+" : ""}{currentChange.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: "rgba(191,90,242,0.1)", color: "#bf5af2", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>RSI: {pd.rsi}</span>
                  <span style={{ background: "rgba(0,184,255,0.1)", color: "#00b8ff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{pd.pattern}</span>
                  {stock.whale && stock.whale.action !== "YOK" && (
                    <span style={{ background: stock.whale.action === "ALIM" ? "rgba(0,212,170,0.1)" : "rgba(255,69,58,0.1)", color: stock.whale.action === "ALIM" ? "#00d4aa" : "#ff453a", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                      🐋 {stock.whale.action}: {stock.whale.amount}
                    </span>
                  )}
                </div>
                <div style={{ color: sideColor, fontSize: 11, fontWeight: 800 }}>Analiz Et →</div>
              </div>
            </button>
          );
        }) : (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#8b949e" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🌙</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Şu an düzeltmesi tamamlanmış uygun aday bulunamadı.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScalpScreen({ candidates, prices, lastUpdated, onBack, onSelect, market }: any) {
  const [filterSide, setFilterSide] = useState<"all" | "long" | "short">("all");

  const filteredCandidates = candidates.filter((stock: any) => {
    if (filterSide === "long" && stock.side !== "long") return false;
    if (filterSide === "short" && stock.side !== "short") return false;
    return true;
  });

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
        
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={() => setFilterSide("all")} style={{ flex: 1, padding: "8px", borderRadius: 8, background: filterSide === "all" ? "rgba(255,255,255,0.1)" : "transparent", border: "1px solid rgba(255,255,255,0.1)", color: filterSide === "all" ? "#fff" : "#8b949e", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>TÜMÜ</button>
          <button onClick={() => setFilterSide("long")} style={{ flex: 1, padding: "8px", borderRadius: 8, background: filterSide === "long" ? "rgba(0,212,170,0.15)" : "transparent", border: "1px solid rgba(0,212,170,0.3)", color: filterSide === "long" ? "#00d4aa" : "#8b949e", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>LONG (AL)</button>
          <button onClick={() => setFilterSide("short")} style={{ flex: 1, padding: "8px", borderRadius: 8, background: filterSide === "short" ? "rgba(255,69,58,0.15)" : "transparent", border: "1px solid rgba(255,69,58,0.3)", color: filterSide === "short" ? "#ff453a" : "#8b949e", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>SHORT (SAT)</button>
        </div>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredCandidates.slice(0, 8).map((stock: any) => {
          const pd = PATTERN_DATA[stock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
          let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
          if (!Number.isFinite(price)) price = 0;
          let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
          if (!Number.isFinite(currentChange)) currentChange = 0;
          const up = currentChange >= 0;
          const isCrypto = stock.symbol.includes("-USDT");
          const isCommodity = stock.sector === "Emtia";
          const currency = isCrypto ? " USDT" : (isCommodity && !stock.name.includes("(TL)") ? " $" : " ₺");
          
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
                    <div style={{ background: isShort ? "rgba(255,69,58,0.15)" : "rgba(0,212,170,0.15)", color: sideColor, fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 4 }}>
                      {isCrypto ? (isShort ? "SELL" : "BUY") : (isShort ? "SAT" : "AL")}
                    </div>
                    {isCrypto && (
                      <div style={{ background: "rgba(191,90,242,0.15)", color: "#bf5af2", fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 4 }}>20x</div>
                    )}
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
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(191,90,242,0.1)", color: "#bf5af2", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>RSI: {Math.round(pd.rsi)}</span>
                  <span style={{ background: "rgba(0,184,255,0.1)", color: "#00b8ff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{pd.pattern}</span>
                  <span style={{ background: "rgba(255,214,10,0.1)", color: "#ffd60a", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>MA: {isShort ? stock.maSellCount : stock.maBuyCount}/12</span>
                  {stock.whale && stock.whale.action !== "YOK" && (
                    <span style={{ background: stock.whale.action === "ALIM" ? "rgba(0,212,170,0.1)" : "rgba(255,69,58,0.1)", color: stock.whale.action === "ALIM" ? "#00d4aa" : "#ff453a", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                      🐋 {stock.whale.amount}
                    </span>
                  )}
                </div>
                <div style={{ color: sideColor, fontSize: 11, fontWeight: 800 }}>Analiz Et →</div>
              </div>
              
              <div style={{ display: "flex", gap: 6, marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, color: "#8b949e" }}>
                  Teknik: <span style={{ color: "#fff", fontWeight: 700 }}>%{Math.round(stock.techScore || 0)}</span>
                </div>
                {(!isCrypto && !isCommodity) && (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, color: "#8b949e" }}>
                    Temel: <span style={{ color: "#fff", fontWeight: 700 }}>%{Math.round(stock.fundScore || 0)}</span>
                  </div>
                )}
                {isCrypto && (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, color: "#8b949e" }}>
                    Balina: <span style={{ color: "#fff", fontWeight: 700 }}>%{Math.round(stock.whaleScore || 0)}</span>
                  </div>
                )}
                {isCommodity && (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, color: "#8b949e" }}>
                    Gündem: <span style={{ color: "#fff", fontWeight: 700 }}>%{Math.round(stock.globalScore || 0)}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CandidatesScreen({ candidates, prices, lastUpdated, onBack, onSelect, market }: any) {
  const [filterSide, setFilterSide] = useState<"all" | "long" | "short">("all");

  const filteredCandidates = candidates.filter((stock: any) => {
    if ((stock.dynamicPotential || 0) < 65) return false;
    if (filterSide === "long" && stock.side !== "long") return false;
    if (filterSide === "short" && stock.side !== "short") return false;
    return true;
  });

  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ padding: "8px 20px 16px", borderBottom: "1px solid #1a1f2e" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#00d4aa", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 10 }}>
          ← Geri
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Adaylar</div>
            <div style={{ color: "#4a5568", fontSize: 13, marginTop: 2 }}>%50+ potansiyel • {filteredCandidates.length} hisse</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {market === "BIST" && <div style={{ color: "#4a5568", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>⏱ 15 Dk Gecikmeli</div>}
            {lastUpdated && <div style={{ color: "#4a5568", fontSize: 10 }}>Güncelleme: {lastUpdated}</div>}
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={() => setFilterSide("all")} style={{ flex: 1, padding: "8px", borderRadius: 8, background: filterSide === "all" ? "rgba(255,255,255,0.1)" : "transparent", border: "1px solid rgba(255,255,255,0.1)", color: filterSide === "all" ? "#fff" : "#8b949e", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>TÜMÜ</button>
          <button onClick={() => setFilterSide("long")} style={{ flex: 1, padding: "8px", borderRadius: 8, background: filterSide === "long" ? "rgba(0,212,170,0.15)" : "transparent", border: "1px solid rgba(0,212,170,0.3)", color: filterSide === "long" ? "#00d4aa" : "#8b949e", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>LONG (AL)</button>
          <button onClick={() => setFilterSide("short")} style={{ flex: 1, padding: "8px", borderRadius: 8, background: filterSide === "short" ? "rgba(255,69,58,0.15)" : "transparent", border: "1px solid rgba(255,69,58,0.3)", color: filterSide === "short" ? "#ff453a" : "#8b949e", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>SHORT (SAT)</button>
        </div>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: "rgba(0,212,170,0.05)", borderRadius: 16, padding: 16, border: "1px solid rgba(0,212,170,0.15)", marginBottom: 4 }}>
          <div style={{ color: "#00d4aa", fontSize: 13, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🎯</span> ADAY BELİRLEME STRATEJİSİ
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { l: "RSI", d: "Aşırı Satım / Alım" },
              { l: "MACD", d: "Kesişimler" },
              { l: "FIB", d: "Destek / Direnç" },
              { l: "GÜVEN", d: "%80+ Formasyon" }
            ].map(s => (
              <div key={s.l}>
                <div style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{s.l}</div>
                <div style={{ color: "#8b949e", fontSize: 10 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
        {filteredCandidates.map((stock: any, idx: number) => {
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
                  {isCrypto ? (isShort ? "SELL (SHORT)" : "BUY (LONG)") : (isShort ? "HEDEF DÜŞÜŞ" : "HEDEF KAZANÇ")} {potential.toFixed(1)}%
                </span>
                {isCrypto && (
                  <span style={{ background: "rgba(191,90,242,0.15)", color: "#bf5af2", fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 10, border: "1px solid rgba(191,90,242,0.3)" }}>
                    20x LEV
                  </span>
                )}
              </div>
              <div style={{ color: "#8b949e", fontSize: 13, fontWeight: 600 }}>{stock.name}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, color: "#8b949e" }}>
                  Teknik: <span style={{ color: "#fff", fontWeight: 700 }}>%{Math.round(stock.techScore || 0)}</span>
                </div>
                {(!isCrypto && !isCommodity) && (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, color: "#8b949e" }}>
                    Temel: <span style={{ color: "#fff", fontWeight: 700 }}>%{Math.round(stock.fundScore || 0)}</span>
                  </div>
                )}
                {isCrypto && (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, color: "#8b949e" }}>
                    Balina: <span style={{ color: "#fff", fontWeight: 700 }}>%{Math.round(stock.whaleScore || 0)}</span>
                  </div>
                )}
                {isCommodity && (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, color: "#8b949e" }}>
                    Gündem: <span style={{ color: "#fff", fontWeight: 700 }}>%{Math.round(stock.globalScore || 0)}</span>
                  </div>
                )}
              </div>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            <Pill label="RSI" val={pd.rsi} good={isShort ? pd.rsi > 60 : pd.rsi < 40} />
            <Pill label="MACD" val={pd.macd > 0 ? "▲" : "▼"} good={isShort ? pd.macd < 0 : pd.macd > 0} />
            <Pill label="FIB" val={pd.fibLevel} good />
            <Pill label="MA" val={`${isShort ? stock.maSellCount : stock.maBuyCount}/12`} good={isShort ? stock.maSellCount >= 10 : stock.maBuyCount >= 10} />
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
const isShort = stock.side === 'short';
const sideColor = isShort ? "#ff453a" : "#00d4aa";
const isCrypto = stock.symbol.includes("-USDT");
const isCommodity = stock.sector === "Emtia";
const currency = isCrypto ? " USDT" : (isCommodity && !stock.name.includes("(TL)") ? " $" : " ₺");
  const chartData = useMemo(() => generateCandleData(price), [stock.symbol, price]);
  
  const maScore = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const last = chartData[chartData.length - 1];
    let score = 0;
    if (last.price > last.sma20) score += 6;
    if (last.price > last.ema50) score += 6;
    // Add some variation based on trend
    const prev = chartData[chartData.length - 2];
    if (prev && last.price > prev.price) score = Math.min(12, score + 1);
    return isShort ? 12 - score : score;
  }, [chartData, isShort]);

const pricePrecision = stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2));

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
        { l: "MA", v: `${maScore}/12`, good: maScore >= 10 },
        { l: "SKOR", v: `${pd.patternScore}`, good: pd.patternScore > 70 },
        { l: "POT.", v: `+%${potential.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, good: true },
        ...(stock.whale && stock.whale.action !== "YOK" ? [{ l: "BALİNA", v: `${stock.whale.action} (${stock.whale.amount})`, good: stock.whale.action === "ALIM" }] : []),
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
      <div style={{ display: "flex", gap: 10, paddingLeft: 14, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 2, background: "#00d4aa" }} />
          <div style={{ color: "#8b949e", fontSize: 8, fontWeight: 700 }}>FİYAT</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 2, background: "#ff9f0a" }} />
          <div style={{ color: "#8b949e", fontSize: 8, fontWeight: 700 }}>SMA 20</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 2, background: "#5e5ce6" }} />
          <div style={{ color: "#8b949e", fontSize: 8, fontWeight: 700 }}>EMA 50</div>
        </div>
      </div>
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
          <Tooltip contentStyle={{ background: "#21262d", border: "1px solid #30363d", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#8b949e" }} itemStyle={{ color: "#00d4aa" }} formatter={(v: any) => [`${v.toFixed(2)} ${currency}`, ""]} labelFormatter={() => ""} />
          <ReferenceLine y={timeframe === "1S" ? scalpTp1 : tp1} stroke="#30d158" strokeDasharray="3 3" strokeWidth={1} label={{ value: timeframe === "1S" ? `Scalp TP: ${scalpTp1}` : `TP1: ${tp1}`, position: "right", fontSize: 9, fill: "#30d158" }} />
          <ReferenceLine y={timeframe === "1S" ? scalpSl : sl} stroke="#ff453a" strokeDasharray="3 3" strokeWidth={1} label={{ value: timeframe === "1S" ? `Scalp SL: ${scalpSl}` : `SL: ${sl}`, position: "right", fontSize: 9, fill: "#ff453a" }} />
          <Area type="monotone" dataKey="price" stroke="#00d4aa" strokeWidth={1.5} fill="url(#colorUp)" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="sma20" stroke="#ff9f0a" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="ema50" stroke="#5e5ce6" strokeWidth={1} dot={false} isAnimationActive={false} />
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

function BottomNav({ screen, setScreen, candidates = [], market }: any) {
const navItems = [
  { key: "scanner", icon: "🔍", label: "Tarayıcı" },
  { key: "scalp", icon: "⚡", label: "Scalp" },
  ...(market === "BIST" ? [{ key: "ceiling", icon: "🚀", label: "Tavan" }] : []),
  { key: "candidates", icon: "⭐", label: "Adaylar", badge: Array.isArray(candidates) ? candidates.length : 0 },
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
