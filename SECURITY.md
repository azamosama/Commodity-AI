# Security Guidelines for Flavor Pulse

## 🔐 API Key Management

### Environment Variables
All sensitive data, including API keys, should be stored in environment variables and never committed to the repository.

### Required Environment Variables
Create a `.env.local` file in the project root with the following variables:

```bash
# Email Service
RESEND_API_KEY=your_actual_api_key_here

# USDA APIs
USDA_FOODDATA_API_KEY=your_actual_api_key_here
USDA_QUICKSTATS_API_KEY=your_actual_api_key_here
USDA_MARKETNEWS_API_KEY=your_actual_api_key_here

# POS Integration
TOAST_API_KEY=your_actual_api_key_here
TOAST_API_SECRET=your_actual_secret_here
TOAST_RESTAURANT_ID=your_actual_restaurant_id_here

SQUARE_API_KEY=your_actual_api_key_here
SQUARE_LOCATION_ID=your_actual_location_id_here

# Optional Retailer APIs
WALMART_API_KEY=your_actual_api_key_here
AMAZON_API_KEY=your_actual_api_key_here
```

## 🚫 What NOT to Commit

Never commit the following to the repository:
- `.env.local` or any `.env*` files with actual values
- API keys, secrets, or tokens
- Database credentials
- Private keys or certificates
- Any file containing sensitive customer data

## ✅ Security Best Practices

### 1. Environment Variable Usage
```typescript
// ✅ Good - Use environment variables
const apiKey = process.env.USDA_API_KEY;

// ❌ Bad - Hardcoded values
const apiKey = "sk-1234567890abcdef";
```

### 2. API Key Validation
```typescript
// ✅ Good - Check if API key exists
if (!process.env.USDA_API_KEY) {
  console.warn('USDA_API_KEY not configured');
  return null;
}

// ❌ Bad - No validation
const response = await fetch(`https://api.example.com?key=${process.env.API_KEY}`);
```

### 3. Error Handling
```typescript
// ✅ Good - Graceful degradation
try {
  const data = await fetchExternalAPI();
  return data;
} catch (error) {
  console.warn('External API unavailable:', error.message);
  return getMockData(); // Fallback to mock data
}
```

## 🔍 Security Checklist

Before committing code, ensure:

- [ ] No hardcoded API keys or secrets
- [ ] All sensitive data uses environment variables
- [ ] `.env.local` is in `.gitignore`
- [ ] No console.log statements with sensitive data
- [ ] API calls have proper error handling
- [ ] No sensitive data in error messages
- [ ] Rate limiting is implemented for external APIs
- [ ] Input validation for all user inputs

## 🛡️ Production Security

### Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all required environment variables
4. Set appropriate environments (Production, Preview, Development)

### API Key Rotation
- Rotate API keys regularly (every 90 days recommended)
- Monitor API usage for unusual activity
- Use different keys for development and production
- Implement API key expiration where possible

### Monitoring
- Monitor API usage and costs
- Set up alerts for unusual API activity
- Log API errors without exposing sensitive data
- Use services like Sentry for error tracking

## 🚨 Incident Response

If you suspect an API key has been compromised:

1. **Immediately rotate the compromised key**
2. **Check API usage logs** for unauthorized access
3. **Update all environment variables** in production
4. **Review recent commits** for any accidental exposures
5. **Notify team members** if necessary

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

## 🔧 Development Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your actual API keys
3. Never commit `.env.local`
4. Use mock data when APIs are unavailable
5. Test with invalid keys to ensure graceful degradation

Remember: **Security is everyone's responsibility!**
