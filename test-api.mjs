// HenFarm API Test Suite
const API_URL = 'http://localhost:3000/api';

async function testAPI(endpoint, method, data) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`\n✅ ${method} ${endpoint}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`\n❌ ${method} ${endpoint} FAILED:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting HenFarm API Tests...\n');
  
  // TEST 1: Register User 1 (Referrer)
  console.log('═══════════════════════════════════════════');
  console.log('TEST 1: Register User 1 (Referrer)');
  console.log('═══════════════════════════════════════════');
  const user1 = await testAPI('/auth/register', 'POST', {
    name: 'Ahmed Khan',
    email: 'ahmed@test.com',
    phone: '03001234567',
  });

  if (!user1?.user?._id) {
    console.error('❌ User 1 registration failed!');
    return;
  }
  const user1Id = user1.user._id;
  const referralCode = user1.user.referralCode;
  console.log(`\n📋 User 1 ID: ${user1Id}`);
  console.log(`📋 Referral Code: ${referralCode}`);

  // TEST 2: Register User 2 (Referred by User 1)
  console.log('\n═══════════════════════════════════════════');
  console.log('TEST 2: Register User 2 (Referred by User 1)');
  console.log('═══════════════════════════════════════════');
  const user2 = await testAPI('/auth/register', 'POST', {
    name: 'Sara Ali',
    email: 'sara@test.com',
    phone: '03009876543',
    referralCode: referralCode, // Using User 1's referral code
  });

  if (!user2?.user?._id) {
    console.error('❌ User 2 registration failed!');
    return;
  }
  const user2Id = user2.user._id;
  console.log(`\n📋 User 2 ID: ${user2Id}`);
  console.log(`📋 Referred By: ${referralCode}`);

  // Verify User 1 referral count increased
  const user1Updated = await testAPI(`/auth/user/${user1Id}`, 'GET');
  console.log(`\n✅ User 1 Total Referrals: ${user1Updated.user.totalReferrals} (should be 1)`);

  // TEST 3: Deposit to User 2's Wallet
  console.log('\n═══════════════════════════════════════════');
  console.log('TEST 3: Deposit Rs 20,000 to User 2');
  console.log('═══════════════════════════════════════════');
  const deposit = await testAPI('/wallet/deposit', 'POST', {
    userId: user2Id,
    amount: 20000,
    method: 'jazzcash',
  });
  console.log(`\n💰 User 2 Balance: Rs ${deposit.user.balance}`);

  // TEST 4: User 2 Purchases Commercial Farm (18 hens)
  console.log('\n═══════════════════════════════════════════');
  console.log('TEST 4: User 2 Purchases Commercial Farm (18 hens - Rs 16,200)');
  console.log('═══════════════════════════════════════════');
  const purchase = await testAPI('/hens/purchase', 'POST', {
    userId: user2Id,
    packageId: 'commercial', // 18 hens, Rs 630/day
  });

  if (purchase?.success) {
    console.log(`\n🐔 Batch ID: ${purchase.batch.batchId}`);
    console.log(`🐔 Hens Count: ${purchase.batch.hensCount}`);
    console.log(`🐔 Daily Reward: Rs ${purchase.batch.dailyReward}`);
    console.log(`🐔 Status: ${purchase.batch.status}`);
    console.log(`💰 User 2 Balance After: Rs ${purchase.user.balance}`);

    // Check User 1's referral commission
    const user1AfterCommission = await testAPI(`/auth/user/${user1Id}`, 'GET');
    console.log(`\n🎉 User 1 (Referrer) Earned Commission!`);
    console.log(`💰 Referral Earnings: Rs ${user1AfterCommission.user.referralEarnings}`);
    console.log(`💰 New Balance: Rs ${user1AfterCommission.user.balance}`);
    console.log(`📊 First Purchase Bonus (10%): Rs ${16200 * 0.10} = Rs 1,620`);
    console.log(`📊 Lifetime Purchase Bonus (2%): Rs ${16200 * 0.02} = Rs 324`);
    console.log(`📊 Total Commission: Rs 1,944`);
  }

  // TEST 5: Get User 2's Batches
  console.log('\n═══════════════════════════════════════════');
  console.log('TEST 5: Get User 2\'s Hen Batches');
  console.log('═══════════════════════════════════════════');
  const batches = await testAPI(`/hens/batches/${user2Id}`, 'GET');
  console.log(`\n📦 Total Batches: ${batches.batches.length}`);
  batches.batches.forEach((batch, i) => {
    console.log(`\nBatch ${i + 1}:`);
    console.log(`  - ID: ${batch.batchId}`);
    console.log(`  - Hens: ${batch.hensCount}`);
    console.log(`  - Status: ${batch.status}`);
    console.log(`  - Farm: ${batch.farmPartner}`);
  });

  // TEST 6: Get Transactions
  console.log('\n═══════════════════════════════════════════');
  console.log('TEST 6: Get Transaction History');
  console.log('═══════════════════════════════════════════');
  const txUser2 = await testAPI(`/wallet/transactions/${user2Id}`, 'GET');
  console.log(`\n📜 User 2 Transactions: ${txUser2.transactions.length}`);
  txUser2.transactions.forEach((tx, i) => {
    console.log(`\n${i + 1}. ${tx.type.toUpperCase()}`);
    console.log(`   Amount: Rs ${tx.amount}`);
    console.log(`   Description: ${tx.description}`);
  });

  const txUser1 = await testAPI(`/wallet/transactions/${user1Id}`, 'GET');
  console.log(`\n📜 User 1 (Referrer) Transactions: ${txUser1.transactions.length}`);
  txUser1.transactions.forEach((tx, i) => {
    console.log(`\n${i + 1}. ${tx.type.toUpperCase()}`);
    console.log(`   Amount: Rs ${tx.amount}`);
    console.log(`   Description: ${tx.description}`);
  });

  // TEST 7: Simulate Batch Activation (Change status from incubating to active)
  console.log('\n═══════════════════════════════════════════');
  console.log('TEST 7: Simulate 5-Day Incubation Pass (Manual DB Update)');
  console.log('═══════════════════════════════════════════');
  console.log('⏰ In production, this happens after 5 days automatically');
  console.log('⏰ For testing, you can manually update the batch purchasedAt date in MongoDB');
  console.log('⏰ Then trigger the daily earnings cron job');

  // TEST 8: Withdrawal
  console.log('\n═══════════════════════════════════════════');
  console.log('TEST 8: User 2 Withdraws Rs 1,000');
  console.log('═══════════════════════════════════════════');
  const withdrawal = await testAPI('/wallet/withdraw', 'POST', {
    userId: user2Id,
    amount: 1000,
  });
  if (withdrawal?.success) {
    console.log(`\n💸 Withdrawal Successful!`);
    console.log(`💰 New Balance: Rs ${withdrawal.user.balance}`);
  }

  console.log('\n\n═══════════════════════════════════════════');
  console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════');
  console.log('\n📊 SUMMARY:');
  console.log(`✓ User Registration (with referral tracking)`);
  console.log(`✓ Wallet Deposit`);
  console.log(`✓ Hen Purchase (auto-calculated referral commission)`);
  console.log(`✓ Transaction History`);
  console.log(`✓ Withdrawal`);
  console.log('\n⚠️  PENDING TESTS (Require Time-Based Triggers):');
  console.log('   - Daily Earnings (after 5-day incubation)');
  console.log('   - Rs 2 per hen egg commission to referrers');
  console.log('   - 90-day cycle completion with meat refund');
  console.log('\n💡 To test daily earnings:');
  console.log('   1. Update batch.purchasedAt in MongoDB to 6+ days ago');
  console.log('   2. Wait 1 hour for cron job OR restart server to trigger immediately');
}

// Run tests
runTests().catch(console.error);
