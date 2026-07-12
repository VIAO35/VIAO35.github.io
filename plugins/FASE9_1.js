// ═══════════════════════════════════════════════════════════════════════════════
// FASE 9.1 - CLIENTES CRUD
// Tabla clientes, form agregar/editar/eliminar, RIF/CI, credito 3 monedas,
// filtros, export CSV. Tipos: Empresa, Persona Natural, Mayorista, Minorista, Distribuidor.
// Dependencias: FASE1_10, FASE8_5, FASE2_6
// Compatible con ERP Core v3.0 - Slots API
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  var PLUGIN_ID       = "FASE9_1";
  var PLUGIN_VERSION  = "3.0.0";
  var PLUGIN_NAME     = "Clientes CRUD";
  var PLUGIN_FASE     = 9;
  var PLUGIN_MICRO    = "9.1";
  var SCHEMA_REQ      = "3.0.0";
  var DEPENDENCIAS    = ["FASE1_10", "FASE8_5", "FASE2_6"];
  var PARENT_MODULE   = "fase9";

  var _erp = null;
  var editingId = null;
  var initialized = false;

  function $(id) { return document.getElementById(id); }

  // ─── HELPERS ───
  function getTipoBadge(tipo) {
    var classes = {
      "Empresa": "tipo-empresa",
      "Persona Natural": "tipo-persona",
      "Mayorista": "tipo-mayorista",
      "Minorista": "tipo-minorista",
      "Distribuidor": "tipo-distribuidor"
    };
    var cls = classes[tipo] || "tipo-minorista";
    return '<span class="f91-tipo-badge ' + cls + '">' + tipo + '</span>';
  }

  function getAvatarClass(tipo) {
    if (tipo === "Empresa") return "empresa";
    if (tipo === "Persona Natural") return "persona";
    if (tipo === "Mayorista") return "mayorista";
    return "";
  }

  function getAvatarIcon(tipo) {
    if (tipo === "Empresa") return "fas fa-building";
    return "fas fa-user";
  }

  // ─── RENDERIZAR LISTA ───
  function renderTable() {
    var db = _erp.getDB();
    var clientes = db.clientes || [];
    var searchEl = $("f91_search");
    var tipoFilterEl = $("f91_filterTipo");
    var search = (searchEl ? searchEl.value : "").toLowerCase();
    var tipoFilter = tipoFilterEl ? tipoFilterEl.value : "";

    var filtered = clientes.filter(function(c) {
      if (search && c.nombre.toLowerCase().indexOf(search) === -1 && c.rif.toLowerCase().indexOf(search) === -1) return false;
      if (tipoFilter && c.tipo !== tipoFilter) return false;
      return true;
    });

    // KPIs
    var empresas = clientes.filter(function(c) { return c.tipo === "Empresa"; }).length;
    var personas = clientes.filter(function(c) { return c.tipo === "Persona Natural"; }).length;
    var totalCredVES = clientes.reduce(function(s, c) { return s + (c.creditoVES || 0); }, 0);

    var totalEl = $("f91_total");
    var empresasEl = $("f91_empresas");
    var personasEl = $("f91_personas");
    var creditoEl = $("f91_credito");
    if (totalEl) totalEl.textContent = clientes.length;
    if (empresasEl) empresasEl.textContent = empresas;
    if (personasEl) personasEl.textContent = personas;
    if (creditoEl) creditoEl.textContent = _erp.formatearMoneda(totalCredVES, "VES");

    // Actualizar KPIs del padre
    _erp.updateKPI(PARENT_MODULE, "cli-total", clientes.length, "clientes");
    _erp.updateKPI(PARENT_MODULE, "cli-empresas", empresas, "empresas");
    _erp.updateKPI(PARENT_MODULE, "cli-credito", _erp.formatearMoneda(totalCredVES, "VES"), "credito VES");

    // Lista
    var container = $("f91_clientesList");
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:40px">No hay clientes registrados</div>';
      return;
    }

    var html = '<div class="f91-list">';
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i];
      var avatarCls = getAvatarClass(c.tipo);
      var icon = getAvatarIcon(c.tipo);
      html += '<div class="f91-cliente-card">' +
        '<div class="f91-cliente-header">' +
          '<div class="f91-cliente-avatar ' + avatarCls + '"><i class="' + icon + '"></i></div>' +
          '<div class="f91-cliente-info">' +
            '<div class="f91-cliente-nombre">' + c.nombre + ' ' + getTipoBadge(c.tipo) + ' <span class="badge ' + (c.estado === "Activo" ? 'badge-success' : 'badge-danger') + '">' + c.estado + '</span></div>' +
            '<div class="f91-cliente-rif">' + c.rif + ' | Plazo: ' + c.plazoCredito + ' dias</div>' +
          '</div>' +
          '<div class="actions">' +
            '<button class="btn btn-primary btn-sm" onclick="window.FASE9_1.editItem(\'' + c.id + '\')"><i class="fas fa-edit"></i></button>' +
            '<button class="btn btn-danger btn-sm" onclick="window.FASE9_1.deleteItem(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="f91-credito-grid">' +
          '<div class="f91-credito-item"><div class="f91-credito-moneda">VES</div><div class="f91-credito-monto">' + _erp.formatearMoneda(c.creditoVES || 0, "VES") + '</div></div>' +
          '<div class="f91-credito-item"><div class="f91-credito-moneda">USD</div><div class="f91-credito-monto">' + _erp.formatearMoneda(c.creditoUSD || 0, "USD") + '</div></div>' +
          '<div class="f91-credito-item"><div class="f91-credito-moneda">EUR</div><div class="f91-credito-monto">' + _erp.formatearMoneda(c.creditoEUR || 0, "EUR") + '</div></div>' +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    var searchEl = $("f91_search");
    var tipoFilter = $("f91_filterTipo");
    var btnAdd = $("f91_btnAdd");
    var btnExport = $("f91_btnExport");
    var modalClose = $("f91_modalClose");
    var btnCancel = $("f91_btnCancel");
    var btnSave = $("f91_btnSave");
    var modal = $("f91_modal");

    if (searchEl) searchEl.onkeyup = renderTable;
    if (tipoFilter) tipoFilter.onchange = renderTable;
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
    var modalTitle = $("f91_modalTitle");
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
    $("f91_modal").classList.add("active");
  }

  // ─── MODAL: EDITAR ───
  function openEdit(id) {
    editingId = id;
    var db = _erp.getDB();
    var c = null;
    for (var i = 0; i < (db.clientes || []).length; i++) {
      if (db.clientes[i].id === id) { c = db.clientes[i]; break; }
    }
    if (!c) return;

    var modalTitle = $("f91_modalTitle");
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
    $("f91_modal").classList.add("active");
  }

  // ─── CERRAR MODAL ───
  function closeModal() {
    var modal = $("f91_modal");
    if (modal) modal.classList.remove("active");
    editingId = null;
  }

  // ─── GUARDAR ───
  function saveItem() {
    var db = _erp.getDB();
    if (!db.clientes) db.clientes = [];

    var cliente = {
      id: editingId || _erp.genId("CLI"),
      codigo: $("f91_codigo").value,
      nombre: $("f91_nombre").value,
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

    if (!cliente.nombre || !cliente.rif) {
      _erp.showToast("warning", "Validacion", "Nombre y RIF/CI son obligatorios");
      return;
    }

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
    _erp.showToast("success", "Cliente Guardado", cliente.nombre);

    if (window.FASE9_PADRE && window.FASE9_PADRE.render) {
      window.FASE9_PADRE.render();
    }
  }

  // ─── ELIMINAR ───
  function deleteItem(id) {
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

  // ─── EXPORTAR CSV ───
  function exportCSV() {
    var db = _erp.getDB();
    var clientes = db.clientes || [];
    var csv = "Codigo,Nombre,RIF,Tipo,Estado,Plazo,CreditoVES,CreditoUSD,CreditoEUR\n";
    for (var i = 0; i < clientes.length; i++) {
      var c = clientes[i];
      csv += (c.codigo || c.id) + "," + c.nombre + "," + c.rif + "," + c.tipo + "," + c.estado + "," + c.plazoCredito + "," + (c.creditoVES || 0) + "," + (c.creditoUSD || 0) + "," + (c.creditoEUR || 0) + "\n";
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

  // ─── DATOS DEMO ───
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
      _erp.showToast("info", "Demo", "5 clientes de demo cargados (3 Empresas + 2 Personas Naturales)");
    }
  }

  // ─── HTML DEL CONTENIDO ───
  var CONTENT_HTML = '<div class="f91-wrapper">' +
    '<div class="f91-kpi-grid">' +
      '<div class="f91-kpi-card">' +
        '<div class="f91-kpi-header"><span class="f91-kpi-title">Total Clientes</span><div class="f91-kpi-icon blue"><i class="fas fa-users"></i></div></div>' +
        '<div class="f91-kpi-value" id="f91_total">0</div>' +
      '</div>' +
      '<div class="f91-kpi-card">' +
        '<div class="f91-kpi-header"><span class="f91-kpi-title">Empresas</span><div class="f91-kpi-icon green"><i class="fas fa-building"></i></div></div>' +
        '<div class="f91-kpi-value" id="f91_empresas">0</div>' +
      '</div>' +
      '<div class="f91-kpi-card">' +
        '<div class="f91-kpi-header"><span class="f91-kpi-title">Personas Naturales</span><div class="f91-kpi-icon amber"><i class="fas fa-user"></i></div></div>' +
        '<div class="f91-kpi-value" id="f91_personas">0</div>' +
      '</div>' +
      '<div class="f91-kpi-card">' +
        '<div class="f91-kpi-header"><span class="f91-kpi-title">Credito Total VES</span><div class="f91-kpi-icon purple"><i class="fas fa-coins"></i></div></div>' +
        '<div class="f91-kpi-value" id="f91_credito">Bs. 0,00</div>' +
      '</div>' +
    '</div>' +
    '<div class="f91-search-bar">' +
      '<input type="text" class="f91-search-input" id="f91_search" placeholder="Buscar cliente...">' +
      '<select class="f91-filter-select" id="f91_filterTipo">' +
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
    '<div class="f91-chart-card">' +
      '<div class="f91-chart-header"><span class="f91-chart-title">Lista de Clientes</span></div>' +
      '<div id="f91_clientesList"></div>' +
    '</div>' +
  '</div>';

  // ─── HTML DEL MODAL ───
  var MODAL_HTML = '<div class="modal-overlay" id="f91_modal" style="display:none;align-items:center;justify-content:center;">' +
    '<div class="modal-content" style="background:#1e293b;border:1px solid #334155;border-radius:12px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto;">' +
      '<div class="modal-header" style="padding:20px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;">' +
        '<div class="modal-title" id="f91_modalTitle" style="font-size:16px;font-weight:600;color:#f1f5f9;">Nuevo Cliente</div>' +
        '<button id="f91_modalClose" style="width:32px;height:32px;border-radius:6px;background:#334155;border:none;color:#f1f5f9;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">&times;</button>' +
      '</div>' +
      '<div class="modal-body" style="padding:20px;">' +
        '<div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Codigo</label><input type="text" id="f91_codigo" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Nombre / Razon Social</label><input type="text" id="f91_nombre" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">RIF / CI</label><input type="text" id="f91_rif" placeholder="J-12345678-9 o V-12345678" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Tipo</label><select id="f91_tipo" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"><option value="Empresa">Empresa</option><option value="Persona Natural">Persona Natural</option><option value="Mayorista">Mayorista</option><option value="Minorista">Minorista</option><option value="Distribuidor">Distribuidor</option></select></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Direccion Fiscal</label><input type="text" id="f91_direccion" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Telefono</label><input type="text" id="f91_telefono" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Email</label><input type="email" id="f91_email" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Plazo Credito (dias)</label><input type="number" id="f91_plazo" value="30" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Credito VES</label><input type="number" id="f91_credVES" value="0" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Credito USD</label><input type="number" id="f91_credUSD" value="0" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Credito EUR</label><input type="number" id="f91_credEUR" value="0" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-footer" style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:10px;">' +
        '<button class="btn btn-secondary" id="f91_btnCancel">Cancelar</button>' +
        '<button class="btn btn-primary" id="f91_btnSave"><i class="fas fa-save"></i> Guardar</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ─── CSS SCOPED ───
  var PLUGIN_CSS = [
    '/* FASE9_1 - Clientes CRUD */',
    '#mod-fase9 .f91-wrapper { padding: 0; }',
    '#mod-fase9 .f91-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }',
    '#mod-fase9 .f91-kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase9 .f91-kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }',
    '#mod-fase9 .f91-kpi-title { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; }',
    '#mod-fase9 .f91-kpi-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }',
    '#mod-fase9 .f91-kpi-icon.blue { background: rgba(59,130,246,.15); color: #3b82f6; }',
    '#mod-fase9 .f91-kpi-icon.green { background: rgba(16,185,129,.15); color: #10b981; }',
    '#mod-fase9 .f91-kpi-icon.amber { background: rgba(245,158,11,.15); color: #f59e0b; }',
    '#mod-fase9 .f91-kpi-icon.purple { background: rgba(139,92,246,.15); color: #8b5cf6; }',
    '#mod-fase9 .f91-kpi-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }',
    '#mod-fase9 .f91-search-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }',
    '#mod-fase9 .f91-search-input { flex: 1; min-width: 200px; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 13px; outline: none; }',
    '#mod-fase9 .f91-search-input:focus { border-color: #3b82f6; }',
    '#mod-fase9 .f91-filter-select { padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 13px; min-width: 150px; outline: none; }',
    '#mod-fase9 .f91-filter-select:focus { border-color: #3b82f6; }',
    '#mod-fase9 .f91-chart-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase9 .f91-chart-header { margin-bottom: 16px; }',
    '#mod-fase9 .f91-chart-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }',
    '#mod-fase9 .f91-list { display: flex; flex-direction: column; gap: 12px; }',
    '#mod-fase9 .f91-cliente-card { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; }',
    '#mod-fase9 .f91-cliente-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }',
    '#mod-fase9 .f91-cliente-avatar { width: 48px; height: 48px; border-radius: 50%; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; }',
    '#mod-fase9 .f91-cliente-avatar.persona { background: #10b981; }',
    '#mod-fase9 .f91-cliente-avatar.empresa { background: #3b82f6; }',
    '#mod-fase9 .f91-cliente-avatar.mayorista { background: #f59e0b; }',
    '#mod-fase9 .f91-cliente-info { flex: 1; }',
    '#mod-fase9 .f91-cliente-nombre { font-size: 16px; font-weight: 600; color: #f1f5f9; }',
    '#mod-fase9 .f91-cliente-rif { font-size: 12px; color: #94a3b8; }',
    '#mod-fase9 .f91-credito-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }',
    '#mod-fase9 .f91-credito-item { text-align: center; padding: 8px; border-radius: 6px; background: #334155; }',
    '#mod-fase9 .f91-credito-moneda { font-size: 11px; color: #94a3b8; }',
    '#mod-fase9 .f91-credito-monto { font-size: 14px; font-weight: 600; color: #f1f5f9; }',
    '#mod-fase9 .f91-tipo-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; margin-left: 8px; }',
    '#mod-fase9 .f91-tipo-badge.tipo-empresa { background: rgba(59,130,246,0.15); color: #3b82f6; }',
    '#mod-fase9 .f91-tipo-badge.tipo-persona { background: rgba(16,185,129,0.15); color: #10b981; }',
    '#mod-fase9 .f91-tipo-badge.tipo-mayorista { background: rgba(245,158,11,0.15); color: #f59e0b; }',
    '#mod-fase9 .f91-tipo-badge.tipo-minorista { background: rgba(139,92,246,0.15); color: #8b5cf6; }',
    '#mod-fase9 .f91-tipo-badge.tipo-distribuidor { background: rgba(236,72,153,0.15); color: #ec4899; }',
    '#mod-fase9 #f91_modal.active { display: flex !important; }',
    '#mod-fase9 #f91_modal { z-index: 2500; position: fixed; inset: 0; background: rgba(0,0,0,.7); }'
  ].join("\n");

  // ─── FUNCION PRINCIPAL DE RENDER ───
  function render() {
    if (!_erp) return;
    var tab1 = $("fase9-tab1-content");
    if (tab1) {
      tab1.innerHTML = CONTENT_HTML;
      tab1.style.display = "block";
    }
    var modalsSlot = $(PARENT_MODULE + "-slot-modals");
    if (modalsSlot) {
      var existente = $("f91_modal");
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

    _erp.enableButton(PARENT_MODULE, "nuevo-mat", openAdd, "Nuevo Cliente", "fa-user-plus");
    _erp.enableButton(PARENT_MODULE, "exportar", exportCSV, "Exportar Clientes", "fa-file-export");

    _erp.activateTab(PARENT_MODULE, "1", function() {
      render();
    }, "Clientes");

    _erp.populateFilter(PARENT_MODULE, "categoria", [
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

    initDemo();
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
    descripcion: "Tabla clientes, form agregar/editar/eliminar, RIF/CI, credito 3 monedas, filtros, export CSV.",
    schemaVersionRequerida: SCHEMA_REQ,
    dependencias: DEPENDENCIAS,
    menu: null,
    schema: { clientes: [] },
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