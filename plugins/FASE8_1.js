// ═══════════════════════════════════════════════════════════════════════════════
// FASE 8.1 - MONEDAS CRUD
// CRUD completo de monedas: VES, USD, EUR. Simbolos y decimales.
// Dependencia: FASE1_10
// Compatible con ERP Core v3.0 - Slots API
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
    var searchEl = $("f81_search");
    var tbody = $("f81_tbody");
    var db = _erp.getDB();
    var monedas = db.monedas || [];
    var search = (searchEl ? searchEl.value : "").toLowerCase();

    var filtered = monedas.filter(function(m) {
      if (search && m.nombre.toLowerCase().indexOf(search) === -1 && (m.codigo || "").toLowerCase().indexOf(search) === -1) return false;
      return true;
    });

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:20px">No hay monedas registradas</td></tr>';
    } else {
      var html = "";
      for (var i = 0; i < filtered.length; i++) {
        var m = filtered[i];
        html += '<tr>' +
          '<td><strong>' + m.codigo + '</strong></td>' +
          '<td>' + m.nombre + '</td>' +
          '<td>' + m.simbolo + '</td>' +
          '<td>' + m.decimales + '</td>' +
          '<td>' + (m.esBase ? '<span class="badge badge-success">SI</span>' : '<span class="badge badge-secondary">NO</span>') + '</td>' +
          '<td class="actions">' +
            '<button class="btn btn-primary btn-sm" onclick="window.FASE8_1.editItem(\'' + m.codigo + '\')"><i class="fas fa-edit"></i></button>' +
            '<button class="btn btn-danger btn-sm" onclick="window.FASE8_1.deleteItem(\'' + m.codigo + '\')"><i class="fas fa-trash"></i></button>' +
          '</td>' +
        '</tr>';
      }
      tbody.innerHTML = html;
    }

    // Actualizar KPIs del MODULO PADRE
    var baseCount = monedas.filter(function(m) { return m.esBase; }).length;
    _erp.updateKPI(PARENT_MODULE, "monedas-total", monedas.length, "monedas");
    _erp.updateKPI(PARENT_MODULE, "monedas-base", baseCount, "base");

    // Actualizar KPIs internos
    var totalEl = $("f81_total");
    var baseEl = $("f81_base");
    if (totalEl) totalEl.textContent = monedas.length;
    if (baseEl) baseEl.textContent = baseCount;

    // Grid de cards
    var grid = $("f81_monedasGrid");
    if (grid) {
      var gridHtml = "";
      for (var i = 0; i < monedas.length; i++) {
        var m = monedas[i];
        gridHtml += '<div class="f81-moneda-card">' +
          '<div class="f81-moneda-simbolo">' + m.simbolo + '</div>' +
          '<div class="f81-moneda-nombre">' + m.nombre + '</div>' +
          '<div class="f81-moneda-codigo">' + m.codigo + '</div>' +
          (m.esBase ? '<span class="f81-moneda-base">MONEDA BASE</span>' : '') +
        '</div>';
      }
      grid.innerHTML = gridHtml;
    }
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    var searchEl = $("f81_search");
    var btnAdd = $("f81_btnAdd");
    var btnExport = $("f81_btnExport");
    var modalClose = $("f81_modalClose");
    var btnCancel = $("f81_btnCancel");
    var btnSave = $("f81_btnSave");
    var modal = $("f81_modal");

    if (searchEl) searchEl.onkeyup = renderTable;
    if (btnAdd) btnAdd.onclick = openAdd;
    if (btnExport) btnExport.onclick = exportCSV;
    if (modalClose) modalClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    if (btnSave) btnSave.onclick = saveItem;
    if (modal) {
      modal.onclick = function(e) { if (e.target === modal) closeModal(); };
    }
  }

  // ─── MODAL: AGREGAR ───
  function openAdd() {
    editingId = null;
    var modalTitle = $("f81_modalTitle");
    var inpCodigo = $("f81_inpCodigo");
    var inpNombre = $("f81_inpNombre");
    var inpSimbolo = $("f81_inpSimbolo");
    var inpDecimales = $("f81_inpDecimales");
    var chkBase = $("f81_chkBase");
    var modal = $("f81_modal");

    if (modalTitle) modalTitle.textContent = "Agregar Moneda";
    if (inpCodigo) inpCodigo.value = "";
    if (inpNombre) inpNombre.value = "";
    if (inpSimbolo) inpSimbolo.value = "";
    if (inpDecimales) inpDecimales.value = "2";
    if (chkBase) chkBase.checked = false;
    if (modal) modal.classList.add("active");
  }

  // ─── MODAL: EDITAR ───
  function openEdit(id) {
    editingId = id;
    var db = _erp.getDB();
    var monedas = db.monedas || [];
    var m = null;
    for (var i = 0; i < monedas.length; i++) {
      if (monedas[i].codigo === id) { m = monedas[i]; break; }
    }
    if (!m) return;

    var modalTitle = $("f81_modalTitle");
    var inpCodigo = $("f81_inpCodigo");
    var inpNombre = $("f81_inpNombre");
    var inpSimbolo = $("f81_inpSimbolo");
    var inpDecimales = $("f81_inpDecimales");
    var chkBase = $("f81_chkBase");
    var modal = $("f81_modal");

    if (modalTitle) modalTitle.textContent = "Editar Moneda";
    if (inpCodigo) inpCodigo.value = m.codigo;
    if (inpNombre) inpNombre.value = m.nombre;
    if (inpSimbolo) inpSimbolo.value = m.simbolo;
    if (inpDecimales) inpDecimales.value = m.decimales;
    if (chkBase) chkBase.checked = m.esBase || false;
    if (modal) modal.classList.add("active");
  }

  // ─── CERRAR MODAL ───
  function closeModal() {
    var modal = $("f81_modal");
    if (modal) modal.classList.remove("active");
    editingId = null;
  }

  // ─── GUARDAR MONEDA ───
  function saveItem() {
    var inpCodigo = $("f81_inpCodigo");
    var inpNombre = $("f81_inpNombre");
    var inpSimbolo = $("f81_inpSimbolo");
    var inpDecimales = $("f81_inpDecimales");
    var chkBase = $("f81_chkBase");

    var codigo = inpCodigo ? inpCodigo.value.trim().toUpperCase() : "";
    var nombre = inpNombre ? inpNombre.value.trim() : "";
    var simbolo = inpSimbolo ? inpSimbolo.value.trim() : "";
    var decimales = parseInt(inpDecimales ? inpDecimales.value : 2) || 2;
    var esBase = chkBase ? chkBase.checked : false;

    if (!codigo || !nombre || !simbolo) {
      _erp.showToast("warning", "Validacion", "Codigo, nombre y simbolo son obligatorios");
      return;
    }

    var db = _erp.getDB();
    if (!db.monedas) db.monedas = [];

    // Si es base, quitar base de las demas
    if (esBase) {
      for (var i = 0; i < db.monedas.length; i++) {
        db.monedas[i].esBase = false;
      }
    }

    if (editingId) {
      var idx = -1;
      for (var i = 0; i < db.monedas.length; i++) {
        if (db.monedas[i].codigo === editingId) { idx = i; break; }
      }
      if (idx >= 0) {
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
          _erp.showToast("error", "Error", "El codigo " + codigo + " ya existe");
          return;
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

    if (window.FASE8_PADRE && window.FASE8_PADRE.render) {
      window.FASE8_PADRE.render();
    }
  }

  // ─── ELIMINAR MONEDA ───
  function deleteItem(id) {
    _erp.showConfirm("Eliminar Moneda", "Estas seguro de eliminar esta moneda?", function() {
      var db = _erp.getDB();
      var nuevaLista = [];
      for (var i = 0; i < (db.monedas || []).length; i++) {
        if (db.monedas[i].codigo !== id) nuevaLista.push(db.monedas[i]);
      }
      db.monedas = nuevaLista;
      _erp.saveLocal(db);
      renderTable();
      _erp.showToast("success", "Eliminado", "Moneda eliminada");
      if (window.FASE8_PADRE && window.FASE8_PADRE.render) {
        window.FASE8_PADRE.render();
      }
    });
  }

  // ─── EXPORTAR CSV ───
  function exportCSV() {
    var db = _erp.getDB();
    var monedas = db.monedas || [];
    var csv = "Codigo,Nombre,Simbolo,Decimales,EsBase\n";
    for (var i = 0; i < monedas.length; i++) {
      var m = monedas[i];
      csv += m.codigo + "," + m.nombre + "," + m.simbolo + "," + m.decimales + "," + (m.esBase ? "SI" : "NO") + "\n";
    }
    var blob = new Blob([csv], {type: "text/csv"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "Monedas_" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    _erp.showToast("success", "Export OK", "CSV descargado");
  }

  // ─── DATOS DEMO ───
  function initDemo() {
    var db = _erp.getDB();
    if (!db.monedas || db.monedas.length === 0) {
      db.monedas = [
        {codigo: "VES", nombre: "Bolivar Soberano", simbolo: "Bs.", decimales: 2, esBase: true},
        {codigo: "USD", nombre: "Dolar Americano", simbolo: "$", decimales: 2, esBase: false},
        {codigo: "EUR", nombre: "Euro", simbolo: "\u20ac", decimales: 2, esBase: false}
      ];
      _erp.saveLocal(db);
    }
  }

  // ─── HTML DEL CONTENIDO ───
  var CONTENT_HTML = '<div class="f81-wrapper">' +
    '<div class="f81-kpi-grid">' +
      '<div class="f81-kpi-card">' +
        '<div class="f81-kpi-header"><span class="f81-kpi-title">Total Monedas</span><div class="f81-kpi-icon blue"><i class="fas fa-coins"></i></div></div>' +
        '<div class="f81-kpi-value" id="f81_total">0</div>' +
      '</div>' +
      '<div class="f81-kpi-card">' +
        '<div class="f81-kpi-header"><span class="f81-kpi-title">Moneda Base</span><div class="f81-kpi-icon green"><i class="fas fa-star"></i></div></div>' +
        '<div class="f81-kpi-value" id="f81_base">0</div>' +
      '</div>' +
    '</div>' +
    '<div class="f81-search-bar">' +
      '<input type="text" class="f81-search-input" id="f81_search" placeholder="Buscar moneda...">' +
      '<button class="btn btn-primary" id="f81_btnExport"><i class="fas fa-file-csv"></i> Export CSV</button>' +
    '</div>' +
    '<div class="f81-grid" id="f81_monedasGrid"></div>' +
    '<div class="f81-table-wrapper" style="margin-top:16px">' +
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
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Nombre</label><input type="text" id="f81_inpNombre" placeholder="Nombre de la moneda" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Simbolo</label><input type="text" id="f81_inpSimbolo" placeholder="Ej: $" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Decimales</label><input type="number" id="f81_inpDecimales" value="2" min="0" max="8" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;align-items:center;gap:8px;grid-column:1/-1;"><input type="checkbox" id="f81_chkBase" style="width:18px;height:18px;"><label for="f81_chkBase" style="font-size:13px;color:#f1f5f9;">Es moneda base del sistema</label></div>' +
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
    '#mod-fase8 .f81-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }',
    '#mod-fase8 .f81-kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase8 .f81-kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }',
    '#mod-fase8 .f81-kpi-title { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; }',
    '#mod-fase8 .f81-kpi-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }',
    '#mod-fase8 .f81-kpi-icon.blue { background: rgba(59,130,246,.15); color: #3b82f6; }',
    '#mod-fase8 .f81-kpi-icon.green { background: rgba(16,185,129,.15); color: #10b981; }',
    '#mod-fase8 .f81-kpi-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }',
    '#mod-fase8 .f81-search-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }',
    '#mod-fase8 .f81-search-input { flex: 1; min-width: 200px; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 13px; outline: none; }',
    '#mod-fase8 .f81-search-input:focus { border-color: #3b82f6; }',
    '#mod-fase8 .f81-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }',
    '#mod-fase8 .f81-moneda-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; transition: .2s; }',
    '#mod-fase8 .f81-moneda-card:hover { border-color: #3b82f6; transform: translateY(-2px); }',
    '#mod-fase8 .f81-moneda-simbolo { font-size: 36px; font-weight: 700; color: #3b82f6; margin-bottom: 8px; }',
    '#mod-fase8 .f81-moneda-nombre { font-size: 14px; font-weight: 600; color: #f1f5f9; }',
    '#mod-fase8 .f81-moneda-codigo { font-size: 12px; color: #94a3b8; margin-top: 4px; }',
    '#mod-fase8 .f81-moneda-base { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; background: rgba(16,185,129,0.15); color: #10b981; margin-top: 8px; }',
    '#mod-fase8 .f81-table-wrapper { overflow-x: auto; }',
    '#mod-fase8 #f81_modal.active { display: flex !important; }',
    '#mod-fase8 #f81_modal { z-index: 2500; position: fixed; inset: 0; background: rgba(0,0,0,.7); }'
  ].join("\n");

  // ─── FUNCION PRINCIPAL DE RENDER ───
  function render() {
    if (!_erp) return;
    var tab1 = $("fase8-tab1-content");
    if (tab1) {
      tab1.innerHTML = CONTENT_HTML;
      tab1.style.display = "block";
    }
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

    var styleId = "erp-css-" + PLUGIN_ID;
    var existente = $(styleId);
    if (existente) existente.remove();
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);

    _erp.enableButton(PARENT_MODULE, "nuevo-mat", openAdd, "Nueva Moneda", "fa-coins");
    _erp.enableButton(PARENT_MODULE, "exportar", exportCSV, "Exportar Monedas", "fa-file-export");

    _erp.activateTab(PARENT_MODULE, "1", function() {
      render();
    }, "Monedas");

    _erp.populateFilter(PARENT_MODULE, "categoria", [
      {value: "", text: "Todas las monedas"},
      {value: "base", text: "Moneda Base"},
      {value: "otras", text: "Otras"}
    ]);

    var filterBuscar = $(PARENT_MODULE + "-filter-buscar");
    if (filterBuscar) {
      filterBuscar.disabled = false;
      filterBuscar.onkeyup = function() {
        var searchEl = $("f81_search");
        if (searchEl) {
          searchEl.value = filterBuscar.value;
          renderTable();
        }
      };
    }

    initDemo();
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
    editItem: openEdit,
    deleteItem: deleteItem,
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
    descripcion: "CRUD completo de monedas: VES, USD, EUR. Simbolos y decimales.",
    schemaVersionRequerida: SCHEMA_REQ,
    dependencias: DEPENDENCIAS,
    menu: null,
    schema: { monedas: [] },
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