import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseConnectionStatus = {
  ok: boolean;
  status: number | null;
  message: string;
};

export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  try {
    const { error, status } = await supabase.from("profiles").select("id").limit(1);
    if (error) {
      return {
        ok: false,
        status: status ?? null,
        message: `接続失敗: ${error.message}`,
      };
    }
    return {
      ok: true,
      status: status ?? 200,
      message: "接続成功",
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      message: error instanceof Error ? error.message : "接続時に不明なエラーが発生しました",
    };
  }
}

