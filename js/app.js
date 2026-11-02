// Electron Configuration Explorer
// Builds atoms one electron at a time (Aufbau, Pauli, Hund), draws the energy-level
// diagram, and renders orbital shapes from hydrogen-like wavefunctions.
// Sections: element data -> periodic table -> energy-level diagram -> explanations
// -> dot-cloud and slice viewers -> 3D builder (three.js) -> controls.
(function () {
  "use strict";
  const SYM = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(" ");
  const NAME = ("Hydrogen Helium Lithium Beryllium Boron Carbon Nitrogen Oxygen Fluorine Neon Sodium Magnesium Aluminum Silicon Phosphorus Sulfur Chlorine Argon Potassium Calcium Scandium Titanium Vanadium Chromium Manganese Iron Cobalt Nickel Copper Zinc Gallium Germanium Arsenic Selenium Bromine Krypton Rubidium Strontium Yttrium Zirconium Niobium Molybdenum Technetium Ruthenium Rhodium Palladium Silver Cadmium Indium Tin Antimony Tellurium Iodine Xenon Cesium Barium Lanthanum Cerium Praseodymium Neodymium Promethium Samarium Europium Gadolinium Terbium Dysprosium Holmium Erbium Thulium Ytterbium Lutetium Hafnium Tantalum Tungsten Rhenium Osmium Iridium Platinum Gold Mercury Thallium Lead Bismuth Polonium Astatine Radon Francium Radium Actinium Thorium Protactinium Uranium Neptunium Plutonium Americium Curium Berkelium Californium Einsteinium Fermium Mendelevium Nobelium Lawrencium Rutherfordium Dubnium Seaborgium Bohrium Hassium Meitnerium Darmstadtium Roentgenium Copernicium Nihonium Flerovium Moscovium Livermorium Tennessine Oganesson").split(" ");

  const L = "spdf";
  // Madelung (n + l) fill order through 7p = 118 electrons
  const ORDER = ["1s","2s","2p","3s","3p","4s","3d","4p","5s","4d","5p","6s","4f","5d","6p","7s","5f","6d","7p"].map((name, i) => {
    const n = +name[0], l = L.indexOf(name[1]);
    return { name, n, l, m: 2 * l + 1, cap: 2 * (2 * l + 1), idx: i };
  });
  const BY = Object.fromEntries(ORDER.map(o => [o.name, o]));
  const NOBLE = [2, 10, 18, 36, 54, 86, 118];

  // Real ground-state configurations that break the simple fill order (changes relative to Aufbau)
  const EXC = {
    24: { o: { "4s": 1, "3d": 5 }, why: "One 4s electron moves into 3d, giving a half-filled 3d⁵ set. Half-filled and completely filled d subshells are extra stable, and 4s and 3d are very close in energy." },
    29: { o: { "4s": 1, "3d": 10 }, why: "One 4s electron moves into 3d to complete a full 3d¹⁰ set, which is extra stable." },
    41: { o: { "5s": 1, "4d": 4 }, why: "5s and 4d are so close in energy that one 5s electron sits in 4d instead." },
    42: { o: { "5s": 1, "4d": 5 }, why: "Same pattern as chromium: one 5s electron moves into 4d to make a half-filled 4d⁵." },
    44: { o: { "5s": 1, "4d": 7 }, why: "5s and 4d are so close in energy that one 5s electron sits in 4d instead." },
    45: { o: { "5s": 1, "4d": 8 }, why: "5s and 4d are so close in energy that one 5s electron sits in 4d instead." },
    46: { o: { "5s": 0, "4d": 10 }, why: "Both 5s electrons move into 4d, giving a completely full 4d¹⁰ and an empty 5s." },
    47: { o: { "5s": 1, "4d": 10 }, why: "Same pattern as copper: one 5s electron moves into 4d to complete 4d¹⁰." },
    57: { o: { "4f": 0, "5d": 1 }, why: "Lanthanum's newest electron goes into 5d, not 4f. The 4f orbitals only drop low enough in energy to fill starting with cerium." },
    58: { o: { "4f": 1, "5d": 1 }, why: "One electron sits in 5d instead of 4f, because 4f and 5d are nearly equal in energy here." },
    64: { o: { "4f": 7, "5d": 1 }, why: "One electron sits in 5d so that 4f stays exactly half-filled (4f⁷), which is extra stable." },
    78: { o: { "6s": 1, "5d": 9 }, why: "One 6s electron moves into 5d. 6s and 5d are very close in energy for platinum." },
    79: { o: { "6s": 1, "5d": 10 }, why: "Same pattern as copper and silver: one 6s electron moves into 5d to complete 5d¹⁰." },
    89: { o: { "5f": 0, "6d": 1 }, why: "Actinium's newest electron goes into 6d, not 5f, just like lanthanum one row up." },
    90: { o: { "5f": 0, "6d": 2 }, why: "Both of thorium's outer electrons sit in 6d; 5f is still slightly higher in energy." },
    91: { o: { "5f": 2, "6d": 1 }, why: "One electron sits in 6d instead of 5f, because the two are nearly equal in energy." },
    92: { o: { "5f": 3, "6d": 1 }, why: "One electron sits in 6d instead of 5f, because the two are nearly equal in energy." },
    93: { o: { "5f": 4, "6d": 1 }, why: "One electron sits in 6d instead of 5f, because the two are nearly equal in energy." },
    96: { o: { "5f": 7, "6d": 1 }, why: "One electron sits in 6d so that 5f stays exactly half-filled (5f⁷), like gadolinium above it." },
    103: { o: { "6d": 0, "7p": 1 }, why: "Lawrencium's last electron is predicted to go into 7p instead of 6d, an effect of relativity in very heavy atoms." }
  };

  // Precompute Aufbau counts and the "newest electron" for each Z
  function aufbauCounts(Z) {
    const c = {}; let r = Z;
    for (const o of ORDER) { const t = Math.min(o.cap, r); c[o.name] = t; r -= t; }
    return c;
  }
  const DIFF = [null];
  { let z = 0; for (const o of ORDER) for (let k = 1; k <= o.cap; k++) { z++; DIFF[z] = { sub: o, k }; } }

  function actualCounts(Z) {
    const c = aufbauCounts(Z);
    if (EXC[Z]) Object.assign(c, EXC[Z].o);
    return c;
  }

  // Position of each element in each layout
  function position(Z, layout) {
    const { sub, k } = DIFF[Z];
    const period = sub.l <= 1 ? sub.n : sub.l === 2 ? sub.n + 1 : sub.n + 2;
    let col, row = period;
    if (Z === 2) col = layout === "long" ? 32 : 18;
    else if (layout === "long") col = [0, 26, 16, 2][sub.l] + k;
    else {
      col = [0, 12, 2, 2][sub.l] + k;
      if (sub.l === 3) row = period === 6 ? 9 : 10;
    }
    return { row, col, period };
  }
  function group(Z) {
    const { sub } = DIFF[Z];
    if (sub.l === 3) return "—";
    return String(position(Z, "standard").col);
  }

  const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  const sup = n => String(n).split("").map(ch => SUP[ch]).join("");

  // ---------- State ----------
  const S = { Z: 7, actual: false, short: false, layout: "standard", timer: null };
  const $ = id => document.getElementById(id);
  const cells = [];

  // ---------- Periodic table ----------
  function buildTable() {
    const pt = $("pt");
    pt.className = "pt " + S.layout;
    pt.innerHTML = "";
    const add = (cls, html, gc, gr, attrs) => {
      const el = document.createElement("div");
      el.className = cls; el.innerHTML = html;
      el.style.gridColumn = gc; el.style.gridRow = gr;
      if (attrs) for (const a in attrs) el.setAttribute(a, attrs[a]);
      pt.appendChild(el); return el;
    };
    const heads = S.layout === "long"
      ? [["s", "s", "2 / 4"], ["f", "f-block", "4 / 18"], ["d", "d-block", "18 / 28"], ["p", "p-block", "28 / 34"]]
      : [["s", "s", "2 / 4"], ["d", "d-block", "4 / 14"], ["p", "p-block", "14 / 20"]];
    heads.forEach(([b, t, gc]) => add("blockhead " + b, t, gc, "1"));
    for (let p = 1; p <= 7; p++) add("plabel", String(p), "1", String(p + 1), { title: "Period " + p });
    if (S.layout === "standard") {
      add("flabel", "4f block<br>(period 6)", "1 / 4", "11");
      add("flabel", "5f block<br>(period 7)", "1 / 4", "12");
    }
    for (let z = 1; z <= 118; z++) {
      const { row, col } = position(z, S.layout);
      const d = DIFF[z];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell b-" + L[d.sub.l] + (EXC[z] ? " exception" : "");
      btn.style.gridColumn = String(col + 1);
      btn.style.gridRow = String(row + 1 + (S.layout === "standard" && row >= 9 ? 1 : 0));
      btn.innerHTML = `<span class="z">${z}</span><span class="sym">${SYM[z - 1]}</span><span class="sub">${d.sub.name}${sup(d.k)}</span>`;
      btn.title = `${NAME[z - 1]} (Z = ${z}): newest electron in ${d.sub.name}`;
      btn.setAttribute("aria-label", `${NAME[z - 1]}, ${z} electrons`);
      btn.addEventListener("click", () => goTo(z));
      pt.appendChild(btn);
      cells[z] = btn;
    }
  }

  // ---------- Fill-order strip ----------
  const chips = {};
  function buildStrip() {
    const strip = $("strip");
    let start = 1;
    ORDER.forEach((o, i) => {
      if (i) { const a = document.createElement("span"); a.className = "arrow"; a.textContent = "→"; strip.appendChild(a); }
      const c = document.createElement("button");
      c.type = "button";
      c.className = "chip l" + o.l;
      const first = start;
      c.innerHTML = `<span class="ord">${i + 1}</span>${o.name}<span class="bar"></span>`;
      c.title = `${o.name}: holds ${o.cap} electrons (n + l = ${o.n + o.l}). Click to jump to ${NAME[first - 1]}, its first electron.`;
      c.addEventListener("click", () => goTo(first));
      strip.appendChild(c);
      chips[o.name] = c;
      start += o.cap;
    });
  }

  // ---------- Orbital diagram ----------
  const ssEls = {};
  // Energy-level diagram: each orbital is a short line, height = relative energy
  const ELEV = { "1s": 0.0, "2s": 0.17, "2p": 0.27, "3s": 0.385, "3p": 0.47, "4s": 0.555, "3d": 0.6, "4p": 0.665,
    "5s": 0.715, "4d": 0.735, "5p": 0.79, "6s": 0.81, "4f": 0.84, "5d": 0.86, "6p": 0.9, "7s": 0.92, "5f": 0.945, "6d": 0.965, "7p": 1.0 };
  function buildOrb() {
    const orb = $("orb");
    orb.className = "eld";
    orb.innerHTML = `<div class="eaxis" aria-hidden="true"><span>Increasing energy</span></div><div class="eplot"></div>`;
    const plot = orb.querySelector(".eplot");
    const colLeft = ["var(--c0)", "var(--c1)", "var(--c2)", "var(--c3)"];
    ORDER.forEach(o => {
      const g = document.createElement("div");
      g.className = "ss l" + o.l;
      g.style.left = colLeft[o.l];
      g.style.bottom = `calc(${ELEV[o.name]} * (100% - 26px))`;
      g.innerHTML = `<span class="name">${o.name}</span><span class="cnt" hidden></span>` +
        '<div class="box"><span></span><span></span></div>'.repeat(o.m);
      plot.appendChild(g);
      ssEls[o.name] = { el: g, cnt: g.querySelector(".cnt"), boxes: [...g.querySelectorAll(".box")] };
      ssEls[o.name].boxes.forEach((bx, i) => {
        bx.title = `${o.name}${ANG[o.l][i].lab ? " " + ANG[o.l][i].lab : ""} orbital: click to see its shape`;
        bx.addEventListener("click", () => selectOrbital(o.n, o.l, i, true));
      });
    });
  }

  // ---------- Text helpers ----------
  function configHTML(counts, Z) {
    if (Z === 0) return "— (no electrons yet)";
    let parts = [], core = 0;
    if (S.short) core = NOBLE.filter(g => g < Z).pop() || 0;
    let skip = 0;
    if (core) {
      let tot = 0;
      for (const o of ORDER) { if (tot >= core) break; tot += o.cap; skip++; }
      parts.push(`<span class="core">[${SYM[core - 1]}]</span>`);
    }
    ORDER.slice(skip).forEach(o => { if (counts[o.name] > 0) parts.push(`${o.name}<sup>${counts[o.name]}</sup>`); });
    return parts.join(" ");
  }
  function configPlain(counts, Z) {
    const core = NOBLE.filter(g => g < Z).pop() || 0;
    let skip = 0, tot = 0;
    if (core) for (const o of ORDER) { if (tot >= core) break; tot += o.cap; skip++; }
    const p = core ? [`[${SYM[core - 1]}]`] : [];
    ORDER.slice(skip).forEach(o => { if (counts[o.name] > 0) p.push(o.name + sup(counts[o.name])); });
    return p.join(" ");
  }

  function explain(Z) {
    const items = [];
    if (Z === 0) {
      items.push(["rule-aufbau", "Press <b>+ Electron</b> to add the first electron. It will go into 1s, the lowest-energy orbital."]);
      return items;
    }
    const { sub, k } = DIFF[Z];
    const nl = o => `n + l = ${o.n} + ${o.l} = ${o.n + o.l}`;
    if (k === 1) {
      if (Z === 1) items.push(["rule-aufbau", `<b>Aufbau:</b> the first electron goes into <b>1s</b>, the lowest-energy orbital (${nl(sub)}).`]);
      else {
        const prev = ORDER[sub.idx - 1];
        let t = `<b>Aufbau:</b> ${prev.name} is full, so this electron starts the next subshell in line, <b>${sub.name}</b> (${nl(sub)}).`;
        const lower = ORDER.slice(sub.idx + 1).find(o => o.n < sub.n);
        const next = ORDER[sub.idx + 1];
        if (lower) t += ` That's why ${sub.name} fills before ${lower.name}: its n + l is lower (${sub.n + sub.l} vs ${lower.n + lower.l}), even though ${lower.name} has the smaller n.`;
        else if (next && next.n + next.l === sub.n + sub.l) t += ` ${sub.name} and ${next.name} tie at n + l = ${sub.n + sub.l}; on a tie the lower n fills first, so ${sub.name} goes before ${next.name}.`;
        else if (prev.n + prev.l === sub.n + sub.l) t += ` ${prev.name} and ${sub.name} tied at n + l = ${sub.n + sub.l}; ${prev.name} went first because it has the lower n.`;
        items.push(["rule-aufbau", t]);
      }
      if (sub.l > 0) items.push(["rule-hund", `${sub.name} has ${sub.m} orbitals of equal energy. This electron takes the first one, spin up (↑).`]);
    } else if (sub.l === 0) {
      items.push(["rule-pauli", `<b>Pauli exclusion:</b> the ${sub.name} orbital takes a second electron with the opposite spin (↓). One orbital can never hold more than 2.`]);
    } else if (k <= sub.m) {
      items.push(["rule-hund", `<b>Hund's rule:</b> electron ${k} in ${sub.name} goes into an <b>empty</b> orbital instead of pairing up. The unpaired electrons all spin the same way (↑).`]);
    } else {
      const t = k === sub.m + 1
        ? `<b>Pauli exclusion:</b> every ${sub.name} orbital now has one electron, so pairing starts. The second electron in an orbital must have the opposite spin (↓).`
        : `<b>Pauli exclusion:</b> pairing continues in ${sub.name}. Each paired electron has the opposite spin (↓) of its partner.`;
      items.push(["rule-pauli", t]);
    }
    if (k === sub.cap) items.push(["rule-full", `<b>${sub.name} is now full</b> (${sub.cap} electrons).` + (NOBLE.includes(Z) ? ` Every occupied subshell is full: ${NAME[Z - 1].toLowerCase()} has a noble-gas configuration.` : "")]);
    if (EXC[Z]) {
      const real = configPlain(actualCounts(Z), Z);
      items.push(["rule-ex", S.actual
        ? `<b>Real exception:</b> ${EXC[Z].why}`
        : `<b>Heads up:</b> ${NAME[Z - 1]} is an exception. Its real configuration is <b>${real}</b>. Turn on “Show real exceptions” to see it.`]);
    }
    if (Z >= 104) items.push(["rule-ex", "Elements this heavy are made a few atoms at a time, so their configurations are predictions."]);
    return items;
  }

  // ---------- Update ----------
  function update() {
    const Z = S.Z;
    const counts = S.actual ? actualCounts(Z) : aufbauCounts(Z);
    const showReal = S.actual && EXC[Z];
    const d = Z ? DIFF[Z] : null;
    const auf = aufbauCounts(Z);

    $("zSlider").value = Z;
    $("zOut").textContent = Z + " e⁻";
    $("bPrev").disabled = Z === 0;
    $("bNext").disabled = Z === 118;

    // periodic table
    for (let z = 1; z <= 118; z++) {
      const c = cells[z];
      c.classList.toggle("filled", z <= Z);
      c.classList.toggle("current", z === Z);
      c.classList.toggle("insub", !!d && DIFF[z].sub === d.sub && z !== Z);
    }

    // strip
    ORDER.forEach(o => {
      const ch = chips[o.name], v = counts[o.name];
      ch.querySelector(".bar").style.width = (100 * v / o.cap) + "%";
      ch.classList.toggle("full", v === o.cap);
      ch.classList.toggle("active", !!d && d.sub === o);
    });

    // orbital boxes (Hund's rule, then pairing)
    ORDER.forEach(o => {
      const r = ssEls[o.name], c = counts[o.name];
      const ups = Math.min(c, o.m), downs = Math.max(0, c - o.m);
      r.el.classList.toggle("started", c > 0 || auf[o.name] > 0);
      r.el.classList.toggle("active", !!d && d.sub === o && !showReal);
      r.el.classList.toggle("shifted", !!showReal && EXC[Z].o[o.name] !== undefined);
      r.cnt.textContent = c + "/" + o.cap;
      r.boxes.forEach((b, i) => {
        const [u, dn] = b.children;
        u.textContent = i < ups ? "↑" : "";
        dn.textContent = i < downs ? "↓" : "";
        u.className = ""; dn.className = "";
      });
    });
    if (d && !showReal) {
      const r = ssEls[d.sub.name];
      const k = d.k;
      const span = k <= d.sub.m ? r.boxes[k - 1].children[0] : r.boxes[k - d.sub.m - 1].children[1];
      void span.offsetWidth;
      span.className = "new";
      span.parentElement.classList.remove("flash"); void span.parentElement.offsetWidth; span.parentElement.classList.add("flash");
    }

    // info panel
    const tile = $("tile");
    if (Z) {
      tile.className = "tile b-" + L[d.sub.l];
      $("tileZ").textContent = Z; $("tileS").textContent = SYM[Z - 1];
      $("eName").textContent = NAME[Z - 1];
      const pos = position(Z, "standard");
      $("eMeta").textContent = `Atomic number ${Z} · Period ${pos.period} · ${L[d.sub.l]}-block` + (group(Z) !== "—" ? ` · Group ${group(Z)}` : "");
    } else {
      tile.className = "tile none"; $("tileZ").textContent = "0"; $("tileS").textContent = "–";
      $("eName").textContent = "Empty"; $("eMeta").textContent = "Nucleus only, no electrons yet";
    }
    $("cfg").innerHTML = configHTML(counts, Z);
    if (Z) {
      const box = d.k <= d.sub.m ? d.k : d.k - d.sub.m;
      const spin = d.k <= d.sub.m ? "spin up ↑" : "spin down ↓";
      $("where").innerHTML = `Electron #${Z} <span class="arr">→</span> ${d.sub.name}, orbital ${box} of ${d.sub.m}, ${spin}`;
    } else $("where").textContent = "";
    $("explain").innerHTML = explain(Z).map(([c, t]) => `<li class="${c}">${t}</li>`).join("");

    let unpaired = 0, shells = 0;
    ORDER.forEach(o => { const c = counts[o.name]; if (c) { unpaired += c <= o.m ? c : 2 * o.m - c; shells = Math.max(shells, o.n); } });
    const valence = Z ? ORDER.filter(o => o.n === shells).reduce((s, o) => s + counts[o.name], 0) : 0;
    $("stats").innerHTML = [
      ["Electrons", Z],
      ["Unpaired", unpaired],
      ["Highest n", shells || "—"],
      ["Outer shell", valence]
    ].map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");
    shapesUpdate(Z, counts, d);
  }

  function setZ(z) { S.Z = Math.max(0, Math.min(118, z)); update(); }
  function stop() { if (S.timer) { clearInterval(S.timer); S.timer = null; $("bPlay").textContent = "Play"; } S.stepMs = +$("speed").value; }
  // Click an element: build the atom up to it one electron at a time
  function goTo(z) {
    stop();
    if (z === S.Z) return;
    if (z < S.Z) setZ(0);
    const steps = z - S.Z;
    S.stepMs = Math.min(+$("speed").value, Math.max(45, 3200 / steps));
    $("bPlay").textContent = "Stop";
    S.timer = setInterval(() => {
      if (S.Z >= z) { stop(); return; }
      setZ(S.Z + 1);
      if (S.Z >= z) stop();
    }, S.stepMs);
    setZ(S.Z + 1);
    if (S.Z >= z) stop();
  }
  function play() {
    if (S.timer) return stop();
    if (S.Z >= 118) setZ(0);
    $("bPlay").textContent = "Pause";
    S.stepMs = +$("speed").value;
    S.timer = setInterval(() => { if (S.Z >= 118) return stop(); setZ(S.Z + 1); }, +$("speed").value);
  }

  // =====================================================================
  // ORBITAL SHAPES: hydrogen-like wavefunctions psi = R_nl(r) * Y_lm(direction)
  // =====================================================================
  const R3 = 1.7320508;
  // Real angular parts, in the same order as the boxes in the orbital diagram
  const ANG = [
    [ { lab: "", f: () => 0.2821, plane: "xz", planes: [], cones: [], desc: "none, so an s orbital is a plain sphere" } ],
    [ { lab: "x", f: (x) => 0.4886 * x, plane: "xz", planes: [[1,0,0]], cones: [], desc: "the yz-plane (x = 0)" },
      { lab: "y", f: (x, y) => 0.4886 * y, plane: "yz", planes: [[0,1,0]], cones: [], desc: "the xz-plane (y = 0)" },
      { lab: "z", f: (x, y, z) => 0.4886 * z, plane: "xz", planes: [[0,0,1]], cones: [], desc: "the xy-plane (z = 0)" } ],
    [ { lab: "xy", f: (x, y) => 1.0925 * x * y, plane: "xy", planes: [[1,0,0],[0,1,0]], cones: [], desc: "two planes: yz and xz" },
      { lab: "yz", f: (x, y, z) => 1.0925 * y * z, plane: "yz", planes: [[0,1,0],[0,0,1]], cones: [], desc: "two planes: xz and xy" },
      { lab: "xz", f: (x, y, z) => 1.0925 * x * z, plane: "xz", planes: [[1,0,0],[0,0,1]], cones: [], desc: "two planes: yz and xy" },
      { lab: "x²−y²", f: (x, y) => 0.5463 * (x * x - y * y), plane: "xy", planes: [[1,1,0],[1,-1,0]], cones: [], desc: "two vertical planes at 45° to the axes (x = y and x = −y)" },
      { lab: "z²", f: (x, y, z) => 0.3154 * (3 * z * z - 1), plane: "xz", planes: [], cones: [54.74], desc: "a double cone at 54.7° from the z-axis, which separates the donut from the two lobes" } ],
    [ { lab: "z³", f: (x, y, z) => 0.3732 * z * (5 * z * z - 3), plane: "xz", planes: [[0,0,1]], cones: [39.23], desc: "the xy-plane plus a double cone at 39.2° from the z-axis" },
      { lab: "xz²", f: (x, y, z) => 0.4570 * x * (5 * z * z - 1), plane: "xz", planes: [[1,0,0]], cones: [63.43], desc: "the yz-plane plus a double cone at 63.4° from the z-axis" },
      { lab: "yz²", f: (x, y, z) => 0.4570 * y * (5 * z * z - 1), plane: "yz", planes: [[0,1,0]], cones: [63.43], desc: "the xz-plane plus a double cone at 63.4° from the z-axis" },
      { lab: "xyz", f: (x, y, z) => 2.8906 * x * y * z, plane: "diag", planes: [[1,0,0],[0,1,0],[0,0,1]], cones: [], desc: "all three planes: yz, xz and xy" },
      { lab: "z(x²−y²)", f: (x, y, z) => 1.4453 * z * (x * x - y * y), plane: "xz", planes: [[0,0,1],[1,1,0],[1,-1,0]], cones: [], desc: "three planes: xy, x = y and x = −y" },
      { lab: "x(x²−3y²)", f: (x, y) => 0.5900 * x * (x * x - 3 * y * y), plane: "xy", planes: [[1,0,0],[1,-R3,0],[1,R3,0]], cones: [], desc: "three vertical planes 60° apart (x = 0 and x = ±√3·y)" },
      { lab: "y(3x²−y²)", f: (x, y) => 0.5900 * y * (3 * x * x - y * y), plane: "xy", planes: [[0,1,0],[R3,-1,0],[R3,1,0]], cones: [], desc: "three vertical planes 60° apart (y = 0 and y = ±√3·x)" } ]
  ];
  const PLANES = {
    xz: { a: [1,0,0], b: [0,0,1], la: "x", lb: "z", name: "xz-plane" },
    xy: { a: [1,0,0], b: [0,1,0], la: "x", lb: "y", name: "xy-plane" },
    yz: { a: [0,1,0], b: [0,0,1], la: "y", lb: "z", name: "yz-plane" },
    diag: { a: [0.7071,0.7071,0], b: [0,0,1], la: "x = y", lb: "z", name: "the vertical plane x = y" }
  };
  const orbLabel = (n, l, i) => `${n}${L[l]}${ANG[l][i].lab ? "<sub>" + ANG[l][i].lab + "</sub>" : ""}`;
  const A0 = 0.529; // Å per Bohr radius
  const BG = [12, 16, 24];
  const POS = [1.0, 0.55, 0.30], NEG = [0.30, 0.65, 1.0];
  const BLOCKC = [[1.0, 0.43, 0.51], [1.0, 0.74, 0.31], [0.39, 0.67, 1.0], [0.39, 0.86, 0.59]];
  const MAXS = 16000;

  function lag(k, a, x) {
    if (k === 0) return 1;
    let L0 = 1, L1 = 1 + a - x;
    for (let j = 1; j < k; j++) { const L2 = ((2 * j + 1 + a - x) * L1 - (j + a) * L0) / (j + 1); L0 = L1; L1 = L2; }
    return L1;
  }
  function radial(n, l, r) { const rho = 2 * r / n; return Math.pow(rho, l) * Math.exp(-rho / 2) * lag(n - l - 1, 2 * l + 1, rho); }

  const models = {};
  function getModel(n, l, i) {
    const key = n + "-" + l + "-" + i;
    if (models[key]) return models[key];
    const ang = ANG[l][i], steps = 3000, rEnd = n * n * 3 + 12, dr = rEnd / steps;
    const cum = new Float64Array(steps + 1), nodes = [];
    let prevP = 0, prevR = radial(n, l, dr * 0.5);
    for (let s = 1; s <= steps; s++) {
      const r = s * dr, R = radial(n, l, r), P = r * r * R * R;
      cum[s] = cum[s - 1] + (P + prevP) * 0.5 * dr; prevP = P;
      if (s > 1 && R * prevR < 0) nodes.push(r - dr * R / (R - prevR));
      prevR = R;
    }
    const tot = cum[steps]; for (let s = 0; s <= steps; s++) cum[s] /= tot;
    let rView = rEnd; for (let s = 0; s <= steps; s++) if (cum[s] >= 0.97) { rView = s * dr; break; }
    let maxY2 = 0;
    for (let t = 0; t < 6000; t++) {
      const z = 2 * Math.random() - 1, ph = 2 * Math.PI * Math.random(), q = Math.sqrt(1 - z * z);
      const Y = ang.f(q * Math.cos(ph), q * Math.sin(ph), z); maxY2 = Math.max(maxY2, Y * Y);
    }
    return (models[key] = { key, n, l, i, ang, cum, dr, steps, nodes, rView, maxY2: maxY2 * 1.15, pts: null, cnt: 0, slices: {} });
  }
  function ensureSamples(m, N) {
    N = Math.min(N, MAXS);
    if (!m.pts) m.pts = new Float32Array(MAXS * 4);
    while (m.cnt < N) {
      const u = Math.random();
      let lo = 0, hi = m.steps;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (m.cum[mid] < u) lo = mid; else hi = mid; }
      const c0 = m.cum[lo], c1 = m.cum[hi];
      const r = (lo + (c1 > c0 ? (u - c0) / (c1 - c0) : 0)) * m.dr;
      let x, y, z, Y;
      do {
        z = 2 * Math.random() - 1; const ph = 2 * Math.PI * Math.random(), q = Math.sqrt(1 - z * z);
        x = q * Math.cos(ph); y = q * Math.sin(ph); Y = m.ang.f(x, y, z);
      } while (Math.random() * m.maxY2 > Y * Y);
      const o = m.cnt * 4;
      m.pts[o] = x * r; m.pts[o + 1] = y * r; m.pts[o + 2] = z * r;
      m.pts[o + 3] = radial(m.n, m.l, r) * Y >= 0 ? 1 : -1;
      m.cnt++;
    }
  }
  function psi(m, x, y, z) {
    const r = Math.hypot(x, y, z) || 1e-9;
    return radial(m.n, m.l, r) * m.ang.f(x / r, y / r, z / r);
  }
  // 2D slice image: colour = phase, brightness = |psi|, white = sign change (node)
  function sliceCanvas(m, size) {
    if (m.slices[size]) return m.slices[size];
    const B = PLANES[m.ang.plane], H = m.rView * 0.85;
    const vals = new Float32Array(size * size); let mx = 0;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const a = ((i + 0.5) / size * 2 - 1) * H, b = (1 - (j + 0.5) / size * 2) * H;
      const v = psi(m, a * B.a[0] + b * B.b[0], a * B.a[1] + b * B.b[1], a * B.a[2] + b * B.b[2]);
      vals[j * size + i] = v; mx = Math.max(mx, Math.abs(v));
    }
    const cv = document.createElement("canvas"); cv.width = cv.height = size;
    const cx = cv.getContext("2d"), img = cx.createImageData(size, size), D = img.data;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const p = j * size + i, v = vals[p], t = Math.pow(Math.abs(v) / mx, 0.6), col = v >= 0 ? POS : NEG;
      let r = BG[0] + (col[0] * 255 - BG[0]) * t, g = BG[1] + (col[1] * 255 - BG[1]) * t, bl = BG[2] + (col[2] * 255 - BG[2]) * t;
      const sg = v >= 0;
      const node = (i < size - 1 && (vals[p + 1] >= 0) !== sg) || (j < size - 1 && (vals[p + size] >= 0) !== sg);
      if (node) { r = r * 0.25 + 255 * 0.75; g = g * 0.25 + 255 * 0.75; bl = bl * 0.25 + 255 * 0.75; }
      D[p * 4] = r; D[p * 4 + 1] = g; D[p * 4 + 2] = bl; D[p * 4 + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    return (m.slices[size] = { cv, H, B });
  }

  // Slater's rules: effective nuclear charge felt by an electron in subshell o
  const SL_GROUPS = ["1s","2sp","3sp","3d","4sp","4d","4f","5sp","5d","5f","6sp","6d","7sp"];
  const grp = o => o.l <= 1 ? (o.n === 1 ? "1s" : o.n + "sp") : o.name;
  function zeff(Z, counts, o) {
    const gi = SL_GROUPS.indexOf(grp(o)); let S = 0, same = 0;
    for (const p of ORDER) {
      const c = counts[p.name]; if (!c) continue;
      const pg = SL_GROUPS.indexOf(grp(p));
      if (pg === gi) { same += c; continue; }
      if (o.l <= 1) { if (p.n === o.n - 1) S += 0.85 * c; else if (p.n < o.n - 1) S += c; }
      else if (pg < gi) S += c;
    }
    S += Math.max(0, same - 1) * (o.n === 1 ? 0.30 : 0.35);
    return Math.max(1, Z - S);
  }

  const LUT = new Float32Array(2048);
  for (let q = 0; q < 2048; q++) LUT[q] = 1 - Math.exp(-q / 2047 * 7);

  // A rotatable point-cloud viewer
  function Viewer(canvas, sceneFn) {
    const V = { cv: canvas, ctx: canvas.getContext("2d"), yaw: -0.6, pitch: 0.32, zoom: 1, auto: true, dirty: true, visible: true, scene: sceneFn, W: 0 };
    V.reset = () => { V.yaw = -0.6; V.pitch = 0.32; V.zoom = 1; V.dirty = true; };
    V.resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(100, Math.round(canvas.clientWidth * dpr));
      if (w === V.W) return;
      V.W = w; V.dpr = dpr; canvas.width = canvas.height = w;
      V.buf = new Float32Array(w * w * 3); V.img = V.ctx.createImageData(w, w); V.dirty = true;
    };
    let drag = null;
    canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", e => {
      if (!drag) return;
      V.yaw += (e.clientX - drag.x) * 0.01; V.pitch = Math.max(-1.55, Math.min(1.55, V.pitch + (e.clientY - drag.y) * 0.01));
      drag = { x: e.clientX, y: e.clientY }; V.dirty = true;
    });
    const end = () => { drag = null; };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("wheel", e => { e.preventDefault(); V.zoom = Math.max(0.3, Math.min(40, V.zoom * Math.exp(-e.deltaY * 0.0015))); V.dirty = true; }, { passive: false });
    canvas.addEventListener("dblclick", V.reset);
    V.dragging = () => !!drag;
    new ResizeObserver(V.resize).observe(canvas);
    new IntersectionObserver(es => { V.visible = es[0].isIntersecting; }).observe(canvas);
    V.resize();

    V.draw = () => {
      const sc = V.scene(), W = V.W, ctx = V.ctx, dpr = V.dpr;
      ctx.fillStyle = "rgb(12,16,24)"; ctx.fillRect(0, 0, W, W);
      if (!sc) return;
      if (sc.slice) {
        ctx.imageSmoothingEnabled = true; ctx.drawImage(sc.slice.cv, 0, 0, W, W);
        sc.overlay2d && sc.overlay2d(ctx, W, dpr);
        return;
      }
      const buf = V.buf; buf.fill(0);
      const R = sc.R / V.zoom, k = W / 2 / R * 0.96, c = W / 2;
      const cf = Math.cos(V.yaw), sf = Math.sin(V.yaw), ct = Math.cos(V.pitch), st = Math.sin(V.pitch);
      const big = dpr >= 1.5;
      for (const set of sc.sets) {
        const p = set.pts, s = set.scale, N = set.count;
        for (let q = 0; q < N; q++) {
          const o = q * 4, x = p[o] * s, y = p[o + 1] * s, z = p[o + 2] * s;
          const x1 = x * cf - y * sf, y1 = x * sf + y * cf;
          const y2 = y1 * ct - z * st, z2 = y1 * st + z * ct;
          const px = (c + x1 * k) | 0, py = (c - z2 * k) | 0;
          if (px < 0 || py < 0 || px >= W - 1 || py >= W - 1) continue;
          const df = set.w * (0.62 - 0.32 * Math.max(-1, Math.min(1, y2 / R)));
          const col = p[o + 3] > 0 ? set.pos : set.neg;
          const r = col[0] * df, g = col[1] * df, b = col[2] * df;
          let ix = (py * W + px) * 3;
          buf[ix] += r; buf[ix + 1] += g; buf[ix + 2] += b;
          if (big) {
            buf[ix + 3] += r; buf[ix + 4] += g; buf[ix + 5] += b;
            ix += W * 3;
            buf[ix] += r; buf[ix + 1] += g; buf[ix + 2] += b;
            buf[ix + 3] += r; buf[ix + 4] += g; buf[ix + 5] += b;
          }
        }
      }
      const D = V.img.data, n = W * W;
      for (let q = 0; q < n; q++) {
        const a = q * 3, d = q * 4;
        const ar = Math.min(2047, (buf[a] / 7 * 2047) | 0), ag = Math.min(2047, (buf[a + 1] / 7 * 2047) | 0), ab = Math.min(2047, (buf[a + 2] / 7 * 2047) | 0);
        D[d] = BG[0] + (255 - BG[0]) * LUT[ar]; D[d + 1] = BG[1] + (255 - BG[1]) * LUT[ag]; D[d + 2] = BG[2] + (255 - BG[2]) * LUT[ab]; D[d + 3] = 255;
      }
      ctx.putImageData(V.img, 0, 0);
      const proj = (x, y, z) => {
        const x1 = x * cf - y * sf, y1 = x * sf + y * cf;
        return [c + x1 * k, c - (y1 * st + z * ct) * k, y1 * ct - z * st];
      };
      ctx.save(); drawAxes(ctx, proj, R * 0.95, dpr); sc.overlay && sc.overlay(ctx, proj, k, dpr, R); drawScale(ctx, k, W, dpr, sc.unitA0 !== false); ctx.restore();
    };
    return V;
  }
  function drawAxes(ctx, proj, R, dpr) {
    ctx.lineWidth = 1 * dpr; ctx.font = `${12 * dpr}px ${getComputedStyle(document.body).fontFamily}`;
    [[1,0,0,"x"],[0,1,0,"y"],[0,0,1,"z"]].forEach(([x, y, z, t]) => {
      const a = proj(-x * R, -y * R, -z * R), b = proj(x * R, y * R, z * R);
      ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillText(t, b[0] + 4 * dpr, b[1] - 4 * dpr);
    });
  }
  function drawScale(ctx, k, W, dpr) {
    const targetPx = 90 * dpr, a0 = targetPx / k, ang = a0 * A0;
    const nice = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
    let L = nice[0]; for (const v of nice) if (v <= ang) L = v;
    const px = L / A0 * k, x = 14 * dpr, y = W - 16 * dpr;
    ctx.setLineDash([]); ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 2 * dpr;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + px, y); ctx.moveTo(x, y - 4 * dpr); ctx.lineTo(x, y + 4 * dpr); ctx.moveTo(x + px, y - 4 * dpr); ctx.lineTo(x + px, y + 4 * dpr); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `${12 * dpr}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillText(`${L} Å`, x + px + 6 * dpr, y + 4 * dpr);
  }
  function unit(v) { const s = Math.hypot(v[0], v[1], v[2]); return [v[0] / s, v[1] / s, v[2] / s]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function drawNodes(ctx, proj, k, dpr, R, m) {
    ctx.lineWidth = 1.5 * dpr;
    ctx.font = `${11 * dpr}px ${getComputedStyle(document.body).fontFamily}`;
    // radial nodes: spheres (always project to circles)
    const o = proj(0, 0, 0);
    m.nodes.forEach((rn, idx) => {
      ctx.setLineDash([6 * dpr, 5 * dpr]); ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath(); ctx.arc(o[0], o[1], rn * k, 0, 2 * Math.PI); ctx.stroke();
      if (idx === m.nodes.length - 1) { ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText("radial node" + (m.nodes.length > 1 ? "s" : ""), o[0] + rn * k * 0.72, o[1] - rn * k * 0.72 - 4 * dpr); }
    });
    // angular nodes: planes
    m.ang.planes.forEach(nv => {
      const n = unit(nv), a = Math.abs(n[2]) < 0.9 ? [0,0,1] : [1,0,0];
      const u = unit(cross(n, a)), v = cross(n, u), s = R * 0.9;
      const pts = [[1,1],[1,-1],[-1,-1],[-1,1]].map(([p, q]) => proj((u[0] * p + v[0] * q) * s, (u[1] * p + v[1] * q) * s, (u[2] * p + v[2] * q) * s));
      ctx.setLineDash([6 * dpr, 5 * dpr]);
      ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    // angular nodes: cones around z
    m.ang.cones.forEach(deg => {
      const al = deg * Math.PI / 180, sa = Math.sin(al), ca = Math.cos(al);
      ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.strokeStyle = "rgba(255,255,255,0.6)";
      [-1, 1].forEach(sg => {
        [0.45, 0.9].forEach(f => {
          const s = R * f; ctx.beginPath();
          for (let t = 0; t <= 48; t++) { const th = t / 48 * 2 * Math.PI; const p = proj(s * sa * Math.cos(th), s * sa * Math.sin(th), sg * s * ca); t ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
          ctx.stroke();
        });
        for (let t = 0; t < 4; t++) {
          const th = t * Math.PI / 2, s = R * 0.9, p = proj(s * sa * Math.cos(th), s * sa * Math.sin(th), sg * s * ca);
          ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        }
      });
    });
  }

  // ----- Shapes state -----
  const SH = { sel: { n: 2, l: 1, i: 2 }, mode: "cloud", follow: true, nodes: true, scaleMode: "real", hidden: new Set(), occ: [], Z: 0, zeffs: {} };

  const focus = Viewer($("cvFocus"), () => {
    const { n, l, i } = SH.sel, m = getModel(n, l, i);
    if (SH.mode === "slice") {
      const sl = sliceCanvas(m, 360);
      return { slice: sl, overlay2d: (ctx, W, dpr) => {
        ctx.font = `${13 * dpr}px ${getComputedStyle(document.body).fontFamily}`; ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = dpr; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(0, W / 2); ctx.lineTo(W, W / 2); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, W); ctx.stroke();
        ctx.fillText(sl.B.la, W - 14 * dpr - ctx.measureText(sl.B.la).width, W / 2 - 6 * dpr);
        ctx.fillText(sl.B.lb, W / 2 + 6 * dpr, 34 * dpr);
        const lab = `Slice: ${sl.B.name}`; ctx.fillText(lab, W - 12 * dpr - ctx.measureText(lab).width, W - 12 * dpr);
        drawScale(ctx, (W / 2) / sl.H, W, dpr);
      } };
    }
    ensureSamples(m, MAXS);
    return {
      R: m.rView, sets: [{ pts: m.pts, count: m.cnt, scale: 1, pos: POS, neg: NEG, w: 1.1 }],
      overlay: (ctx, proj, k, dpr, R) => { if (SH.nodes) drawNodes(ctx, proj, k, dpr, R, m); }
    };
  });

  const comp = Viewer($("cvAll"), () => {
    const vis = SH.occ.filter(x => !SH.hidden.has(x.o.name));
    if (!vis.length) return null;
    const totE = vis.reduce((s, x) => s + x.e, 0);
    let R = 0; const sets = [];
    vis.forEach(x => {
      const m = getModel(x.o.n, x.o.l, x.i);
      const scale = SH.scaleMode === "real" ? 1 / SH.zeffs[x.o.name] : 1;
      const N = Math.round(Math.max(500, Math.min(14000, 70000 * x.e / totE)));
      ensureSamples(m, N);
      R = Math.max(R, m.rView * scale);
      const col = BLOCKC[x.o.l];
      sets.push({ pts: m.pts, count: Math.min(N, m.cnt), scale, pos: col, neg: col, w: 0.85 });
    });
    return { R: R * 1.05, sets, overlay: (ctx, proj, k, dpr) => {
      const o = proj(0, 0, 0); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(o[0], o[1], 2.5 * dpr, 0, 2 * Math.PI); ctx.fill();
    } };
  });

  // ----- Shapes UI -----
  const fSub = $("fSub");
  ORDER.forEach(o => { const op = document.createElement("option"); op.value = o.name; op.textContent = o.name; fSub.appendChild(op); });
  fSub.addEventListener("change", () => { const o = BY[fSub.value]; selectOrbital(o.n, o.l, 0, true); });

  function selectOrbital(n, l, i, user) {
    if (user && SH.follow) { SH.follow = false; $("fFollow").checked = false; }
    SH.sel = { n, l, i };
    renderFocusUI();
    focus.dirty = true;
  }
  function renderFocusUI() {
    const { n, l, i } = SH.sel, m = getModel(n, l, i);
    fSub.value = n + L[l];
    $("fBtns").innerHTML = ANG[l].length > 1 ? ANG[l].map((a, j) => `<button type="button" class="obtn${j === i ? " on" : ""}" data-i="${j}">${orbLabel(n, l, j)}</button>`).join("") : "";
    $("fBtns").querySelectorAll("button").forEach(b => b.addEventListener("click", () => selectOrbital(n, l, +b.dataset.i, true)));
    $("fTitle").innerHTML = `${orbLabel(n, l, i)} orbital`;
    const rad = n - l - 1, tot = n - 1;
    $("fInfo").innerHTML = `
      <div class="big"><b>${tot}</b> node${tot === 1 ? "" : "s"} in total = <b>${rad}</b> radial + <b>${l}</b> angular</div>
      <div><span class="tag">Radial</span>${rad ? `${rad === 1 ? "one sphere" : rad + " nested spheres"} at r ≈ ${m.nodes.map(r => (r * A0).toFixed(2)).join(", ")} Å` : "none"}</div>
      <div><span class="tag">Angular</span>${ann(m.ang.desc)}</div>
      <div style="color:var(--muted);font-size:0.85rem">Rules: angular nodes = l, radial nodes = n − l − 1, total = n − 1.</div>`;
    // highlight selected box + gallery item
    document.querySelectorAll(".box.sel").forEach(b => b.classList.remove("sel"));
    const se = ssEls[n + L[l]]; if (se && se.boxes[i]) se.boxes[i].classList.add("sel");
    document.querySelectorAll(".gitem").forEach(g => g.classList.toggle("sel", g.dataset.k === `${n}-${l}-${i}`));
  }
  const ann = s => s.charAt(0).toUpperCase() + s.slice(1);

  function setMode(mode) {
    SH.mode = mode; $("mCloud").classList.toggle("on", mode === "cloud"); $("mSlice").classList.toggle("on", mode === "slice");
    $("fHint").textContent = mode === "cloud" ? "Drag to rotate · scroll to zoom" : "Flat cut through the middle of the orbital";
    focus.dirty = true;
  }
  $("mCloud").addEventListener("click", () => setMode("cloud"));
  $("mSlice").addEventListener("click", () => setMode("slice"));
  $("fFollow").addEventListener("change", e => { SH.follow = e.target.checked; if (SH.follow) update(); });
  $("fNodes").addEventListener("change", e => { SH.nodes = e.target.checked; focus.dirty = true; });
  $("fAuto").addEventListener("change", e => { focus.auto = e.target.checked; });
  $("cAuto").addEventListener("change", e => { comp.auto = e.target.checked; });
  $("cScale").addEventListener("change", e => { SH.scaleMode = e.target.value; comp.reset(); writeCompNote(); });
  [["fZin", focus, 1.3], ["fZout", focus, 1 / 1.3], ["cZin", comp, 1.4], ["cZout", comp, 1 / 1.4]].forEach(([id, v, f]) =>
    $(id).addEventListener("click", () => { v.zoom = Math.max(0.3, Math.min(40, v.zoom * f)); v.dirty = true; }));
  $("fFit").addEventListener("click", focus.reset);
  $("cFit").addEventListener("click", comp.reset);

  function writeCompNote() {
    const Z = SH.Z;
    if (!Z) { $("cNote").textContent = ""; return; }
    $("cNote").textContent = SH.scaleMode === "real"
      ? `Sizes come from the effective nuclear charge each electron feels (Slater's rules). As Z grows, inner orbitals shrink toward the nucleus and the outer ones set the atom's size. Zoom in to find the core. Notice that full subshells blend into a round ball: a filled p, d or f set adds up to a perfect sphere. Click a subshell above to hide or show it.`
      : `Every orbital is drawn at its hydrogen size, so size grows with n². This exaggerates the inner orbitals but makes each layer easy to see. Click a subshell above to hide or show it.`;
  }

  // Called from update() every time the electron count changes
  function shapesUpdate(Z, counts, d) {
    SH.Z = Z;
    // occupied orbitals (Hund's rule order matches the boxes)
    SH.occ = []; SH.zeffs = {};
    ORDER.forEach(o => {
      const c = counts[o.name]; if (!c) return;
      SH.zeffs[o.name] = zeff(Z, counts, o);
      for (let i = 0; i < o.m; i++) {
        const e = (i < Math.min(c, o.m) ? 1 : 0) + (i < c - o.m ? 1 : 0);
        SH.occ.push({ o, i, e });
      }
    });
    SH.occ = SH.occ.filter(x => x.e > 0);
    if (SH.follow) {
      if (d) { const k = d.k, m = d.sub.m; SH.sel = { n: d.sub.n, l: d.sub.l, i: k <= m ? k - 1 : k - m - 1 }; }
      else SH.sel = { n: 1, l: 0, i: 0 };
    }
    // legend chips
    const subs = ORDER.filter(o => counts[o.name] > 0);
    $("cLegend").innerHTML = subs.map(o => `<button type="button" class="lchip l${o.l}${SH.hidden.has(o.name) ? " off" : ""}" data-s="${o.name}" title="Zeff ≈ ${SH.zeffs[o.name].toFixed(2)}">${o.name}<sup>${counts[o.name]}</sup></button>`).join("");
    $("cLegend").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      const s = b.dataset.s; SH.hidden.has(s) ? SH.hidden.delete(s) : SH.hidden.add(s);
      b.classList.toggle("off"); comp.dirty = true;
    }));
    $("cEmpty").hidden = Z > 0;
    $("cTitle").textContent = Z ? `${NAME[Z - 1]}: all orbitals overlapped` : "All orbitals, overlapped";
    writeCompNote();
    // gallery
    const g = $("gallery");
    g.innerHTML = subs.map(o => {
      const c = counts[o.name], ups = Math.min(c, o.m), downs = Math.max(0, c - o.m);
      const items = ANG[o.l].map((a, i) => {
        const arrows = (i < ups ? "↑" : "") + (i < downs ? "↓" : "");
        return `<button type="button" class="gitem${arrows ? "" : " empty"}" data-k="${o.n}-${o.l}-${i}" title="${o.name} ${a.lab}"><canvas width="112" height="112"></canvas><span class="glab">${orbLabel(o.n, o.l, i)}</span><span class="gocc">${arrows || "empty"}</span></button>`;
      }).join("");
      return `<div class="ggroup"><div class="ghead l${o.l}">${o.name} <span>· ${c} e⁻</span></div><div class="gitems">${items}</div></div>`;
    }).join("") || `<p class="vnote">Add an electron to see its orbital.</p>`;
    g.querySelectorAll(".gitem").forEach(b => {
      const [n, l, i] = b.dataset.k.split("-").map(Number);
      b.querySelector("canvas").getContext("2d").drawImage(sliceCanvas(getModel(n, l, i), 112).cv, 0, 0);
      b.addEventListener("click", () => selectOrbital(n, l, i, true));
    });
    renderFocusUI();
    focus.dirty = true; comp.dirty = true;
    builderUpdate(Z, counts, d);
  }

  // Animation loop: only redraws what is visible and changing
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { focus.auto = false; comp.auto = false; $("fAuto").checked = false; $("cAuto").checked = false; }
  let last = performance.now();
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    [focus, comp].forEach(v => {
      if (!v.visible) return;
      const spin = v.auto && !v.dragging() && !(v === focus && SH.mode === "slice");
      if (spin) { v.yaw += dt * 0.4; v.dirty = true; }
      if (v.dirty) { v.dirty = false; v.draw(); }
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // =====================================================================
  // SOLID 3D SHAPES (three.js): atom builder animation + simple explorer
  // Surface radius in each direction = |Y|^1.4, so p is a dumbbell, d a clover.
  // =====================================================================
  const HAS3 = typeof THREE !== "undefined" && (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch (e) { return false; } })();
  const geoCache = {};
  function lobeGeo(l, i, posHex, negHex) {
    const key = `${l}-${i}-${posHex}-${negHex}`;
    if (geoCache[key]) return geoCache[key];
    const g = new THREE.SphereGeometry(1, 80, 56), P = g.attributes.position, N = P.count;
    const f = ANG[l][i].f, Ys = new Float32Array(N);
    let mx = 0, iMax = 0, iMin = 0;
    for (let k = 0; k < N; k++) {
      const x = P.getX(k), y = P.getY(k), z = P.getZ(k), r = Math.hypot(x, y, z) || 1;
      const Y = f(x / r, y / r, z / r); Ys[k] = Y; mx = Math.max(mx, Math.abs(Y));
      if (Y > Ys[iMax]) iMax = k; if (Y < Ys[iMin]) iMin = k;
    }
    const cp = new THREE.Color(posHex), cn = new THREE.Color(negHex), col = new Float32Array(N * 3);
    const dirs = {};
    for (let k = 0; k < N; k++) {
      const x = P.getX(k), y = P.getY(k), z = P.getZ(k), r = Math.hypot(x, y, z) || 1;
      const s = l === 0 ? 1 : Math.pow(Math.abs(Ys[k]) / mx, 1.4);
      if (k === iMax) dirs.pos = new THREE.Vector3(x / r, y / r, z / r);
      if (k === iMin) dirs.neg = new THREE.Vector3(x / r, y / r, z / r);
      P.setXYZ(k, x / r * s, y / r * s, z / r * s);
      const c = Ys[k] >= 0 ? cp : cn; col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    if (l === 0) { dirs.pos = new THREE.Vector3(0.55, 0.3, 0.78).normalize(); dirs.neg = dirs.pos.clone().negate(); }
    if (!dirs.neg || Ys[iMin] >= 0) dirs.neg = dirs.pos.clone().negate();
    g.userData = dirs;
    return (geoCache[key] = g);
  }

  function makeView(canvas, labelsEl) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x0c1018, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 400);
    camera.up.set(0, 0, 1);
    scene.add(camera);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 0.75); key.position.set(2, 3, 4); camera.add(key);
    const rim = new THREE.DirectionalLight(0x9fb4ff, 0.3); rim.position.set(-3, -1, -2); camera.add(rim);
    const V = { renderer, scene, camera, az: -1.0, el: 0.38, dist: 6, fit: 6, zoom: 1, auto: true, visible: true, labels: [], labelsEl };
    V.reset = () => { V.az = -1.0; V.el = 0.38; V.zoom = 1; };
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(canvas); resize();
    new IntersectionObserver(es => { V.visible = es[0].isIntersecting; }).observe(canvas);
    let drag = null;
    canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", e => {
      if (!drag) return;
      V.az -= (e.clientX - drag.x) * 0.01; V.el = Math.max(-1.5, Math.min(1.5, V.el + (e.clientY - drag.y) * 0.01));
      drag = { x: e.clientX, y: e.clientY };
    });
    const end = () => { drag = null; };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("wheel", e => { e.preventDefault(); V.zoom = Math.max(0.15, Math.min(4, V.zoom * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
    canvas.addEventListener("dblclick", V.reset);
    V.dragging = () => !!drag;
    V.render = (dt) => {
      if (V.auto && !drag) V.az += dt * 0.35;
      V.dist += (V.fit * V.zoom - V.dist) * Math.min(1, dt * 6);
      const c = Math.cos(V.el);
      camera.position.set(V.dist * c * Math.cos(V.az), V.dist * c * Math.sin(V.az), V.dist * Math.sin(V.el));
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      // HTML labels that follow 3D points
      const w = canvas.clientWidth, h = canvas.clientHeight, v = new THREE.Vector3();
      let html = "";
      V.labels.forEach(lb => {
        v.copy(lb.p).project(camera);
        if (v.z > 1) return;
        html += `<span class="${lb.cls || ""}" style="left:${((v.x + 1) / 2 * w).toFixed(1)}px;top:${((1 - v.y) / 2 * h).toFixed(1)}px">${lb.t}</span>`;
      });
      if (labelsEl.innerHTML !== html) labelsEl.innerHTML = html;
    };
    return V;
  }
  function axesObj(len) {
    const g = new THREE.Group(), m = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    [[1,0,0],[0,1,0],[0,0,1]].forEach(a => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-a[0]*len, -a[1]*len, -a[2]*len), new THREE.Vector3(a[0]*len, a[1]*len, a[2]*len)]);
      g.add(new THREE.Line(geo, m));
    });
    return g;
  }
  const axisLabels = len => [["x", [1,0,0]], ["y", [0,1,0]], ["z", [0,0,1]]].map(([t, a]) => ({ t, cls: "ax", p: new THREE.Vector3(a[0] * len * 1.06, a[1] * len * 1.06, a[2] * len * 1.06) }));

  // ---------- Atom builder ----------
  const BCOL = [["#ff6b81", "#a3203a"], ["#ffb020", "#9a5400"], ["#4f95ff", "#1b4a96"], ["#3fd17f", "#156b3b"]];
  const shellScale = n => 0.6 + 0.45 * (n - 1);
  const B = { dotS: 1, newKey: null, ok: false, objs: new Map(), lastZ: null, anims: [], fade: true, curSub: null, maxN: 1 };
  if (HAS3) {
    B.view = makeView($("cvBuild"), $("bLabels"));
    B.axes = axesObj(1); B.view.scene.add(B.axes);
    // a tiny nucleus
    B.nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    B.view.scene.add(B.nucleus);
    B.dotGeo = new THREE.SphereGeometry(0.06, 18, 14);
    B.coneGeo = new THREE.ConeGeometry(0.03, 0.08, 12);
    B.dotMat = new THREE.MeshBasicMaterial({ color: 0xfff4d6 });
    B.dotNew = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    B.ok = true;
    $("bFade").addEventListener("change", e => { B.fade = e.target.checked; retarget(); });
    $("bAuto").addEventListener("change", e => { B.view.auto = e.target.checked; });
    $("bZin").addEventListener("click", () => { B.view.zoom = Math.max(0.15, B.view.zoom / 1.3); });
    $("bZout").addEventListener("click", () => { B.view.zoom = Math.min(4, B.view.zoom * 1.3); });
    $("bFit").addEventListener("click", B.view.reset);
  } else {
    $("bErr").hidden = false;
  }

  function makeDot(spinUp) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(B.dotGeo, B.dotMat));
    const cone = new THREE.Mesh(B.coneGeo, B.dotMat);
    cone.rotation.x = spinUp ? Math.PI / 2 : -Math.PI / 2;
    cone.position.z = spinUp ? 0.1 : -0.1;
    g.add(cone);
    return g;
  }
  function dotHome(ob, j) {
    const dirs = ob.mesh.geometry.userData;
    const d = j === 0 ? dirs.pos : dirs.neg;
    const r = ob.l === 0 ? ob.scale * 0.72 : ob.scale * 0.6;
    return d.clone().multiplyScalar(r);
  }
  function targetOpacity(ob) {
    if (ob.key === B.newKey) return 0.88;
    const cur = ob.sub === B.curSub;
    if (cur) return ob.e === 2 ? 0.5 : 0.28;
    if (B.fade) return ob.e === 2 ? 0.12 : 0.08;
    return ob.e === 2 ? 0.55 : 0.3;
  }
  function retarget() { B.objs.forEach(ob => { ob.opT = targetOpacity(ob); }); }

  function builderUpdate(Z, counts, d) {
    if (!B.ok) return;
    const animate = B.lastZ !== null && Z === B.lastZ + 1;
    B.lastZ = Z;
    const dur = Math.max(140, Math.min(800, (S.stepMs || +$("speed").value) * 0.9));
    B.curSub = d ? d.sub.name : null;
    B.newKey = d ? `${d.sub.n}-${d.sub.l}-${d.k <= d.sub.m ? d.k - 1 : d.k - d.sub.m - 1}` : null;
    const want = new Map();
    let maxN = 1;
    ORDER.forEach(o => {
      const c = counts[o.name]; if (!c) return;
      maxN = Math.max(maxN, o.n);
      for (let i = 0; i < o.m; i++) {
        const e = (i < Math.min(c, o.m) ? 1 : 0) + (i < c - o.m ? 1 : 0);
        if (e) want.set(`${o.n}-${o.l}-${i}`, { o, i, e });
      }
    });
    // remove orbitals no longer occupied
    B.objs.forEach((ob, k) => { if (!want.has(k)) { B.view.scene.remove(ob.root); B.objs.delete(k); } });
    const newDots = [];
    want.forEach((w, k) => {
      let ob = B.objs.get(k);
      if (!ob) {
        const geo = lobeGeo(w.o.l, w.i, BCOL[w.o.l][0], BCOL[w.o.l][1]);
        const mat = new THREE.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, shininess: 40, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = -w.o.n * 10 - w.o.l;
        const root = new THREE.Group(); root.add(mesh);
        const scale = shellScale(w.o.n) * (w.o.l === 0 ? 0.62 : 1);
        ob = { key: k, root, mesh, mat, l: w.o.l, n: w.o.n, i: w.i, sub: w.o.name, scale, e: 0, dots: [], grow: 1, pulse: 0 };
        mesh.scale.setScalar(scale);
        B.view.scene.add(root); B.objs.set(k, ob);
        if (animate) { ob.grow = 0; B.anims.push({ t: 0, dur: dur * 0.9, delay: dur * 0.35, step: e => { ob.grow = easeOutBack(e); } }); }
      }
      // adjust electrons in this orbital
      while (ob.dots.length > w.e) ob.root.remove(ob.dots.pop().g);
      while (ob.dots.length < w.e) {
        const j = ob.dots.length, g = makeDot(j === 0);
        const home = dotHome(ob, j);
        g.position.copy(home);
        ob.root.add(g);
        const dot = { g, home, ph: Math.random() * 6.28 };
        ob.dots.push(dot);
        if (animate) newDots.push({ ob, dot, paired: j === 1 });
      }
      ob.e = w.e;
    });
    retarget();
    B.objs.forEach(ob => { if (!animate) ob.mat.opacity = ob.opT; });
    // fly the new electron in
    newDots.forEach(({ ob, dot, paired }) => {
      dot.flying = true;
      dot.g.children.forEach(c => { c.material = B.dotNew; });
      const cam = B.view.camera;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      const R = shellScale(maxN) * 1.9;
      const start = right.clone().multiplyScalar(-R).add(up.clone().multiplyScalar(R * 0.75));
      B.anims.push({ t: 0, dur, step: (e, done) => {
        const k = easeInOut(e);
        dot.g.position.lerpVectors(start, dot.home, k).addScaledVector(up, Math.sin(Math.PI * k) * R * 0.25);
        dot.g.scale.setScalar(B.dotS * (2.2 - 1.2 * k));
        if (done) {
          dot.flying = false;
          if (paired) ob.pulse = 1;
          setTimeout(() => dot.g.children.forEach(c => { c.material = B.dotMat; }), 900);
        }
      } });
    });
    B.maxN = maxN;
    B.view.fit = shellScale(maxN) * 3.6 + 1.2;
    B.dotS = B.view.fit / 6.5;
    B.axes.scale.setScalar(shellScale(maxN) * 1.15);
    // overlay text
    if (d) {
      const box = d.k <= d.sub.m ? d.k - 1 : d.k - d.sub.m - 1;
      const spin = d.k <= d.sub.m ? "↑" : "↓";
      $("bTop").innerHTML = `Electron #${Z} → ${orbLabel(d.sub.n, d.sub.l, box)} ${spin}<span class="sm">${NAME[Z - 1]} · ${bRule(d)}</span>`;
    } else $("bTop").innerHTML = `Empty atom<span class="sm">Press + Electron to add the first one</span>`;
    $("bCfg").innerHTML = configHTML(counts, Z);
    $("bTitle").textContent = Z ? `Watch the atom build: ${NAME[Z - 1]}` : "Watch the atom build";
    // labels on the orbitals that are filling now
    const labs = [];
    B.objs.forEach(ob => {
      if (ob.sub !== B.curSub) return;
      const dirs = ob.mesh.geometry.userData;
      const tip = (ob.l === 0 ? new THREE.Vector3(0, 0, 1) : dirs.pos).clone().multiplyScalar(ob.scale * 1.12);
      labs.push({ t: orbLabel(ob.n, ob.l, ob.i), p: tip });
    });
    B.view.labels = labs.concat(axisLabels(shellScale(maxN) * 1.15));
  }
  function bRule(d) {
    const { sub, k } = d;
    if (k === 1) return sub.name === "1s" ? "lowest energy orbital first" : `new subshell: ${sub.name} is next in fill order`;
    if (sub.l === 0) return "second electron pairs with opposite spin";
    if (k <= sub.m) return "Hund's rule: empty orbital before pairing";
    return "all orbitals have one, so pairing starts";
  }
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  function builderFrame(dt, now) {
    if (!B.ok || !B.view.visible) return;
    B.anims = B.anims.filter(a => {
      if (a.delay) { a.delay -= dt * 1000; if (a.delay > 0) return true; a.delay = 0; }
      a.t += dt * 1000;
      const e = Math.min(1, a.t / a.dur);
      a.step(e, e >= 1);
      return e < 1;
    });
    B.objs.forEach(ob => {
      ob.mat.opacity += (ob.opT - ob.mat.opacity) * Math.min(1, dt * 5);
      if (ob.pulse > 0) ob.pulse = Math.max(0, ob.pulse - dt * 2.2);
      const s = ob.scale * Math.max(0.001, ob.grow) * (1 + 0.12 * Math.sin(Math.PI * ob.pulse));
      ob.mesh.scale.setScalar(s);
      ob.dots.forEach(dt_ => {
        if (dt_.flying) return;
        dt_.g.scale.setScalar(B.dotS);
        const w = 0.025 * ob.scale;
        dt_.g.position.set(dt_.home.x + w * Math.sin(now * 0.002 + dt_.ph), dt_.home.y + w * Math.cos(now * 0.0023 + dt_.ph), dt_.home.z + w * Math.sin(now * 0.0017 + dt_.ph * 2));
      });
    });
    B.view.render(dt);
  }

  // ---------- Simple shape explorer ----------
  const XLIST = [[0, 0], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4]];
  const XCAP = {
    "0-0": "A sphere. The electron is equally likely to be found in any direction. Every s orbital (1s, 2s, 3s…) has this shape; a bigger n just means a bigger sphere.",
    "1-0": "A dumbbell along the x-axis: two lobes on opposite sides of the nucleus, with opposite phase (color).",
    "1-1": "A dumbbell along the y-axis: two lobes on opposite sides of the nucleus, with opposite phase (color).",
    "1-2": "A dumbbell along the z-axis: two lobes on opposite sides of the nucleus, with opposite phase (color).",
    "2-0": "A four-leaf clover in the xy-plane, with its lobes pointing between the x and y axes.",
    "2-1": "A four-leaf clover in the yz-plane, with its lobes pointing between the y and z axes.",
    "2-2": "A four-leaf clover in the xz-plane, with its lobes pointing between the x and z axes.",
    "2-3": "A four-leaf clover in the xy-plane, with its lobes pointing right along the x and y axes.",
    "2-4": "Two lobes along the z-axis plus a donut around the middle. The odd one out of the d set."
  };
  const XSET = [
    "There is only one s orbital in each energy level.",
    "The three p orbitals point along x, y and z, at right angles to each other. Together they hold 6 electrons.",
    "The five d orbitals together hold 10 electrons. Three point between axes, one along x and y, and one along z."
  ];
  const XSETCOL = ["#ff8c4d", "#4da6ff", "#5cd18a", "#d58cff", "#ffd24d"];
  const X = { ok: false, sel: [1, 2], set: false, planes: true, objs: [] };
  if (HAS3) {
    X.view = makeView($("cvSimple"), $("xLabels"));
    X.view.fit = 5.2;
    X.view.scene.add(axesObj(1.45));
    X.group = new THREE.Group(); X.view.scene.add(X.group);
    X.ok = true;
    $("xSet").addEventListener("change", e => { X.set = e.target.checked; buildX(); });
    $("xPlanes").addEventListener("change", e => { X.planes = e.target.checked; buildX(); });
    $("xAuto").addEventListener("change", e => { X.view.auto = e.target.checked; });
    $("xFit").addEventListener("click", X.view.reset);
  } else $("xWrap").insertAdjacentHTML("beforeend", '<div class="vempty">3D view needs WebGL, which this browser has turned off.</div>');
  const xName = (l, i) => `${L[l]}${ANG[l][i].lab ? "<sub>" + ANG[l][i].lab + "</sub>" : ""}`;
  $("xPick").innerHTML = [0, 1, 2].map(l => `<span class="xgroup">${XLIST.filter(x => x[0] === l).map(([ll, i]) => `<button type="button" class="obtn" data-x="${ll}-${i}">${xName(ll, i)}</button>`).join("")}</span>`).join("");
  $("xPick").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { X.sel = b.dataset.x.split("-").map(Number); buildX(); }));

  function buildX() {
    const [l, i] = X.sel;
    $("xPick").querySelectorAll("button").forEach(b => b.classList.toggle("on", X.set ? +b.dataset.x[0] === l : b.dataset.x === `${l}-${i}`));
    $("xTitle").innerHTML = X.set ? `All ${L[l]} orbitals together` : `${xName(l, i)} orbital`;
    const a = ANG[l][i];
    const nPlanes = a.planes.length, nCones = a.cones.length;
    $("xInfo").innerHTML = X.set
      ? `<div>${XSET[l]}</div>`
      : `<div>${XCAP[l + "-" + i]}</div><div><span class="tag">Nodes</span>${l === 0 ? "No nodal planes." : nCones ? "Its nodes are two see-through cones, not flat planes." : `${nPlanes} nodal plane${nPlanes > 1 ? "s" : ""}: ${a.desc}.`} The electron is never found on a node.</div>`;
    if (!X.ok) return;
    while (X.group.children.length) X.group.remove(X.group.children[0]);
    const labs = axisLabels(1.45);
    const idxs = X.set ? ANG[l].map((_, j) => j) : [i];
    idxs.forEach((j, q) => {
      const geo = X.set ? lobeGeo(l, j, XSETCOL[q], XSETCOL[q]) : lobeGeo(l, j, "#ff8c4d", "#4da6ff");
      const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 50, transparent: X.set && l > 0, opacity: X.set && l > 0 ? 0.9 : 1, side: THREE.DoubleSide }));
      mesh.scale.setScalar(l === 0 ? 0.8 : 1.15);
      X.group.add(mesh);
      if (X.set && l > 0) labs.push({ t: xName(l, j), p: geo.userData.pos.clone().multiplyScalar(1.3) });
    });
    if (!X.set && X.planes && l > 0) {
      const pm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
      const em = new THREE.LineDashedMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, dashSize: 0.08, gapSize: 0.06 });
      a.planes.forEach(nv => {
        const n = new THREE.Vector3(...nv).normalize();
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), pm);
        plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.6, 2.6)), em);
        edge.computeLineDistances(); edge.quaternion.copy(plane.quaternion);
        X.group.add(plane, edge);
      });
      a.cones.forEach(deg => {
        const h = 0.85, r = h * Math.tan(deg * Math.PI / 180);
        [1, -1].forEach(sg => {
          const cg = new THREE.ConeGeometry(r, h, 48, 1, true);
          const cone = new THREE.Mesh(cg, pm);
          cone.rotation.x = sg > 0 ? -Math.PI / 2 : Math.PI / 2;
          cone.position.z = sg * h / 2;
          const ce = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.ConeGeometry(r, h, 16, 1, true)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 }));
          ce.rotation.copy(cone.rotation); ce.position.copy(cone.position);
          X.group.add(cone, ce);
        });
      });
    }
    X.view.labels = labs;
  }
  buildX();

  // one loop for both 3D views
  let last3 = performance.now();
  function loop3(now) {
    const dt = Math.min(0.05, (now - last3) / 1000); last3 = now;
    builderFrame(dt, now);
    if (X.ok && X.view.visible) X.view.render(dt);
    requestAnimationFrame(loop3);
  }
  if (HAS3) {
    if (reduce) { B.view.auto = false; X.view.auto = false; $("bAuto").checked = false; $("xAuto").checked = false; }
    requestAnimationFrame(loop3);
  }

  // ---------- Wire up ----------
  buildTable(); buildStrip(); buildOrb(); update();
  // Size the periodic table so the dashboard fits one laptop screen
  function fitLayout() {
    const dash = $("dash"), pt = $("pt");
    const wide = window.innerWidth >= 1000;
    dash.classList.toggle("fit", wide);
    const cols = S.layout === "long" ? 32 : 18;
    const rowsH = S.layout === "long" ? 7 : 9;
    const extra = S.layout === "long" ? 0 : 6;
    const tc = $("tableCard"), oc = $("orbCard");
    const tw = tc.clientWidth - 22 - 16 - (cols + 1) * 2;
    let cell = tw / cols;
    if (wide) {
      const avail = window.innerHeight - $("topbar").offsetHeight - 10 - 10 - 2;
      dash.style.setProperty("--dashH", Math.max(470, avail) + "px");
      const H = Math.max(470, avail);
      const head = 18, foot = tc.querySelector(".table-foot").offsetHeight + 5, pad = 18;
      const tableSpace = H - 175 - 10 - head - foot - pad - extra - (rowsH + 1) * 2;
      cell = Math.min(cell, tableSpace / rowsH);
    }
    cell = Math.max(18, Math.min(60, Math.floor(cell)));
    pt.style.setProperty("--cell", cell + "px");
    pt.classList.toggle("tiny", cell < 27);
  }
  fitLayout();
  window.addEventListener("resize", fitLayout);
  $("tLayout").addEventListener("change", () => requestAnimationFrame(fitLayout));
  $("bNext").addEventListener("click", () => { stop(); setZ(S.Z + 1); });
  $("bPrev").addEventListener("click", () => { stop(); setZ(S.Z - 1); });
  $("bReset").addEventListener("click", () => { stop(); setZ(0); });
  $("bPlay").addEventListener("click", play);
  $("speed").addEventListener("change", () => { if (S.timer) { stop(); play(); } });
  $("zSlider").addEventListener("input", e => { stop(); setZ(+e.target.value); });
  $("tActual").addEventListener("change", e => { S.actual = e.target.checked; update(); });
  $("tShort").addEventListener("change", e => { S.short = e.target.checked; update(); });
  $("tLayout").addEventListener("change", e => { S.layout = e.target.value; buildTable(); update(); });
  document.addEventListener("keydown", e => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "SELECT")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); stop(); setZ(S.Z + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); setZ(S.Z - 1); }
    else if (e.key === " " && t.tagName !== "BUTTON") { e.preventDefault(); play(); }
    else if (e.key === "Home") { e.preventDefault(); stop(); setZ(0); }
    else if (e.key === "End") { e.preventDefault(); stop(); setZ(118); }
  });
})();
