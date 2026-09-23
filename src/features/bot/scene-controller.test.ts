import assert from "node:assert/strict";
import { test } from "node:test";
import { scenes, type BotScene } from "./behavior";
import {
  createSceneModel,
  currentMove,
  sceneReducer,
  type SceneModel,
} from "./scene-controller";
const cue = (model: SceneModel, scene: BotScene, now = 0, random = 0) =>
  sceneReducer(model, { type: "cue", scene, now, random });

test("idle expressions hold one complete mood, then settle; real scenes take over", () => {
  for (const [random, state] of [
    [0, "happy"],
    [0.25, "curious"],
    [0.45, "shy"],
    [0.65, "proud"],
    [0.99, "playful"],
  ] as const) {
    const active = cue(createSceneModel("idle"), "idle-expression", 0, random);
    assert.equal(currentMove(active).state, state);
    assert.equal(active.move!.duration, 2_500);
    assert.equal(cue(active, "idle-expression", 1_000, 1 - random), active);
    const done = sceneReducer(active, { type: "expire", id: active.move!.id });
    assert.equal(currentMove(done).state, "idle");
    for (const scene of Object.keys(scenes) as BotScene[]) {
      if (["idle-expression", "wake"].includes(scene)) continue;
      assert.equal(cue(active, scene).move!.scene, scene);
    }
    for (const mood of ["listening", "responding"] as const) {
      const next = sceneReducer(active, { type: "base", mood });
      assert.equal(next.move, null);
      assert.equal(currentMove(next).scene, mood);
    }
  }
});

test("stale idle cues cannot interrupt other moods, scenes or a hidden page", () => {
  for (const mood of ["listening", "responding", "unmatched"] as const) {
    const model = createSceneModel(mood);
    assert.equal(cue(model, "idle-expression"), model);
  }
  for (const scene of Object.keys(scenes) as BotScene[]) {
    if (scene === "wake") continue;
    const model = cue(createSceneModel("idle"), scene);
    assert.equal(cue(model, "idle-expression"), model);
  }
  const active = cue(createSceneModel("idle"), "idle-expression");
  const hidden = sceneReducer(active, { type: "visibility", hidden: true });
  assert.equal(cue(hidden, "idle-expression"), hidden);
  const visible = sceneReducer(hidden, { type: "visibility", hidden: false });
  assert.equal(currentMove(visible).state, "idle");
});

test("interaction scenes keep at most two candidates, picked once per accepted event", () => {
  for (const [scene, definition] of Object.entries(scenes))
    if (scene !== "idle-expression") assert.ok(definition.choices.length <= 2);
  const first = cue(createSceneModel("idle"), "return");
  assert.equal(currentMove(first).state, "happy");
  assert.equal(currentMove(cue(first, "return", 100, 0.99)).state, "notifying");
  const tap = cue(first, "tap");
  assert.equal(cue(tap, "tap", 100), tap);
  assert.notEqual(cue(tap, "tap", 1_500), tap);
});

test("an answer cancels lower-priority feedback, discards new cues and never queues them", () => {
  let model = cue(createSceneModel("idle"), "idle-expression");
  model = sceneReducer(model, {
    type: "base",
    mood: "responding",
    activityKey: "one",
  });
  for (const scene of Object.keys(scenes) as BotScene[])
    assert.equal(cue(model, scene), model);
  assert.equal(currentMove(model).state, "writing");
  model = sceneReducer(model, {
    type: "base",
    mood: "idle",
    activityKey: "one",
  });
  assert.equal(currentMove(model).state, "idle");
  assert.equal(model.move, null);
});

test("expired and cancelled callbacks cannot replace a newer move", () => {
  const first = cue(createSceneModel("idle"), "return");
  const next = cue(first, "tap");
  assert.equal(
    sceneReducer(next, { type: "expire", id: first.move!.id }),
    next,
  );
  assert.equal(sceneReducer(next, { type: "end", scene: "return" }), next);
  assert.equal(cue(next, "return"), next);
  const done = sceneReducer(next, { type: "expire", id: next.move!.id });
  assert.equal(currentMove(done).state, "idle");
});

test("completion celebrates once per answer, including with a focused composer", () => {
  const event = {
    type: "base",
    mood: "listening",
    activityKey: "one",
    completed: true,
  } as const;
  const completed = sceneReducer(createSceneModel("responding", "one"), event);
  assert.equal(currentMove(completed).state, "celebrate");
  assert.equal(sceneReducer(completed, event), completed);
  const done = sceneReducer(completed, {
    type: "expire",
    id: completed.move!.id,
  });
  assert.equal(currentMove(done).state, "listening");
  assert.equal(sceneReducer(done, event), done);
  assert.equal(
    currentMove(sceneReducer(done, { ...event, mood: "idle" })).state,
    "idle",
  );
});

