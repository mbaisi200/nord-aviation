import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function criarDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Variável de ambiente DATABASE_URL não definida. Copie .env.example para .env e configure a conexão do Neon.",
    );
  }
  return drizzle(neon(url), { schema });
}

let instancia: ReturnType<typeof criarDb> | null = null;

export function getDb() {
  if (!instancia) instancia = criarDb();
  return instancia;
}

export const db = new Proxy({} as ReturnType<typeof criarDb>, {
  get(_target, prop, receiver) {
    const atual = getDb();
    const valor = Reflect.get(atual, prop, receiver);
    return typeof valor === "function" ? valor.bind(atual) : valor;
  },
});

export type Db = typeof db;