
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, writeBatch } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function fetchGoogleFinancePrice(symbol: string) {
  const url = `https://www.google.com/finance/quote/${symbol}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/data-last-price="([^"]+)"/);
      if (match) return parseFloat(match[1].replace(/,/g, ''));
      
      const match2 = text.match(/class="YMlS1d"[^>]*>([^<]+)</);
      if (match2) return parseFloat(match2[1].replace(/,/g, ''));
    }
  } catch (err) {
    console.error(`[GoogleFinance] Failed for ${symbol}:`, err);
  }
  return null;
}

async function run() {
  const symbol = "THYAO:IST";
  const price = await fetchGoogleFinancePrice(symbol);
  console.log(`Price for ${symbol}:`, price);
  
  if (price) {
    await setDoc(doc(db, "prices", "THYAO"), {
      symbol: "THYAO",
      price: price,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log("Updated THYAO in DB");
  }

  const fxRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
  const fxData = await fxRes.json();
  console.log("USDTRY:", fxData.rates.TRY);
  
  if (fxData.rates.TRY) {
    await setDoc(doc(db, "prices", "TRY=X"), {
      symbol: "TRY=X",
      price: fxData.rates.TRY,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log("Updated TRY=X in DB");
  }
}

run();
