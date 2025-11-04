import { ethers } from 'ethers';

// Irys Testnet RPC Configuration - Direct RPC calls, no SDK needed!
const IRYS_RPC_URL = 'https://testnet-rpc.irys.xyz/v1/execution-rpc';
const IRYS_EXPLORER = 'https://testnet-explorer.irys.xyz';

// Irys Testnet Network Configuration - Irys Native Blockchain
const IRYS_TESTNET = {
    chainId: '0x4f6', // 1270 in decimal (correct format: lowercase)
    chainName: 'Irys Testnet',
    nativeCurrency: {
        name: 'IRYS',
        symbol: 'IRYS',
        decimals: 18,
    },
    rpcUrls: ['https://testnet-rpc.irys.xyz/v1/execution-rpc'],
    blockExplorerUrls: ['https://testnet-explorer.irys.xyz'],
};

// Contract Address - GMMessageReceiver deployed on Irys Testnet
const CONTRACT_ADDRESS = '0x9fc9B8893F462B4B9a7c0B12b07d2F3C57C40a53';

// Contract ABI for reading messages
const CONTRACT_ABI = [
    "function getMessageCount() external view returns (uint256)",
    "function getMessage(uint256 index) external view returns (address sender, string memory message, uint256 timestamp, uint256 blockNumber)",
    "function getSenderMessageCount(address sender) external view returns (uint256)",
    "event MessageReceived(address indexed sender, string message, uint256 timestamp)"
];

let provider;        // ethers provider (BrowserProvider)
let signer;
let userAddress;
let selectedWallet = null;
let walletProvider = null;

// DOM elements
const connectBtn = document.getElementById('connectBtn');
const sendBtn = document.getElementById('sendBtn');
const walletInfo = document.getElementById('walletInfo');
const transactionForm = document.getElementById('transactionForm');
const statusDiv = document.getElementById('status');

// Wallet option elements
const walletOptions = document.querySelectorAll('.wallet-option');

// -----------------------------
// Helper: unified request wrapper
// Supports providers that implement `request` or legacy `send`.
// Returns the result of the RPC call.
async function walletRequest(wProvider, params) {
    if (!wProvider) throw new Error('No wallet provider available');
    if (typeof wProvider.request === 'function') {
        return await wProvider.request(params);
    }
    // Legacy providers might use send(payload, callback) or send(method, params)
    if (typeof wProvider.send === 'function') {
        // Try common signatures
        try {
            // Some send implementations accept (method, params)
            if (params && params.method) {
                // modern JSON-RPC payload or object
                if (Array.isArray(params)) {
                    // unlikely; fallback
                    return await wProvider.send(params[0].method, params[0].params || []);
                } else {
                    // method + params
                    return await new Promise((resolve, reject) => {
                        wProvider.send(params.method, params.params || [], (err, res) => {
                            if (err) return reject(err);
                            resolve(res);
                        });
                    });
                }
            } else {
                throw new Error('Unsupported params for legacy provider.send');
            }
        } catch (e) {
            throw new Error('Wallet provider does not support request/send in expected form: ' + e.message);
        }
    }
    throw new Error('Wallet provider does not support request/send');
}
// -----------------------------

// Initialize wallet selector UI
walletOptions.forEach(option => {
    option.addEventListener('click', () => {
        walletOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedWallet = option.dataset.wallet;
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect Wallet';
        console.log('Wallet selected:', selectedWallet);
        showStatus(`Selected: ${option.querySelector('strong').textContent}. Click Connect Wallet to continue.`, 'info');
    });
});

function getWalletProvider() {
    if (!selectedWallet) {
        throw new Error('Please select a wallet first');
    }

    switch (selectedWallet) {
        case 'metamask':
            if (window.ethereum && window.ethereum.isMetaMask) {
                return window.ethereum;
            }
            throw new Error('MetaMask is not installed');

        case 'coinbase':
            // Most modern Coinbase Wallet injections set window.ethereum.isCoinbaseWallet = true
            if (window.ethereum && window.ethereum.isCoinbaseWallet) {
                return window.ethereum;
            }
            // Legacy fallback (rare)
            if (typeof window.coinbase !== 'undefined') {
                return window.coinbase;
            }
            throw new Error('Coinbase Wallet is not installed');

        case 'browser':
            if (window.ethereum) {
                return window.ethereum;
            }
            throw new Error('No browser wallet detected');

        default:
            throw new Error('Invalid wallet selection');
    }
}

