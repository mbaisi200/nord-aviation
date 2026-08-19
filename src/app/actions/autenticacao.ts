"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import {
  buscarUsuarioPorLogin,
  conferirSenha,
  contarUsuarios,
  hashSenha,
  obterSessao,
  removerCookieSessao,
} from "@/lib/auth";
import { criarSessao, opcoesCookie } from "@/lib/sessao";

export type EstadoAutenticacao = { erro?: string; sucesso?: string } | null;

const schemaEntrar = z.object({
  login: z.string().trim().min(1, "Informe o usuário."),
  senha: z.string().min(1, "Informe a senha."),
  next: z.string().optional(),
});

const schemaCriarPrimeiro = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  login: z
    .string()
    .trim()
    .min(3, "O usuário deve ter pelo menos 3 caracteres.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Caracteres inválidos no usuário."),
  senha: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres."),
  confirmar: z.string(),
});

const schemaTrocarSenha = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual."),
    novaSenha: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmar: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: "As senhas não coincidem.",
    path: ["confirmar"],
  });

export async function entrar(
  _estado: EstadoAutenticacao,
  formData: FormData,
): Promise<EstadoAutenticacao> {
  const dados = schemaEntrar.safeParse({
    login: formData.get("login"),
    senha: formData.get("senha"),
    next: formData.get("next"),
  });
  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const usuario = await buscarUsuarioPorLogin(dados.data.login);
  if (!usuario || !(await conferirSenha(dados.data.senha, usuario.senhaHash))) {
    return { erro: "Usuário ou senha incorretos." };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    "nord_sessao",
    await criarSessao({
      userId: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
    }),
    opcoesCookie(),
  );

  const proximo =
    dados.data.next &&
    dados.data.next.startsWith("/") &&
    !dados.data.next.startsWith("//")
      ? dados.data.next
      : "/";
  redirect(proximo);
}

export async function criarPrimeiroUsuario(
  _estado: EstadoAutenticacao,
  formData: FormData,
): Promise<EstadoAutenticacao> {
  if ((await contarUsuarios()) > 0) {
    return { erro: "Já existe um usuário cadastrado." };
  }

  const dados = schemaCriarPrimeiro.safeParse({
    nome: formData.get("nome"),
    login: formData.get("login"),
    senha: formData.get("senha"),
    confirmar: formData.get("confirmar"),
  });
  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }
  if (dados.data.senha !== dados.data.confirmar) {
    return { erro: "As senhas não coincidem." };
  }

  const existente = await buscarUsuarioPorLogin(dados.data.login);
  if (existente) {
    return { erro: "Este usuário já está em uso." };
  }

  await db.insert(usuarios).values({
    nome: dados.data.nome,
    login: dados.data.login,
    senhaHash: await hashSenha(dados.data.senha),
  });

  return { sucesso: "Usuário criado! Faça login para continuar." };
}

export async function trocarSenha(
  _estado: EstadoAutenticacao,
  formData: FormData,
): Promise<EstadoAutenticacao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");

  const dados = schemaTrocarSenha.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    novaSenha: formData.get("novaSenha"),
    confirmar: formData.get("confirmar"),
  });
  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const usuario = await buscarUsuarioPorLogin(sessao.login);
  if (!usuario) redirect("/entrar");
  if (!(await conferirSenha(dados.data.senhaAtual, usuario.senhaHash))) {
    return { erro: "A senha atual está incorreta." };
  }

  await db
    .update(usuarios)
    .set({ senhaHash: await hashSenha(dados.data.novaSenha) })
    .where(eq(usuarios.id, usuario.id));

  revalidatePath("/trocar-senha");
  return { sucesso: "Senha alterada com sucesso." };
}

export async function sair(): Promise<void> {
  await removerCookieSessao();
  redirect("/entrar");
}