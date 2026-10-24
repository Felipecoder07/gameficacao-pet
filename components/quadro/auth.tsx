"use client";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Brand, panel, primary, secondary } from "./ui";

export function AuthScreen() {
  return <main className="qp-app qp-violet grid min-h-dvh place-items-center bg-[var(--qp-bg)] px-5 py-10 text-[var(--qp-text)]">
    <div className={`${panel} w-full max-w-[440px] p-8`}>
      <Brand full/>
      <h1 className="mt-9 text-[27px] font-bold">Entre no quadro do PET</h1>
      <p className="mt-4 text-xs leading-6 text-[var(--qp-secondary)]">Organize suas tarefas, registre suas entregas e acompanhe a pontuação dos membros do PET UFC Russas.</p>
      <p className="mt-5 text-[11px] leading-6 text-[var(--qp-muted)]">Use a conta ChatGPT vinculada ao e-mail cadastrado pela coordenação.</p>
      <Link prefetch={false} href="/signin-with-chatgpt?return_to=%2Fquadro" className={`${primary} mt-6 w-full`}><ShieldCheck size={16}/> Entrar com ChatGPT <ArrowRight size={14}/></Link>
      <Link prefetch={false} href="/quadro?demo=1" className={`${secondary} mt-3 w-full`}>Explorar demonstração</Link>
      <p className="mt-6 text-center text-[10px] leading-5 text-[var(--qp-muted)]">Ainda não tem acesso? Fale com a coordenação do PET.</p>
    </div>
  </main>;
}
