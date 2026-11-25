import fs from "node:fs/promises";
import path from "node:path";

// Preserve Next's current legal/help exports; publish the approved marketing HTML verbatim.
const routes = {
  "index.html": "index.html",
  "pricing.html": "pricing/index.html",
  "our-story.html": "our-story/index.html",
  "commercial-laundry.html": "commercial-laundry/index.html",
};
for (const [source, destination] of Object.entries(routes)) {
  const target = path.join("out", destination);
  if (destination.includes("/")) {
    // Next emits static Route Handlers as extensionless files. Cloudflare expects directories.
    const directory = path.dirname(target);
    const stat = await fs.stat(directory).catch(() => null);
    if (stat?.isFile()) await fs.unlink(directory);
    await fs.mkdir(directory, { recursive: true });
    await fs.rm(path.join("out", source), { force: true });
  }
  await fs.copyFile(path.join("website", "pages", source), target);
}
console.log(`Published ${Object.keys(routes).length} approved marketing pages into out.`);
