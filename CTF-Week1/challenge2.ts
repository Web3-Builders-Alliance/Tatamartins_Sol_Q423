import {
  Address,
  AnchorProvider,
  BN,
  Program,
  Wallet,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { IDL, Week1 } from "./programs/week1";

import wallet from "./wallet/wba-wallet.json";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment: "confirmed",
});

// Create our program
const program = new Program<Week1>(
  IDL,
  "ctf1VWeMtgxa24zZevsXqDg6xvcMVy4FbP3cxLCpGha" as Address,
  provider
);

// Use the PDA for our CTF-Week1 profile
const profilePda = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), keypair.publicKey.toBuffer()],
  program.programId
)[0];

// Paste here the mint address for challenge1 token
// wba DH4bezeAk79887GyNen2RUJFaAjAKJSEZgdwX7P8HKQu
// dev AhXqjbm9eobDHVqxksPfSrncFkANhW9PFdabEvwEBsHa
const mint = new PublicKey("DH4bezeAk79887GyNen2RUJFaAjAKJSEZgdwX7P8HKQu");

// Create the PDA for the Challenge2 Vault
const vault = PublicKey.findProgramAddressSync(
  [Buffer.from("vault2"), keypair.publicKey.toBuffer(), mint.toBuffer()],
  program.programId
)[0];

const token_mint: number = 10 ** 15;

(async () => {
  try {
    // NB if you get TokenAccountNotFoundError, wait a few seconds and try again!

    // Create the ATA for your Wallet
    const ownerAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey,
      true,
      "confirmed"
    );

    // Mint some tokens!
    const mintTx = await mintTo(
      connection,
      keypair,
      mint,
      ownerAta.address,
      keypair.publicKey,
      token_mint
    );

    console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${mintTx}?cluster=devnet`);

    // Complete the Challenge!
    const completeTx = await program.methods
      .completeChallenge2(new BN(255))
      .accounts({
        owner: keypair.publicKey,
        ata: ownerAta.address,
        profile: profilePda,
        vault,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${completeTx}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
