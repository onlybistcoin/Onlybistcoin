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
  const CACHE_TTL = 3000; // 3 seconds cache
  let requestQueue = Promise.resolve();
  const MIN_REQUEST_GAP = 150; // 0.15 seconds between outgoing requests

  app.get("/api/yahoo", async (req, res) => {
    try {
      const symbols = req.query.symbols as string;
      if (!symbols) {
        return res.status(400).json({ error: "Symbols parameter is required" });
      }
      
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15"
      ];

      const getHeaders = () => ({
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
      });

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
      
      const bases = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
      const symbolList = symbols.split(",");
      let finalResult: Record<string, any> = {};
      let success = false;

      // Stage 1: Try batch quote (v7 then v6)
      for (const base of bases) {
        for (const endpoint of ["/v7/finance/quote", "/v6/finance/quote", "/v8/finance/spark"]) {
          try {
            const url = `${base}${endpoint}?symbols=${encodeURIComponent(symbols)}`;
            
            console.log(`[Yahoo Proxy] Fetching batch: ${url}`);
            const fetchRes = await fetch(url, { headers: getHeaders() });
            if (fetchRes.status === 429) {
              console.warn(`[Yahoo Proxy] Rate limited (429) for ${endpoint}`);
              if (cached) {
                console.log(`[Yahoo Proxy] Serving cached data due to rate limit`);
                return res.json(cached.data);
              }
            }
            if (fetchRes.ok) {
              let data;
              try {
                data = await fetchRes.json();
              } catch (parseErr) {
                console.error(`[Yahoo Proxy] JSON parse error for batch: ${url}`);
                continue;
              }
              
              if (endpoint.includes("spark")) {
                let sparkData = data;
                if (data.spark?.result?.[0]?.response) {
                  // Handle alternative spark format
                  data.spark.result[0].symbol.forEach((s: string, idx: number) => {
                    const meta = data.spark.result[0].response[idx]?.meta;
                    if (meta) {
                      finalResult[s] = {
                        price: meta.regularMarketPrice,
                        change: meta.previousClose ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 : 0,
                        previousClose: meta.previousClose,
                        symbol: s
                      };
                    }
                  });
                } else {
                  Object.keys(sparkData).forEach(s => {
                    const item = sparkData[s];
                    if (item && item.close && item.close.length > 0) {
                      finalResult[s] = {
                        price: item.close[item.close.length - 1],
                        change: item.previousClose ? ((item.close[item.close.length - 1] - item.previousClose) / item.previousClose) * 100 : 0,
                        previousClose: item.previousClose,
                        symbol: s
                      };
                    }
                  });
                }
              } else {
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
                }
              }
              
              if (Object.keys(finalResult).length >= symbolList.length) {
                success = true;
                break;
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
            { type: 'spark', path: '/v8/finance/spark?symbols=' },
            { type: 'chart', path: '/v8/finance/chart/' },
            { type: 'summary', path: '/v10/finance/quoteSummary/' },
            { type: 'options', path: '/v7/finance/options/' }
          ];

          for (const strategy of strategies) {
            for (const base of bases) {
              try {
                let url = "";
                if (strategy.type === 'chart') {
                  url = `${base}${strategy.path}${encodeURIComponent(sym)}?range=1d&interval=5m`;
                } else if (strategy.type === 'quote') {
                  url = `${base}${strategy.path}${encodeURIComponent(sym)}`;
                } else if (strategy.type === 'summary') {
                  url = `${base}${strategy.path}${encodeURIComponent(sym)}?modules=price`;
                } else {
                  url = `${base}${strategy.path}${encodeURIComponent(sym)}&range=1d&interval=5m`;
                }
                
                console.log(`[Yahoo Proxy] Stage 2 Fetching ${sym} via ${strategy.type}: ${url}`);
                const fetchRes = await fetch(url, { headers: getHeaders() });
                if (fetchRes.status === 429) {
                  console.warn(`[Yahoo Proxy] Rate limited (429) for ${sym}`);
                  await new Promise(r => setTimeout(r, 1000)); // Wait longer on 429
                  break; // Stop trying strategies for this symbol
                }
                console.log(`[Yahoo Proxy] Stage 2 Status: ${fetchRes.status} for ${sym}`);
                if (fetchRes.ok) {
                  const data = await fetchRes.json();
                  
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
                      console.log(`[Yahoo Proxy] Stage 2 Success for ${sym} via ${strategy.type}`);
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
                      console.log(`[Yahoo Proxy] Stage 2 Success for ${sym} via ${strategy.type}`);
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
                      console.log(`[Yahoo Proxy] Stage 2 Success for ${sym} via ${strategy.type}`);
                    }
                  } else if (strategy.type === 'summary') {
                    const priceData = data.quoteSummary?.result?.[0]?.price;
                    if (priceData) {
                      finalResult[sym] = {
                        price: priceData.regularMarketPrice?.raw || priceData.regularMarketPrice,
                        change: priceData.regularMarketChangePercent?.raw * 100 || 0,
                        previousClose: priceData.regularMarketPreviousClose?.raw,
                        symbol: sym
                      };
                      symSuccess = true;
                      console.log(`[Yahoo Proxy] Stage 2 Success for ${sym} via ${strategy.type}`);
                    }
                  } else if (strategy.type === 'options') {
                    const q = data.optionChain?.result?.[0]?.quote;
                    if (q) {
                      finalResult[sym] = {
                        price: q.regularMarketPrice,
                        change: q.regularMarketChangePercent || 0,
                        previousClose: q.regularMarketPreviousClose,
                        volume: q.regularMarketVolume || 0,
                        symbol: q.symbol
                      };
                      symSuccess = true;
                      console.log(`[Yahoo Proxy] Stage 2 Success for ${sym} via ${strategy.type}`);
                    }
                  }
                }
                if (symSuccess) break;
              } catch (e) { /* ignore */ }
            }
            if (symSuccess) break;
          }
          
          if (!symSuccess) {
            // Final attempt: Search for the symbol if it's a crypto
            if (sym.endsWith("-USD")) {
              try {
                const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(sym.split("-")[0])}`;
                console.log(`[Yahoo Proxy] Stage 3 Searching for ${sym}: ${searchUrl}`);
                const searchRes = await fetch(searchUrl, { headers: getHeaders() });
                if (searchRes.ok) {
                  const searchData = await searchRes.json();
                  const foundSym = searchData.quotes?.[0]?.symbol;
                  if (foundSym && foundSym !== sym) {
                    console.log(`[Yahoo Proxy] Stage 3 Found alternative for ${sym}: ${foundSym}`);
                    // Try to fetch the found symbol via quote
                    const quoteUrl = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(foundSym)}`;
                    const quoteRes = await fetch(quoteUrl, { headers: getHeaders() });
                    if (quoteRes.ok) {
                      const qData = await quoteRes.json();
                      const q = qData.quoteResponse?.result?.[0];
                      if (q) {
                        finalResult[sym] = {
                          price: q.regularMarketPrice,
                          change: q.regularMarketChangePercent || 0,
                          previousClose: q.regularMarketPreviousClose,
                          volume: q.regularMarketVolume || 0,
                          symbol: q.symbol
                        };
                        symSuccess = true;
                        console.log(`[Yahoo Proxy] Stage 3 Success for ${sym} via alternative ${foundSym}`);
                      }
                    }
                  }
                }
              } catch (e) { /* ignore */ }
            }
          }

          if (!symSuccess) {
            console.warn(`[Yahoo Proxy] Failed to fetch data for: ${sym}`);
          }
          await new Promise(r => setTimeout(r, 200));
        }
        // Manual Gram Gold/Silver calculation
      if (!finalResult["GAU=X"] || !finalResult["GAG=X"]) {
        const gold = finalResult["GC=F"]?.price;
        const silver = finalResult["SI=F"]?.price;
        const usltry = finalResult["TRY=X"]?.price;
        
        if (usltry) {
          if (gold && !finalResult["GAU=X"]) {
            const gramGold = (gold / 31.1035) * usltry;
            finalResult["GAU=X"] = { price: gramGold, change: finalResult["GC=F"].change, symbol: "GAU=X" };
          }
          if (silver && !finalResult["GAG=X"]) {
            const gramSilver = (silver / 31.1035) * usltry;
            finalResult["GAG=X"] = { price: gramSilver, change: finalResult["SI=F"].change, symbol: "GAG=X" };
          }
        }
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
