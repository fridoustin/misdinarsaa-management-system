import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/** Single factory for the server Supabase client (Server Components, Route Handlers, Server Actions). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // ponytail: no-op in Server Components (middleware refreshes the session instead)
          }
        },
      },
    },
  );
}

/** Public/anon read access — same client works, RLS policies enforce the public/pengurus boundary. */
export const createSupabasePublicClient = createSupabaseServerClient;
