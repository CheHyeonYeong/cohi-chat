# Security Review Skill

> Source: affaan-m/everything-claude-code

## When to Activate

- Authentication/Authorization code
- File uploads
- API endpoint creation
- Secrets management
- Payment features
- Sensitive data storage
- Third-party integrations

## Security Checklist

### 1. Secrets Management
- **No hardcoded API keys, tokens, or passwords**
- Use environment variables or secret managers
- Never commit `.env` files

### 2. Input Validation
- Use schema validation (Zod, class-validator)
- Validate file uploads: size, type, extension
- Sanitize all user input

### 3. SQL Injection Prevention
```java
// GOOD: Parameterized query
@Query("SELECT b FROM Booking b WHERE b.userId = :userId")
List<Booking> findByUserId(@Param("userId") Long userId);

// BAD: String concatenation
"SELECT * FROM booking WHERE user_id = " + userId
```

### 4. Authentication & Authorization
- Store tokens in httpOnly cookies
- Implement role-based access control
- Use Row Level Security where applicable

### 5. XSS Prevention
- Sanitize user-provided HTML
- Configure Content Security Policy headers
- Use React's automatic escaping

### 6. CSRF Protection
- Implement CSRF tokens for state-changing operations
- Use `SameSite=Strict` cookie setting

### 7. Rate Limiting
- Apply to all API endpoints
- Stricter limits for expensive operations (login, signup)

### 8. Sensitive Data Exposure
- Redact passwords/tokens from logs
- Use generic error messages for users
- Don't expose stack traces in production

### 9. Dependency Security
- Run `npm audit` / `./gradlew dependencyCheckAnalyze`
- Maintain lock files
- Enable Dependabot

## Pre-Deployment Checklist

- [ ] No hardcoded secrets
- [ ] All inputs validated
- [ ] Parameterized queries only
- [ ] XSS protection in place
- [ ] CSRF tokens implemented
- [ ] Authentication required for protected routes
- [ ] Authorization checks on resources
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Error messages sanitized
- [ ] Logging excludes sensitive data
- [ ] Dependencies audited
- [ ] CORS properly configured
- [ ] File uploads validated
