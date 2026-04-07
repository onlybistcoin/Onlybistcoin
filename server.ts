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
  const CACHE_TTL = 60000; // 1 minute cache
  let requestQueue = Promise.resolve();
  const MIN_REQUEST_GAP = 500; // Minimum 0.5 seconds between outgoing requests to Yahoo

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
      
      // Rate limit outgoing requests using a queue
      await new Promise<void>((resolve) => {
        requestQueue = requestQueue.then(async () => {
          resolve();
          await new Promise(r => setTimeout(r, MIN_REQUEST_GAP));
        });
      });
      
      const commonHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      const bases = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
      const symbolList = symbols.split(",");
      let finalResult: Record<string, any> = {};
      let success = false;

      // Stage 1: Try batch quote (v7 then v6)
      for (const base of bases) {
        for (const endpoint of ["/v7/finance/quote", "/v6/finance/quote"]) {
          try {
            const url = `${base}${endpoint}?symbols=${encodeURIComponent(symbols)}`;
            const res = await fetch(url, { headers: commonHeaders });
            if (res.ok) {
              const data = await res.json();
              const quotes = data.quoteResponse?.result || [];
              if (quotes.length > 0) {
                quotes.forEach((q: any) => {
                  finalResult[q.symbol] = {
                    price: q.regularMarketPrice,
                    change: q.regularMarketChangePercent || 0,
                    previousClose: q.regularMarketPreviousClose,
                    volume: q.regularMarketVolume || 0,
                    symbol: q.symbol
                  };
                });
                if (Object.keys(finalResult).length >= symbolList.length) {
                  success = true;
                  break;
                }
              }
            }
          } catch (e) { /* silent fail for batch */ }
        }
        if (success) break;
      }

      if (Object.keys(finalResult).length < symbolList.length) {
        const missing = symbolList.filter(s => !finalResult[s]);
        console.warn(`[Yahoo Proxy] Missing symbols from batch: ${missing.join(", ")}`);
        for (const sym of symbolList) {
          if (finalResult[sym]) continue;

          let symSuccess = false;
          // Strategies in order of preference
          const strategies = [
            { type: 'quote', path: '/v7/finance/quote?symbols=' },
            { type: 'spark', path: '/v8/finance/spark?symbols=' }
          ];

          for (const strategy of strategies) {
            for (const base of bases) {
              try {
                let url = "";
                if (strategy.type === 'chart') {
                  url = `${base}${strategy.path}${encodeURIComponent(sym)}?range=1d&interval=5m`;
                } else if (strategy.type === 'quote') {
                  url = `${base}${strategy.path}${encodeURIComponent(sym)}`;
                } else {
                  url = `${base}${strategy.path}${encodeURIComponent(sym)}&range=1d&interval=5m`;
                }
                
                const res = await fetch(url, { headers: commonHeaders });
                if (res.ok) {
                  const data = await res.json();
                  
                  if (strategy.type === 'quote') {
                    const q = data.quoteResponse?.result?.[0];
                    if (q) {
                      finalResult[sym] = {
                        price: q.regularMarketPrice,
                        change: q.regularMarketChangePercent || 0,
                        previousClose: q.regularMarketPreviousClose,
                        volume: q.regularMarketVolume || 0,
                        symbol: q.symbol
                      };
                      symSuccess = true;
                    }
                  } else if (strategy.type === 'spark') {
                    // Spark endpoint can return data[sym] directly or data.spark.result
                    let item = data[sym];
                    if (!item && data.spark?.result?.[0]?.response?.[0]) {
                       const meta = data.spark.result[0].response[0].meta;
                       item = {
                         close: [meta.regularMarketPrice],
                         previousClose: meta.previousClose
                       };
                    }
                    
                    if (item && item.close && item.close.length > 0) {
                      const price = item.close[item.close.length - 1];
                      const prevClose = item.previousClose;
                      finalResult[sym] = {
                        price: price,
                        change: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
                        previousClose: prevClose,
                        symbol: sym
                      };
                      symSuccess = true;
                    }
                  } else if (strategy.type === 'chart') {
                    const result = data.chart?.result?.[0];
                    if (result?.meta) {
                      const meta = result.meta;
                      const price = meta.regularMarketPrice;
                      const prevClose = meta.previousClose;
                      finalResult[sym] = {
                        price: price,
                        change: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
                        previousClose: prevClose,
                        symbol: sym
                      };
                      symSuccess = true;
                    }
                  }
                }
                if (symSuccess) break;
              } catch (e) { /* ignore */ }
            }
            if (symSuccess) break;
          }
          
          if (!symSuccess) {
            console.warn(`[Yahoo Proxy] Failed to fetch data for: ${sym}`);
          }
          await new Promise(r => setTimeout(r, 50));
        }
        if (Object.keys(finalResult).length > 0) success = true;
      }

      if (success) {
        console.log(`[Yahoo Proxy] Successfully fetched ${Object.keys(finalResult).length} symbols: ${Object.keys(finalResult).join(", ")}`);
        cache[cacheKey] = { data: finalResult, timestamp: Date.now() };
        return res.json(finalResult);
      }

      console.warn(`[Yahoo Proxy] All strategies failed for ${symbols}`);
      // Final fallback: Stale cache
      if (cached) {
        console.log(`[Yahoo Proxy] Serving stale data for ${symbols.substring(0, 20)}...`);
        return res.json(cached.data);
      }
      
      return res.json({});
    } catch (error) {
      console.error("[Yahoo Proxy] Fatal Error:", error);
      res.status(500).json({ error: "Internal server error" });
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
