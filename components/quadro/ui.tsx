import { Columns3, X, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { initials } from "./model";

export const primary = "inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--qp-purple)] px-4 py-2.5 text-[11px] font-semibold text-white shadow-[0_4px_16px_var(--qp-purple-soft)] transition hover:brightness-110 disabled:opacity-50";
export const secondary = "inline-flex items-center justify-center gap-2 rounded-[9px] border border-[var(--qp-border)] bg-[var(--qp-soft)] px-3.5 py-2.5 text-[11px] text-[var(--qp-text)] transition hover:bg-[var(--qp-hover)]";
export const input = "w-full rounded-[9px] border border-[var(--qp-border)] bg-[var(--qp-input)] px-3.5 py-3 text-[11px] text-[var(--qp-text)] outline-none placeholder:text-[var(--qp-muted)] focus:border-[var(--qp-purple)] focus:ring-2 focus:ring-[var(--qp-purple-soft)]";
export const panel = "rounded-[13px] border border-[var(--qp-border)] bg-[var(--qp-surface)]";
export function Brand({ full = false }: { full?: boolean }) {
  return <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--qp-lilac)] to-[var(--qp-purple-deep)] text-white shadow-[0_6px_16px_var(--qp-purple-soft)]"><Columns3 size={21}/></span><span><strong className={`block font-bold tracking-[-.4px] ${full ? "text-base" : "text-sm"}`}>PET UFC Russas</strong><small className="text-[10px] text-[var(--qp-lilac)]">Quadro de Pontos</small></span></div>;
}
const avatarTones = ["bg-[var(--qp-purple)]", "bg-[var(--qp-pink)]", "bg-[var(--qp-avatar-blue)]"];
export function Avatar({ name, index = 0, large = false, compact = false }: { name: string; index?: number; large?: boolean; compact?: boolean }) {
  return <span title={name} className={`inline-grid shrink-0 place-items-center rounded-full font-bold text-white ${avatarTones[index % 3]} ${large ? "size-[76px] text-xl" : compact ? "size-[22px] text-[8px]" : "size-8 text-[9px]"}`}>{initials(name)}</span>;
}
export function Heading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-[27px] font-bold leading-tight tracking-[-1px]">{title}</h1><p className="mt-2 text-[11px] text-[var(--qp-secondary)]">{subtitle}</p></div>{action}</div>;
}
export function Empty({ title = "Nada por aqui ainda", text = "Ainda não há atividades neste período.", action }: { title?: string; text?: string; action?: ReactNode }) {
  return <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center"><Inbox className="text-[var(--qp-lilac)]" size={28}/><h3 className="text-sm font-semibold">{title}</h3><p className="max-w-xs text-[11px] leading-5 text-[var(--qp-secondary)]">{text}</p>{action}</div>;
}
export function Close({ onClick }: { onClick: () => void }) { return <button aria-label="Fechar" onClick={onClick} className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--qp-muted)] hover:bg-[var(--qp-hover)] hover:text-[var(--qp-text)]"><X size={18}/></button>; }
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-2 text-[11px] font-medium">{label}{children}</label>; }
