// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as ccfcrypto from "@microsoft/ccf-app/crypto";
import { ccf } from "@microsoft/ccf-app/global";
import { Base64 } from "js-base64";
import { IKeyItem } from "../endpoints/IKeyItem";
import { arrayBufferToHex } from "../utils/Tooling";
import { Logger } from "../utils/Logger";

export class KeyGeneration {
  // Calculate a sha2 digest
  public static calculateHash = (data: ArrayBuffer): Uint8Array => {
    const digest = new Uint8Array(ccfcrypto.digest("SHA-256", data));
    return digest;
  };

  // Calculate hex hash
  public static calculateHexHash = (data: ArrayBuffer): string => {
    return arrayBufferToHex(KeyGeneration.calculateHash(data).buffer);
  };

  // Calculate a unique kid for the new key
  public static calculateKid = (pubkey: string) => {
    const buf = ccf.strToBuf(pubkey);
    const digest = this.calculateHash(buf);
    return Base64.fromUint8Array(digest, true);
  };

  // Generate new key item
  public static generateKeyItem = (id: number): IKeyItem => {
    const curve = "secp384r1";
    const keys = ccfcrypto.generateEcdsaKeyPair(curve);
    const jwk: IKeyItem = ccfcrypto.pemToJwk(
      keys.privateKey,
      KeyGeneration.calculateKid(keys.publicKey),
    );
    // jwk.d is private key, jwk.x is public key

    // We will get an untrusted timestamp from the host. Is this a threat?
    jwk.timestamp = Date.now();
    jwk.id = id;

    Logger.secret(`JWK: `, jwk);
    return jwk;
  };
}
