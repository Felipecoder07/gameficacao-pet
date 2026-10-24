"use client";
import Link from "next/link";
import { TaskDetails } from "./task-details";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpRight, Plus, Users } from "lucide-react";
import { Card, Difficulty, Member, Workspace, difficulties, points, roles } from "./model";
import { Avatar, Close, Field, input, primary, secondary } from "./ui";

export function Overlay({ title, children, close, drawer = false }: {
  title: string; children: ReactNode; close: () => void; drawer?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const element = root.current;
    const focusables = () => Array.from(element?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea, select, [tabindex="0"]') ?? []);
    (element?.querySelector<HTMLElement>("input") || focusables()[0])?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const all = focusables(), first = all[0], last = all[all.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [close]);
  return <div className={`fixed inset-0 z-50 flex bg-[var(--qp-overlay)] backdrop-blur-[3px] ${drawer ? "justify-end" : "items-center justify-center p-4"}`}
    onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <div ref={root} role="dialog" aria-modal="true" aria-label={title}
      className={`qp-violet flex flex-col border border-[var(--qp-border)] bg-[var(--qp-bg)] text-[var(--qp-text)] shadow-2xl ${drawer ? "h-dvh w-full max-w-[480px]" : "max-h-[calc(100dvh-32px)] w-full max-w-[520px] rounded-2xl"}`}>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--qp-border)] px-6 py-5"><h2 className="text-lg font-bold">{title}</h2><Close onClick={close}/></div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  </div>;
}

export function NewActivity({ members, meId, close, save, demo }: {
  members: Member[]; meId: string; close: () => void; save: (card: Card) => void; demo: boolean;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  if (!demo) return <Overlay title="Nova tarefa" close={close}><div className="space-y-5 p-6">
    <p className="text-xs leading-6 text-[var(--qp-secondary)]">Os registros reais continuam no formulário de entregas, com as regras de pontuação e validação do grupo.</p>
    <Link prefetch={false} className={primary} href="/gestao?tab=record">Registrar entrega <ArrowUpRight size={14}/></Link>
  </div></Overlay>;
  return <Overlay title="Nova tarefa" close={close}>
    <form className="grid gap-5 p-6" onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      save({ id: crypto.randomUUID(), title: String(data.get("title")).trim(), description: String(data.get("description")).trim(),
        category: "PET", difficulty, points: points[difficulty], stage: "todo", deadline: String(data.get("deadline")), assignees: data.getAll("assignee").map(String) });
    }}>
      <Field label="Tarefa *"><input name="title" required maxLength={120} pattern=".*\S.*" className={input} placeholder="Ex.: Preparar oficina de programação"/></Field>
      <Field label="O que precisa ser entregue?"><textarea name="description" rows={3} maxLength={1000} className={input} placeholder="Descreva o resultado esperado..."/></Field>
      <Field label="Responsáveis *">
        <select name="assignee" multiple required defaultValue={[meId]} className={`${input} min-h-32`} aria-label="Responsáveis pela tarefa">
          {members.filter(member => member.active).map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </Field>
      <p className="-mt-3 text-[10px] leading-5 text-[var(--qp-muted)]">Você pode selecionar mais de uma pessoa. Em grupo, o primeiro responsável recebe 50% dos pontos; os demais dividem o restante.</p>
      <Field label="Prazo (opcional)"><input name="deadline" type="date" className={input}/></Field>
      <fieldset><legend className="mb-3 text-[11px]">Pontuação da tarefa *</legend><div className="grid grid-cols-3 gap-2">
        {(Object.keys(points) as Difficulty[]).map(value => <button key={value} type="button" aria-pressed={difficulty === value} className={difficulty === value ? primary : secondary} onClick={() => setDifficulty(value)}>{difficulties[value]} · {points[value]} pts</button>)}
      </div></fieldset>
      <p className="rounded-lg bg-[var(--qp-purple-soft)] p-3 text-[11px] leading-5 text-[var(--qp-lilac)]">Os {points[difficulty]} pontos entram no ranking depois que a entrega for aprovada.</p>
      <div className="flex justify-end gap-3 border-t border-[var(--qp-border)] pt-4"><button type="button" className={secondary} onClick={close}>Cancelar</button><button className={primary}><Plus size={14}/> Criar tarefa</button></div>
    </form>
  </Overlay>;
}

export function CardDetail({ card, workspace, close, move, update, demo }: {
  card: Card; workspace: Workspace; close: () => void; move: (card: Card) => void;
  update: (card: Card) => void; demo: boolean;
}) {
  return <Overlay title="Detalhe da tarefa" drawer close={close}><TaskDetails key={card.id} card={card} workspace={workspace} close={close} move={move} update={update} demo={demo}/></Overlay>;
}

export function GroupMembers({ workspace, demo, close, add }: { workspace: Workspace; demo: boolean; close: () => void; add: (member: Member) => void }) {
  return <Overlay title="Membros do PET" close={close}>
    <div className="p-6"><div className="max-h-64 space-y-3 overflow-y-auto">
      {workspace.members.map((member, index) => <div key={member.id} className="flex items-center gap-3 py-1"><Avatar name={member.name} index={index}/><span className="flex-1 text-xs">{member.name}<small className="mt-1 block text-[9px] text-[var(--qp-muted)]">{roles[member.role]}</small></span><span className="text-[11px] text-[var(--qp-lilac)]">{member.points} pts</span></div>)}
    </div>{demo ? <form className="mt-6 grid gap-4 border-t border-[var(--qp-border)] pt-5" onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      add({ id: crypto.randomUUID(), name: String(data.get("name")).trim(), email: null, role: "member", active: true, points: 0, count: 0, hard: 0, pending: 0 });
      event.currentTarget.reset();
    }}><Field label="Adicionar membro à demonstração"><input name="name" required maxLength={120} pattern=".*\S.*" placeholder="Nome completo" className={input}/></Field><button className={primary}><Users size={14}/> Adicionar membro</button></form> : <Link prefetch={false} href="/gestao?tab=admin" className={`${primary} mt-5`}>Gerenciar membros <ArrowUpRight size={14}/></Link>}</div>
  </Overlay>;
}