function getWalletName() {
    switch (selectedWallet) {
        case 'metamask':
            return 'MetaMask';
        case 'coinbase':
            return 'Coinbase Wallet';
        case 'browser':
            return 'Browser Wallet';
        default:
            return 'Unknown';
    }
}

// Switch to Irys Testnet network with guard for request method
async function switchToIrysTestnet(wProvider) {
    if (!wProvider) throw new Error('No wallet provider available for network switch');
    try {
        await walletRequest(wProvider, {
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: IRYS_TESTNET.chainId }],
        });
        console.log('Switched to Irys Testnet');
    } catch (switchError) {
        // Network doesn't exist, try to add it
        // Common codes: 4902 (wallet doesn't have the chain)
        const code = switchError && (switchError.code ?? switchError.error?.code ?? switchError.status ?? null);
        if (code === 4902 || code === -32603) {
            try {
                await walletRequest(wProvider, {
                    method: 'wallet_addEthereumChain',
                    params: [IRYS_TESTNET],
                });
                console.log('Added and switched to Irys Testnet');
            } catch (addError) {
                console.error('Failed to add Irys Testnet:', addError);
                showStatus('Failed to switch to Irys Testnet. Please add it manually in your wallet.', 'error');
                throw addError;
            }
        } else {
            console.error('Failed to switch network:', switchError);
            throw switchError;
        }
    }
}

// Initialize wallet detection & auto selection
function initializeWalletDetection() {
    // Auto-select first available wallet and enable connect button
    if (window.ethereum) {
        if (window.ethereum.isMetaMask) {
            const el = document.getElementById('walletMetaMask');
            if (el) el.classList.add('selected');
            selectedWallet = 'metamask';
            connectBtn.disabled = false;
            console.log('Auto-selected MetaMask');
            showStatus('MetaMask detected. Click Connect Wallet to continue.', 'info');
        } else {
            const el = document.getElementById('walletBrowser');
            if (el) el.classList.add('selected');
            selectedWallet = 'browser';
            connectBtn.disabled = false;
            console.log('Auto-selected Browser Wallet');
            showStatus('Browser wallet detected. Click Connect Wallet to continue.', 'info');
        }

        // Safe event registration guards
        try {
            if (typeof window.ethereum.on === 'function') {
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (!accounts || accounts.length === 0) {
                        disconnect();
                    } else {
                        // Reconnect/update state
                        // Do not force full reconnection if already connected — just update UI
                        connectWallet().catch(err => console.warn('Error on accountsChanged connect:', err));
                    }
                });

                window.ethereum.on('chainChanged', () => {
                    // Many wallets require reload on chain change to reset provider/signer state
                    window.location.reload();
                });
            }
        } catch (e) {
            console.warn('Unable to attach ethereum event listeners safely:', e);
        }
    } else if (typeof window.coinbase !== 'undefined') {
        const el = document.getElementById('walletCoinbase');
        if (el) el.classList.add('selected');
        selectedWallet = 'coinbase';
        connectBtn.disabled = false;
        console.log('Auto-selected Coinbase Wallet (legacy injection)');
        showStatus('Coinbase Wallet detected. Click Connect Wallet to continue.', 'info');
    } else {
        showStatus('No wallet detected automatically. Please select a wallet option above.', 'info');
        connectBtn.disabled = true;
        connectBtn.textContent = 'Select Wallet First';
    }

    // Check if already connected
    checkConnection();

    console.log('Wallet options initialized. Selected wallet:', selectedWallet);
}

// Run on page load
window.addEventListener('load', () => {
    console.log('Page loaded. Checking for wallets...');
    console.log('window.ethereum:', window.ethereum);
    console.log('window.coinbase:', window.coinbase);

    setTimeout(() => {
        initializeWalletDetection();
    }, 100);
});

// Also try to detect wallet when ethereum becomes available
if (typeof window.ethereum !== 'undefined') {
    initializeWalletDetection();
} else {
    // Some wallets dispatch a custom event when injected
    window.addEventListener('ethereum#initialized', initializeWalletDetection, {
        once: true,
    });
}

// Check if wallet is already connected
async function checkConnection() {
    try {
        if (!selectedWallet) {
            return; // Don't check if no wallet is selected
        }
        const rpcProvider = getWalletProvider(); // avoid shadowing global `provider`
        const accounts = await walletRequest(rpcProvider, { method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
            console.log('Already connected accounts found:', accounts);
            await connectWallet();
        }
    } catch (error) {
        console.error('Error checking connection:', error);
        // keep quiet in UI — user can connect manually
    }
}

// Connect wallet
if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
        await connectWallet();
    });
}

