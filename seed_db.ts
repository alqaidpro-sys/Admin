import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

import { 
  DEFAULT_SERIES, 
  DEFAULT_CHANNELS, 
  DEFAULT_MATCHES, 
  DEFAULT_BANNERS, 
  DEFAULT_SETTINGS 
} from "./src/utils/mockData";

async function run() {
  const configPath = path.resolve("./firebase-applet-config.json");
  console.log("Reading config from:", configPath);
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  console.log("Initializing Firebase with project:", firebaseConfig.projectId);
  console.log("Using custom Database ID:", firebaseConfig.firestoreDatabaseId);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log("Seeding Settings to settings/appSettings...");
  await setDoc(doc(db, "settings", "appSettings"), DEFAULT_SETTINGS);
  console.log("Settings seeded perfectly!");

  console.log("Seeding series collection...");
  for (const item of DEFAULT_SERIES) {
    await setDoc(doc(db, "series", item.id), item);
    console.log(`- Seeded series: ${item.title} (${item.id})`);
  }

  console.log("Seeding channels collection...");
  for (const item of DEFAULT_CHANNELS) {
    await setDoc(doc(db, "channels", item.id), item);
    console.log(`- Seeded channel: ${item.name} (${item.id})`);
  }

  console.log("Seeding matches collection...");
  for (const item of DEFAULT_MATCHES) {
    await setDoc(doc(db, "matches", item.id), item);
    console.log(`- Seeded match: ${item.home} vs ${item.away} (${item.id})`);
  }

  console.log("Seeding banners collection...");
  for (const item of DEFAULT_BANNERS) {
    await setDoc(doc(db, "banners", item.id), item);
    console.log(`- Seeded banner: ${item.title} (${item.id})`);
  }

  console.log("Seeding default system alert popup document...");
  await setDoc(doc(db, "system_alerts", "popup"), {
    isActive: false,
    title: "",
    message: ""
  });
  console.log("System alert popup seeded!");

  console.log("🎉 Seeding completed successfully and beautifully!");
}

run().catch((err) => {
  console.error("❌ Fatal error seeding database:", err);
  process.exit(1);
});
