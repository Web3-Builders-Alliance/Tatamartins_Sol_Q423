// import {
//   createFungible,
//   mplTokenMetadata,
// } from "@metaplex-foundation/mpl-token-metadata";
// import {
//   createSignerFromKeypair,
//   percentAmount,
//   publicKey,
//   signerIdentity,
// } from "@metaplex-foundation/umi";
// import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
// import { createBundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import {
  Address,
  AnchorProvider,
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

import wallet from "./wallet/dev-wallet.json";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

const RPC_ENDPOINT = "https://api.devnet.solana.com";

// Create a devnet connection
const connection = new Connection(RPC_ENDPOINT);

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
// wba 8TUYkuhnM7ew1rR89R7iZhyuWA1b7tkEYTQeaaZ6CoyF
// dev 2xYxyX1SioRr2vRfsnJkGNDt3V4T74ZR2vUc9m7jKp5x
// 7u7ds4TpkKNAnGeoUTTwbGsJg2wBWTHR7jqK2d2UBD7u
const mint = new PublicKey("2xYxyX1SioRr2vRfsnJkGNDt3V4T74ZR2vUc9m7jKp5x");

// Create the PDA for the Challenge1 Vault
const vault = PublicKey.findProgramAddressSync(
  [Buffer.from("vault4"), keypair.publicKey.toBuffer(), mint.toBuffer()],
  program.programId
)[0];

const metadata_program = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// Create PDA for token metadata
const metadata_seeds = [
  Buffer.from("metadata"),
  metadata_program.toBuffer(),
  mint.toBuffer(),
];
const metadata = PublicKey.findProgramAddressSync(
  metadata_seeds,
  metadata_program
)[0];

// // UMI
// async () => {
//   try {
//     const umi = createUmi(RPC_ENDPOINT);
//     umi.use(mplTokenMetadata());
//     const bundlrUploader = createBundlrUploader(umi);
//     let keypairUmi = umi.eddsa.createKeypairFromSecretKey(
//       new Uint8Array(wallet)
//     );
//     const signerUmi = createSignerFromKeypair(umi, keypairUmi);
//     umi.use(signerIdentity(signerUmi));

//     const metadataToken = {
//       name: "WBA",
//       symbol: "WBA",
//       uri: "wba.com",
//       description: "WBA CHECK",
//       creators: [{ address: keypair.publicKey, share: 100 }],
//     };

//     const myUri = await bundlrUploader.uploadJson(metadataToken);
//     console.log("Your metadata URI: ", myUri);

//     const updateTokenTx = await createFungible(umi, {
//       mint: publicKey(mint),
//       name: metadataToken.name,
//       uri: myUri,
//       sellerFeeBasisPoints: percentAmount(5),
//     }).sendAndConfirm(umi);
//   } catch (error) {
//     console.log("Oops.. Something went wrong", error);
//   }
// };

(async () => {
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
  console.log(`Your ata is: ${ownerAta.address.toBase58()}`);

  const token_mint = 10 ** 15;

  // Mint some tokens!
  const mintTx = await mintTo(
    connection,
    keypair,
    mint,
    ownerAta.address,
    keypair.publicKey,
    token_mint
  );
  console.log(`Your mint txid: ${mintTx}`);

  // Complete the Challenge!
  const completeTx = await program.methods
    .completeChallenge4()
    .accounts({
      owner: keypair.publicKey,
      ata: ownerAta.address,
      profile: profilePda,
      vault,
      metadata,
      mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      metadataProgram: metadata_program,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();

  console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${completeTx}?cluster=devnet`);
})();
