import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // API route to proxy Yahoo Finance requests for real-time quotes
  // Simple in-memory cache to prevent 429 errors
  const cache: Record<string, { data: any, timestamp: number }> = {};
  const CACHE_TTL = 300000; // 5 minutes cache
  let lastRequestTime = 0;
  const MIN_REQUEST_GAP = 2000; // Minimum 2 seconds between outgoing requests to Yahoo

  app.get("/api/yahoo", async (req, res) => {
    try {
      const symbols = req.query.symbols as string;
      if (!symbols) {
        return res.status(400).json({ error: "Symbols parameter is required" });
      }
      
      // Check cache first
      const cacheKey = symbols;
      const cached = cache[cacheKey];
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json(cached.data);
      }
      
      // Rate limit outgoing requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_GAP) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLastRequest));
      }
      lastRequestTime = Date.now();
      
      const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1d&interval=5m&_=${Date.now()}`;
      console.log(`Fetching Yahoo data: ${symbols.substring(0, 20)}...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com/'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Yahoo API Error (${response.status}): ${errorText}`);
        
        // If we have stale cache, serve it on error
        if (cached) {
          console.log("Serving stale cache due to API error");
          return res.json(cached.data);
        }
        
        return res.status(response.status).json({ error: `Yahoo API responded with status: ${response.status}`, details: errorText });
      }
      
      const data = await response.json();
      const result: Record<string, any> = {};
      
      if (data.spark && data.spark.result) {
        data.spark.result.forEach((item: any) => {
          if (item && item.symbol && item.response && item.response[0]) {
            const resp = item.response[0];
            const meta = resp.meta;
            const indicators = resp.indicators && resp.indicators.quote && resp.indicators.quote[0];
            const close = indicators && indicators.close;
            
            if (close && Array.isArray(close)) {
              let price = null;
              for (let i = close.length - 1; i >= 0; i--) {
                if (close[i] !== null && close[i] !== undefined) {
                  price = close[i];
                  break;
                }
              }
              
              if (price === null && meta && meta.regularMarketPrice) {
                price = meta.regularMarketPrice;
              }
              
              const prevClose = meta && meta.previousClose;
              let change = 0;
              if (price !== null && prevClose) {
                change = ((price - prevClose) / prevClose) * 100;
              }

              result[item.symbol] = {
                price: price,
                change: change,
                previousClose: prevClose,
                symbol: item.symbol
              };
            }
          }
        });
      } else if (data.spark && data.spark.error) {
        console.error("Yahoo Spark Error:", data.spark.error);
        if (cached) return res.json(cached.data);
        throw new Error(`Yahoo Spark Error: ${JSON.stringify(data.spark.error)}`);
      }
      
      // Update cache
      if (Object.keys(result).length > 0) {
        cache[cacheKey] = { data: result, timestamp: Date.now() };
      }
      
      res.json(result);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch data from Yahoo", details: String(error) });
    }
  });

  // REMOVED: /api/analyze route (AI Analysis moved to frontend per guidelines)

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
