import assert from "node:assert/strict";
import { test } from "node:test";
import { initialVisit, nextVisit } from "./home-visit";

test("first home visit welcomes once; ordinary catalog navigation does not replay it", () => {
  const first = initialVisit("/");
  assert.equal(first.arrival?.kind, "arrival");
  assert.equal(nextVisit(first, "/"), first);
  assert.equal(
    nextVisit(nextVisit(first, "/projects"), "/").arrival,
    undefined,
  );
  assert.equal(nextVisit(initialVisit("/notes"), "/").arrival?.kind, "arrival");
});

test("reading an article welcomes on return even through a catalog, then consumes that visit", () => {
  const article = nextVisit(initialVisit("/"), "/notes/pixiu-grpc-streaming");
  const home = nextVisit(nextVisit(article, "/notes"), "/");
  assert.equal(home.arrival?.kind, "return");
  assert.equal(home.readArticle, false);
  assert.equal(nextVisit(nextVisit(home, "/about"), "/").arrival, undefined);
});
