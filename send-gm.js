import Irys from '@irys/sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
  // Irys Testnet URL
  IRYS_URL: process.env.IRYS_URL || 'https://devnet.irys.xyz',
  
  // Your private key (NEVER commit this to git - use .env file)
  PRIVATE_KEY: process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE',
  
  // Token for payments (default: Ethereum)
  TOKEN: process.env.TOKEN || 'ethereum',
  
  // Message to upload
  MESSAGE: process.env.MESSAGE || 'Gm',
  
  // Optional tags
  TAGS: process.env.TAGS ? JSON.parse(process.env.TAGS) : [
    { name: 'Content-Type', value: 'text/plain' },
    { name: 'App-Name', value: 'Irys-Gm-Bot' },
    { name: 'Message', value: 'Gm' }
  ],
};

async function sendGm() {
  try {
    console.log('🚀 Initializing Irys client...');
    
    // Check if private key is set
    if (!CONFIG.PRIVATE_KEY || CONFIG.PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
      throw new Error('❌ Please set your PRIVATE_KEY in .env file');
    }
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY);
    console.log('👛 Wallet Address:', wallet.address);
    
    // Initialize Irys
    const irys = new Irys({
      url: CONFIG.IRYS_URL,
      token: CONFIG.TOKEN,
      key: CONFIG.PRIVATE_KEY,
    });
    
    console.log('📡 Connected to Irys:', CONFIG.IRYS_URL);
    console.log('💎 Using token:', CONFIG.TOKEN);
    
    // Check balance
    const balance = await irys.getBalance(wallet.address);
    const balanceFormatted = irys.utils.fromAtomic(balance);
    console.log('💰 Current Balance:', balanceFormatted.toString(), CONFIG.TOKEN);
    
    // Estimate price
    const messageBytes = new TextEncoder().encode(CONFIG.MESSAGE);
    const price = await irys.getPrice(messageBytes.length);
    const priceFormatted = irys.utils.fromAtomic(price);
    console.log('\n💵 Upload Cost:', priceFormatted.toString(), CONFIG.TOKEN);
    
    if (balance < price) {
      throw new Error(`❌ Insufficient balance. Need ${priceFormatted.toString()} ${CONFIG.TOKEN}, but have ${balanceFormatted.toString()} ${CONFIG.TOKEN}`);
    }
    
    // Upload the message
    console.log('\n📤 Uploading message:', CONFIG.MESSAGE);
    console.log('🏷️  Tags:', JSON.stringify(CONFIG.TAGS, null, 2));
    
    const receipt = await irys.upload(messageBytes, {
      tags: CONFIG.TAGS,
    });
    
    console.log('\n✅ Upload successful!');
    console.log('🆔 Transaction ID:', receipt.id);
    console.log('🔗 View on Gateway:', `https://gateway.irys.xyz/${receipt.id}`);
    console.log('🔗 View on Explorer:', `${CONFIG.IRYS_URL}/${receipt.id}`);
    console.log('📦 Data Size:', messageBytes.length, 'bytes');
    if (receipt.token) {
      console.log('⛽ Token Used:', receipt.token);
    }
    if (receipt.atomic) {
      console.log('⛽ Atomic Amount:', receipt.atomic.toString());
    }
    
    // Verify the upload
    console.log('\n🔍 Verifying upload...');
    try {
      const verifyStatus = await irys.status(receipt.id);
      console.log('✅ Upload verified!');
      console.log('   Status:', JSON.stringify(verifyStatus, null, 2));
    } catch (verifyError) {
      console.log('⚠️  Verification check failed (upload may still be processing):', verifyError.message);
    }
    
    // Retrieve the data to confirm
    console.log('\n📥 Retrieving uploaded data...');
    try {
      const response = await fetch(`https://gateway.irys.xyz/${receipt.id}`);
      if (response.ok) {
        const retrievedData = await response.text();
        console.log('📝 Retrieved:', retrievedData);
      } else {
        console.log('⚠️  Data retrieval failed (may still be processing)');
      }
    } catch (fetchError) {
      console.log('⚠️  Could not retrieve data yet (may still be processing):', fetchError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data || error.response.statusText);
    }
    if (error.reason) {
      console.error('   Reason:', error.reason);
    }
    process.exit(1);
  }
}

// Run the script
sendGm();

