// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MessageStore {
    struct Message {
        address sender; // 发送者地址
        string content; // 消息内容
        uint256 timestamp; // 时间戳
    }

    Message[] private messages; // 保存所有消息记录

    event MessageSent(address indexed sender, string content, uint256 timestamp);

    // 发送消息
    function sendMessage(string calldata content) public {
        require(bytes(content).length > 0, "Message content cannot be empty");

        Message memory newMessage = Message({
            sender: msg.sender,
            content: content,
            timestamp: block.timestamp
        });

        messages.push(newMessage); // 保存消息到数组中

        emit MessageSent(msg.sender, content, block.timestamp); // 触发事件
    }

    // 获取所有消息记录
    function getAllMessages() public view returns (Message[] memory) {
        return messages;
    }

    // 获取消息总数
    function getMessageCount() public view returns (uint256) {
        return messages.length;
    }
}
