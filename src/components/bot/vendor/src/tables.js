/* L4 — playlists, blink, login wrap, springs. Symbols: g1e VBe w_t cSe rnt int ant ont snt. */
(function (g) {
  // Site curation: the three rejected reference images identify presets 7 and 8.
  // Keep every state used by the site or development preview; calm idle holds neutral eyes.
  const EXCLUDED_EYES = new Set([7, 8]);
  const EYE_PLAYLIST = Object.fromEntries(Object.entries({
    sleeping: [13, 22, 4], waking: [13], idle: [0], listening: [10],
    surprised: [3, 21],
    happy: [2, 11, 17, 19], curious: [3, 21, 0, 15], confused: [14, 5, 8],
    proud: [15, 8, 2], shy: [0, 24, 13], playful: [2, 17, 11, 8],
    // A short completion gesture holds its expression until it returns to rest.
    celebrate: [2], orbit: [0, 8], radar: [0, 8],
    spawning: [3, 0], humming: [0, 8], loading: [0, 8], dictating: [10, 1, 19],
    sending: [0, 8], receiving: [19, 0, 8], uploading: [15, 9, 8], writing: [15, 9],
    notifying: [3, 21, 0], alerting: [3, 21], bouncing: [2, 17],
    dragging: [3, 15, 0], "powering-down": [13, 22],
  }).map(([state, eyes]) => [state, eyes.filter((eye) => !EXCLUDED_EYES.has(eye))]));

  const EYE_HOLD_MS = {
    sleeping: [6000, 10000], waking: [800, 800], idle: [5000, 9000],
    listening: [2800, 5000], surprised: [2500, 4000],
    happy: [2500, 4500], curious: [1800, 3200], confused: [2200, 3800],
    proud: [3500, 6000], shy: [3000, 5500],
    playful: [1500, 3000], celebrate: [1400, 2600], orbit: [4000, 8000],
    radar: [4000, 8000], spawning: [1200, 1200],
    humming: [5000, 9000], loading: [6000, 10000], dictating: [4000, 8000],
    sending: [4000, 8000], receiving: [4000, 8000], uploading: [4000, 8000],
    writing: [4000, 8000], notifying: [1500, 2600], alerting: [2000, 3600],
    bouncing: [3000, 6000], dragging: [1600, 3000], "powering-down": [6000, 9000],
  };

  const BLINK_MS = {
    sleeping: null, waking: null, idle: [6000, 14000], listening: [3000, 7000],
    surprised: [1800, 3500], happy: [2500, 5000], curious: [2500, 5500],
    confused: [2800, 5500], proud: [3500, 7000], shy: [3000, 6000],
    playful: [2000, 4500], celebrate: [2200, 4500],
    orbit: null, radar: null, spawning: null, humming: [4000, 8000],
    loading: null, dictating: null, sending: null, receiving: null, uploading: null,
    writing: null, notifying: [2000, 4000], alerting: null, bouncing: null,
    dragging: [2200, 4500], "powering-down": null,
  };

  const SPRINGS = {
    spin: [5, 0.9],
    x: [3.5, 1],
    y: [4, 1],
    squash: [10, 0.8],
    blink: [26, 1],
    eyeScale: [9, 0.85],
    gazeX: [13, 1],
    gazeY: [13, 1],
    notify: [9, 0.55],
    humDots: [6, 1],
    overlay: [14, 1],
    overlayMix: [11, 1],
    overlayTurn: [14, 1],
    spinTurn: [6.2, 1],
  };

  const FACE_TUNE = { size: 0.86, gap: 1.18, height: 1, eyeWidth: 0.96, eyeHeight: 0.92 };
  const POSE = { turn: 17, tilt: -14, roll: 29, scale: 1 };
  const POSE_HOME = { turn: 33, tilt: -19, roll: 38 };
  const WINK_STATES = new Set(["idle", "happy", "curious", "playful"]);
  const POSE_SCALE = 0.92 * (259 / 229);
  const VIEW = { minX: -15, minY: -15, width: 259, height: 259 };
  const VIEW_HALF = VIEW.width / 2;
  const VIEW_MID = VIEW.minX + VIEW_HALF;
  const OVERLAY_ZOOM = {
    orbit: 1.14, radar: 1.14, gather: 1.15,
    wave: 1.42, send: 1.12, receive: 1.12, dock: 1.3, ball: 1.22,
    whirl: 1.45, pencil: 1.18, bang: 1.28, standby: 1.75,
  };
  const overlayViewZoom = (kind, scale) => (kind == null ? 1 : Math.max(OVERLAY_ZOOM[kind] / Math.max(scale, 1), 1));

  const EYE_BG = "var(--sand-bg-base, var(--disk, #f3efe6))";

  g.GROK_TABLES = {
    EYE_PLAYLIST, EYE_HOLD_MS, BLINK_MS,
    SPRINGS, FACE_TUNE, POSE, POSE_HOME,
    WINK_STATES, POSE_SCALE,
    VIEW_HALF, VIEW_MID, overlayViewZoom,
    EYE_BG,
  };
})(window);
