import { readFile } from "node:fs/promises";
import path from "node:path";

/** The approved marketing HTML is shared by development and static publication. */
export async function marketingPage(filename: string): Promise<Response> {
  const html = await readFile(path.join(process.cwd(), "website", "pages", filename), "utf8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
