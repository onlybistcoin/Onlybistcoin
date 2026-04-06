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
      
      // Use v7 which is the standard stable endpoint
      let url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
      console.log(`[Yahoo Proxy] Fetching (v7): ${symbols.substring(0, 40)}...`);
      
      const commonHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://finance.yahoo.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      };

      let response = await fetch(url, { headers: commonHeaders });
      
      // If v7 fails with 401 or 404, try v6 quote endpoint as a fallback
      if (response.status === 401 || response.status === 404) {
        console.warn(`[Yahoo Proxy] v7 returned ${response.status}, trying v6 fallback...`);
        url = `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(symbols)}`;
        response = await fetch(url, { headers: commonHeaders });
      }

      let sparkResult: Record<string, any> = {};

      // If v6 also fails, try v8 spark endpoint as a last resort (one by one to avoid 400)
      if (response.status === 401 || response.status === 404) {
        console.warn(`[Yahoo Proxy] v6 returned ${response.status}, trying v8 spark fallback (individual)...`);
        const symbolList = symbols.split(",");
        for (const sym of symbolList) {
          try {
            const sparkUrl = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(sym)}&range=1d&interval=5m`;
            const sparkRes = await fetch(sparkUrl, { headers: commonHeaders });
            if (sparkRes.ok) {
              const sparkData = await sparkRes.json();
              if (sparkData.spark && sparkData.spark.result && sparkData.spark.result[0]) {
                const item = sparkData.spark.result[0];
                if (item.response && item.response[0]) {
                  const resp = item.response[0];
                  const meta = resp.meta;
                  const price = meta.regularMarketPrice;
                  const prevClose = meta.previousClose;
                  let change = 0;
                  if (price !== null && prevClose) {
                    change = ((price - prevClose) / prevClose) * 100;
                  }
                  sparkResult[item.symbol] = {
                    price: price,
                    change: change,
                    previousClose: prevClose,
                    symbol: item.symbol
                  };
                }
              }
            }
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 100));
          } catch (e) {
            console.error(`Spark fetch error for ${sym}:`, e);
          }
        }
        
        if (Object.keys(sparkResult).length > 0) {
          // We already populated sparkResult, so we can skip the rest of the parsing
          if (cached) {
             // Merge with cache if some failed
             const merged = { ...cached.data, ...sparkResult };
             cache[cacheKey] = { data: merged, timestamp: Date.now() };
             return res.json(merged);
          }
          cache[cacheKey] = { data: sparkResult, timestamp: Date.now() };
          return res.json(sparkResult);
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Yahoo Proxy] API Error (${response.status}): ${errorText.substring(0, 100)}`);
        
        if (cached) {
          console.log("[Yahoo Proxy] Serving stale cache due to API error");
          return res.json(cached.data);
        }
        
        // Return 200 with empty object instead of 404 to prevent frontend "Load failed"
        return res.json({});
      }
      
      const data = await response.json();
      const result: Record<string, any> = {};
      
      // Handle v6/v7 quote response
      if (data.quoteResponse && data.quoteResponse.result && Array.isArray(data.quoteResponse.result)) {
        data.quoteResponse.result.forEach((item: any) => {
          if (item && item.symbol) {
            const price = item.regularMarketPrice;
            const change = item.regularMarketChangePercent;
            const prevClose = item.regularMarketPreviousClose || (price / (1 + (change || 0) / 100));

            result[item.symbol] = {
              price: price,
              change: change || 0,
              previousClose: prevClose,
              symbol: item.symbol
            };
          }
        });
      } 
      // Handle v8 spark response (fallback)
      else if (data.spark && data.spark.result) {
        data.spark.result.forEach((item: any) => {
          if (item && item.symbol && item.response && item.response[0]) {
            const resp = item.response[0];
            const meta = resp.meta;
            const price = meta.regularMarketPrice;
            const prevClose = meta.previousClose;
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
        });
      }
      else {
        console.warn("[Yahoo Proxy] Unexpected response structure:", JSON.stringify(data).substring(0, 200));
      }
      
      // Update cache even if result is empty (to prevent immediate retries)
      if (Object.keys(result).length > 0) {
        cache[cacheKey] = { data: result, timestamp: Date.now() };
        console.log(`[Yahoo Proxy] Successfully fetched ${Object.keys(result).length} symbols`);
      } else {
        console.warn("[Yahoo Proxy] No symbols found in response");
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
