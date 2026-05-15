package com.example.demo.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    public void sendApplicationStatusEmail(String to, String name, String status) {
        String subject = "TagakTuro - Application Update";
        String color = status.equalsIgnoreCase("APPROVED") ? "#2B74B4" : "#dc3545";
        
        String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>" +
                "  <div style='background-color: #2B74B4; color: white; padding: 20px; text-align: center;'>" +
                "    <h1 style='margin: 0;'>TagakTuro</h1>" +
                "  </div>" +
                "  <div style='padding: 30px; line-height: 1.6; color: #333;'>" +
                "    <h2 style='color: " + color + ";'>Hello, " + name + "!</h2>" +
                "    <p>Your application status has been updated to: <strong>" + status + "</strong></p>";

        if (status.equalsIgnoreCase("APPROVED")) {
            htmlContent += "    <p>Congratulations! You can now log in to the TagakTuro mobile app and start your tutoring journey.</p>";
        } else {
            htmlContent += "    <p>We appreciate your interest in TagakTuro. Unfortunately, your application was not approved at this time.</p>";
        }

        htmlContent += "    <p style='margin-top: 30px;'>Best regards,<br>The TagakTuro Team</p>" +
                "  </div>" +
                "  <div style='background-color: #f8f9fa; color: #666; padding: 15px; text-align: center; font-size: 12px;'>" +
                "    &copy; 2026 TagakTuro. All rights reserved." +
                "  </div>" +
                "</div>";

        sendEmail(to, subject, htmlContent);
    }

    public void sendApplicationSubmissionEmail(String to, String name, String studentId,
            String courseProgram, String email, String phoneNumber, String password) {
        String subject = "TagakTuro - Tutor Application Received";

        String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>" +
                "  <div style='background-color: #2B74B4; color: white; padding: 20px; text-align: center;'>" +
                "    <h1 style='margin: 0;'>TagakTuro</h1>" +
                "    <p style='margin: 5px 0 0; font-size: 14px;'>Tutor Application Received</p>" +
                "  </div>" +
                "  <div style='padding: 30px; line-height: 1.6; color: #333;'>" +
                "    <h2 style='color: #2B74B4;'>Successfully Registered!</h2>" +
                "    <p>Welcome to TagakTuro, <strong>" + name + "</strong>!</p>" +
                "    <p>Your tutor application has been sent and is waiting to be verified. " +
                "You may try logging in again after you receive the approval email.</p>" +
                "    <h3 style='color: #2B74B4; margin-top: 24px;'>Your Account Information</h3>" +
                "    <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>" +
                "      <tr style='background-color: #f0f7fc;'>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde; font-weight: bold; width: 40%;'>Name</td>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde;'>" + name + "</td>" +
                "      </tr>" +
                "      <tr>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde; font-weight: bold;'>Student ID</td>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde;'>" + studentId + "</td>" +
                "      </tr>" +
                "      <tr style='background-color: #f0f7fc;'>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde; font-weight: bold;'>Course / Program</td>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde;'>" + courseProgram + "</td>" +
                "      </tr>" +
                "      <tr>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde; font-weight: bold;'>Email</td>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde;'>" + email + "</td>" +
                "      </tr>" +
                "      <tr style='background-color: #f0f7fc;'>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde; font-weight: bold;'>Phone Number</td>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde;'>" + phoneNumber + "</td>" +
                "      </tr>" +
                "      <tr>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde; font-weight: bold;'>Password</td>" +
                "        <td style='padding: 10px 14px; border: 1px solid #cde;'>" + password + "</td>" +
                "      </tr>" +
                "    </table>" +
                "    <p style='margin-top: 24px; font-size: 13px; color: #666;'>Please keep this information safe. " +
                "You will be notified at this email address once your application has been reviewed.</p>" +
                "    <p style='margin-top: 20px;'>Best regards,<br><strong>The TagakTuro Team</strong></p>" +
                "  </div>" +
                "  <div style='background-color: #f8f9fa; color: #666; padding: 15px; text-align: center; font-size: 12px;'>" +
                "    &copy; 2026 TagakTuro. All rights reserved." +
                "  </div>" +
                "</div>";

        sendEmail(to, subject, htmlContent);
    }

    public void sendCancellationEmail(String to, String name, String sessionSubject,
                                       java.time.LocalDateTime bookingDateTime, String reason, String reasonHtml) {
        String emailSubject = "TagakTuro - Session Cancelled";
        String when = bookingDateTime != null
                ? bookingDateTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM d, yyyy 'at' h:mm a"))
                : "TBD";
        String session = sessionSubject != null && !sessionSubject.isBlank() ? sessionSubject : "your session";

        String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>" +
                "  <div style='background-color: #2B74B4; color: white; padding: 20px; text-align: center;'>" +
                "    <h1 style='margin: 0;'>TagakTuro</h1>" +
                "    <p style='margin: 5px 0 0; font-size: 14px;'>Session Cancellation Notice</p>" +
                "  </div>" +
                "  <div style='padding: 30px; line-height: 1.6; color: #333;'>" +
                "    <h2 style='color: #dc3545;'>Hello, " + name + "!</h2>" +
                "    <p>Your <strong>" + session + "</strong> session scheduled for <strong>" + when + "</strong> has been cancelled.</p>" +
                (reasonHtml != null ? reasonHtml : "") +
                "    <p style='margin-top: 24px;'>If this wasn't expected, please reach out to the other party or your CCED admin. " +
                "You can also book a new session anytime from the TagakTuro app.</p>" +
                "    <p style='margin-top: 30px;'>Best regards,<br><strong>The TagakTuro Team</strong></p>" +
                "  </div>" +
                "  <div style='background-color: #f8f9fa; color: #666; padding: 15px; text-align: center; font-size: 12px;'>" +
                "    &copy; 2026 TagakTuro. All rights reserved." +
                "  </div>" +
                "</div>";

        sendEmail(to, emailSubject, htmlContent);
    }

    public void sendCertificateEmail(String to, String name, double hours, double rating) {
        String subject = "TagakTuro - Completion Certificate";
        
        String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>" +
                "  <div style='background-color: #2B74B4; color: white; padding: 20px; text-align: center;'>" +
                "    <h1 style='margin: 0;'>TagakTuro</h1>" +
                "    <p style='margin: 5px 0 0;'>Official Certificate of Completion</p>" +
                "  </div>" +
                "  <div style='padding: 30px; line-height: 1.6; color: #333; text-align: center;'>" +
                "    <h2>Congratulations, " + name + "!</h2>" +
                "    <p>We are pleased to inform you that you have successfully completed your tutoring requirements.</p>" +
                "    <div style='background-color: #f0f7fc; border-radius: 8px; padding: 20px; margin: 25px 0;'>" +
                "      <p style='margin: 5px 0;'><strong>Total Hours:</strong> " + String.format("%.1f", hours) + " hours</p>" +
                "      <p style='margin: 5px 0;'><strong>Average Rating:</strong> " + String.format("%.1f", rating) + " ★</p>" +
                "    </div>" +
                "    <p>Your official certificate is now active in our system. Thank you for your dedication to peer-to-peer learning at UMak!</p>" +
                "    <p style='margin-top: 30px;'>Best regards,<br><strong>CCED Department</strong></p>" +
                "  </div>" +
                "  <div style='background-color: #f8f9fa; color: #666; padding: 15px; text-align: center; font-size: 12px;'>" +
                "    &copy; 2026 TagakTuro. All rights reserved." +
                "  </div>" +
                "</div>";

        sendEmail(to, subject, htmlContent);
    }
}
