import { spawn } from "child_process";
import { existsSync } from "fs";
import { join, resolve } from "path";

interface InputContext {
  tool_input?: {
    context?: string;
    currentFile?: string;
  };
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnnotationData {
  id: string;
  type: string;
  number: number;
  bounds: BoundingBox;
  feedback: string;
}

interface PageData {
  id: string;
  name: string;
  image: string;
  width: number;
  height: number;
  annotations: AnnotationData[];
}

interface SubmitPayload {
  action: "submit";
  pages: PageData[];
  globalNotes?: string;
}

interface ShowMeOutput {
  hookSpecificOutput: {
    decision: {
      behavior: "allow" | "deny";
      message?: string;
    };
    showme?: {
      pages: PageData[];
      globalNotes?: string;
    };
  };
}

// Read stdin for context from Claude
async function readStdin(): Promise<InputContext> {
  const chunks: Buffer[] = [];

  // Check if stdin has data (not a TTY)
  if (process.stdin.isTTY) {
    return {};
  }

  return new Promise((resolve) => {
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => {
      const input = Buffer.concat(chunks).toString("utf-8").trim();
      if (input) {
        try {
          resolve(JSON.parse(input));
        } catch {
          resolve({});
        }
      } else {
        resolve({});
      }
    });

    // Timeout after 100ms if no input
    setTimeout(() => resolve({}), 100);
  });
}

// Open browser cross-platform
function openBrowser(url: string) {
  const platform = process.platform;

  let command: string;
  let args: string[];

  if (platform === "darwin") {
    command = "open";
    args = [url];
  } else if (platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url];
  } else {
    // Linux and others
    command = "xdg-open";
    args = [url];
  }

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

// Find the dist directory
function findDistDir(): string {
  const possiblePaths = [
    join(import.meta.dir, "..", "dist"),
    join(import.meta.dir, "..", "ui"),
    resolve("dist"),
    resolve("ui"),
  ];

  for (const p of possiblePaths) {
    if (existsSync(join(p, "index.html"))) {
      return p;
    }
  }

  // Default to ui for development
  return join(import.meta.dir, "..", "ui");
}

async function main() {
  const context = await readStdin();
  const port = Math.floor(Math.random() * 10000) + 40000;
  const distDir = findDistDir();

  let resolvePromise: (output: ShowMeOutput) => void;
  const resultPromise = new Promise<ShowMeOutput>((resolve) => {
    resolvePromise = resolve;
  });

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // API endpoints
      if (url.pathname === "/api/submit" && req.method === "POST") {
        const payload: SubmitPayload = await req.json();

        resolvePromise({
          hookSpecificOutput: {
            decision: { behavior: "allow" },
            showme: {
              pages: payload.pages,
              globalNotes: payload.globalNotes,
            },
          },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.pathname === "/api/cancel" && req.method === "POST") {
        resolvePromise({
          hookSpecificOutput: {
            decision: {
              behavior: "deny",
              message: "User cancelled ShowMe",
            },
          },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.pathname === "/api/context") {
        return new Response(JSON.stringify(context), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Serve static files
      let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
      const fullPath = join(distDir, filePath);

      try {
        const file = Bun.file(fullPath);
        if (await file.exists()) {
          const contentType = getContentType(filePath);
          return new Response(file, {
            headers: { "Content-Type": contentType },
          });
        }
      } catch {
        // File not found
      }

      // Fallback to index.html for SPA
      const indexPath = join(distDir, "index.html");
      const indexFile = Bun.file(indexPath);
      if (await indexFile.exists()) {
        return new Response(indexFile, {
          headers: { "Content-Type": "text/html" },
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  // Open browser
  const browserUrl = `http://localhost:${port}`;
  openBrowser(browserUrl);

  // Log to stderr (not stdout, which is for Claude)
  console.error(`ShowMe canvas opened at ${browserUrl}`);

  // Wait for result
  const result = await resultPromise;

  // Stop server
  server.stop();

  // Output result to stdout for Claude
  console.log(JSON.stringify(result));
}

function getContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    ts: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
  };
  return types[ext || ""] || "application/octet-stream";
}

main().catch((err) => {
  console.error("ShowMe error:", err);
  process.exit(1);
});
