// ═══════════════════════════════════════════════════════════════════════════════
// FASE 8.4 - PRECIOS MULTI-MONEDA
// Precios en VES/USD/EUR para materias primas y productos terminados.
// Dependencia: FASE8_3
// Compatible con ERP Core v3.0 - Slots API
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  var PLUGIN_ID       = "FASE8_4";
  var PLUGIN_VERSION  = "3.0.0";
  var PLUGIN_NAME     = "Precios Multi-Moneda";
  var PLUGIN_FASE     = 8;
  var PLUGIN_MICRO    = "8.4";
  var SCHEMA_REQ      = "3.0.0";
  var DEPENDENCIAS    = ["FASE8_3"];
  var PARENT_MODULE   = "fase8";

  var _erp = null;
  var initialized = false;

  function $(id) { return document.getElementById(id); }

  // ─── RENDERIZAR TABLA ───
  function renderTable() {
    var db = _erp.getDB();
    var materias = db.materiasPrimas || [];
    var tbody = $("f84_tbody");
    if (!tbody) return;

    if (materias.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px">No hay materias primas registradas</td></tr>';
      return;
    }

    var html = "";
    for (var i = 0; i < materias.length; i++) {
      var m = materias[i];
      var costo = m.costoUnitario || 0;
      var moneda = m.monedaCostoBase || "VES";

      var ves = _erp.convertirMoneda(costo, moneda, "VES").monto;
      var usd = _erp.convertirMoneda(costo, moneda, "USD").monto;
      var eur = _erp.convertirMoneda(costo, moneda, "EUR").monto;

      html += '<tr>' +
        '<td>' + (m.codigo || m.id) + '</td>' +
        '<td>' + m.nombre + '</td>' +
        '<td>' + _erp.formatearMoneda(costo, moneda) + '</td>' +
        '<td>' + _erp.formatearMoneda(ves, "VES") + '</td>' +
        '<td>' + _erp.formatearMoneda(usd, "USD") + '</td>' +
        '<td>' + _erp.formatearMoneda(eur, "EUR") + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = html;

    // KPIs del padre
    var totalVES = 0, totalUSD = 0, totalEUR = 0;
    for (var i = 0; i < materias.length; i++) {
      var m = materias[i];
      var costo = (m.stock || 0) * (m.costoUnitario || 0);
      var moneda = m.monedaCostoBase || "VES";
      totalVES += _erp.convertirMoneda(costo, moneda, "VES").monto;
      totalUSD += _erp.convertirMoneda(costo, moneda, "USD").monto;
      totalEUR += _erp.convertirMoneda(costo, moneda, "EUR").monto;
    }
    _erp.updateKPI(PARENT_MODULE, "precio-ves", _erp.formatearMoneda(totalVES, "VES"), "Total VES");
    _erp.updateKPI(PARENT_MODULE, "precio-usd", _erp.formatearMoneda(totalUSD, "USD"), "Total USD");
  }

  // ─── HTML DEL CONTENIDO ───
  var CONTENT_HTML = '<div class="f84-wrapper">' +
    '<div class="f84-chart-card">' +
      '<div class="f84-chart-header"><span class="f84-chart-title">Materias Primas - Precios en 3 Monedas</span></div>' +
      '<div class="f84-table-wrapper">' +
        '<table class="data-table" id="f84_table">' +
          '<thead><tr><th>Codigo</th><th>Nombre</th><th>Costo Base</th><th>En VES</th><th>En USD</th><th>En EUR</th></tr></thead>' +
          '<tbody id="f84_tbody"></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ─── CSS SCOPED ───
  var PLUGIN_CSS = [
    '/* FASE8_4 - Precios Multi-Moneda */',
    '#mod-fase8 .f84-wrapper { padding: 0; }',
    '#mod-fase8 .f84-chart-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase8 .f84-chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }',
    '#mod-fase8 .f84-chart-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }',
    '#mod-fase8 .f84-table-wrapper { overflow-x: auto; }'
  ].join("\n");

  // ─── FUNCION PRINCIPAL DE RENDER ───
  function render() {
    if (!_erp) return;
    var tab4 = $("fase8-tab4-content");
    if (tab4) {
      tab4.innerHTML = CONTENT_HTML;
      tab4.style.display = "block";
    }
    renderTable();
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

    _erp.activateTab(PARENT_MODULE, "4", function() {
      render();
    }, "Precios Multi-Moneda");

    render();

    console.log("[" + PLUGIN_ID + "] Plugin inicializado correctamente v" + PLUGIN_VERSION);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // API GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════════

  window.FASE8_4 = {
    PLUGIN_ID: PLUGIN_ID,
    PLUGIN_VERSION: PLUGIN_VERSION,
    PLUGIN_NAME: PLUGIN_NAME,
    parentModule: PARENT_MODULE,
    render: render,
    refresh: function() { renderTable(); }
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
    descripcion: "Precios en VES/USD/EUR para materias primas y productos terminados.",
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