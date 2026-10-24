export type Stage = "todo" | "doing" | "review" | "done";
export type Difficulty = "easy" | "medium" | "hard";
export type Member = {
  id: string; name: string; email: string | null; role: string; active: boolean;
  points: number; count: number; hard: number; pending: number;
};
export type Card = {
  id: string; title: string; description: string; category: string;
  stage: Stage; difficulty: Difficulty; points: number; deadline: string; assignees: string[];
  checklist?: { id: string; text: string; done: boolean }[];
  comments?: { id: string; authorId: string; text: string }[];
};
export type Workspace = { members: Member[]; cards: Card[]; me: string; month: string };
export const points: Record<Difficulty, number> = { easy: 5, medium: 15, hard: 30 };
export const difficulties: Record<Difficulty, string> = { easy: "Fácil", medium: "Média", hard: "Difícil" };
export const roles: Record<string, string> = { member: "Membro", coordinator: "Coordenação", admin: "Administrador" };
export const stages: { id: Stage; label: string; color: string; column: string; badge: string }[] = [
  { id: "todo", label: "A fazer", color: "text-[var(--qp-purple)]", column: "border-[var(--qp-purple-border)] bg-[var(--qp-todo)]", badge: "bg-[var(--qp-purple-soft)] text-[var(--qp-purple)]" },
  { id: "doing", label: "Em andamento", color: "text-[var(--qp-amber)]", column: "border-[var(--qp-amber-border)] bg-[var(--qp-doing)]", badge: "bg-[var(--qp-amber-soft)] text-[var(--qp-amber)]" },
  { id: "review", label: "Em revisão", color: "text-[var(--qp-blue)]", column: "border-[var(--qp-blue-border)] bg-[var(--qp-review)]", badge: "bg-[var(--qp-blue-soft)] text-[var(--qp-blue)]" },
  { id: "done", label: "Concluído", color: "text-[var(--qp-green)]", column: "border-[var(--qp-green-border)] bg-[var(--qp-done)]", badge: "bg-[var(--qp-green-soft)] text-[var(--qp-green)]" },
];
export const initials = (name: string) => name.split(" ").filter(Boolean).map(s => s[0]).slice(0, 2).join("");
export const taskCode = (index: number) => `PET-${String(index + 1).padStart(3, "0")}`;
export const isCoordinator = (member?: Member) => member?.role === "admin" || member?.role === "coordinator";
export function canMoveCard(card: Card, stage: Stage, member?: Member): boolean {
  if (!member?.active || stage === card.stage) return false;
  if (stage === "done") return card.stage === "review" && isCoordinator(member) && !card.assignees.includes(member.id);
  if (card.stage === "done") return isCoordinator(member) && stage === "doing";
  if (stage === "review" && card.stage !== "doing") return false;
  return isCoordinator(member) || card.assignees.includes(member.id);
}
export function scoreDemo(workspace: Workspace): Workspace {
  return {
    ...workspace,
    members: workspace.members.map(member => {
      let total = 0, count = 0, hard = 0, pending = 0;
      for (const card of workspace.cards) {
        const assignees = [...new Set(card.assignees)];
        const index = assignees.indexOf(member.id);
        if (index < 0) continue;
        const share = assignees.length === 1 ? 1 : index === 0 ? 0.5 : 0.5 / (assignees.length - 1);
        if (card.stage === "done") { total += card.points * share; count++; if (card.difficulty === "hard") hard++; }
        if (card.stage === "review") pending += card.points * share;
      }
      return { ...member, points: Math.round(total * 100) / 100, pending: Math.round(pending * 100) / 100, count, hard };
    }),
  };
}
const names = ["Ana Costa", "Beatriz Souza", "Lucas Martins", "Rafael Santos", "Marina Lima", "João Pedro", "Carla Mendes", "Diego Alves", "Nina Rocha", "Pedro Nunes", "Julia Reis", "Caio Dias", "Sofia Luz", "Bruno Melo", "Iara Costa", "Leo Viana"];
const seedCards: [string, string, string, Stage, number[], Difficulty][] = [
  ["Planejar oficina de programação", "Definir o conteúdo, a data e o material da próxima oficina do PET.", "ENSINO", "todo", [2, 4], "hard"],
  ["Preparar material de divulgação", "Produzir a arte e o texto de divulgação da ação de extensão.", "EXTENSÃO", "todo", [6], "medium"],
  ["Atualizar ata da reunião", "Registrar decisões e responsáveis pelos encaminhamentos.", "ORGANIZAÇÃO", "todo", [0], "easy"],
  ["Preparar apresentação de pesquisa", "Organizar resultados e referências para apresentar ao grupo.", "PESQUISA", "doing", [3], "hard"],
  ["Organizar ação de extensão", "Confirmar participantes e preparar os materiais da ação.", "EXTENSÃO", "doing", [5, 7], "hard"],
  ["Revisar roteiro da oficina", "Conferir os exercícios e o material de apoio antes da aplicação.", "ENSINO", "review", [2], "medium"],
  ["Publicar relatório da atividade", "Consolidar o registro e os resultados da última atividade do PET.", "ORGANIZAÇÃO", "review", [0], "medium"],
  ["Aplicar oficina de introdução à programação", "Oficina realizada e presença dos participantes registrada.", "ENSINO", "done", [1, 4], "hard"],
  ["Atualizar página do PET", "Publicar as ações realizadas pelo grupo.", "EXTENSÃO", "done", [3], "medium"],
  ["Apresentar resultados da pesquisa", "Compartilhar os resultados do projeto com o grupo.", "PESQUISA", "done", [2], "hard"],
];
export function createDemo(): Workspace {
  const month = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
  return scoreDemo({
    me: "demo-0", month,
    members: names.map((name, i) => ({ id: `demo-${i}`, name, email: null, role: [0, 1, 5].includes(i) ? "coordinator" : "member", active: true, points: 0, count: 0, hard: 0, pending: 0 })),
    cards: seedCards.map(([title, description, category, stage, members, difficulty], i) => ({
      id: `card-${i}`, title, description, category, stage, difficulty,
      points: points[difficulty], deadline: "", assignees: members.map(n => `demo-${n}`),
    })),
  });
}
type ApiMember = { id: string; name: string; email: string | null; role: string; active: number };
type ApiActivity = { id: string; task_name: string; description: string | null; status: string; member_id: string; points_granted: number; task_points: number; difficulty_snapshot: Difficulty; activity_date: string; month_id: string };
export type ApiState = { me: ApiMember; monthId: string; members: ApiMember[]; activities: ApiActivity[]; participations: { activity_id: string; member_id: string; share: number }[] };
export function fromApi(data: ApiState): Workspace {
  const records = data.activities.filter(a => a.month_id === data.monthId);
  return {
    me: data.me.id, month: data.monthId,
    members: data.members.map(member => {
      let total = 0, pending = 0, count = 0, hard = 0;
      for (const activity of records) {
        const share = data.participations.find(p => p.activity_id === activity.id && p.member_id === member.id)?.share ?? (activity.member_id === member.id ? 1 : 0);
        if (!share) continue;
        if (activity.status === "approved") { total += activity.points_granted * share; count++; if (activity.difficulty_snapshot === "hard") hard++; }
        if (activity.status === "pending") pending += activity.task_points * share;
      }
      return { ...member, active: !!member.active, points: Math.round(total * 100) / 100, pending: Math.round(pending * 100) / 100, count, hard };
    }),
    cards: records.map(activity => ({
      id: activity.id, title: activity.task_name, description: activity.description || "", category: "PET",
      stage: activity.status === "approved" ? "done" : activity.status === "pending" ? "review" : "doing",
      difficulty: activity.difficulty_snapshot || "medium", points: activity.status === "approved" ? activity.points_granted : activity.task_points,
      deadline: activity.activity_date, assignees: [...new Set([activity.member_id, ...data.participations.filter(p => p.activity_id === activity.id).map(p => p.member_id)])],
    })),
  };
}
