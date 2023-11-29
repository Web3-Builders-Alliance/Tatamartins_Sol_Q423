import { createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  base58,
  publicKey as publicKeySerializer,
  string,
} from "@metaplex-foundation/umi/serializers";
import { Commitment, Connection } from "@solana/web3.js";
import wallet from "./wallet/wba-wallet.json";

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

//Create a Umi instance
const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signerKeypair = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(signerKeypair));

console.log(`keypair: ${keypair}`);
console.log(`signerKeypair: ${signerKeypair}`);

const mint = publicKey("8TUYkuhnM7ew1rR89R7iZhyuWA1b7tkEYTQeaaZ6CoyF");
console.log(`mint: ${mint}`);
const tokenMetadataProgramId = publicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

console.log(`tokenMetadataProgramId: ${tokenMetadataProgramId}`);
const seeds = [
  string({ size: "variable" }).serialize("metadata"),
  publicKeySerializer().serialize(tokenMetadataProgramId),
  publicKeySerializer().serialize(mint),
];
console.log(`seeds: ${seeds}`);

const metadata_pda = umi.eddsa.findPda(tokenMetadataProgramId, seeds)[0];

console.log(`metadata_pda: ${metadata_pda}`);
(async () => {
  try {
    let tx = createMetadataAccountV3(umi, {
      metadata: publicKey(metadata_pda.toString()),
      mint: publicKey(mint.toString()),
      mintAuthority: signerKeypair,
      payer: signerKeypair,
      updateAuthority: keypair.publicKey,
      data: {
        name: "WBA",
        symbol: "WBA",
        uri: "WBA.com",
        sellerFeeBasisPoints: 5,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    });
    console.log(tx);

    let result = await tx.sendAndConfirm(umi);
    console.log(result);
    const signature = base58.deserialize(result.signature);

    console.log(
      `Succesfully Minted!. Transaction Here: https://solana.fm/tx/${signature[0]}?cluster=devnet`
    );
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
