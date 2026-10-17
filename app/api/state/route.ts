import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

const monthNow = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date());

export async function GET() {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Faça login para continuar." }, { status: 401 });
  const db = env.DB;
  if (!db) return Response.json({ error: "Banco de dados indisponível." }, { status: 503 });
  const now = new Date().toISOString();
  let member = await db.prepare("SELECT * FROM members WHERE auth_id = ?").bind(identity.userId).first();
  if (!member) {
    const invited = await db.prepare("SELECT * FROM members WHERE lower(email) = lower(?)").bind(identity.email).first();
    if (invited) {
      if (invited.auth_id) return Response.json({ error: "Esta conta já está vinculada a outro acesso." }, { status: 403 });
      await db.prepare("UPDATE members SET auth_id = ? WHERE id = ?").bind(identity.userId, invited.id).run();
      member = { ...invited, auth_id: identity.userId };
    } else {
      const count = await db.prepare("SELECT count(*) AS count FROM members").first<{ count: number }>();
      if ((count?.count ?? 0) > 0) return Response.json({ error: "Seu e-mail ainda não foi cadastrado pela administração." }, { status: 403 });
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO members (id, auth_id, name, email, role, active, created_at) VALUES (?, ?, ?, ?, 'admin', 1, ?)")
        .bind(id, identity.userId, identity.fullName || identity.email.split("@")[0], identity.email, now).run();
      member = await db.prepare("SELECT * FROM members WHERE id = ?").bind(id).first();
    }
  }
  if (!member?.active) return Response.json({ error: "Conta inativa." }, { status: 403 });
  const monthId = monthNow();
  await db.prepare("INSERT OR IGNORE INTO months (id, status) VALUES (?, 'test')").bind(monthId).run();
  const [members, months, tasks, activities, participations, requests, appeals, audits] = await Promise.all([
    db.prepare("SELECT id, name, email, role, active FROM members ORDER BY name").all(),
    db.prepare("SELECT * FROM months ORDER BY id DESC").all(),
    db.prepare("SELECT * FROM tasks ORDER BY family_id, effective_month DESC, created_at DESC").all(),
    db.prepare("SELECT a.*, t.name AS task_name, t.points AS task_points, t.difficulty AS task_difficulty, m.name AS member_name FROM activities a JOIN tasks t ON t.id = a.task_id JOIN members m ON m.id = a.member_id ORDER BY a.created_at DESC").all(),
    db.prepare("SELECT * FROM participations").all(),
    db.prepare("SELECT * FROM task_requests ORDER BY created_at DESC").all(),
    db.prepare("SELECT * FROM appeals ORDER BY created_at DESC").all(),
    member.role === "member" ? Promise.resolve({ results: [] }) : db.prepare("SELECT a.*, m.name AS actor_name FROM audit a LEFT JOIN members m ON m.id = a.actor_id ORDER BY a.created_at DESC LIMIT 100").all(),
  ]);
  const privileged = member.role === "admin" || member.role === "coordinator";
  return Response.json({
    me: member, monthId, members: (members.results as Record<string, unknown>[]).map(m => ({ ...m, email: member.role === "admin" || m.id === member.id ? m.email : null })), months: months.results, tasks: tasks.results,
    activities: (activities.results as Record<string, unknown>[]).map(a => ({ ...a, proof: privileged || a.member_id === member.id ? a.proof : null, description: privileged || a.member_id === member.id ? a.description : null })),
    participations: participations.results, requests: privileged ? requests.results : (requests.results as Record<string, unknown>[]).filter(r => r.member_id === member.id),
    appeals: privileged ? appeals.results : (appeals.results as Record<string, unknown>[]).filter(a => a.member_id === member.id),
    audit: audits.results,
  });
}
