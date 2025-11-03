# Contract Deployment Instructions

## 🚀 Quick Deploy (Recommended: Remix IDE)

### Step 1: Deploy Contract Using Remix IDE (Easiest Method)

1. **Open Remix**: Go to https://remix.ethereum.org/

2. **Create File**: 
   - Click "File Explorer" in left sidebar
   - Create new file: `GMMessageReceiver.sol`
   - **Copy content from `contracts/GMMessageReceiver-Remix.sol`** (simpler version for Remix)
   - OR use `contracts/GMMessageReceiver.sol` (full version)

3. **Compile**:
   - Go to "Solidity Compiler" tab
   - Select compiler version: `0.8.20` or compatible
   - Click "Compile GMMessageReceiver.sol"

4. **Connect Wallet**:
   - Go to "Deploy & Run Transactions" tab
   - Select environment: `Injected Provider - MetaMask`
   - Make sure MetaMask is open and connected to Irys Testnet (Chain ID: 1270)
   - If not connected, add Irys Testnet:
     - Network Name: Irys Testnet
     - RPC URL: https://testnet-rpc.irys.xyz/v1/execution-rpc
     - Chain ID: 1270 (0x4f6)
     - Currency Symbol: IRYS

5. **Deploy**:
   - Click "Deploy" button
   - Confirm transaction in MetaMask
   - Wait for deployment confirmation

6. **Copy Address**:
   - After deployment, copy the contract address from Remix
   - It will look like: `0x1234...5678`

## Step 2: Update App Code

1. Open `app.js`
2. Find this line:
   ```javascript
   const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
   ```
3. Replace with your deployed contract address:
   ```javascript
   const CONTRACT_ADDRESS = '0xYourDeployedContractAddress';
   ```
4. Save the file

## Step 3: Test

1. Refresh your dApp
2. Connect wallet
3. Send a GM message
4. Check the transaction on Irys Explorer: https://testnet-explorer.irys.xyz

## Alternative: Use Existing Contract

If you already have a contract deployed that accepts transactions, you can use that address instead.

The contract needs to have either:
- `receive()` function, OR
- `fallback()` function

This allows it to accept transactions with data.
