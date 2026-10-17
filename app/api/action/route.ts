import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";
type Row = Record<string, any>;
const fail = (message: string, status = 400) => Response.json({ error: message }, { status });
const ok = (data: Row = {}) => Response.json({ ok: true, ...data });
const clean = (x: unknown, max = 500) => String(x ?? "").trim().slice(0, max);
const currentMonth = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date());
const nextMonth = (month: string) => { const [y, m] = month.split("-").map(Number); return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7); };
const dateNow = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const canReview = (m: Row) => m.role === "coordinator" || m.role === "admin";

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return fail("Faça login para continuar.", 401);
  const db = env.DB;
  if (!db) return fail("Banco indisponível.", 503);
  const me = await db.prepare("SELECT * FROM members WHERE auth_id = ? AND active = 1").bind(identity.userId).first<Row>();
  if (!me) return fail("Conta não cadastrada ou inativa.", 403);
  let body: Row;
  try { body = await request.json() as Row; } catch { return fail("Dados inválidos."); }
  const action = clean(body.action, 40);
  const now = new Date().toISOString();
  const audit = (target: string, detail = "") => db.prepare("INSERT INTO audit (id, actor_id, action, target_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), me.id, action, target, detail, now).run();

  try {
    if (action === "addMember") {
      if (me.role !== "admin") return fail("Apenas administração pode gerenciar contas.", 403);
      const email = clean(body.email, 200).toLowerCase(), name = clean(body.name, 120);
      const role = clean(body.role, 20);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || !["member", "coordinator", "admin"].includes(role)) return fail("Informe nome, e-mail e perfil válidos.");
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO members (id, name, email, role, active, created_at) VALUES (?, ?, ?, ?, 1, ?)").bind(id, name, email, role, now).run();
      await audit(id, email); return ok();
    }
    if (action === "updateMember") {
      if (me.role !== "admin") return fail("Apenas administração pode gerenciar contas.", 403);
      const id = clean(body.id, 100), role = clean(body.role, 20), active = body.active ? 1 : 0;
      if (!id || !["member", "coordinator", "admin"].includes(role) || id === me.id) return fail("Alteração inválida.");
      await db.prepare("UPDATE members SET role = ?, active = ? WHERE id = ?").bind(role, active, id).run();
      await audit(id, `${role}; ativo=${active}`); return ok();
    }
    if (action === "createTask") {
      if (!canReview(me)) return fail("Apenas coordenação pode cadastrar tarefas.", 403);
      const name = clean(body.name, 120), description = clean(body.description, 500), deliverable = clean(body.deliverable, 500);
      const difficulty = clean(body.difficulty, 20), proofType = clean(body.proofType, 20), repeatType = clean(body.repeatType, 20);
      const repeatLimit = Number(body.repeatLimit), groupAllowed = !!body.groupAllowed;
      if (!name || !deliverable || !["easy", "medium", "hard"].includes(difficulty) || !["link", "file", "confirmation"].includes(proofType) || !["none", "event", "week", "month"].includes(repeatType) || !Number.isInteger(repeatLimit) || repeatLimit < 1 || repeatLimit > 100) return fail("Confira os campos da tarefa.");
      const familyId = clean(body.familyId, 100) || crypto.randomUUID();
      const existing = await db.prepare("SELECT id FROM tasks WHERE family_id = ? LIMIT 1").bind(familyId).first();
      const effective = existing ? nextMonth(currentMonth()) : currentMonth();
      const id = crypto.randomUUID(), points = difficulty === "easy" ? 5 : difficulty === "medium" ? 15 : 30;
      await db.prepare("INSERT INTO tasks (id, family_id, name, description, difficulty, points, deliverable, proof_type, repeat_type, repeat_limit, group_allowed, effective_month, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)")
        .bind(id, familyId, name, description, difficulty, points, deliverable, proofType, repeatType, repeatLimit, Number(groupAllowed), effective, now).run();
      if (body.requestId) await db.prepare("UPDATE task_requests SET status = 'approved' WHERE id = ? AND status = 'pending'").bind(clean(body.requestId, 100)).run();
      await audit(id, `Vigência ${effective}; ${points} pontos`); return ok({ effective });
    }
    if (action === "requestTask") {
      const name = clean(body.name, 120), description = clean(body.description, 500), deliverable = clean(body.deliverable, 500);
      if (!name || !description || !deliverable) return fail("Informe nome, descrição e entrega prevista.");
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO task_requests (id, member_id, name, description, deliverable, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)")
        .bind(id, me.id, name, description, deliverable, now).run();
      await audit(id); return ok();
    }
    if (action === "reviewTaskRequest") {
      if (!canReview(me)) return fail("Apenas coordenação pode analisar solicitações.", 403);
      const id = clean(body.id, 100), status = clean(body.status, 20);
      if (!["approved", "rejected"].includes(status)) return fail("Decisão inválida.");
      await db.prepare("UPDATE task_requests SET status = ? WHERE id = ? AND status = 'pending'").bind(status, id).run();
      await audit(id, status); return ok();
    }
    if (action === "createActivity" || action === "resubmitActivity") {
      const taskId = clean(body.taskId, 100), date = clean(body.date, 10), description = clean(body.description, 500), proof = clean(body.proof, 1000);
      const monthId = date.slice(0, 7), today = dateNow();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today || monthId !== currentMonth() || !description || !proof) return fail("Informe data do mês atual, descrição e comprovante.");
      const task = await db.prepare("SELECT * FROM tasks WHERE id = ? AND active = 1 AND effective_month <= ?").bind(taskId, monthId).first<Row>();
      if (!task) return fail("Tarefa indisponível neste mês.");
      const latest = await db.prepare("SELECT id FROM tasks WHERE family_id = ? AND effective_month <= ? ORDER BY effective_month DESC, created_at DESC LIMIT 1").bind(task.family_id, monthId).first<Row>();
      if (latest?.id !== taskId) return fail("Selecione a versão vigente da tarefa.");
      if (task.proof_type === "link" && !/^https:\/\//i.test(proof)) return fail("O comprovante deve ser um link HTTPS.");
      if (task.proof_type === "file" && !proof.startsWith("file:")) return fail("Envie um arquivo como comprovante.");
      if (task.proof_type === "file" && !proof.startsWith(`file:${me.id}/`)) return fail("O arquivo deve ter sido enviado pela sua conta.");
      if (task.proof_type === "confirmation" && proof.length < 3) return fail("Informe quem confirmou a entrega.");
      const month = await db.prepare("SELECT * FROM months WHERE id = ?").bind(monthId).first<Row>();
      if (!month || !["test", "open"].includes(month.status)) return fail("O mês não aceita novos registros.");
      const participants = Array.isArray(body.participants) ? body.participants as Row[] : [];
      if (participants.length && !task.group_allowed) return fail("Esta tarefa não aceita trabalho em grupo.");
      if (participants.length) {
        const ids = new Set(participants.map(p => clean(p.id, 100)));
        if (ids.size !== participants.length || ids.has(me.id) || participants.some(p => !clean(p.deliverable, 500))) return fail("Informe participantes distintos e a entrega própria de cada um.");
        for (const id of ids) { const valid = await db.prepare("SELECT id FROM members WHERE id = ? AND active = 1").bind(id).first(); if (!valid) return fail("Participante inválido."); }
      }
      let repeatKey = "";
      if (task.repeat_type === "event") repeatKey = clean(body.repeatKey, 100);
      if (task.repeat_type === "week") { const d = new Date(`${date}T12:00:00Z`); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day); repeatKey = d.toISOString().slice(0, 10); }
      if (task.repeat_type === "month") repeatKey = monthId;
      if (task.repeat_type !== "none" && !repeatKey) return fail("Informe o evento ou reunião a que esta entrega pertence.");
      if (task.repeat_type !== "none") {
        const count = await db.prepare("SELECT count(*) AS n FROM activities a JOIN tasks t ON t.id = a.task_id WHERE t.family_id = ? AND a.month_id = ? AND a.repeat_key = ? AND a.status != 'rejected' AND (? = 'event' OR a.member_id = ?) AND a.id != ?")
          .bind(task.family_id, monthId, repeatKey, task.repeat_type, me.id, action === "resubmitActivity" ? clean(body.id, 100) : "").first<{ n: number }>();
        if ((count?.n ?? 0) >= task.repeat_limit) return fail("Limite de repetição atingido para esta tarefa.");
      }
      if (action === "resubmitActivity") {
        const id = clean(body.id, 100);
        const old = await db.prepare("SELECT * FROM activities WHERE id = ? AND member_id = ? AND status = 'returned'").bind(id, me.id).first<Row>();
        if (!old || old.month_id !== monthId) return fail("Registro indisponível para reenvio.");
        await db.prepare("UPDATE activities SET task_id = ?, activity_date = ?, description = ?, proof = ?, status = 'pending', reason = NULL, repeat_key = ? WHERE id = ?")
          .bind(taskId, date, description, proof, repeatKey, id).run();
        await db.prepare("DELETE FROM participations WHERE activity_id = ?").bind(id).run();
        await saveParticipants(db, id, me.id, description, participants);
        await audit(id); return ok();
      }
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO activities (id, member_id, task_id, month_id, activity_date, description, proof, status, repeat_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)")
        .bind(id, me.id, taskId, monthId, date, description, proof, repeatKey, now).run();
      await saveParticipants(db, id, me.id, description, participants);
      await audit(id); return ok();
    }
    if (action === "decideActivity") {
      if (!canReview(me)) return fail("Apenas coordenação pode validar.", 403);
      const id = clean(body.id, 100), decision = clean(body.decision, 20), reason = clean(body.reason, 500);
      if (!["approved", "returned", "rejected"].includes(decision) || (decision !== "approved" && !reason)) return fail("Informe uma decisão e, quando necessário, o motivo.");
      const activity = await db.prepare("SELECT a.*, t.points, t.difficulty FROM activities a JOIN tasks t ON t.id = a.task_id WHERE a.id = ?").bind(id).first<Row>();
      if (!activity || activity.status !== "pending" || activity.member_id === me.id) return fail("Não é possível validar este registro.");
      const month = await db.prepare("SELECT * FROM months WHERE id = ?").bind(activity.month_id).first<Row>();
      if (!month || month.status === "closed" || (month.id < currentMonth() && month.status !== "validation") || (month.status === "validation" && month.validation_deadline < dateNow())) return fail("Prazo de validação encerrado.");
      await db.prepare("UPDATE activities SET status = ?, points_granted = ?, difficulty_snapshot = ?, validator_id = ?, validated_at = ?, reason = ? WHERE id = ?")
        .bind(decision, decision === "approved" ? activity.points : null, decision === "approved" ? activity.difficulty : null, me.id, now, reason || null, id).run();
      await audit(id, `${decision}: ${reason}`); return ok();
    }
    if (action === "appeal") {
      const id = clean(body.id, 100), reason = clean(body.reason, 500);
      const activity = await db.prepare("SELECT * FROM activities WHERE id = ? AND member_id = ?").bind(id, me.id).first<Row>();
      if (!activity || !["returned", "rejected"].includes(activity.status) || !reason) return fail("Contestação inválida.");
      const month = await db.prepare("SELECT * FROM months WHERE id = ?").bind(activity.month_id).first<Row>();
      if (!month || month.status === "closed" || (month.id < currentMonth() && month.status !== "validation") || (month.status === "validation" && month.validation_deadline < dateNow())) return fail("Prazo de contestação encerrado.");
      await db.prepare("INSERT INTO appeals (id, activity_id, member_id, reason, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)")
        .bind(crypto.randomUUID(), id, me.id, reason, now).run();
      await audit(id); return ok();
    }
    if (action === "decideAppeal") {
      if (!canReview(me)) return fail("Apenas coordenação pode decidir contestação.", 403);
      const id = clean(body.id, 100), decision = clean(body.decision, 20), reason = clean(body.reason, 500);
      if (!["approved", "rejected"].includes(decision) || !reason) return fail("Informe decisão e justificativa.");
      const appeal = await db.prepare("SELECT p.*, a.validator_id, a.month_id, a.task_id FROM appeals p JOIN activities a ON a.id = p.activity_id WHERE p.id = ? AND p.status = 'pending'").bind(id).first<Row>();
      if (!appeal || appeal.member_id === me.id || appeal.validator_id === me.id) return fail("Outra pessoa da coordenação deve decidir.");
      const month = await db.prepare("SELECT * FROM months WHERE id = ?").bind(appeal.month_id).first<Row>();
      if (!month || month.status === "closed" || (month.id < currentMonth() && month.status !== "validation") || (month.status === "validation" && month.validation_deadline < dateNow())) return fail("Prazo encerrado.");
      await db.prepare("UPDATE appeals SET status = ?, reviewer_id = ?, decision = ? WHERE id = ?").bind(decision, me.id, reason, id).run();
      if (decision === "approved") {
        const task = await db.prepare("SELECT points, difficulty FROM tasks WHERE id = ?").bind(appeal.task_id).first<Row>();
        await db.prepare("UPDATE activities SET status = 'approved', points_granted = ?, difficulty_snapshot = ?, validator_id = ?, validated_at = ?, reason = NULL WHERE id = ?")
          .bind(task?.points, task?.difficulty, me.id, now, appeal.activity_id).run();
      }
      await audit(id, `${decision}: ${reason}`); return ok();
    }
    if (action === "startValidation" || action === "finalizeMonth" || action === "setMonthMode") {
      if (!canReview(me)) return fail("Apenas coordenação pode fechar o mês.", 403);
      const id = clean(body.id, 7), month = await db.prepare("SELECT * FROM months WHERE id = ?").bind(id).first<Row>();
      if (!month) return fail("Mês inexistente.");
      if (action === "setMonthMode") {
        if (id !== currentMonth() || !["test", "open"].includes(month.status)) return fail("O modo deste mês não pode ser alterado.");
        const registered = await db.prepare("SELECT count(*) AS n FROM activities WHERE month_id = ?").bind(id).first<{ n: number }>();
        if ((registered?.n ?? 0) > 0) return fail("O modo do mês não muda após o primeiro registro.");
        const mode = body.mode === "open" ? "open" : "test";
        await db.prepare("UPDATE months SET status = ? WHERE id = ?").bind(mode, id).run(); await audit(id, mode); return ok();
      }
      if (action === "startValidation") {
        if (!["test", "open"].includes(month.status)) return fail("Mês já está em validação ou fechado.");
        const deadline = clean(body.deadline, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || deadline < dateNow()) return fail("Defina um prazo de validação válido.");
        await db.prepare("UPDATE months SET status = 'validation', validation_deadline = ? WHERE id = ?").bind(deadline, id).run();
        await audit(id, deadline); return ok();
      }
      if (month.status !== "validation" || month.validation_deadline >= dateNow()) return fail("Aguarde o fim do prazo de validação.");
      const pending = await db.prepare("SELECT count(*) AS n FROM activities WHERE month_id = ? AND status = 'pending'").bind(id).first<{ n: number }>();
      const pendingAppeals = await db.prepare("SELECT count(*) AS n FROM appeals p JOIN activities a ON a.id = p.activity_id WHERE a.month_id = ? AND p.status = 'pending'").bind(id).first<{ n: number }>();
      await db.batch([
        db.prepare("UPDATE activities SET status = 'rejected', reason = 'Prazo de validação encerrado', validated_at = ? WHERE month_id = ? AND status = 'pending'").bind(now, id),
        db.prepare("UPDATE appeals SET status = 'rejected', decision = 'Prazo de validação encerrado' WHERE status = 'pending' AND activity_id IN (SELECT id FROM activities WHERE month_id = ?)").bind(id),
        db.prepare("UPDATE months SET status = 'closed', closed_at = ? WHERE id = ?").bind(now, id),
      ]);
      await audit(id, `Encerrado com ${pending?.n ?? 0} registros e ${pendingAppeals?.n ?? 0} contestações sem decisão.`); return ok();
    }
    return fail("Ação desconhecida.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return fail(message.includes("UNIQUE constraint") ? "Este registro já existe." : "Não foi possível concluir a ação.", 500);
  }
}

async function saveParticipants(db: D1Database, activityId: string, leadId: string, leadDeliverable: string, others: Row[]) {
  const leadShare = others.length ? 0.5 : 1;
  await db.prepare("INSERT INTO participations (id, activity_id, member_id, role, share, own_deliverable) VALUES (?, ?, ?, 'Responsável', ?, ?)")
    .bind(crypto.randomUUID(), activityId, leadId, leadShare, leadDeliverable).run();
  for (const p of others) await db.prepare("INSERT INTO participations (id, activity_id, member_id, role, share, own_deliverable) VALUES (?, ?, ?, 'Participante', ?, ?)")
    .bind(crypto.randomUUID(), activityId, p.id, 0.5 / others.length, clean(p.deliverable, 500)).run();
}
