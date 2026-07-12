// ═══════════════════════════════════════════════════════════════════════════════
// FASE 9.1 - CLIENTES CRUD (Micro-fase anidada)
// Tabla clientes, form agregar/editar/eliminar, RIF/CI, credito 3 monedas,
// filtros, export CSV. Tipos: Empresa, Persona Natural, Mayorista, Minorista, Distribuidor.
// Dependencia: FASE1_10, FASE8_5, FASE2_6
// Compatible con ERP Core v3.0 - Slots API
// Se inyecta en tab "clientes" del modulo padre fase9
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  var PLUGIN_ID       = "FASE9_1";
  var PLUGIN_VERSION  = "3.0.0";
  var PLUGIN_NAME     = "Clientes CRUD";
  var PLUGIN_FASE     = 9;
  var PLUGIN_MICRO    = "9.1";
  var SCHEMA_REQ      = "3.0.0";
  var DEPENDENCIAS    = ["FASE1_10", "FASE8_5"];
  var PARENT_MODULE   = "fase9";

  var _erp = null;
  var editingId = null;
  var initialized = false;

  function $(id) { return document.getElementById(id); }

  // ─── RENDERIZAR LISTA ───
  function renderTable() {
    var searchEl = $("f91_search");
    var tipoFilterEl = $("f91_filterTipo");
    var container = $("f91_clientesList");

    var db = _erp.getDB();
    var clientes = db.clientes || [];
    var search = (searchEl ? searchEl.value : "").toLowerCase();
    var tipoFilter = (tipoFilterEl ? tipoFilterEl.value : "");

    var filtered = [];
    for (var i = 0; i < clientes.length; i++) {
      var c = clientes[i];
      if (search && c.nombre.toLowerCase().indexOf(search) === -1 && (c.rif || "").toLowerCase().indexOf(search) === -1) continue;
      if (tipoFilter && c.tipo !== tipoFilter) continue;
      filtered.push(c);
    }

    // KPIs
    var empresas = 0, personas = 0;
    for (var i = 0; i < clientes.length; i++) {
      if (clientes[i].tipo === "Empresa") empresas++;
      if (clientes[i].tipo === "Persona Natural") personas++;
    }
    var totalCredVES = 0;
    for (var i = 0; i < clientes.length; i++) totalCredVES += (clientes[i].creditoVES || 0);

    _erp.updateKPI(PARENT_MODULE, "cli-count", clientes.length, clientes.length + " registrados");

    var kpiEmp = $("f91_empresas");
    var kpiPer = $("f91_personas");
    var kpiCred = $("f91_credito");
    if (kpiEmp) kpiEmp.textContent = empresas;
    if (kpiPer) kpiPer.textContent = personas;
    if (kpiCred) kpiCred.textContent = _erp.formatearMoneda(totalCredVES, "VES");

    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:40px">No hay clientes registrados</div>';
      return;
    }

    var html = '<div style="display:flex; flex-direction:column; gap:12px">';
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i];
      var avatarCls = "";
      var icon = "fas fa-user";
      if (c.tipo === "Empresa") { avatarCls = "empresa"; icon = "fas fa-building"; }
      else if (c.tipo === "Persona Natural") { avatarCls = "persona"; }
      else if (c.tipo === "Mayorista") { avatarCls = "mayorista"; }

      var tipoBadgeCls = "tipo-minorista";
      if (c.tipo === "Empresa") tipoBadgeCls = "tipo-empresa";
      else if (c.tipo === "Persona Natural") tipoBadgeCls = "tipo-persona";
      else if (c.tipo === "Mayorista") tipoBadgeCls = "tipo-mayorista";
      else if (c.tipo === "Distribuidor") tipoBadgeCls = "tipo-distribuidor";

      html += '<div class="cliente-card" style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
          '<div style="width:48px;height:48px;border-radius:50%;background:' + (avatarCls === "empresa" ? "#3b82f6" : (avatarCls === "persona" ? "#10b981" : "#f59e0b")) + ';display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;"><i class="' + icon + '"></i></div>' +
          '<div style="flex:1;">' +
            '<div style="font-size:16px;font-weight:600;color:#f1f5f9;">' + c.nombre + ' <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:500;margin-left:8px;background:' + (tipoBadgeCls === "tipo-empresa" ? "rgba(59,130,246,0.15)" : (tipoBadgeCls === "tipo-persona" ? "rgba(16,185,129,0.15)" : (tipoBadgeCls === "tipo-mayorista" ? "rgba(245,158,11,0.15)" : (tipoBadgeCls === "tipo-distribuidor" ? "rgba(236,72,153,0.15)" : "rgba(139,92,246,0.15)")))) + ';color:' + (tipoBadgeCls === "tipo-empresa" ? "#3b82f6" : (tipoBadgeCls === "tipo-persona" ? "#10b981" : (tipoBadgeCls === "tipo-mayorista" ? "#f59e0b" : (tipoBadgeCls === "tipo-distribuidor" ? "#ec4899" : "#8b5cf6")))) + ';">' + c.tipo + '</span> <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:500;background:' + (c.estado === "Activo" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") + ';color:' + (c.estado === "Activo" ? "#10b981" : "#ef4444") + ';">' + c.estado + '</span></div>' +
            '<div style="font-size:12px;color:#94a3b8;">' + c.rif + ' | Plazo: ' + (c.plazoCredito || 0) + ' dias</div>' +
          '</div>' +
          '<div class="actions" style="display:flex;gap:6px;">' +
            '<button class="btn btn-primary btn-sm" onclick="window.FASE9_1.openModal(\'' + c.id + '\')"><i class="fas fa-edit"></i></button>' +
            '<button class="btn btn-danger btn-sm" onclick="window.FASE9_1.deleteCliente(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
          '<div style="text-align:center;padding:8px;border-radius:6px;background:#334155;"><div style="font-size:11px;color:#94a3b8;">VES</div><div style="font-size:14px;font-weight:600;color:#f1f5f9;">' + _erp.formatearMoneda(c.creditoVES || 0, "VES") + '</div></div>' +
          '<div style="text-align:center;padding:8px;border-radius:6px;background:#334155;"><div style="font-size:11px;color:#94a3b8;">USD</div><div style="font-size:14px;font-weight:600;color:#f1f5f9;">' + _erp.formatearMoneda(c.creditoUSD || 0, "USD") + '</div></div>' +
          '<div style="text-align:center;padding:8px;border-radius:6px;background:#334155;"><div style="font-size:11px;color:#94a3b8;">EUR</div><div style="font-size:14px;font-weight:600;color:#f1f5f9;">' + _erp.formatearMoneda(c.creditoEUR || 0, "EUR") + '</div></div>' +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // ─── MODAL ───
  function openModal(id) {
    editingId = id || null;
    var modalTitle = $("f91_modalTitle");
    var modal = $("f91_modal");

    if (editingId) {
      var db = _erp.getDB();
      var c = null;
      for (var i = 0; i < (db.clientes || []).length; i++) {
        if (db.clientes[i].id === editingId) { c = db.clientes[i]; break; }
      }
      if (!c) return;
      if (modalTitle) modalTitle.textContent = "Editar Cliente";
      $("f91_codigo").value = c.codigo || "";
      $("f91_nombre").value = c.nombre || "";
      $("f91_rif").value = c.rif || "";
      $("f91_tipo").value = c.tipo || "Empresa";
      $("f91_direccion").value = c.direccion || "";
      $("f91_telefono").value = c.telefono || "";
      $("f91_email").value = c.email || "";
      $("f91_plazo").value = c.plazoCredito || 30;
      $("f91_credVES").value = c.creditoVES || 0;
      $("f91_credUSD").value = c.creditoUSD || 0;
      $("f91_credEUR").value = c.creditoEUR || 0;
    } else {
      if (modalTitle) modalTitle.textContent = "Nuevo Cliente";
      $("f91_codigo").value = _erp.genId("CLI");
      $("f91_nombre").value = "";
      $("f91_rif").value = "";
      $("f91_tipo").value = "Empresa";
      $("f91_direccion").value = "";
      $("f91_telefono").value = "";
      $("f91_email").value = "";
      $("f91_plazo").value = 30;
      $("f91_credVES").value = 0;
      $("f91_credUSD").value = 0;
      $("f91_credEUR").value = 0;
    }
    if (modal) modal.style.display = "flex";
  }

  function closeModal() {
    var modal = $("f91_modal");
    if (modal) modal.style.display = "none";
    editingId = null;
  }

  function guardar() {
    var db = _erp.getDB();
    if (!db.clientes) db.clientes = [];

    var codigo = $("f91_codigo").value;
    var nombre = $("f91_nombre").value.trim();
    if (!nombre) {
      _erp.showToast("warning", "Validacion", "El nombre es obligatorio");
      return;
    }

    var cliente = {
      id: editingId || _erp.genId("CLI"),
      codigo: codigo,
      nombre: nombre,
      rif: $("f91_rif").value,
      tipo: $("f91_tipo").value,
      direccion: $("f91_direccion").value,
      telefono: $("f91_telefono").value,
      email: $("f91_email").value,
      estado: "Activo",
      plazoCredito: parseInt($("f91_plazo").value) || 30,
      creditoVES: parseFloat($("f91_credVES").value) || 0,
      creditoUSD: parseFloat($("f91_credUSD").value) || 0,
      creditoEUR: parseFloat($("f91_credEUR").value) || 0
    };

    if (editingId) {
      var idx = -1;
      for (var i = 0; i < db.clientes.length; i++) {
        if (db.clientes[i].id === editingId) { idx = i; break; }
      }
      if (idx >= 0) db.clientes[idx] = cliente;
    } else {
      db.clientes.push(cliente);
    }

    _erp.saveLocal(db);
    closeModal();
    renderTable();
    _erp.showToast("success", "Cliente Guardado", nombre);

    if (window.FASE9_PADRE && window.FASE9_PADRE.render) {
      window.FASE9_PADRE.render();
    }
  }

  function deleteCliente(id) {
    _erp.showConfirm("Eliminar Cliente", "Seguro que deseas eliminar este cliente?", function() {
      var db = _erp.getDB();
      var nuevaLista = [];
      for (var i = 0; i < (db.clientes || []).length; i++) {
        if (db.clientes[i].id !== id) nuevaLista.push(db.clientes[i]);
      }
      db.clientes = nuevaLista;
      _erp.saveLocal(db);
      renderTable();
      _erp.showToast("info", "Eliminado", "Cliente removido");
      if (window.FASE9_PADRE && window.FASE9_PADRE.render) {
        window.FASE9_PADRE.render();
      }
    });
  }

  function exportCSV() {
    var db = _erp.getDB();
    var clientes = db.clientes || [];
    var csv = "Codigo,Nombre,RIF,Tipo,Estado,Plazo,CreditoVES,CreditoUSD,CreditoEUR\n";
    for (var i = 0; i < clientes.length; i++) {
      var c = clientes[i];
      csv += (c.codigo || c.id) + "," + c.nombre + "," + c.rif + "," + c.tipo + "," + c.estado + "," + (c.plazoCredito || 0) + "," + (c.creditoVES || 0) + "," + (c.creditoUSD || 0) + "," + (c.creditoEUR || 0) + "\n";
    }
    var blob = new Blob([csv], {type: "text/csv"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "Clientes_" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    _erp.showToast("success", "Export OK", "CSV descargado");
  }

  function initDemo() {
    var db = _erp.getDB();
    if (!db.clientes || db.clientes.length === 0) {
      db.clientes = [
        {id:"CLI001", codigo:"CLI001", nombre:"Supermercados Metro C.A.", rif:"J-12345678-9", tipo:"Empresa", estado:"Activo", direccion:"Av. Principal 123, Caracas", telefono:"0212-5551111", email:"compras@metro.com", plazoCredito:30, creditoVES:50000, creditoUSD:85, creditoEUR:78},
        {id:"CLI002", codigo:"CLI002", nombre:"Farmacias Unidas C.A.", rif:"J-98765432-1", tipo:"Empresa", estado:"Activo", direccion:"Calle Comercio 456, Valencia", telefono:"0241-5552222", email:"pedidos@farmacias.com", plazoCredito:45, creditoVES:75000, creditoUSD:128, creditoEUR:117},
        {id:"CLI003", codigo:"CLI003", nombre:"Hotel Caribe", rif:"J-45678901-2", tipo:"Empresa", estado:"Activo", direccion:"Playa El Agua, Margarita", telefono:"0295-5553333", email:"admin@hotelcaribe.com", plazoCredito:15, creditoVES:25000, creditoUSD:43, creditoEUR:39},
        {id:"CLI004", codigo:"CLI004", nombre:"Juan Perez", rif:"V-12345678-9", tipo:"Persona Natural", estado:"Activo", direccion:"Urb. Las Acacias, Casa 5", telefono:"0412-5554444", email:"juanperez@gmail.com", plazoCredito:0, creditoVES:5000, creditoUSD:8, creditoEUR:7},
        {id:"CLI005", codigo:"CLI005", nombre:"Maria Rodriguez", rif:"V-87654321-0", tipo:"Persona Natural", estado:"Activo", direccion:"Av. Bolivar, Edif. Centro, Piso 3", telefono:"0414-5555555", email:"mariar@gmail.com", plazoCredito:0, creditoVES:3000, creditoUSD:5, creditoEUR:4}
      ];
      _erp.saveLocal(db);
      _erp.showToast("info", "Demo", "5 clientes de demo cargados");
    }
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    var searchEl = $("f91_search");
    var filterTipo = $("f91_filterTipo");
    var btnAdd = $("f91_btnAdd");
    var btnExport = $("f91_btnExport");
    var btnSave = $("f91_btnSave");
    var btnCancel = $("f91_btnCancel");
    var modalClose = $("f91_modalClose");
    var modal = $("f91_modal");

    if (searchEl) searchEl.onkeyup = renderTable;
    if (filterTipo) filterTipo.onchange = renderTable;
    if (btnAdd) btnAdd.onclick = function() { openModal(); };
    if (btnExport) btnExport.onclick = exportCSV;
    if (btnSave) btnSave.onclick = guardar;
    if (btnCancel) btnCancel.onclick = closeModal;
    if (modalClose) modalClose.onclick = closeModal;
    if (modal) {
      modal.onclick = function(e) { if (e.target === modal) closeModal(); };
    }
  }

  // ─── HTML DEL CONTENIDO ───
  var CONTENT_HTML = '<div class="f91-wrapper">' +
    '<div class="f91-kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px;">' +
      '<div class="kpi-card">' +
        '<div class="kpi-card-header"><span class="kpi-card-title">Total Clientes</span><div class="kpi-card-icon blue"><i class="fas fa-users"></i></div></div>' +
        '<div class="kpi-card-value" id="f91_total">0</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-card-header"><span class="kpi-card-title">Empresas</span><div class="kpi-card-icon green"><i class="fas fa-building"></i></div></div>' +
        '<div class="kpi-card-value" id="f91_empresas">0</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-card-header"><span class="kpi-card-title">Personas Naturales</span><div class="kpi-card-icon amber"><i class="fas fa-user"></i></div></div>' +
        '<div class="kpi-card-value" id="f91_personas">0</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-card-header"><span class="kpi-card-title">Credito Total VES</span><div class="kpi-card-icon purple"><i class="fas fa-coins"></i></div></div>' +
        '<div class="kpi-card-value" id="f91_credito">Bs. 0,00</div>' +
      '</div>' +
    '</div>' +
    '<div class="f91-search-bar" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
      '<input type="text" class="config-input" id="f91_search" placeholder="Buscar cliente..." style="flex:1;min-width:200px">' +
      '<select class="config-input" id="f91_filterTipo" style="min-width:150px">' +
        '<option value="">Todos los tipos</option>' +
        '<option value="Empresa">Empresa</option>' +
        '<option value="Persona Natural">Persona Natural</option>' +
        '<option value="Mayorista">Mayorista</option>' +
        '<option value="Minorista">Minorista</option>' +
        '<option value="Distribuidor">Distribuidor</option>' +
      '</select>' +
      '<button class="btn btn-primary" id="f91_btnAdd"><i class="fas fa-plus"></i> Nuevo Cliente</button>' +
      '<button class="btn btn-secondary" id="f91_btnExport"><i class="fas fa-file-csv"></i> Export</button>' +
    '</div>' +
    '<div class="chart-card">' +
      '<div class="chart-card-header"><span class="chart-card-title">Lista de Clientes</span></div>' +
      '<div id="f91_clientesList"></div>' +
    '</div>' +
  '</div>';

  // ─── HTML DEL MODAL ───
  var MODAL_HTML = '<div class="modal-overlay" id="f91_modal" style="display:none;align-items:center;justify-content:center;z-index:2500;position:fixed;inset:0;background:rgba(0,0,0,.7);">' +
    '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto;">' +
      '<div style="padding:20px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="font-size:16px;font-weight:600;color:#f1f5f9;" id="f91_modalTitle">Nuevo Cliente</div>' +
        '<button id="f91_modalClose" style="width:32px;height:32px;border-radius:6px;background:#334155;border:none;color:#f1f5f9;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">&times;</button>' +
      '</div>' +
      '<div style="padding:20px;">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;">' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Codigo</label><input type="text" class="config-input" id="f91_codigo"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Nombre / Razon Social</label><input type="text" class="config-input" id="f91_nombre"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">RIF / CI</label><input type="text" class="config-input" id="f91_rif" placeholder="J-12345678-9 o V-12345678"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Tipo</label><select class="config-input" id="f91_tipo"><option value="Empresa">Empresa</option><option value="Persona Natural">Persona Natural</option><option value="Mayorista">Mayorista</option><option value="Minorista">Minorista</option><option value="Distribuidor">Distribuidor</option></select></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Direccion Fiscal</label><input type="text" class="config-input" id="f91_direccion"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Telefono</label><input type="text" class="config-input" id="f91_telefono"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Email</label><input type="email" class="config-input" id="f91_email"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Plazo Credito (dias)</label><input type="number" class="config-input" id="f91_plazo" value="30"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Credito VES</label><input type="number" class="config-input" id="f91_credVES" value="0"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Credito USD</label><input type="number" class="config-input" id="f91_credUSD" value="0"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Credito EUR</label><input type="number" class="config-input" id="f91_credEUR" value="0"></div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:10px;">' +
        '<button class="btn btn-secondary" id="f91_btnCancel">Cancelar</button>' +
        '<button class="btn btn-primary" id="f91_btnSave"><i class="fas fa-save"></i> Guardar</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ─── CSS SCOPED ───
  var PLUGIN_CSS = [
    '/* FASE9_1 - Clientes CRUD */',
    '#mod-fase9 .f91-wrapper { padding: 0; }',
    '#mod-fase9 .cliente-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 12px; }',
    '#mod-fase9 #f91_modal { display: none; }',
    '#mod-fase9 #f91_modal.active { display: flex !important; }'
  ].join("\n");

  // ─── RENDER ───
  function render() {
    if (!_erp) return;
    var tab1 = $("fase9-tab1-content");
    if (tab1) {
      tab1.innerHTML = CONTENT_HTML;
      tab1.style.display = "block";
    }
    // Inyectar modal en slot-modals
    var modalsSlot = $(PARENT_MODULE + "-slot-modals");
    if (modalsSlot) {
      var existente = $("f91_modal");
      if (!existente) {
        modalsSlot.innerHTML = modalsSlot.innerHTML + MODAL_HTML;
      }
    }
    bindEvents();
    initDemo();
    renderTable();
  }

  // ─── INICIALIZAR ───
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

    _erp.enableButton(PARENT_MODULE, "nuevo-cli", function() {
      openModal();
    }, "Nuevo Cliente", "fa-user-plus");

    _erp.enableButton(PARENT_MODULE, "nueva-cot", function() {
      _erp.showToast("info", "FASE9_1", "Cotizaciones en desarrollo - requiere FASE9_2+");
    }, "Nueva Cotizacion", "fa-file-invoice");

    _erp.enableButton(PARENT_MODULE, "exportar", function() {
      exportCSV();
    }, "Exportar", "fa-file-export");

    _erp.activateTab(PARENT_MODULE, "1", function() {
      render();
    }, "Clientes");

    _erp.populateFilter(PARENT_MODULE, "estado", [
      {value: "", text: "Todos los estados"},
      {value: "Activo", text: "Activo"},
      {value: "Inactivo", text: "Inactivo"}
    ]);

    _erp.populateFilter(PARENT_MODULE, "tipo", [
      {value: "", text: "Todos los tipos"},
      {value: "Empresa", text: "Empresa"},
      {value: "Persona Natural", text: "Persona Natural"},
      {value: "Mayorista", text: "Mayorista"},
      {value: "Minorista", text: "Minorista"},
      {value: "Distribuidor", text: "Distribuidor"}
    ]);

    var filterBuscar = $(PARENT_MODULE + "-filter-buscar");
    if (filterBuscar) {
      filterBuscar.disabled = false;
      filterBuscar.onkeyup = function() {
        var searchEl = $("f91_search");
        if (searchEl) {
          searchEl.value = filterBuscar.value;
          renderTable();
        }
      };
    }

    render();
    console.log("[" + PLUGIN_ID + "] Plugin inicializado correctamente v" + PLUGIN_VERSION);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // API GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════════

  window.FASE9_1 = {
    PLUGIN_ID: PLUGIN_ID,
    PLUGIN_VERSION: PLUGIN_VERSION,
    PLUGIN_NAME: PLUGIN_NAME,
    parentModule: PARENT_MODULE,
    render: render,
    openModal: openModal,
    deleteCliente: deleteCliente,
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
    descripcion: "Tabla clientes, form agregar/editar/eliminar, RIF/CI, credito 3 monedas, filtros, export CSV.",
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

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(pluginDef);
    console.log("[" + PLUGIN_ID + "] Plugin registrado correctamente v" + PLUGIN_VERSION);
  } else {
    console.error("[" + PLUGIN_ID + "] ERP no disponible. No se pudo registrar.");
  }
})();
