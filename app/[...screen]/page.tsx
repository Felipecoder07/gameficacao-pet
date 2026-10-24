import { notFound, redirect } from "next/navigation";
import { QuadroApp } from "@/components/quadro/app";
import { AuthScreen } from "@/components/quadro/auth";

const retired = new Set(["visao-geral", "membros", "configuracoes", "perfil", "estados", "catalogo", "conquistas", "atividade", "nova-atividade", "notificacoes", "busca"]);
export default async function Screen({ params }: { params: Promise<{ screen: string[] }> }) {
  const { screen } = await params;
  if (retired.has(screen[0])) redirect("/quadro");
  if (["convite", "convite-expirado"].includes(screen[0])) redirect("/login");
  if (screen.length !== 1 || !["quadro", "ranking", "login"].includes(screen[0])) notFound();
  if (screen[0] === "login") return <AuthScreen/>;
  return <QuadroApp/>;
}
