// ═══════════════════════════════════════════════════════════════════════════════
// FASE 8.5 - REPORTE MULTI-MONEDA
// Reportes con conversion a moneda base, export CSV/PDF, comparativo.
// Dependencia: FASE8_4
// Compatible con ERP Core v3.0 - Slots API
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  var PLUGIN_ID       = "FASE8_5";
  var PLUGIN_VERSION  = "3.0.0";
  var PLUGIN_NAME     = "Reporte Multi-Moneda";
  var PLUGIN_FASE     = 8;
  var PLUGIN_MICRO    = "8.5";
  var SCHEMA_REQ      = "3.0.0";
  var DEPENDENCIAS    = ["FASE8_4"];
  var PARENT_MODULE   = "fase8";

  var _erp = null;
  var initialized = false;

  function $(id) { return document.getElementById(id); }

  // ─── RENDERIZAR ───
  function renderTable() {
    var db = _erp.getDB();
    var materias = db.materiasPrimas || [];
    var categorias = db.categorias || [];

    // Resumen por moneda
    var totalVES = 0, totalUSD = 0, totalEUR = 0;
    for (var i = 0; i < materias.length; i++) {
      var m = materias[i];
      var costo = (m.stock || 0) * (m.costoUnitario || 0);
      var moneda = m.monedaCostoBase || "VES";
      totalVES += _erp.convertirMoneda(costo, moneda, "VES").monto;
      totalUSD += _erp.convertirMoneda(costo, moneda, "USD").monto;
      totalEUR += _erp.convertirMoneda(costo, moneda, "EUR").monto;
    }

    var resumen = $("f85_resumen");
    if (resumen) {
      resumen.innerHTML =
        '<div class="f85-kpi-card"><div class="f85-kpi-header"><span class="f85-kpi-title">Total VES</span></div><div class="f85-kpi-value">' + _erp.formatearMoneda(totalVES, "VES") + '</div></div>' +
        '<div class="f85-kpi-card"><div class="f85-kpi-header"><span class="f85-kpi-title">Total USD</span></div><div class="f85-kpi-value">' + _erp.formatearMoneda(totalUSD, "USD") + '</div></div>' +
        '<div class="f85-kpi-card"><div class="f85-kpi-header"><span class="f85-kpi-title">Total EUR</span></div><div class="f85-kpi-value">' + _erp.formatearMoneda(totalEUR, "EUR") + '</div></div>';
    }

    // Actualizar KPIs del padre
    _erp.updateKPI(PARENT_MODULE, "reporte-ves", _erp.formatearMoneda(totalVES, "VES"), "Inventario VES");
    _erp.updateKPI(PARENT_MODULE, "reporte-usd", _erp.formatearMoneda(totalUSD, "USD"), "Inventario USD");

    // Tabla por categoria
    var tbody = $("f85_tbody");
    if (!tbody) return;

    var html = "";
    for (var c = 0; c < categorias.length; c++) {
      var cat = categorias[c];
      var catItems = materias.filter(function(m) { return m.categoria === cat.nombre; });
      if (catItems.length === 0) continue;

      var stockTotal = catItems.reduce(function(s, m) { return s + (m.stock || 0); }, 0);
      var valVES = 0, valUSD = 0, valEUR = 0;
      for (var i = 0; i < catItems.length; i++) {
        var m = catItems[i];
        var costo = (m.stock || 0) * (m.costoUnitario || 0);
        var moneda = m.monedaCostoBase || "VES";
        valVES += _erp.convertirMoneda(costo, moneda, "VES").monto;
        valUSD += _erp.convertirMoneda(costo, moneda, "USD").monto;
        valEUR += _erp.convertirMoneda(costo, moneda, "EUR").monto;
      }

      html += '<tr>' +
        '<td><strong>' + cat.nombre + '</strong></td>' +
        '<td>' + catItems.length + '</td>' +
        '<td>' + stockTotal + '</td>' +
        '<td>' + _erp.formatearMoneda(valVES, "VES") + '</td>' +
        '<td>' + _erp.formatearMoneda(valUSD, "USD") + '</td>' +
        '<td>' + _erp.formatearMoneda(valEUR, "EUR") + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px">Sin datos</td></tr>';
  }

  // ─── EXPORTAR CSV ───
  function exportCSV() {
    var db = _erp.getDB();
    var materias = db.materiasPrimas || [];
    var csv = "Codigo,Nombre,Categoria,Stock,CostoBase,Moneda,ValorVES,ValorUSD,ValorEUR\n";
    for (var i = 0; i < materias.length; i++) {
      var m = materias[i];
      var costo = (m.stock || 0) * (m.costoUnitario || 0);
      var moneda = m.monedaCostoBase || "VES";
      var ves = _erp.convertirMoneda(costo, moneda, "VES").monto;
      var usd = _erp.convertirMoneda(costo, moneda, "USD").monto;
      var eur = _erp.convertirMoneda(costo, moneda, "EUR").monto;
      csv += (m.codigo || m.id) + "," + m.nombre + "," + (m.categoria || "") + "," + m.stock + "," + (m.costoUnitario || 0) + "," + moneda + "," + ves.toFixed(2) + "," + usd.toFixed(2) + "," + eur.toFixed(2) + "\n";
    }
    var blob = new Blob([csv], {type: "text/csv"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "Reporte_MultiMoneda_" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    _erp.showToast("success", "Export OK", "CSV descargado");
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    var btnExport = $("f85_btnExport");
    if (btnExport) btnExport.onclick = exportCSV;
  }

  // ─── HTML DEL CONTENIDO ───
  var CONTENT_HTML = '<div class="f85-wrapper">' +
    '<div class="f85-resumen" id="f85_resumen"></div>' +
    '<div class="f85-chart-card">' +
      '<div class="f85-chart-header">' +
        '<span class="f85-chart-title">Inventario Valorizado por Moneda</span>' +
        '<button class="btn btn-primary btn-sm" id="f85_btnExport"><i class="fas fa-file-csv"></i> Export CSV</button>' +
      '</div>' +
      '<div class="f85-table-wrapper">' +
        '<table class="data-table" id="f85_table">' +
          '<thead><tr><th>Categoria</th><th>Items</th><th>Stock Total</th><th>Valor VES</th><th>Valor USD</th><th>Valor EUR</th></tr></thead>' +
          '<tbody id="f85_tbody"></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ─── CSS SCOPED ───
  var PLUGIN_CSS = [
    '/* FASE8_5 - Reporte Multi-Moneda */',
    '#mod-fase8 .f85-wrapper { padding: 0; }',
    '#mod-fase8 .f85-resumen { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }',
    '#mod-fase8 .f85-kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase8 .f85-kpi-header { margin-bottom: 12px; }',
    '#mod-fase8 .f85-kpi-title { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; }',
    '#mod-fase8 .f85-kpi-value { font-size: 24px; font-weight: 700; color: #f1f5f9; }',
    '#mod-fase8 .f85-chart-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase8 .f85-chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }',
    '#mod-fase8 .f85-chart-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }',
    '#mod-fase8 .f85-table-wrapper { overflow-x: auto; }'
  ].join("\n");

  // ─── FUNCION PRINCIPAL DE RENDER ───
  function render() {
    if (!_erp) return;
    var tab5 = $("fase8-tab5-content");
    if (tab5) {
      tab5.innerHTML = CONTENT_HTML;
      tab5.style.display = "block";
    }
    bindEvents();
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

    _erp.enableButton(PARENT_MODULE, "exportar", exportCSV, "Exportar Reporte", "fa-file-export");

    _erp.activateTab(PARENT_MODULE, "5", function() {
      render();
    }, "Reporte Multi-Moneda");

    render();

    console.log("[" + PLUGIN_ID + "] Plugin inicializado correctamente v" + PLUGIN_VERSION);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // API GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════════

  window.FASE8_5 = {
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
    descripcion: "Reportes con conversion a moneda base, export CSV/PDF, comparativo.",
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