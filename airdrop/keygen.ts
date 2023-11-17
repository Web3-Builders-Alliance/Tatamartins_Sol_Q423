import wallet from "./dev-wallet.json";
import { walletToBase58 } from "./utils/convert";

//Generate a new keypair
// let kp = Keypair.generate();

/* console.log(
  `You've generated a new Solana wallet:${kp.publicKey.toBase58()}[${
    kp.secretKey
  }]`
); */

console.log(walletToBase58(wallet));
