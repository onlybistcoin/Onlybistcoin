
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };
import * as cheerio from "cheerio";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const BIST_SYMBOLS = ["THYAO", "GARAN", "AKBNK", "EREGL"];

async function fetchGoogleFinancePrice(symbol: string) {
  const url = `https://www.google.com/finance/quote/${symbol}`;
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`Response for ${symbol}: ${res.status}`);
    if (res.ok) {
      const text = await res.text();
      const $ = cheerio.load(text);
      const price = $('div[data-last-price]').attr('data-last-price');
      if (price) return parseFloat(price.replace(/,/g, ''));
      
      const price2 = $('.YMlS1d').text();
      if (price2) return parseFloat(price2.replace(/,/g, ''));
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
        console.log(`Added ${symbol} to batch: ${price}`);
      } else {
        console.log(`Failed to get price for ${symbol}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }

    if (count > 0) {
      console.log(`Committing batch of ${count} prices...`);
      await batch.commit();
      console.log(`Batch committed successfully`);
    }
  } catch (err) {
    console.error("Update failed:", err);
  }
  console.log("Exiting process");
  process.exit(0);
}

updateBistPrices();
