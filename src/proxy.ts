import { NextRequest, NextResponse } from "next/server";
import { lerSessao } from "@/lib/sessao";

const ROTAS_PUBLICAS = ["/entrar"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = ROTAS_PUBLICAS.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get("nord_sessao")?.value;
  const sessao = await lerSessao(token);
  if (!sessao) {
    const url = new URL("/entrar", req.nextUrl);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|icons/.*|.*\\.svg$|.*\\.png$|manifest\\.webmanifest|sw\\.js|works\\.js).*)",
  ],
};