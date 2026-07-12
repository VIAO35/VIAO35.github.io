// ═══════════════════════════════════════════════════════════════════════════════
// FASE 8.3 - CONVERSION AUTOMATICA
// Conversion automatica entre monedas usando tasas del dia.
// Dependencia: FASE8_2
// Compatible con ERP Core v3.0 - Slots API
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  var PLUGIN_ID       = "FASE8_3";
  var PLUGIN_VERSION  = "3.0.0";
  var PLUGIN_NAME     = "Conversion Automatica";
  var PLUGIN_FASE     = 8;
  var PLUGIN_MICRO    = "8.3";
  var SCHEMA_REQ      = "3.0.0";
  var DEPENDENCIAS    = ["FASE8_2"];
  var PARENT_MODULE   = "fase8";

  var _erp = null;
  var initialized = false;

  function $(id) { return document.getElementById(id); }

  // ─── CALCULAR CONVERSION ───
  function calcular() {
    var monto = parseFloat($("f83_monto").value) || 0;
    var desde = $("f83_desde").value;
    var hasta = $("f83_hasta").value;

    var db = _erp.getDB();
    var tasas = db.tasasCambio || [];
    var tasa = null;
    for (var i = 0; i < tasas.length; i++) {
      if (tasas[i].activa) { tasa = tasas[i]; break; }
    }

    var resultadoEl = $("f83_resultado");
    var formulaEl = $("f83_formula");
    var tasaInfoEl = $("f83_tasaInfo");

    if (!tasa) {
      if (resultadoEl) resultadoEl.textContent = "-";
      if (formulaEl) formulaEl.textContent = "No hay tasa activa. Ve a Tasas de Cambio primero.";
      if (tasaInfoEl) tasaInfoEl.textContent = "Registra una tasa primero";
      return;
    }

    var resultado = 0;
    var formula = "";
    var factor = 0;

    if (desde === hasta) {
      resultado = monto;
      formula = monto + " " + desde + " = " + monto + " " + hasta;
      factor = 1;
    }
    else if (desde === "VES" && hasta === "USD") {
      factor = tasa.ves_a_usd || 0;
      resultado = monto * factor;
      formula = monto + " VES x " + factor.toFixed(6) + " = " + resultado.toFixed(4) + " USD";
    }
    else if (desde === "USD" && hasta === "VES") {
      factor = tasa.usd_a_ves || 0;
      resultado = monto * factor;
      formula = monto + " USD x " + factor.toFixed(2) + " = " + resultado.toFixed(2) + " VES";
    }
    else if (desde === "VES" && hasta === "EUR") {
      factor = tasa.ves_a_eur || 0;
      resultado = monto * factor;
      formula = monto + " VES x " + factor.toFixed(6) + " = " + resultado.toFixed(4) + " EUR";
    }
    else if (desde === "EUR" && hasta === "VES") {
      factor = tasa.eur_a_ves || 0;
      resultado = monto * factor;
      formula = monto + " EUR x " + factor.toFixed(2) + " = " + resultado.toFixed(2) + " VES";
    }
    else if (desde === "USD" && hasta === "EUR") {
      factor = tasa.usd_a_eur || 0;
      resultado = monto * factor;
      formula = monto + " USD x " + factor.toFixed(4) + " = " + resultado.toFixed(4) + " EUR";
    }
    else if (desde === "EUR" && hasta === "USD") {
      factor = tasa.eur_a_usd || 0;
      resultado = monto * factor;
      formula = monto + " EUR x " + factor.toFixed(4) + " = " + resultado.toFixed(4) + " USD";
    }

    var simbolos = {VES: "Bs.", USD: "$", EUR: "\u20ac"};
    if (resultadoEl) resultadoEl.textContent = simbolos[hasta] + " " + resultado.toLocaleString("es-VE", {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (formulaEl) formulaEl.textContent = formula;
    if (tasaInfoEl) tasaInfoEl.textContent = "Tasa del " + tasa.fecha + " | Factor: " + factor.toFixed(6);
  }

  // ─── CONVERSIONES RAPIDAS ───
  function rapidas() {
    var db = _erp.getDB();
    var container = $("f83_rapidas");
    if (!container) return;

    var tasas = db.tasasCambio || [];
    var tasa = null;
    for (var i = 0; i < tasas.length; i++) {
      if (tasas[i].activa) { tasa = tasas[i]; break; }
    }

    if (!tasa) {
      container.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:20px">Registra una tasa en "Tasas de Cambio" primero</div>';
      return;
    }

    var html = "";
    var conversions = [
      {m: 1, from: "USD", to: "VES", val: tasa.usd_a_ves},
      {m: 1, from: "EUR", to: "VES", val: tasa.eur_a_ves},
      {m: 1, from: "USD", to: "EUR", val: tasa.usd_a_eur},
      {m: 1000, from: "VES", to: "USD", val: (tasa.ves_a_usd || 0) * 1000}
    ];

    for (var i = 0; i < conversions.length; i++) {
      var c = conversions[i];
      html += '<div class="f83-kpi-card">' +
        '<div class="f83-kpi-header"><span class="f83-kpi-title">' + c.m + ' ' + c.from + ' &rarr; ' + c.to + '</span></div>' +
        '<div class="f83-kpi-value">' + _erp.formatearMoneda(c.val, c.to) + '</div>' +
      '</div>';
    }
    container.innerHTML = html;
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    var montoEl = $("f83_monto");
    var desdeEl = $("f83_desde");
    var hastaEl = $("f83_hasta");
    if (montoEl) montoEl.oninput = calcular;
    if (desdeEl) desdeEl.onchange = calcular;
    if (hastaEl) hastaEl.onchange = calcular;
  }

  // ─── HTML DEL CONTENIDO ───
  var CONTENT_HTML = '<div class="f83-wrapper">' +
    '<div class="f83-calc-panel">' +
      '<div class="f83-calc-row">' +
        '<span class="f83-calc-label">Monto:</span>' +
        '<input type="number" class="f83-calc-input" id="f83_monto" value="1000">' +
      '</div>' +
      '<div class="f83-calc-row">' +
        '<span class="f83-calc-label">De:</span>' +
        '<select class="f83-calc-select" id="f83_desde">' +
          '<option value="VES">VES (Bolivar)</option>' +
          '<option value="USD">USD (Dolar)</option>' +
          '<option value="EUR">EUR (Euro)</option>' +
        '</select>' +
      '</div>' +
      '<div class="f83-calc-row">' +
        '<span class="f83-calc-label">A:</span>' +
        '<select class="f83-calc-select" id="f83_hasta">' +
          '<option value="USD" selected>USD (Dolar)</option>' +
          '<option value="VES">VES (Bolivar)</option>' +
          '<option value="EUR">EUR (Euro)</option>' +
        '</select>' +
      '</div>' +
      '<div class="f83-formula-box" id="f83_formula">Ingresa un monto para convertir</div>' +
      '<div class="f83-divider"></div>' +
      '<div class="f83-calc-result" id="f83_resultado">-</div>' +
      '<div class="f83-tasa-info" id="f83_tasaInfo">Registra una tasa en "Tasas de Cambio" primero</div>' +
    '</div>' +
    '<div class="f83-chart-card">' +
      '<div class="f83-chart-header"><span class="f83-chart-title">Conversiones Rapidas (1 unidad)</span></div>' +
      '<div class="f83-kpi-grid" id="f83_rapidas"></div>' +
    '</div>' +
  '</div>';

  // ─── CSS SCOPED ───
  var PLUGIN_CSS = [
    '/* FASE8_3 - Conversion Automatica */',
    '#mod-fase8 .f83-wrapper { padding: 0; }',
    '#mod-fase8 .f83-calc-panel { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto 24px; }',
    '#mod-fase8 .f83-calc-result { font-size: 32px; font-weight: 700; color: #3b82f6; text-align: center; margin: 16px 0; }',
    '#mod-fase8 .f83-calc-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }',
    '#mod-fase8 .f83-calc-label { font-size: 13px; color: #94a3b8; min-width: 80px; }',
    '#mod-fase8 .f83-calc-input { flex: 1; padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 16px; }',
    '#mod-fase8 .f83-calc-select { padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 14px; }',
    '#mod-fase8 .f83-formula-box { background: #334155; border-radius: 8px; padding: 12px; margin: 12px 0; font-family: monospace; font-size: 13px; color: #94a3b8; text-align: center; }',
    '#mod-fase8 .f83-divider { border-top: 1px solid #334155; margin: 16px 0; }',
    '#mod-fase8 .f83-tasa-info { text-align: center; font-size: 12px; color: #64748b; margin-top: 8px; }',
    '#mod-fase8 .f83-chart-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase8 .f83-chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }',
    '#mod-fase8 .f83-chart-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }',
    '#mod-fase8 .f83-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }',
    '#mod-fase8 .f83-kpi-card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; text-align: center; }',
    '#mod-fase8 .f83-kpi-header { margin-bottom: 8px; }',
    '#mod-fase8 .f83-kpi-title { font-size: 12px; color: #94a3b8; }',
    '#mod-fase8 .f83-kpi-value { font-size: 20px; font-weight: 600; color: #f1f5f9; }'
  ].join("\n");

  // ─── FUNCION PRINCIPAL DE RENDER ───
  function render() {
    if (!_erp) return;
    var tab3 = $("fase8-tab3-content");
    if (tab3) {
      tab3.innerHTML = CONTENT_HTML;
      tab3.style.display = "block";
    }
    bindEvents();
    calcular();
    rapidas();
  }

  // ─── INICIALIZAR PLUGIN ───
  function initPlugin() {
    if (initialized) return;
    initialized = true;

    var styleId = "erp-css-" + PLUGIN_ID;
    var existente = $(styleId);
    if (existente) existente.remove();
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);

    _erp.activateTab(PARENT_MODULE, "3", function() {
      render();
    }, "Conversor");

    render();

    console.log("[" + PLUGIN_ID + "] Plugin inicializado correctamente v" + PLUGIN_VERSION);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // API GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════════

  window.FASE8_3 = {
    PLUGIN_ID: PLUGIN_ID,
    PLUGIN_VERSION: PLUGIN_VERSION,
    PLUGIN_NAME: PLUGIN_NAME,
    parentModule: PARENT_MODULE,
    render: render,
    calcular: calcular,
    refresh: function() { calcular(); rapidas(); }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEFINICION DEL PLUGIN
  // ═══════════════════════════════════════════════════════════════════════════════

  var pluginDef = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: PLUGIN_FASE,
    microFase: PLUGIN_MICRO,
    autor: "VIAO35",
    descripcion: "Conversion automatica entre monedas usando tasas del dia.",
    schemaVersionRequerida: SCHEMA_REQ,
    dependencias: DEPENDENCIAS,
    menu: null,
    schema: {},
    css: PLUGIN_CSS,
    html: "",
    init: function(erp) {
      _erp = erp;
      setTimeout(function() { initPlugin(); }, 200);
    },
    onShow: function(erp) {
      _erp = erp;
      if (!initialized) { initPlugin(); } else { render(); }
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(pluginDef);
    console.log("[" + PLUGIN_ID + "] Plugin registrado correctamente v" + PLUGIN_VERSION);
  } else {
    console.error("[" + PLUGIN_ID + "] ERP no disponible. No se pudo registrar.");
  }
})();