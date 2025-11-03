// SPDX-License-Identifier: MIT
// Simple version for Remix IDE deployment
// Copy this entire file to Remix IDE

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
    
    /**
     * @dev Receive function - accepts plain ETH transfers
     * Note: receive() cannot access msg.data, so it defaults to "GM"
     */
    receive() external payable {
        _storeMessage("GM");
    }
    
    /**
     * @dev Fallback function - handles transactions with data
     * This is where we extract the message from transaction data
     */
    fallback() external payable {
        string memory message = extractMessage(msg.data);
        _storeMessage(message);
    }
    
    /**
     * @dev Store message and emit event
     */
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
    
    /**
     * @dev Extract string message from transaction data
     */
    function extractMessage(bytes calldata data) internal pure returns (string memory) {
        if (data.length == 0) {
            return "GM";
        }
        
        // Try to decode as UTF-8 string
        uint256 start = 0;
        if (data.length >= 2 && data[0] == 0x47 && data[1] == 0x4d) {
            // Starts with "GM" (0x474d)
            start = 0;
        } else if (data.length > 4) {
            // Might have function selector, skip it
            start = 4;
        }
        
        // Convert remaining bytes to string
        bytes memory messageBytes = new bytes(data.length - start);
        for (uint256 i = 0; i < messageBytes.length && (start + i) < data.length; i++) {
            messageBytes[i] = data[start + i];
        }
        
        return string(messageBytes);
    }
    
    /**
     * @dev Get total number of messages
     */
    function getMessageCount() external view returns (uint256) {
        return messages.length;
    }
    
    /**
     * @dev Get message by index
     */
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
    
    /**
     * @dev Get message count for a specific sender
     */
    function getSenderMessageCount(address sender) external view returns (uint256) {
        return messageCount[sender];
    }
}
