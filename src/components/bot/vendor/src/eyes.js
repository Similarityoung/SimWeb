/* L3 — eye morph, wink, blink queue, placement. Source en / ks / mn / P2. */
(function (g) {
  const {
    clamp, centroid, polyPath, Dke, spanAt,
  } = g.GROK_MATH;

  function queueBlink(q, now) {
    q.push(
      { at: now, v: 0.05 },
      { at: now + 70, v: 0.05 },
      { at: now + 150, v: 1.08 },
      { at: now + 300, v: 1 }
    );
    if (Math.random() < 0.14) {
      q.push({ at: now + 370, v: 0.05 }, { at: now + 480, v: 1 });
    }
  }

  function consumeBlink(q, now) {
    let key = null;
    while (q.length && now >= q[0].at) key = q.shift().v;
    return key;
  }

  function winkLid(base, now, winkAt, winkEye, i) {
    let lid = Math.max(base, 0.04);
    if (i === winkEye && now < winkAt + 320) {
      const xr = (now - winkAt) / 320;
      const Fr = xr < 0.42 ? 1 - xr / 0.42 : (xr - 0.42) / 0.58;
      lid = Math.max(lid * clamp(Fr, 0, 1), 0.04);
    }
    return lid;
  }

  function paintEyes(opt) {
    const {
      now, polys, shape, face, faceTune,
      blinkX, gazeX, gazeY, winkAt, winkEye, turn, cr, notifyX,
      overlayX, eyeEls, badgeEl, Re, G9e,
    } = opt;
    const faceOpacity = 1 - Dke(clamp(overlayX * 2, 0, 1));
    const $i = {
      x: face.x,
      y: face.y,
      sx: face.sx * (faceTune?.gap ?? 1),
      sy: face.sy * (faceTune?.height ?? 1),
      leftDX: face.leftDX ?? 0,
    };
    const sX = $i.leftDX;
    const cents = [centroid(polys[0]), centroid(polys[1])];
    let a1 = 0, o1 = 0;
    for (const p of polys[0]) a1 = Math.max(a1, Math.abs(p[0] - cents[0][0]));
    for (const p of polys[1]) o1 = Math.max(o1, Math.abs(p[0] - cents[1][0]));
    const l1 = Math.abs(cents[1][0] - (cents[0][0] + sX)) * $i.sx;
    const _ee = a1 + o1 > 0.5 ? clamp(l1 / (a1 + o1), 0.35, 4) : 4;
    const oX = Math.min(clamp(opt.eyeBoostX, 0.2, 2), _ee);
    const Hee = Math.min(oX * clamp(faceTune?.eyeWidth ?? 1, 0.2, 3), _ee);
    const u1 = oX * clamp(faceTune?.eyeHeight ?? 1, 0.2, 3);
    const liveSpan = spanAt(shape.path, Re);
    const top = shape.top;
    const bottom = shape.bottom;
    const badgeRing = opt.badgeRing;
    const Yl = badgeRing
      ? badgeRing[Math.round(badgeRing.length * 7 / 8) % badgeRing.length]
      : [Re, shape.top];

    for (let i = 0; i < 2; i++) {
      const poly = polys[i];
      const [Gn, Ti] = cents[i];
      eyeEls[i].setAttribute("d", polyPath(poly));
      const lid = winkLid(blinkX, now, winkAt, winkEye, i);
      const Ea = Gn + (i === 0 ? sX : 0);
      let Ca = Re + $i.x;
      let Wo = (Ea - Re) * $i.sx;
      let _c = 1, vre = 1, km = 1, Ree = 0, Fee = 0, zee = 1, bre = true, Tre = 1;
      let Sre = clamp(Re + $i.y + (Ti - Re) * $i.sy, top + 2, bottom - 2);
      {
        const xr = (Ea - Re) / Re;
        const Fr = (Re - Ti) / Re;
        const Ia = Math.sqrt(Math.max(0, 1 - xr * xr - Fr * Fr)) || 0.02;
        const li = cr[0] * xr + cr[1] * Fr + cr[2] * Ia;
        const bl = cr[3] * xr + cr[4] * Fr + cr[5] * Ia;
        const Io = cr[6] * xr + cr[7] * Fr + cr[8] * Ia;
        Wo = li * Re * $i.sx;
        Sre = clamp(Re + $i.y - bl * Re * $i.sy, top + 2, bottom - 2);
        let uo = -Fr * xr, Tl = 1 - Fr * Fr, Zi = -Fr * Ia;
        const Yo = Math.hypot(uo, Tl, Zi);
        if (Yo < 1e-6) {
          uo = 0; Tl = 0; Zi = 1;
        } else {
          uo /= Yo; Tl /= Yo; Zi /= Yo;
        }
        const md = Fr * Zi - Ia * Tl, Oc = Ia * uo - xr * Zi, yu = xr * Tl - Fr * uo;
        const vm = cr[0] * uo + cr[1] * Tl + cr[2] * Zi;
        const Hme = cr[3] * uo + cr[4] * Tl + cr[5] * Zi;
        const Nre = cr[0] * md + cr[1] * Oc + cr[2] * yu;
        const Ere = cr[3] * md + cr[4] * Oc + cr[5] * yu;
        const Cre = md, Ha = -Oc, ci = uo, Ys = -Tl;
        const ku = Cre * Ys - ci * Ha || 1e-6;
        const Ql = Ys / ku, Gee = -ci / ku, bm = -Ha / ku, Ire = Cre / ku;
        km = Nre * Ql + vm * bm;
        Fee = Nre * Gee + vm * Ire;
        Ree = -Ere * Ql + -Hme * bm;
        zee = -Ere * Gee + -Hme * Ire;
        _c = Math.max(Math.hypot(km, Ree), 0.02);
        vre = Math.max(Math.hypot(Fee, zee), 0.02);
        bre = Io > 0.02;
        Tre = Dke(clamp(Io / 0.5, 0, 1));
      }

      if (turn != null) {
        const [spL, spR] = liveSpan(Sre);
        const rad = Math.max((spR - spL) / 2, 12);
        Ca = (spL + spR) / 2;
        const li0 = Math.asin(clamp(Wo / rad, -1, 1));
        const bl0 = li0 + turn;
        const Io0 = Math.cos(bl0);
        const uo0 = Math.max(Math.cos(li0), 0.02);
        bre = Io0 > 0.02;
        _c = Math.max(Io0, 0.02) / uo0;
        Wo = rad * Math.sin(bl0);
        Tre = Dke(clamp(Io0 / 0.5, 0, 1));
      }

      let Kj = Math.sin(now * 42e-5 + i) * 1.4 + Math.sin(now * 0.001 + i * 2) * 0.5;
      let Ko = Math.sin(now * 58e-5 + i) * 0.9;
      Kj += gazeX;
      Ko += gazeY;
      const $ee = clamp(notifyX, 0, 1);
      Kj -= 10 * $ee;
      Ko += 7 * $ee;

      const Vee = clamp(_c * Hee, 0.02, 2.4);
      const _2 = clamp(vre * lid * u1, 0.02, 2.4);
      eyeEls[i].style.display = bre && faceOpacity > 0 ? "" : "none";
      eyeEls[i].style.opacity = faceOpacity.toFixed(3);
      const Ume = G9e * _2 + 2;
      const vl = clamp(
        Sre + Ko * $i.sy,
        top + Ume,
        bottom - Ume
      );
      let O2 = -Infinity, Xl = Infinity;
      for (let p = 0; p < poly.length; p += 2) {
        const Frp = (poly[p][0] - Gn) * Vee;
        const [Ia2, li2] = liveSpan(vl + (poly[p][1] - Ti) * _2);
        if (Ia2 - Frp > O2) O2 = Ia2 - Frp;
        if (li2 - Frp < Xl) Xl = li2 - Frp;
      }
      const xre = Ca + Wo + Kj * $i.sx;
      const lX = O2 <= Xl ? clamp(xre, O2, Xl) : (O2 + Xl) / 2;
      let dd = lX + (xre - lX) * (1 - Tre);
      let Yj = vl;
      if (notifyX > 0.01) {
        const xr = 20 * clamp(notifyX, 0, 1.4);
        const Fr = dd - Yl[0], Ia = Yj - Yl[1];
        const li = Math.hypot(Fr, Ia) || 1;
        const bl = Fr / li, Io = Ia / li;
        const uo = (i === 0 ? a1 : o1) * Vee;
        const Tl = Math.hypot(uo * bl, G9e * _2 * Io);
        const Zi = xr + Tl + 5;
        if (li < Zi) {
          dd += bl * (Zi - li);
          Yj += Io * (Zi - li);
        }
      }

      {
        const FrM = clamp((turn != null ? _c : 1) * Hee, 0.02, 2.4);
        const IaM = clamp(lid * u1, 0.02, 2.4);
        const liM = km * FrM, blM = Ree * FrM, IoM = Fee * IaM, uoM = zee * IaM;
        eyeEls[i].setAttribute(
          "transform",
          `translate(${dd.toFixed(2)} ${Yj.toFixed(2)}) matrix(${liM.toFixed(4)} ${blM.toFixed(4)} ${IoM.toFixed(4)} ${uoM.toFixed(4)} 0 0) translate(${(-Gn).toFixed(2)} ${(-Ti).toFixed(2)})`
        );
      }
    }

    if (badgeEl) {
      const amt = clamp(notifyX, 0, 1.4);
      if (amt <= 0.01) badgeEl.style.display = "none";
      else {
        badgeEl.style.display = "";
        badgeEl.style.fill = "var(--gb-badge, #1d9bf0)";
        badgeEl.setAttribute("cx", Yl[0].toFixed(1));
        badgeEl.setAttribute("cy", Yl[1].toFixed(1));
        badgeEl.setAttribute("r", (20 * amt).toFixed(2));
      }
    }
  }

  g.GROK_EYES = { queueBlink, consumeBlink, paintEyes };
})(window);
