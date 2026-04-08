import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkCount() {
  const querySnapshot = await getDocs(collection(db, "prices"));
  console.log("Total prices documents:", querySnapshot.size);
  process.exit(0);
}

checkCount();
