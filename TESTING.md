# P2P Marketplace Testing Guide

This guide will help you test the complete P2P marketplace functionality.

---

## Prerequisites

1. **MongoDB Running**
   - Connection string in `.env` file
   - Database: `henform` or your configured name

2. **API Server Running**
   ```bash
   cd artifacts/api-server
   npm install
   npm run dev
   ```
   Server should be running on `http://localhost:3000`

3. **Node.js** version 16 or higher

---

## Quick Start (Automated Tests)

### Step 1: Setup Test Data

Run the MongoDB setup script to create test users:

```bash
# Option A: Using MongoDB Shell
mongosh "mongodb+srv://auto-wheel-apps:AutoWheels123@auto-wheels.m4wrf.mongodb.net/henform" setup-test-data.js

# Option B: Using MongoDB Compass
# 1. Open MongoDB Compass
# 2. Connect to your database
# 3. Open Mongosh tab at bottom
# 4. Copy-paste content of setup-test-data.js
# 5. Run the script
```

This will create:
- Test Buyer (buyer@test.com)
- Test Seller (seller@test.com) with payment details
- Sample hen batches for seller

### Step 2: Run Automated Tests

```bash
cd artifacts/api-server
node test-p2p-marketplace.mjs
```

The test script will:
1. ✅ Create test users (buyer & seller)
2. ✅ Create buy-hen order
3. ✅ Fetch buyer's orders
4. ✅ Fetch seller's pending approvals
5. ✅ Approve buy-hen order
6. ✅ Create sell-egg order
7. ✅ Approve sell-egg order
8. ✅ Test order rejection

---

## Manual Testing

### Test 1: Create Buy-Hen Order

**Scenario:** Buyer wants to purchase 5 hens from seller

```bash
# Get user IDs from database first
BUYER_ID="your_buyer_id_here"
SELLER_ID="your_seller_id_here"

# Create order
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "'$BUYER_ID'",
    "sellerId": "'$SELLER_ID'",
    "orderType": "buy-hen",
    "quantity": 5,
    "pricePerUnit": 900
  }'
```

**Expected Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "order_id_here",
    "buyerId": "...",
    "sellerId": "...",
    "orderType": "buy-hen",
    "quantity": 5,
    "pricePerUnit": 900,
    "totalAmount": 4500,
    "status": "pending"
  },
  "sellerPaymentDetails": {
    "easyPaisaAccount": "03009999999",
    "jazzCashAccount": "03009999999",
    "bankName": "Meezan Bank",
    "bankAccountNumber": "12345678901234",
    "bankAccountTitle": "Test Seller",
    "whatsappNumber": "+923009999999"
  }
}
```

### Test 2: Get Buyer's Orders

```bash
curl http://localhost:3000/api/orders/my-orders/$BUYER_ID
```

**Expected Response:**
```json
{
  "buyOrders": [
    {
      "_id": "...",
      "sellerId": {
        "name": "Test Seller",
        "whatsappNumber": "+923009999999"
      },
      "quantity": 5,
      "totalAmount": 4500,
      "status": "pending"
    }
  ],
  "sellOrders": []
}
```

### Test 3: Get Seller's Pending Approvals

```bash
curl http://localhost:3000/api/orders/pending-approvals/$SELLER_ID
```

**Expected Response:**
```json
{
  "pendingOrders": [
    {
      "_id": "...",
      "buyerId": {
        "name": "Test Buyer",
        "phone": "03001111111"
      },
      "quantity": 5,
      "totalAmount": 4500,
      "status": "pending"
    }
  ]
}
```

### Test 4: Approve Order

```bash
ORDER_ID="order_id_from_step_1"

curl -X POST http://localhost:3000/api/orders/approve/$ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "'$SELLER_ID'"
  }'
