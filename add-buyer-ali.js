// MongoDB Script to Add Normal User (Buyer): Ali
// Run this in MongoDB Shell or Compass

// ═══════════════════════════════════════════════════════════
// Add Ali as Normal User (Buyer)
// ═══════════════════════════════════════════════════════════

db.users.insertOne({
  name: "Ali",
  email: "ali@mailinator.com",
  phone: "03001234567",
  password: "Shan7426@", // In production, this should be hashed!
  balance: 50000, // Rs 50,000 starting balance for testing
  totalInvested: 0,
  lifetimeEarnings: 0,
  referralCode: "ALI001",
  referralEarnings: 0,
  totalReferrals: 0,
  location: "Lahore",
  rating: 0,
  verified: false, // Normal user, not verified seller
  
  // Empty payment details (buyer doesn't need to sell)
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


print("\n✅ Buyer 'Ali' created successfully!");
print("📧 Email: ali@mailinator.com");
print("🔑 Password: Shan7426@");
print("📱 Phone: 03001234567");
print("💰 Starting Balance: Rs 50,000");

// Get the buyer ID
const buyer = db.users.findOne({ email: "ali@mailinator.com" });
print("\n🆔 Buyer ID: " + buyer._id);

print("\n═══════════════════════════════════════════════════════════");
print("✅ Ali is ready to buy hens from the marketplace!");
print("═══════════════════════════════════════════════════════════\n");

// ═══════════════════════════════════════════════════════════
// Test Scenario
// ═══════════════════════════════════════════════════════════

print("Test Flow:");
print("1. Login as Ali: ali@mailinator.com / Shan7426@");
print("2. Go to Marketplace");
print("3. Buy hens from Shan");
print("4. Create order");
print("5. Contact Shan on WhatsApp");
print("6. Shan approves order");
print("7. Ali gets hens in 'My Hens' tab!\n");
