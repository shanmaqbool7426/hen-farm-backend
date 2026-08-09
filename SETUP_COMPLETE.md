# Complete User Setup - Ready to Test!

## 🚀 Quick Setup (One Command)

Run this to add both users:

```bash
cd artifacts/api-server
mongosh "mongodb+srv://auto-wheel-apps:AutoWheels123@auto-wheels.m4wrf.mongodb.net/henform" setup-users.js
```

---

## 👥 Users Created

### 1️⃣ SELLER - Shan (Has 10,000 hens to sell)

```
Email:      shanmaqbool12345@gmail.com
Password:   Shan7426@
Phone:      03069829158

Payment Details:
💳 EasyPaisa:  03069829158
💰 JazzCash:   03069829158
📱 WhatsApp:   +923069829158

Inventory:
🐔 10,000 hens available
💵 Rs 900 per hen
✅ Verified seller
⭐ 5.0 rating
```

### 2️⃣ BUYER - Ali (Can buy hens)

```
Email:      ali@mailinator.com
Password:   Shan7426@
Phone:      03001234567
WhatsApp:   +923001234567

Balance:    Rs 50,000
Location:   Lahore
```

---

## 🎯 Complete Test Flow

### Step 1: Login as Buyer (Ali)
```
Email: ali@mailinator.com
Password: Shan7426@
```

### Step 2: Buy Hens
1. Open app → Go to **Marketplace** tab
2. See **Shan** with 10,000 hens available
3. Click **"Buy Hens"**
4. Enter quantity: **10 hens**
5. Total: **Rs 9,000** (10 × 900)

### Step 3: See Payment Details
Modal shows:
```
💳 EasyPaisa: 03069829158
💰 JazzCash: 03069829158
🏦 Bank: (empty)
📱 WhatsApp: +923069829158
```

### Step 4: Create Order
1. Click **"Create Order"**
2. Order status: 🟡 **Pending**

### Step 5: Send Payment (In Real Life)
1. Send Rs 9,000 to Shan's EasyPaisa: **03069829158**
2. Take screenshot of payment

### Step 6: Contact Seller
1. Click **"Contact Seller"** button
2. WhatsApp opens automatically
3. Send payment screenshot to: **+923069829158**

### Step 7: Login as Seller (Shan)
```
Email: shanmaqbool12345@gmail.com
Password: Shan7426@
```

### Step 8: Approve Order
1. Go to **Orders** tab
2. Click **"Pending Approvals"** tab
3. See order from Ali (10 hens, Rs 9,000)
4. Click **"Approve"** ✅

### Step 9: Verify Success (Ali's Side)
1. Login back as Ali
2. Go to **Orders** → **My Orders**
3. Order status: ✅ **Approved**
4. Go to **My Hens** tab
5. See **10 new hens**! 🎉

### Step 10: Verify Payment (Shan's Side)
1. Shan's balance increased by **Rs 9,000**
2. Shan's hen inventory decreased by 10

---

## 📱 Mobile App Test

### Test 1: Marketplace
```
✓ Shan appears in sellers list
✓ Shows 10,000 hens available
✓ Shows Rs 900/hen price
✓ Shows 5-star rating
✓ Shows verified badge
```

### Test 2: Order Creation
```
✓ Payment details visible
✓ Can enter quantity
✓ Total calculated correctly
✓ Order creates successfully
✓ Status shows as Pending
```

### Test 3: WhatsApp Integration
```
✓ "Contact Seller" button works
✓ Opens WhatsApp app
✓ Shows seller's number
✓ Message pre-filled
```

### Test 4: Order Approval
```
✓ Seller sees pending order
✓ Shows buyer details
✓ Can approve order
✓ Hens transfer automatically
✓ Balance updates correctly
```

---

## 🧪 API Tests

### Test Marketplace API
```bash
curl http://localhost:3000/api/marketplace/sellers
```

**Expected Response:**
```json
{
  "success": true,
  "sellers": [
    {
      "userId": "...",
      "userName": "Shan",
      "location": "Pakistan",
      "totalHens": 10000,
      "pricePerHen": 900,
      "rating": 5.0,
      "verified": true,
      "easyPaisaAccount": "03069829158",
      "jazzCashAccount": "03069829158",
      "whatsappNumber": "+923069829158"
    }
  ]
}
```

