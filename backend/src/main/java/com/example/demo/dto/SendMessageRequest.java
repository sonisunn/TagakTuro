package com.example.demo.dto;

public class SendMessageRequest {
    private Long conversationId;
    private String content;
    private String messageType;
    private Long senderId;

    public SendMessageRequest() {
        this.messageType = "TEXT";
    }

    public SendMessageRequest(Long conversationId, String content, String messageType, Long senderId) {
        this.conversationId = conversationId;
        this.content = content;
        this.messageType = messageType != null ? messageType : "TEXT";
        this.senderId = senderId;
    }

    // Getters and Setters
    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType != null ? messageType : "TEXT";
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }
}
