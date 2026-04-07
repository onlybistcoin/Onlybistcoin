
import * as finnhub from "finnhub";
import "dotenv/config";

const finnhubKey = process.env.VITE_FINNHUB_API_KEY || "";
if (!finnhubKey) {
  console.error("No Finnhub key found");
  process.exit(1);
}

// The package exports DefaultApi directly in version 2.0.13
const finnhubModule: any = (finnhub as any).default || finnhub;
const DefaultApi = finnhubModule.DefaultApi;

const finnhubClient = new DefaultApi(finnhubKey);

async function testFinnhub() {
  console.log("Testing Finnhub with key:", finnhubKey.substring(0, 5) + "...");
  
  // Try a BIST symbol
  finnhubClient.quote("THYAO.IS", (error: any, data: any) => {
    if (error) {
      console.error("Finnhub error for THYAO.IS:", error);
    } else {
      console.log("Finnhub data for THYAO.IS:", JSON.stringify(data, null, 2));
    }
    
    // Try a Commodity/FX symbol
    finnhubClient.quote("OANDA:XAU_USD", (error2: any, data2: any) => {
      if (error2) {
        console.error("Finnhub error for XAU_USD:", error2);
      } else {
        console.log("Finnhub data for XAU_USD:", JSON.stringify(data2, null, 2));
      }
      process.exit(0);
    });
  });
}

testFinnhub();
