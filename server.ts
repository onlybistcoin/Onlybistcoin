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

      // Stage 2: If symbols are still missing, try individual strategies
      if (Object.keys(finalResult).length < symbolList.length) {
        for (const sym of symbolList) {
          if (finalResult[sym]) continue;

          let symSuccess = false;
          // Strategies in order of preference
          const strategies = [
            { type: 'quote', path: '/v7/finance/quote?symbols=' },
            { type: 'quote', path: '/v6/finance/quote?symbols=' },
            { type: 'spark', path: '/v8/finance/spark?symbols=' },
            { type: 'chart', path: '/v8/finance/chart/' }
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
                        symbol: q.symbol
                      };
                      symSuccess = true;
                    }
                  } else if (strategy.type === 'spark') {
                    const item = data.spark?.result?.[0];
                    if (item?.response?.[0]) {
                      const meta = item.response[0].meta;
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
            // Last ditch effort: Try to search for the symbol to see if it has a different suffix
            try {
              const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(sym.split('.')[0])}`;
              const searchRes = await fetch(searchUrl, { headers: commonHeaders });
              if (searchRes.ok) {
                const searchData = await searchRes.json();
                const firstResult = searchData.quotes?.[0];
                if (firstResult && firstResult.symbol !== sym) {
                  console.log(`[Yahoo Proxy] Found alternative symbol for ${sym}: ${firstResult.symbol}`);
                  // Try to fetch the alternative symbol
                  for (const base of bases) {
                    const altUrl = `${base}/v7/finance/quote?symbols=${encodeURIComponent(firstResult.symbol)}`;
                    const altRes = await fetch(altUrl, { headers: commonHeaders });
                    if (altRes.ok) {
                      const altData = await altRes.json();
                      const q = altData.quoteResponse?.result?.[0];
                      if (q) {
                        finalResult[sym] = {
                          price: q.regularMarketPrice,
                          change: q.regularMarketChangePercent || 0,
                          previousClose: q.regularMarketPreviousClose,
                          symbol: sym // Map it back to the requested symbol
                        };
                        symSuccess = true;
                        break;
                      }
                    }
                  }
                }
              }
            } catch (e) { /* ignore search errors */ }
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
