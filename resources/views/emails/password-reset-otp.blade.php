<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
        }
        .container {
            max-width: 520px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #4f46e5, #6366f1);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .header p {
            color: #c7d2fe;
            margin: 8px 0 0;
            font-size: 14px;
        }
        .body {
            padding: 32px 24px;
        }
        .greeting {
            font-size: 16px;
            color: #374151;
            margin-bottom: 16px;
        }
        .message {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .otp-box {
            text-align: center;
            margin: 24px 0;
            padding: 24px;
            background: #f9fafb;
            border-radius: 8px;
            border: 2px dashed #e5e7eb;
        }
        .otp-label {
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .otp-code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #4f46e5;
            font-family: 'Courier New', monospace;
        }
        .warning {
            font-size: 13px;
            color: #ef4444;
            background: #fef2f2;
            padding: 12px 16px;
            border-radius: 8px;
            margin-top: 24px;
            border-left: 3px solid #ef4444;
        }
        .expire-note {
            font-size: 13px;
            color: #6b7280;
            text-align: center;
            margin-top: 16px;
        }
        .footer {
            text-align: center;
            padding: 20px 24px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 0;
            font-size: 12px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PadayON</h1>
            <p>Password Reset Verification</p>
        </div>
        <div class="body">
            <p class="greeting">Hi {{ $userName }},</p>
            <p class="message">
                We received a request to reset your password. Use the verification code below to proceed with resetting your password.
            </p>
            <div class="otp-box">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">{{ $otp }}</div>
            </div>
            <p class="expire-note">This code will expire in <strong>10 minutes</strong>.</p>
            <div class="warning">
                If you did not request a password reset, please ignore this email or contact support if you have concerns about your account security.
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} PadayON by CantiumCode. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