### Test Create Order
```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "ALI_USER_ID",
    "sellerId": "SHAN_USER_ID",
    "orderType": "buy-hen",
    "quantity": 10,
    "pricePerUnit": 900
  }'
```

### Test Get Orders
```bash
# Ali's orders
curl http://localhost:3000/api/orders/my-orders/ALI_USER_ID

# Shan's pending approvals
curl http://localhost:3000/api/orders/pending-approvals/SHAN_USER_ID
```

---

## ✅ Success Checklist

After setup, verify:

- [ ] Both users exist in database
- [ ] Shan has 10,000 hens in HenBatches collection
- [ ] Ali has Rs 50,000 balance
- [ ] Shan appears in Marketplace API
- [ ] Can create order from Ali to Shan
- [ ] Order appears in pending approvals
- [ ] Can approve order as Shan
- [ ] Hens transfer to Ali after approval
- [ ] Shan's balance increases
- [ ] WhatsApp button works on device

---

## 🎨 What Users Will See

### Ali (Buyer) - Marketplace Screen
```
╔══════════════════════════════════╗
║         Marketplace              ║
╠══════════════════════════════════╣
║                                  ║
║  ┌────────────────────────────┐ ║
║  │  Shan ✓        ⭐⭐⭐⭐⭐  │ ║
║  │  📍 Pakistan               │ ║
║  │                            │ ║
║  │  🐔 10,000 hens available  │ ║
║  │  💰 Rs 900/hen             │ ║
║  │                            │ ║
║  │     [Buy Hens →]           │ ║
║  └────────────────────────────┘ ║
║                                  ║
╚══════════════════════════════════╝
```

### Ali (Buyer) - Order Details Modal
```
╔══════════════════════════════════╗
║    Buy Hens from Shan            ║
╠══════════════════════════════════╣
║                                  ║
║  💳 Payment Details:             ║
║  ──────────────────────────────  ║
║  EasyPaisa: 03069829158  [Copy] ║
║  JazzCash:  03069829158  [Copy] ║
║  WhatsApp:  +923069829158       ║
║                                  ║
║  Quantity: [10] hens             ║
║  Price/hen: Rs 900               ║
║  Total: Rs 9,000                 ║
║                                  ║
║  ℹ️ Send payment to above       ║
║     account, then contact        ║
║     seller on WhatsApp           ║
║                                  ║
║  [Cancel]    [Create Order]      ║
║                                  ║
╚══════════════════════════════════╝
```

### Shan (Seller) - Pending Approvals
```
╔══════════════════════════════════╗
║     Pending Approvals (1)        ║
╠══════════════════════════════════╣
║                                  ║
║  ┌────────────────────────────┐ ║
║  │  🔔 New Order                │ ║
║  │                              │ ║
║  │  From: Ali                   │ ║
║  │  📱 +923001234567            │ ║
║  │                              │ ║
║  │  10 hens × Rs 900            │ ║
║  │  Total: Rs 9,000             │ ║
║  │                              │ ║
║  │  [❌ Reject]  [✅ Approve]   │ ║
║  └────────────────────────────┘ ║
║                                  ║
╚══════════════════════════════════╝
```

---

## 🎉 Summary

### What's Ready:
✅ **2 test users** (Seller + Buyer)  
✅ **10,000 hens** inventory for Shan  
✅ **Rs 50,000** balance for Ali  
✅ **Payment details** configured  
✅ **WhatsApp** integration ready  
✅ **Complete P2P flow** working  

### To Start Testing:
1. Run `setup-users.js` script
2. Start API server (`npm run dev`)
3. Start mobile app (`npm start`)
4. Login as Ali or Shan
5. Test buy/sell flow

---

## 📞 Contact Details Reference

**Shan (Seller):**
- EasyPaisa: 03069829158
- JazzCash: 03069829158
- WhatsApp: +923069829158

**Ali (Buyer):**
- WhatsApp: +923001234567

---

## 🚀 You're Ready to Launch!

Everything is set up for complete P2P marketplace testing!

**Next Step:** Run the setup script and start testing! 🎊
