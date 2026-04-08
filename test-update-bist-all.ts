
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const BIST_SYMBOLS = [
    "THYAO", "GARAN", "AKBNK", "EREGL", "KCHOL", "SAHOL", "BIMAS", "TOASO", "ARCLK", "TUPRS"
];

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

async function updateBistPrices() {
  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const symbol of BIST_SYMBOLS) {
      const price = await fetchGoogleFinancePrice(`${symbol}:IST`);
      if (price) {
        const priceDoc = doc(db, "prices", symbol);
        batch.set(priceDoc, {
          symbol: symbol,
          price: price,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        count++;
        console.log(`Updated ${symbol}: ${price}`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    if (count > 0) {
      await batch.commit();
      console.log(`Updated ${count} prices`);
    }
  } catch (err) {
    console.error("Update failed:", err);
  }
}

updateBistPrices();