```

**Expected Response:**
```json
{
  "message": "Order approved successfully",
  "order": {
    "_id": "...",
    "status": "approved",
    "approvedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**What Happens Automatically:**
1. ✅ New `HenBatch` created for buyer
   - henCount: 5
   - status: "active"
   - 90-day cycle starts

2. ✅ Buyer's `totalInvested` increases by Rs 4500

3. ✅ Seller's `balance` increases by Rs 4500

4. ✅ Transaction record created for seller

### Test 5: Sell Eggs Order

**Scenario:** Seller wants to sell 50 eggs to buyer at Rs 2/egg

```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "'$SELLER_ID'",
    "sellerId": "'$BUYER_ID'",
    "orderType": "sell-egg",
    "quantity": 50,
    "pricePerUnit": 2
  }'
```

**Note:** In egg orders, roles are reversed:
- `buyerId` = User selling eggs (has eggs)
- `sellerId` = User buying eggs (wants eggs)

### Test 6: Approve Egg Order

```bash
EGG_ORDER_ID="egg_order_id_here"

curl -X POST http://localhost:3000/api/orders/approve/$EGG_ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "'$BUYER_ID'"
  }'
```

**What Happens Automatically:**
1. ✅ Seller's `availableEggs` decreases by 50
2. ✅ Seller's `balance` increases by Rs 100
3. ✅ Buyer's `availableEggs` increases by 50
4. ✅ Transaction record created

### Test 7: Reject Order

```bash
curl -X POST http://localhost:3000/api/orders/reject/$ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "'$SELLER_ID'",
    "rejectionReason": "Payment screenshot not clear"
  }'
```

**Expected Response:**
```json
{
  "message": "Order rejected",
  "order": {
    "status": "rejected",
    "rejectionReason": "Payment screenshot not clear"
  }
}
```

---

## Database Verification

After running tests, verify in MongoDB:

### Check HenBatches Collection
```javascript
db.henbatches.find({ userId: ObjectId("BUYER_ID") })
```

Should show new hen batch:
```javascript
{
  userId: ObjectId("..."),
  henCount: 5,
  pricePerHen: 900,
  totalInvestment: 4500,
  status: "active",
  cycleEndDate: "90 days from now"
}
```

### Check Users Collection
```javascript
db.users.findOne({ _id: ObjectId("BUYER_ID") })
```

Should show:
- `totalInvested`: Increased by Rs 4500
- `availableEggs`: Increased if egg order approved

```javascript
db.users.findOne({ _id: ObjectId("SELLER_ID") })
```

Should show:
- `balance`: Increased by Rs 4500
- `availableEggs`: Decreased if egg order approved

### Check Transactions Collection
```javascript
db.transactions.find({ userId: ObjectId("SELLER_ID") })
```

Should show transaction records for sales.

### Check Orders Collection
```javascript
db.orders.find()
```

Should show orders with various statuses:
- pending
- approved
- rejected

---

## Testing Checklist

### ✅ Order Creation
- [ ] Buy-hen order creates successfully
- [ ] Sell-egg order creates successfully
- [ ] Seller payment details returned
- [ ] Order status is "pending"

### ✅ Order Retrieval
- [ ] Buyer can see their buy orders
- [ ] Seller can see their sell orders
- [ ] Seller can see pending approvals

### ✅ Order Approval (Buy-Hen)
- [ ] Order status changes to "approved"
- [ ] HenBatch created for buyer
- [ ] Buyer's totalInvested increases
- [ ] Seller's balance increases
- [ ] Transaction record created

### ✅ Order Approval (Sell-Egg)
- [ ] Order status changes to "approved"
- [ ] Seller's availableEggs decreases
- [ ] Seller's balance increases
- [ ] Buyer's availableEggs increases
- [ ] Transaction record created

### ✅ Order Rejection
- [ ] Order status changes to "rejected"
- [ ] Rejection reason saved
- [ ] No balance/inventory changes

---

## Mobile App Testing

### Prerequisites
1. API server running on port 3000
2. Test users in database with payment details
3. Expo app running

### Test Flow

**1. Login as Buyer**
- Email: buyer@test.com
- Phone: 03001111111

**2. Go to Marketplace**
- Should see sellers with hens available
- Click "Buy Hens" on a seller
- Modal shows seller payment details
- Create order for 5 hens

**3. Go to Orders Screen**
- Navigate to `/orders` route
- See "My Orders" tab with pending order
- Click "Contact Seller" → Opens WhatsApp

**4. Login as Seller (Different Device/Session)**
- Email: seller@test.com
- Phone: 03009999999

**5. Check Pending Approvals**
- Navigate to Orders screen
- Go to "Pending Approvals" tab
- See order from buyer
- Click "Approve"

**6. Verify as Buyer**
- Refresh Orders screen
- Order status should be "approved"
- Go to "My Hens" screen
- Should see new hen batch

---

## Troubleshooting

### Error: "User not found"
- Verify user IDs exist in database
- Check MongoDB connection string

### Error: "Insufficient eggs"
- Ensure seller has `availableEggs` > 0
- Run: `db.users.updateOne({_id: ObjectId("SELLER_ID")}, {$set: {availableEggs: 200}})`

### Error: "Order not found"
- Check order ID is correct
- Verify order exists in database

### Error: "Unauthorized"
- Ensure sellerId matches order's sellerId
- Check request body contains correct sellerId

### API Server Not Running
```bash
cd artifacts/api-server
npm install
npm run dev
```

### MongoDB Connection Failed
- Check `.env` file has correct connection string
- Verify MongoDB cluster is running
- Test connection: `mongosh "your_connection_string"`

---

## Expected Results Summary

After running all tests successfully:

**Orders Collection:**
- ✅ Multiple orders with different statuses
- ✅ Buy-hen and sell-egg orders present

**HenBatches Collection:**
- ✅ New batches created for buyers
- ✅ Status: "active"
- ✅ 90-day cycle configured

**Users Collection:**
- ✅ Buyer's totalInvested updated
- ✅ Seller's balance updated
- ✅ Egg inventory managed correctly

**Transactions Collection:**
- ✅ Transaction records for all approved orders
- ✅ Type: "hen-sale" and "egg-sale"

---

## Next Steps After Testing

1. **Fix Marketplace Screen** - Update farm.tsx to use order creation
2. **Add Egg Listing UI** - Allow users to list eggs for sale
3. **Add Profile Screen** - Let users update payment details
4. **Test on Real Device** - WhatsApp integration
5. **Add Notifications** - Push notifications for order updates

---

## Support

If tests fail:
1. Check API server logs
2. Verify MongoDB data
3. Review error messages
4. Check P2P_MARKETPLACE_COMPLETE.md for detailed docs

**Happy Testing! 🚀**
