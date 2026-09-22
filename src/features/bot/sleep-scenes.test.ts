import assert from "node:assert/strict";
import { test } from "node:test";
import { scenes, type BotScene } from "./behavior";
import {
  createSceneModel,
  currentMove,
  sceneReducer,
  type SceneModel,
} from "./scene-controller";

const cue = (model: SceneModel, scene: BotScene) =>
  sceneReducer(model, { type: "cue", scene, now: 60_000, random: 0 });

test("sleep replaces idle expression and remains until activity; background cues cannot wake it", () => {
  const sleeping = cue(
    cue(createSceneModel("idle"), "idle-expression"),
    "sleep",
  );
  assert.equal(currentMove(sleeping).state, "sleeping");
  assert.equal(sleeping.move!.duration, null);
  for (const scene of ["sleep", "idle-expression", "theme"] as const)
    assert.equal(cue(sleeping, scene), sleeping);
  assert.equal(
    currentMove(cue(createSceneModel("listening"), "sleep")).state,
    "sleeping",
  );
});

test("only a sleeping character wakes, and repeated activity cannot restart waking", () => {
  const idle = createSceneModel("idle");
  assert.equal(cue(idle, "wake"), idle);
  const sleeping = cue(idle, "sleep");
  const waking = cue(sleeping, "wake");
  assert.equal(currentMove(waking).state, "waking");
  assert.equal(waking.move!.duration, scenes.wake.duration);
  assert.equal(cue(waking, "wake"), waking);
  assert.equal(cue(waking, "idle-expression"), waking);
  assert.equal(
    sceneReducer(waking, { type: "expire", id: sleeping.move!.id }),
    waking,
  );
  assert.equal(
    currentMove(sceneReducer(waking, { type: "expire", id: waking.move!.id }))
      .state,
    "idle",
  );
});

test("sleep cannot interrupt answers or direct feedback, and answers cancel sleep and wake", () => {
  for (const mood of ["responding", "unmatched"] as const) {
    const model = createSceneModel(mood);
    assert.equal(cue(model, "sleep"), model);
  }
  for (const scene of ["tap", "complete", "error"] as const) {
    const model = cue(createSceneModel("idle"), scene);
    assert.equal(cue(model, "sleep"), model);
  }
  const sleeping = cue(createSceneModel("idle"), "sleep");
  for (const model of [sleeping, cue(sleeping, "wake")]) {
    const answering = sceneReducer(model, {
      type: "base",
      mood: "responding",
      activityKey: "new",
    });
    assert.equal(currentMove(answering).state, "writing");
    assert.equal(answering.move, null);
    assert.equal(
      currentMove(
        sceneReducer(answering, {
          type: "base",
          mood: "idle",
          activityKey: "new",
        }),
      ).state,
      "idle",
    );
  }
});

test("hidden pages cancel sleep and waking without replaying them on return", () => {
  const sleeping = cue(createSceneModel("idle"), "sleep");
  for (const model of [sleeping, cue(sleeping, "wake")]) {
    const hidden = sceneReducer(model, { type: "visibility", hidden: true });
    assert.equal(cue(hidden, "sleep"), hidden);
    assert.equal(cue(hidden, "wake"), hidden);
    assert.equal(
      currentMove(sceneReducer(hidden, { type: "visibility", hidden: false }))
        .state,
      "idle",
    );
  }
});
