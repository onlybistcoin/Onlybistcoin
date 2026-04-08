
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testSetDoc() {
  try {
    console.log("Testing setDoc...");
    await setDoc(doc(db, "prices", "TEST_SETDOC"), {
      symbol: "TEST_SETDOC",
      price: 100,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log("setDoc successful");
  } catch (error) {
    console.error("setDoc error:", error);
  }
  process.exit(0);
}

testSetDoc();
