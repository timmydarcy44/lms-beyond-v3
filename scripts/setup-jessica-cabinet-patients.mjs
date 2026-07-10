/**
 * Migration + import patients cabinet Jessica (Doctolib PDF).
 *
 * Usage:
 *   node scripts/setup-jessica-cabinet-patients.mjs "chemin/vers/export.pdf"
 */
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.error("Usage: node scripts/setup-jessica-cabinet-patients.mjs <chemin-export.pdf>");
  process.exit(1);
}

function run(script, args = []) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      stdio: "inherit",
      cwd: resolve(__dirname, ".."),
    });
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${script} exited with ${code}`));
    });
  });
}

await run(resolve(__dirname, "apply-jessica-patients-migration.mjs"));
await run(resolve(__dirname, "import-jessica-cabinet-patients.mjs"), [pdfPath]);
