// ═══════════════════════════════════════════════════════════════════════════════
// FASE 8.2 - TASAS DE CAMBIO
// Registro de tasas en formato natural. El usuario pone cuanto vale 1 USD/EUR en VES.
// Dependencia: FASE8_1
// Compatible con ERP Core v3.0 - Slots API
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  var PLUGIN_ID       = "FASE8_2";
  var PLUGIN_VERSION  = "3.0.0";
  var PLUGIN_NAME     = "Tasas de Cambio";
  var PLUGIN_FASE     = 8;
  var PLUGIN_MICRO    = "8.2";
  var SCHEMA_REQ      = "3.0.0";
  var DEPENDENCIAS    = ["FASE8_1"];
  var PARENT_MODULE   = "fase8";

  var _erp = null;
  var initialized = false;

  function $(id) { return document.getElementById(id); }

  // ─── RENDERIZAR ───
  function renderTable() {
    var db = _erp.getDB();
    var tasas = db.tasasCambio || [];
    var activa = null;
    for (var i = 0; i < tasas.length; i++) {
      if (tasas[i].activa) { activa = tasas[i]; break; }
    }

    var usdDisplay = $("f82_usd_ves_display");
    var eurDisplay = $("f82_eur_ves_display");
    var usdEurDisplay = $("f82_usd_eur_display");

    if (activa) {
      if (usdDisplay) usdDisplay.textContent = _erp.formatearMoneda(activa.usd_a_ves, "VES");
      if (eurDisplay) eurDisplay.textContent = _erp.formatearMoneda(activa.eur_a_ves, "VES");
      if (usdEurDisplay) usdEurDisplay.textContent = activa.usd_a_eur.toFixed(4);
    } else {
      if (usdDisplay) usdDisplay.textContent = "-";
      if (eurDisplay) eurDisplay.textContent = "-";
      if (usdEurDisplay) usdEurDisplay.textContent = "-";
    }

    var tbody = $("f82_tbody");
    if (!tbody) return;
    if (tasas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px">No hay tasas registradas</td></tr>';
      return;
    }

    var html = "";
    for (var i = 0; i < Math.min(tasas.length, 20); i++) {
      var t = tasas[i];
      html += '<tr>' +
        '<td>' + t.fecha + '</td>' +
        '<td>' + _erp.formatearMoneda(t.usd_a_ves, "VES") + '</td>' +
        '<td>' + _erp.formatearMoneda(t.eur_a_ves, "VES") + '</td>' +
        '<td>' + t.usd_a_eur.toFixed(4) + '</td>' +
        '<td>' + (t.activa ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-secondary">Inactiva</span>') + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = html;

    // Actualizar KPIs del padre
    _erp.updateKPI(PARENT_MODULE, "tasa-usd", activa ? _erp.formatearMoneda(activa.usd_a_ves, "VES") : "-", "USD->VES");
    _erp.updateKPI(PARENT_MODULE, "tasa-eur", activa ? _erp.formatearMoneda(activa.eur_a_ves, "VES") : "-", "EUR->VES");
  }

  // ─── GUARDAR TASA ───
  function guardarTasa() {
    var db = _erp.getDB();
    if (!db.tasasCambio) db.tasasCambio = [];

    var usd_ves = parseFloat($("f82_input_usd_ves").value) || 0;
    var eur_ves = parseFloat($("f82_input_eur_ves").value) || 0;
    var usd_eur = parseFloat($("f82_input_usd_eur").value) || 0;

    if (usd_ves <= 0) {
      _erp.showToast("error", "Error", "La tasa USD -> VES debe ser mayor a 0");
      return;
    }

    var ves_a_usd = 1 / usd_ves;
    var ves_a_eur = eur_ves > 0 ? 1 / eur_ves : 0;
    var eur_a_usd = usd_eur > 0 ? 1 / usd_eur : 0;

    var nueva = {
      id: _erp.genId("TASA"),
      fecha: new Date().toISOString().split("T")[0],
      usd_a_ves: usd_ves,
      eur_a_ves: eur_ves,
      usd_a_eur: usd_eur,
      ves_a_usd: ves_a_usd,
      ves_a_eur: ves_a_eur,
      eur_a_usd: eur_a_usd,
      activa: true,
      tipo: "manual"
    };

    for (var i = 0; i < db.tasasCambio.length; i++) {
      db.tasasCambio[i].activa = false;
    }

    db.tasasCambio.unshift(nueva);
    _erp.saveLocal(db);
    renderTable();

    _erp.showToast("success", "Tasa Guardada",
      "1 USD = " + usd_ves + " VES | 1 VES = " + ves_a_usd.toFixed(6) + " USD");

    if (window.FASE8_PADRE && window.FASE8_PADRE.render) {
      window.FASE8_PADRE.render();
    }
  }

  // ─── CARGAR DEMO ───
  function cargarDemo() {
    $("f82_input_usd_ves").value = "700";
    $("f82_input_eur_ves").value = "780";
    $("f82_input_usd_eur").value = "0.90";
    _erp.showToast("info", "Demo", "Tasa demo cargada. Toca Guardar para aplicar.");
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    var btnGuardar = $("f82_btnGuardar");
    var btnDemo = $("f82_btnDemo");
    if (btnGuardar) btnGuardar.onclick = guardarTasa;
    if (btnDemo) btnDemo.onclick = cargarDemo;
  }

  // ─── HTML DEL CONTENIDO ───
  var CONTENT_HTML = '<div class="f82-wrapper">' +
    '<div class="f82-kpi-grid">' +
      '<div class="f82-kpi-card">' +
        '<div class="f82-kpi-header"><span class="f82-kpi-title">1 USD =</span><div class="f82-kpi-icon blue"><i class="fas fa-dollar-sign"></i></div></div>' +
        '<div class="f82-kpi-value" id="f82_usd_ves_display">-</div>' +
        '<div class="f82-kpi-change">Bolivares</div>' +
      '</div>' +
      '<div class="f82-kpi-card">' +
        '<div class="f82-kpi-header"><span class="f82-kpi-title">1 EUR =</span><div class="f82-kpi-icon green"><i class="fas fa-euro-sign"></i></div></div>' +
        '<div class="f82-kpi-value" id="f82_eur_ves_display">-</div>' +
        '<div class="f82-kpi-change">Bolivares</div>' +
      '</div>' +
      '<div class="f82-kpi-card">' +
        '<div class="f82-kpi-header"><span class="f82-kpi-title">1 USD =</span><div class="f82-kpi-icon amber"><i class="fas fa-exchange-alt"></i></div></div>' +
        '<div class="f82-kpi-value" id="f82_usd_eur_display">-</div>' +
        '<div class="f82-kpi-change">Euros</div>' +
      '</div>' +
    '</div>' +
    '<div class="f82-tasa-card">' +
      '<div class="f82-panel-title"><i class="fas fa-plus"></i> Registrar Tasa del Dia</div>' +
      '<p style="color:#94a3b8; font-size:13px; margin-bottom:16px">Ingresa la tasa en formato natural. Ejemplo: si 1 dolar cuesta 700 Bs, escribe 700.</p>' +
      '<div class="f82-tasa-form">' +
        '<div class="f82-tasa-input-group">' +
          '<label>1 USD equivale a cuantos VES?</label>' +
          '<input type="number" step="0.01" id="f82_input_usd_ves" placeholder="Ejemplo: 700">' +
          '<div class="f82-tasa-ejemplo">Si 1 dolar = 700 Bs, escribe 700</div>' +
        '</div>' +
        '<div class="f82-tasa-input-group">' +
          '<label>1 EUR equivale a cuantos VES?</label>' +
          '<input type="number" step="0.01" id="f82_input_eur_ves" placeholder="Ejemplo: 780">' +
          '<div class="f82-tasa-ejemplo">Si 1 euro = 780 Bs, escribe 780</div>' +
        '</div>' +
        '<div class="f82-tasa-input-group">' +
          '<label>1 USD equivale a cuantos EUR?</label>' +
          '<input type="number" step="0.0001" id="f82_input_usd_eur" placeholder="Ejemplo: 0.90">' +
          '<div class="f82-tasa-ejemplo">Si 1 dolar = 0.90 EUR, escribe 0.90</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px">' +
        '<button class="btn btn-primary" id="f82_btnGuardar"><i class="fas fa-save"></i> Guardar Tasa</button>' +
        '<button class="btn btn-secondary" id="f82_btnDemo"><i class="fas fa-database"></i> Cargar Tasa Demo</button>' +
      '</div>' +
    '</div>' +
    '<div class="f82-chart-card">' +
      '<div class="f82-chart-header"><span class="f82-chart-title">Historial de Tasas</span></div>' +
      '<div class="f82-table-wrapper">' +
        '<table class="data-table" id="f82_table">' +
          '<thead><tr><th>Fecha</th><th>1 USD &rarr; VES</th><th>1 EUR &rarr; VES</th><th>1 USD &rarr; EUR</th><th>Estado</th></tr></thead>' +
          '<tbody id="f82_tbody"></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ─── CSS SCOPED ───
  var PLUGIN_CSS = [
    '/* FASE8_2 - Tasas de Cambio */',
    '#mod-fase8 .f82-wrapper { padding: 0; }',
    '#mod-fase8 .f82-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }',
    '#mod-fase8 .f82-kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase8 .f82-kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }',
    '#mod-fase8 .f82-kpi-title { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; }',
    '#mod-fase8 .f82-kpi-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }',
    '#mod-fase8 .f82-kpi-icon.blue { background: rgba(59,130,246,.15); color: #3b82f6; }',
    '#mod-fase8 .f82-kpi-icon.green { background: rgba(16,185,129,.15); color: #10b981; }',
    '#mod-fase8 .f82-kpi-icon.amber { background: rgba(245,158,11,.15); color: #f59e0b; }',
    '#mod-fase8 .f82-kpi-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }',
    '#mod-fase8 .f82-kpi-change { font-size: 12px; color: #94a3b8; margin-top: 4px; }',
    '#mod-fase8 .f82-tasa-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 16px; }',
    '#mod-fase8 .f82-panel-title { font-size: 16px; font-weight: 600; color: #f1f5f9; margin-bottom: 12px; }',
    '#mod-fase8 .f82-tasa-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px; }',
    '#mod-fase8 .f82-tasa-input-group { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; }',
    '#mod-fase8 .f82-tasa-input-group label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }',
    '#mod-fase8 .f82-tasa-input-group input { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #f1f5f9; font-size: 16px; }',
    '#mod-fase8 .f82-tasa-ejemplo { font-size: 11px; color: #64748b; margin-top: 6px; }',
    '#mod-fase8 .f82-chart-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase8 .f82-chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }',
    '#mod-fase8 .f82-chart-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }',
    '#mod-fase8 .f82-table-wrapper { overflow-x: auto; }'
  ].join("\n");

  // ─── FUNCION PRINCIPAL DE RENDER ───
  function render() {
    if (!_erp) return;
    var tab2 = $("fase8-tab2-content");
    if (tab2) {
      tab2.innerHTML = CONTENT_HTML;
      tab2.style.display = "block";
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

    _erp.enableButton(PARENT_MODULE, "nuevo-mov", guardarTasa, "Guardar Tasa", "fa-save");
    _erp.enableButton(PARENT_MODULE, "inventario", cargarDemo, "Cargar Demo", "fa-database");

    _erp.activateTab(PARENT_MODULE, "2", function() {
      render();
    }, "Tasas de Cambio");

    render();

    console.log("[" + PLUGIN_ID + "] Plugin inicializado correctamente v" + PLUGIN_VERSION);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // API GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════════

  window.FASE8_2 = {
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
    descripcion: "Registro de tasas en formato natural. El usuario pone cuanto vale 1 USD/EUR en VES.",
    schemaVersionRequerida: SCHEMA_REQ,
    dependencias: DEPENDENCIAS,
    menu: null,
    schema: { tasasCambio: [] },
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