import "mocha";
import { tokenizer, Token } from "../src/parser";
import { EOT } from "./test_util";
import chai = require("chai");
const assert = chai.assert;

describe("tokenizer", () => {
  const tok = (literal: string, type: string) => ({ literal, type }) as Token;

  it("eot", () => {
    assert.deepEqual(tokenizer(""), [EOT]);
  });

  it("false", () => {
    assert.deepEqual(tokenizer("false"), [
      { literal: "false", type: "Word" },
      EOT,
    ]);
  });

  it("userName is AttrPath", () => {
    assert.deepEqual(tokenizer("userName"), [
      { literal: "userName", type: "Word" },
      EOT,
    ]);
  });

  it("userName eq -12", () => {
    assert.deepEqual(
      [tok("userName", "Word"), tok("eq", "Word"), tok("-12", "Number"), EOT],
      tokenizer("userName eq -12"),
    );
  });

  it("0Field1 eq -12", () => {
    assert.deepEqual(
      [tok("0Field1", "Word"), tok("eq", "Word"), tok("-12", "Number"), EOT],
      tokenizer("0Field1 eq -12"),
    );
  });

  it("negative number before AND", () => {
    assert.deepEqual(tokenizer('userId eq -1 and type eq "my"'), [
      tok("userId", "Word"),
      tok("eq", "Word"),
      tok("-1", "Number"),
      tok("and", "Word"),
      tok("type", "Word"),
      tok("eq", "Word"),
      tok('"my"', "Quoted"),
      EOT,
    ]);
  });

  it("negative number before OR", () => {
    assert.deepEqual(tokenizer("n eq -2 or n eq 3"), [
      tok("n", "Word"),
      tok("eq", "Word"),
      tok("-2", "Number"),
      tok("or", "Word"),
      tok("n", "Word"),
      tok("eq", "Word"),
      tok("3", "Number"),
      EOT,
    ]);
  });

  it("negative number before `)`", () => {
    assert.deepEqual(tokenizer("(n eq -3)"), [
      tok("(", "Bracket"),
      tok("n", "Word"),
      tok("eq", "Word"),
      tok("-3", "Number"),
      tok(")", "Bracket"),
      EOT,
    ]);
  });

  it("negative number before `]`", () => {
    assert.deepEqual(tokenizer("emails[value eq -4]"), [
      tok("emails", "Word"),
      tok("[", "Bracket"),
      tok("value", "Word"),
      tok("eq", "Word"),
      tok("-4", "Number"),
      tok("]", "Bracket"),
      EOT,
    ]);
  });

  it("negative exponent and decimal numbers", () => {
    assert.deepEqual(
      tokenizer("n eq -1.5"),
      [tok("n", "Word"), tok("eq", "Word"), tok("-1.5", "Number"), EOT]
    );
    assert.deepEqual(tokenizer("n eq -1e3"), [
      tok("n", "Word"),
      tok("eq", "Word"),
      tok("-1e3", "Number"),
      EOT,
    ]);
    assert.deepEqual(tokenizer("n eq -1E+3"), [
      tok("n", "Word"),
      tok("eq", "Word"),
      tok("-1E+3", "Number"),
      EOT,
    ]);
  });

  it("$ in sub-attribute", () => {
    assert.deepEqual(
      tokenizer('manager.$ref eq "/v2/Users/a"'),
      [
        tok("manager.$ref", "Word"),
        tok("eq", "Word"),
        tok('"/v2/Users/a"', "Quoted"),
        EOT,
      ],
    );
  });

  it("co after dot not operator", () => {
    assert.deepEqual(
      tokenizer('addresses[type eq "work"].country eq ""'),
      [
        tok("addresses", "Word"),
        tok("[", "Bracket"),
        tok("type", "Word"),
        tok("eq", "Word"),
        tok('"work"', "Quoted"),
        tok("].", "Bracket"),
        tok("country", "Word"),
        tok("eq", "Word"),
        tok('""', "Quoted"),
        EOT,
      ],
    );
  });

  it("sub-attribute after ValPath", () => {
    assert.deepEqual(
      tokenizer('emails[type eq "work"].value eq "user@example.com"'),
      [
        tok("emails", "Word"),
        tok("[", "Bracket"),
        tok("type", "Word"),
        tok("eq", "Word"),
        tok('"work"', "Quoted"),
        tok("].", "Bracket"),
        tok("value", "Word"),
        tok("eq", "Word"),
        tok('"user@example.com"', "Quoted"),
        EOT,
      ],
    );
  });

  it("support of quoted values", () => {
    assert.deepEqual(tokenizer('displayName eq "Alice \\"and\\" Bob"'), [
      tok("displayName", "Word"),
      tok("eq", "Word"),
      tok('"Alice \\"and\\" Bob"', "Quoted"),
      EOT,
    ]);
  });

  it("unterminated quoted string throws an error", () => {
    assert.throws(() => tokenizer('userName eq "abc'), /unexpected token/);
  });

  it("large escaped string tokenizes without an issue", () => {
    const payload = Array.from({ length: 5000 }, (_, i) => (i % 2 === 0 ? '\\"' : 'x')).join("");
    const q = `displayName eq "${payload}"`;
    const toks = tokenizer(q);
    assert.deepEqual(toks.slice(0, 2), [tok("displayName", "Word"), tok("eq", "Word")]);
    assert.strictEqual(toks[2].type, "Quoted");
    assert.deepEqual(toks[toks.length - 1], EOT);
  });
});
