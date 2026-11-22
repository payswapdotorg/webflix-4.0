import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWebflixServer } from "./server.ts";

// 官方插件宿主通过导出的 main 启动；导入时直接连接会被宿主判定为无效入口。
export async function main(): Promise<void> {
  const dist = dirname(fileURLToPath(import.meta.url));
  const pluginRoot = join(dist, "..");
  const manifest = JSON.parse(
    await readFile(join(pluginRoot, ".zcode-plugin", "plugin.json"), "utf8"),
  ) as { version: string };

  const server = createWebflixServer({
    version: manifest.version,
    panelPath: join(dist, "ui", "panel.html"),
  });

  let stopping = false;
  const close = () => {
    if (stopping) return;
    stopping = true;
    void server.close();
  };
  process.once("SIGTERM", close);
  process.once("SIGINT", close);
  process.stdin.once("end", close);
  await server.connect(new StdioServerTransport());
}
