import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkBist() {
  const docRef = doc(db, "prices", "THYAO");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log("THYAO data:", docSnap.data());
  } else {
    console.log("No such document!");
  }
  process.exit(0);
}

checkBist();
