"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, Columns3, LogIn, Search, Trophy, Users, X } from "lucide-react";
import { ApiState, Card, Member, Workspace, canMoveCard, createDemo, fromApi, isCoordinator, roles, scoreDemo } from "./model";
import { Avatar, Brand, Empty } from "./ui";
import { TaskDetails } from "./task-details";
import { Board, Ranking } from "./screens";
import { CardDetail, GroupMembers, NewActivity, Overlay } from "./overlays";

const storageKey = "pet-ufc-russas.demo.v2";
const navigation = [{ path: "/quadro", label: "Quadro", icon: Columns3 }, { path: "/ranking", label: "Ranking", icon: Trophy }];

function readDemo(): Workspace {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as Workspace | null;
    if (saved && typeof saved.me === "string" && Array.isArray(saved.members) && Array.isArray(saved.cards) &&
      saved.members.every(member => member && typeof member.id === "string" && typeof member.name === "string") &&
      saved.cards.every(card => card && typeof card.id === "string" && typeof card.title === "string" && Number.isFinite(card.points) && Array.isArray(card.assignees))) return scoreDemo(saved);
  } catch { /* Browser storage is optional for the demonstration. */ }
  return createDemo();
}

export function QuadroApp() {
  const pathname = usePathname();
  const ranking = pathname === "/ranking";
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [demo, setDemo] = useState(false);
  const [overlay, setOverlay] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const close = useCallback(() => setOverlay(""), []);
  const closeDetails = useCallback(() => { setOverlay(""); setSelected(""); }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const adaptDetails = () => { if (media.matches) setOverlay(current => current === "detail" ? "" : current); };
    media.addEventListener("change", adaptDetails);
    return () => media.removeEventListener("change", adaptDetails);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadDemo = () => { if (active) { setWorkspace(readDemo()); setDemo(true); } };
    if (new URLSearchParams(window.location.search).get("demo") === "1") loadDemo();
    else {
      const timer = setTimeout(() => controller.abort(), 10000);
      fetch("/api/state", { cache: "no-store", signal: controller.signal })
        .then(async response => {
          if (!response.ok) throw new Error("Acesso indisponível");
          const data = await response.json() as ApiState;
          if (active) { setWorkspace(fromApi(data)); setDemo(false); }
        })
        .catch(() => {
          loadDemo();
          if (active) setNotice("Você está na demonstração, com dados fictícios salvos neste navegador. Entre para acessar os registros reais do PET.");
        })
        .finally(() => clearTimeout(timer));
    }
    return () => { active = false; controller.abort(); };
  }, []);

  function persist(next: Workspace) {
    const scored = demo ? scoreDemo(next) : next;
    setWorkspace(scored);
    if (demo) {
      try { localStorage.setItem(storageKey, JSON.stringify(scored)); }
      catch { setNotice("O navegador não permitiu salvar. As alterações da demonstração valem até recarregar a página."); }
    }
  }

  function moveCard(updated: Card) {
    if (!workspace || !demo) return;
    const current = workspace.cards.find(card => card.id === updated.id);
    const me = workspace.members.find(member => member.id === workspace.me);
    if (!current || current.stage === updated.stage) return;
    if (!canMoveCard(current, updated.stage, me)) {
      setNotice(updated.stage === "done"
        ? "Para pontuar, a tarefa deve estar em revisão e ser aprovada por alguém da coordenação que não seja responsável pela entrega."
        : "Você só pode movimentar suas tarefas ou atuar como coordenação.");
      return;
    }
    persist({ ...workspace, cards: workspace.cards.map(card => card.id === updated.id ? { ...card, stage: updated.stage } : card) });
    if (updated.stage === "done") setNotice("Entrega aprovada! Os pontos dos responsáveis já foram atualizados no ranking.");
    else if (current.stage === "done") setNotice("Tarefa reaberta. Os pontos foram retirados do ranking até uma nova aprovação.");
    else if (updated.stage === "review") setNotice("Entrega enviada para revisão. Os pontos entram no ranking após a aprovação.");
  }

  function updateDetails(updated: Card) {
    if (!workspace || !demo) return;
    const current = workspace.cards.find(card => card.id === updated.id);
    const me = workspace.members.find(member => member.id === workspace.me);
    if (!current || !me?.active) return;
    const editable = isCoordinator(me) || current.assignees.includes(workspace.me);
    persist({ ...workspace, cards: workspace.cards.map(card => card.id === current.id ? {
      ...card, checklist: editable ? updated.checklist : card.checklist, comments: updated.comments,
    } : card) });
  }

  function openCard(id: string) {
    setSelected(id);
    if (!window.matchMedia("(min-width: 1280px)").matches) setOverlay("detail");
  }

  if (!workspace) return <div className="qp-app grid min-h-dvh place-items-center bg-[var(--qp-bg)] text-[var(--qp-text)]">
    <div className="space-y-5 text-center"><Brand full/><p role="status" className="text-xs text-[var(--qp-muted)]">Preparando o quadro do PET?</p></div>
  </div>;
  const me = workspace.members.find(member => member.id === workspace.me);
  const card = selected === null ? workspace.cards.find(value => value.stage === "review") || workspace.cards[0] : workspace.cards.find(value => value.id === selected);
  const href = (path: string) => `${path}${demo ? "?demo=1" : ""}`;

  return <div className="qp-app qp-detailed min-h-dvh bg-[var(--qp-bg)] text-[var(--qp-text)]">
    <a href="#conteudo" className="sr-only z-[100] rounded-lg bg-[var(--qp-purple)] p-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Pular para o conteúdo</a>
    <aside aria-label="Navegação lateral" className="fixed inset-y-0 left-0 z-30 hidden w-[230px] flex-col gap-6 border-r border-[var(--qp-border)] bg-gradient-to-b from-[var(--qp-sidebar-top)] to-[var(--qp-sidebar-bottom)] px-[18px] py-6 md:flex">
      <Brand/>
      <div className="flex h-[52px] items-center gap-2 rounded-[9px] border border-[var(--qp-border)] bg-[var(--qp-soft)] px-2.5"><span className="grid size-7 place-items-center rounded-lg bg-[var(--qp-purple-soft)] text-[var(--qp-lilac)]"><BriefcaseBusiness size={14}/></span><span><strong className="block text-[11px] font-semibold">PET UFC Russas</strong><small className="text-[8px] text-[var(--qp-muted)]">{workspace.members.length} membros</small></span></div>
      <nav aria-label="Menu principal" className="grid gap-1.5">{navigation.map(item => <Link prefetch={false} key={item.path} href={href(item.path)} aria-current={(ranking ? "/ranking" : "/quadro") === item.path ? "page" : undefined}
        className={`flex h-10 items-center gap-[11px] rounded-[9px] px-3 text-[13px] font-medium ${(ranking ? "/ranking" : "/quadro") === item.path ? "bg-[var(--qp-purple)] text-white" : "text-[var(--qp-secondary)] hover:bg-[var(--qp-hover)]"}`}><item.icon size={16}/>{item.label}</Link>)}</nav>
      <div className="mt-auto grid gap-3">
        {isCoordinator(me) && <button onClick={() => setOverlay("members")} className="flex items-center gap-3 rounded-lg px-3 py-2 text-[11px] text-[var(--qp-muted)] hover:bg-[var(--qp-hover)]"><Users size={15}/> Gerenciar membros</button>}
        {me && <div className="flex h-[58px] items-center gap-2 rounded-[10px] bg-[var(--qp-soft)] px-2.5"><Avatar name={me.name}/><span><strong className="block text-[10px] font-semibold">{me.name}</strong><small className="text-[8px] text-[var(--qp-muted)]">{roles[me.role]} · {me.points} pts</small></span></div>}
      </div>
    </aside>
    <div className="min-w-0 md:ml-[230px]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-[var(--qp-border)] bg-[var(--qp-header)] px-5 md:px-6">
        <div className="md:hidden"><Brand/></div>
        {ranking ? <span className="hidden text-xs font-medium text-[var(--qp-secondary)] md:inline">PET UFC Russas / Ranking</span> : <label className="relative hidden w-full max-w-[470px] md:block"><Search size={15} className="absolute top-3 left-3 text-[var(--qp-muted)]"/><input className="w-full rounded-[9px] border border-[var(--qp-border)] bg-[var(--qp-bg)] py-3 pr-3 pl-10 text-[10px] outline-none focus:border-[var(--qp-purple)]" placeholder="Buscar tarefas do PET..." aria-label="Buscar tarefas do PET" value={query} onChange={event => setQuery(event.target.value)}/></label>}
        <div className="flex shrink-0 items-center gap-3"><span className="hidden text-[9px] text-[var(--qp-muted)] sm:inline">{demo ? "Demonstração local" : "PET UFC Russas"}</span>{demo && <Link prefetch={false} href="/login" className="flex items-center gap-1.5 text-[10px] text-[var(--qp-lilac)]"><LogIn size={14}/><span>Entrar</span></Link>}{me && <span className="hidden sm:inline"><Avatar name={me.name}/></span>}</div>
      </header>
      <main id="conteudo" className={`min-h-[calc(100dvh-72px)] ${ranking ? "qp-violet" : ""} bg-[var(--qp-bg)] text-[var(--qp-text)] xl:flex`}>
        <div className="min-w-0 flex-1 px-5 py-6 pb-24 md:px-[22px] md:pb-6">
          {notice && <div role="status" className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--qp-purple-border)] bg-[var(--qp-purple-soft)] px-3 py-2 text-[10px] leading-5 text-[var(--qp-lilac)]"><span className="flex-1">{notice}</span><button aria-label="Dispensar aviso" onClick={() => setNotice("")}><X size={14}/></button></div>}
          {ranking ? <Ranking workspace={workspace}/> : <Board workspace={workspace} demo={demo} selectedId={card?.id || ""} query={query} setQuery={setQuery} newCard={() => setOverlay("new")} openCard={openCard} moveCard={moveCard} manageMembers={isCoordinator(me) ? () => setOverlay("members") : undefined}/>}
        </div>
        {!ranking && card && <aside aria-label="Detalhes da tarefa selecionada" className="sticky top-[72px] hidden h-[calc(100dvh-72px)] w-[310px] shrink-0 overflow-y-auto border-l border-[var(--qp-border)] bg-[var(--qp-detail)] xl:block"><TaskDetails key={card.id} card={card} workspace={workspace} close={closeDetails} move={moveCard} update={updateDetails} demo={demo}/></aside>}
      </main>
    </div>
    <nav aria-label="Navegação mobile" className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-[var(--qp-border)] bg-[var(--qp-header)] px-2 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
      {navigation.map(item => <Link prefetch={false} key={item.path} href={href(item.path)} aria-current={(ranking ? "/ranking" : "/quadro") === item.path ? "page" : undefined}
        className={`grid w-1/2 justify-items-center gap-1.5 rounded-lg p-2 text-[10px] ${(ranking ? "/ranking" : "/quadro") === item.path ? "text-[var(--qp-lilac)]" : "text-[var(--qp-muted)]"}`}><item.icon size={20}/>{item.label}</Link>)}
    </nav>
    {overlay === "new" && <NewActivity members={workspace.members} meId={workspace.me} demo={demo} close={close} save={newCard => {
      persist({ ...workspace, cards: [...workspace.cards, newCard] }); close(); setSelected(newCard.id); setNotice("Tarefa adicionada ao quadro de demonstração.");
    }}/>}
    {overlay === "detail" && (card ? <CardDetail key={card.id} card={card} workspace={workspace} close={closeDetails} move={moveCard} update={updateDetails} demo={demo}/> : <Overlay title="Tarefa indisponível" close={close}><Empty text="Esta tarefa não foi encontrada."/></Overlay>)}
    {overlay === "members" && isCoordinator(me) && <GroupMembers workspace={workspace} demo={demo} close={close} add={(member: Member) => {
      persist({ ...workspace, members: [...workspace.members, member] }); setNotice("Membro adicionado à demonstração.");
    }}/>}
  </div>;
}
