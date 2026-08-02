import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type SqlFn = NeonQueryFunction<false, false>;

let client: SqlFn | null = null;

function getClient(): SqlFn {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    client = neon(url);
  }
  return client;
}

// Lazily instantiated so importing this module (e.g. during `next build`'s
// page-data collection, which loads every route module) never touches
// process.env.DATABASE_URL. The connection is only created on first query,
// which always happens inside a request at runtime.
export const sql: SqlFn = new Proxy((() => undefined) as unknown as SqlFn, {
  apply(_target, _thisArg, args) {
    const c = getClient();
    return Reflect.apply(c as unknown as (...a: unknown[]) => unknown, c, args);
  },
  get(_target, prop, receiver) {
    const c = getClient();
    const value = Reflect.get(c as object, prop, receiver);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
