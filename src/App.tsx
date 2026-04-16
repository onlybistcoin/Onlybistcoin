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
  ["GRASS-USDT", "Grass"], ["DRIFT-USDT", "Drift"], ["HYPE-USDT", "Hyperliquid"],
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
  ["ASTR-USDT", "Astar"], ["GLMR-USDT", "Moonbeam"], ["CFX-USDT", "Conflux"], ["STG-USDT", "Stargate Finance"],
  ["RDNT-USDT", "Radiant Capital"], ["MASK-USDT", "Mask Network"], ["LRC-USDT", "Loopring"],
  ["REI-USDT", "REI Network"], ["SYN-USDT", "Synapse"], ["GTC-USDT", "Gitcoin"],
  ["AKT-USDT", "Akash Network"], ["NOS-USDT", "Nosana"], ["NEIRO-USDT", "Neiro"], ["GOAT-USDT", "Goatseus Maximus"],
  ["MOODENG-USDT", "Moo Deng"], ["PNUT-USDT", "Peanut the Squirrel"], ["ACT-USDT", "AI Prophecy"], ["VIRTUAL-USDT", "Virtuals Protocol"],
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

const REALISTIC_BIST_PRICES: Record<string, number> = {
  "THYAO": 285.50, "GARAN": 105.20, "AKBNK": 55.15, "EREGL": 48.30, "KCHOL": 185.00, "SAHOL": 92.50, "BIMAS": 465.00, "TOASO": 245.00, "ARCLK": 158.00, "TUPRS": 165.50, "SISE": 48.70, "DOHOL": 14.40, "PETKM": 22.90, "FROTO": 1085.00, "ASELS": 61.20, "MGROS": 482.00, "PGSUS": 990.00, "TAVHL": 218.00, "YKBNK": 28.80, "EKGYO": 11.70, "VESTL": 72.50, "ODAS": 8.80, "SMRTG": 48.40, "CANTE": 17.20, "ISCTR": 12.90, "HALKB": 16.50, "VAKBN": 19.30, "TSKB": 9.80, "ALARK": 118.00, "ENKAI": 38.20, "TKFEN": 48.10, "GUBRF": 175.00, "HEKTS": 16.80, "SASA": 42.50, "KONTR": 245.00, "GESAN": 68.40, "YEOTK": 195.00, "ASTOR": 98.00, "EUPWR": 118.00, "CWENE": 295.00, "ALFAS": 98.00, "MIATK": 68.50, "REEDR": 32.40, "TABGD": 158.00, "TARKM": 490.00, "EBEBK": 68.50, "KAYSE": 32.40, "BIENY": 42.50, "SDTTR": 345.00, "ONCSM": 195.00, "SOKE": 22.50, "EYGYO": 22.50, "GOKNR": 28.50, "CVKMD": 445.00, "KOPOL": 68.50, "PASEU": 68.50, "KATMR": 3.80, "TMSN": 118.00, "OTKAR": 490.00, "TTRAK": 890.00, "DOAS": 295.00, "ASUZU": 245.00, "KMPUR": 68.50, "SAYAS": 98.00, "HUNER": 8.80, "ZEDUR": 88.50, "PRKME": 22.50, "ULKER": 128.00, "AEFES": 175.00, "CCOLA": 690.00, "TATGD": 42.50, "SOKM": 58.50, "TKNSA": 38.50, "MAVI": 158.00, "VAKKO": 88.50, "YATAS": 38.50, "BRISA": 128.00, "GOODY": 22.50, "AKSA": 98.00, "KORDS": 88.50, "BAGFS": 32.50, "EGEEN": 12800.00, "BFREN": 10800.00, "FMIZP": 345.00, "PARSN": 128.00, "JANTS": 245.00, "ALCAR": 1280.00, "ALGYO": 48.50, "TRGYO": 38.50, "OZKGY": 12.80, "MSGYO": 16.50, "HLGYO": 8.80, "VKGYO": 8.80, "SNGYO": 3.80, "KLGYO": 3.80, "AKFGY": 8.80, "ISGYO": 16.50, "KGYO": 8.80, "IDGYO": 8.80, "PAGYO": 38.50, "DZGYO": 8.80, "SRVGY": 245.00, "RYGYO": 32.50, "RYSAS": 42.50, "GLYHO": 12.80, "NETAS": 88.50, "ALCTL": 128.00, "ARENA": 42.50, "INDES": 8.80, "DESPC": 22.50, "DGATE": 32.50, "LINK": 445.00, "LOGO": 88.50, "KFEIN": 128.00, "ARDYZ": 48.50, "ESCOM": 38.50, "FONET": 32.50, "KRVGD": 22.50, "AVOD": 3.80, "OYYAT": 38.50, "ISMEN": 32.50, "GSDHO": 8.80, "INFO": 12.80, "OSMEN": 22.50, "GLBMD": 32.50, "GEDIK": 16.50, "TUKAS": 8.80, "KNFRT": 16.50, "FRIGO": 8.80, "ELITE": 48.50, "ULUUN": 32.50, "VANGD": 16.50, "MERKO": 8.80, "PETUN": 88.50, "PNSUT": 88.50, "SELVA": 16.50, "BRKSN": 22.50, "PRZMA": 38.50, "IHLAS": 1.40, "IHEVA": 3.80, "IHYAY": 3.80, "IHGZT": 3.80, "METRO": 3.80, "AVGYO": 8.80, "ATLAS": 8.80, "ETYAT": 8.80, "EUYO": 8.80, "EUKYO": 8.80, "MZHLD": 16.50, "EPLAS": 12.80, "DERIM": 22.50, "DESA": 22.50, "HATEK": 16.50, "MNDRS": 12.80, "ARSAN": 16.50, "LUKSK": 88.50, "KRTEK": 32.50, "SKTAS": 8.80, "SNPAM": 128.00, "SONME": 88.50, "DAGI": 12.80, "KRONT": 32.50, "EDATA": 22.50, "VBTYZ": 38.50, "PKART": 128.00, "SMART": 48.50, "HTTBT": 88.50, "OBASL": 38.50, "ALVES": 38.50, "ARTMS": 48.50, "MOGAN": 16.50, "ODINE": 68.50, "ENTRA": 16.50, "HOROZ": 88.50, "ALTNY": 108.00, "KOTON": 22.50, "LILA": 32.50, "HRKET": 68.50, "YIGIT": 38.50, "DCTTR": 22.50, "BAHEV": 48.50, "ONUR": 88.50, "OZATD": 68.50, "CEMZY": 16.50, "KARYE": 32.50, "GIPTA": 32.50, "TCELL": 88.50, "TTKOM": 38.50, "ENJSA": 58.50, "KRDMD": 28.50, "ECILC": 48.50, "DEVA": 88.50, "SELEC": 58.50, "MPARK": 245.00, "LKMNH": 68.50, "TRILC": 16.50, "GENIL": 68.50, "ANGEN": 16.50, "MEDTR": 38.50, "RTALB": 16.50, "ZOREN": 5.80, "AKENR": 5.80, "AKSEN": 38.50, "AYDEM": 22.50, "GWIND": 28.50, "NATEN": 58.50, "ESEN": 22.50, "MAGEN": 16.50, "BRSAN": 690.00, "BRYAT": 2950.00, "CEMTS": 12.80, "IZMDC": 8.80, "KCAER": 48.50, "BUCIM": 8.80, "AKCNS": 158.00, "CIMSA": 32.50, "NUHCM": 345.00, "OYAKC": 68.50, "AFYON": 12.80, "BTCIM": 158.00, "BSOKE": 22.50, "GOLTS": 445.00, "KONYA": 10800.00, "ADEL": 590.00, "DOCO": 3450.00, "CLEBI": 1280.00, "SUWEN": 22.50, "BEYAZ": 22.50, "AYGAZ": 165.00, "TRCAS": 22.50, "YKSLN": 16.50, "TIRE": 22.50, "KARTN": 128.00, "ALKA": 32.50, "ALKIM": 38.50, "EGGUB": 58.50, "TEZOL": 22.50, "PRKAB": 38.50, "ARZUM": 48.50, "VESBE": 21.50, "KLSER": 68.50, "QUAGR": 3.80, "ISFIN": 12.80, "QNBFL": 245.00, "VAKFN": 8.80, "GARFA": 128.00, "LIDFA": 8.80, "CRDFA": 8.80
};

const UPDATE_HOURS: Record<string, number[]> = {
  "BIST": [10, 12, 14, 16, 18],
  "CRYPTO": [3, 7, 11, 15, 19, 23],
  "EMTİA": [1, 5, 9, 13, 17, 21]
};

function getNextUpdateDisplay(market: string) {
  const now = new Date();
  const turkeyTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + (3 * 60 * 60 * 1000));
  const currentHour = turkeyTime.getHours();
  const hours = UPDATE_HOURS[market] || [23];
  let nextHour = hours.find(h => h > currentHour);
  if (nextHour !== undefined) {
    return `${nextHour.toString().padStart(2, '0')}:00`;
  } else {
    return `${hours[0].toString().padStart(2, '0')}:00`;
  }
}

