# Backend - How to Run

## Quick Start

```bash
cd artifacts/api-server
npm run dev
```

Server will start on **http://localhost:3000** or **http://192.168.1.46:3000** (network IP)

## Test Users

### Ali (Buyer)
- Email: `ali@mailinator.com`
- Password: `Shan7426@`
- Balance: Rs 50,000

### Shan (Seller)
- Email: `shanmaqbool12345@gmail.com`
- Password: `Shan7426@`
- Balance: Rs 500,000
- Available Eggs: 10,000

## Environment Variables

All hardcoded in `.env` file:
- `PORT=3000`
- `NODE_ENV=production`
- `MONGODB_URI=mongodb+srv://...`

## MongoDB Status

Currently **connection fails** (ECONNREFUSED) - but server continues with **in-memory test users** as fallback.

## API Endpoints

Base URL: `http://localhost:3000/api`

### Auth
- `POST /auth/login` - Login with email & password
- `POST /auth/register` - Register new user

### Hens
- `POST /hens/purchase` - Buy hen batch
- `GET /hens/my-batches` - View user's batches

### Wallet
- `GET /wallet/balance` - Get balance
- `POST /wallet/withdraw` - Withdraw funds

### Marketplace
- `GET /marketplace/listings` - View P2P listings
- `POST /marketplace/create` - Create listing
- `POST /marketplace/purchase/:id` - Buy from listing

## Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@mailinator.com","password":"Shan7426@"}'
```

Or PowerShell:
```powershell
$body = @{email='ali@mailinator.com';password='Shan7426@'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
```
