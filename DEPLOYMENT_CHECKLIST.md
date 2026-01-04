# AiNexo - Production Deployment Checklist

**Version:** 1.0
**Last Updated:** 2026-01-04

This checklist ensures safe and successful deployment of the audit improvements to production.

---

## 📋 Pre-Deployment Checklist

### 1. Code Review
- [ ] Pull request reviewed and approved
- [ ] All tests passing
- [ ] No merge conflicts
- [ ] IMPROVEMENTS_SUMMARY.md reviewed

### 2. Environment Variables
- [ ] All required environment variables set (see `.env.example`)
- [ ] Run environment validation:
  ```bash
  node -e "require('./lib/config/env-validation').validateOrExit()"
  ```
- [ ] Production secrets rotated (if compromised)
- [ ] Stripe keys are **LIVE** keys (not test keys)
- [ ] reCAPTCHA keys match production domain

### 3. Database Backup
- [ ] **CRITICAL**: Create database backup before migrations
  ```bash
  # PostgreSQL backup
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

  # Or use your hosting provider's backup tool
  # Vercel: vercel pg backup create
  # Heroku: heroku pg:backups:capture
  ```
- [ ] Verify backup is downloadable and valid
- [ ] Store backup securely (off-server)

### 4. Dependencies
- [ ] `npm install` completed successfully
- [ ] `npm audit` reviewed (19 known issues documented)
- [ ] No critical vulnerabilities introduced

### 5. Build Test
- [ ] Test build locally:
  ```bash
  npm run build
  npm run start
  ```
- [ ] No build errors
- [ ] Application starts correctly

---

## 🚀 Deployment Steps

### Step 1: Merge to Main
```bash
# From your local machine
git checkout main
git pull origin main
git merge claude/project-audit-n6Wfn
git push origin main
```

**Vercel Auto-Deploy:**
- Vercel will automatically detect the push and start deployment
- Monitor: https://vercel.com/your-project/deployments

**Manual Deploy (if needed):**
```bash
vercel --prod
```

### Step 2: Database Migrations (CRITICAL)

**⚠️ IMPORTANT**: These migrations are **REQUIRED** for performance improvements.

**Option A: Automated Script**
```bash
# Set your production DATABASE_URL
export DATABASE_URL='postgresql://...'

# Run migration script
./scripts/apply-performance-migrations.sh
```

**Option B: Manual Execution**
```bash
# Vector index (10-100x faster searches)
psql $DATABASE_URL -f prisma/migrations/add_vector_index.sql

# Compound indexes (2-3x faster queries)
psql $DATABASE_URL -f prisma/migrations/add_compound_indexes.sql
```

**Option C: Via Vercel/Hosting Provider**

See `MIGRATION_GUIDE.md` for platform-specific instructions:
- Vercel Postgres
- Heroku
- Railway
- Supabase
- Neon

**Verification:**
```sql
-- Check if indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN (
    'document_chunks',
    'conversation_messages',
    'websites'
)
AND indexname LIKE '%_idx';
```

Expected: 5 indexes created

### Step 3: Post-Deployment Verification

**Health Checks:**
- [ ] Application loads successfully
- [ ] Login works
- [ ] Registration works (and rate limiting activates after 5 attempts)
- [ ] Password reset works (with strong password requirements)
- [ ] Avatar upload works (with file validation)
- [ ] Contact form submits and sends emails
- [ ] Chat/AI responses work
- [ ] Semantic search works (should be faster)

**Performance Checks:**
```bash
# Test API response time
time curl -X POST https://your-domain.com/api/chat/message \
  -H "X-Chatbot-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"question": "test query"}'
```

Expected improvements:
- Semantic search: 5-50ms (was 500-2000ms)
- Regular queries: 50-150ms (was 200-500ms)

**Database Check:**
```sql
-- Verify index usage
EXPLAIN ANALYZE
SELECT id, content
FROM document_chunks
WHERE embedding IS NOT NULL
ORDER BY embedding <=> '[0.1,0.2,...]'::vector
LIMIT 10;
```

Should show: "Index Scan using document_chunks_embedding_idx"

---

## 🧪 Testing in Production

### Critical Path Testing (30 minutes)

#### 1. Authentication Flow
- [ ] Register new test account
- [ ] Attempt 6th registration within 1 hour (should rate limit)
- [ ] Login with test account
- [ ] Verify session persists for 7 days (check tomorrow)
- [ ] Logout

#### 2. Password Security
- [ ] Request password reset
- [ ] Try setting weak password (should fail)
- [ ] Set strong password (12+ chars, complexity)
- [ ] Login with new password

#### 3. File Upload
- [ ] Upload avatar (valid image)
- [ ] Try uploading .php file (should fail)
- [ ] Try uploading .exe file (should fail)
- [ ] Verify avatar displays correctly

#### 4. Contact Form
- [ ] Submit contact form
- [ ] Verify admin receives email
- [ ] Verify user receives confirmation email

