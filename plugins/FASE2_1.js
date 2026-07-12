// ═══════════════════════════════════════════════════════════════════════════════
// FASE 2.1 - MATERIAS PRIMAS (Tabla Materiales)
// CRUD completo de materias primas con multi-moneda
// Tabla con busqueda, filtros por categoria, y 5 registros demo
// Dependencia: FASE1_10
// Compatible con ERP Core v3.0 - Slots API
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  var PLUGIN_ID       = "FASE2_1";
  var PLUGIN_VERSION  = "3.0.0";
  var PLUGIN_NAME     = "Materias Primas";
  var PLUGIN_FASE     = 2;
  var PLUGIN_MICRO    = "2.1";
  var SCHEMA_REQ      = "3.0.0";
  var DEPENDENCIAS    = ["FASE1_10"];
  var PARENT_MODULE   = "fase2";

  var _erp = null;
  var editingId = null;
  var initialized = false;

  // ─── CACHE DE ELEMENTOS DOM ───
  function $(id) { return document.getElementById(id); }

  // ─── RENDERIZAR TABLA ───
  function renderTable() {
    var searchEl = $("f21_search");
    var catEl = $("f21_filterCat");
    var stockEl = $("f21_filterStock");
    var tbody = $("f21_tbody");

    var db = _erp.getDB();
    var materias = db.materiasPrimas || [];
    var search = (searchEl ? searchEl.value : "").toLowerCase();
    var catFilter = (catEl ? catEl.value : "");
    var stockFilter = (stockEl ? stockEl.value : "");

    var filtered = materias.filter(function(m) {
      if (search && m.nombre.toLowerCase().indexOf(search) === -1 && (m.codigo || "").toLowerCase().indexOf(search) === -1) return false;
      if (catFilter && m.categoria !== catFilter) return false;
      if (stockFilter === "low" && m.stock >= m.stockMin) return false;
      if (stockFilter === "ok" && m.stock < m.stockMin) return false;
      return true;
    });

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:20px">No hay materias primas registradas</td></tr>';
    } else {
      var html = "";
      for (var i = 0; i < filtered.length; i++) {
        var m = filtered[i];
        var stockClass = m.stock < m.stockMin ? "low" : "ok";
        var estado = m.stock < m.stockMin
          ? '<span class="badge badge-danger">Bajo</span>'
          : '<span class="badge badge-success">OK</span>';
        html += '<tr>' +
          '<td>' + (m.codigo || m.id) + '</td>' +
          '<td><strong>' + m.nombre + '</strong></td>' +
          '<td>' + (m.categoria || "-") + '</td>' +
          '<td>' + (m.unidad || "-") + '</td>' +
          '<td><span class="mp-stock ' + stockClass + '">' + m.stock + '</span></td>' +
          '<td>' + m.stockMin + '</td>' +
          '<td>' + _erp.formatearMoneda(m.costoUnitario || 0, m.monedaCostoBase || "VES") + '</td>' +
          '<td>' + (m.monedaCostoBase || "VES") + '</td>' +
          '<td>' + estado + '</td>' +
          '<td class="actions">' +
            '<button class="btn btn-primary btn-sm" onclick="window.FASE2_1.editMaterial(\'' + m.id + '\')"><i class="fas fa-edit"></i></button>' +
            '<button class="btn btn-danger btn-sm" onclick="window.FASE2_1.deleteMaterial(\'' + m.id + '\')"><i class="fas fa-trash"></i></button>' +
          '</td>' +
        '</tr>';
      }
      tbody.innerHTML = html;
    }

    // Actualizar KPIs del MODULO PADRE
    var stockBajo = materias.filter(function(m) { return m.stock < m.stockMin; }).length;
    var valorTotal = materias.reduce(function(sum, m) {
      return sum + ((m.stock || 0) * (m.costoUnitario || 0));
    }, 0);

    _erp.updateKPI(PARENT_MODULE, "mp-valor", _erp.formatearMoneda(valorTotal, db.config.monedaBase || "VES"), materias.length + " materiales");
    _erp.updateKPI(PARENT_MODULE, "stock-bajo", stockBajo, "0 criticos");

    // Actualizar KPIs internos
    var totalMPEl = $("f21_totalMP");
    var stockBajoEl = $("f21_stockBajo");
    var valorInvEl = $("f21_valorInv");
    if (totalMPEl) totalMPEl.textContent = materias.length;
    if (stockBajoEl) stockBajoEl.textContent = stockBajo;
    if (valorInvEl) valorInvEl.textContent = _erp.formatearMoneda(valorTotal, db.config.monedaBase || "VES");
  }

  // ─── CARGAR CATEGORIAS Y UNIDADES EN SELECTS ───
  function loadCategories() {
    var db = _erp.getDB();
    var cats = db.categorias || [];
    var unidades = db.unidades || [];
    var filterCat = $("f21_filterCat");
    var inpCategoria = $("f21_inpCategoria");
    var inpUnidad = $("f21_inpUnidad");

    if (filterCat) {
      var current = filterCat.value;
      var html = '<option value="">Todas las categorias</option>';
      for (var i = 0; i < cats.length; i++) {
        html += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + '</option>';
      }
      filterCat.innerHTML = html;
      filterCat.value = current;
    }
    if (inpCategoria) {
      var html = "";
      for (var i = 0; i < cats.length; i++) {
        html += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + '</option>';
      }
      inpCategoria.innerHTML = html;
    }
    if (inpUnidad) {
      var html = "";
      for (var i = 0; i < unidades.length; i++) {
        html += '<option value="' + unidades[i].nombre + '">' + unidades[i].nombre + ' (' + unidades[i].simbolo + ')</option>';
      }
      inpUnidad.innerHTML = html;
    }
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    var searchEl = $("f21_search");
    var filterCat = $("f21_filterCat");
    var filterStock = $("f21_filterStock");
    var btnAdd = $("f21_btnAdd");
    var btnExport = $("f21_btnExport");
    var modalClose = $("f21_modalClose");
    var btnCancel = $("f21_btnCancel");
    var btnSave = $("f21_btnSave");
    var modal = $("f21_modal");

    if (searchEl) searchEl.onkeyup = renderTable;
    if (filterCat) filterCat.onchange = renderTable;
    if (filterStock) filterStock.onchange = renderTable;
    if (btnAdd) btnAdd.onclick = openAdd;
    if (btnExport) btnExport.onclick = exportCSV;
    if (modalClose) modalClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    if (btnSave) btnSave.onclick = saveMaterial;
    if (modal) {
      modal.onclick = function(e) { if (e.target === modal) closeModal(); };
    }
  }

  // ─── MODAL: AGREGAR ───
  function openAdd() {
    editingId = null;
    var modalTitle = $("f21_modalTitle");
    var inpCodigo = $("f21_inpCodigo");
    var inpNombre = $("f21_inpNombre");
    var inpStock = $("f21_inpStock");
    var inpStockMin = $("f21_inpStockMin");
    var inpCosto = $("f21_inpCosto");
    var inpMoneda = $("f21_inpMoneda");
    var modal = $("f21_modal");

    if (modalTitle) modalTitle.textContent = "Agregar Material";
    if (inpCodigo) inpCodigo.value = "";
    if (inpNombre) inpNombre.value = "";
    if (inpStock) inpStock.value = "0";
    if (inpStockMin) inpStockMin.value = "0";
    if (inpCosto) inpCosto.value = "0";
    if (inpMoneda) inpMoneda.value = "VES";
    loadCategories();
    if (modal) modal.classList.add("active");
  }

  // ─── MODAL: EDITAR ───
  function openEdit(id) {
    editingId = id;
    var db = _erp.getDB();
    var materias = db.materiasPrimas || [];
    var m = null;
    for (var i = 0; i < materias.length; i++) {
      if (materias[i].id === id) { m = materias[i]; break; }
    }
    if (!m) return;

    var modalTitle = $("f21_modalTitle");
    var inpCodigo = $("f21_inpCodigo");
    var inpNombre = $("f21_inpNombre");
    var inpStock = $("f21_inpStock");
    var inpStockMin = $("f21_inpStockMin");
    var inpCosto = $("f21_inpCosto");
    var inpMoneda = $("f21_inpMoneda");
    var inpCategoria = $("f21_inpCategoria");
    var inpUnidad = $("f21_inpUnidad");
    var modal = $("f21_modal");

    if (modalTitle) modalTitle.textContent = "Editar Material";
    if (inpCodigo) inpCodigo.value = m.codigo || m.id;
    if (inpNombre) inpNombre.value = m.nombre;
    if (inpStock) inpStock.value = m.stock;
    if (inpStockMin) inpStockMin.value = m.stockMin;
    if (inpCosto) inpCosto.value = m.costoUnitario || 0;
    if (inpMoneda) inpMoneda.value = m.monedaCostoBase || "VES";
    loadCategories();
    if (inpCategoria) inpCategoria.value = m.categoria || "";
    if (inpUnidad) inpUnidad.value = m.unidad || "";
    if (modal) modal.classList.add("active");
  }

  // ─── CERRAR MODAL ───
  function closeModal() {
    var modal = $("f21_modal");
    if (modal) modal.classList.remove("active");
    editingId = null;
  }

  // ─── GUARDAR MATERIAL ───
  function saveMaterial() {
    var inpCodigo = $("f21_inpCodigo");
    var inpNombre = $("f21_inpNombre");
    var inpCategoria = $("f21_inpCategoria");
    var inpUnidad = $("f21_inpUnidad");
    var inpStock = $("f21_inpStock");
    var inpStockMin = $("f21_inpStockMin");
    var inpCosto = $("f21_inpCosto");
    var inpMoneda = $("f21_inpMoneda");

    var codigo = inpCodigo ? inpCodigo.value.trim() : "";
    var nombre = inpNombre ? inpNombre.value.trim() : "";
    var categoria = inpCategoria ? inpCategoria.value : "";
    var unidad = inpUnidad ? inpUnidad.value : "";
    var stock = parseFloat(inpStock ? inpStock.value : 0) || 0;
    var stockMin = parseFloat(inpStockMin ? inpStockMin.value : 0) || 0;
    var costo = parseFloat(inpCosto ? inpCosto.value : 0) || 0;
    var moneda = inpMoneda ? inpMoneda.value : "VES";

    if (!codigo || !nombre) {
      _erp.showToast("warning", "Validacion", "Codigo y nombre son obligatorios");
      return;
    }

    var db = _erp.getDB();
    if (!db.materiasPrimas) db.materiasPrimas = [];

    if (editingId) {
      var idx = -1;
      for (var i = 0; i < db.materiasPrimas.length; i++) {
        if (db.materiasPrimas[i].id === editingId) { idx = i; break; }
      }
      if (idx >= 0) {
        db.materiasPrimas[idx] = {
          id: editingId,
          codigo: codigo,
          nombre: nombre,
          categoria: categoria,
          unidad: unidad,
          stock: stock,
          stockMin: stockMin,
          costoUnitario: costo,
          monedaCostoBase: moneda
        };
      }
    } else {
      var newId = _erp.genId("MP");
      db.materiasPrimas.push({
        id: newId,
        codigo: codigo,
        nombre: nombre,
        categoria: categoria,
        unidad: unidad,
        stock: stock,
        stockMin: stockMin,
        costoUnitario: costo,
        monedaCostoBase: moneda
      });
    }

    _erp.saveLocal(db);
    closeModal();
    renderTable();
    _erp.showToast("success", "Guardado", nombre + " guardado correctamente");

    // Notificar al modulo padre
    if (window.FASE2_PADRE && window.FASE2_PADRE.render) {
      window.FASE2_PADRE.render();
    }
  }

  // ─── ELIMINAR MATERIAL ───
  function deleteMaterial(id) {
    _erp.showConfirm("Eliminar Material", "Estas seguro de eliminar este material?", function() {
      var db = _erp.getDB();
      var nuevaLista = [];
      for (var i = 0; i < (db.materiasPrimas || []).length; i++) {
        if (db.materiasPrimas[i].id !== id) nuevaLista.push(db.materiasPrimas[i]);
      }
      db.materiasPrimas = nuevaLista;
      _erp.saveLocal(db);
      renderTable();
      _erp.showToast("success", "Eliminado", "Material eliminado");
      if (window.FASE2_PADRE && window.FASE2_PADRE.render) {
        window.FASE2_PADRE.render();
      }
    });
  }

  // ─── EXPORTAR CSV ───
  function exportCSV() {
    var db = _erp.getDB();
    var materias = db.materiasPrimas || [];
    var csv = "Codigo,Nombre,Categoria,Unidad,Stock,StockMin,CostoUnitario,MonedaCosto\n";
    for (var i = 0; i < materias.length; i++) {
      var m = materias[i];
      csv += (m.codigo || m.id) + "," + m.nombre + "," + (m.categoria || "") + "," + (m.unidad || "") + "," + m.stock + "," + m.stockMin + "," + (m.costoUnitario || 0) + "," + (m.monedaCostoBase || "VES") + "\n";
    }
    var blob = new Blob([csv], {type: "text/csv"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "MateriasPrimas_" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    _erp.showToast("success", "Export OK", "CSV descargado");
  }

  // ─── DATOS DEMO ───
  function initDemo() {
    var db = _erp.getDB();
    if (!db.materiasPrimas || db.materiasPrimas.length === 0) {
      db.materiasPrimas = [
        {id:"MP001", codigo:"MP001", nombre:"Hidroxido de Sodio", unidad:"kg", stock:850, stockMin:200, costoUnitario:2.5, monedaCostoBase:"USD", categoria:"Bases"},
        {id:"MP002", codigo:"MP002", nombre:"Acido Clorhidrico", unidad:"L", stock:420, stockMin:100, costoUnitario:1.8, monedaCostoBase:"USD", categoria:"Acidos"},
        {id:"MP003", codigo:"MP003", nombre:"Hipoclorito de Sodio", unidad:"L", stock:680, stockMin:150, costoUnitario:1.2, monedaCostoBase:"USD", categoria:"Desinfectantes"},
        {id:"MP004", codigo:"MP004", nombre:"Envase Plastico 1L", unidad:"und", stock:1200, stockMin:300, costoUnitario:0.45, monedaCostoBase:"USD", categoria:"Empaque"},
        {id:"MP005", codigo:"MP005", nombre:"Etiquetas Adhesivas", unidad:"und", stock:5000, stockMin:1000, costoUnitario:0.08, monedaCostoBase:"USD", categoria:"Empaque"}
      ];
      _erp.saveLocal(db);
    }
  }

  // ─── HTML DEL CONTENIDO (se inyecta en el slot del padre) ───
  var CONTENT_HTML = '<div class="f21-wrapper">' +
    '<div class="f21-kpi-grid">' +
      '<div class="f21-kpi-card">' +
        '<div class="f21-kpi-header"><span class="f21-kpi-title">Total Materiales</span><div class="f21-kpi-icon blue"><i class="fas fa-boxes"></i></div></div>' +
        '<div class="f21-kpi-value" id="f21_totalMP">0</div>' +
      '</div>' +
      '<div class="f21-kpi-card">' +
        '<div class="f21-kpi-header"><span class="f21-kpi-title">Stock Bajo</span><div class="f21-kpi-icon red"><i class="fas fa-exclamation-triangle"></i></div></div>' +
        '<div class="f21-kpi-value" id="f21_stockBajo">0</div>' +
      '</div>' +
      '<div class="f21-kpi-card">' +
        '<div class="f21-kpi-header"><span class="f21-kpi-title">Valor Inventario</span><div class="f21-kpi-icon green"><i class="fas fa-coins"></i></div></div>' +
        '<div class="f21-kpi-value" id="f21_valorInv">Bs. 0,00</div>' +
      '</div>' +
    '</div>' +
    '<div class="f21-search-bar">' +
      '<input type="text" class="f21-search-input" id="f21_search" placeholder="Buscar por nombre o codigo...">' +
      '<select class="f21-filter-select" id="f21_filterCat"><option value="">Todas las categorias</option></select>' +
      '<select class="f21-filter-select" id="f21_filterStock"><option value="">Todos</option><option value="low">Stock Bajo</option><option value="ok">Stock OK</option></select>' +
      '<button class="btn btn-primary" id="f21_btnExport"><i class="fas fa-file-csv"></i> Export CSV</button>' +
    '</div>' +
    '<div class="f21-table-wrapper">' +
      '<table class="data-table" id="f21_table">' +
        '<thead><tr><th>Codigo</th><th>Nombre</th><th>Categoria</th><th>Unidad</th><th>Stock</th><th>Stock Min</th><th>Costo Unit</th><th>Moneda</th><th>Estado</th><th>Acciones</th></tr></thead>' +
        '<tbody id="f21_tbody"></tbody>' +
      '</table>' +
    '</div>' +
  '</div>';

  // ─── HTML DEL MODAL (se inyecta en slot-modals del padre) ───
  var MODAL_HTML = '<div class="modal-overlay" id="f21_modal" style="display:none;align-items:center;justify-content:center;">' +
    '<div class="modal-content" style="background:#1e293b;border:1px solid #334155;border-radius:12px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;">' +
      '<div class="modal-header" style="padding:20px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;">' +
        '<div class="modal-title" id="f21_modalTitle" style="font-size:16px;font-weight:600;color:#f1f5f9;">Agregar Material</div>' +
        '<button id="f21_modalClose" style="width:32px;height:32px;border-radius:6px;background:#334155;border:none;color:#f1f5f9;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">&times;</button>' +
      '</div>' +
      '<div class="modal-body" style="padding:20px;">' +
        '<div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Codigo</label><input type="text" id="f21_inpCodigo" placeholder="Ej: MP006" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Nombre</label><input type="text" id="f21_inpNombre" placeholder="Nombre del material" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Categoria</label><select id="f21_inpCategoria" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></select></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Unidad</label><select id="f21_inpUnidad" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></select></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Stock Inicial</label><input type="number" id="f21_inpStock" value="0" min="0" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Stock Minimo</label><input type="number" id="f21_inpStockMin" value="0" min="0" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Costo Unitario</label><input type="number" id="f21_inpCosto" value="0" step="0.01" min="0" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"></div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Moneda Costo</label><select id="f21_inpMoneda" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"><option value="VES">VES (Bolivar)</option><option value="USD">USD (Dolar)</option><option value="EUR">EUR (Euro)</option></select></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-footer" style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:10px;">' +
        '<button class="btn btn-secondary" id="f21_btnCancel">Cancelar</button>' +
        '<button class="btn btn-primary" id="f21_btnSave"><i class="fas fa-save"></i> Guardar</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ─── CSS SCOPED ───
  var PLUGIN_CSS = [
    '/* FASE2_1 - Materias Primas */',
    '#mod-fase2 .f21-wrapper { padding: 0; }',
    '#mod-fase2 .f21-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }',
    '#mod-fase2 .f21-kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }',
    '#mod-fase2 .f21-kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }',
    '#mod-fase2 .f21-kpi-title { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; }',
    '#mod-fase2 .f21-kpi-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }',
    '#mod-fase2 .f21-kpi-icon.blue { background: rgba(59,130,246,.15); color: #3b82f6; }',
    '#mod-fase2 .f21-kpi-icon.red { background: rgba(239,68,68,.15); color: #ef4444; }',
    '#mod-fase2 .f21-kpi-icon.green { background: rgba(16,185,129,.15); color: #10b981; }',
    '#mod-fase2 .f21-kpi-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }',
    '#mod-fase2 .f21-search-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }',
    '#mod-fase2 .f21-search-input { flex: 1; min-width: 200px; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 13px; outline: none; }',
    '#mod-fase2 .f21-search-input:focus { border-color: #3b82f6; }',
    '#mod-fase2 .f21-filter-select { padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 13px; min-width: 150px; outline: none; }',
    '#mod-fase2 .f21-filter-select:focus { border-color: #3b82f6; }',
    '#mod-fase2 .f21-table-wrapper { overflow-x: auto; }',
    '#mod-fase2 .mp-stock { font-size: 18px; font-weight: 700; }',
    '#mod-fase2 .mp-stock.low { color: #ef4444; }',
    '#mod-fase2 .mp-stock.ok { color: #10b981; }',
    '#mod-fase2 #f21_modal.active { display: flex !important; }',
    '#mod-fase2 #f21_modal { z-index: 2500; position: fixed; inset: 0; background: rgba(0,0,0,.7); }'
  ].join('\n');

  // ─── FUNCION PRINCIPAL DE RENDER (llamada por el modulo padre) ───
  function render() {
    if (!_erp) return;
    // Inyectar contenido en el slot-content del modulo padre
    var contentSlot = $(PARENT_MODULE + "-slot-content");
    if (contentSlot) {
      var tab1 = $("fase2-tab1-content");
      if (tab1) {
        tab1.innerHTML = CONTENT_HTML;
        tab1.style.display = "block";
      }
    }
    // Inyectar modal en slot-modals
    var modalsSlot = $(PARENT_MODULE + "-slot-modals");
    if (modalsSlot) {
      var existente = $("f21_modal");
      if (!existente) {
        modalsSlot.innerHTML = modalsSlot.innerHTML + MODAL_HTML;
      }
    }
    bindEvents();
    loadCategories();
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

    // Habilitar botones del modulo padre
    _erp.enableButton(PARENT_MODULE, "nuevo-mov", function() {
      _erp.showToast("info", "FASE2_1", "Use el boton Agregar Material en la tabla");
    }, "Nuevo Movimiento", "fa-plus");

    _erp.enableButton(PARENT_MODULE, "nuevo-mat", openAdd, "Nuevo Material", "fa-box");

    _erp.enableButton(PARENT_MODULE, "inventario", function() {
      _erp.showToast("info", "Inventario", "Funcion en desarrollo - requiere FASE2_5+");
    }, "Inventario Fisico", "fa-clipboard-check");

    _erp.enableButton(PARENT_MODULE, "exportar", exportCSV, "Exportar Kardex", "fa-file-export");

    // Activar tab del modulo padre
    _erp.activateTab(PARENT_MODULE, "1", function() {
      render();
    }, "Materias Primas");

    // Habilitar filtros del padre
    _erp.populateFilter(PARENT_MODULE, "categoria", [
      {value: "", text: "Todas las categorias"},
      {value: "Bases", text: "Bases"},
      {value: "Acidos", text: "Acidos"},
      {value: "Desinfectantes", text: "Desinfectantes"},
      {value: "Empaque", text: "Empaque"}
    ]);

    _erp.populateFilter(PARENT_MODULE, "estado", [
      {value: "", text: "Todos los estados"},
      {value: "ok", text: "Stock OK"},
      {value: "low", text: "Stock Bajo"}
    ]);

    // Habilitar campo de busqueda del padre
    var filterBuscar = $(PARENT_MODULE + "-filter-buscar");
    if (filterBuscar) {
      filterBuscar.disabled = false;
      filterBuscar.onkeyup = function() {
        var searchEl = $("f21_search");
        if (searchEl) {
          searchEl.value = filterBuscar.value;
          renderTable();
        }
      };
    }

    // Datos demo
    initDemo();

    // Render inicial
    render();

    console.log("[" + PLUGIN_ID + "] Plugin inicializado correctamente v" + PLUGIN_VERSION);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // API GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════════

  window.FASE2_1 = {
    PLUGIN_ID: PLUGIN_ID,
    PLUGIN_VERSION: PLUGIN_VERSION,
    PLUGIN_NAME: PLUGIN_NAME,
    parentModule: PARENT_MODULE,
    render: render,
    editMaterial: openEdit,
    deleteMaterial: deleteMaterial,
    refresh: function() { renderTable(); }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEFINICION DEL PLUGIN
  // ═══════════════════════════════════════════════════════════════════════════════

  var pluginDef = {
    id: "FASE2_1",
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: PLUGIN_FASE,
    microFase: PLUGIN_MICRO,
    autor: "VIAO35",
    descripcion: "CRUD completo de materias primas con multi-moneda. Tabla con busqueda, filtros por categoria, y 5 registros demo.",
    schemaVersionRequerida: SCHEMA_REQ,
    dependencias: DEPENDENCIAS,
    menu: null,

    schema: {
      materiasPrimas: []
    },

    css: PLUGIN_CSS,
    html: "", // HTML se inyecta dinamicamente en los slots del padre

    init: function(erp) {
      _erp = erp;
      // Esperar a que el DOM del modulo padre este listo
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