const PATTERN_DATA: Record<string, any> = {
"BEAM-USDT": { rsi: 31, macd: 1.25, fibLevel: "0.786", patternScore: 98, pattern: "Düşen Kama Kırılımı ✦✦", potential: 98 },
"SOL-USDT": { rsi: 34, macd: 1.15, fibLevel: "0.618", patternScore: 92, pattern: "Yükselen Kanal Kırılımı ✦", potential: 92 },
"AVAX-USDT": { rsi: 29, macd: 1.45, fibLevel: "0.786", patternScore: 95, pattern: "Çanak Tamamlama ✦✦", potential: 95 },
"NEAR-USDT": { rsi: 32, macd: 1.35, fibLevel: "0.786", patternScore: 94, pattern: "Bayrak Formasyonu ✦✦", potential: 94 },
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
ASELS: { rsi: 62, macd: 1.25, fibLevel: "0.786", patternScore: 96, pattern: "Düşen Kama + Hacim ✦✦", potential: 83.4 },
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
"BNB-USDT": { rsi: 78, macd: -0.8, fibLevel: "0.786", patternScore: 85, pattern: "Aşırı Alım + Negatif Uyumsuzluk (Satış)", potential: 15 },
"XRP-USDT": { rsi: 82, macd: -1.2, fibLevel: "0.618", patternScore: 89, pattern: "Çift Tepe Formasyonu (Satış)", potential: 22 },
"ADA-USDT": { rsi: 75, macd: -0.5, fibLevel: "0.5", patternScore: 78, pattern: "Yükselen Kama Kırılımı (Satış)", potential: 18 },
"DOGE-USDT": { rsi: 38, macd: -0.45, fibLevel: "0.618", patternScore: 82, pattern: "Azalan Üçgen", potential: 25 },
"DOT-USDT": { rsi: 85, macd: -1.5, fibLevel: "0.236", patternScore: 92, pattern: "Dirençten Dönüş (Satış)", potential: 25 },
"LINK-USDT": { rsi: 39, macd: 0.9, fibLevel: "0.618", patternScore: 82, pattern: "Channel Breakout", potential: 48 },
"MATIC-USDT": { rsi: 72, macd: -0.9, fibLevel: "0.382", patternScore: 81, pattern: "OBO Formasyonu (Satış)", potential: 28 },
"10000PEPE-USDT": { rsi: 32, macd: 0.85, fibLevel: "0.786", patternScore: 94, pattern: "Dip Dönüşü 🐸", potential: 45 },
"FET-USDT": { rsi: 34, macd: 1.4, fibLevel: "0.618", patternScore: 91, pattern: "AI Narrative Hype", potential: 85 },
"RNDR-USDT": { rsi: 36, macd: 1.2, fibLevel: "0.618", patternScore: 87, pattern: "Bull Flag", potential: 58 },
"10000SHIB-USDT": { rsi: 35, macd: 0.65, fibLevel: "0.618", patternScore: 88, pattern: "Akümülasyon Kırılımı", potential: 35 },
"AAVE-USDT": { rsi: 33, macd: 1.1, fibLevel: "0.786", patternScore: 90, pattern: "DeFi Recovery", potential: 42 },
"UNI-USDT": { rsi: 38, macd: 0.8, fibLevel: "0.618", patternScore: 85, pattern: "DEX Volume Surge", potential: 38 },
"ARB-USDT": { rsi: 31, macd: 1.3, fibLevel: "0.786", patternScore: 92, pattern: "L2 Narrative Boost", potential: 65 },
"OP-USDT": { rsi: 34, macd: 1.2, fibLevel: "0.786", patternScore: 89, pattern: "Superchain Growth", potential: 55 },
"SUI-USDT": { rsi: 28, macd: 1.6, fibLevel: "0.786", patternScore: 95, pattern: "Parabolic Breakout", potential: 88 },
"APT-USDT": { rsi: 35, macd: 1.1, fibLevel: "0.618", patternScore: 88, pattern: "Ecosystem Expansion", potential: 45 },
"INJ-USDT": { rsi: 32, macd: 1.4, fibLevel: "0.786", patternScore: 93, pattern: "AI + DeFi Synergy", potential: 78 },
"TIA-USDT": { rsi: 30, macd: 1.5, fibLevel: "0.786", patternScore: 94, pattern: "Modular Blockchain Hype", potential: 82 },
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
const getAdjustedTechnicals = (symbol: string, liveChange: number) => {
  let pd = PATTERN_DATA[symbol] ? { ...PATTERN_DATA[symbol] } : null;
  if (pd) {
    pd.patternScore = Math.round(pd.patternScore || 0);
    pd.potential = Math.round(pd.potential || 0);
  }
  if (!pd || Object.keys(pd).length === 0) {
    const isCrypto = symbol.includes("-USDT");
    const volMult = isCrypto ? 2 : 1;
    
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = (offset: number) => {
      let x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };
    
    const basePotential = 45 + pseudoRandom(1) * 45;
    const basePatternScore = 75 + pseudoRandom(2) * 20;
    
    if (liveChange > 3 * volMult) {
      pd = { rsi: 65 + pseudoRandom(3)*15, macd: 0.5 + pseudoRandom(4), fibLevel: "0.786", patternScore: Math.round(Math.min(99, basePatternScore + 10)), pattern: "Yükseliş Trendi", potential: Math.round(Math.min(99, basePotential + 15)) };
    } else if (liveChange < -3 * volMult) {
      pd = { rsi: 20 + pseudoRandom(3)*15, macd: -0.5 - pseudoRandom(4), fibLevel: "0.236", patternScore: Math.round(Math.min(99, basePatternScore + 10)), pattern: "Aşırı Satım", potential: Math.round(Math.min(99, basePotential + 15)) };
    } else {
      pd = { rsi: 40 + pseudoRandom(3)*20, macd: (pseudoRandom(4)-0.5)*0.5, fibLevel: "0.5", patternScore: Math.round(basePatternScore), pattern: "Konsolidasyon", potential: Math.round(basePotential) };
    }
  }

  // Dynamic Nudge: Adjust RSI/MACD based on daily change to feel "live"
  // If stock is up 5%, RSI should be higher than its baseline
  const rsiNudge = liveChange * 2.5;
  const macdNudge = liveChange * 0.05;
  
  pd.rsi = Math.max(10, Math.min(95, +(pd.rsi + rsiNudge).toFixed(1)));
  pd.macd = +(pd.macd + macdNudge).toFixed(2);
  
  return pd;
};

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
  const isReset = safeStorage.getItem("candidatesReset_20260414_v5");
  if (!isReset) {
    safeStorage.setItem("candidatesReset_20260414_v5", "true");
    safeStorage.removeItem("candidates");
    return { BIST: [], CRYPTO: [], EMTİA: [] };
  }
  const saved = safeStorage.getItem("candidates");
  return safeJsonParse(saved, { BIST: [], CRYPTO: [], EMTİA: [] });
});
    const [prices, setPrices] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    // Realistic initial values for 2026
    const initialMocks: Record<string, number> = {
      "XU100": 9450.79, "XU030": 10200.50, "TRY=X": 34.45, "EURTRY=X": 36.20,
      "BTC-USDT": 96450.20, "ETH-USDT": 2680.50, "SOL-USDT": 185.60,
      "GC=F": 2749.57, "GAU=X": 3050.73, "GAG=X": 36.92,
      ...REALISTIC_BIST_PRICES
    };
    
    const initialChanges: Record<string, number> = {
      "XU100": 1.25, "XU030": 1.15, "TRY=X": 0.05, "EURTRY=X": 0.08,
      "BTC-USDT": 2.45, "ETH-USDT": 1.80, "SOL-USDT": 3.20,
      "GC=F": 0.45, "GAU=X": 0.35, "GAG=X": 0.86,
      "THYAO": 0.79, "GARAN": -1.40, "AKBNK": -0.80, "EREGL": 0.50,
      "KCHOL": 1.20, "SAHOL": 0.30, "BIMAS": -0.20, "TUPRS": 0.40,
      "ASELS": 1.50, "PGSUS": 0.90, "SISE": -0.50, "YKBNK": -1.10,
      "MGROS": 0.20, "FROTO": 0.60, "TOASO": -0.40, "ARCLK": 0.10,
      "DOHOL": 0.80, "PETKM": -0.30, "TAVHL": 1.10, "EKGYO": 0.50
    };
    
    // Initialize all possible symbols including indices
    Object.keys(initialMocks).forEach(sym => {
      p[sym] = initialMocks[sym];
      p[`${sym}_change`] = initialChanges[sym] || 0;
    });

    [...BIST_STOCKS, ...CRYPTO_COINS, ...COMMODITY_ITEMS].forEach(s => { 
      if (s && s.symbol && !p[s.symbol]) {
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
  // Hard reset for v4 to clear any corrupted data
  const isReset = safeStorage.getItem("portfolioReset_20260414_v4");
  if (!isReset) {
    safeStorage.setItem("portfolioReset_20260414_v4", "true");
    safeStorage.removeItem("portfolios");
    return {};
  }
  const saved = safeStorage.getItem("portfolios");
  return safeJsonParse(saved, {});
});
const [tradeHistory, setTradeHistory] = useState<any[]>(() => {
  // Hard reset for v5 to clear any corrupted data and start fresh today
  const isReset = safeStorage.getItem("historyReset_20260414_v4");
  if (!isReset) {
    safeStorage.setItem("historyReset_20260414_v4", "true");
    safeStorage.removeItem("tradeHistory");
    return [];
  }
  const saved = safeStorage.getItem("tradeHistory");
  const parsed = safeJsonParse(saved);
  if (parsed && Array.isArray(parsed)) return parsed;
  return [];
});
const [portfolioLoading, setPortfolioLoading] = useState(false);
const [portfolioError, setPortfolioError] = useState<string | null>(null);
const [portfolioStats, setPortfolioStats] = useState<Record<string, any>>(() => {
  // Hard reset for stats as well
  const isReset = safeStorage.getItem("statsReset_20260413_v4");
  if (!isReset) {
    safeStorage.setItem("statsReset_20260413_v4", "true");
    safeStorage.removeItem("portfolioStats");
    return {
      BIST: { daily: 0, weekly: 0, monthly: 0 },
      CRYPTO: { daily: 0, weekly: 0, monthly: 0 },
      EMTİA: { daily: 0, weekly: 0, monthly: 0 }
    };
  }
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
    setCurrentTime(now.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: '2-digit', minute: '2-digit' }));
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
    const t = setTimeout(() => safeStorage.setItem("aiCache", safeJsonStringify(aiCache)), 1000);
    return () => clearTimeout(t);
  }, [aiCache]);

  // Periodic cleanup of old trade history (Monthly cleanup on the 1st)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDate() === 1) {
        console.log("[App] Monthly cleanup: Resetting trade history.");
        setTradeHistory([]);
      }
    }, 1000 * 60 * 60 * 12); // Check every 12 hours
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
              if (sym === 'BTC-USDT') basePrice = 96450.20;
              if (sym === 'ETH-USDT') basePrice = 2680.50;
              if (sym === 'SOL-USDT') basePrice = 185.60;
              
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
            next["USDT-TRY"] = 34.45 + (Math.sin(Date.now() / 10000) * 0.2);
            next["USDT-TRY_change"] = +(Math.sin(Date.now() / 10000) * 0.05).toFixed(2);
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
                    const basePrice = REALISTIC_BIST_PRICES[sym] || (10 + (seed % 200));
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
                  next["XU100"] = 9450.79 + (Math.sin(Date.now() / 10000) * 50);
                  next["XU100_change"] = +(Math.sin(Date.now() / 10000) * 1.5).toFixed(2);
                }
                if (!next["XU030"]) {
                  next["XU030"] = 10200.50 + (Math.sin(Date.now() / 10000) * 60);
                  next["XU030_change"] = +(Math.sin(Date.now() / 10000) * 1.6).toFixed(2);
                }
                if (!next["TRY=X"]) {
                  next["TRY=X"] = 34.45 + (Math.sin(Date.now() / 10000) * 0.2);
                  next["TRY=X_change"] = +(Math.sin(Date.now() / 10000) * 0.05).toFixed(2);
                }
                if (!next["EURTRY=X"]) {
                  next["EURTRY=X"] = 36.20 + (Math.sin(Date.now() / 10000) * 0.3);
                  next["EURTRY=X_change"] = +(Math.sin(Date.now() / 10000) * 0.08).toFixed(2);
                }
                if (!next["GC=F"]) {
                  next["GC=F"] = 2749.57 + (Math.sin(Date.now() / 10000) * 15);
                  next["GC=F_change"] = +(Math.sin(Date.now() / 10000) * 0.6).toFixed(2);
                }
                if (!next["GAU=X"]) {
                  next["GAU=X"] = 3050.73 + (Math.sin(Date.now() / 10000) * 10);
                  next["GAU=X_change"] = +(Math.sin(Date.now() / 10000) * 0.5).toFixed(2);
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
                const basePrice = REALISTIC_BIST_PRICES[sym] || (10 + (seed % 200));
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
              next["XU100"] = 9450.79 + (Math.sin(Date.now() / 10000) * 50);
              next["XU100_change"] = +(Math.sin(Date.now() / 10000) * 1.5).toFixed(2);
            }
            if (!next["XU030"]) {
              next["XU030"] = 10200.50 + (Math.sin(Date.now() / 10000) * 60);
              next["XU030_change"] = +(Math.sin(Date.now() / 10000) * 1.6).toFixed(2);
            }
            if (!next["TRY=X"]) {
              next["TRY=X"] = 34.45 + (Math.sin(Date.now() / 10000) * 0.2);
              next["TRY=X_change"] = +(Math.sin(Date.now() / 10000) * 0.05).toFixed(2);
            }
            if (!next["EURTRY=X"]) {
              next["EURTRY=X"] = 36.20 + (Math.sin(Date.now() / 10000) * 0.3);
              next["EURTRY=X_change"] = +(Math.sin(Date.now() / 10000) * 0.08).toFixed(2);
            }
            if (!next["GC=F"]) {
              next["GC=F"] = 2749.57 + (Math.sin(Date.now() / 10000) * 15);
              next["GC=F_change"] = +(Math.sin(Date.now() / 10000) * 0.6).toFixed(2);
            }
            if (!next["GAU=X"]) {
              next["GAU=X"] = 3050.73 + (Math.sin(Date.now() / 10000) * 10);
              next["GAU=X_change"] = +(Math.sin(Date.now() / 10000) * 0.5).toFixed(2);
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
      
      // Robust URL construction for sandboxed environments
      let apiUrl = `/api/prices?_=${Date.now()}`;
      try {
        const origin = window.location.origin;
        if (origin && origin !== 'null' && window.location.protocol.startsWith('http')) {
          apiUrl = new URL(apiUrl, origin).href;
        } else {
          // Try to derive from current script or just use absolute path if relative fails
          const base = document.baseURI || window.location.href;
          if (base && base.startsWith('http')) {
            apiUrl = new URL(apiUrl, base).href;
          }
        }
      } catch (e) {
        console.warn("[App] Failed to construct absolute API URL, using relative path.");
      }

      const res = await fetch(apiUrl, { 
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
      let newsUrl = '/api/news';
      try {
        const origin = window.location.origin;
        if (origin && origin !== 'null' && window.location.protocol.startsWith('http')) {
          newsUrl = new URL(newsUrl, origin).href;
        } else {
          const base = document.baseURI || window.location.href;
          if (base && base.startsWith('http')) {
            newsUrl = new URL(newsUrl, base).href;
          }
        }
      } catch (e) {}

      const res = await fetch(newsUrl);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (Array.isArray(data)) setNews(data);
        }
      }
    } catch (error) { 
      console.error("News fetch error:", error); 
    }
  }, []);

  // Removed News Listener to avoid Firestore quota issues

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Trigger server-side refresh
      await fetch('/api/refresh').catch(() => {});
    } catch (e) {}
    await fetchPrices();
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
    p += Math.random() * 8 + 3;
    if (p >= 100) {
      p = 100;
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
      setScanning(prev => ({ ...prev, [targetMarket]: false }));
      setScanned(prev => ({ ...prev, [targetMarket]: true }));

      // Dynamically calculate potential based on live price changes and mock pattern data
      const found = stocks.flatMap(s => {
        // Use live price if available, otherwise fallback to mock
        const livePrice = prices[s.symbol] || s.price || 0;
        const liveChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
        
        if (!Number.isFinite(liveChange)) return [];
        
        // Use unified scores from calculateAssetScore
        const scores = calculateAssetScore(s, prices);
        const { longScore, shortScore, techLong, techShort, fundBullish, whaleBullish, globalBullish, maBuyCount, maSellCount } = scores;
        const isCrypto = s.symbol.includes("USDT");
        
        // Simulate Whale Activity
        let whale = { action: "YOK", amount: "" };
        if (longScore >= 80 && Math.random() > 0.3) {
          whale = { action: "ALIM", amount: isCrypto ? `${(Math.random() * 5 + 1).toFixed(1)}M$` : `${(Math.random() * 50 + 10).toFixed(0)}M ₺` };
        } else if (shortScore >= 80 && Math.random() > 0.3) {
          whale = { action: "SATIM", amount: isCrypto ? `${(Math.random() * 5 + 1).toFixed(1)}M$` : `${(Math.random() * 50 + 10).toFixed(0)}M ₺` };
        }

        const results = [];
        // Only show the stronger side if both are above threshold
        // Threshold set to 80 for candidates AND 8/12 moving averages must give buy/sell
        if (longScore >= 80 && maBuyCount >= 8 && longScore >= shortScore) {
          results.push({ ...s, dynamicPotential: longScore, finalScore: scores.finalScore, side: 'long', maBuyCount, whale, techScore: techLong, fundScore: fundBullish, whaleScore: whaleBullish, globalScore: globalBullish, pd: scores.pd });
        } else if (shortScore >= 80 && maSellCount >= 8) {
          results.push({ ...s, dynamicPotential: shortScore, finalScore: scores.finalScore, side: 'short', maSellCount, whale, techScore: techShort, fundScore: 100 - fundBullish, whaleScore: 100 - whaleBullish, globalScore: 100 - globalBullish, pd: scores.pd });
        }
        
        return results;
      }).sort((a, b) => b.finalScore - a.finalScore);

      setCandidates(prev => ({ ...prev, [targetMarket]: found }));
    }
    setScanProgress(prev => ({ ...prev, [targetMarket]: Math.min(p, 100) }));
  }, 100);
}, [prices, stocks, market, scanning]);

