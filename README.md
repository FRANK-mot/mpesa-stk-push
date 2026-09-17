# M-Pesa STK Push (Daraja API)

Simple Node.js server for initiating M-Pesa STK Push (Lipa Na M-Pesa Online) using Safaricom Daraja API.

## Setup on Termux (Android)

```bash
pkg update -y
pkg install nodejs git curl -y
git clone https://github.com/FRANK-mot/mpesa-stk-push.git
cd mpesa-stk-push
npm install
cp .env.example .env
nano .env   # put your real Consumer Key and Secret
node index.js
```

## Test

In another Termux session:

```bash
curl -X POST http://localhost:3000/stkpush \
  -H "Content-Type: application/json" \
  -d '{"phone":"254708374149","amount":1,"accountReference":"Test001"}'
```

## Important

- Use the official sandbox shortcode `174379` and the official passkey provided.
- Make sure your Daraja app has **Lipa Na M-Pesa Online** product enabled.
- Replace the keys in `.env` with your real ones from https://developer.safaricom.co.ke
