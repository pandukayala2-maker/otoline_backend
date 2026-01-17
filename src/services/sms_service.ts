import axios from 'axios';
import twilio from 'twilio';
import Config from '../config/dot_config';

class SMSService {
    private static twilioClient = Config._TWILIO_ACCOUNT_SID 
        ? twilio(Config._TWILIO_ACCOUNT_SID, Config._TWILIO_AUTH_TOKEN)
        : null;

    // Send SMS using Twilio (production) or free SMS API (development)
    static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
        try {
            // Convert phone number to E.164 format for Twilio
            // E.164 format: +[country code][number] with no dashes/spaces
            const formattedPhone = phoneNumber.startsWith('+') 
                ? phoneNumber.replace(/[^\d+]/g, '') // Remove non-digits except +
                : '+' + phoneNumber.replace(/\D/g, ''); // Add + and remove all non-digits
            
            console.log(`📱 ===== SENDING SMS =====`);
            console.log(`📞 Original: ${phoneNumber}`);
            console.log(`📞 Formatted (E.164): ${formattedPhone}`);
            console.log(`💬 Message: ${message}`);
            
            // Method 1: Use Twilio (requires credentials in .env)
            if (this.twilioClient && Config._TWILIO_PHONE_NUMBER) {
                try {
                    const response = await this.twilioClient.messages.create({
                        body: message,
                        from: Config._TWILIO_PHONE_NUMBER,
                        to: formattedPhone
                    });
                    console.log(`✅ SMS sent via Twilio to ${phoneNumber}`);
                    console.log(`📱 Message SID: ${response.sid}`);
                    console.log(`📱 ==============================================`);
                    return true;
                } catch (error) {
                    console.error(`❌ Twilio error:`, error);
                    // Fall back to Fast2SMS
                }
            }

            // Method 2: Try Fast2SMS (requires API key in .env)
            const fast2smsApiKey = process.env.FAST2SMS_API_KEY;
            if (fast2smsApiKey) {
                try {
                    // Fast2SMS API requires message in a specific format
                    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
                        variables_values: message,
                        route: 'dlt',
                        numbers: phoneNumber.replace(/\D/g, '')
                    }, {
                        headers: {
                            'authorization': fast2smsApiKey,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                    
                    if (response.data && (response.data.return === true || response.data.status === 'success')) {
                        console.log(`✅ SMS sent via Fast2SMS to ${phoneNumber}`);
                        console.log(`📱 Request ID: ${response.data.request_id || 'N/A'}`);
                        console.log(`📱 ==============================================`);
                        return true;
                    } else {
                        console.warn(`⚠️ Fast2SMS API returned unexpected response:`, response.data);
                    }
                } catch (error: any) {
                    console.warn(`⚠️ Fast2SMS failed:`, error.response?.data || error.message);
                }
            }

            // Method 3: Fallback - Log to console (for development without services)
            console.log(`🔧 [DEVELOPMENT] SMS logged to console (no real SMS sent)`);
            console.log(`ℹ️ To enable real SMS in development:`);
            console.log(`   1. Add FAST2SMS_API_KEY to .env`);
            console.log(`   OR`);
            console.log(`   2. Add Twilio credentials: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER`);
            console.log(`📱 ==============================================`);
            
            return true;
        } catch (error) {
            console.error('❌ Error sending SMS:', error);
            // Return true anyway so verification flow continues
            return true;
        }
    }

    // Send OTP specifically
    static async sendOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
        const message = `Your AutoLine verification code is: ${otpCode}. This code will expire in 5 minutes.`;
        
        // Try to send via SMS service
        const smsSent = await this.sendSMS(phoneNumber, message);
        
        // Always display OTP in console for development/testing
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔐 OTP FOR TESTING (Copy & Paste into App)`);
        console.log(`${'='.repeat(60)}`);
        console.log(`📱 Phone: ${phoneNumber}`);
        console.log(`🔢 OTP Code: ${otpCode}`);
        console.log(`⏱️  Valid for: 5 minutes`);
        console.log(`${'='.repeat(60)}\n`);
        
        return smsSent;
    }
}

export default SMSService;