const fetchAiAnalysis = useCallback(async (stock: any) => {
  if (!stock) return;
  
  const currentPrice = Number(prices[stock.symbol] ?? stock.price ?? 0);
  const cacheKey = `${stock.symbol}_${Math.round(currentPrice * 100) / 100}`; // Cache by symbol and price (rounded to 2 decimal places)

  // Check cache first
  if (aiCache[cacheKey]) {
    setAiAnalysis(aiCache[cacheKey]);
    return;
  }

  setAiLoading(true);
  setAiAnalysis("");
  
  const pd = PATTERN_DATA[stock.symbol] || { rsi: 50, macd: 0, fibLevel: "0.5", patternScore: 50, pattern: "Nötr", potential: 5 };
  const isCrypto = stock.symbol.includes("-USDT");
  
  try {
    const promptPrice = Number.isFinite(currentPrice) ? currentPrice : 0;
    const promptChange = Number.isFinite(Number(prices[`${stock.symbol}_change`] ?? stock.change)) ? Number(prices[`${stock.symbol}_change`] ?? stock.change) : 0;
    
    const isShort = stock.side === 'short';
    const systemDecision = isShort ? "SAT (SHORT)" : "AL (LONG)";
    const whaleInfo = stock.whale && stock.whale.action !== "YOK" ? `Balina Aktivitesi: ${stock.whale.action} (${stock.whale.amount})` : "Belirgin balina aktivitesi yok.";
    
    const prompt = `Analist: ${isCrypto ? "Kripto" : "Borsa"}. Varlık: ${stock.symbol}. 
Zaman Dilimi: 4 SAATLİK (4H).
Sistem Sinyali: ${systemDecision}.
${whaleInfo}
Veri: GÜNCEL FİYAT ${promptPrice}, Değişim %${promptChange}, RSI ${pd.rsi}, MACD ${pd.macd > 0 ? "Pozitif" : "Negatif"}, Formasyon: ${pd.pattern}.

Talimat: Çok kısa, teknik ve temel olarak net ol. 
Analizini 4H (4 Saatlik) zaman dilimine göre yap. Bu bir SCALP değil, SWING/POZİSYON analizidir.
Sistem bu varlık için ${systemDecision} sinyali verdi. Analizini bu yöne odaklanarak yap. Özellikle ${whaleInfo} verisini dikkate al.

ÖNEMLİ: HEDEF ve RİSK bölümlerindeki Giriş, TP (Kâr Al) ve Stop seviyelerini MUTLAKA yukarıda verilen GÜNCEL FİYAT (${promptPrice}) üzerinden 4H zaman dilimine uygun (geniş marjlı) hesapla. Kesinlikle başka bir fiyat kullanma.

1. 🎯 FORMASYON: ${pd.pattern} yorumu.
2. 📊 TEKNİK: RSI/MACD yönü (4H bazlı).
3. 📰 TEMEL: Varlık hakkında kısa temel beklenti.
4. 🚀 HEDEFLER: Giriş/TP1/TP2 (4H Swing hedefleri, Güncel fiyat ${promptPrice} baz alınarak).
5. 🛡️ RİSK YÖNETİMİ: Stop Seviyesi (4H yapıya uygun, Güncel fiyat ${promptPrice} baz alınarak).
6. 💎 KARAR: ${systemDecision} (4H strateji özeti).`;

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
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    const text = response.text || "Analiz yüklenemedi.";
    setAiAnalysis(text);
    setAiCache(prev => ({ ...prev, [cacheKey]: text }));
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
  const pd = getAdjustedTechnicals(s.symbol, liveChange);
  
  // 4H Timeframe Adjustments
  // 4H is more stable, so we increase the weight of RSI and MACD slightly
  let rsiLongBias = pd.rsi < 35 ? (35 - pd.rsi) * 2.5 : 0;
  let rsiShortBias = pd.rsi > 65 ? (pd.rsi - 65) * 2.5 : 0;
  
  // RSI Penalty: Overbought assets shouldn't have high long scores
  if (pd.rsi > 70) rsiLongBias -= (pd.rsi - 70) * 5.0; // Increased penalty from 3.0 to 5.0
  if (pd.rsi > 80) rsiLongBias -= 50; // Hard penalty for extreme RSI
  if (pd.rsi < 30) rsiShortBias -= (30 - pd.rsi) * 5.0;
  if (pd.rsi < 20) rsiShortBias -= 50; // Hard penalty for extreme oversold

  // MACD Penalty: MACD sell signal shouldn't have high long score
  let macdBias = pd.macd * 20;
  if (pd.macd < 0) {
    macdBias *= 4.0; // Heavier penalty for negative MACD on Longs (was 2.0)
    rsiLongBias -= 20; // Additional penalty if both RSI high and MACD negative
  }
  
  let momentumBias = liveChange * 2.5;
  
  let techLong = pd.potential + rsiLongBias + macdBias + momentumBias;
  let techShort = pd.potential + rsiShortBias - macdBias - momentumBias;
  
  // Strict MACD and RSI cross-check
  if (pd.macd < -0.05) techLong *= 0.5; // More aggressive reduction (was 0.7)
  if (pd.macd > 0.05) techShort *= 0.5;
  if (pd.rsi > 75) techLong *= 0.4; // Drastic reduction for extremely high RSI
  if (pd.rsi < 25) techShort *= 0.4;

  techLong = Math.max(0, Math.min(100, techLong));
  techShort = Math.max(0, Math.min(100, techShort));

  // Calculate MA counts here to unify logic
  let maBuyCount = Math.round((techLong / 100) * 12);
  let maSellCount = Math.round((techShort / 100) * 12);
  maBuyCount = Math.min(12, Math.max(0, Math.round(maBuyCount + (Math.random() > 0.5 ? 1 : -1))));
  maSellCount = Math.min(12, Math.max(0, Math.round(maSellCount + (Math.random() > 0.5 ? 1 : -1))));

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
  let fundBullish = 45 + (pseudoRandom(1) * 55);
  let whaleBullish = 45 + (pseudoRandom(2) * 55);
  let globalBullish = 45 + (pseudoRandom(3) * 55);

  if (isBist) {
    longScore = (techLong * 0.4) + (fundBullish * 0.6);
    shortScore = (techShort * 0.4) + ((100 - fundBullish) * 0.6);
  } else if (isCrypto) {
    longScore = (techLong * 0.85) + (whaleBullish * 0.15);
    shortScore = (techShort * 0.85) + ((100 - whaleBullish) * 0.15);
  } else {
    longScore = (techLong * 0.6) + (globalBullish * 0.4);
    shortScore = (techShort * 0.6) + ((100 - globalBullish) * 0.4);
  }

  return {
    longScore: Math.round(Math.max(0, Math.min(98, longScore))),
    shortScore: Math.round(Math.max(0, Math.min(98, shortScore))),
    techScore: Math.round(longScore > shortScore ? techLong : techShort),
    finalScore: Math.round(((longScore > shortScore ? longScore : shortScore) + (longScore > shortScore ? techLong : techShort)) / 2),
    fundScore: Math.round(fundBullish),
    whaleScore: Math.round(whaleBullish),
    globalScore: Math.round(globalBullish),
    maBuyCount,
    maSellCount,
    pd
  };
}, []);

const generateSmartPortfolio = useCallback(async (targetMarket?: string) => {
  if (portfolioLoading) return;
  const activeMarket = targetMarket || market;
  console.log(`[App] generateSmartPortfolio starting for ${activeMarket}`);
  setPortfolioError(null);

  const currentPortfolio = (portfolios && portfolios[activeMarket]) ? portfolios[activeMarket] : null;
  const now = new Date();
  const nowMs = now.getTime();
  const isSessionActive = currentPortfolio && currentPortfolio.nextUpdateTimestamp && nowMs < currentPortfolio.nextUpdateTimestamp;

  // If user clicks "Generate" but session is active, just refresh prices and switch screen
  if (!targetMarket && isSessionActive) {
    console.log(`[App] Session active for ${activeMarket}. Refreshing prices instead of regenerating.`);
    setLoading(true);
    await fetchPrices();
    setScreen("portfolio");
    return;
  }

  // Prevent manual regeneration if portfolio already exists (legacy check, kept for safety)
  if (!targetMarket && portfolios && portfolios[activeMarket] && isSessionActive) {
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
    
    // Set budgets based on market
    let budget = 1000000; // BIST: 1M TL
    if (activeMarket === "CRYPTO") budget = 5000; // CRYPTO: 5K USD
    else if (activeMarket === "EMTİA") budget = 300000; // EMTİA: 300K TL
    
    const marketStocks = activeMarket === "BIST" ? BIST_STOCKS : (activeMarket === "CRYPTO" ? CRYPTO_COINS : COMMODITY_ITEMS);

    if (!marketStocks || marketStocks.length === 0) {
      throw new Error(`Market stocks for ${activeMarket} is empty or undefined`);
    }

    const items: any[] = [];

    // 2. Handle existing portfolio closure
    const currentPortfolio = (portfolios && portfolios[activeMarket]) ? portfolios[activeMarket] : null;
    let closedItems: any[] = [];
    
    const now = new Date();
    const turkeyTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + (3 * 60 * 60 * 1000));
    const nowMs = turkeyTime.getTime();

    // Market Start Logic
    const bistStartTime = new Date("2026-04-13T16:25:00+03:00").getTime();
    if (activeMarket === "BIST" && nowMs < bistStartTime) {
      throw new Error("BİST Portföyü bugün saat 16:25 itibariyle aktif olacaktır.");
    }

    if (currentPortfolio && currentPortfolio.items) {
      const activeItems = currentPortfolio.items.filter((i: any) => i.status === 'ACTIVE');
      
      // Session expired (or forced), close all active items
      if (activeItems.length > 0) {
        closedItems = activeItems.map((item: any) => {
          const currentPrice = (prices && prices[item.symbol]) || item.entryPrice;
          const isShort = item.side === 'short';
          const leverage = item.leverage || 1;

          // Safety check for entryPrice
          const safeEntryPrice = (item.entryPrice && item.entryPrice > 0.0001) ? item.entryPrice : currentPrice;

          let pnl = isShort 
            ? ((safeEntryPrice - currentPrice) / safeEntryPrice) * 100 * leverage
            : ((currentPrice - safeEntryPrice) / safeEntryPrice) * 100 * leverage;
          
          const maxPnl = (activeMarket === "BIST") ? 20 : 500;
          if (Math.abs(pnl) > maxPnl) pnl = Math.sign(pnl) * maxPnl;
          
          // Check if we should keep it (TUT) or close it
          // BIST 18:00 Kapanış: Keep if score is still good
          // EMTİA 23:00 Kapanış: Keep if score is still good
          const scores = calculateAssetScore(item, prices);
          const currentScore = item.side === 'long' ? scores.longScore : scores.shortScore;
          const shouldKeep = currentScore >= 75;

          if (shouldKeep) {
            return { ...item, pnl }; // Keep as ACTIVE
          }

          // Determine strictly scheduled closedAt time
          const hours = UPDATE_HOURS[activeMarket] || [23];
          const turkeyHour = turkeyTime.getHours();
          const passedHours = hours.filter(h => h <= turkeyHour);
          let finalClosedAtDate = new Date(turkeyTime.getTime());
          
          if (passedHours.length > 0) {
            finalClosedAtDate.setHours(passedHours[passedHours.length - 1], 0, 0, 0);
          } else {
            finalClosedAtDate.setDate(finalClosedAtDate.getDate() - 1);
            finalClosedAtDate.setHours(hours[hours.length - 1], 0, 0, 0);
          }
          
          const closedAt = finalClosedAtDate.toISOString();

          return { 
            ...item, 
            status: pnl >= 0 ? 'TP' : 'SL', 
            pnl, 
            closedAt, 
            market: activeMarket,
            exitPrice: currentPrice
          };
        });
      }
    }

    // 3. Score and select candidates
    let scoredCandidates = marketStocks.map(s => {
      try {
        const scores = calculateAssetScore(s, prices);
        const side = (scores.longScore >= scores.shortScore) ? 'long' : 'short';
        const score = side === 'long' ? scores.longScore : scores.shortScore;
        const maCount = side === 'long' ? scores.maBuyCount : scores.maSellCount;
        
        // Portfolio items must have at least 10/12 MA agreement (New criteria)
        if (maCount < 10) return null;
        
        return { ...s, ...scores, side, score };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // How many new items do we need?
    const stayingItems = closedItems.filter(i => i.status === 'ACTIVE');
    const stayingSymbols = stayingItems.map(i => i.symbol);
    
    // We want 4 to 8 items total.
    const availableCandidates = scoredCandidates.filter((c: any) => !stayingSymbols.includes(c.symbol));
    
    // Select candidates with 90+ score
    let selectedNew = availableCandidates
      .filter((c: any) => c.finalScore >= 90)
      .sort((a: any, b: any) => b.finalScore - a.finalScore);
      
    // If we have more than 8 total slots, cap it
    const maxNewSlots = 8 - stayingItems.length;
    const minNewSlots = Math.max(0, 4 - stayingItems.length);
    
    if (selectedNew.length > maxNewSlots) {
      selectedNew = selectedNew.slice(0, maxNewSlots);
    }
    
    // If we don't have enough 90+ candidates to reach at least 4 total items
    if (selectedNew.length < minNewSlots) {
      const fallbackCandidates = availableCandidates
        .filter((c: any) => c.finalScore >= 85 && c.finalScore < 90)
        .sort((a: any, b: any) => b.finalScore - a.finalScore)
        .slice(0, minNewSlots - selectedNew.length);
      selectedNew = [...selectedNew, ...fallbackCandidates];
    }
    
    // Final check: if still less than 4 total, take best available above 80
    if (selectedNew.length + stayingItems.length < 4) {
       const remainingNeeded = 4 - (selectedNew.length + stayingItems.length);
       const currentSymbols = [...stayingSymbols, ...selectedNew.map(n => n.symbol)];
       const lastResort = availableCandidates
         .filter(c => !currentSymbols.includes(c.symbol) && c.finalScore >= 80)
         .sort((a, b) => b.finalScore - a.finalScore)
         .slice(0, remainingNeeded);
       selectedNew = [...selectedNew, ...lastResort];
    }

    const allItemsToInclude = [...stayingItems, ...selectedNew];
    
    if (allItemsToInclude.length === 0) {
      throw new Error("Piyasa verileri analiz edilemedi. Lütfen fiyatları yenileyip tekrar deneyin.");
    }

    // Weighted distribution logic
    const totalScore = allItemsToInclude.reduce((acc, c) => acc + (c.score || 85), 0);
    
    selectedNew.forEach((c: any) => {
      const price = (prices && prices[c.symbol]) || c.price || 0;
      
      // Safety check: Don't add items with invalid prices
      if (price <= 0) {
        console.warn(`[App] Skipping ${c.symbol} due to invalid price: ${price}`);
        return;
      }

      const isShort = c.side === 'short';
      const potential = c.score / 10;
      
      const precision = (c.symbol && c.symbol.includes("USDT")) ? 4 : 2;
      const tp = isShort ? +(price * (1 - potential / 100)).toFixed(precision) : +(price * (1 + potential / 100)).toFixed(precision);
      const sl = isShort ? +(price * 1.05).toFixed(precision) : +(price * 0.95).toFixed(precision);

      const isCrypto = activeMarket === "CRYPTO";
      const leverage = isCrypto ? 20 : 1; 
      
      // Weighted amount: (score / totalScore) * budget
      const unleveragedAmount = (c.score / totalScore) * budget;
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
        status: 'ACTIVE',
        createdAt: now.toISOString()
      });
    });

    // 4. Finalize portfolio
    const nextUpdate = new Date(turkeyTime.getTime());
    const displayTime = turkeyTime.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: '2-digit', minute: '2-digit' });
    
    // Use UPDATE_HOURS for all markets
    const hours = UPDATE_HOURS[activeMarket] || [23];
    const currentHour = nextUpdate.getHours();
    
    let nextHour = hours.find(h => h > currentHour);
    
    if (nextHour !== undefined) {
      nextUpdate.setHours(nextHour, 0, 0, 0);
    } else {
      nextUpdate.setDate(nextUpdate.getDate() + 1);
      nextUpdate.setHours(hours[0], 0, 0, 0);
    }

    // Keep existing active items that were marked to stay
    const finalItems = [
      ...items,
      ...(closedItems.filter(i => i.status === 'ACTIVE'))
    ].sort((a, b) => (b.score || 0) - (a.score || 0));

    const newPortfolio = {
      items: finalItems,
      totalBudget: budget,
      lastUpdated: displayTime,
      nextUpdate: nextUpdate.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: '2-digit', minute: '2-digit' }),
      nextUpdateTimestamp: nextUpdate.getTime(),
      timestamp: turkeyTime.getTime(),
      market: activeMarket
    };

    const bistStartTs = new Date("2026-04-13T16:00:00+03:00").getTime();
    const isStarted = nowMs >= bistStartTs;

    // Batch state updates and transition screen
    const trulyClosed = closedItems.filter(i => i.status === 'TP' || i.status === 'SL');
    if (trulyClosed.length > 0) {
      setTradeHistory(prev => {
        const existing = Array.isArray(prev) ? prev : [];
        // Filter out duplicates (same symbol and same closedAt)
        const newItems = trulyClosed.filter((newItem, index, self) => 
          !existing.some(oldItem => oldItem.symbol === newItem.symbol && oldItem.closedAt === newItem.closedAt) &&
          self.findIndex(t => t.symbol === newItem.symbol && t.closedAt === newItem.closedAt) === index
        );
        return [...newItems, ...existing].slice(0, 1000);
      });
    }
    setPortfolios(prev => ({ ...(prev || {}), [activeMarket]: newPortfolio }));
    setPortfolioStats(prev => ({
      ...(prev || {}),
      [activeMarket]: {
        daily: 0, // Reset to 0 since we just started today at 16:00
        weekly: 0,
        monthly: 0
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

const portfoliosRef = useRef(portfolios);
const portfolioLoadingRef = useRef(portfolioLoading);
const generateSmartPortfolioRef = useRef(generateSmartPortfolio);
const isFetchingRef = useRef(false);

useEffect(() => {
  portfoliosRef.current = portfolios;
}, [portfolios]);

useEffect(() => {
  portfolioLoadingRef.current = portfolioLoading;
}, [portfolioLoading]);

useEffect(() => {
  generateSmartPortfolioRef.current = generateSmartPortfolio;
}, [generateSmartPortfolio]);

// Consolidated Automatic Market & Portfolio Management
useEffect(() => {
  const checkAll = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // 1. Refresh Live Data
      await fetchPrices();
      await fetchNews();

      // 2. Manage Portfolios
      const now = new Date();
      const nowObj = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + (3 * 60 * 60 * 1000));
      const nowMs = nowObj.getTime();
      const currentHour = nowObj.getHours();
      const currentMinute = nowObj.getMinutes();
      const markets = ["BIST", "CRYPTO", "EMTİA"];
      
      // Define update hours for each market
      const updateHours = UPDATE_HOURS;
      
      markets.forEach(m => {
        const p = portfoliosRef.current[m];
        const isEmpty = !p;
        
        // Check if we are at or past an update hour
        const hours = updateHours[m] || [];
        const lastUpdate = p && p.timestamp ? new Date(p.timestamp) : null;
        const lastUpdateHour = lastUpdate ? lastUpdate.getHours() : -1;
        const lastUpdateDay = lastUpdate ? lastUpdate.getDate() : -1;
        
        let shouldUpdate = isEmpty;
        if (!isEmpty && lastUpdate) {
          const isSameDay = lastUpdateDay === nowObj.getDate();
          // Check if we passed an update hour today that we haven't processed yet
          for (const hour of hours) {
            if (currentHour >= hour && (lastUpdateHour < hour || !isSameDay)) {
              shouldUpdate = true;
              break;
            }
          }
        }
        
        // Market Start Logic
        if (m === "BIST") {
          const bistStartTime = new Date("2026-04-13T16:25:00+03:00").getTime();
          if (now.getTime() < bistStartTime) return; 
        }
        
        if (shouldUpdate && !portfolioLoadingRef.current) {
          console.log(`[App] Auto-managing ${m} portfolio (ShouldUpdate: ${shouldUpdate})`);
          generateSmartPortfolioRef.current(m);
        }
      });
    } catch (e) {
      console.error("[App] checkAll error:", e);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Initial load - only set loading if we have no data
  if (Object.keys(prices).length < 5) {
    setLoading(true);
  }
  checkAll();

  // Run every 10 seconds to match backend frequency
  const interval = setInterval(checkAll, 10000);
  return () => clearInterval(interval);
}, [fetchPrices, fetchNews]);

useEffect(() => {
  if (!prices || Object.keys(prices).length === 0) return;
  
  setPortfolios(prev => {
    if (!prev) return prev;
    let globalChanged = false;
    const next = { ...prev };
    const newlyClosed: any[] = [];

    Object.keys(next).forEach(m => {
      const portfolio = next[m];
      if (!portfolio || !portfolio.items) return;

      let marketChanged = false;
      const updatedItems = portfolio.items.map((item: any) => {
        if (item.status !== 'ACTIVE') return item;

        const currentPrice = prices[item.symbol];
        if (!currentPrice) return item;

        const isShort = item.side === 'short';
        const leverage = item.leverage || 1;
        const safeEntryPrice = (item.entryPrice && item.entryPrice > 0.0001) ? item.entryPrice : currentPrice;
        
        let newStatus = 'ACTIVE';
        let exitPrice = currentPrice;

        if (isShort) {
          if (currentPrice <= item.tp) { newStatus = 'TP'; exitPrice = item.tp; }
          else if (currentPrice >= item.sl) { newStatus = 'SL'; exitPrice = item.sl; }
        } else {
          if (currentPrice >= item.tp) { newStatus = 'TP'; exitPrice = item.tp; }
          else if (currentPrice <= item.sl) { newStatus = 'SL'; exitPrice = item.sl; }
        }

        let pnl = isShort 
          ? ((safeEntryPrice - currentPrice) / safeEntryPrice) * 100 * leverage
          : ((currentPrice - safeEntryPrice) / safeEntryPrice) * 100 * leverage;

        if (newStatus !== 'ACTIVE') {
          // Recalculate PNL based on exact exitPrice for TP/SL
          pnl = isShort 
            ? ((safeEntryPrice - exitPrice) / safeEntryPrice) * 100 * leverage
            : ((exitPrice - safeEntryPrice) / safeEntryPrice) * 100 * leverage;
            
          marketChanged = true;
          globalChanged = true;
          const closedItem = { ...item, status: newStatus, pnl, closedAt: new Date().toISOString(), market: m, exitPrice };
          newlyClosed.push(closedItem);
          return closedItem;
        } else {
          const maxPnl = (m === "BIST") ? 20 : 500;
          if (Math.abs(pnl) > maxPnl) pnl = Math.sign(pnl) * maxPnl;
          
          if (Math.abs(pnl - (item.pnl || 0)) > 0.001) {
            marketChanged = true;
            globalChanged = true;
            return { ...item, pnl };
          }
        }
        return item;
      });

      if (marketChanged) {
        next[m] = { ...portfolio, items: updatedItems };
      }
    });

    if (globalChanged) {
      if (newlyClosed.length > 0) {
        setTimeout(() => {
          setTradeHistory(h => [...newlyClosed, ...(Array.isArray(h) ? h : [])].slice(0, 500));
        }, 0);
      }
      return next;
    }
    return prev;
  });
}, [prices]);

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
      
      if (score < 75) return [];

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
        onBack={() => setScreen("candidates")}
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
              <LiveIndicator />
            </div>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <button onClick={() => { console.log("[Portfolio] Yenile clicked"); onRefresh(); }} style={{ background: "rgba(191,90,242,0.1)", border: "1px solid rgba(191,90,242,0.3)", color: "#bf5af2", padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>YENİLE</button>
            <div style={{ background: "rgba(191,90,242,0.05)", border: "1px solid rgba(191,90,242,0.2)", borderRadius: 8, padding: "6px 10px", textAlign: "left" }}>
              <div style={{ color: "#bf5af2", fontSize: 9, fontWeight: 800, marginBottom: 2 }}>🎯 AI KRİTERLERİ</div>
              <div style={{ color: "#fff", fontSize: 8, fontWeight: 600 }}>• %85+ Güven Skoru</div>
              <div style={{ color: "#fff", fontSize: 8, fontWeight: 600 }}>• 10/12 MA Onayı</div>
              <div style={{ color: "#fff", fontSize: 8, fontWeight: 600 }}>• 4-8 Varlık Dağılımı</div>
            </div>
          </div>
        </div>
        
        <div style={{ background: "rgba(48,209,88,0.05)", border: "1px solid rgba(48,209,88,0.2)", borderRadius: 12, padding: "10px 14px", marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 18 }}>🔒</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#30d158", fontSize: 11, fontWeight: 800 }}>PORTFÖY KİLİTLENDİ</div>
            <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 600 }}>Bu seans için seçimler sabittir. Sıradaki güncelleme: {getNextUpdateDisplay(market)}</div>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>SON GÜNCELLEME</div>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{portfolio.lastUpdated}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>SIRADAKİ DENGELEME</div>
            <div style={{ color: "#bf5af2", fontSize: 12, fontWeight: 800 }}>{getNextUpdateDisplay(market)}</div>
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
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{market} Pozisyonları</div>
        {[...items].sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).map((item: any, idx: number) => {
          const isShort = item.side === 'short';
          const sideColor = isShort ? "#ff453a" : "#00d4aa";
          const pnl = item.pnl || 0;
          const isClosed = item.status !== 'ACTIVE';
          const currentPrice = isClosed ? (item.exitPrice || item.tp || item.sl) : (safePrices[item.symbol] || item.entryPrice);
          
          return (
            <div key={`${item.symbol}-${idx}`} style={{ background: "#21262d", borderRadius: 20, padding: "16px", border: isClosed ? `1px solid ${item.status === 'TP' ? '#30d158' : '#ff453a'}88` : "1px solid #30363d", position: "relative", overflow: "hidden", opacity: isClosed ? 0.85 : 1, marginBottom: 4 }}>
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
                  {isClosed && item.closedAt && (
                    <div style={{ color: "#4a5568", fontSize: 9, fontWeight: 700, marginTop: 4 }}>KAPANIŞ: {new Date(item.closedAt).toLocaleString("tr-TR", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: pnl >= 0 ? "#30d158" : "#ff453a", fontSize: 16, fontWeight: 800 }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%</div>
                  <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 700 }}>{isClosed ? "FİNAL P&L" : "GÜNCEL P&L"}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "8px" }}>
                  <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700 }}>GİRİŞ</div>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{item.entryPrice.toLocaleString("tr-TR")}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "8px" }}>
                  <div style={{ color: "#8b949e", fontSize: 9, fontWeight: 700 }}>{isClosed ? "KAPANIŞ" : "GÜNCEL"}</div>
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

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#00d4aa", fontSize: 8, fontWeight: 700, marginBottom: 2 }}>GÜVEN</div>
                  <div style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>%{(item.score || 0).toFixed(0)}</div>
                </div>
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

const LiveIndicator = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,212,170,0.1)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(0,212,170,0.2)" }}>
    <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4aa" }} />
    <span style={{ color: "#00d4aa", fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>CANLI TAKİP AKTİF</span>
  </div>
);

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
              <th style={{ textAlign: "left", padding: "12px", color: "#8b949e" }}>VARLIK / FİYAT</th>
              <th style={{ textAlign: "center", padding: "12px", color: "#8b949e" }}>YÖN</th>
              <th style={{ textAlign: "right", padding: "12px", color: "#8b949e" }}>P&L %</th>
              <th style={{ textAlign: "right", padding: "12px", color: "#8b949e" }}>DURUM</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item: any, idx: number) => {
              const isCrypto = item.symbol.includes("-USDT");
              const precision = item.symbol.startsWith("10000") ? 5 : (item.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2));
              return (
                <tr key={`${item.symbol}-${item.closedAt}-${idx}`} style={{ borderTop: "1px solid #30363d" }}>
                  <td style={{ padding: "12px" }}>
                    <div style={{ color: "#fff", fontWeight: 700 }}>{item.symbol}</div>
                    <div style={{ color: "#8b949e", fontSize: 9, marginBottom: 2 }}>
                      {item.entryPrice?.toFixed(precision)} → {item.exitPrice?.toFixed(precision)}
                    </div>
                    <div style={{ color: "#4a5568", fontSize: 9 }}>{new Date(item.closedAt).toLocaleString("tr-TR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetMoneyFlow({ market, stocks, prices }: { market: string, stocks: any[], prices: Record<string, number> }) {
  const isBist = market === "BIST";
  
  const flowData = useMemo(() => {
    return stocks.map(s => {
      const liveChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
      const livePrice = Number(prices[s.symbol] ?? s.price ?? 0);
      
      // Simulate money flow based on change and a pseudo-random volume
      const seed = s.symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const baseVol = isBist ? 50 + (seed % 200) : 10 + (seed % 50); // M ₺ or M $
      
      // Flow = change * baseVol * random multiplier
      const flowAmount = liveChange * baseVol * (0.5 + Math.abs(Math.sin(Date.now() / 100000 + seed)));
      
      return {
        symbol: s.symbol,
        name: s.name,
        change: liveChange,
        price: livePrice,
        flow: flowAmount
      };
    }).filter(s => s.price > 0 && Math.abs(s.change) > 0.1);
  }, [stocks, prices, isBist]);

  const topInflow = useMemo(() => {
    return [...flowData].sort((a, b) => b.flow - a.flow).slice(0, 5);
  }, [flowData]);

  const topOutflow = useMemo(() => {
    return [...flowData].sort((a, b) => a.flow - b.flow).slice(0, 5);
  }, [flowData]);

  if (topInflow.length === 0 && topOutflow.length === 0) return null;

  return (
    <div style={{ background: "#21262d", borderRadius: 16, padding: 16, marginBottom: 20, border: "1px solid #30363d" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 18 }}>💸</div>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>
          {isBist ? "Hisse Para Giriş / Çıkış" : "Kripto Para Giriş / Çıkış"}
        </div>
      </div>
      
      <div style={{ display: "flex", gap: 16 }}>
        {/* Inflow */}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#30d158", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            PARA GİRENLER ({isBist ? "Milyon ₺" : "Milyon $"})
          </div>
          {topInflow.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#c9d1d9", fontSize: 12, fontWeight: 600 }}>{a.symbol}</span>
                <span style={{ color: "#8b949e", fontSize: 9 }}>{a.change > 0 ? "+" : ""}{a.change.toFixed(2)}%</span>
              </div>
              <span style={{ color: "#30d158", fontSize: 12, fontWeight: 600 }}>+{a.flow.toFixed(1)}</span>
            </div>
          ))}
        </div>
        
        {/* Outflow */}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#ff453a", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            PARA ÇIKANLAR ({isBist ? "Milyon ₺" : "Milyon $"})
          </div>
          {topOutflow.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#c9d1d9", fontSize: 12, fontWeight: 600 }}>{a.symbol}</span>
                <span style={{ color: "#8b949e", fontSize: 9 }}>{a.change > 0 ? "+" : ""}{a.change.toFixed(2)}%</span>
              </div>
              <span style={{ color: "#ff453a", fontSize: 12, fontWeight: 600 }}>{a.flow.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketMoneyFlow({ market }: { market: string }) {
  const isBist = market === "BIST";
  
  const initialBuyers = isBist ? [
    { name: "Bank of America", amount: 1450 },
    { name: "İş Yatırım", amount: 850 },
    { name: "Yapı Kredi", amount: 620 },
    { name: "Info", amount: 410 },
    { name: "Gedik", amount: 320 },
  ] : [
    { name: "Binance", amount: 2450 },
    { name: "Coinbase", amount: 1850 },
    { name: "Kraken", amount: 920 },
    { name: "OKX", amount: 810 },
    { name: "Bybit", amount: 520 },
  ];
  
  const initialSellers = isBist ? [
    { name: "Ziraat Yatırım", amount: -1120 },
    { name: "Garanti BBVA", amount: -950 },
    { name: "Ak Yatırım", amount: -780 },
    { name: "Vakıf Yatırım", amount: -540 },
    { name: "Halk Yatırım", amount: -210 },
  ] : [
    { name: "Bitfinex", amount: -1820 },
    { name: "Huobi", amount: -1250 },
    { name: "KuCoin", amount: -980 },
    { name: "Gate.io", amount: -640 },
    { name: "MEXC", amount: -410 },
  ];

  const [buyers, setBuyers] = useState(initialBuyers);
  const [sellers, setSellers] = useState(initialSellers);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }));

  // Reset when market changes
  useEffect(() => {
    setBuyers(initialBuyers);
    setSellers(initialSellers);
    setLastUpdated(new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }));
  }, [market]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBuyers(prev => prev.map(b => ({
        ...b,
        amount: Math.max(10, b.amount + Math.floor((Math.random() - 0.5) * 100))
      })).sort((a, b) => b.amount - a.amount));

      setSellers(prev => prev.map(s => ({
        ...s,
        amount: Math.min(-10, s.amount - Math.floor((Math.random() - 0.5) * 100))
      })).sort((a, b) => a.amount - b.amount));
      
      setLastUpdated(new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }));
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [market]);
  
  const totalBuy = buyers.reduce((acc, b) => acc + b.amount, 0);
  const totalSell = sellers.reduce((acc, s) => acc + Math.abs(s.amount), 0);
  const net = totalBuy - totalSell;

  return (
    <div style={{ background: "#21262d", borderRadius: 16, padding: 16, marginBottom: 20, border: "1px solid #30363d" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 18 }}>📊</div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>
            {isBist ? "BIST 100 Aracı Kurum Dağılımı" : "Kripto Borsa Para Akışı"}
          </div>
        </div>
        <div style={{ color: "#8b949e", fontSize: 10, fontWeight: 600 }}>Son Güncelleme: {lastUpdated}</div>
      </div>
      
      <div style={{ display: "flex", gap: 16 }}>
        {/* Buyers */}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#30d158", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            ALICILAR ({isBist ? "Milyon ₺" : "Milyon $"})
          </div>
          {buyers.map((b, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#c9d1d9", fontSize: 12 }}>{b.name}</span>
              <span style={{ color: "#30d158", fontSize: 12, fontWeight: 600 }}>+{b.amount}</span>
            </div>
          ))}
        </div>
        
        {/* Sellers */}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#ff453a", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            SATICILAR ({isBist ? "Milyon ₺" : "Milyon $"})
          </div>
          {sellers.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#c9d1d9", fontSize: 12 }}>{s.name}</span>
              <span style={{ color: "#ff453a", fontSize: 12, fontWeight: 600 }}>{s.amount}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #30363d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#8b949e", fontSize: 12, fontWeight: 600 }}>Net Para Girişi / Çıkışı:</span>
        <span style={{ color: net >= 0 ? "#30d158" : "#ff453a", fontSize: 14, fontWeight: 800 }}>
          {net >= 0 ? "+" : ""}{net} {isBist ? "Milyon ₺" : "Milyon $"}
        </span>
      </div>
    </div>
  );
}

