// MongoDB Script to Setup Test Users
// Adds both Seller (Shan) and Buyer (Ali)
// Run this in MongoDB Shell or Compass

print("\n╔══════════════════════════════════════════════════════════╗");
print("║       Setting Up P2P Marketplace Test Users            ║");
print("╚══════════════════════════════════════════════════════════╝\n");

// ═══════════════════════════════════════════════════════════
// 1. Add SELLER: Shan (10,000 hens)
// ═══════════════════════════════════════════════════════════

print("📦 Creating Seller: Shan...");

db.users.insertOne({
  name: "Shan",
  email: "shanmaqbool12345@gmail.com",
  phone: "03069829158",
  password: "Shan7426@",
  balance: 0,
  totalInvested: 0,
  lifetimeEarnings: 0,
  referralCode: "SHAN001",
  referralEarnings: 0,
  totalReferrals: 0,
  location: "Pakistan",
  rating: 5.0,
  verified: true,
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

const seller = db.users.findOne({ email: "shanmaqbool12345@gmail.com" });
print("✅ Seller 'Shan' created!");
print("   ID: " + seller._id);

// Add 10 batches of 1,000 hens each (10,000 total)
print("   Adding 10,000 hens...");
for (let i = 1; i <= 10; i++) {
  db.henbatches.insertOne({
    userId: seller._id,
    henCount: 1000,
    pricePerHen: 900,
    totalInvestment: 900000,
    totalEarnings: 0,
    dailyEarningRate: 35,
    purchaseDate: new Date(Date.now() - (i * 10 * 24 * 60 * 60 * 1000)),
    cycleEndDate: new Date(Date.now() + (90 - i * 10) * 24 * 60 * 60 * 1000),
    status: "active",
    daysCompleted: i * 10,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
print("✅ 10,000 hens added to Shan's inventory\n");

// ═══════════════════════════════════════════════════════════
// 2. Add BUYER: Ali (Rs 50,000 balance)
// ═══════════════════════════════════════════════════════════

print("👤 Creating Buyer: Ali...");

db.users.insertOne({
  name: "Ali",
  email: "ali@mailinator.com",
  phone: "03001234567",
  password: "Shan7426@",
  balance: 50000,
  totalInvested: 0,
  lifetimeEarnings: 0,
  referralCode: "ALI001",
  referralEarnings: 0,
  totalReferrals: 0,
  location: "Lahore",
  rating: 0,
  verified: false,
  easyPaisaAccount: "",
  jazzCashAccount: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountTitle: "",
  whatsappNumber: "+923001234567",
  availableEggs: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

const buyer = db.users.findOne({ email: "ali@mailinator.com" });
print("✅ Buyer 'Ali' created!");
print("   ID: " + buyer._id);
print("   Balance: Rs 50,000\n");

// ═══════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════

print("╔══════════════════════════════════════════════════════════╗");
print("║                  SETUP COMPLETE! ✅                      ║");
print("╚══════════════════════════════════════════════════════════╝\n");

print("SELLER (Shan):");
print("──────────────────────────────────────────────────────────");
print("Email:       shanmaqbool12345@gmail.com");
print("Password:    Shan7426@");
print("Phone:       03069829158");
print("EasyPaisa:   03069829158");
print("JazzCash:    03069829158");
print("WhatsApp:    +923069829158");
print("Hens:        10,000 available");
print("Price:       Rs 900/hen");
print("Verified:    ✓ Yes");
print("Rating:      ⭐⭐⭐⭐⭐ (5.0)\n");

print("BUYER (Ali):");
print("──────────────────────────────────────────────────────────");
print("Email:       ali@mailinator.com");
print("Password:    Shan7426@");
print("Phone:       03001234567");
print("WhatsApp:    +923001234567");
print("Balance:     Rs 50,000");
print("Location:    Lahore\n");

print("TEST FLOW:");
print("──────────────────────────────────────────────────────────");
print("1. Login as Ali (ali@mailinator.com)");
print("2. Go to Marketplace → See Shan with 10,000 hens");
print("3. Click 'Buy Hens' → Create order for 10 hens");
print("4. See Shan's payment details");
print("5. Send money to Shan's EasyPaisa: 03069829158");
print("6. Contact Shan on WhatsApp: +923069829158");
print("7. Login as Shan (shanmaqbool12345@gmail.com)");
print("8. Go to Orders → Pending Approvals");
print("9. Approve Ali's order");
print("10. Ali gets 10 hens in 'My Hens' tab! 🎉\n");

print("API TEST:");
print("──────────────────────────────────────────────────────────");
print("curl http://localhost:3000/api/marketplace/sellers");
print("\nShould show Shan with 10,000 hens available!\n");

print("═══════════════════════════════════════════════════════════\n");
