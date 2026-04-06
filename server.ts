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
      
      // Use the 'quote' endpoint which is more reliable for current prices than 'spark'
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&_=${Date.now()}`;
      console.log(`Fetching Yahoo Quote: ${symbols.substring(0, 30)}...`);
      
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
        
        if (cached) {
          console.log("Serving stale cache due to API error");
          return res.json(cached.data);
        }
        
        return res.status(response.status).json({ error: `Yahoo API responded with status: ${response.status}`, details: errorText });
      }
      
      const data = await response.json();
      const result: Record<string, any> = {};
      
      if (data.quoteResponse && data.quoteResponse.result) {
        data.quoteResponse.result.forEach((item: any) => {
          if (item && item.symbol) {
            const price = item.regularMarketPrice;
            const change = item.regularMarketChangePercent;
            const prevClose = item.regularMarketPreviousClose || (price / (1 + change / 100));

            result[item.symbol] = {
              price: price,
              change: change,
              previousClose: prevClose,
              symbol: item.symbol
            };
          }
        });
      } else if (data.quoteResponse && data.quoteResponse.error) {
        console.error("Yahoo Quote Error:", data.quoteResponse.error);
        if (cached) return res.json(cached.data);
        throw new Error(`Yahoo Quote Error: ${JSON.stringify(data.quoteResponse.error)}`);
      }
      
      // Update cache
      if (Object.keys(result).length > 0) {
        cache[cacheKey] = { data: result, timestamp: Date.now() };
      }
      
      console.log(`Successfully fetched ${Object.keys(result).length} symbols`);
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
