declare module "solc" {
  interface CompileInput {
    language: string;
    sources: Record<string, { content: string }>;
    settings?: unknown;
  }
  interface CompileOutput {
    errors?: Array<{ severity: string; formattedMessage: string }>;
    contracts?: Record<string, Record<string, { abi: unknown[]; evm: { bytecode: { object: string } } }>>;
  }
  const solc: {
    compile(input: string): string;
    version(): string;
  };
  export default solc;
}