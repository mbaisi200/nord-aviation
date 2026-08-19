import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import {
  lerSessao,
  nomeCookie,
  opcoesCookie,
  type SessaoPayload,
} from "@/lib/sessao";

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function conferirSenha(
  senha: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function obterSessao(): Promise<SessaoPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(nomeCookie())?.value;
  return lerSessao(token);
}

export async function exigirSessao(): Promise<SessaoPayload> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  return sessao;
}

export async function removerCookieSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(nomeCookie());
  cookieStore.set(nomeCookie(), "", { ...opcoesCookie(), maxAge: 0 });
}

export async function buscarUsuarioPorLogin(login: string) {
  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.login, login));
  return usuario;
}

export async function contarUsuarios(): Promise<number> {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(usuarios);
  return r.n;
}

export { opcoesCookie };