#### 5. Chatbot/AI
- [ ] Ask question via chatbot
- [ ] Verify response time is faster
- [ ] Check conversation history loads quickly
- [ ] Verify dates display in correct language

#### 6. Internationalization
- [ ] Switch to Dutch (nl)
- [ ] Verify dates format correctly
- [ ] Switch to English (en)
- [ ] Switch to German (de)
- [ ] Verify all languages work

---

## 📊 Monitoring Setup

### 1. Error Tracking (Sentry)
- [ ] Verify Sentry is receiving events
- [ ] Set up alerts for critical errors
- [ ] Check error rate is normal

### 2. Performance Monitoring
- [ ] Track OpenAI API usage (should decrease by ~40%)
- [ ] Monitor database query times
- [ ] Track API response times

### 3. Cost Monitoring
- [ ] Baseline OpenAI API cost (first 24 hours)
- [ ] Compare to previous month (expect 40% reduction)
- [ ] Monitor Vercel/infrastructure costs

### 4. Security Monitoring
- [ ] Monitor rate limit violations
- [ ] Track failed login attempts
- [ ] Check for unusual registration patterns
- [ ] Review security audit logs

---

## 🔄 Rollback Plan (If Needed)

**If critical issues occur:**

### 1. Immediate Rollback (Code)
```bash
# Revert to previous deployment
vercel rollback

# Or via Git
git revert HEAD~5..HEAD  # Revert last 5 commits
git push origin main
```

### 2. Database Rollback (Indexes)
```sql
-- Remove vector index
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- Remove compound indexes
DROP INDEX IF EXISTS conversation_messages_session_created_idx;
DROP INDEX IF EXISTS websites_assistant_status_idx;
DROP INDEX IF EXISTS website_pages_website_id_idx;
DROP INDEX IF EXISTS conversation_sessions_assistant_idx;
```

**Note**: Index removal is safe and immediate. Data is not affected.

### 3. Restore from Backup (Last Resort)
```bash
# Restore database from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

**⚠️ WARNING**: This will lose any data created after backup time.

---

## 📈 Success Metrics (Week 1)

Track these metrics for the first week:

### Performance
- [ ] Average semantic search time: **<100ms** (target: 5-50ms)
- [ ] Average API response time: **<300ms**
- [ ] Database query time: **<200ms**

### Cost
- [ ] OpenAI API cost: **40% reduction** vs previous month
- [ ] Infrastructure cost: **stable or reduced**

### Security
- [ ] Zero security incidents
- [ ] Rate limiting working (monitor violations)
- [ ] Password strength enforced (no weak passwords)

### User Experience
- [ ] Contact form submissions working: **100%**
- [ ] Chat response time improved: **>50%**
- [ ] No i18n/locale issues reported

---

## 🐛 Known Issues & Workarounds

### 1. npm audit shows 19 vulnerabilities
**Status**: Known and documented
**Impact**: Low (require breaking changes to fix)
**Action**: Defer until next major version update

### 2. pgvector extension required
**Issue**: Vector index requires pgvector
**Solution**:
- Supabase/Neon: Already installed
- Custom PostgreSQL: Install pgvector first
- See MIGRATION_GUIDE.md for instructions

### 3. Session timeout change
**Impact**: Users will notice longer sessions (7 days vs 30 min)
**Communication**: Optional - inform users of improved UX

---

## 📞 Support Contacts

### Deployment Issues
- **Platform Support**:
  - Vercel: https://vercel.com/support
  - Heroku: https://help.heroku.com
  - Railway: https://railway.app/help

### Database Issues
- **Supabase**: https://supabase.com/support
- **Neon**: https://neon.tech/docs
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres

### Application Issues
- **GitHub Issues**: https://github.com/dkortekaas/ainexo/issues
- **Sentry**: Check error logs first

---

## ✅ Post-Deployment Sign-Off

**Deployment completed by**: _________________
**Date & Time**: _________________
**Database migrations applied**: ✅ / ❌
**All health checks passed**: ✅ / ❌
**Monitoring configured**: ✅ / ❌

**Notes**:
```
(Any issues encountered, workarounds applied, or deviations from checklist)







```

---

## 📚 Reference Documentation

- **Full Audit**: `PROJECT_AUDIT_REPORT.md`
- **All Improvements**: `IMPROVEMENTS_SUMMARY.md`
- **Database Migrations**: `MIGRATION_GUIDE.md`
- **Detailed Migration Steps**: `prisma/migrations/MIGRATION_INSTRUCTIONS.md`
- **PR Information**: `.github/PULL_REQUEST_INFO.md`

---

**Estimated Deployment Time**: 30-60 minutes (including migrations and testing)
**Risk Level**: ⬜ Low (all changes tested, migrations are additive)
**Rollback Time**: <5 minutes (if needed)

---

*Last updated: 2026-01-04*
*Version: 1.0*
