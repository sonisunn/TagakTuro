package com.example.demo;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class UpdatePassword {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/tagakturo?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        String user = "tagak_user";
        String password = "tagakturo2025";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("Connected to MySQL!");
            String hash = "$2a$10$Xdcs5mdEax4MMusep6PzZuqdEEAUoRhgpdHtPfYYxS.6XFEGK0F/q";

            String query = "UPDATE users SET password = ? WHERE email IN ('admin@umak.edu.ph', 'cced@umak.edu.ph')";
            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                pstmt.setString(1, hash);
                int updatedRows = pstmt.executeUpdate();
                System.out.println("Rows updated: " + updatedRows);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
