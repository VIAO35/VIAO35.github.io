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

    schema: {}, // Usa schema existente del core: materiasPrimas, categorias, unidades

    menu: {
      section: "Fases Instaladas",
      label: "Materias Primas",
      icono: "fas fa-boxes",
      badge: "2.1",
      orden: 2
    },

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
          <input type="text" class="search-input" id="f21_search" placeholder="Buscar por nombre o codigo..." onkeyup="f21_filter()">
          <select class="filter-select" id="f21_filterCat" onchange="f21_filter()">
            <option value="">Todas las categorias</option>
          </select>
          <select class="filter-select" id="f21_filterStock" onchange="f21_filter()">
            <option value="">Todos</option>
            <option value="low">Stock Bajo</option>
            <option value="ok">Stock OK</option>
          </select>
          <button class="btn btn-primary" onclick="f21_exportCSV()"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>

        <div class="chart-card">
          <div class="chart-card-header"><span class="chart-card-title">Materias Primas</span></div>
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
                </tr>
              </thead>
              <tbody id="f21_tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f21_erp = erp;

      window.f21_filter = function() {
        f21_renderTable();
      };

      window.f21_renderTable = function() {
        var db = erp.getDB();
        var materias = db.materiasPrimas || [];
        var search = (document.getElementById("f21_search").value || "").toLowerCase();
        var catFilter = document.getElementById("f21_filterCat").value;
        var stockFilter = document.getElementById("f21_filterStock").value;

        var filtered = materias.filter(function(m) {
          if (search && m.nombre.toLowerCase().indexOf(search) === -1 && m.codigo.toLowerCase().indexOf(search) === -1) return false;
          if (catFilter && m.categoria !== catFilter) return false;
          if (stockFilter === "low" && m.stock >= m.stockMin) return false;
          if (stockFilter === "ok" && m.stock < m.stockMin) return false;
          return true;
        });

        var tbody = document.getElementById("f21_tbody");
        if (!tbody) return;

        if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#94a3b8; padding:20px">No hay materias primas registradas</td></tr>';
        } else {
          var html = "";
          for (var i = 0; i < filtered.length; i++) {
            var m = filtered[i];
            var stockClass = m.stock < m.stockMin ? "low" : "ok";
            var estado = m.stock < m.stockMin ? '<span class="badge badge-danger">Bajo</span>' : '<span class="badge badge-success">OK</span>';
            html += '<tr>' +
              '<td>' + (m.codigo || m.id) + '</td>' +
              '<td><strong>' + m.nombre + '</strong></td>' +
              '<td>' + (m.categoria || "-") + '</td>' +
              '<td>' + (m.unidad || "-") + '</td>' +
              '<td><span class="mp-stock ' + stockClass + '">' + m.stock + '</span></td>' +
              '<td>' + m.stockMin + '</td>' +
              '<td>' + erp.formatearMoneda(m.costoUnitario || 0, m.monedaCostoBase || "VES") + '</td>' +
              '<td>' + (m.monedaCostoBase || "VES") + '</td>' +
              '<td>' + estado + '</td>' +
            '</tr>';
          }
          tbody.innerHTML = html;
        }

        // Actualizar KPIs
        var stockBajo = materias.filter(function(m) { return m.stock < m.stockMin; }).length;
        var valorTotal = materias.reduce(function(sum, m) {
          return sum + ((m.stock || 0) * (m.costoUnitario || 0));
        }, 0);
        document.getElementById("f21_totalMP").textContent = materias.length;
        document.getElementById("f21_stockBajo").textContent = stockBajo;
        document.getElementById("f21_valorInv").textContent = erp.formatearMoneda(valorTotal, db.config.monedaBase || "VES");
      };

      window.f21_loadCategories = function() {
        var db = erp.getDB();
        var cats = db.categorias || [];
        var select = document.getElementById("f21_filterCat");
        if (!select) return;
        var current = select.value;
        var html = '<option value="">Todas las categorias</option>';
        for (var i = 0; i < cats.length; i++) {
          html += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + '</option>';
        }
        select.innerHTML = html;
        select.value = current;
      };

      window.f21_exportCSV = function() {
        var db = erp.getDB();
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
        erp.showToast("success", "Export OK", "CSV descargado");
      };

      window.f21_initDemo = function() {
        var db = erp.getDB();
        if (!db.materiasPrimas || db.materiasPrimas.length === 0) {
          db.materiasPrimas = [
            {id:"MP001", codigo:"MP001", nombre:"Hidroxido de Sodio", unidad:"kg", stock:850, stockMin:200, costoUnitario:2.5, monedaCostoBase:"USD", categoria:"Bases"},
            {id:"MP002", codigo:"MP002", nombre:"Acido Clorhidrico", unidad:"L", stock:420, stockMin:100, costoUnitario:1.8, monedaCostoBase:"USD", categoria:"Acidos"},
            {id:"MP003", codigo:"MP003", nombre:"Hipoclorito de Sodio", unidad:"L", stock:680, stockMin:150, costoUnitario:1.2, monedaCostoBase:"USD", categoria:"Desinfectantes"},
            {id:"MP004", codigo:"MP004", nombre:"Envase Plastico 1L", unidad:"und", stock:1200, stockMin:300, costoUnitario:0.45, monedaCostoBase:"USD", categoria:"Empaque"},
            {id:"MP005", codigo:"MP005", nombre:"Etiquetas Adhesivas", unidad:"und", stock:5000, stockMin:1000, costoUnitario:0.08, monedaCostoBase:"USD", categoria:"Empaque"}
          ];
          erp.saveLocal(db);
          erp.showToast("info", "Demo", "5 materias primas de demo cargadas");
        }
      };

      window.f21_onShow = function() {
        f21_loadCategories();
        f21_initDemo();
        f21_renderTable();
      };

      console.log("FASE2_1 inicializado: Materias Primas");
    },

    onShow: function(erp) {
      if (window.f21_onShow) window.f21_onShow();
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();