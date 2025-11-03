# GM Message Receiver Contract

## Contract Overview
Simple Solidity contract that receives and stores GM messages on Irys Testnet.

## Features
- Accepts transactions with message data via `receive()` or `fallback()` functions
- Stores messages with sender address, timestamp, and block number
- Emits events for each message received
- Provides view functions to read stored messages

## Deployment

### Option 1: Using Remix IDE (Recommended for Testnet)

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create a new file `GMMessageReceiver.sol`
3. Copy the contract code from `contracts/GMMessageReceiver.sol`
4. Compile the contract (Solidity version 0.8.20 or compatible)
5. Deploy:
   - Select "Injected Provider - MetaMask" as environment
   - Make sure MetaMask is connected to Irys Testnet (Chain ID: 1270)
   - Click "Deploy"
   - Confirm the transaction in MetaMask
6. Copy the deployed contract address
7. Update `CONTRACT_ADDRESS` in `app.js`

### Option 2: Using Hardhat (If you have setup)

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network irys-testnet
```

## Contract Address Format
Update in `app.js`:
```javascript
const CONTRACT_ADDRESS = '0x...'; // Your deployed contract address
```

## Usage
The contract accepts any transaction with data. The message is extracted from the transaction data field.

Example transaction:
- `to`: Contract address
- `data`: "0x474d" (hex encoded "GM")
- `value`: 0

The contract will extract the message and store it.
