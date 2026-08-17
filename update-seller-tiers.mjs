import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set. Load your .env or export it before running this script.');
  process.exit(1);
}
await mongoose.connect(uri);
const db = mongoose.connection.db;

// The 4 trusted, verified, "online" dealers - each with 8000+ hens.
const TRUSTED = {
  'Chaudhry Bilal Layers & Farm': 9200,
  'Tariq Mahmood Poultry Farm': 8800,
  'Multan Layer Hub': 8500,
  'Gujranwala Avian Supply': 8000,
};

for (const [name, hens] of Object.entries(TRUSTED)) {
  const r = await db.collection('users').updateOne(
    { name, role: 'seller' },
    { $set: { verified: true, availableHens: hens } },
  );
  console.log(`Trusted: ${name} -> verified, ${hens} hens (matched ${r.matchedCount})`);
}

const r2 = await db.collection('users').updateMany(
  { role: 'seller', name: { $nin: Object.keys(TRUSTED) } },
  { $set: { verified: false } },
);
console.log(`Un-verified ${r2.modifiedCount} other sellers`);

const sellers = await db.collection('users').find({ role: 'seller' }).sort({ verified: -1, availableHens: -1 }).toArray();
console.log(`\nFinal: ${sellers.length} total, ${sellers.filter(s => s.verified).length} verified`);
for (const s of sellers) console.log({ name: s.name, verified: s.verified, availableHens: s.availableHens });

await mongoose.disconnect();
