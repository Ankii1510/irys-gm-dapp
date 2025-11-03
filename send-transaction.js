import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Configuration - Update these values
const CONFIG = {
  // Ethereum Sepolia Testnet RPC URL
  // You can get a free one from: https://infura.io, https://alchemy.com, or https://publicnode.com
  RPC_URL: process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
  
  // Your private key (NEVER commit this to git - use .env file)
  PRIVATE_KEY: process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE',
  
  // Recipient address (can be any valid Ethereum address)
  TO_ADDRESS: process.env.TO_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  
  // Amount to send (in ETH)
  AMOUNT_ETH: process.env.AMOUNT_ETH || '0.001',
  
  // Gas settings (optional - will be estimated if not provided)
  GAS_LIMIT: process.env.GAS_LIMIT || '21000',
  MAX_FEE_PER_GAS: process.env.MAX_FEE_PER_GAS, // in gwei
  MAX_PRIORITY_FEE_PER_GAS: process.env.MAX_PRIORITY_FEE_PER_GAS, // in gwei
};

async function sendTransaction() {
  try {
    console.log('🔗 Connecting to Sepolia Testnet...');
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    
    // Check if private key is set
    if (!CONFIG.PRIVATE_KEY || CONFIG.PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
      throw new Error('❌ Please set your PRIVATE_KEY in .env file or CONFIG');
    }
    
    // Create wallet
    const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider);
    console.log('👛 Wallet Address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);
    console.log('💰 Balance:', balanceEth, 'ETH');
    
    if (parseFloat(balanceEth) < parseFloat(CONFIG.AMOUNT_ETH)) {
      throw new Error(`❌ Insufficient balance. Need ${CONFIG.AMOUNT_ETH} ETH, but have ${balanceEth} ETH`);
    }
    
    // Prepare transaction
    const amountWei = ethers.parseEther(CONFIG.AMOUNT_ETH);
    
    const tx = {
      to: CONFIG.TO_ADDRESS,
      value: amountWei,
    };
    
    // Add gas settings if provided
    if (CONFIG.MAX_FEE_PER_GAS) {
      tx.maxFeePerGas = ethers.parseUnits(CONFIG.MAX_FEE_PER_GAS, 'gwei');
    }
    if (CONFIG.MAX_PRIORITY_FEE_PER_GAS) {
      tx.maxPriorityFeePerGas = ethers.parseUnits(CONFIG.MAX_PRIORITY_FEE_PER_GAS, 'gwei');
    }
    if (CONFIG.GAS_LIMIT) {
      tx.gasLimit = BigInt(CONFIG.GAS_LIMIT);
    }
    
    console.log('\n📝 Transaction Details:');
    console.log('   To:', tx.to);
    console.log('   Amount:', CONFIG.AMOUNT_ETH, 'ETH');
    
    // Estimate gas if not provided
    if (!tx.gasLimit) {
      const estimatedGas = await provider.estimateGas(tx);
      tx.gasLimit = estimatedGas;
      console.log('   Gas Limit (estimated):', estimatedGas.toString());
    }
    
    // Get current gas prices
    const feeData = await provider.getFeeData();
    console.log('   Current Gas Price:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'gwei');
    
    // Sign and send transaction
    console.log('\n🚀 Sending transaction...');
    const transaction = await wallet.sendTransaction(tx);
    
    console.log('✅ Transaction sent!');
    console.log('   Tx Hash:', transaction.hash);
    console.log('   View on Explorer: https://sepolia.etherscan.io/tx/' + transaction.hash);
    
    // Wait for confirmation
    console.log('\n⏳ Waiting for confirmation...');
    const receipt = await transaction.wait();
    
    console.log('✅ Transaction confirmed!');
    console.log('   Block Number:', receipt.blockNumber);
    console.log('   Gas Used:', receipt.gasUsed.toString());
    console.log('   Status:', receipt.status === 1 ? 'Success' : 'Failed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.reason) {
      console.error('   Reason:', error.reason);
    }
    if (error.code) {
      console.error('   Code:', error.code);
    }
    process.exit(1);
  }
}

// Run the script
sendTransaction();

