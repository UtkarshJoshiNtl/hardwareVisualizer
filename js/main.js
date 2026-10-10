// main.js — bootstrap, scene routing, animation loop.
//
// PROVIDED. Wires the views to the canvas and the control panel. You should not
// need to touch this; the learning happens in js/scenes/*.js.

import { createStore, DEFAULT_CONFIG } from "./state.js";
import * as R from "./render.js";
import { el, buildControls, buildLegend } from "./ui.js";
import cacheView from "./views/cacheView.js";
import coherenceView from "./views/coherenceView.js";
import reductionView from "./views/reductionView.js";

const VIEWS = [cacheView, coherenceView, reductionView];
const CACHE_CONTROLS = [
  { id: "blockBytes", label: "Cache line (bytes)", type: "select", options: [[8, "8 B"], [16, "16 B"], [32, "32 B"]], value: DEFAULT_CONFIG.blockBytes, global: true },
  { id: "numLines", label: "Cache lines", type: "select", options: [[4, "4"], [8, "8"], [16, "16"]], value: DEFAULT_CONFIG.numLines, global: true },
  { id: "assoc", label: "Associativity (ways)", type: "select", options: [[1, "1 (direct)"], [2, "2"], [4, "4"]], value: DEFAULT_CONFIG.assoc, global: true },
  { id: "policy", label: "Replacement", type: "select", options: [["LRU", "LRU"], ["FIFO", "FIFO"], ["Random", "Random"]], value: DEFAULT_CONFIG.policy, global: true },
];

const app = {
  cfg: createStore({ ...DEFAULT_CONFIG }),
  view: null,
  params: {},
  sceneState: null,
  running: false,
  interval: 90, // ms per step
  presets: {},
};

let canvas, ctx, W = 0, H = 0;

function defaults(view) {
  const p = {};
  for (const c of view.controls) p[c.id] = c.value;
  return p;
}

function resetScene() {
  const view = app.view;
  app.sceneState = view.create(app.cfg.get(), app.params);
  app.running = false;
  updatePlayBtn();
}

function setScene(id) {
  app.view = VIEWS.find((v) => v.id === id) || VIEWS[0];
  app.params = defaults(app.view);
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.id === id));
  document.getElementById("scene-title").textContent = app.view.title;
  document.getElementById("scene-subtitle").textContent = app.view.subtitle;
  buildControls(document.getElementById("controls"), controlsFor(app.view), app.params, onControl);
  buildLegend(document.getElementById("legend"), app.view.legend);
  buildPresets(app.view.id);
  resetScene();
}

function controlsFor(view) {
  return view.cacheControls ? [...view.controls, ...CACHE_CONTROLS] : view.controls;
}

function onControl(id, value) {
  const c = controlsFor(app.view).find((c) => c.id === id);
  if (c && c.global) {
    app.cfg.set({ [id]: value });
  } else {
    app.params[id] = value;
  }
  resetScene();
}

function onPreset(name) {
  const list = app.presets[app.view.id] || [];
  const preset = list.find((p) => p.name === name);
  if (!preset) return;
  app.params = { ...defaults(app.view), ...(preset.params || {}) };
  if (preset.cfg) app.cfg.set({ ...preset.cfg });
  buildControls(document.getElementById("controls"), controlsFor(app.view), app.params, onControl);
  resetScene();
  document.getElementById("presets").value = name;
}

function buildPresets(sceneId) {
  const sel = document.getElementById("presets");
  sel.innerHTML = "";
  sel.append(el("option", { value: "" }, "preset scenario…"));
  for (const p of app.presets[sceneId] || []) sel.append(el("option", { value: p.name }, p.name));
  sel.value = "";
}

function updatePlayBtn() {
  const b = document.getElementById("play");
  if (b) b.textContent = app.running ? "Pause ⏸" : "Play ▶";
}

function stepOnce() {
  if (!app.view.step(app)) {
    app.running = false;
    updatePlayBtn();
    return false;
  }
  return true;
}

function togglePlay() {
  // restarting a finished scene replays it
  const s = app.sceneState;
  if (!app.running && s && s.pointer != null && s.rounds && s.pointer >= s.rounds.length - 1) resetScene();
  if (!app.running && s && s.pointer != null && s.ops && s.pointer >= s.ops.length) resetScene();
  if (!app.running && s && s.pointer != null && s.indices && s.pointer >= s.indices.length) resetScene();
  app.running = !app.running;
  updatePlayBtn();
}

// ---- canvas sizing ----
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  W = rect.width;
  H = rect.height;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ---- main loop ----
let lastT = 0, acc = 0;
function frame(t) {
  if (!lastT) lastT = t;
  const dt = t - lastT;
  lastT = t;
  if (app.running) {
    acc += dt;
    while (acc >= app.interval) {
      acc -= app.interval;
      if (!stepOnce()) break;
    }
  }
  ctx.clearRect(0, 0, W, H);
  app.view.draw(ctx, W, H, app);
  requestAnimationFrame(frame);
}

async function init() {
  canvas = document.getElementById("stage");
  ctx = canvas.getContext("2d");

  try {
    const res = await fetch("data/presets.json");
    app.presets = await res.json();
  } catch (e) {
    app.presets = {};
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => setScene(tab.dataset.id));
  });
  document.getElementById("play").addEventListener("click", togglePlay);
  document.getElementById("step").addEventListener("click", () => { if (!app.running) stepOnce(); });
  document.getElementById("reset").addEventListener("click", resetScene);
  const speed = document.getElementById("speed");
  speed.addEventListener("input", () => { app.interval = Number(speed.value); });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); togglePlay(); }
    else if (e.code === "ArrowRight") { if (!app.running) stepOnce(); }
    else if (e.key.toLowerCase() === "r") resetScene();
    else if (e.key >= "1" && e.key <= String(VIEWS.length)) setScene(VIEWS[Number(e.key) - 1].id);
  });

  window.addEventListener("resize", resize);
  setScene(VIEWS[0].id);
  resize();
  requestAnimationFrame(frame);
}

init();
