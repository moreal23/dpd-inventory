import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const publicDir = resolve(root, "public");
const clientDir = resolve(root, "src", "client");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DPD IT Inventory</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/app.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>
`;

await mkdir(publicDir, { recursive: true });

await build({
  entryPoints: [resolve(clientDir, "main.jsx")],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  sourcemap: false,
  outfile: resolve(publicDir, "app.js"),
  jsx: "automatic",
});

const css = await readFile(resolve(clientDir, "styles.css"), "utf8");
await writeFile(resolve(publicDir, "app.css"), css, "utf8");
await writeFile(resolve(publicDir, "index.html"), html, "utf8");
