export const behaviors = {
  idle: ["idle"],
  listening: ["listening"],
  responding: ["writing"],
  unmatched: ["confused"],
} as const;
export type BotMood = keyof typeof behaviors;

export const IDLE_PAUSE_MS = [20_000, 30_000] as const;
export const SLEEP_AFTER_MS = 60_000;
// The source engine's spawning gather cycle lasts 2 seconds (FX.CYCLE_ON).
const GATHER_MS = 2_000;

// A scene owns its candidates, lifetime and cooldown. There is no action queue.
export const scenes = {
  "idle-expression": {
    choices: ["happy", "curious", "shy", "proud", "playful"],
    duration: 2_500,
    cooldown: 0,
    priority: 0,
  },
  sleep: {
    choices: ["powering-down"],
    duration: null,
    cooldown: 0,
    priority: 1,
  },
  wake: {
    choices: ["spawning"],
    duration: GATHER_MS,
    cooldown: 0,
    priority: 2,
  },
  arrival: {
    choices: ["spawning"],
    duration: GATHER_MS,
    cooldown: 0,
    priority: 1,
  },
  return: {
    choices: ["happy", "notifying"],
    duration: 1_200,
    cooldown: 0,
    priority: 1,
  },
  theme: {
    choices: ["surprised"],
    duration: 900,
    cooldown: 3_000,
    priority: 2,
  },
  tap: { choices: ["bouncing"], duration: 1_000, cooldown: 1_500, priority: 3 },
  complete: {
    choices: ["celebrate"],
    duration: 2_400,
    cooldown: 0,
    priority: 2,
  },
  error: { choices: ["alerting"], duration: 1_400, cooldown: 0, priority: 5 },
} as const;
export type BotScene = keyof typeof scenes;

export const previewActions = [
  ["idle", "平静"],
  ["happy", "开心"],
  ["curious", "好奇"],
  ["shy", "害羞"],
  ["proud", "得意"],
  ["playful", "俏皮"],
  ["sleeping", "睡着"],
  ["waking", "醒来"],
  ["spawning", "苏醒"],
  ["celebrate", "完成 · 转身跳跃粒子"],
  ["orbit", "环绕"],
  ["radar", "雷达"],
  ["humming", "嗡鸣"],
  ["loading", "加载"],
  ["dictating", "口述"],
  ["writing", "书写"],
  ["sending", "发送"],
  ["receiving", "接收"],
  ["uploading", "上传"],
  ["notifying", "通知"],
  ["alerting", "警报"],
  ["dragging", "拖拽"],
  ["bouncing", "弹跳"],
  ["powering-down", "休眠"],
] as const;
export type CharacterState =
  | (typeof behaviors)[BotMood][number]
  | (typeof scenes)[BotScene]["choices"][number]
  | (typeof previewActions)[number][0];

export function selectBehavior(mood: BotMood) {
  return behaviors[mood][0];
}
