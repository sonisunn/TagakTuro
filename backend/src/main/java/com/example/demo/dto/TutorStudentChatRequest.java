package com.example.demo.dto;

public class TutorStudentChatRequest {
    private Long studentUserId;
    private Long tutorUserId;
    private String messageContent;

    public TutorStudentChatRequest() {}

    public TutorStudentChatRequest(Long studentUserId, Long tutorUserId, String messageContent) {
        this.studentUserId = studentUserId;
        this.tutorUserId = tutorUserId;
        this.messageContent = messageContent;
    }

    public Long getStudentUserId() {
        return studentUserId;
    }

    public void setStudentUserId(Long studentUserId) {
        this.studentUserId = studentUserId;
    }

    public Long getTutorUserId() {
        return tutorUserId;
    }

    public void setTutorUserId(Long tutorUserId) {
        this.tutorUserId = tutorUserId;
    }

    public String getMessageContent() {
        return messageContent;
    }

    public void setMessageContent(String messageContent) {
        this.messageContent = messageContent;
    }
}
