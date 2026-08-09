// MongoDB Script to Add Seller: Shan
// Run this in MongoDB Shell or Compass

// ═══════════════════════════════════════════════════════════
// Add Shan as Verified Seller with 10,000 Hens
// ═══════════════════════════════════════════════════════════

db.users.insertOne({
  name: "Shan",
  email: "shanmaqbool12345@gmail.com",
  phone: "03069829158",
  password: "Shan7426@", // In production, this should be hashed!
  balance: 0,
  totalInvested: 0,
  lifetimeEarnings: 0,
  referralCode: "SHAN001",
  referralEarnings: 0,
  totalReferrals: 0,
  location: "Pakistan",
  rating: 5.0,
  verified: true,
  
  // P2P Payment Details
  easyPaisaAccount: "03069829158",
  jazzCashAccount: "03069829158",
  bankName: "",
  bankAccountNumber: "",
  bankAccountTitle: "Shan",
  whatsappNumber: "+923069829158",
  availableEggs: 0,
  
  createdAt: new Date(),
  updatedAt: new Date()
});

print("\n✅ Seller 'Shan' created successfully!");
print("📧 Email: shanmaqbool12345@gmail.com");
print("📱 Phone: 03069829158");
print("💳 EasyPaisa: 03069829158");
print("💰 JazzCash: 03069829158");

// Get the seller ID
const seller = db.users.findOne({ email: "shanmaqbool12345@gmail.com" });
print("\n🆔 Seller ID: " + seller._id);

// ═══════════════════════════════════════════════════════════
// Add 10,000 Hens for Shan (as active hen batches)
// ═══════════════════════════════════════════════════════════

// Option 1: Create as multiple batches (recommended for realistic scenario)
// 10 batches of 1,000 hens each

for (let i = 1; i <= 10; i++) {
  db.henbatches.insertOne({
    userId: seller._id,
    henCount: 1000,
    pricePerHen: 900,
    totalInvestment: 900000, // 1000 * 900
    totalEarnings: 0,
    dailyEarningRate: 35,
    purchaseDate: new Date(Date.now() - (i * 10 * 24 * 60 * 60 * 1000)), // Staggered dates
    cycleEndDate: new Date(Date.now() + (90 - i * 10) * 24 * 60 * 60 * 1000),
    status: "active",
    daysCompleted: i * 10,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

print("\n✅ 10 hen batches created (10,000 hens total)");
print("📊 Each batch: 1,000 hens");
print("💰 Price per hen: Rs 900");
print("🐔 Total hens available: 10,000");

// ═══════════════════════════════════════════════════════════
// Verify the setup
// ═══════════════════════════════════════════════════════════

const totalBatches = db.henbatches.countDocuments({ userId: seller._id });
const totalHens = db.henbatches.aggregate([
  { $match: { userId: seller._id, status: "active" } },
  { $group: { _id: null, total: { $sum: "$henCount" } } }
]).toArray();

print("\n📈 Summary:");
print("Total Batches: " + totalBatches);
print("Total Active Hens: " + (totalHens.length > 0 ? totalHens[0].total : 0));
print("Daily Earnings: Rs " + (totalHens.length > 0 ? totalHens[0].total * 35 : 0));

print("\n═══════════════════════════════════════════════════════════");
print("✅ Shan is now ready to sell hens in the marketplace!");
print("═══════════════════════════════════════════════════════════\n");

// ═══════════════════════════════════════════════════════════
// Test API Call (for reference)
// ═══════════════════════════════════════════════════════════

print("Test with this API call:");
print("\ncurl http://localhost:3000/api/marketplace/sellers");
print("\nShould show Shan with 10,000 hens available!\n");
