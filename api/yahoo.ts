import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const symbols = req.query.symbols;
    if (!symbols) {
      return res.status(400).json({ error: "Symbols parameter is required" });
    }
    
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=1d&interval=5m&_=${Date.now()}`;
    console.log(`Fetching Yahoo data: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Yahoo API Error (${response.status}): ${errorText}`);
      throw new Error(`Yahoo API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform v8 spark response into a flat object that App.tsx expects
    const result: Record<string, any> = {};
    
    const sparkData = data.spark && data.spark.result ? data.spark.result : data;
    
    if (sparkData) {
      const items = Array.isArray(sparkData) ? sparkData : [sparkData];
      
      if (!Array.isArray(sparkData)) {
        Object.keys(sparkData).forEach(symbol => {
          const item = sparkData[symbol];
          if (item && item.close && Array.isArray(item.close)) {
            let price = null;
            for (let i = item.close.length - 1; i >= 0; i--) {
              if (item.close[i] !== null && item.close[i] !== undefined) {
                price = item.close[i];
                break;
              }
            }
            
            const prevClose = item.previousClose;
            let change = 0;
            if (price !== null && prevClose) {
              change = ((price - prevClose) / prevClose) * 100;
            }

            result[symbol] = {
              price: price,
              change: change,
              previousClose: prevClose,
              symbol: symbol
            };
          }
        });
      } else {
        sparkData.forEach((item: any) => {
          if (item && item.symbol && item.response && item.response[0]) {
            const resp = item.response[0];
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
              
              const meta = resp.meta;
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
      }
    }
    
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59');
    res.json(result);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Failed to fetch data from Yahoo", details: String(error) });
  }
}
