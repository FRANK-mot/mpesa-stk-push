require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  SHORTCODE,
  PASSKEY,
  CALLBACK_URL,
  PORT = 3000
} = process.env;

async function getAccessToken() {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    console.log('Access Token received successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('===== TOKEN ERROR =====');
    console.error(JSON.stringify(error.response?.data || error.message, null, 2));
    throw error;
  }
}

function getTimestamp() {
  const date = new Date();
  return (
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0')
  );
}

function getPassword(timestamp) {
  return Buffer.from(SHORTCODE + PASSKEY + timestamp).toString('base64');
}

app.post('/stkpush', async (req, res) => {
  try {
    const { phone, amount, accountReference = 'TestPayment' } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'phone and amount are required' });
    }

    let formattedPhone = phone.toString().replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = getPassword(timestamp);

    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: 'Payment'
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('STK Push Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('===== FULL ERROR =====');
    console.error(JSON.stringify(error.response?.data || error.message, null, 2));
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.post('/callback', (req, res) => {
  console.log('===== CALLBACK RECEIVED =====');
  console.log(JSON.stringify(req.body, null, 2));
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

app.get('/', (req, res) => {
  res.send('M-Pesa STK Push Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
