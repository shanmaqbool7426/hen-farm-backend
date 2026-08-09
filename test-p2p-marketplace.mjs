import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.magenta}═══ ${msg} ═══${colors.reset}\n`),
};

// Test data
let testBuyerId = null;
let testSellerId = null;
let testOrderId = null;
let testEggOrderId = null;

async function setupTestUsers() {
  log.section('Setting Up Test Users');

  try {
    // Register buyer
    const buyerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Buyer',
        email: `buyer_${Date.now()}@test.com`,
        phone: `03001${Math.floor(Math.random() * 1000000)}`,
        referralCode: `BUYER${Date.now()}`,
      }),
    });

    const buyerData = await buyerRes.json();
    if (buyerData.user) {
      testBuyerId = buyerData.user._id;
      log.success(`Buyer created: ${buyerData.user.name} (${testBuyerId})`);
    } else {
      log.error('Failed to create buyer');
      return false;
    }

    // Register seller with payment details
    const sellerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Seller',
        email: `seller_${Date.now()}@test.com`,
        phone: `03009${Math.floor(Math.random() * 1000000)}`,
        referralCode: `SELLER${Date.now()}`,
      }),
    });

    const sellerData = await sellerRes.json();
    if (sellerData.user) {
      testSellerId = sellerData.user._id;
      log.success(`Seller created: ${sellerData.user.name} (${testSellerId})`);
    } else {
      log.error('Failed to create seller');
      return false;
    }

    // Update seller with payment details (direct DB update simulation)
    log.info('Seller needs payment details added in database manually');
    log.info('Run this MongoDB command:');
    console.log(`
