import "server-only";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
const COOKIE_NAME = "nord_sessao";
const DURACAO = 60 * 60 * 24 * 7;

export type SessaoPayload = {
  userId: number;
  nome: string;
  login: string;
};

export function nomeCookie(): string {
  return COOKIE_NAME;
}

export async function criarSessao(payload: SessaoPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO}s`)
    .sign(secret);
}

export async function lerSessao(
  token: string | undefined,
): Promise<SessaoPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "number") return null;
    return {
      userId: payload.userId,
      nome: typeof payload.nome === "string" ? payload.nome : "",
      login: typeof payload.login === "string" ? payload.login : "",
    };
  } catch {
    return null;
  }
}

export function opcoesCookie(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO,
  };
}