async function connectWallet() {
    try {
        if (!selectedWallet) {
            showStatus('Please select a wallet first.', 'error');
            console.error('No wallet selected');
            return;
        }

        console.log('Attempting to connect wallet:', selectedWallet);
        showStatus('Connecting to wallet...', 'info');

        // Get wallet provider (injected)
        walletProvider = getWalletProvider();
        console.log('Wallet provider obtained:', walletProvider);

        // Request account access
        console.log('Requesting account access...');
        const accounts = await walletRequest(walletProvider, { method: 'eth_requestAccounts' });
        console.log('Accounts received:', accounts);

        // Switch to Irys Testnet network
        showStatus('Switching to Irys Testnet...', 'info');
        await switchToIrysTestnet(walletProvider);

        // Build ethers provider & signer
        // Note: ethers v6 uses BrowserProvider (not JsonRpcProvider) and getSigner() is async
        console.log('Creating ethers provider from wallet provider...');
        
        if (!walletProvider) {
            throw new Error('Wallet provider is not available');
        }
        
        // Create ethers provider using BrowserProvider (ethers v6)
        console.log('Creating ethers BrowserProvider...');
        
        if (!ethers || !ethers.BrowserProvider) {
            throw new Error('Ethers v6 BrowserProvider not available. Please check ethers installation.');
        }
        
        try {
            provider = new ethers.BrowserProvider(walletProvider);
            console.log('Provider created successfully:', provider.constructor.name);
            
            // In ethers v6, getSigner is an async method on BrowserProvider
            // It's always available, so we call it directly
            console.log('Calling provider.getSigner()...');
            signer = await provider.getSigner();
            
            if (!signer) {
                throw new Error('getSigner returned null/undefined');
            }
            
            console.log('Signer obtained:', signer.constructor.name);
            userAddress = await signer.getAddress();
            console.log('User address:', userAddress);
            
        } catch (providerError) {
            console.error('Provider/Signer error details:', {
                error: providerError,
                message: providerError.message,
                stack: providerError.stack,
                provider: provider?.constructor?.name,
                walletProvider: walletProvider?.constructor?.name
            });
            throw new Error(`Provider/Signer error: ${providerError.message}. Please check browser console for details.`);
        }

        // No SDK needed - using direct RPC calls via ethers!
        console.log('✅ Connected to Irys Testnet via RPC');
        showStatus('Connected to Irys Testnet!', 'success');

        // Update UI
        const walletTypeEl = document.getElementById('walletType');
        const addressEl = document.getElementById('address');
        const displayContractEl = document.getElementById('displayContractAddress');
        const networkInfoEl = document.getElementById('networkInfo');

        if (walletTypeEl) walletTypeEl.textContent = getWalletName();
        if (addressEl) addressEl.textContent = userAddress;
        if (displayContractEl) displayContractEl.textContent = CONTRACT_ADDRESS;
        if (networkInfoEl) networkInfoEl.textContent = 'Irys Testnet';

        // Update balance and features after short delay
        setTimeout(async () => {
            await updateBalance();
            await updateGasPrice();
            await loadContractStats();
        }, 1000);

        if (walletInfo) walletInfo.style.display = 'block';
        if (transactionForm) transactionForm.style.display = 'block';
        if (connectBtn) {
            connectBtn.textContent = 'Connected ✓';
            connectBtn.disabled = true;
        }

        showStatus('Successfully connected! Ready to send GM messages.', 'success');

    } catch (error) {
        if (error && (error.code === 4001 || error?.data?.code === 4001)) {
            showStatus('Connection rejected by user.', 'error');
        } else {
            showStatus(`Connection error: ${error.message || String(error)}`, 'error');
            console.error('Connection error:', error);
        }
    }
}

// Update IRYS balance - Direct RPC call, no SDK needed
async function updateBalance() {
    try {
        if (!userAddress || !provider) {
            const balEl = document.getElementById('balance');
            if (balEl) balEl.textContent = 'Not connected';
            return;
        }

        console.log('Fetching balance for:', userAddress);
        const balEl = document.getElementById('balance');

        // Get native IRYS balance directly from Irys Testnet network via RPC
        try {
            console.log('Checking native IRYS balance from network...');
            const nativeBal = await provider.getBalance(userAddress);
            const nativeBalance = ethers.formatEther(nativeBal);
            console.log('Native IRYS balance from network:', nativeBalance);
            
            // Display the balance
            if (balEl) {
                const balanceNum = parseFloat(nativeBalance);
                if (balanceNum > 0) {
                    balEl.textContent = `${balanceNum.toFixed(6)} IRYS`;
                } else {
                    balEl.textContent = `0 IRYS`;
                }
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            if (balEl) balEl.textContent = `Error: ${error.message || 'Unable to load balance'}`;
        }

    } catch (error) {
        console.error('Error fetching balance:', error);
        const balEl = document.getElementById('balance');
        if (balEl) balEl.textContent = `Error: ${error.message || 'Unable to load balance'}`;
    }
}

// Send GM message
if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
        await sendGmMessage();
    });
}