db.users.updateOne(
  { _id: ObjectId("${testSellerId}") },
  {
    $set: {
      easyPaisaAccount: "03001234567",
      jazzCashAccount: "03009876543",
      bankName: "Meezan Bank",
      bankAccountNumber: "12345678901234",
      bankAccountTitle: "Test Seller",
      whatsappNumber: "+923001234567",
      verified: true,
      availableEggs: 150
    }
  }
)
    `);

    return true;
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    return false;
  }
}

async function testCreateBuyHenOrder() {
  log.section('Test 1: Create Buy-Hen Order');

  try {
    const response = await fetch(`${API_URL}/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerId: testBuyerId,
        sellerId: testSellerId,
        orderType: 'buy-hen',
        quantity: 5,
        pricePerUnit: 900,
      }),
    });

    const data = await response.json();

    if (data.order) {
      testOrderId = data.order._id;
      log.success('Buy-hen order created successfully');
      log.info(`Order ID: ${testOrderId}`);
      log.info(`Quantity: ${data.order.quantity} hens`);
      log.info(`Total: Rs ${data.order.totalAmount}`);
      log.info(`Status: ${data.order.status}`);

      if (data.sellerPaymentDetails) {
        log.success('Seller payment details received:');
        console.log(JSON.stringify(data.sellerPaymentDetails, null, 2));
      }

      return true;
    } else {
      log.error(`Order creation failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

async function testGetMyOrders() {
  log.section('Test 2: Get Buyer\'s Orders');

  try {
    const response = await fetch(`${API_URL}/orders/my-orders/${testBuyerId}`);
    const data = await response.json();

    if (data.buyOrders) {
      log.success(`Found ${data.buyOrders.length} buy orders`);
      if (data.buyOrders.length > 0) {
        const order = data.buyOrders[0];
        log.info(`Latest order: ${order.quantity} hens, Status: ${order.status}`);
      }
      return true;
    } else {
      log.error('Failed to fetch orders');
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

async function testGetPendingApprovals() {
  log.section('Test 3: Get Seller\'s Pending Approvals');

  try {
    const response = await fetch(`${API_URL}/orders/pending-approvals/${testSellerId}`);
    const data = await response.json();

    if (data.pendingOrders !== undefined) {
      log.success(`Found ${data.pendingOrders.length} pending approvals`);
      if (data.pendingOrders.length > 0) {
        const order = data.pendingOrders[0];
        log.info(`Order from: ${order.buyerId?.name || 'Unknown'}`);
        log.info(`Quantity: ${order.quantity} hens`);
        log.info(`Amount: Rs ${order.totalAmount}`);
      }
      return true;
    } else {
      log.error('Failed to fetch pending approvals');
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

async function testApproveOrder() {
  log.section('Test 4: Approve Buy-Hen Order');

  if (!testOrderId) {
    log.warn('No order to approve. Skipping test.');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/orders/approve/${testOrderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: testSellerId,
      }),
    });

    const data = await response.json();

    if (data.order && data.order.status === 'approved') {
      log.success('Order approved successfully!');
      log.info(`Order status: ${data.order.status}`);
      log.info('Backend should have:');
      log.info('  ✓ Created HenBatch for buyer');
      log.info('  ✓ Updated buyer\'s totalInvested');
      log.info('  ✓ Added amount to seller\'s balance');
      log.info('  ✓ Created transaction record');
      return true;
    } else {
      log.error(`Approval failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

async function testCreateSellEggOrder() {
  log.section('Test 5: Create Sell-Egg Order');

  try {
    // In sell-egg orders, the egg seller is the buyerId
    // and the egg buyer is the sellerId (confusing but correct)
    const response = await fetch(`${API_URL}/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerId: testSellerId, // Seller has eggs
        sellerId: testBuyerId, // Buyer wants eggs
        orderType: 'sell-egg',
        quantity: 50,
        pricePerUnit: 2,
      }),
    });

    const data = await response.json();

    if (data.order) {
      testEggOrderId = data.order._id;
      log.success('Sell-egg order created successfully');
      log.info(`Order ID: ${testEggOrderId}`);
      log.info(`Quantity: ${data.order.quantity} eggs`);
      log.info(`Total: Rs ${data.order.totalAmount}`);
      log.info(`Status: ${data.order.status}`);
      return true;
    } else {
      log.error(`Order creation failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

async function testApproveEggOrder() {
  log.section('Test 6: Approve Sell-Egg Order');

  if (!testEggOrderId) {
    log.warn('No egg order to approve. Skipping test.');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/orders/approve/${testEggOrderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: testBuyerId, // In egg orders, buyer is the approver
      }),
    });

    const data = await response.json();

    if (data.order && data.order.status === 'approved') {
      log.success('Egg order approved successfully!');
      log.info(`Order status: ${data.order.status}`);
      log.info('Backend should have:');
      log.info('  ✓ Deducted eggs from seller\'s availableEggs');
      log.info('  ✓ Added amount to seller\'s balance');
      log.info('  ✓ Added eggs to buyer\'s availableEggs');
      log.info('  ✓ Created transaction record');
      return true;
    } else {
      log.error(`Approval failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

async function testRejectOrder() {
  log.section('Test 7: Create and Reject Order');

  try {
    // Create another order to reject
    const createRes = await fetch(`${API_URL}/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerId: testBuyerId,
        sellerId: testSellerId,
        orderType: 'buy-hen',
        quantity: 3,
        pricePerUnit: 900,
      }),
    });

    const createData = await createRes.json();

    if (!createData.order) {
      log.error('Failed to create order for rejection test');
      return false;
    }

    const rejectOrderId = createData.order._id;
    log.info(`Created order ${rejectOrderId} for rejection test`);

    // Now reject it
    const rejectRes = await fetch(`${API_URL}/orders/reject/${rejectOrderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: testSellerId,
        rejectionReason: 'Payment screenshot not valid',
      }),
    });

    const rejectData = await rejectRes.json();

    if (rejectData.order && rejectData.order.status === 'rejected') {
      log.success('Order rejected successfully!');
      log.info(`Status: ${rejectData.order.status}`);
      log.info(`Reason: ${rejectData.order.rejectionReason}`);
      return true;
    } else {
      log.error(`Rejection failed: ${rejectData.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

async function verifyDatabaseChanges() {
  log.section('Verification Checklist');

  log.info('Please verify in MongoDB:');
  console.log(`
1. HenBatch Collection:
   - Should have new batch for buyer (userId: ${testBuyerId})
   - Quantity: 5 hens
   - Status: active

2. Users Collection:
   - Buyer (${testBuyerId}):
     * totalInvested should increase by Rs 4500
   - Seller (${testSellerId}):
     * balance should increase by Rs 4500
     * availableEggs should decrease by 50 (if egg order approved)

3. Transactions Collection:
   - Should have transaction for seller (hen-sale)
   - Should have transaction for seller (egg-sale)

4. Orders Collection:
   - Should have orders with status: approved, rejected
  `);
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  P2P Marketplace End-to-End Tests     ║');
  console.log('╚════════════════════════════════════════╝\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Setup
  const setupSuccess = await setupTestUsers();
  if (!setupSuccess) {
    log.error('Setup failed. Cannot continue tests.');
    return;
  }

  log.warn('\n⚠️  IMPORTANT: Update seller payment details in database before continuing!');
  log.info('Press Ctrl+C to exit, or wait 10 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 10000));

  // Run tests
  const tests = [
    { name: 'Create Buy-Hen Order', fn: testCreateBuyHenOrder },
    { name: 'Get Buyer Orders', fn: testGetMyOrders },
    { name: 'Get Pending Approvals', fn: testGetPendingApprovals },
    { name: 'Approve Buy-Hen Order', fn: testApproveOrder },
    { name: 'Create Sell-Egg Order', fn: testCreateSellEggOrder },
    { name: 'Approve Sell-Egg Order', fn: testApproveEggOrder },
    { name: 'Reject Order', fn: testRejectOrder },
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Verification
  await verifyDatabaseChanges();

  // Summary
  log.section('Test Summary');
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

  if (results.failed === 0) {
    log.success('\n🎉 All tests passed! P2P Marketplace is working correctly!');
  } else {
    log.warn('\n⚠️  Some tests failed. Check the logs above for details.');
  }

  console.log('\n═════════════════════════════════════════\n');
}

// Run tests
runAllTests().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
