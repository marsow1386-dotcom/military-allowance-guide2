import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * 서버 전용 Supabase 클라이언트. 환경변수가 없으면 null 을 돌려주고,
 * 호출하는 쪽은 저장을 건너뜁니다(로컬 개발·미연결 상태에서도 사이트가 동작).
 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

export const chatLogEnabled = () => process.env.CHAT_LOG_ENABLED === "true";
