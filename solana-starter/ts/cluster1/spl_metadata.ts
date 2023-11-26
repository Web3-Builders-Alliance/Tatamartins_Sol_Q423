import { createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "../dev-wallet.json";

// We're going to import our keypair from the wallet file & RPC
const keypair1 = Keypair.fromSecretKey(new Uint8Array(wallet));
const RPC_ENDPOINT = "https://api.devnet.solana.com";

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection(RPC_ENDPOINT, commitment);

// Define our Mint address
const mint = new PublicKey("YV9QDki8LfhttZ7ZW5BgoQnjEw4rjpxRZVrBYa4t6LV");

// Add the Token Metadata Program
const token_metadata_program_id = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// Create PDA for token metadata
const metadata_seeds = [
  Buffer.from("metadata"),
  token_metadata_program_id.toBuffer(),
  mint.toBuffer(),
];
const [metadata_pda, _bump] = PublicKey.findProgramAddressSync(
  metadata_seeds,
  token_metadata_program_id
);

(async () => {
  try {
    const umi = createUmi(RPC_ENDPOINT);

    let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
    const myKeypairSigner = createSignerFromKeypair(umi, keypair);

    umi.use(signerIdentity(myKeypairSigner));

    let myTransaction = createMetadataAccountV3(umi, {
      //accounts
      metadata: publicKey(metadata_pda.toString()),
      mint: publicKey(mint.toString()),
      mintAuthority: myKeypairSigner,
      payer: myKeypairSigner,
      updateAuthority: keypair.publicKey,
      data: {
        name: "test",
        symbol: "tst",
        uri: "example_test.com",
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    });

    let result = await myTransaction.sendAndConfirm(umi);

    console.log(myTransaction);

    console.log(result);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();

/* let tx = await createMetadataAccountV3(
        {}, {
        createMetadataAccountArgsV3: {
          metadata: mint3Metadata,
          mint: mint3,
          mintAuthority: keypair.publicKey,
          payer: keypair.publicKey,
          updateAuthority: keypair.publicKey,
        },
        createMetadataAccountArgsV3: {
            data: {
                name: "WBA",
                symbol: "WBA",
                uri: "https://arweave.net/euAlBrhc3NQJ5Q-oJnP10vsQFjTV7E9CgHZcVm8cogo",
                 */
