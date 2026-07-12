// ═══════════════════════════════════════════════════════════════════════════════
// FASE 8.1 - MONEDAS CRUD (Micro-fase anidada)
// CRUD de monedas: VES, USD, EUR. Simbolos, decimales, moneda base.
// Dependencia: FASE1_10
// Compatible con ERP Core v3.0 - Slots API
// Se inyecta en tab "monedas" del modulo padre fase8
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  var PLUGIN_ID       = "FASE8_1";
  var PLUGIN_VERSION  = "3.0.0";
  var PLUGIN_NAME     = "Monedas CRUD";
  var PLUGIN_FASE     = 8;
  var PLUGIN_MICRO    = "8.1";
  var SCHEMA_REQ      = "3.0.0";
  var DEPENDENCIAS    = ["FASE1_10"];
  var PARENT_MODULE   = "fase8";

  var _erp = null;
  var editingId = null;
  var initialized = false;

  function $(id) { return document.getElementById(id); }

  // ─── RENDERIZAR TABLA ───
  function renderTable() {
    var db = _erp.getDB();
    var monedas = db.monedas || [];
    var tbody = $("f81_tbody");
    if (!tbody) return;

    if (monedas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:20px">No hay monedas configuradas</td></tr>';
    } else {
      var html = "";
      for (var i = 0; i < monedas.length; i++) {
        var m = monedas[i];
        html += '<tr>' +
          '<td><strong>' + m.codigo + '</strong></td>' +
          '<td>' + m.nombre + '</td>' +
          '<td>' + m.simbolo + '</td>' +
          '<td>' + m.decimales + '</td>' +
          '<td>' + (m.esBase ? '<span class="badge badge-success">SI</span>' : '<span class="badge badge-secondary">NO</span>') + '</td>' +
          '<td class="actions">' +
            '<button class="btn btn-primary btn-sm" onclick="window.FASE8_1.editMoneda('' + m.codigo + '')"><i class="fas fa-edit"></i></button>' +
          '</td>' +
        '</tr>';
      }
      tbody.innerHTML = html;
    }

    // Actualizar KPIs del MODULO PADRE
    _erp.updateKPI(PARENT_MODULE, "monedas-count", monedas.length, monedas.length + " monedas");

    // Actualizar cards grid
    var grid = $("f81_monedasGrid");
    if (grid) {
      var html = "";
      for (var i = 0; i < monedas.length; i++) {
        var m = monedas[i];
        html += '<div class="moneda-card">' +
          '<div class="moneda-simbolo">' + m.simbolo + '</div>' +
          '<div class="moneda-nombre">' + m.nombre + '</div>' +
          '<div class="moneda-codigo">' + m.codigo + '</div>' +
          (m.esBase ? '<span class="moneda-base">MONEDA BASE</span>' : '') +
        '</div>';
      }
      grid.innerHTML = html;
    }
  }

  // ─── MODAL: EDITAR MONEDA ───
  function openEdit(codigo) {
    editingId = codigo;
    var db = _erp.getDB();
    var monedas = db.monedas || [];
    var m = null;
    for (var i = 0; i < monedas.length; i++) {
      if (monedas[i].codigo === codigo) { m = monedas[i]; break; }
    }
    if (!m) return;

    var modalTitle = $("f81_modalTitle");
    var inpCodigo = $("f81_inpCodigo");
    var inpNombre = $("f81_inpNombre");
    var inpSimbolo = $("f81_inpSimbolo");
    var inpDecimales = $("f81_inpDecimales");
    var inpEsBase = $("f81_inpEsBase");
    var modal = $("f81_modal");

    if (modalTitle) modalTitle.textContent = "Editar Moneda";
    if (inpCodigo) { inpCodigo.value = m.codigo; inpCodigo.disabled = true; }
    if (inpNombre) inpNombre.value = m.nombre;
    if (inpSimbolo) inpSimbolo.value = m.simbolo;
    if (inpDecimales) inpDecimales.value = m.decimales;
    if (inpEsBase) inpEsBase.checked = !!m.esBase;
    if (modal) modal.classList.add("active");
  }

  // ─── CERRAR MODAL ───
  function closeModal() {
    var modal = $("f81_modal");
    if (modal) modal.classList.remove("active");
    editingId = null;
  }

  // ─── GUARDAR MONEDA ───
  function saveMoneda() {
    var inpCodigo = $("f81_inpCodigo");
    var inpNombre = $("f81_inpNombre");
    var inpSimbolo = $("f81_inpSimbolo");
    var inpDecimales = $("f81_inpDecimales");
    var inpEsBase = $("f81_inpEsBase");

    var codigo = (inpCodigo ? inpCodigo.value.trim() : "").toUpperCase();
    var nombre = inpNombre ? inpNombre.value.trim() : "";
    var simbolo = inpSimbolo ? inpSimbolo.value.trim() : "";
    var decimales = parseInt(inpDecimales ? inpDecimales.value : 2) || 2;
    var esBase = inpEsBase ? inpEsBase.checked : false;

    if (!codigo || !nombre || !simbolo) {
      _erp.showToast("warning", "Validacion", "Codigo, nombre y simbolo son obligatorios");
      return;
    }

    var db = _erp.getDB();
    if (!db.monedas) db.monedas = [];

    if (editingId) {
      var idx = -1;
      for (var i = 0; i < db.monedas.length; i++) {
        if (db.monedas[i].codigo === editingId) { idx = i; break; }
      }
      if (idx >= 0) {
        // Si esta moneda se marca como base, quitar base de las demas
        if (esBase) {
          for (var j = 0; j < db.monedas.length; j++) {
            if (j !== idx) db.monedas[j].esBase = false;
          }
        }
        db.monedas[idx] = {
          codigo: codigo,
          nombre: nombre,
          simbolo: simbolo,
          decimales: decimales,
          esBase: esBase
        };
      }
    } else {
      // Verificar duplicado
      for (var i = 0; i < db.monedas.length; i++) {
        if (db.monedas[i].codigo === codigo) {
          _erp.showToast("error", "Error", "Ya existe una moneda con ese codigo");
          return;
        }
      }
      // Si es base, quitar base de las demas
      if (esBase) {
        for (var j = 0; j < db.monedas.length; j++) {
          db.monedas[j].esBase = false;
        }
      }
      db.monedas.push({
        codigo: codigo,
        nombre: nombre,
        simbolo: simbolo,
        decimales: decimales,
        esBase: esBase
      });
    }

    _erp.saveLocal(db);
    closeModal();
    renderTable();
    _erp.showToast("success", "Guardado", nombre + " guardado correctamente");

    // Notificar al modulo padre
    if (window.FASE8_PADRE && window.FASE8_PADRE.render) {
      window.FASE8_PADRE.render();
    }
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    var btnAdd = $("f81_btnAdd");
    var modalClose = $("f81_modalClose");
    var btnCancel = $("f81_btnCancel");
    var btnSave = $("f81_btnSave");
    var modal = $("f81_modal");

    if (btnAdd) btnAdd.onclick = function() {
      editingId = null;
      var modalTitle = $("f81_modalTitle");
      var inpCodigo = $("f81_inpCodigo");
      if (modalTitle) modalTitle.textContent = "Agregar Moneda";
      if (inpCodigo) { inpCodigo.value = ""; inpCodigo.disabled = false; }
      var inpNombre = $("f81_inpNombre"); if (inpNombre) inpNombre.value = "";
      var inpSimbolo = $("f81_inpSimbolo"); if (inpSimbolo) inpSimbolo.value = "";
      var inpDecimales = $("f81_inpDecimales"); if (inpDecimales) inpDecimales.value = "2";
      var inpEsBase = $("f81_inpEsBase"); if (inpEsBase) inpEsBase.checked = false;
      if (modal) modal.classList.add("active");
    };
    if (modalClose) modalClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    if (btnSave) btnSave.onclick = saveMoneda;
    if (modal) {
      modal.onclick = function(e) { if (e.target === modal) closeModal(); };
    }
  }

  // ─── HTML DEL CONTENIDO (se inyecta en el slot-content del padre) ───
  var CONTENT_HTML = '<div class="f81-wrapper">' +
    '<div class="kpi-grid" id="f81_monedasGrid"></div>' +
    '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
      '<button class="btn btn-primary" id="f81_btnAdd"><i class="fas fa-plus"></i> Agregar Moneda</button>' +
    '</div>' +
    '<div class="f81-table-wrapper">' +
      '<table class="data-table" id="f81_table">' +
        '<thead><tr><th>Codigo</th><th>Nombre</th><th>Simbolo</th><th>Decimales</th><th>Es Base</th><th>Acciones</th></tr></thead>' +
        '<tbody id="f81_tbody"></tbody>' +
      '</table>' +
    '</div>' +
  '</div>';

  // ─── HTML DEL MODAL ───
  var MODAL_HTML = '<div class="modal-overlay" id="f81_modal" style="display:none;align-items:center;justify-content:center;">' +
    '<div class="modal-content" style="background:#1e293b;border:1px solid #334155;border-radius:12px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;">' +
      '<div class="modal-header" style="padding:20px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;">' +
        '<div class="modal-title" id="f81_modalTitle" style="font-size:16px;font-weight:600;color:#f1f5f9;">Agregar Moneda</div>' +
        '<button id="f81_modalClose" style="width:32px;height:32px;border-radius:6px;background:#334155;border:none;color:#f1f5f9;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">&times;</button>' +
      '</div>' +
      '<div class="modal-body" style="padding:20px;">' +
        '<div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Codigo</label><input type="text" id="f81_inpCodigo" placeholder="Ej: USD" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Nombre</label><input type="text" id="f81_inpNombre" placeholder="Ej: Dolar Americano" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Simbolo</label><input type="text" id="f81_inpSimbolo" placeholder="Ej: $" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Decimales</label><input type="number" id="f81_inpDecimales" value="2" min="0" max="6" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1;"><label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#f1f5f9;cursor:pointer;"><input type="checkbox" id="f81_inpEsBase" style="width:18px;height:18px;accent-color:#3b82f6;"> Establecer como moneda base del sistema</label></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-footer" style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:10px;">' +
        '<button class="btn btn-secondary" id="f81_btnCancel">Cancelar</button>' +
        '<button class="btn btn-primary" id="f81_btnSave"><i class="fas fa-save"></i> Guardar</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ─── CSS SCOPED ───
  var PLUGIN_CSS = [
    '/* FASE8_1 - Monedas CRUD */',
    '#mod-fase8 .f81-wrapper { padding: 0; }',
    '#mod-fase8 .moneda-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; transition: .2s; margin-bottom: 16px; }',
    '#mod-fase8 .moneda-card:hover { border-color: #3b82f6; transform: translateY(-2px); }',
    '#mod-fase8 .moneda-simbolo { font-size: 36px; font-weight: 700; color: #3b82f6; margin-bottom: 8px; }',
    '#mod-fase8 .moneda-nombre { font-size: 14px; font-weight: 600; color: #f1f5f9; }',
    '#mod-fase8 .moneda-codigo { font-size: 12px; color: #94a3b8; margin-top: 4px; }',
    '#mod-fase8 .moneda-base { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; background: rgba(16,185,129,0.15); color: #10b981; margin-top: 8px; }',
    '#mod-fase8 .f81-table-wrapper { overflow-x: auto; }',
    '#mod-fase8 #f81_modal.active { display: flex !important; }',
    '#mod-fase8 #f81_modal { z-index: 2500; position: fixed; inset: 0; background: rgba(0,0,0,.7); }'
  ].join("\n");

  // ─── FUNCION PRINCIPAL DE RENDER ───
  function render() {
    if (!_erp) return;
    // Inyectar contenido en el tab-content del modulo padre (tab1 = Monedas)
    var tab1 = $("fase8-tab1-content");
    if (tab1) {
      tab1.innerHTML = CONTENT_HTML;
      tab1.style.display = "block";
    }
    // Inyectar modal en slot-modals
    var modalsSlot = $(PARENT_MODULE + "-slot-modals");
    if (modalsSlot) {
      var existente = $("f81_modal");
      if (!existente) {
        modalsSlot.innerHTML = modalsSlot.innerHTML + MODAL_HTML;
      }
    }
    bindEvents();
    renderTable();
  }

  // ─── INICIALIZAR PLUGIN ───
  function initPlugin() {
    if (initialized) return;
    initialized = true;

    // Inyectar CSS
    var styleId = "erp-css-" + PLUGIN_ID;
    var existente = $(styleId);
    if (existente) existente.remove();
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);

    // Habilitar boton del modulo padre
    _erp.enableButton(PARENT_MODULE, "nueva-moneda", function() {
      var btnAdd = $("f81_btnAdd");
      if (btnAdd) btnAdd.click();
    }, "Nueva Moneda", "fa-plus");

    // Activar tab del modulo padre
    _erp.activateTab(PARENT_MODULE, "1", function() {
      render();
    }, "Monedas");

    // Render inicial
    render();

    console.log("[" + PLUGIN_ID + "] Plugin inicializado correctamente v" + PLUGIN_VERSION);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // API GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════════

  window.FASE8_1 = {
    PLUGIN_ID: PLUGIN_ID,
    PLUGIN_VERSION: PLUGIN_VERSION,
    PLUGIN_NAME: PLUGIN_NAME,
    parentModule: PARENT_MODULE,
    render: render,
    editMoneda: openEdit,
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
    descripcion: "CRUD de monedas (VES/USD/EUR). Simbolos, decimales, moneda base.",
    schemaVersionRequerida: SCHEMA_REQ,
    dependencias: DEPENDENCIAS,
    menu: null,

    schema: {},

    css: PLUGIN_CSS,
    html: "",

    init: function(erp) {
      _erp = erp;
      setTimeout(function() {
        initPlugin();
      }, 200);
    },

    onShow: function(erp) {
      _erp = erp;
      if (!initialized) {
        initPlugin();
      } else {
        render();
      }
    }
  };

  // ─── REGISTRAR PLUGIN ───
  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(pluginDef);
    console.log("[" + PLUGIN_ID + "] Plugin registrado correctamente v" + PLUGIN_VERSION);
  } else {
    console.error("[" + PLUGIN_ID + "] ERP no disponible. No se pudo registrar.");
  }
})();
