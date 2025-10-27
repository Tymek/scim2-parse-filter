import { assert } from "chai";
import { filter, parse } from "../src";

describe("filter", () => {
    it("end to end or condition", () => {
        const f = filter(parse(`userName eq "test1@example.com" or userName eq "test2@example.com"`));
        const users = [
            { userName: "test1@example.com" },
            { userName: "test2@example.com" }
        ];
        const ret = users.filter(f);
        assert.deepEqual(ret, users);
    });
    it("end to end and condition", () => {
        const f = filter(parse(`userName eq "test1@example.com" and id eq "id_1"`));
        const users = [
            { userName: "test1@example.com", id: "id_1" },
            { userName: "test2@example.com", id: "id_2" }
        ];
        const ret = users.filter(f);
        assert.deepEqual(ret, [users[0]]);
    });
    it("end to end shielding backslash in quotes", () => {
        const f = filter(parse(`userName eq "domain\\user.name"`));
        const users = [
            { userName: "domain\\user.name" }
        ];
        const ret = users.filter(f);
        assert.deepEqual(ret, users);
    });

    it("supports negative numbers before AND", () => {
        const f = filter(parse(`userId eq -1 and type eq "my"`));
        const users = [
            { type: "my", userId: 503528803 },
        ];
        const ret = users.filter(f);
        assert.deepEqual(ret, [], "no user should match when userId is -1");
    });
    it("evaluates negative number equality (no match)", () => {
        const f = filter(parse(`n eq -1`));
        const items = [{ n: 0 }, { n: 1 }, { n: -2 }];
        assert.deepEqual(items.filter(f), []);
    });

    it("evaluates negative number equality (match)", () => {
        const f = filter(parse(`n eq -2`));
        const items = [{ n: 0 }, { n: -2 }, { n: 3 }];
        assert.deepEqual(items.filter(f), [{ n: -2 }]);
    });

    it("evaluates decimals and exponents", () => {
        const f1 = filter(parse(`n eq -1.5`));
        const f2 = filter(parse(`n eq -1e3`));
        const items = [{ n: -1.5 }, { n: -1000 }, { n: -1001 }];
        assert.deepEqual(items.filter(f1), [{ n: -1.5 }]);
        assert.deepEqual(items.filter(f2), [{ n: -1000 }]);
    });
});
