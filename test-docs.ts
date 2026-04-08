import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkDocs() {
  const querySnapshot = await getDocs(collection(db, "prices"));
  const symbols = [];
  querySnapshot.forEach((doc) => {
    symbols.push(doc.id);
  });
  console.log("Symbols:", symbols.join(", "));
  process.exit(0);
}

checkDocs();
