import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  validIdentifier,
  makeTarget,
  parseTarget,
  targetHref,
  targetKey,
} from "../lib/chains.ts";
const fixtures = JSON.parse(
  fs.readFileSync(new URL("../../data/chain-targets.json", import.meta.url)),
);
test("frontend and backend share chain identifier contract", () => {
  for (const fixture of fixtures)
    assert.equal(
      validIdentifier(fixture.chain, fixture.kind, fixture.value),
      fixture.valid,
      JSON.stringify(fixture),
    );
});
test("legacy Ethereum evidence still resolves and saves unchanged", () => {
  const address = `0x${"a".repeat(40)}`,
    hash = `0x${"b".repeat(64)}`;
  assert.equal(makeTarget("ethereum", "address", hash), hash);
  assert.equal(targetHref(address), `/address/${address}`);
  assert.equal(targetHref(hash), `/transaction/${hash}`);
  assert.equal(targetKey(address), targetKey(address.replaceAll("a", "A")));
});
test("chain and kind prevent collisions while base58 identifiers preserve case", () => {
  const hash = "a".repeat(64);
  assert.notEqual(
    targetKey(`bitcoin:transaction:${hash}`),
    targetKey(`monero:transaction:${hash}`),
  );
  const a = "1".repeat(30) + "AbA",
    b = "1".repeat(30) + "Aba";
  assert.ok(validIdentifier("solana", "address", a));
  assert.ok(validIdentifier("solana", "address", b));
  assert.notEqual(
    targetKey(`solana:address:${a}`),
    targetKey(`solana:address:${b}`),
  );
  assert.equal(
    targetKey("aptos:address:0x1"),
    targetKey(`aptos:address:0x${"0".repeat(63)}1`),
  );
  assert.notEqual(
    targetKey(`aptos:address:0x${hash}`),
    targetKey(`aptos:transaction:0x${hash}`),
  );
});
test("saved targets restore the correct chain route and reject malformed records", () => {
  for (const fixture of fixtures.filter((f) => f.valid)) {
    const target = makeTarget(fixture.chain, fixture.kind, fixture.value);
    assert.ok(target);
    assert.equal(parseTarget(target).chain, fixture.chain);
    if (fixture.chain !== "ethereum")
      assert.equal(
        targetHref(target),
        `/chain/${fixture.chain}/${fixture.kind}/${fixture.value}`,
      );
  }
  assert.equal(parseTarget("solana:address:bad:extra"), null);
  assert.equal(parseTarget("unknown:address:0x1"), null);
});
