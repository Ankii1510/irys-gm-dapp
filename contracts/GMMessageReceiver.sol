// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GMMessageReceiver
 * @dev Simple contract to receive and store GM messages on Irys Testnet
 */
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
     * Note: receive() cannot access msg.data in Solidity, so it defaults to "GM"
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
     * Assumes message is encoded as bytes in the data field
     */
    function extractMessage(bytes calldata data) internal pure returns (string memory) {
        if (data.length == 0) {
            return "GM";
        }
        
        // Try to decode as UTF-8 string
        // Skip function selector (4 bytes) if present
        uint256 start = 0;
        if (data.length >= 4 && data[0] == 0x47 && data[1] == 0x4d) {
            // Check if starts with "GM" (0x474d)
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
     * @dev Get all messages from a specific sender
     */
    function getMessagesBySender(address sender) external view returns (MessageData[] memory) {
        uint256 count = messageCount[sender];
        MessageData[] memory result = new MessageData[](count);
        uint256 j = 0;
        
        for (uint256 i = 0; i < messages.length; i++) {
            if (messages[i].sender == sender) {
                result[j] = messages[i];
                j++;
            }
        }
        
        return result;
    }
}
