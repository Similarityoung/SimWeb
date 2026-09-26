/* Completion movement and spring-driven turns used by the retained poses. */
(function (g) {
  const { spring, K2, sign } = g.GROK_MATH;

  function startTrick(reduce) {
    return reduce ? null : { t0: performance.now(), dir: sign() };
  }

  function evalTrick(trick, now) {
    const frame = { turn: null, hop: 0, done: !trick, wantBurst: false };
    if (!trick) return frame;
    const elapsed = (now - trick.t0) / 1000;
    if (elapsed < 0.7) frame.turn = Math.PI * 2 * trick.dir * K2(elapsed / 0.7);
    else if (elapsed < 1.2) {
      frame.turn = Math.PI * 2 * trick.dir;
      const progress = (elapsed - 0.7) / 0.5;
      frame.hop = -4 * 36 * progress * (1 - progress);
    } else {
      frame.wantBurst = true;
      frame.done = true;
    }
    return frame;
  }

  function makeSpinTurn(turns = 1, dir = sign()) {
    const s = spring(0);
    s.t = turns * Math.PI * 2 * dir;
    return s;
  }

  function spinTurnSettled(s) {
    return Math.abs(s.t - s.x) < 0.004 && Math.abs(s.v) < 0.015;
  }

  g.GROK_TRICKS = { startTrick, evalTrick, makeSpinTurn, spinTurnSettled };
})(window);
