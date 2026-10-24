"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CalendarDays, Check, Plus, Send, UserRound } from "lucide-react";
import { Card, Workspace, canMoveCard, difficulties, isCoordinator, stages, taskCode } from "./model";
import { Avatar, Close, input, primary, secondary } from "./ui";

export function TaskDetails({ card, workspace, close, move, update, demo }: {
  card: Card; workspace: Workspace; close: () => void; move: (card: Card) => void;
  update: (card: Card) => void; demo: boolean;
}) {
  const [comment, setComment] = useState("");
  const me = workspace.members.find(member => member.id === workspace.me);
  const editable = demo && !!me?.active && (isCoordinator(me) || card.assignees.includes(workspace.me));
  const stage = stages.find(value => value.id === card.stage);
  const checklist = card.checklist || [];
  const comments = card.comments || [];
  return <div className="qp-detailed flex min-h-full flex-col gap-[18px] bg-[var(--qp-detail)] px-5 py-6 text-[var(--qp-text)]">
    <div className="flex items-start justify-between gap-3">
      <div><p className="mb-2 text-[9px] font-bold text-[var(--qp-muted)]">{taskCode(workspace.cards.findIndex(value => value.id === card.id))}</p><h2 className="text-sm leading-6 font-bold">{card.title}</h2></div>
      <Close onClick={close}/>
    </div>
    <div className="flex flex-wrap gap-2"><span className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase ${stage?.badge}`}>{stage?.label}</span><span className="rounded-md bg-[var(--qp-purple-soft)] px-2 py-1 text-[9px] font-bold text-[var(--qp-lilac)]">{card.points} PONTOS</span></div>
    <dl className="grid gap-4 text-[10px]">
      <div className="flex items-center justify-between gap-3"><dt className="text-[8px] font-bold tracking-wider text-[var(--qp-muted)]">ÁREA</dt><dd className="text-right font-medium">{card.category || "PET"}</dd></div>
      <div className="flex items-start justify-between gap-3"><dt className="pt-0.5 text-[8px] font-bold tracking-wider text-[var(--qp-muted)]">RESPONSÁVEIS</dt><dd className="grid gap-2">{card.assignees.map(id => {
        const member = workspace.members.find(value => value.id === id);
        return member ? <span key={id} className="flex items-center justify-end gap-2"><UserRound size={12} className="text-[var(--qp-muted)]"/>{member.name}</span> : null;
      })}</dd></div>
      <div className="flex items-center justify-between gap-3"><dt className="text-[8px] font-bold tracking-wider text-[var(--qp-muted)]">PRAZO</dt><dd className="flex items-center gap-2"><CalendarDays size={12} className="text-[var(--qp-muted)]"/>{card.deadline || "Sem prazo"}</dd></div>
      <div className="flex items-center justify-between gap-3"><dt className="text-[8px] font-bold tracking-wider text-[var(--qp-muted)]">DIFICULDADE</dt><dd>{difficulties[card.difficulty]}</dd></div>
    </dl>
    <section className="border-t border-[var(--qp-border)] pt-[18px]"><h3 className="mb-2 text-[8px] font-bold tracking-wider text-[var(--qp-muted)]">DESCRIÇÃO</h3><p className="text-[11px] leading-6 text-[var(--qp-secondary)]">{card.description || "Sem descrição adicional."}</p></section>
    <section><h3 className="mb-3 text-[8px] font-bold tracking-wider text-[var(--qp-muted)]">CHECKLIST · {checklist.filter(item => item.done).length}/{checklist.length}</h3>
      <div className="grid gap-3">{checklist.map(item => <label key={item.id} className="flex items-start gap-2 text-[10px] leading-5">
        <input type="checkbox" checked={item.done} disabled={!editable} className="mt-0.5 size-3.5 shrink-0 accent-[var(--qp-purple)]" onChange={() => update({ ...card, checklist: checklist.map(value => value.id === item.id ? { ...value, done: !value.done } : value) })}/>
        <span className={item.done ? "text-[var(--qp-muted)] line-through" : "text-[var(--qp-secondary)]"}>{item.text}</span>
      </label>)}</div>
      {editable ? <form className="mt-3 flex gap-2" onSubmit={event => {
        event.preventDefault(); const form = event.currentTarget; const text = String(new FormData(form).get("item") || "").trim();
        if (text) { update({ ...card, checklist: [...checklist, { id: crypto.randomUUID(), text, done: false }] }); form.reset(); }
      }}><input name="item" aria-label="Novo item do checklist" maxLength={200} placeholder="Adicionar item..." className={`${input} min-w-0 py-2 text-[10px]`}/><button className="rounded-lg border border-[var(--qp-border)] px-2 text-[var(--qp-lilac)]" aria-label="Adicionar item"><Plus size={14}/></button></form> : !checklist.length && <p className="text-[10px] text-[var(--qp-muted)]">Nenhum item adicionado.</p>}
    </section>
    <section className="border-t border-[var(--qp-border)] pt-[18px]"><h3 className="mb-3 text-[8px] font-bold tracking-wider text-[var(--qp-muted)]">COMENTÁRIOS</h3>
      {demo && me && <form className="mb-4 flex gap-2" onSubmit={event => { event.preventDefault(); if (!comment.trim()) return; update({ ...card, comments: [...comments, { id: crypto.randomUUID(), authorId: workspace.me, text: comment.trim() }] }); setComment(""); }}>
        <input aria-label="Comentário" className={`${input} min-w-0 py-2.5 text-[10px]`} placeholder="Escreva um comentário..." value={comment} maxLength={1000} onChange={event => setComment(event.target.value)}/><button className="rounded-lg px-1 text-[var(--qp-lilac)]" aria-label="Enviar comentário" disabled={!comment.trim()}><Send size={14}/></button>
      </form>}
      <div className="grid gap-4">{comments.map(value => {
        const author = workspace.members.find(member => member.id === value.authorId);
        return <div className="flex gap-2" key={value.id}><Avatar name={author?.name || "Membro"} index={author ? workspace.members.indexOf(author) : 0}/><div className="min-w-0"><strong className="block text-[9px] font-semibold">{author?.name || "Membro"}</strong><p className="mt-1 text-[10px] leading-5 break-words whitespace-pre-wrap text-[var(--qp-secondary)]">{value.text}</p></div></div>;
      })}{!comments.length && <p className="text-[10px] text-[var(--qp-muted)]">Nenhum comentário ainda.</p>}</div>
    </section>
    <div className="mt-auto grid gap-3 border-t border-[var(--qp-border)] pt-5">
      {demo ? <>
        {canMoveCard(card, "doing", me) && <button className={`${secondary} w-full`} onClick={() => move({ ...card, stage: "doing" })}>{card.stage === "todo" ? "Iniciar tarefa" : card.stage === "done" ? "Reabrir tarefa" : "Devolver para ajustes"}</button>}
        {canMoveCard(card, "review", me) && <button className={`${primary} w-full`} onClick={() => move({ ...card, stage: "review" })}><Send size={14}/> Enviar para revisão</button>}
        {canMoveCard(card, "done", me) && <button className={`${primary} w-full`} onClick={() => move({ ...card, stage: "done" })}><Check size={14}/> Aprovar entrega e pontuar</button>}
        {card.stage === "review" && !canMoveCard(card, "done", me) && <p className="text-[10px] leading-5 text-[var(--qp-secondary)]">Aguardando aprovação por outra pessoa da coordenação.</p>}
        {card.stage === "done" && <p className="text-[10px] text-[var(--qp-green)]">Entrega aprovada. Pontos contabilizados.</p>}
      </> : <Link prefetch={false} href={`/gestao?tab=${isCoordinator(me) ? "admin" : "record"}`} className={primary}>Abrir {isCoordinator(me) ? "validação" : "registro"} <ArrowUpRight size={13}/></Link>}
      {card.assignees.length > 1 && <p className="text-[9px] leading-5 text-[var(--qp-muted)]">50% dos pontos para o primeiro responsável; os demais dividem o restante.</p>}
    </div>
  </div>;
}
