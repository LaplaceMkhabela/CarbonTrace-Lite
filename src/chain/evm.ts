import fs from "node:fs";
import path from "node:path";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  keccak256,
  toUtf8Bytes,
  type InterfaceAbi,
  type TransactionReceipt,
} from "ethers";
import {
  computeClaimHash,
  type AttestationReceipt,
  type ClaimAttestationInput,
  type LedgerClient,
} from "./types";

/**
 * Live Polygon (Amoy testnet) ledger client.
 *
 * Requires: PRIVATE_KEY, POLYGON_RPC_URL and (after deployment) CONTRACT_ADDRESS.
 * The contract bytecode/ABI come from contracts/out/CarbonTraceCredits.json.
 */

const ARTIFACT_PATH = path.join(process.cwd(), "contracts", "out", "CarbonTraceCredits.json");

export interface EvmConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress?: string;
  chain?: string;
}

export class EvmChainClient implements LedgerClient {
  readonly chain: string;
  private readonly wallet: Wallet;
  private readonly provider: JsonRpcProvider;
  private readonly address: string | null;
  private artifact: { abi: InterfaceAbi; bytecode: string } | null = null;

  constructor(config: EvmConfig) {
    this.chain = config.chain ?? "polygon-amoy";
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.wallet = new Wallet(config.privateKey, this.provider);
    this.address = config.contractAddress ?? null;
  }

  contractAddress(): string | null {
    return this.address;
  }

  /** Deploys the contract with the signer as minter. Returns the address. */
  async deploy(): Promise<string> {
    this.loadArtifact();
    const { abi, bytecode } = this.artifact!;
    const { ContractFactory } = await import("ethers");
    const factory = new ContractFactory(abi, bytecode, this.wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`Deployed CarbonTraceCredits → ${address} (tx ${contract.deploymentTransaction()?.hash})`);
    console.log(`Minter set to ${await this.wallet.getAddress()}`);
    return address;
  }

  private loadArtifact(): void {
    if (this.artifact) return;
    if (!fs.existsSync(ARTIFACT_PATH)) {
      throw new Error("Contract artifact missing. Run `npm run compile` first.");
    }
    const parsed = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8")) as {
      abi: InterfaceAbi;
      bytecode: string;
    };
    this.artifact = parsed;
  }

  async attest(input: ClaimAttestationInput, mintsForAddress?: string): Promise<AttestationReceipt> {
    if (!this.address) throw new Error("EVM client not configured with CONTRACT_ADDRESS. Deploy first.");
    this.loadArtifact();

    const claimHash = computeClaimHash(input);
    const community = mintsForAddress ?? (await this.wallet.getAddress());
    const confidencePercent = Math.round(input.confidence * 100);
    const amount =
      BigInt(Math.round(input.creditsAwarded * 100)) * 10n ** 16n; // 2 dp → 18 decimals

    const contract = new Contract(this.address, this.artifact!.abi, this.wallet);
    const tx = await (contract as unknown as {
      mint(c: string, h: string, p: number, a: bigint): Promise<{ wait(): Promise<TransactionReceipt> }>;
    }).mint(community, claimHash, confidencePercent, amount);
    const receipt = await tx.wait();

    return {
      claimHash,
      chain: this.chain,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      nonce: Number((await contract.claimCount()) - 1n),
      attestedAt: new Date().toISOString(),
    };
  }

  async balanceOf(address: string): Promise<bigint> {
    if (!this.address) throw new Error("EVM client not configured with CONTRACT_ADDRESS. Deploy first.");
    this.loadArtifact();
    const contract = new Contract(this.address, this.artifact!.abi, this.provider);
    return (contract as unknown as { balanceOf(a: string): Promise<bigint> }).balanceOf(address);
  }

  /** Read the on-chain attestation for a claim hash. */
  async verifyHash(claimHash: string): Promise<{
    exists: boolean;
    nonce: number;
    confidencePercent: number;
    attestedAt: number;
  }> {
    if (!this.address) throw new Error("EVM client not configured with CONTRACT_ADDRESS. Deploy first.");
    this.loadArtifact();
    const contract = new Contract(this.address, this.artifact!.abi, this.provider);
    const out = await (contract as unknown as {
      verifyHash(h: string): Promise<[boolean, bigint, number, bigint]>;
    }).verifyHash(keccak256(toUtf8Bytes(claimHash)));
    return {
      exists: out[0],
      nonce: Number(out[1]),
      confidencePercent: out[2],
      attestedAt: Number(out[3]),
    };
  }
}