function ScannerScreen({ scanning, scanProgress, scanned, setScanned, candidates = [], setCandidates, prices = {}, lastUpdated, onScan, onViewCandidates, onViewScalp, onViewCorrection, onViewPortfolio, onGeneratePortfolio, portfolio, portfolioLoading, onRefresh, loading, fetchError, stocks = [], market, setMarket }: any) {
  const currentHour = parseInt(new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }).format(new Date()), 10);
  const isAfter18 = currentHour >= 18 || currentHour < 6; // 18:00 to 06:00

  const safeStocks = Array.isArray(stocks) ? stocks : [];
  const topMovers = [...safeStocks].sort((a, b) => {
    let changeA = Number(prices[`${a.symbol}_change`] ?? a.change ?? 0);
    if (!Number.isFinite(changeA)) changeA = 0;
    let changeB = Number(prices[`${b.symbol}_change`] ?? b.change ?? 0);
    if (!Number.isFinite(changeB)) changeB = 0;
    return Math.abs(changeB) - Math.abs(changeA);
  }).slice(0, 5);
  
  const safeCandidates = (Array.isArray(candidates) ? candidates : []).filter((c: any) => (c.dynamicPotential || 0) >= 70);
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
<LiveIndicator />
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
        { sym: "TRY=X", label: "USDT/TRY", val: (prices["TRY=X"] && prices["TRY=X"] > 0) ? prices["TRY=X"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + " ₺" : (loading ? "..." : "---"), chg: (prices["TRY=X_change"] !== undefined) ? `${prices["TRY=X_change"] > 0 ? "+" : ""}${prices["TRY=X_change"].toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "", up: (prices["TRY=X_change"] || 0) >= 0 },
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
      {(market === "BIST" || market === "CRYPTO") && (
        <>
          <MarketMoneyFlow market={market} />
          <AssetMoneyFlow market={market} stocks={stocks} prices={prices} />
        </>
      )}
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
            gap: 4,
            opacity: portfolioLoading ? 0.8 : 1
          }}
        >
          <div style={{ fontSize: 24 }}>{portfolioLoading ? "⏳" : "💼"}</div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>
            {portfolioLoading ? "GÜNCELLENİYOR..." : (portfolio ? `${market} PORTFÖYÜ` : `OTOMATİK ${market} PORTFÖYÜ`)}
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 600 }}>
            {portfolio ? `SIRADAKİ GÜNCELLEME: ${getNextUpdateDisplay(market)}` : "SİSTEM OTOMATİK OLUŞTURUR"}
          </div>
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
          <div style={{ color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>✦ {safeCandidates.length} aday tespit edildi</div>
          <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>%80+ potansiyel • Yüksek güven skoru</div>
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



function CorrectionScreen({ stocks, prices, lastUpdated, onBack, onSelect, market }: any) {
  // Filter for "Düzeltme Tamamlandı"
  const candidates = stocks.map((s: any) => {
    const currentChange = Number(prices[`${s.symbol}_change`] ?? s.change ?? 0);
    const pd = PATTERN_DATA[s.symbol] || getAdjustedTechnicals(s.symbol, currentChange);
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

function ScalpScreen({ candidates = [], prices = {}, lastUpdated, onBack, onSelect, market }: any) {
  const [filterSide, setFilterSide] = useState<"all" | "long" | "short">("all");

  const filteredCandidates = (Array.isArray(candidates) ? candidates : [])
    .filter((stock: any) => {
      if (filterSide === "long" && stock.side !== "long") return false;
      if (filterSide === "short" && stock.side !== "short") return false;
      const maCount = stock.side === 'long' ? (stock.maBuyCount || 0) : (stock.maSellCount || 0);
      if ((stock.finalScore || 0) < 85 || maCount < 10) return false;
      return true;
    })
    .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

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
              <div style={{ background: "#00d4aa", color: "#000", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>4 SAATLİK</div>
            </div>
            <div style={{ color: "#4a5568", fontSize: 13, marginTop: 2 }}>%80+ potansiyel • {filteredCandidates.length} fırsat</div>
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
        {filteredCandidates.slice(0, 8).map((stock: any, idx: number) => {
          let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
          if (!Number.isFinite(currentChange)) currentChange = 0;
          const pd = stock.pd || getAdjustedTechnicals(stock.symbol, currentChange);
          let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
          if (!Number.isFinite(price)) price = 0;
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
              key={`${stock.symbol}-${stock.side}-${idx}`}
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
                  <span style={{ background: "rgba(0,212,170,0.15)", color: "#00d4aa", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(0,212,170,0.3)" }}>GÜVEN: %{Math.round(stock.dynamicPotential || 0)}</span>
                  <span style={{ background: "rgba(191,90,242,0.1)", color: "#bf5af2", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>RSI: {Math.round(pd.rsi)}</span>
                  <span style={{ background: "rgba(0,184,255,0.1)", color: "#00b8ff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{pd.pattern}</span>
                  <span style={{ background: "rgba(255,214,10,0.1)", color: "#ffd60a", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>MA: {isShort ? (stock.maSellCount || 0) : (stock.maBuyCount || 0)}/12</span>
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

function CandidatesScreen({ candidates = [], prices = {}, lastUpdated, onBack, onSelect, market }: any) {
  const [filterSide, setFilterSide] = useState<"all" | "long" | "short">("all");

  const filteredCandidates = (Array.isArray(candidates) ? candidates : [])
    .filter((stock: any) => {
      const potential = Number(stock.dynamicPotential || 0);
      if (potential < 80) return false;
      const maCount = stock.side === 'long' ? (stock.maBuyCount || 0) : (stock.maSellCount || 0);
      if (maCount < 8) return false;
      if (filterSide === "long" && stock.side !== "long") return false;
      if (filterSide === "short" && stock.side !== "short") return false;
      return true;
    })
    .sort((a, b) => (b.dynamicPotential || 0) - (a.dynamicPotential || 0));

  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ padding: "8px 20px 16px", borderBottom: "1px solid #1a1f2e" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#00d4aa", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 10 }}>
          ← Geri
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Adaylar</div>
            <div style={{ color: "#4a5568", fontSize: 13, marginTop: 2 }}>%70+ potansiyel • {filteredCandidates.length} varlık</div>
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
      let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
      if (!Number.isFinite(currentChange)) currentChange = 0;
      const pd = stock.pd || getAdjustedTechnicals(stock.symbol, currentChange);
      let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
      if (!Number.isFinite(price)) price = 0;
      const up = currentChange >= 0;
      const isTop = idx < 3;
      const isCrypto = stock.symbol.includes("-USDT");
      const isCommodity = stock.sector === "Emtia";
      const currency = isCrypto ? " USDT" : (isCommodity && !stock.name.includes("(TL)") ? " $" : " ₺");
      const precision = stock.symbol.startsWith("10000") ? 5 : (stock.symbol.includes("PEPE") ? 8 : (isCrypto ? 4 : 2));
      
      const isShort = stock.side === 'short';
      const sideColor = isShort ? "#ff453a" : "#00d4aa";
      
      let potential = Number(stock.dynamicPotential || 0);
      if (!Number.isFinite(potential)) potential = 0;
      
      const tp = isShort ? +(price * (1 - potential / 100)).toFixed(precision) : +(price * (1 + potential / 100)).toFixed(precision);
      const resist = isShort ? +(price * 0.92).toFixed(precision) : +(price * 1.08).toFixed(precision);

      return (
        <button
          key={`${stock.symbol}-${stock.side}-${idx}`}
          onClick={() => onSelect(stock)}
          style={{ background: isTop ? "linear-gradient(135deg, #21262d, #161b22)" : "#21262d", borderRadius: 24, padding: "20px", border: isTop ? `1px solid ${sideColor}88` : "1px solid #30363d", cursor: "pointer", textAlign: "left", width: "100%", boxShadow: isTop ? `0 10px 30px ${sideColor}11` : "none" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{stock.symbol}</span>
                <span style={{ background: isShort ? "rgba(255,69,58,0.2)" : "rgba(0,212,170,0.2)", color: sideColor, fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 12, border: `1px solid ${sideColor}44` }}>
                  {isCrypto ? (isShort ? "SELL (SHORT)" : "BUY (LONG)") : "HEDEF KAR %"} {Math.round(potential)}%
                </span>
                {isCrypto && (
                  <span style={{ background: "rgba(191,90,242,0.15)", color: "#bf5af2", fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 10, border: "1px solid rgba(191,90,242,0.3)" }}>
                    20x LEV
                  </span>
                )}
              </div>
              <div style={{ color: "#8b949e", fontSize: 13, fontWeight: 600 }}>{stock.name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                <div style={{ background: "rgba(0,212,170,0.1)", padding: "4px 8px", borderRadius: 6, fontSize: 10, color: "#00d4aa", border: "1px solid rgba(0,212,170,0.2)" }}>
                  Güven Skoru: <span style={{ color: "#fff", fontWeight: 800 }}>%{Math.round(potential)}</span>
                </div>
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
                <div style={{ color: sideColor, fontSize: 12, fontWeight: 700 }}>+{Math.round(potential)}%</div>
              </div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,214,10,0.1)", borderRadius: 16, padding: "12px 16px", border: "1px solid rgba(255,214,10,0.3)" }}>
              <div style={{ color: "#ffd60a", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>{isShort ? "DESTEK" : "DİRENÇ"}</div>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>{resist}{currency}</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: sideColor, fontSize: 13, fontWeight: 700 }}>📐 {pd.pattern}</div>
            <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 600 }}>Güven: %{Math.round(potential)}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            <Pill label="RSI" val={pd.rsi} good={isShort ? pd.rsi > 60 : pd.rsi < 40} />
            <Pill label="MACD" val={`${pd.macd > 0 ? "▲" : "▼"} ${pd.macd}`} good={isShort ? pd.macd < 0 : pd.macd > 0} />
            <Pill label="FIB" val={pd.fibLevel} good />
            <Pill label="MA" val={`${(isShort ? stock.maSellCount : stock.maBuyCount) ?? Math.round((stock.techScore || 50) / 100 * 12)}/12`} good={isShort ? (stock.maSellCount || 0) >= 10 : (stock.maBuyCount || 0) >= 10} />
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

function DetailScreen({ stock, prices, patternData: initialPd, aiAnalysis, aiLoading, onFetchAi, kapNews, tab, setTab, timeframe, setTimeframe, onBack }: any) {
let currentChange = Number(prices[`${stock.symbol}_change`] ?? stock.change ?? 0);
if (!Number.isFinite(currentChange)) currentChange = 0;

// Use adjusted technicals for the detail screen to match live price action
const pd = useMemo(() => stock.pd || getAdjustedTechnicals(stock.symbol, currentChange), [stock.symbol, currentChange, stock.pd]);

let price = Number(prices[stock.symbol] ?? stock.price ?? 0);
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
      HEDEF KAR % {potential.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
        { l: "MACD", v: `${pd.macd > 0 ? "▲" : "▼"} ${pd.macd}`, good: pd.macd > 0 },
        { l: "FIB", v: pd.fibLevel, good: true },
        { l: "MA", v: `${(isShort ? stock.maSellCount : stock.maBuyCount) ?? Math.round((stock.techScore || 50) / 100 * 12)}/12`, good: isShort ? (stock.maSellCount || 0) >= 10 : (stock.maBuyCount || 0) >= 10 },
        { l: "SKOR", v: `${Math.round(potential)}`, good: potential > 70 },
        { l: "POT.", v: `+%${potential.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, good: true },
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
