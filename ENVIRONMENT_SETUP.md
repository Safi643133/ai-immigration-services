# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your_openai_api_key
```

## How to Get These Values

### Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

### OpenAI Configuration

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key to `OPENAI_API_KEY`

## Security Notes

- **NEVER** commit `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges and bypasses RLS
- Only use the service role key in server-side code (API routes)
- The anon key is safe to expose to the client

## Storage Setup

After setting up environment variables, you'll also need to:

1. Create a storage bucket named `documents` in Supabase
2. Set up storage policies for the bucket
3. Configure Google OAuth in Supabase Auth settings 