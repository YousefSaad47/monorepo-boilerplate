/** biome-ignore-all lint/complexity/noStaticOnlyClass: <> */
/** biome-ignore-all lint/style/noNonNullAssertion: <> */

import { AES, enc } from "crypto-js";

export class Encryption {
  static encrypt(text: string, secret = process.env.ENCRYPTION_KEY!) {
    return AES.encrypt(text, secret).toString();
  }

  static decrypt(ciphertext: string, secret = process.env.ENCRYPTION_KEY!) {
    return AES.decrypt(ciphertext, secret).toString(enc.Utf8);
  }
}
