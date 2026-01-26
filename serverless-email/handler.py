"""
AWS Lambda Email Handler for HMS.
Handles sending transactional emails via SMTP.

Actions:
    - SIGNUP_WELCOME: Welcome email for new users
    - BOOKING_CONFIRMATION: Booking confirmation for patients
"""

import json
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def get_email_template(action, data):
    """
    Get email subject and body based on action type.
    
    Args:
        action: Email action type
        data: Template data
    
    Returns:
        dict: {subject, body_text, body_html}
    """
    templates = {
        'SIGNUP_WELCOME': {
            'subject': 'Welcome to Hospital Management System! 🏥',
            'body_text': f"""
Hello {data.get('name', 'there')}!

Welcome to the Hospital Management System (HMS). Your account has been created successfully.

You've registered as a {data.get('role', 'user')}.

{'As a Doctor, you can:' if data.get('role') == 'DOCTOR' else 'As a Patient, you can:'}
{'- Create and manage your availability slots' if data.get('role') == 'DOCTOR' else '- Browse doctors and their specializations'}
{'- View your upcoming appointments' if data.get('role') == 'DOCTOR' else '- Book appointments with available doctors'}
- Connect your Google Calendar for automatic event sync

Get started now by logging into your dashboard!

Best regards,
The HMS Team
            """.strip(),
            'body_html': f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .feature {{ margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #667eea; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Welcome to HMS!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{data.get('name', 'there')}</strong>!</p>
            <p>Your account has been created successfully as a <strong>{data.get('role', 'user')}</strong>.</p>
            
            <h3>{'What you can do as a Doctor:' if data.get('role') == 'DOCTOR' else 'What you can do as a Patient:'}</h3>
            
            <div class="feature">
                {'📅 Create and manage your availability slots' if data.get('role') == 'DOCTOR' else '🔍 Browse doctors and their specializations'}
            </div>
            <div class="feature">
                {'👥 View your upcoming appointments with patients' if data.get('role') == 'DOCTOR' else '📋 Book appointments with available doctors'}
            </div>
            <div class="feature">
                🔗 Connect your Google Calendar for automatic event sync
            </div>
            
            <p style="margin-top: 30px;">
                <a href="http://localhost:5173/login" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                    Login to Dashboard
                </a>
            </p>
        </div>
        <div class="footer">
            <p>© {datetime.now().year} Hospital Management System</p>
        </div>
    </div>
</body>
</html>
            """
        },
        
        'BOOKING_CONFIRMATION': {
            'subject': f"Appointment Confirmed with Dr. {data.get('doctor', 'Doctor')} ✅",
            'body_text': f"""
Hello {data.get('patient_name', 'there')}!

Your appointment has been confirmed!

📅 Date: {data.get('date', 'N/A')}
⏰ Time: {data.get('time', 'N/A')}
👨‍⚕️ Doctor: Dr. {data.get('doctor', 'N/A')}
{'🏷️ Specialization: ' + data.get('specialization') if data.get('specialization') else ''}
{'📝 Notes: ' + data.get('notes') if data.get('notes') else ''}

Please arrive 10 minutes before your scheduled time.

If you need to cancel or reschedule, please contact us at least 24 hours in advance.

Best regards,
The HMS Team
            """.strip(),
            'body_html': f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .detail {{ display: flex; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .detail-icon {{ font-size: 24px; margin-right: 15px; }}
        .detail-text {{ flex: 1; }}
        .detail-label {{ color: #666; font-size: 12px; text-transform: uppercase; }}
        .detail-value {{ font-size: 16px; font-weight: bold; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Appointment Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{data.get('patient_name', 'there')}</strong>!</p>
            <p>Your appointment has been successfully booked.</p>
            
            <div class="detail">
                <span class="detail-icon">📅</span>
                <div class="detail-text">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">{data.get('date', 'N/A')}</div>
                </div>
            </div>
            
            <div class="detail">
                <span class="detail-icon">⏰</span>
                <div class="detail-text">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">{data.get('time', 'N/A')}</div>
                </div>
            </div>
            
            <div class="detail">
                <span class="detail-icon">👨‍⚕️</span>
                <div class="detail-text">
                    <div class="detail-label">Doctor</div>
                    <div class="detail-value">Dr. {data.get('doctor', 'N/A')}</div>
                    {'<div style="color: #666; font-size: 14px;">' + data.get('specialization', '') + '</div>' if data.get('specialization') else ''}
                </div>
            </div>
            
            {f'''
            <div class="detail">
                <span class="detail-icon">📝</span>
                <div class="detail-text">
                    <div class="detail-label">Your Notes</div>
                    <div class="detail-value">{data.get('notes')}</div>
                </div>
            </div>
            ''' if data.get('notes') else ''}
            
            <p style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                ⚠️ Please arrive <strong>10 minutes</strong> before your scheduled time.
            </p>
        </div>
        <div class="footer">
            <p>© {datetime.now().year} Hospital Management System</p>
        </div>
    </div>
</body>
</html>
            """
        }
    }
    
    return templates.get(action, {
        'subject': 'HMS Notification',
        'body_text': 'You have a new notification from HMS.',
        'body_html': '<p>You have a new notification from HMS.</p>'
    })


def send_smtp_email(recipient, subject, body_text, body_html=None):
    """
    Send an email via SMTP.
    
    Args:
        recipient: Email address to send to
        subject: Email subject
        body_text: Plain text body
        body_html: HTML body (optional)
    
    Returns:
        bool: True if sent successfully
    """
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_pass = os.environ.get('SMTP_PASS', '')
    from_email = os.environ.get('FROM_EMAIL', smtp_user)
    
    if not smtp_user or not smtp_pass:
        print(f"[EMAIL] SMTP not configured. Would send to {recipient}:")
        print(f"  Subject: {subject}")
        print(f"  Body: {body_text[:200]}...")
        return True  # Return True for local development
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"HMS <{from_email}>"
    msg['To'] = recipient
    
    # Attach plain text
    part1 = MIMEText(body_text, 'plain')
    msg.attach(part1)
    
    # Attach HTML if provided
    if body_html:
        part2 = MIMEText(body_html, 'html')
        msg.attach(part2)
    
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, recipient, msg.as_string())
        
        print(f"[EMAIL] Successfully sent to {recipient}")
        return True
        
    except Exception as e:
        print(f"[EMAIL] Failed to send to {recipient}: {e}")
        raise


def send_email(event, context):
    """
    AWS Lambda handler for sending emails.
    
    Expected event body:
    {
        "action": "SIGNUP_WELCOME" | "BOOKING_CONFIRMATION",
        "recipient": "email@example.com",
        "data": { ... template data ... }
    }
    """
    print(f"[EMAIL] Received event: {json.dumps(event)}")
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': ''
        }
    
    try:
        # Parse request body
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)
        
        action = body.get('action')
        recipient = body.get('recipient')
        data = body.get('data', {})
        
        # Validate required fields
        if not action:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing action parameter'})
            }
        
        if not recipient:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing recipient parameter'})
            }
        
        # Get email template
        template = get_email_template(action, data)
        
        # Send email
        send_smtp_email(
            recipient=recipient,
            subject=template['subject'],
            body_text=template['body_text'],
            body_html=template.get('body_html')
        )
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': f'Email sent to {recipient}',
                'action': action
            })
        }
        
    except json.JSONDecodeError as e:
        print(f"[EMAIL] JSON decode error: {e}")
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
        
    except Exception as e:
        print(f"[EMAIL] Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


# For local testing
if __name__ == '__main__':
    # Test welcome email
    test_event = {
        'body': json.dumps({
            'action': 'SIGNUP_WELCOME',
            'recipient': 'test@example.com',
            'data': {
                'name': 'John Doe',
                'role': 'PATIENT'
            }
        })
    }
    
    result = send_email(test_event, None)
    print(json.dumps(result, indent=2))
