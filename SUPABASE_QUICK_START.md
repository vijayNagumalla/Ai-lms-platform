# 🚀 Supabase Quick Start Guide

This is a quick reference guide for migrating to Supabase. For detailed instructions, see [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md).

## ⚡ Quick Setup (5 minutes)

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com) and create a new project
- Wait for project setup (1-2 minutes)

### 2. Get Your Credentials
- Go to **Settings** → **API**
- Copy:
  - Project URL → `SUPABASE_URL`
  - anon/public key → `SUPABASE_ANON_KEY`
  - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Update Environment Variables

Add to `backend/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Run Database Schema

In Supabase **SQL Editor**, run:
1. `backend/database/schema-supabase.sql` (main schema)
2. `backend/database/schema-supabase-extended.sql` (extended tables)

### 5. Install Dependencies

```bash
cd backend
npm install
```

### 6. Test Connection

```bash
npm start
```

Look for: `✅ Supabase connected successfully`

## ✅ What's Changed

- ✅ Database now uses Supabase (PostgreSQL) instead of MySQL
- ✅ Most existing code works without changes
- ✅ `pool.execute()` calls are automatically converted
- ✅ Ready for deployment on Vercel, Railway, etc.

## 🔄 Migration Checklist

- [ ] Create Supabase project
- [ ] Add environment variables
- [ ] Run database schemas
- [ ] Install dependencies (`npm install`)
- [ ] Test connection
- [ ] Test user registration/login
- [ ] Test CRUD operations
- [ ] Deploy to production

## 📚 Next Steps

- Read the full [Migration Guide](./SUPABASE_MIGRATION_GUIDE.md)
- Check [Supabase Documentation](https://supabase.com/docs)
- Set up Row Level Security (RLS) if needed
- Configure database backups

## 🆘 Need Help?

- Check the [Troubleshooting](./SUPABASE_MIGRATION_GUIDE.md#troubleshooting) section
- Review Supabase docs: [supabase.com/docs](https://supabase.com/docs)

---

**That's it!** Your database is now ready for deployment. 🎉

