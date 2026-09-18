/**
 * Compiles CarbonTraceCredits.sol with solc-js and writes
 * contracts/out/CarbonTraceCredits.json ({ abi, bytecode }).
 *
 *   npm run compile
 */
import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const CONTRACT = path.join(process.cwd(), "contracts", "CarbonTraceCredits.sol");
const OUT = path.join(process.cwd(), "contracts", "out", "CarbonTraceCredits.json");

const source = fs.readFileSync(CONTRACT, "utf8");
const input = {
  language: "Solidity",
  sources: { "contracts/CarbonTraceCredits.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.bytecode.sourceMap"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const contracts = output.contracts?.["contracts/CarbonTraceCredits.sol"];
const artifact = contracts?.["CarbonTraceCredits"];
if (!artifact) {
  console.error("Compilation failed:");
  console.error((output.errors ?? []).map((e: { formattedMessage: string }) => e.formattedMessage).join("\n"));
  process.exit(1);
}

const warnings = (output.errors ?? [])
  .filter((e: { severity: string }) => e.severity === "warning")
  .map((e: { formattedMessage: string }) => e.formattedMessage);
if (warnings.length) console.warn("Warnings:\n" + warnings.join("\n"));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}` }, null, 2));

console.log(`Compiled ${path.basename(CONTRACT)} → ${OUT}`);
console.log(`  abi functions : ${artifact.abi.filter((a: { type: string }) => a.type === "function").length}`);
console.log(`  bytecode size  : ${artifact.evm.bytecode.object.length / 2} bytes`);