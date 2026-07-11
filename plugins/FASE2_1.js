// ═══════════════════════════════════════════════════════════════════════════════
// FASE 2.1 - MATERIAS PRIMAS (Tabla Materiales)
// CRUD completo de materias primas con multi-moneda
// Tabla con busqueda, filtros por categoria, y 5 registros demo
// Dependencia: FASE1_10
// ═══════════════════════════════════════════════════════════════════════════════
// MODELO CANONICO PARA MICRO-FASES ERP v3.0
// Patron a seguir: IIFE + erp.registerPlugin() + window.FASE{X}_{Y}
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  // ─── CONFIGURACION DEL PLUGIN (SIEMPRE AL INICIO, ANTES DE CUALQUIER DATO) ───
  var PLUGIN_ID       = "FASE2_1";
  var PLUGIN_VERSION  = "3.0.0";
  var PLUGIN_NAME     = "Materias Primas";
  var PLUGIN_FASE     = 2;
  var PLUGIN_MICRO    = "2.1";
  var SCHEMA_REQ      = "3.0.0";
  var DEPENDENCIAS    = ["FASE1_10"];

  var _erp = null;
  var editingId = null;
  var els = {};

  // ─── CACHE DE ELEMENTOS DOM ───
  function getEls() {
    var ids = [
      "search","filterCat","filterStock","tbody","totalMP","stockBajo","valorInv",
      "modal","modalTitle","modalClose","btnCancel","btnSave","btnAdd","btnExport",
      "inpCodigo","inpNombre","inpCategoria","inpUnidad","inpStock","inpStockMin","inpCosto","inpMoneda"
    ];
    for (var i = 0; i < ids.length; i++) {
      var k = ids[i];
      if (!els[k]) els[k] = document.getElementById("f21_" + k);
    }
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    getEls();
    if (els.search)      els.search.addEventListener("keyup", renderTable);
    if (els.filterCat)   els.filterCat.addEventListener("change", renderTable);
    if (els.filterStock) els.filterStock.addEventListener("change", renderTable);
    if (els.btnAdd)      els.btnAdd.addEventListener("click", openAdd);
    if (els.btnExport)   els.btnExport.addEventListener("click", exportCSV);
    if (els.modalClose)  els.modalClose.addEventListener("click", closeModal);
    if (els.btnCancel)   els.btnCancel.addEventListener("click", closeModal);
    if (els.btnSave)     els.btnSave.addEventListener("click", saveMaterial);
    if (els.modal)       els.modal.addEventListener("click", function(e) { if (e.target === els.modal) closeModal(); });
  }

  // ─── CARGAR CATEGORIAS Y UNIDADES EN SELECTS ───
  function loadCategories() {
    getEls();
    var db = _erp.getDB();
    var cats = db.categorias || [];
    var unidades = db.unidades || [];

    if (els.filterCat) {
      var current = els.filterCat.value;
      var html = '<option value="">Todas las categorias</option>';
      for (var i = 0; i < cats.length; i++) {
        html += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + '</option>';
      }
      els.filterCat.innerHTML = html;
      els.filterCat.value = current;
    }
    if (els.inpCategoria) {
      var html = '';
      for (var i = 0; i < cats.length; i++) {
        html += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + '</option>';
      }
      els.inpCategoria.innerHTML = html;
    }
    if (els.inpUnidad) {
      var html = '';
      for (var i = 0; i < unidades.length; i++) {
        html += '<option value="' + unidades[i].nombre + '">' + unidades[i].nombre + ' (' + unidades[i].simbolo + ')</option>';
      }
      els.inpUnidad.innerHTML = html;
    }
  }

  // ─── RENDERIZAR TABLA ───
  function renderTable() {
    getEls();
    var db = _erp.getDB();
    var materias = db.materiasPrimas || [];
    var search = (els.search ? els.search.value : "").toLowerCase();
    var catFilter = els.filterCat ? els.filterCat.value : "";
    var stockFilter = els.filterStock ? els.filterStock.value : "";

    var filtered = materias.filter(function(m) {
      if (search && m.nombre.toLowerCase().indexOf(search) === -1 && (m.codigo || "").toLowerCase().indexOf(search) === -1) return false;
      if (catFilter && m.categoria !== catFilter) return false;
      if (stockFilter === "low" && m.stock >= m.stockMin) return false;
      if (stockFilter === "ok" && m.stock < m.stockMin) return false;
      return true;
    });

    if (!els.tbody) return;

    if (filtered.length === 0) {
      els.tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:20px">No hay materias primas registradas</td></tr>';
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
      els.tbody.innerHTML = html;
    }

    // Actualizar KPIs
    var stockBajo = materias.filter(function(m) { return m.stock < m.stockMin; }).length;
    var valorTotal = materias.reduce(function(sum, m) {
      return sum + ((m.stock || 0) * (m.costoUnitario || 0));
    }, 0);
    if (els.totalMP) els.totalMP.textContent = materias.length;
    if (els.stockBajo) els.stockBajo.textContent = stockBajo;
    if (els.valorInv) els.valorInv.textContent = _erp.formatearMoneda(valorTotal, db.config.monedaBase || "VES");
  }

  // ─── MODAL: AGREGAR ───
  function openAdd() {
    editingId = null;
    getEls();
    if (els.modalTitle) els.modalTitle.textContent = "Agregar Material";
    if (els.inpCodigo) els.inpCodigo.value = "";
    if (els.inpNombre) els.inpNombre.value = "";
    if (els.inpStock) els.inpStock.value = "0";
    if (els.inpStockMin) els.inpStockMin.value = "0";
    if (els.inpCosto) els.inpCosto.value = "0";
    if (els.inpMoneda) els.inpMoneda.value = "VES";
    loadCategories();
    if (els.modal) els.modal.classList.add("active");
  }

  // ─── MODAL: EDITAR ───
  function openEdit(id) {
    editingId = id;
    getEls();
    var db = _erp.getDB();
    var m = (db.materiasPrimas || []).find(function(x) { return x.id === id; });
    if (!m) return;
    if (els.modalTitle) els.modalTitle.textContent = "Editar Material";
    if (els.inpCodigo) els.inpCodigo.value = m.codigo || m.id;
    if (els.inpNombre) els.inpNombre.value = m.nombre;
    if (els.inpStock) els.inpStock.value = m.stock;
    if (els.inpStockMin) els.inpStockMin.value = m.stockMin;
    if (els.inpCosto) els.inpCosto.value = m.costoUnitario || 0;
    if (els.inpMoneda) els.inpMoneda.value = m.monedaCostoBase || "VES";
    loadCategories();
    if (els.inpCategoria) els.inpCategoria.value = m.categoria || "";
    if (els.inpUnidad) els.inpUnidad.value = m.unidad || "";
    if (els.modal) els.modal.classList.add("active");
  }

  // ─── CERRAR MODAL ───
  function closeModal() {
    getEls();
    if (els.modal) els.modal.classList.remove("active");
    editingId = null;
  }

  // ─── GUARDAR MATERIAL ───
  function saveMaterial() {
    getEls();
    var codigo = els.inpCodigo ? els.inpCodigo.value.trim() : "";
    var nombre = els.inpNombre ? els.inpNombre.value.trim() : "";
    var categoria = els.inpCategoria ? els.inpCategoria.value : "";
    var unidad = els.inpUnidad ? els.inpUnidad.value : "";
    var stock = parseFloat(els.inpStock ? els.inpStock.value : 0) || 0;
    var stockMin = parseFloat(els.inpStockMin ? els.inpStockMin.value : 0) || 0;
    var costo = parseFloat(els.inpCosto ? els.inpCosto.value : 0) || 0;
    var moneda = els.inpMoneda ? els.inpMoneda.value : "VES";

    if (!codigo || !nombre) {
      _erp.showToast("warning", "Validacion", "Codigo y nombre son obligatorios");
      return;
    }

    var db = _erp.getDB();
    if (!db.materiasPrimas) db.materiasPrimas = [];

    if (editingId) {
      var idx = db.materiasPrimas.findIndex(function(m) { return m.id === editingId; });
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

    // Notificar al modulo padre para refrescar
    if (window.FASE2_PADRE && window.FASE2_PADRE.render) {
      window.FASE2_PADRE.render();
    }
  }

  // ─── ELIMINAR MATERIAL ───
  function deleteMaterial(id) {
    _erp.showConfirm("Eliminar Material", "Estas seguro de eliminar este material?", function() {
      var db = _erp.getDB();
      db.materiasPrimas = (db.materiasPrimas || []).filter(function(m) { return m.id !== id; });
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEFINICION DEL PLUGIN (ESTANDAR ERP v3.0)
  // ═══════════════════════════════════════════════════════════════════════════════

  // 1. EXPONER API GLOBAL para el modulo padre y botones inline
  window.FASE2_1 = {
    PLUGIN_ID: PLUGIN_ID,
    PLUGIN_VERSION: PLUGIN_VERSION,
    openModal: function() {
      // Las micro-fases no tienen pagina propia, se abren desde el padre
      // Este metodo puede ser llamado por el modulo padre para activar la funcionalidad
      var pageName = PLUGIN_ID.toLowerCase().replace(/\./g, "-");
      if (window.showModule) window.showModule(pageName);
    },
    render: renderTable,
    editMaterial: openEdit,
    deleteMaterial: deleteMaterial,
    refresh: function() { renderTable(); }
  };

  // 2. DEFINICION DEL PLUGIN para erp.registerPlugin()
  var pluginDef = {
    // ─── META ───
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: PLUGIN_FASE,
    microFase: PLUGIN_MICRO,
    autor: "ERP Industrial Team",
    descripcion: "CRUD completo de materias primas con multi-moneda. Tabla con busqueda, filtros por categoria, y 5 registros demo.",
    schemaVersionRequerida: SCHEMA_REQ,
    dependencias: DEPENDENCIAS,
    menu: null, // Micro-fase: sin menu propio en sidebar

    // ─── SCHEMA (se mergea con la DB si no existe) ───
    schema: {
      materiasPrimas: []
    },

    // ─── CSS SCOPED ───
    // SIEMPRE usar #mod-fase{X}-{Y} como root selector
    css: `
      #mod-fase2-1 .search-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
      #mod-fase2-1 .search-input { flex: 1; min-width: 200px; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 13px; }
      #mod-fase2-1 .filter-select { padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 13px; min-width: 150px; }
      #mod-fase2-1 .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 2500; display: none; align-items: center; justify-content: center; padding: 20px; }
      #mod-fase2-1 .modal-overlay.active { display: flex; }
      #mod-fase2-1 .modal-content { background: #1e293b; border: 1px solid #334155; border-radius: 12px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
      #mod-fase2-1 .modal-header { padding: 20px; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; }
      #mod-fase2-1 .modal-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }
      #mod-fase2-1 .modal-body { padding: 20px; }
      #mod-fase2-1 .modal-footer { padding: 0 20px 20px; display: flex; justify-content: flex-end; gap: 10px; }
      #mod-fase2-1 .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
      #mod-fase2-1 .form-group { display: flex; flex-direction: column; gap: 6px; }
      #mod-fase2-1 .form-group label { font-size: 12px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; }
      #mod-fase2-1 .form-group input, #mod-fase2-1 .form-group select { padding: 10px 12px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 13px; outline: none; }
      #mod-fase2-1 .form-group input:focus, #mod-fase2-1 .form-group select:focus { border-color: #3b82f6; }
      #mod-fase2-1 .mp-stock { font-size: 18px; font-weight: 700; }
      #mod-fase2-1 .mp-stock.low { color: #ef4444; }
      #mod-fase2-1 .mp-stock.ok { color: #10b981; }
      #mod-fase2-1 .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
      #mod-fase2-1 .kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
      #mod-fase2-1 .kpi-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      #mod-fase2-1 .kpi-card-title { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; }
      #mod-fase2-1 .kpi-card-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
      #mod-fase2-1 .kpi-card-icon.blue { background: rgba(59,130,246,.15); color: #3b82f6; }
      #mod-fase2-1 .kpi-card-icon.red { background: rgba(239,68,68,.15); color: #ef4444; }
      #mod-fase2-1 .kpi-card-icon.green { background: rgba(16,185,129,.15); color: #10b981; }
      #mod-fase2-1 .kpi-card-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }
      #mod-fase2-1 .chart-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
      #mod-fase2-1 .chart-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      #mod-fase2-1 .chart-card-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }
      #mod-fase2-1 .data-table-wrapper { overflow-x: auto; }
      #mod-fase2-1 .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      #mod-fase2-1 .data-table th { text-align: left; padding: 12px 16px; background: #334155; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; font-weight: 600; border-bottom: 1px solid #475569; }
      #mod-fase2-1 .data-table td { padding: 12px 16px; border-bottom: 1px solid #334155; color: #f1f5f9; }
      #mod-fase2-1 .data-table tr:hover td { background: rgba(255,255,255,.02); }
      #mod-fase2-1 .data-table .actions { display: flex; gap: 6px; }
      #mod-fase2-1 .badge { padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; }
      #mod-fase2-1 .badge-success { background: rgba(16,185,129,.15); color: #10b981; }
      #mod-fase2-1 .badge-danger { background: rgba(239,68,68,.15); color: #ef4444; }
    `,

    // ─── HTML ───
    // SIEMPRE envolver en <div id="mod-fase{X}-{Y}">
    html: `
      <div id="mod-fase2-1">
        <h1 class="page-title"><i class="fas fa-boxes"></i> Materias Primas</h1>
        <p class="page-subtitle">Fase 2.1 - Inventario de materias primas y materiales</p>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">Total Materiales</span><div class="kpi-card-icon blue"><i class="fas fa-boxes"></i></div></div>
            <div class="kpi-card-value" id="f21_totalMP">0</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">Stock Bajo</span><div class="kpi-card-icon red"><i class="fas fa-exclamation-triangle"></i></div></div>
            <div class="kpi-card-value" id="f21_stockBajo">0</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">Valor Inventario</span><div class="kpi-card-icon green"><i class="fas fa-coins"></i></div></div>
            <div class="kpi-card-value" id="f21_valorInv">Bs. 0,00</div>
          </div>
        </div>

        <div class="search-bar">
          <input type="text" class="search-input" id="f21_search" placeholder="Buscar por nombre o codigo...">
          <select class="filter-select" id="f21_filterCat">
            <option value="">Todas las categorias</option>
          </select>
          <select class="filter-select" id="f21_filterStock">
            <option value="">Todos</option>
            <option value="low">Stock Bajo</option>
            <option value="ok">Stock OK</option>
          </select>
          <button class="btn btn-primary" id="f21_btnExport"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>

        <div class="chart-card">
          <div class="chart-card-header">
            <span class="chart-card-title">Materias Primas</span>
            <button class="btn btn-success btn-sm" id="f21_btnAdd"><i class="fas fa-plus"></i> Agregar Material</button>
          </div>
          <div class="data-table-wrapper">
            <table class="data-table" id="f21_table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Categoria</th>
                  <th>Unidad</th>
                  <th>Stock</th>
                  <th>Stock Min</th>
                  <th>Costo Unit</th>
                  <th>Moneda</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="f21_tbody"></tbody>
            </table>
          </div>
        </div>

        <!-- Modal Agregar/Editar -->
        <div class="modal-overlay" id="f21_modal">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-title" id="f21_modalTitle">Agregar Material</div>
              <button class="modal-close" id="f21_modalClose" style="width:32px;height:32px;border-radius:6px;background:#334155;border:none;color:#f1f5f9;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label>Codigo</label>
                  <input type="text" id="f21_inpCodigo" placeholder="Ej: MP006">
                </div>
                <div class="form-group">
                  <label>Nombre</label>
                  <input type="text" id="f21_inpNombre" placeholder="Nombre del material">
                </div>
                <div class="form-group">
                  <label>Categoria</label>
                  <select id="f21_inpCategoria"></select>
                </div>
                <div class="form-group">
                  <label>Unidad</label>
                  <select id="f21_inpUnidad"></select>
                </div>
                <div class="form-group">
                  <label>Stock Inicial</label>
                  <input type="number" id="f21_inpStock" value="0" min="0">
                </div>
                <div class="form-group">
                  <label>Stock Minimo</label>
                  <input type="number" id="f21_inpStockMin" value="0" min="0">
                </div>
                <div class="form-group">
                  <label>Costo Unitario</label>
                  <input type="number" id="f21_inpCosto" value="0" step="0.01" min="0">
                </div>
                <div class="form-group">
                  <label>Moneda Costo</label>
                  <select id="f21_inpMoneda">
                    <option value="VES">VES (Bolivar)</option>
                    <option value="USD">USD (Dolar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="f21_btnCancel">Cancelar</button>
              <button class="btn btn-primary" id="f21_btnSave"><i class="fas fa-save"></i> Guardar</button>
            </div>
          </div>
        </div>
      </div>
    `,

    // ─── INIT: Se ejecuta cuando el plugin se registra ───
    init: function(erp) {
      _erp = erp;
      // Esperar a que el DOM del plugin este listo
      setTimeout(function() {
        bindEvents();
        loadCategories();
        initDemo();
        renderTable();
      }, 100);
    },

    // ─── ONSHOW: Se ejecuta cada vez que se muestra el modulo ───
    onShow: function(erp) {
      _erp = erp;
      bindEvents();
      loadCategories();
      renderTable();
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
