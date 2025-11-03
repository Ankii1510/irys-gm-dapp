# Irys GM dApp - Send Messages on Irys Testnet

A decentralized application (dApp) to send "GM" messages on Irys Testnet blockchain using MetaMask or other EIP-1193 compatible wallets.

## 🚀 Features

- Connect MetaMask, Coinbase Wallet, or any EIP-1193 compatible wallet
- Send GM messages to a smart contract on Irys Testnet
- Direct RPC calls - No SDK dependencies
- Native IRYS token support
- Real-time balance checking
- Transaction explorer links

## 📋 Prerequisites

- Node.js 16+ installed
- MetaMask or compatible wallet extension
- Irys Testnet tokens (get from [Irys Faucet](https://irys.xyz/faucet))

## 🛠️ Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd irys

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will open at `http://localhost:8080`

## 📁 Project Structure

```
irys/
├── app.js              # Main application logic
├── index.html          # UI and HTML
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── contracts/          # Smart contracts
│   ├── GMMessageReceiver.sol
│   └── GMMessageReceiver-Remix.sol
└── DEPLOY_INSTRUCTIONS.md  # Contract deployment guide
```

## 🌐 Network Configuration

- **Network**: Irys Testnet
- **Chain ID**: 1270 (0x4f6)
- **RPC URL**: https://testnet-rpc.irys.xyz/v1/execution-rpc
- **Explorer**: https://testnet-explorer.irys.xyz
- **Native Currency**: IRYS

## 📝 Smart Contract

Contract Address: `0x9fc9B8893F462B4B9a7c0B12b07d2F3C57C40a53`

See `contracts/GMMessageReceiver-Remix.sol` for contract code.

## 🔧 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

## 🚀 Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Vercel will auto-detect Vite
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📖 Usage

1. Connect your wallet (MetaMask/Coinbase)
2. Ensure you're on Irys Testnet
3. Enter your message (default: "GM")
4. Click "Send GM to Irys"
5. Confirm transaction in wallet
6. View transaction on explorer

## 🔒 Security

- Never commit private keys
- Use testnet only for development
- Always verify contract addresses
- Review transactions before confirming

## 📄 License

MIT

## 🙏 Acknowledgments

- Irys Testnet
- Ethers.js
- Vite