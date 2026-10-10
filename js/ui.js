// ui.js — DOM helpers and the control panel.
//
// PROVIDED. Builds sliders/selects/buttons from a scene's control descriptors.

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function buildControls(container, controls, values, onChange) {
  container.innerHTML = "";
  for (const c of controls) {
    const row = el("div", { class: "control" });
    row.append(el("label", { class: "control-label" }, c.label));

    if (c.type === "select") {
      const sel = el("select", {
        onchange: (e) => onChange(c.id, numeric(e.target.value, c.options)),
      });
      for (const [val, label] of c.options) {
        const opt = el("option", { value: val }, label);
        if (String(values[c.id]) === String(val)) opt.selected = true;
        sel.append(opt);
      }
      row.append(sel);
    } else if (c.type === "range") {
      const out = el("span", { class: "range-value" }, String(values[c.id]));
      const input = el("input", {
        type: "range", min: c.min, max: c.max, step: c.step, value: values[c.id],
        oninput: (e) => {
          out.textContent = e.target.value;
          onChange(c.id, Number(e.target.value));
        },
      });
      row.append(input, out);
    } else if (c.type === "button") {
      row.append(el("button", { onclick: () => onChange(c.id, true) }, c.label));
    }
    container.append(row);
  }
}

function numeric(v, options) {
  if (options && options.length && typeof options[0][0] === "number") return Number(v);
  if (v === "true") return true;
  if (v === "false") return false;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

export function buildLegend(container, items) {
  container.innerHTML = "";
  for (const it of items) {
    container.append(
      el("span", { class: "legend-item" },
        el("span", { class: "legend-swatch", style: `background:${it.color}` }),
        it.label),
    );
  }
}
