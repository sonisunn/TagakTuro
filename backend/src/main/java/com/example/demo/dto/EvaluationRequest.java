package com.example.demo.dto;

public class EvaluationRequest {

    private Long bookingId;
    private Long evaluatorId;
    private Long evaluateeId;
    private String evaluationType; // TUTOR_EVALUATES_STUDENT | STUDENT_EVALUATES_TUTOR
    private String q1Answer;
    private String q2Answer;
    private String q3Answer;   // nullable for forms with only 2 MCQ questions
    private String openComment;

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }

    public Long getEvaluatorId() { return evaluatorId; }
    public void setEvaluatorId(Long evaluatorId) { this.evaluatorId = evaluatorId; }

    public Long getEvaluateeId() { return evaluateeId; }
    public void setEvaluateeId(Long evaluateeId) { this.evaluateeId = evaluateeId; }

    public String getEvaluationType() { return evaluationType; }
    public void setEvaluationType(String evaluationType) { this.evaluationType = evaluationType; }

    public String getQ1Answer() { return q1Answer; }
    public void setQ1Answer(String q1Answer) { this.q1Answer = q1Answer; }

    public String getQ2Answer() { return q2Answer; }
    public void setQ2Answer(String q2Answer) { this.q2Answer = q2Answer; }

    public String getQ3Answer() { return q3Answer; }
    public void setQ3Answer(String q3Answer) { this.q3Answer = q3Answer; }

    public String getOpenComment() { return openComment; }
    public void setOpenComment(String openComment) { this.openComment = openComment; }
}
