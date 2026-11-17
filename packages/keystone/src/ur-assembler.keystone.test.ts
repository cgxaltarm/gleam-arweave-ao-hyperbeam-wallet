import { describe, expect, it } from "vitest";
import { ArweaveCryptoAccount } from "@keystonehq/bc-ur-registry-arweave";
import { UR, UREncoder } from "@ngraveio/bc-ur";
import { decodeKeystoneAccount, KEYSTONE_ACCOUNT_UR_TYPE, WrongKeystoneQrError } from "./decode-account";
import { UrAssembler } from "./ur-assembler";

const modulus = Buffer.from(Array.from({ length: 512 }, (_, i) => (i * 7 + 3) % 256));
const xfp = "f23f9fd2";

function accountUr(): UR {
  return new ArweaveCryptoAccount(Buffer.from(xfp, "hex"), modulus, "Keystone 3 Pro").toUR();
}

describe("UrAssembler frame-mixing guard", () => {
  it("rejects a wrong-type frame mid-assembly, after progress", () => {
    const encoder = new UREncoder(accountUr(), 100);
    expect(encoder.fragmentsLength).toBeGreaterThan(1);
    const assembler = new UrAssembler(KEYSTONE_ACCOUNT_UR_TYPE);

    const first = assembler.feed(encoder.nextPart());
    expect(first.kind).toBe("progress");

    // A frame of a different UR type, arriving after the assembly has
    // started, must be refused before it can reach the decoder — never
    // merged into the partial assembly.
    const wrong = UREncoder.encodeSinglePart(new UR(Buffer.from([0x01]), "arweave-signature"));
    expect(() => assembler.feed(wrong)).toThrow(WrongKeystoneQrError);
    expect(() => assembler.feed(wrong)).toThrow(`Expected an "${KEYSTONE_ACCOUNT_UR_TYPE}" QR`);
  });

  it("tolerates feeding the same frame twice and still completes", () => {
    const encoder = new UREncoder(accountUr(), 100);
    const assembler = new UrAssembler(KEYSTONE_ACCOUNT_UR_TYPE);

    const firstPart = encoder.nextPart();
    expect(assembler.feed(firstPart).kind).toBe("progress");
    // The camera sees every frame repeatedly; a duplicate must not
    // break the assembly.
    expect(assembler.feed(firstPart).kind).toBe("progress");

    let last = assembler.feed(encoder.nextPart());
    for (let i = 0; i < 100 && last.kind !== "complete"; i++) {
      last = assembler.feed(encoder.nextPart());
    }
    expect(last.kind).toBe("complete");
    if (last.kind !== "complete") return;
    expect(decodeKeystoneAccount(last.ur).xfp).toBe(xfp);
  });
});
