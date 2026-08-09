// MongoDB Setup Script for P2P Marketplace Testing
// Run this in MongoDB shell or Compass

// ═══════════════════════════════════════════════════════════
// Step 1: Create Test Buyer User
// ═══════════════════════════════════════════════════════════

db.users.insertOne({
  name: "Test Buyer",
  email: "buyer@test.com",
  phone: "03001111111",
  balance: 10000,
  totalInvested: 0,
  lifetimeEarnings: 0,
  referralCode: "BUYER123",
  referralEarnings: 0,
  totalReferrals: 0,
  location: "Lahore",
  rating: 0,
  verified: false,
  availableEggs: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

// ═══════════════════════════════════════════════════════════
// Step 2: Create Test Seller User (with payment details)
// ═══════════════════════════════════════════════════════════

db.users.insertOne({
  name: "Test Seller",
  email: "seller@test.com",
  phone: "03009999999",
  balance: 0,
  totalInvested: 0,
  lifetimeEarnings: 0,
  referralCode: "SELLER456",
  referralEarnings: 0,
  totalReferrals: 0,
  location: "Karachi",
  rating: 4.5,
  verified: true,
  // P2P Payment Details
  easyPaisaAccount: "03009999999",
  jazzCashAccount: "03009999999",
  bankName: "Meezan Bank",
  bankAccountNumber: "12345678901234",
  bankAccountTitle: "Test Seller",
  whatsappNumber: "+923009999999",
  availableEggs: 200, // Seller has 200 eggs available
  createdAt: new Date(),
  updatedAt: new Date()
});

// ═══════════════════════════════════════════════════════════
// Step 3: Get User IDs (run these queries to get IDs)
// ═══════════════════════════════════════════════════════════

print("\n=== User IDs ===");
const buyer = db.users.findOne({ email: "buyer@test.com" });
const seller = db.users.findOne({ email: "seller@test.com" });

print("Buyer ID: " + buyer._id);
print("Seller ID: " + seller._id);

// ═══════════════════════════════════════════════════════════
// Step 4: Create Sample Hen Batches for Seller
// ═══════════════════════════════════════════════════════════

db.henbatches.insertOne({
  userId: seller._id,
  henCount: 20,
  pricePerHen: 900,
  totalInvestment: 18000,
  totalEarnings: 0,
  dailyEarningRate: 35,
  purchaseDate: new Date(),
  cycleEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  status: "active",
  daysCompleted: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("\n=== Test Data Setup Complete! ===");
print("\nYou can now:");
print("1. Create orders via API");
print("2. Test approval/rejection flow");
print("3. Verify hen and egg transfers");

print("\n=== Quick Test Commands ===");
print("\n// Create Buy-Hen Order:");
print('curl -X POST http://localhost:3000/api/orders/create \\');
print('  -H "Content-Type: application/json" \\');
print('  -d \'{"buyerId":"' + buyer._id + '","sellerId":"' + seller._id + '","orderType":"buy-hen","quantity":5,"pricePerUnit":900}\'');

print("\n// Get Buyer's Orders:");
print('curl http://localhost:3000/api/orders/my-orders/' + buyer._id);

print("\n// Get Seller's Pending Approvals:");
print('curl http://localhost:3000/api/orders/pending-approvals/' + seller._id);

print("\n");
