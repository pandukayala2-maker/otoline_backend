/**
 * Temporary script to clear OTP rate limiting for a specific phone number during development
 * Usage: node clear-rate-limit.js [phone-number]
 * Example: node clear-rate-limit.js 965-65907625
 */

const phone = process.argv[2];

if (!phone) {
    console.log('❌ Usage: node clear-rate-limit.js <phone-number>');
    console.log('   Example: node clear-rate-limit.js 965-65907625');
    process.exit(1);
}

console.log(`
⚠️  NOTE: This script only shows how to clear the rate limit.
    The rate limiter uses in-memory storage, so you need to:
    
    Option 1: Wait 15 minutes for the rate limit to expire
    
    Option 2: Restart the backend server (this clears all rate limits)
       cd autoline_backend-multivendor
       npm run dev
    
    Option 3: Modify rate_limiter.ts to increase the limit:
       Change: otpRateLimit(3, 15 * 60 * 1000)
       To:     otpRateLimit(10, 15 * 60 * 1000)  // 10 requests instead of 3
    
    Current rate limit: 3 OTP requests per 15 minutes per phone number
    Phone number: ${phone}
    
    For testing, I recommend Option 2 (restart backend) as the quickest solution.
`);
