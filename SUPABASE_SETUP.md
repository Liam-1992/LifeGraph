# Supabase Setup Instructions

LifeGraph uses Supabase for authentication and database. To set up your own Supabase instance:

1. Create a new project on [Supabase](https://supabase.com).
2. Go to the SQL Editor in your Supabase dashboard.
3. Copy the contents of `supabase-schema.sql` and run it to create the tables, RLS policies, and triggers.
4. Go to Project Settings -> API.
5. Copy the `Project URL` and `anon public` key.
6. In AI Studio, open the Secrets panel and add:
   - `VITE_SUPABASE_URL`: Your Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your anon public key

The application currently uses a local mock store (`zustand` with `localStorage`) so you can preview the functionality immediately without setting up Supabase. To switch to real Supabase data, you would replace the Zustand store logic with Supabase queries in the respective components.
