import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";
const error = (message: string, status = 400) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return error("Faça login.", 401);
  if (!env.DB || !env.BUCKET) return error("Armazenamento indisponível.", 503);
  const member = await env.DB.prepare("SELECT id FROM members WHERE auth_id = ? AND active = 1").bind(identity.userId).first<{ id: string }>();
  if (!member) return error("Conta não cadastrada.", 403);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024 || !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type)) return error("Use PDF ou imagem de até 10 MB.");
  const key = `${member.id}/${crypto.randomUUID()}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { filename: file.name.slice(0, 150) } });
  return Response.json({ proof: `file:${key}` });
}

export async function GET(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return error("Faça login.", 401);
  if (!env.DB || !env.BUCKET) return error("Armazenamento indisponível.", 503);
  const me = await env.DB.prepare("SELECT * FROM members WHERE auth_id = ? AND active = 1").bind(identity.userId).first<Record<string, string>>();
  if (!me) return error("Conta não cadastrada.", 403);
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!key || !/^[a-f0-9-]+\/[a-f0-9-]+$/.test(key)) return error("Arquivo inválido.");
  const row = await env.DB.prepare("SELECT member_id FROM activities WHERE proof = ? LIMIT 1").bind(`file:${key}`).first<{ member_id: string }>();
  if (!row || (row.member_id !== me.id && me.role !== "coordinator" && me.role !== "admin")) return error("Acesso negado.", 403);
  const object = await env.BUCKET.get(key);
  if (!object) return error("Arquivo não encontrado.", 404);
  return new Response(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType || "application/octet-stream", "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
