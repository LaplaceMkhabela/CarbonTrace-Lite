/**
 * Minimal type declarations for Node's built-in SQLite module (available in
 * Node 22.5+, unflagged in Node 23.4+). Keeps CarbonTrace dependency-free on
 * native DB packages while still using a real SQL database.
 */

declare module "node:sqlite" {
  export type SupportedValueType =
    | null
    | number
    | bigint
    | string
    | Uint8Array;

  export interface StatementSync<Row = unknown> {
    run(...anonymousParameters: SupportedValueType[]): { changes: number; lastInsertRowid: number | bigint };
    get(...anonymousParameters: SupportedValueType[]): Row | undefined;
    all(...anonymousParameters: SupportedValueType[]): Row[];
  }

  export interface DatabaseSyncOptions {
    open?: boolean;
    enableForeignKeyConstraints?: boolean;
    readOnly?: boolean;
    allowExtension?: boolean;
    timeout?: number;
  }

  export class DatabaseSync<Database = unknown> {
    constructor(path: string, options?: DatabaseSyncOptions);
    exec(sql: string): void;
    prepare<Statement = unknown>(sql: string): StatementSync<Statement>;
    close(): void;
    isOpen(): boolean;
    function(
      name: string,
      options: { deterministic?: boolean; strict?: boolean },
      fn: (...args: SupportedValueType[]) => SupportedValueType,
    ): void;
  }
}