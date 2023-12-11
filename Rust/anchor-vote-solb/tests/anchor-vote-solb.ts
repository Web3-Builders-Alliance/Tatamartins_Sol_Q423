import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";
import { AnchorVoteSolb } from "../target/types/anchor_vote_solb";

describe("anchor-vote-solb", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();

  const program = anchor.workspace.AnchorVoteSolb as Program<AnchorVoteSolb>;

  const site = "google.com";

  // anchor.web3.keypair
  const signer = Keypair.generate();

  const hash = createHash("sha256");

  hash.update(Buffer.from(site));

  const seeds = [hash.digest()];

  const vote = PublicKey.findProgramAddressSync(seeds, program.programId)[0];

  const confirm = async (signature: string) => {
    const block = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string) => {
    console.log(
      `https://explorer.solana.com/transaction/${signature}?cluster=custom`
    );
    return signature;
  };

  it("Airdrop", async () => {
    await provider.connection
      .requestAirdrop(signer.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
  });

  xit("Initialize", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize(site)
      .accounts({
        signer: signer.publicKey,
        vote,
      })
      .signers([signer])
      .rpc()
      .then(confirm)
      .then(log);
    // console.log("Your transaction signature", tx);
  });

  it("Upvote", async () => {
    // Add your test here.
    const tx = await program.methods
      .upvote(site)
      .accounts({
        signer: signer.publicKey,
        vote,
      })
      .signers([signer])
      .rpc()
      .then(confirm)
      .then(log);
    // console.log("Your transaction signature", tx);
  });
});


// anchor idl init 4RrwwWCGWeaPwj9NbLzYQnANBHWeeGQ474NR4fTmcXsQ -f target/idl/anchor_vote_solb.json

