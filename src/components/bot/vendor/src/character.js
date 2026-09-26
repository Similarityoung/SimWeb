/* L2 — GrokCharacter. Orchestrates pose, eyes, tricks, overlays. Source $_t + sd(). */
(function (g) {
  const M = g.GROK_MATH;
  const T = g.GROK_TABLES;
  const { applyPose, nextGaze } = g.GROK_POSE;
  const TR = g.GROK_TRICKS;
  const EY = g.GROK_EYES;
  const FX = g.GROK_FX;
  const {
    spring, stepSpring, springSteps, clamp, rand, sign, K2, Dke, lerpPoly, relRot,
  } = M;
  const {
    EYE_PLAYLIST, EYE_HOLD_MS, BLINK_MS,
    SPRINGS, FACE_TUNE, POSE, POSE_HOME,
    WINK_STATES, POSE_SCALE, overlayViewZoom,
    VIEW_HALF, VIEW_MID, EYE_BG,
  } = T;

  const eyeRotation = relRot(POSE, POSE_HOME);

  class GrokCharacter {
    constructor(svg, opts = {}) {
      this.svg = svg;
      this.state = opts.state || "idle";
      this.onChange = opts.onChange || (() => {});
      this.paused = !!opts.paused;
      this.reduceMotion = opts.reduceMotion ?? (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);

      this.spin = spring(0);
      this.tx = spring(0);
      this.ty = spring(0);
      this.squash = spring(1);
      this.blink = spring(1);
      this.eyeScale = spring(1);
      this.gazeX = spring(0);
      this.gazeY = spring(0);
      this.eyeMorph = spring(1);
      this.notify = spring(0);
      this.humDots = spring(0);

      this.eyeFrom = EYE_PLAYLIST[this.state][0];
      this.eyeTo = this.eyeFrom;
      this.eyeStiffness = 7;
      this.eyeIdx = 0;
      this._fromPolys = null;

      this.t0 = performance.now();
      this.stateAt = this.t0;
      this.last = this.t0;
      this.eyeUntil = this.t0 + rand(...EYE_HOLD_MS.idle);
      this.blinkUntil = this.t0 + rand(1500, 7000);
      this.gazeUntil = this.t0 + 800;
      this.blinkQueue = [];
      this.winkAt = -1e9;
      this.winkEye = 0;
      this.winkUntil = this.t0 + rand(3000, 8000);
      this.spinTurn = null;
      this.trick = null;
      this.ovSpin = 0;
      this.ctx = this._freshCtx(this.t0);
      this.pxW = 190;
      this.pxAt = 0;
      this.partScale = 1;
      this.celebrateAt = -1;
      this.extras = TR.evalTrick(null, this.t0);

      this._build();
      this.svg.style.setProperty("--fg", opts.inkFlat || "#000000");
      this.svg.style.setProperty("--bg", opts.eyeColor || EYE_BG);
      this.svg.style.transform = `scale(${POSE_SCALE})`;
      this.svg.style.transformOrigin = "50% 50%";
      this.setState(this.state);
      this._paint(this.t0);
      this._raf = requestAnimationFrame((t) => this._tick(t));
    }

    destroy() {
      cancelAnimationFrame(this._raf);
      this.particles?.clear();
    }

    _freshCtx(now) {
      return {
        nodUntil: now + 1800,
        nodEnd: 0,
        impulseAt: now + rand(500, 1200),
        tyKick: 0,
        spinKick: 0,
        forceSleepEye: false,
        wakeEye: null,
        wakeBlink: false,
        wakingBlinked: false,
        stAt: now + rand(6000, 10000),
        wantPn: null,
        wantBlink: false,
        dragCycle: -1,
        notifyPop: false,
        wantBurst: null,
        wakingBurst: false,
      };
    }

    setPaused(v) {
      this.paused = !!v;
    }

    setState(name) {
      if (!EYE_PLAYLIST[name]) return;
      if (this.state !== name) this.particles?.clear();
      this.state = name;
      this.stateAt = performance.now();
      this.fx.setState(name, this.stateAt, this.reduceMotion);
      const list = EYE_PLAYLIST[name];
      this.eyeIdx = 0;
      // Retarget from the currently rendered contour, including when another
      // state interrupts a morph. Sleep/wake coordinate their eyes with lids
      // in applyPose, so those sequences retain control of the transition.
      if (name !== "sleeping" && name !== "waking") {
        this._morphEyes(list[0], 8);
      }
      this.eyeUntil = this.stateAt + rand(...EYE_HOLD_MS[name]);
      const blink = BLINK_MS[name];
      this.blinkUntil = blink ? this.stateAt + rand(1500, 7000) : Infinity;
      this.gazeUntil = this.stateAt + rand(500, 1400);
      this.winkUntil = this.stateAt + rand(3000, 8000);
      this.ctx = this._freshCtx(this.stateAt);
      this.celebrateAt = name === "celebrate" ? this.stateAt + 140 : -1;
      this.trick = null;
      // Hand the rendered jump/turn to the existing springs before cancelling
      // its timeline. A new scene must start where the character actually is.
      this.ty.x += this.extras.hop;
      const turn = this.extras.turn;
      this.spinTurn = turn == null ? null : spring(turn);
      if (this.spinTurn) {
        this.spinTurn.t = Math.round(turn / (Math.PI * 2)) * Math.PI * 2;
        this.spinTurn.settling = true;
      }
      this.extras = { ...TR.evalTrick(null, this.stateAt), turn };
      if (name !== "waking" && name !== "sleeping") {
        EY.queueBlink(this.blinkQueue, this.stateAt);
      }
      try {
        this.onChange({ state: name });
      } catch (_) { /* host UI may not be ready */ }
    }

    _build() {
      const geo = g.GROK_GEO;
      const vb = geo.viewBox;
      this.svg.setAttribute("viewBox", `${vb.minX} ${vb.minY} ${vb.width} ${vb.height}`);
      this.svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      this.svg.style.overflow = "visible";
      this.svg.innerHTML = "";
      const defs = FX.el("defs");
      const clipId = `grok-clip-${Math.random().toString(36).slice(2, 8)}`;
      const clip = FX.el("clipPath", { id: clipId });
      this.clipPath = FX.el("path");
      clip.appendChild(this.clipPath);
      defs.appendChild(clip);
      this.svg.appendChild(defs);

      this.group = FX.el("g");
      this.body = FX.el("path", { fill: "var(--fg, #000)" });
      const eyesG = FX.el("g", { "clip-path": `url(#${clipId})` });
      this.eyeEls = [0, 1].map(() => {
        const p = FX.el("path", { fill: "var(--bg, #f3efe6)" });
        eyesG.appendChild(p);
        return p;
      });
      this.badge = FX.el("circle", { style: "display:none" });
      this.group.appendChild(this.body);
      this.group.appendChild(eyesG);
      this.group.appendChild(this.badge);

      this.fx = new FX.OverlayLayer();
      const R = geo.Re;
      this.fx.attach(this.svg, this.group);
      this.particles = FX.createParticles({
        back: this.fx.back,
        front: this.fx.front,
        idPrefix: this.fx.uid,
        getReducedMotion: () => this.reduceMotion,
        getRadius: () => {
          let je = FX.beltRadius(geo.shapes.blob.path, R);
          if (this.state === "loading") je += (52 - je) * clamp(this.fx.amount, 0, 1);
          return je;
        },
      });
      this.body.setAttribute("d", geo.shapes.blob.path);
      this.clipPath.setAttribute("d", geo.shapes.blob.path);
    }

    _morphEyes(index, stiffness = 7) {
      if (index === this.eyeTo && this.eyeMorph.t === 1) return;
      const t = clamp(this.eyeMorph.x, 0, 1);
      this._fromPolys = this._currentPolys(t);
      this.eyeFrom = this.eyeTo;
      this.eyeTo = index;
      this.eyeMorph.x = 0;
      this.eyeMorph.v = 0;
      this.eyeMorph.t = 1;
      this.eyeStiffness = stiffness;
    }

    _currentPolys(t) {
      const eyes = g.GROK_GEO.eyes;
      const from = this._fromPolys || eyes[this.eyeFrom];
      const to = eyes[this.eyeTo];
      return [lerpPoly(from[0], to[0], t), lerpPoly(from[1], to[1], t)];
    }

    _pn(turns = 1, dir = sign()) {
      if (this.reduceMotion || this.paused || this.spinTurn) return;
      this.spinTurn = TR.makeSpinTurn(turns, dir);
    }

    _tick(now) {
      const dt = Math.min((now - this.last) / 1000, 0.1);
      this.last = now;

      if (this.paused) {
        this._raf = requestAnimationFrame((t) => this._tick(t));
        return;
      }

      const mt = (now - this.t0) / 1000;
      const dtState = (now - this.stateAt) / 1000;
      const pose = applyPose(this.state, mt, dtState, now, this.ctx, {
        eyeTo: this.eyeTo,
        eyeMorphX: this.eyeMorph.x,
        blinkX: this.blink.x,
      });
      this.spin.t = pose.spin;
      this.tx.t = pose.tx;
      this.ty.t = pose.ty;
      this.squash.t = pose.squash;
      this.eyeScale.t = pose.eyeBoost;
      if (this.ctx.tyKick) {
        this.ty.v += this.ctx.tyKick;
        this.ctx.tyKick = 0;
      }
      if (this.ctx.spinKick) {
        this.spin.v += this.ctx.spinKick;
        this.ctx.spinKick = 0;
      }
      if (this.ctx.forceSleepEye) {
        this.ctx.forceSleepEye = false;
        this._morphEyes(13, 11);
      }
      if (this.ctx.wakeEye) {
        this._morphEyes(this.ctx.wakeEye[0], this.ctx.wakeEye[1]);
        this.ctx.wakeEye = null;
      }
      if (this.ctx.wakeBlink && !this.ctx.wakingBlinked && this.blinkQueue.length === 0) {
        EY.queueBlink(this.blinkQueue, now);
        this.ctx.wakingBlinked = true;
      }
      this.ctx.wakeBlink = false;
      if (this.ctx.wantBlink) {
        EY.queueBlink(this.blinkQueue, now);
        this.ctx.wantBlink = false;
      }
      if (this.ctx.wantPn) {
        this._pn(...this.ctx.wantPn);
        this.ctx.wantPn = null;
      }
      if (this.ctx.wantBurst) {
        this.particles.burst(this.ctx.wantBurst[0], this.ctx.wantBurst[1]);
        this.ctx.wakingBurst = true;
        this.ctx.wantBurst = null;
      }

      this.fx.update(now, dt, this.reduceMotion);

      if (this.celebrateAt > 0 && now >= this.celebrateAt && !this.trick && !this.spinTurn
        && this.fx.unfolded) {
        this.trick = TR.startTrick(this.reduceMotion);
        this.celebrateAt = -1;
      }

      const tf = TR.evalTrick(this.trick, now);
      // Leave time for the landing particles to fade before the scene ends,
      // including the unfolding that precedes the turn.
      if (tf.wantBurst && !this.reduceMotion) this.particles.burst(14, 0.65, 0.15, 0.55);
      if (tf.done) this.trick = null;
      let turn = tf.turn;
      if (this.spinTurn) {
        turn = (turn ?? 0) + this.spinTurn.x;
        if (TR.spinTurnSettled(this.spinTurn)) this.spinTurn = null;
      }
      this.extras = { ...tf, turn };

      if (this.state !== "waking" && this.state !== "sleeping" && now >= this.eyeUntil) {
        const list = EYE_PLAYLIST[this.state];
        this.eyeIdx = (this.eyeIdx + 1 + Math.floor(rand(0, list.length - 1))) % list.length;
        this._morphEyes(list[this.eyeIdx], 6);
        this.eyeUntil = now + rand(...EYE_HOLD_MS[this.state]);
      }

      const blinkCadence = BLINK_MS[this.state];
      if (blinkCadence && now >= this.blinkUntil) {
        EY.queueBlink(this.blinkQueue, now);
        this.blinkUntil = now + rand(...blinkCadence);
      }
      const blinkKey = EY.consumeBlink(this.blinkQueue, now);
      this.blink.t = blinkKey ?? (this.blinkQueue.length ? this.blink.t : pose.lid);

      if (now >= this.gazeUntil) {
        const gz = nextGaze(this.state);
        this.gazeX.t = gz.x;
        this.gazeY.t = gz.y;
        this.gazeUntil = now + rand(...gz.hold);
      }

      if (WINK_STATES.has(this.state) && now >= this.winkUntil) {
        this.winkAt = now;
        this.winkEye = Math.random() < 0.5 ? 0 : 1;
        this.winkUntil = now + rand(4500, 10000);
      }

      const humming = this.state === "humming";
      const loading = this.state === "loading";
      if ((humming || loading) && !this.reduceMotion) {
        const Zt = dtState;
        const dn = loading ? 3 : 1.6;
        const on = Zt < 0.5 ? 7 * K2(Zt / 0.5) : Zt < 1.3 ? 7 + (dn - 7) * K2((Zt - 0.5) / 0.8) : dn + 0.3 * Math.sin(Zt * 0.5);
        this.ovSpin += on * dt;
      }

      if (this.reduceMotion) {
        this._morphEyes(EYE_PLAYLIST[this.state][0]);
        this.spin.t = 0; this.tx.t = 0; this.ty.t = 0;
        this.squash.t = 1; this.blink.t = 1; this.eyeScale.t = 1;
      }

      const nSteps = springSteps(dt);
      const step = dt / nSteps;
      for (let i = 0; i < nSteps; i++) {
        stepSpring(this.eyeMorph, this.eyeStiffness, 1, step);
        if (this.spinTurn) stepSpring(this.spinTurn, ...SPRINGS.spinTurn, step);
        stepSpring(this.spin, ...SPRINGS.spin, step);
        stepSpring(this.tx, ...SPRINGS.x, step);
        stepSpring(this.ty, ...SPRINGS.y, step);
        stepSpring(this.squash, ...SPRINGS.squash, step);
        stepSpring(this.blink, ...SPRINGS.blink, step);
        stepSpring(this.eyeScale, ...SPRINGS.eyeScale, step);
        stepSpring(this.notify, ...SPRINGS.notify, step);
        stepSpring(this.humDots, ...SPRINGS.humDots, step);
        stepSpring(this.gazeX, ...SPRINGS.gazeX, step);
        stepSpring(this.gazeY, ...SPRINGS.gazeY, step);
      }
      if (this.reduceMotion) {
        this.eyeMorph.x = 1;
        this.spinTurn = this.trick = null;
        this.extras = TR.evalTrick(null, now);
        this.winkAt = -1e9;
        for (const item of [this.spin, this.tx, this.ty, this.squash, this.blink, this.eyeScale]) {
          item.x = item.t;
          item.v = 0;
        }
        this.gazeX.x = this.gazeY.x = 0;
        this.notify.x = this.state === "notifying" ? 1 : 0;
        this.humDots.x = this.state === "humming" ? 1 : 0;
      }
      this.notify.t = this.state === "notifying" ? 1 : 0;
      this.humDots.t = this.state === "humming" ? 1 : 0;

      let spinAngle = 0;
      if (this.spinTurn) spinAngle = this.spinTurn.settling ? 0 : this.spinTurn.x;
      else if (this.extras.turn != null) spinAngle = this.extras.turn;
      else if (humming || loading) spinAngle = this.ovSpin;
      if (now - this.pxAt > 500 && this.svg.getBoundingClientRect) {
        const w = this.svg.getBoundingClientRect().width;
        if (w > 0) {
          this.pxW = w;
          this.partScale = clamp(Math.pow(340 / w, 0.7), 1, 2.6);
        }
        this.pxAt = now;
      }
      if (this.reduceMotion) this.particles.clear();
      else this.particles.update(now, dt, {
        // The turn drives ribbons; the landing triggers the separate burst.
        spinAngle,
        sizeScale: this.partScale,
        wideStyle: humming,
        sustainBelts: humming || loading,
      });

      this._paint(this.reduceMotion ? this.stateAt : now);
      this._raf = requestAnimationFrame((t) => this._tick(t));
    }

    _paint(now) {
      const geo = g.GROK_GEO;
      const R = geo.Re;
      const shape = geo.shapes.blob;
      const overlay = this.fx.frame(now);
      const { yl, mix, cur, prev, extra: ov } = overlay;
      const bodyW = 1 - yl;
      const ex = this.extras;
      const tx = this.tx.x * bodyW + ov.yre * yl;
      const ty = (this.ty.x + ex.hop) * bodyW + ov.aX * yl;
      const rot = this.spin.x * bodyW * shape.tiltScale + ov.wl * yl;
      const sx = bodyW + ov.wre * yl;
      const sy = this.squash.x * bodyW + ov.wre * yl;
      this.group.setAttribute(
        "transform",
        `translate(${(R + tx).toFixed(2)} ${(R + ty).toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-R} ${-R})`
      );
      this.group.style.opacity = (1 - ov.fade).toFixed(3);

      const Jc = clamp(yl / FX.P_BLEND, 0, 1);
      const pencil = cur === "pencil" || prev === "pencil";
      const tear = geo.shapes.teardrop?.path;
      const restRing = FX.shapeRing(shape.path, R);
      let bodyD;
      const overlayRing = () => {
        const to = FX.overlayRing(cur, R, tear);
        return prev
          ? lerpPoly(FX.overlayRing(prev, R, tear), to, mix)
          : to;
      };
      if (Jc >= 1) {
        bodyD = pencil ? FX.closedSpline(overlayRing()) : this.fx.circlePath;
      } else if (Jc <= 0) {
        bodyD = shape.path;
      } else {
        const to = overlayRing();
        bodyD = FX.closedSpline(lerpPoly(restRing, to, K2(Jc)));
      }
      this.body.setAttribute("d", bodyD);
      this.clipPath.setAttribute("d", bodyD);

      this.fx.paint(now, overlay, R, this.reduceMotion);

      const shrink = 1 - Dke(clamp((this.pxW - 44) / 90, 0, 1));
      const zCur = overlayViewZoom(cur, POSE_SCALE);
      const zPrev = overlayViewZoom(prev, POSE_SCALE);
      const zoom = 1 + (zCur * mix + zPrev * (1 - mix) - 1) * yl * shrink;
      const half = VIEW_HALF / zoom;
      this.svg.setAttribute("viewBox", `${(VIEW_MID - half).toFixed(2)} ${(VIEW_MID - half).toFixed(2)} ${(half * 2).toFixed(2)} ${(half * 2).toFixed(2)}`);

      const morphT = clamp(this.eyeMorph.x, 0, 1);
      const polys = this._currentPolys(morphT);
      let cyl = overlay.turn;
      if (ex.turn != null) cyl = (cyl ?? 0) + ex.turn;
      EY.paintEyes({
        now,
        polys,
        shape,
        face: shape.face,
        faceTune: FACE_TUNE,
        blinkX: this.blink.x,
        eyeBoostX: this.eyeScale.x,
        gazeX: this.gazeX.x,
        gazeY: this.gazeY.x,
        winkAt: this.winkAt,
        winkEye: this.winkEye,
        turn: cyl,
        cr: eyeRotation,
        notifyX: this.notify.x,
        overlayX: this.fx.amount,
        eyeEls: this.eyeEls,
        badgeEl: this.badge,
        Re: R,
        G9e: geo.G9e,
        badgeRing: restRing,
      });

      const hum = clamp(this.humDots.x, 0, 1);
      if (hum > 0.01) {
        for (let i = 0; i < 2; i++) {
          const el = this.fx.parts[3 + i];
          if (!el) continue;
          const Gn = this.ovSpin * 0.85 + i * Math.PI;
          const Ti = shape.radius * 1.3;
          const Ui = Math.cos(Gn);
          const Si = 0.55 + 0.45 * clamp((Ui + 1) / 2, 0, 1);
          el.style.display = "";
          el.setAttribute("cx", (R + Ti * Math.sin(Gn)).toFixed(1));
          el.setAttribute("cy", (R - Ti * 0.38 * Math.cos(Gn) - 8).toFixed(1));
          el.setAttribute("r", (7.5 * Si * hum).toFixed(2));
          el.setAttribute("opacity", ((0.3 + 0.7 * Si) * hum).toFixed(3));
        }
      }
    }
  }

  g.GrokCharacter = GrokCharacter;
})(window);
