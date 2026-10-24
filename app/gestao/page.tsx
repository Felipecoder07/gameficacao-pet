import Link from "next/link";
import LegacyDashboard from "@/components/quadro/legacy-dashboard";
import "./legacy.css";

export default function Management() {
  return <div className="legacy-app"><div className="border-b border-white/10 bg-[#0d1220] px-5 py-3 text-xs text-white"><Link prefetch={false} className="text-violet-300" href="/quadro">← Voltar para o Quadro de Pontos</Link><span className="ml-5">Gestão de registros e validações</span></div><LegacyDashboard/></div>;
}
