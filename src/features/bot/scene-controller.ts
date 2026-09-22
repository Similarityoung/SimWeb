import {
  scenes,
  selectBehavior,
  type BotMood,
  type BotScene,
  type CharacterState,
} from "./behavior";

export type Arrival = { id: number; kind: "arrival" | "return" };
type Move = {
  scene: BotScene;
  state: CharacterState;
  id: number;
  duration: number | null;
};
export type SceneModel = {
  mood: BotMood;
  activityKey?: string;
  move: Move | null;
  completedKey?: string;
  failedKey?: string;
  hidden: boolean;
  sequence: number;
  arrivalId?: number;
  cooldowns: Partial<Record<BotScene, number>>;
};
export type SceneEvent =
  | {
      type: "base";
      mood: BotMood;
      activityKey?: string;
      completed?: boolean;
      failed?: boolean;
    }
  | { type: "cue"; scene: BotScene; now: number; random: number }
  | { type: "arrive"; arrival: Arrival; now: number; random: number }
  | { type: "expire"; id: number }
  | { type: "end"; scene: BotScene }
  | { type: "visibility"; hidden: boolean };

export const isAnswerMood = (mood: BotMood) =>
  mood === "responding" || mood === "unmatched";
export function createSceneModel(
  mood: BotMood,
  activityKey?: string,
): SceneModel {
  return {
    mood,
    activityKey,
    move: null,
    hidden: false,
    sequence: 0,
    cooldowns: {},
  };
}
function play(
  model: SceneModel,
  scene: BotScene,
  now: number,
  random: number,
): SceneModel {
  const definition = scenes[scene];
  if (model.hidden || isAnswerMood(model.mood)) return model;
  if (scene === "wake" && model.move?.scene !== "sleep") return model;
  if (model.move?.scene === "sleep" && scene !== "wake" && scene !== "error")
    return model;
  if (scene === "idle-expression" && (model.mood !== "idle" || model.move))
    return model;
  if (
    model.mood === "listening" &&
    definition.priority === 1 &&
    scene !== "sleep"
  )
    return model;
  if (model.move && scenes[model.move.scene].priority > definition.priority)
    return model;
  if (now < (model.cooldowns[scene] ?? -Infinity)) return model;
  return {
    ...model,
    sequence: model.sequence + 1,
    cooldowns: { ...model.cooldowns, [scene]: now + definition.cooldown },
    move: {
      scene,
      id: model.sequence + 1,
      duration: definition.duration,
      state:
        definition.choices[
          Math.min(
            definition.choices.length - 1,
            Math.floor(random * definition.choices.length),
          )
        ],
    },
  };
}
export function sceneReducer(model: SceneModel, event: SceneEvent): SceneModel {
  switch (event.type) {
    case "base": {
      const changed =
        model.mood !== event.mood || model.activityKey !== event.activityKey;
      const next = changed
        ? {
            ...model,
            mood: event.mood,
            activityKey: event.activityKey,
            move: null,
          }
        : model;
      // A failed answer is a one-time reaction, not a persistent base mood.
      if (
        event.failed &&
        event.activityKey &&
        model.failedKey !== event.activityKey
      )
        return play({ ...next, failedKey: event.activityKey }, "error", 0, 0);
      // Only the home presentation can declare completion. Clearing also ends
      // writing, so a mood transition alone must never trigger celebration.
      if (
        event.completed &&
        event.activityKey &&
        model.completedKey !== event.activityKey
      )
        return play(
          { ...next, completedKey: event.activityKey },
          "complete",
          0,
          0,
        );
      return next;
    }
    case "cue":
      return play(model, event.scene, event.now, event.random);
    case "arrive":
      if (model.arrivalId === event.arrival.id) return model;
      return play(
        { ...model, arrivalId: event.arrival.id },
        event.arrival.kind,
        event.now,
        event.random,
      );
    case "expire":
      return model.move?.id === event.id ? { ...model, move: null } : model;
    case "end":
      return model.move?.scene === event.scene
        ? { ...model, move: null }
        : model;
    case "visibility":
      return { ...model, hidden: event.hidden, move: null };
  }
}
export function currentMove(model: SceneModel): {
  scene: string;
  state: CharacterState;
} {
  if (isAnswerMood(model.mood))
    return { scene: model.mood, state: selectBehavior(model.mood) };
  if (model.move) return model.move;
  return { scene: model.mood, state: selectBehavior(model.mood) };
}