test("clear and follow-up cancel celebration without replaying a past completion", () => {
  const event = {
    type: "base",
    mood: "idle",
    activityKey: "one",
    completed: true,
  } as const;
  const completed = sceneReducer(createSceneModel("responding", "one"), event);
  const cleared = sceneReducer(completed, { type: "base", mood: "idle" });
  assert.equal(currentMove(cleared).state, "idle");
  const followUp = sceneReducer(completed, {
    type: "base",
    mood: "responding",
    activityKey: "two",
  });
  assert.equal(currentMove(followUp).state, "writing");
  assert.equal(
    sceneReducer(followUp, { type: "expire", id: completed.move!.id }),
    followUp,
  );
  assert.equal(
    currentMove(sceneReducer(followUp, { ...event, activityKey: "two" })).state,
    "celebrate",
  );
  assert.equal(currentMove(cue(completed, "tap")).state, "bouncing");
});

test("completion while hidden is consumed without replay on visibility or focus changes", () => {
  const hidden = sceneReducer(createSceneModel("responding", "one"), {
    type: "visibility",
    hidden: true,
  });
  const event = {
    type: "base",
    mood: "idle",
    activityKey: "one",
    completed: true,
  } as const;
  const done = sceneReducer(hidden, event);
  assert.equal(currentMove(done).state, "idle");
  const visible = sceneReducer(done, { type: "visibility", hidden: false });
  assert.equal(sceneReducer(visible, event), visible);
  assert.equal(
    currentMove(sceneReducer(visible, { ...event, mood: "listening" })).state,
    "listening",
  );
});

test("hidden pages discard transient moves and do not replay them on return", () => {
  const active = cue(createSceneModel("idle"), "tap");
  const hidden = sceneReducer(active, { type: "visibility", hidden: true });
  assert.equal(cue(hidden, "theme"), hidden);
  assert.equal(
    currentMove(sceneReducer(hidden, { type: "visibility", hidden: false }))
      .state,
    "idle",
  );
});

test("arrival is consumed once, including when an answer preempts it", () => {
  const event = {
    type: "arrive",
    arrival: { id: 1, kind: "arrival" },
    now: 0,
    random: 0,
  } as const;
  const first = sceneReducer(createSceneModel("idle"), event);
  assert.equal(currentMove(first).state, "powering-up");
  const done = sceneReducer(first, { type: "expire", id: first.move!.id });
  assert.equal(sceneReducer(done, event), done);
  const busy = sceneReducer(createSceneModel("responding", "one"), event);
  const idle = sceneReducer(busy, {
    type: "base",
    mood: "idle",
    activityKey: "one",
  });
  assert.equal(sceneReducer(idle, event), idle);
});

test("unmatched content uses confused; one-time failures restore idle or listening", () => {
  assert.equal(currentMove(createSceneModel("unmatched")).state, "confused");
  for (const mood of ["idle", "listening"] as const) {
    const event = {
      type: "base",
      mood,
      activityKey: "one",
      failed: true,
    } as const;
    const error = sceneReducer(createSceneModel("responding", "one"), event);
    assert.equal(currentMove(error).state, "alerting");
    assert.equal(sceneReducer(error, event), error);
    const done = sceneReducer(error, {
      type: "expire",
      id: error.move!.id,
    });
    assert.equal(currentMove(done).state, mood);
    assert.equal(sceneReducer(done, event), done);
    const focused = sceneReducer(done, { ...event, mood: "listening" });
    assert.equal(currentMove(focused).state, "listening");
    const blurred = sceneReducer(focused, { ...event, mood: "idle" });
    assert.equal(currentMove(blurred).state, "idle");
    assert.equal(
      cue(blurred, "idle-expression").move!.scene,
      "idle-expression",
    );
  }
});

test("failed-answer feedback yields to new questions and never replays after hiding or clearing", () => {
  const event = {
    type: "base",
    mood: "idle",
    activityKey: "one",
    failed: true,
  } as const;
  const error = sceneReducer(createSceneModel("responding", "one"), event);
  assert.equal(currentMove(error).state, "alerting");
  const focused = sceneReducer(error, { ...event, mood: "listening" });
  assert.equal(currentMove(focused).state, "listening");
  const followUp = sceneReducer(error, {
    type: "base",
    mood: "responding",
    activityKey: "two",
  });
  assert.equal(currentMove(followUp).state, "writing");
  assert.equal(
    sceneReducer(followUp, { type: "expire", id: error.move!.id }),
    followUp,
  );
  assert.equal(
    currentMove(sceneReducer(followUp, { ...event, activityKey: "two" })).state,
    "alerting",
  );
  const cleared = sceneReducer(error, { type: "base", mood: "idle" });
  assert.equal(currentMove(cleared).state, "idle");
  const hidden = sceneReducer(error, { type: "visibility", hidden: true });
  const visible = sceneReducer(hidden, { type: "visibility", hidden: false });
  assert.equal(currentMove(sceneReducer(visible, event)).state, "idle");
  const failedWhileHidden = sceneReducer(
    sceneReducer(createSceneModel("responding", "one"), {
      type: "visibility",
      hidden: true,
    }),
    event,
  );
  assert.equal(currentMove(failedWhileHidden).state, "idle");
  assert.equal(
    currentMove(
      sceneReducer(failedWhileHidden, { type: "visibility", hidden: false }),
    ).state,
    "idle",
  );
});
