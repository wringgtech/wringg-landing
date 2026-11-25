import { marketingPage } from "../marketing/response";

export const dynamic = "force-static";

export async function GET() {
  return marketingPage("index.html");
}
