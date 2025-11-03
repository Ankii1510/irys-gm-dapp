import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Irys Testnet RPC
const IRYS_RPC_URL = 'https://testnet-rpc.irys.xyz/v1/execution-rpc';

// Contract bytecode and ABI (will be compiled)
const CONTRACT_CODE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GMMessageReceiver {
    event MessageReceived(address indexed sender, string message, uint256 timestamp);
    
    struct MessageData {
        address sender;
        string message;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    MessageData[] public messages;
    mapping(address => uint256) public messageCount;
    
    receive() external payable {
        string memory message = extractMessage(msg.data);
        _storeMessage(message);
    }
    
    fallback() external payable {
        string memory message = extractMessage(msg.data);
        _storeMessage(message);
    }
    
    function _storeMessage(string memory _message) internal {
        MessageData memory newMessage = MessageData({
            sender: msg.sender,
            message: _message,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        messages.push(newMessage);
        messageCount[msg.sender]++;
        
        emit MessageReceived(msg.sender, _message, block.timestamp);
    }
    
    function extractMessage(bytes calldata data) internal pure returns (string memory) {
        if (data.length == 0) {
            return "GM";
        }
        
        uint256 start = 0;
        if (data.length >= 4 && data[0] == 0x47 && data[1] == 0x4d) {
            start = 0;
        } else if (data.length > 4) {
            start = 4;
        }
        
        bytes memory messageBytes = new bytes(data.length - start);
        for (uint256 i = 0; i < messageBytes.length && (start + i) < data.length; i++) {
            messageBytes[i] = data[start + i];
        }
        
        return string(messageBytes);
    }
    
    function getMessageCount() external view returns (uint256) {
        return messages.length;
    }
    
    function getMessage(uint256 index) external view returns (
        address sender,
        string memory message,
        uint256 timestamp,
        uint256 blockNumber
    ) {
        require(index < messages.length, "Index out of bounds");
        MessageData memory msgData = messages[index];
        return (msgData.sender, msgData.message, msgData.timestamp, msgData.blockNumber);
    }
}
`;

// Simplified Contract (for direct deployment via Remix)
// This is what you'll use in Remix IDE
const REMIX_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GMMessageReceiver {
    event MessageReceived(address indexed sender, string message, uint256 timestamp);
    
    receive() external payable {
        emit MessageReceived(msg.sender, extractMessage(msg.data), block.timestamp);
    }
    
    fallback() external payable {
        emit MessageReceived(msg.sender, extractMessage(msg.data), block.timestamp);
    }
    
    function extractMessage(bytes calldata data) internal pure returns (string memory) {
        if (data.length == 0) return "GM";
        return string(data);
    }
    
    function getMessageCount() external view returns (uint256) {
        return address(this).balance; // Simple counter
    }
}`;

async function deployWithPrivateKey() {
    try {
        console.log('🚀 Contract Deployment Script');
        console.log('=============================\n');

        // Get private key from environment or prompt
        const privateKey = process.env.PRIVATE_KEY || process.argv[2];
        
        if (!privateKey || privateKey === 'YOUR_PRIVATE_KEY_HERE') {
            console.error('❌ Error: Private key required!');
            console.log('\nUsage:');
            console.log('  PRIVATE_KEY=your_private_key node deploy-contract.js');
            console.log('  OR');
            console.log('  node deploy-contract.js your_private_key');
            console.log('\n⚠️  WARNING: Never share your private key!');
            console.log('⚠️  Use only with testnet/test accounts!');
            process.exit(1);
        }

        // Create provider and wallet
        console.log('📡 Connecting to Irys Testnet...');
        const provider = new ethers.JsonRpcProvider(IRYS_RPC_URL);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        console.log('👛 Wallet Address:', wallet.address);
        
        // Check balance
        const balance = await provider.getBalance(wallet.address);
        const balanceFormatted = ethers.formatEther(balance);
        console.log('💰 Balance:', balanceFormatted, 'IRYS\n');

        if (balance < ethers.parseEther('0.001')) {
            console.error('❌ Insufficient balance! Need at least 0.001 IRYS for deployment.');
            console.log('💡 Get testnet tokens from: https://irys.xyz/faucet\n');
            process.exit(1);
        }

        console.log('⚠️  Automatic deployment requires compiled bytecode.');
        console.log('📝 Using Remix IDE is recommended for easy deployment.\n');
        console.log('📋 Remix Deployment Steps:');
        console.log('   1. Go to: https://remix.ethereum.org/');
        console.log('   2. Create file: GMMessageReceiver.sol');
        console.log('   3. Copy contract from: contracts/GMMessageReceiver.sol');
        console.log('   4. Compile (Solidity 0.8.20)');
        console.log('   5. Deploy with MetaMask (Irys Testnet)');
        console.log('   6. Copy deployed address\n');

        // Save simplified contract for Remix
        const remixPath = path.join(__dirname, 'contracts', 'GMMessageReceiver-Remix.sol');
        fs.writeFileSync(remixPath, REMIX_CONTRACT);
        console.log('✅ Created simplified contract: contracts/GMMessageReceiver-Remix.sol');
        console.log('   Use this in Remix for easier deployment!\n');

        console.log('💡 Alternative: Use Remix IDE deployment (See DEPLOY_INSTRUCTIONS.md)');

    } catch (error) {
        console.error('❌ Deployment error:', error.message);
        if (error.code === 'INVALID_ARGUMENT') {
            console.error('   Invalid private key format');
        } else if (error.code === 'NETWORK_ERROR') {
            console.error('   Cannot connect to Irys Testnet RPC');
        }
        process.exit(1);
    }
}

// Run deployment
deployWithPrivateKey();
