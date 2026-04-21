package com.example.demo.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendApplicationStatusEmail(String toEmail, String name, String status) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("TagakTuro - Tutor Application Status");

            String htmlContent = buildEmailTemplate(name, status);
            helper.setText(htmlContent, true); // true indicates HTML

            mailSender.send(mimeMessage);
            System.out.println(">>> Email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("!!! ERROR: Failed to send HTML email to " + toEmail);
            e.printStackTrace();
        }
    }

    private String buildEmailTemplate(String name, String status) {
        boolean isApproved = "APPROVED".equalsIgnoreCase(status);
        String statusText = isApproved ? "APPROVED" : "REJECTED";
        String statusColor = isApproved ? "#0FE40F" : "#FF4444";
        
        String messageBody = isApproved 
            ? "Congratulations! Your tutor application for <strong>TagakTuro</strong> has been approved. You can now log in to the mobile application using your registered email and password."
            : "Thank you for your interest in becoming a tutor for <strong>TagakTuro</strong>. We regret to inform you that your application has been rejected at this time.";

        String actionButton = isApproved
            ? "<div style='text-align: center; margin-top: 30px;'>" +
              "<a href='#' style='background-color: #2B74B4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>Log In Now</a>" +
              "</div>"
            : "";

        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<style>" +
               "body { font-family: 'Poppins', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }" +
               ".container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 15px; overflow: hidden; border: 1px solid #2B74B4; }" +
               ".header { background-color: #2B74B4; padding: 40px 20px; text-align: center; }" +
               ".header h1 { color: #ffffff; margin: 0; font-size: 24px; }" +
               ".header p { color: #95CDF2; margin: 5px 0 0; font-size: 14px; }" +
               ".content { padding: 30px; color: #333333; line-height: 1.6; }" +
               ".status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; font-size: 12px; margin-bottom: 20px; background-color: " + statusColor + "; }" +
               ".footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #95CDF2; border-top: 1px solid #eee; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "<div class='container'>" +
               "  <div class='header'>" +
               "    <h1>TagakTuro</h1>" +
               "    <p>an Online Tutoring Service</p>" +
               "  </div>" +
               "  <div class='content'>" +
               "    <div class='status-badge'>" + statusText + "</div>" +
               "    <h2 style='color: #2B74B4;'>Hi, " + name + "!</h2>" +
               "    <p>" + messageBody + "</p>" +
               "    " + actionButton +
               "    <p style='margin-top: 30px;'>Best regards,<br><strong>TagakTuro Admin</strong></p>" +
               "  </div>" +
               "  <div class='footer'>" +
               "    &copy; 2026 TagakTuro. All rights reserved.<br>" +
               "    University of Makati" +
               "  </div>" +
               "</div>" +
               "</body>" +
               "</html>";
    }
}
