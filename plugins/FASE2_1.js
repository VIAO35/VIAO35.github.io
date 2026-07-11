(function() {
  var PLUGIN_ID = "FASE2_1";
  var PLUGIN_VERSION = "3.0.0";
  var PLUGIN_NAME = "Materias Primas";

  var plugin = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: 2,
    microFase: "2.1",
    autor: "ERP Industrial Team",
    descripcion: "CRUD completo de materias primas con multi-moneda. Tabla con busqueda, filtros por categoria, y 5 registros demo.",
    schemaVersionRequerida: "3.0.0",
    dependencias: ["FASE1_10"],

    schema: {},

    // Micro-fase: SIN menu propio, se activa desde el modulo padre
    menu: null,

    css: `
      #mod-fase2-1 .mp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px; }
      #mod-fase2-1 .mp-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; transition: .2s; }
      #mod-fase2-1 .mp-card:hover { border-color: #3b82f6; }
      #mod-fase2-1 .mp-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      #mod-fase2-1 .mp-card-title { font-size: 14px; font-weight: 600; color: #f1f5f9; }
      #mod-fase2-1 .mp-card-meta { font-size: 12px; color: #94a3b8; }
      #mod-fase2-1 .mp-stock { font-size: 24px; font-weight: 700; color: #3b82f6; }
      #mod-fase2-1 .mp-stock.low { color: #ef4444; }
      #mod-fase2-1 .mp-stock.ok { color: #10b981; }
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
    `,

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
          <div class="chart-card-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
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

    init: function(erp) {
      var _erp = erp;
      var editingId = null;

      // Referencias a elementos
      var elSearch, elFilterCat, elFilterStock, elTbody, elTotal, elStockBajo, elValorInv;
      var elModal, elModalTitle, elModalClose, elBtnCancel, elBtnSave, elBtnAdd, elBtnExport;
      var elInpCodigo, elInpNombre, elInpCategoria, elInpUnidad, elInpStock, elInpStockMin, elInpCosto, elInpMoneda;

      function getEls() {
        if (!elSearch) elSearch = document.getElementById("f21_search");
        if (!elFilterCat) elFilterCat = document.getElementById("f21_filterCat");
        if (!elFilterStock) elFilterStock = document.getElementById("f21_filterStock");
        if (!elTbody) elTbody = document.getElementById("f21_tbody");
        if (!elTotal) elTotal = document.getElementById("f21_totalMP");
        if (!elStockBajo) elStockBajo = document.getElementById("f21_stockBajo");
        if (!elValorInv) elValorInv = document.getElementById("f21_valorInv");
        if (!elModal) elModal = document.getElementById("f21_modal");
        if (!elModalTitle) elModalTitle = document.getElementById("f21_modalTitle");
        if (!elModalClose) elModalClose = document.getElementById("f21_modalClose");
        if (!elBtnCancel) elBtnCancel = document.getElementById("f21_btnCancel");
        if (!elBtnSave) elBtnSave = document.getElementById("f21_btnSave");
        if (!elBtnAdd) elBtnAdd = document.getElementById("f21_btnAdd");
        if (!elBtnExport) elBtnExport = document.getElementById("f21_btnExport");
        if (!elInpCodigo) elInpCodigo = document.getElementById("f21_inpCodigo");
        if (!elInpNombre) elInpNombre = document.getElementById("f21_inpNombre");
        if (!elInpCategoria) elInpCategoria = document.getElementById("f21_inpCategoria");
        if (!elInpUnidad) elInpUnidad = document.getElementById("f21_inpUnidad");
        if (!elInpStock) elInpStock = document.getElementById("f21_inpStock");
        if (!elInpStockMin) elInpStockMin = document.getElementById("f21_inpStockMin");
        if (!elInpCosto) elInpCosto = document.getElementById("f21_inpCosto");
        if (!elInpMoneda) elInpMoneda = document.getElementById("f21_inpMoneda");
      }

      function bindEvents() {
        getEls();
        if (elSearch) elSearch.addEventListener("keyup", renderTable);
        if (elFilterCat) elFilterCat.addEventListener("change", renderTable);
        if (elFilterStock) elFilterStock.addEventListener("change", renderTable);
        if (elBtnAdd) elBtnAdd.addEventListener("click", openAdd);
        if (elBtnExport) elBtnExport.addEventListener("click", exportCSV);
        if (elModalClose) elModalClose.addEventListener("click", closeModal);
        if (elBtnCancel) elBtnCancel.addEventListener("click", closeModal);
        if (elBtnSave) elBtnSave.addEventListener("click", saveMaterial);
        if (elModal) elModal.addEventListener("click", function(e) { if (e.target === elModal) closeModal(); });
      }

      function loadCategories() {
        getEls();
        var db = _erp.getDB();
        var cats = db.categorias || [];
        var unidades = db.unidades || [];
        if (elFilterCat) {
          var current = elFilterCat.value;
          var html = '<option value="">Todas las categorias</option>';
          for (var i = 0; i < cats.length; i++) {
            html += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + '</option>';
          }
          elFilterCat.innerHTML = html;
          elFilterCat.value = current;
        }
        if (elInpCategoria) {
          var html = '';
          for (var i = 0; i < cats.length; i++) {
            html += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + '</option>';
          }
          elInpCategoria.innerHTML = html;
        }
        if (elInpUnidad) {
          var html = '';
          for (var i = 0; i < unidades.length; i++) {
            html += '<option value="' + unidades[i].nombre + '">' + unidades[i].nombre + ' (' + unidades[i].simbolo + ')</option>';
          }
          elInpUnidad.innerHTML = html;
        }
      }

      function renderTable() {
        getEls();
        var db = _erp.getDB();
        var materias = db.materiasPrimas || [];
        var search = (elSearch ? elSearch.value : "").toLowerCase();
        var catFilter = elFilterCat ? elFilterCat.value : "";
        var stockFilter = elFilterStock ? elFilterStock.value : "";

        var filtered = materias.filter(function(m) {
          if (search && m.nombre.toLowerCase().indexOf(search) === -1 && (m.codigo || "").toLowerCase().indexOf(search) === -1) return false;
          if (catFilter && m.categoria !== catFilter) return false;
          if (stockFilter === "low" && m.stock >= m.stockMin) return false;
          if (stockFilter === "ok" && m.stock < m.stockMin) return false;
          return true;
        });

        if (!elTbody) return;

        if (filtered.length === 0) {
          elTbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:20px">No hay materias primas registradas</td></tr>';
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
          elTbody.innerHTML = html;
        }

        // Actualizar KPIs
        var stockBajo = materias.filter(function(m) { return m.stock < m.stockMin; }).length;
        var valorTotal = materias.reduce(function(sum, m) {
          return sum + ((m.stock || 0) * (m.costoUnitario || 0));
        }, 0);
        if (elTotal) elTotal.textContent = materias.length;
        if (elStockBajo) elStockBajo.textContent = stockBajo;
        if (elValorInv) elValorInv.textContent = _erp.formatearMoneda(valorTotal, db.config.monedaBase || "VES");
      }

      function openAdd() {
        editingId = null;
        getEls();
        if (elModalTitle) elModalTitle.textContent = "Agregar Material";
        if (elInpCodigo) elInpCodigo.value = "";
        if (elInpNombre) elInpNombre.value = "";
        if (elInpStock) elInpStock.value = "0";
        if (elInpStockMin) elInpStockMin.value = "0";
        if (elInpCosto) elInpCosto.value = "0";
        if (elInpMoneda) elInpMoneda.value = "VES";
        loadCategories();
        if (elModal) elModal.classList.add("active");
      }

      function openEdit(id) {
        editingId = id;
        getEls();
        var db = _erp.getDB();
        var m = (db.materiasPrimas || []).find(function(x) { return x.id === id; });
        if (!m) return;
        if (elModalTitle) elModalTitle.textContent = "Editar Material";
        if (elInpCodigo) elInpCodigo.value = m.codigo || m.id;
        if (elInpNombre) elInpNombre.value = m.nombre;
        if (elInpStock) elInpStock.value = m.stock;
        if (elInpStockMin) elInpStockMin.value = m.stockMin;
        if (elInpCosto) elInpCosto.value = m.costoUnitario || 0;
        if (elInpMoneda) elInpMoneda.value = m.monedaCostoBase || "VES";
        loadCategories();
        if (elInpCategoria) elInpCategoria.value = m.categoria || "";
        if (elInpUnidad) elInpUnidad.value = m.unidad || "";
        if (elModal) elModal.classList.add("active");
      }

      function closeModal() {
        getEls();
        if (elModal) elModal.classList.remove("active");
        editingId = null;
      }

      function saveMaterial() {
        getEls();
        var codigo = elInpCodigo ? elInpCodigo.value.trim() : "";
        var nombre = elInpNombre ? elInpNombre.value.trim() : "";
        var categoria = elInpCategoria ? elInpCategoria.value : "";
        var unidad = elInpUnidad ? elInpUnidad.value : "";
        var stock = parseFloat(elInpStock ? elInpStock.value : 0) || 0;
        var stockMin = parseFloat(elInpStockMin ? elInpStockMin.value : 0) || 0;
        var costo = parseFloat(elInpCosto ? elInpCosto.value : 0) || 0;
        var moneda = elInpMoneda ? elInpMoneda.value : "VES";

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

      // Exponer funciones globales para el modulo padre
      window.FASE2_1 = {
        openModal: function() {
          // Navegar al modulo del plugin
          var pageName = PLUGIN_ID.toLowerCase().replace(/\./g, "-");
          if (window.showModule) window.showModule(pageName);
        },
        render: renderTable,
        editMaterial: openEdit,
        deleteMaterial: deleteMaterial
      };

      // Evento cuando se muestra el modulo
      document.addEventListener("erp:module:shown", function(e) {
        var pageName = PLUGIN_ID.toLowerCase().replace(/\./g, "-");
        if (e.detail && e.detail.moduleName === pageName) {
          bindEvents();
          loadCategories();
          initDemo();
          renderTable();
        }
      });

      // Bind inicial (por si el modulo ya esta visible)
      setTimeout(function() {
        var pageName = PLUGIN_ID.toLowerCase().replace(/\./g, "-");
        var mod = document.getElementById("mod-" + pageName);
        if (mod && mod.style.display !== "none") {
          bindEvents();
          loadCategories();
          initDemo();
          renderTable();
        }
      }, 500);

      console.log("FASE2_1 inicializado: Materias Primas");
    },

    onShow: function(erp) {
      // El renderizado se maneja via evento erp:module:shown
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();