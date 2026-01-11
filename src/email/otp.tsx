// src/emails/AmazonOTP.tsx
import * as React from 'react';
import { Html, Body, Container, Text, Heading, Section, Img, Hr } from "@react-email/components";

export const AmazonOTP = ({ code = "123456" }) => {
  return (
    <Html>
      <Body style={styles.body}>
        <Container style={styles.container}>
          
          {/* 1. LOGO (Top Left) */}
          {/* Replace this with your actual logo URL when you have one online */}
          <Text style={styles.logo}>AIDEZEL</Text> 
          
          {/* 2. HEADER */}
          <Heading style={styles.heading}>
            Verify your new account
          </Heading>
          
          <Text style={styles.text}>
            To verify your email address, please use the following One Time Password (OTP):
          </Text>

          {/* 3. THE "AMAZON" OTP BOX */}
          <Section style={styles.otpContainer}>
            <Text style={styles.otpText}>
              {code}
            </Text>
          </Section>

          <Text style={styles.text}>
            Do not share this OTP with anyone. Aidezel takes your account security very seriously. 
            Aidezel Customer Service will never ask you to disclose or verify your Aidezel password or OTP.
          </Text>

          <Hr style={styles.hr} />
          
          <Text style={styles.footer}>
            © 2026 Aidezel, Inc. or its affiliates. All rights reserved. <br/>
            Aidezel is a registered trademark of Aidezel.co.uk
          </Text>

        </Container>
      </Body>
    </Html>
  );
};

// Styles (Clean & Minimal like Amazon)
const styles = {
  body: { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" },
  container: { margin: "0 auto", padding: "20px 0 48px", maxWidth: "580px" },
  logo: { fontSize: "24px", fontWeight: "bold", color: "#333", marginBottom: "20px" },
  heading: { fontSize: "24px", fontWeight: "300", color: "#333", margin: "0 0 20px" },
  text: { fontSize: "15px", lineHeight: "24px", color: "#333" },
  otpContainer: { padding: "10px 0" },
  otpText: { fontSize: "32px", fontWeight: "700", color: "#333", letterSpacing: "2px", margin: "0" },
  hr: { borderColor: "#cccccc", margin: "20px 0" },
  footer: { fontSize: "11px", color: "#666", lineHeight: "16px" }
};