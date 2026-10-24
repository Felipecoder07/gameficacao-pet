"use client";
import { useState } from "react";
import { ChevronDown, Clock3, Crown, Filter, MessageCircle, Plus, Search, SquarePlus, Trophy, UserPlus, UserRound } from "lucide-react";
import { Card, Workspace, isCoordinator, stages, taskCode } from "./model";
import { Avatar, Empty, Heading, input, panel, primary } from "./ui";

export function Board({ workspace, newCard, openCard, moveCard, demo, selectedId, query, setQuery, manageMembers }: {
  workspace: Workspace; newCard: () => void; openCard: (id: string) => void;
  moveCard: (card: Card) => void; demo: boolean; selectedId: string; query: string;
  setQuery: (value: string) => void; manageMembers?: () => void;
}) {
  const [mine, setMine] = useState(false);
  const [member, setMember] = useState("");
  const [hover, setHover] = useState("");
  const [filters, setFilters] = useState(false);
  const [recent, setRecent] = useState(false);
  const me = workspace.members.find(m => m.id === workspace.me);
  const cards = workspace.cards.filter(card =>
    (!mine || card.assignees.includes(workspace.me)) && (!member || card.assignees.includes(member)) &&
    `${card.title} ${card.description}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))
  );
  if (recent) cards.reverse();
  const today = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date());
  const cycle = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${workspace.month}-01T12:00:00Z`));
  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-8">
        <div><p className="mb-1 text-[8px] font-bold tracking-wider text-[var(--qp-muted)]">QUADRO DE TAREFAS</p><h1 className="text-base font-bold">PET UFC Russas</h1></div>
        <div className="hidden sm:block"><p className="mb-1 text-[8px] font-bold tracking-wider text-[var(--qp-muted)]">DATA DE HOJE</p><p className="text-[11px] font-semibold uppercase">{today}</p></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">{workspace.members.slice(0, 3).map((m, i) => <span key={m.id} className="rounded-full border-2 border-[var(--qp-bg)]"><Avatar name={m.name} index={i}/></span>)}{workspace.members.length > 3 && <span className="grid size-8 place-items-center rounded-full border-2 border-[var(--qp-bg)] bg-[var(--qp-soft)] text-[9px] text-[var(--qp-secondary)]">+{workspace.members.length - 3}</span>}</div>
        {manageMembers && <button className={primary} onClick={manageMembers}><UserPlus size={13}/><span className="text-[10px]">Adicionar pessoas</span></button>}
      </div>
    </div>
    <div className="mb-3 flex h-[46px] items-center justify-between gap-3 rounded-[9px] bg-[var(--qp-detail)] px-2.5">
      <span className="rounded-lg bg-[var(--qp-purple)] px-3 py-2 text-[10px] font-semibold text-white">Quadro de tarefas</span>
      <button onClick={newCard} className="flex items-center gap-1.5 rounded-lg border border-[var(--qp-purple)] px-3 py-2 text-[10px] font-semibold text-[var(--qp-lilac)]"><SquarePlus size={13}/> Criar tarefa</button>
    </div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <label className="relative w-full max-w-[300px]"><Search size={13} className="absolute top-2.5 left-3 text-[var(--qp-muted)]"/><input aria-label="Buscar tarefa" placeholder="Buscar tarefas" className={`${input} py-2 pl-9 text-[10px]`} value={query} onChange={event => setQuery(event.target.value)}/></label>
      <div className="flex items-center gap-4 text-[10px] text-[var(--qp-secondary)]">
        <button className={`flex items-center gap-1.5 ${mine ? "text-[var(--qp-lilac)]" : ""}`} aria-pressed={mine} onClick={() => setMine(!mine)}><UserRound size={13}/> Minhas tarefas</button>
        <button className={`flex items-center gap-1.5 ${recent ? "text-[var(--qp-lilac)]" : ""}`} aria-pressed={recent} onClick={() => setRecent(!recent)}><Clock3 size={13}/> Recentes</button>
        <button className="flex items-center gap-1.5" aria-expanded={filters} onClick={() => setFilters(!filters)}><Filter size={13}/> Filtros</button>
      </div>
    </div>
    {filters && <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--qp-border)] p-3"><label className="text-[10px] text-[var(--qp-secondary)]" htmlFor="member-filter">Responsável</label><select id="member-filter" className={`${input} w-auto max-w-full py-2 text-[10px]`} value={member} onChange={event => setMember(event.target.value)}><option value="">Todos os membros</option>{workspace.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><button className="text-[10px] text-[var(--qp-lilac)]" onClick={() => { setMember(""); setMine(false); setQuery(""); }}>Limpar filtros</button></div>}
    <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px]"><ChevronDown size={13} className="text-[var(--qp-muted)]"/><strong className="font-semibold">Ciclo do PET</strong><span className="capitalize">{cycle}</span><span className="text-[var(--qp-muted)]">({cards.length} tarefas)</span></div>
    <div className="grid min-h-[calc(100dvh-320px)] grid-cols-[repeat(4,minmax(185px,1fr))] gap-2.5 overflow-x-auto pb-2 max-md:min-h-[580px]" aria-label="Quadro Kanban">
      {stages.map(stage => <section key={stage.id} aria-label={stage.label}
        className={`flex flex-col gap-2.5 rounded-[10px] border border-[var(--qp-border)] bg-[var(--qp-surface)] p-2.5 ${hover === stage.id ? "ring-2 ring-[var(--qp-purple)]" : ""}`}
        onDragOver={event => { if (demo) { event.preventDefault(); setHover(stage.id); } }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHover(""); }}
        onDrop={event => { event.preventDefault(); setHover(""); const card = workspace.cards.find(value => value.id === event.dataTransfer.getData("text/plain")); if (card && demo) moveCard({ ...card, stage: stage.id }); }}>
        <div className="mb-1 flex items-center justify-between gap-2 py-1"><h2 className="flex items-center gap-1.5 text-[9px] font-bold uppercase"><span className={`size-1.5 rounded-full bg-current ${stage.color}`}/>{stage.label}</h2><span className="rounded bg-[var(--qp-soft)] px-1.5 py-0.5 text-[9px] text-[var(--qp-muted)]">{cards.filter(card => card.stage === stage.id).length}</span></div>
        {cards.filter(card => card.stage === stage.id).map(card => {
          const owner = workspace.members.find(m => m.id === card.assignees[0]);
          return <button key={card.id} aria-pressed={selectedId === card.id} aria-label={`Abrir tarefa: ${card.title}`}
            draggable={demo && (card.assignees.includes(workspace.me) || isCoordinator(me))}
            onDragStart={event => event.dataTransfer.setData("text/plain", card.id)} onDragEnd={() => setHover("")} onClick={() => openCard(card.id)}
            className={`rounded-[9px] border bg-[var(--qp-card)] p-3 text-left transition hover:border-[var(--qp-purple)] ${selectedId === card.id ? "border-[var(--qp-purple)] ring-1 ring-[var(--qp-purple-border)]" : "border-[var(--qp-border)]"}`}>
            <div className="mb-2 flex items-center justify-between gap-2 text-[9px] text-[var(--qp-muted)]"><span className="font-semibold">{taskCode(workspace.cards.findIndex(value => value.id === card.id))}</span><span className="font-semibold text-[var(--qp-lilac)]">{card.points} pts</span></div>
            <h3 className="mb-2 text-xs leading-[1.6] font-semibold">{card.title}</h3>
            <span className={`inline-block rounded-md px-2 py-1 text-[8px] font-bold ${card.category === "EXTENSÃO" ? "bg-[var(--qp-pink-soft)] text-[var(--qp-pink)]" : card.category === "PESQUISA" ? "bg-[var(--qp-blue-soft)] text-[var(--qp-blue)]" : "bg-[var(--qp-purple-soft)] text-[var(--qp-lilac)]"}`}>{card.category || "PET"}</span>
            <div className="mt-3 flex items-center justify-between gap-1"><span className="flex min-w-0 items-center gap-1.5">{owner && <><Avatar name={owner.name} index={workspace.members.indexOf(owner)} compact/><span className="truncate text-[9px] text-[var(--qp-secondary)]">{owner.name}{card.assignees.length > 1 ? ` +${card.assignees.length - 1}` : ""}</span></>}</span><span className="flex shrink-0 items-center gap-1 text-[9px] text-[var(--qp-muted)]"><MessageCircle size={12}/>{!!card.comments?.length && card.comments.length}</span></div>
          </button>;
        })}
        {!cards.some(card => card.stage === stage.id) && <p className="py-6 text-center text-[10px] text-[var(--qp-muted)]">Nenhuma tarefa.</p>}
        <button className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--qp-soft)] py-2 text-[9px] text-[var(--qp-muted)] hover:bg-[var(--qp-hover)]" onClick={newCard}><Plus size={12}/> Adicionar tarefa</button>
      </section>)}
    </div>
    <p className="mt-3 text-[9px] leading-5 text-[var(--qp-muted)]">Entregas aprovadas somam pontos no ranking. Selecione um card para ver os detalhes.</p>
  </>;
}