async function sendGmMessage() {
    try {
        if (!provider || !signer || !userAddress) {
            showStatus('Please connect your wallet first.', 'error');
            return;
        }

        const contractAddress = CONTRACT_ADDRESS;
        const message = (document.getElementById('message')?.value || '').trim() || 'GM';

        if (!message) {
            showStatus('Please enter a message.', 'error');
            return;
        }

        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        showStatus('Preparing transaction...', 'info');

        // Verify we're on the correct network
        try {
            const chainId = await walletRequest(walletProvider, { method: 'eth_chainId' });
            const expectedChainId = IRYS_TESTNET.chainId.toLowerCase();
            const currentChainId = chainId.toLowerCase();
            
            if (currentChainId !== expectedChainId) {
                console.warn('Wrong network detected, switching to Irys Testnet...');
                await switchToIrysTestnet(walletProvider);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (networkError) {
            console.warn('Network check failed:', networkError.message);
        }

        // Get balance
        const balance = await provider.getBalance(userAddress);
        const balanceFormatted = ethers.formatEther(balance);
        console.log('Your balance:', balanceFormatted, 'IRYS');

        // Check if balance is sufficient (minimum 0.001 IRYS for gas)
        const minRequired = ethers.parseEther('0.001');
        if (balance < minRequired) {
            throw new Error(`Insufficient balance. Need at least 0.001 IRYS for gas, but have ${balanceFormatted} IRYS. Get more tokens from: https://irys.xyz/faucet`);
        }

        // Encode message as hex data
        const messageBytes = new TextEncoder().encode(message);
        const messageHex = ethers.hexlify(messageBytes);
        console.log('Message hex data:', messageHex);

        showStatus('Please confirm the transaction in your wallet...', 'info');
        console.log('Sending transaction to contract - wallet popup should appear now...');

        // Send transaction directly to contract with message data
        // Try to send with manual gas limit to avoid estimation issues
        try {
            // First, try with automatic gas estimation
            var tx = await signer.sendTransaction({
                to: contractAddress,
                data: messageHex,
                value: 0,
            });
        } catch (estError) {
            // If estimation fails, try with manual gas limit
            console.warn('Gas estimation failed, using manual gas limit:', estError.message);
            const manualGasLimit = 100000n; // 100k gas should be enough for simple transaction
            tx = await signer.sendTransaction({
                to: contractAddress,
                data: messageHex,
                value: 0,
                gasLimit: manualGasLimit, // Manual gas limit
            });
        }

        console.log('Transaction sent, waiting for confirmation... Hash:', tx.hash);
        showStatus(`Transaction sent! Hash: ${tx.hash}<br>Waiting for confirmation...`, 'info');

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed! Receipt:', receipt);

        await updateBalance();

        const explorerUrl = `${IRYS_EXPLORER}/tx/${receipt.hash}`;
        const explorerHomeUrl = IRYS_EXPLORER;
        
        // Calculate actual gas cost
        const gasUsed = receipt.gasUsed || tx.gasLimit || 0n;
        const gasPrice = receipt.gasPrice || await provider.getFeeData().then(f => f.gasPrice) || ethers.parseUnits('1', 'gwei');
        const actualCost = gasUsed * gasPrice;
        const actualCostFormatted = ethers.formatEther(actualCost);
        
        // Save to transaction history
        try {
            saveTransactionToHistory(receipt.hash, message, actualCostFormatted);
            console.log('Transaction saved to history:', receipt.hash);
        } catch (error) {
            console.error('Error saving transaction to history:', error);
        }

        showStatus(
            `✅ GM message sent successfully!<br>` +
            `🆔 Transaction Hash: ${receipt.hash}<br>` +
            `📦 Block Number: ${receipt.blockNumber}<br>` +
            `⛽ Gas Used: ${gasUsed.toString()}<br>` +
            `💰 Gas Cost: ${actualCostFormatted} IRYS<br>` +
            `📍 Contract Address: ${contractAddress}<br>` +
            `💬 Message: ${message}<br>` +
            `<a href="${explorerUrl}" target="_blank" class="link">View on Explorer</a> | ` +
            `<a href="${explorerHomeUrl}" target="_blank" class="link">Check Explorer</a>`,
            'success'
        );

        // Reset message to default
        const msgEl = document.getElementById('message');
        if (msgEl) msgEl.value = 'GM';

    } catch (error) {
        if (error && (error.code === 4001 || error?.data?.code === 4001)) {
            showStatus('Transaction rejected by user.', 'error');
        } else {
            showStatus(`Error: ${error.message || String(error)}`, 'error');
            console.error('Send GM error:', error);
        }
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send GM to Irys';
        }
    }
}

// Disconnect
function disconnect() {
    provider = null;
    signer = null;
    userAddress = null;
    walletProvider = null;

    if (walletInfo) walletInfo.style.display = 'none';
    if (transactionForm) transactionForm.style.display = 'none';
    if (connectBtn) {
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.disabled = false;
    }
    if (statusDiv) statusDiv.innerHTML = '';

    walletOptions.forEach(opt => opt.classList.remove('selected'));
    selectedWallet = null;
}

// Show status message
function showStatus(message, type) {
    if (!statusDiv) return;
    statusDiv.className = `status ${type}`;
    statusDiv.innerHTML = message;
    statusDiv.style.display = 'block';
}

// ==========================================
// NEW FEATURES FUNCTIONS
// ==========================================

// Load gas price
async function updateGasPrice() {
    try {
        if (!provider) return;
        
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');
        const gasPriceFormatted = ethers.formatUnits(gasPrice, 'gwei');
        
        const gasEl = document.getElementById('gasPrice');
        if (gasEl) {
            gasEl.textContent = `${parseFloat(gasPriceFormatted).toFixed(2)} Gwei`;
        }
        
        // Estimate cost for a typical transaction
        const estimatedGas = 50000n; // Estimated gas for simple transaction
        const estimatedCost = gasPrice * estimatedGas;
        const costFormatted = ethers.formatEther(estimatedCost);
        
        const estimateEl = document.getElementById('gasEstimate');
        if (estimateEl) {
            estimateEl.textContent = `Estimated cost per transaction: ~${parseFloat(costFormatted).toFixed(6)} IRYS`;
        }
    } catch (error) {
        console.error('Error fetching gas price:', error);
        const gasEl = document.getElementById('gasPrice');
        if (gasEl) gasEl.textContent = 'Error loading';
    }
}

// Load contract stats
async function loadContractStats() {
    try {
        if (!provider || !userAddress) return;
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        // Get total messages
        const totalCount = await contract.getMessageCount();
        const totalEl = document.getElementById('totalMessages');
        if (totalEl) totalEl.textContent = totalCount.toString();
        
        // Get user's message count
        const userCount = await contract.getSenderMessageCount(userAddress);
        const userEl = document.getElementById('yourMessages');
        if (userEl) userEl.textContent = userCount.toString();
        
    } catch (error) {
        console.error('Error loading contract stats:', error);
        const totalEl = document.getElementById('totalMessages');
        const userEl = document.getElementById('yourMessages');
        if (totalEl) totalEl.textContent = 'Error';
        if (userEl) userEl.textContent = 'Error';
    }
}

// Load message history from contract
async function loadMessageHistory() {
    try {
        if (!provider) {
            showStatus('Please connect your wallet first.', 'error');
            return;
        }
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const totalCount = await contract.getMessageCount();
        
        const historyEl = document.getElementById('messageHistory');
        if (!historyEl) return;
        
        historyEl.style.display = 'block';
        historyEl.innerHTML = '<div style="font-size: 12px; color: #666;">Loading messages...</div>';
        
        // Load last 10 messages (or all if less than 10)
        const count = Number(totalCount);
        const startIndex = Math.max(0, count - 10);
        const messagesToLoad = count - startIndex;
        
        if (messagesToLoad === 0) {
            historyEl.innerHTML = '<div style="font-size: 12px; color: #666;">No messages found</div>';
            return;
        }
        
        let html = '<div style="font-size: 11px;">';
        for (let i = count - 1; i >= startIndex && i >= 0; i--) {
            try {
                const [sender, message, timestamp, blockNumber] = await contract.getMessage(i);
                const date = new Date(Number(timestamp) * 1000);
                const dateStr = date.toLocaleString();
                const shortAddr = `${sender.substring(0, 6)}...${sender.substring(38)}`;
                
                html += `
                    <div style="padding: 8px; margin-bottom: 8px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #007bff;">
                        <strong>${message}</strong><br>
                        <span style="color: #666; font-size: 10px;">
                            From: ${shortAddr} | ${dateStr}<br>
                            Block: ${blockNumber.toString()}
                        </span>
                    </div>
                `;
            } catch (err) {
                console.warn(`Error loading message ${i}:`, err);
            }
        }
        html += '</div>';
        historyEl.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading message history:', error);
        const historyEl = document.getElementById('messageHistory');
        if (historyEl) {
            historyEl.innerHTML = '<div style="font-size: 12px; color: #dc3545;">Error loading messages</div>';
        }
    }
}

// Load transaction history from localStorage
function loadTransactionHistory() {
    try {
        const txHistoryEl = document.getElementById('txHistory');
        if (!txHistoryEl) {
            console.warn('txHistory element not found');
            return;
        }
        
        const historyStr = localStorage.getItem('txHistory');
        console.log('Loading transaction history, localStorage:', historyStr);
        const history = JSON.parse(historyStr || '[]');
        console.log('Parsed history:', history);
        
        if (history.length === 0) {
            txHistoryEl.innerHTML = '<div style="font-size: 12px; color: #666;">No transactions yet</div>';
            return;
        }
        
        let html = '<div style="font-size: 11px;">';
        // Show last 10 transactions, most recent first
        const recentHistory = history.slice(-10).reverse();
        recentHistory.forEach(tx => {
            const date = new Date(tx.timestamp);
            const hashLink = `${tx.hash.substring(0, 16)}...`;
            html += `
                <div style="padding: 8px; margin-bottom: 8px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #28a745;">
                    <strong>${tx.message || 'GM'}</strong><br>
                    <span style="color: #666; font-size: 10px;">
                        Hash: <a href="${IRYS_EXPLORER}/tx/${tx.hash}" target="_blank" style="color: #007bff; text-decoration: none;">${hashLink}</a><br>
                        ${date.toLocaleString()} | Cost: ${tx.cost || 'N/A'} IRYS
                    </span>
                </div>
            `;
        });
        html += '</div>';
        txHistoryEl.innerHTML = html;
        console.log('Transaction history displayed, count:', recentHistory.length);
    } catch (error) {
        console.error('Error loading transaction history:', error);
        const txHistoryEl = document.getElementById('txHistory');
        if (txHistoryEl) {
            txHistoryEl.innerHTML = '<div style="font-size: 12px; color: #dc3545;">Error loading history</div>';
        }
    }
}

// Save transaction to history
function saveTransactionToHistory(txHash, message, cost) {
    try {
        console.log('Saving transaction to history:', { txHash, message, cost });
        const history = JSON.parse(localStorage.getItem('txHistory') || '[]');
        history.push({
            hash: txHash,
            message: message,
            cost: cost,
            timestamp: Date.now()
        });
        
        // Keep only last 50 transactions
        if (history.length > 50) {
            history.shift();
        }
        
        localStorage.setItem('txHistory', JSON.stringify(history));
        console.log('Transaction saved, history length:', history.length);
        
        // Reload history display
        loadTransactionHistory();
    } catch (error) {
        console.error('Error in saveTransactionToHistory:', error);
    }
}

// Initialize new features
function initializeFeatures() {
    // Refresh stats button
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', async () => {
            refreshStatsBtn.disabled = true;
            refreshStatsBtn.textContent = 'Loading...';
            await loadContractStats();
            refreshStatsBtn.disabled = false;
            refreshStatsBtn.textContent = '🔄 Refresh Stats';
        });
    }
    
    // Load messages button
    const loadMessagesBtn = document.getElementById('loadMessagesBtn');
    if (loadMessagesBtn) {
        loadMessagesBtn.addEventListener('click', async () => {
            loadMessagesBtn.disabled = true;
            loadMessagesBtn.textContent = 'Loading...';
            await loadMessageHistory();
            loadMessagesBtn.disabled = false;
            loadMessagesBtn.textContent = '📖 Load Messages (Last 10)';
        });
    }
    
    // Clear history button
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Clear transaction history?')) {
                localStorage.removeItem('txHistory');
                loadTransactionHistory();
            }
        });
    }
    
    // Load transaction history on init
    loadTransactionHistory();
}

// Call initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFeatures);
} else {
    initializeFeatures();
}