export function Ranking({ workspace }: { workspace: Workspace }) {
  const ranked = [...workspace.members].sort((a, b) => b.points - a.points || b.hard - a.hard || a.name.localeCompare(b.name, "pt-BR"));
  const me = ranked.find(m => m.id === workspace.me);
  const position = ranked.findIndex(m => m.id === workspace.me);
  const above = ranked[position - 1];
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${workspace.month}-01T12:00:00Z`));
  const scored = ranked.filter(m => m.points > 0);
  return <>
    <Heading title="Ranking dos membros" subtitle={`Pontuação das entregas do PET · ${month}`}/>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--qp-purple-border)] bg-[var(--qp-purple-soft)] px-5 py-4 text-xs">
      <span className="flex items-center gap-2"><Trophy size={18} className="text-[var(--qp-lilac)]"/>
        {me?.points ? `Você está em ${position + 1}º com ${me.points} pontos.` : "Conclua suas tarefas e conquiste seus primeiros pontos."}
      </span>
      {me && me.points > 0 && above && <span className="text-[11px] text-[var(--qp-secondary)]">Mais {Math.round((above.points - me.points + 1) * 100) / 100} pontos para ultrapassar a próxima posição.</span>}
    </div>
    {scored.length > 0 && <div className="mx-auto mb-6 flex max-w-[760px] items-end justify-center gap-3 pt-3">
      {[1, 0, 2].map(i => {
        const member = scored[i];
        return member ? <div key={member.id} className={`flex w-1/3 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-5 text-center ${i === 0 ? "min-h-[180px] border-[var(--qp-pink-border)] bg-[var(--qp-pink-soft)]" : "min-h-[145px] border-[var(--qp-border)] bg-[var(--qp-surface)]"}`}>
          {i === 0 && <Crown size={20} className="text-[var(--qp-pink)]"/>}
          <Avatar name={member.name} index={workspace.members.indexOf(member)}/>
          <strong className="text-[11px]">{member.name}</strong>
          <span className="text-[10px] text-[var(--qp-lilac)]">{i + 1}º lugar</span>
          <strong className="text-sm text-[var(--qp-pink)]">{member.points} pts</strong>
        </div> : null;
      })}
    </div>}
    {!ranked.length ? <div className={panel}><Empty title="O ranking começa com o grupo" text="Adicione os membros do PET para acompanhar a pontuação."/></div> : <div className={`${panel} overflow-x-auto`}>
      <table className="qp-table">
        <thead><tr>{["Posição", "Membro", "Pontos", "Tarefas concluídas", "Em revisão"].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{ranked.map((member, index) => <tr key={member.id} className={member.id === workspace.me ? "bg-[var(--qp-purple-soft)]" : ""}>
          <td className={index < 3 && member.points > 0 ? "text-[var(--qp-pink)]" : ""}>{member.points > 0 ? `${index + 1}º` : "—"}</td>
          <td><span className="flex items-center gap-3"><Avatar name={member.name} index={workspace.members.indexOf(member)}/><span>{member.name}{member.id === workspace.me ? " · você" : ""}</span></span></td>
          <td className="font-semibold text-[var(--qp-pink)]">{member.points} pts</td><td>{member.count}</td><td className="text-[var(--qp-secondary)]">{member.pending} pts</td>
        </tr>)}</tbody>
      </table>
    </div>}
    <p className="mt-4 text-[10px] leading-5 text-[var(--qp-muted)]">Fácil: 5 pts · Média: 15 pts · Difícil: 30 pts. Pontos em revisão ainda não entram no ranking. Em caso de empate, mais tarefas difíceis concluídas vêm primeiro.</p>
  </>;
}
