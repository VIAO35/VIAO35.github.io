// ERP Industrial v3.0 - Plugin FASE2_1: Materias Primas
// Version: 3.0.1 (Corregido)
// Dependencias: FASE1_10

(function(erp) {
  var PLUGIN_ID = "FASE2_1";
  var PLUGIN_VERSION = "3.0.1";
  var editandoId = null;

  var PLUGIN_HTML = `<div id="mod-fase2-1">
  <h1 class="page-title"><i class="fas fa-boxes"></i> Materias Primas</h1>
  <p class="page-subtitle">Inventario de materias primas - Fase 2.1</p>
  <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
    <button class="btn btn-primary" id="f21-btn-agregar"><i class="fas fa-plus"></i> Agregar Material</button>
    <button class="btn btn-secondary" id="f21-btn-export"><i class="fas fa-file-csv"></i> Exportar CSV</button>
    <div style="flex:1;min-width:200px">
      <input type="text" id="f21-buscar" placeholder="Buscar por codigo, nombre o categoria..." style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none">
    </div>
    <select id="f21-filtro-cat" style="padding:8px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none;min-width:150px">
      <option value="">Todas las categorias</option>
    </select>
    <select id="f21-filtro-stock" style="padding:8px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none;min-width:150px">
      <option value="">Todo el stock</option>
      <option value="bajo">Stock Bajo</option>
      <option value="ok">Stock OK</option>
    </select>
  </div>
  <div style="overflow-x:auto">
    <table class="data-table" id="f21-tabla">
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
      <tbody id="f21-tbody"></tbody>
    </table>
  </div>
  <div id="f21-empty" style="text-align:center;padding:40px;color:#94a3b8;display:none">
    <i class="fas fa-box-open" style="font-size:48px;margin-bottom:16px;display:block"></i>
    No hay materias primas registradas.
  </div>
  <div style="margin-top:16px;font-size:12px;color:#64748b" id="f21-stats"></div>
  <div id="f21-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:2000;align-items:center;justify-content:center;padding:20px">
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto">
      <div style="padding:20px 20px 0;display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:16px;font-weight:600;color:#f1f5f9" id="f21-modal-title">Agregar Material</div>
        <button id="f21-modal-close" style="width:32px;height:32px;border-radius:6px;background:#334155;border:none;color:#f1f5f9;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center">&times;</button>
      </div>
      <div style="padding:20px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Codigo</label>
            <input type="text" id="f21-codigo" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none" placeholder="Auto-generado">
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Nombre *</label>
            <input type="text" id="f21-nombre" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none" placeholder="Nombre del material">
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Categoria *</label>
            <select id="f21-categoria" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none"></select>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Unidad *</label>
            <select id="f21-unidad" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none"></select>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Stock Actual</label>
            <input type="number" id="f21-stock" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none" value="0" min="0" step="0.01">
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Stock Minimo</label>
            <input type="number" id="f21-stockmin" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none" value="0" min="0" step="0.01">
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Costo Unitario</label>
            <input type="number" id="f21-costo" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none" value="0" min="0" step="0.01">
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Moneda Costo</label>
            <select id="f21-moneda" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none">
              <option value="VES">VES (Bolivar)</option>
              <option value="USD">USD (Dolar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1">
            <label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Descripcion</label>
            <textarea id="f21-descripcion" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;outline:none;min-height:60px;resize:vertical" placeholder="Descripcion opcional..."></textarea>
          </div>
        </div>
      </div>
      <div style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:10px">
        <button id="f21-btn-cancelar" style="padding:8px 16px;border-radius:6px;border:none;font-size:13px;font-weight:500;cursor:pointer;background:#334155;color:#f1f5f9">Cancelar</button>
        <button id="f21-btn-guardar" style="padding:8px 16px;border-radius:6px;border:none;font-size:13px;font-weight:500;cursor:pointer;background:#3b82f6;color:#fff"><i class="fas fa-save"></i> Guardar</button>
      </div>
    </div>
  </div>
</div>`;

  var PLUGIN_CSS = `#mod-fase2-1 .page-title { font-size:24px; font-weight:700; margin-bottom:4px; color:#f1f5f9; }
#mod-fase2-1 .page-subtitle { font-size:13px; color:#94a3b8; margin-bottom:24px; }
#mod-fase2-1 .btn { padding:8px 16px; border-radius:6px; border:none; font-size:13px; font-weight:500; cursor:pointer; transition:.2s; display:inline-flex; align-items:center; gap:6px; }
#mod-fase2-1 .btn-primary { background:#3b82f6; color:#fff; }
#mod-fase2-1 .btn-primary:hover { background:#2563eb; }
#mod-fase2-1 .btn-secondary { background:#334155; color:#f1f5f9; border:1px solid #475569; }
#mod-fase2-1 .btn-secondary:hover { background:#475569; }
#mod-fase2-1 .btn-danger { background:#ef4444; color:#fff; }
#mod-fase2-1 .btn-danger:hover { background:#dc2626; }
#mod-fase2-1 .btn-sm { padding:5px 12px; font-size:12px; }
#mod-fase2-1 .data-table { width:100%; border-collapse:collapse; font-size:13px; }
#mod-fase2-1 .data-table th { text-align:left; padding:12px 16px; background:#334155; font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; font-weight:600; border-bottom:1px solid #475569; }
#mod-fase2-1 .data-table td { padding:12px 16px; border-bottom:1px solid #334155; color:#f1f5f9; }
#mod-fase2-1 .data-table tr:hover td { background:rgba(255,255,255,.02); }
#mod-fase2-1 .badge { padding:3px 10px; border-radius:4px; font-size:11px; font-weight:500; }
#mod-fase2-1 .badge-success { background:rgba(16,185,129,.15); color:#10b981; }
#mod-fase2-1 .badge-danger { background:rgba(239,68,68,.15); color:#ef4444; }
#mod-fase2-1 .badge-info { background:rgba(59,130,246,.15); color:#3b82f6; }
#mod-fase2-1 .actions { display:flex; gap:6px; }
#mod-fase2-1 input:focus, #mod-fase2-1 select:focus, #mod-fase2-1 textarea:focus { border-color:#3b82f6; }`;

  function init() {
    var db = erp.getDB();
    if (!db.materiasPrimas || db.materiasPrimas.length === 0) {
      db.materiasPrimas = [
        {id: "MP001", codigo: "MP001", nombre: "Hidroxido de Sodio", categoria: "Bases", unidad: "kg", stock: 850, stockMin: 200, costoUnitario: 2.50, monedaCostoBase: "USD", descripcion: "Base quimica para neutralizacion", estado: "Activo", fechaRegistro: new Date().toISOString()},
        {id: "MP002", codigo: "MP002", nombre: "Acido Clorhidrico", categoria: "Acidos", unidad: "L", stock: 420, stockMin: 100, costoUnitario: 1.80, monedaCostoBase: "USD", descripcion: "Acido industrial grado tecnico", estado: "Activo", fechaRegistro: new Date().toISOString()},
        {id: "MP003", codigo: "MP003", nombre: "Hipoclorito de Sodio", categoria: "Desinfectantes", unidad: "L", stock: 650, stockMin: 150, costoUnitario: 1.20, monedaCostoBase: "USD", descripcion: "Desinfectante concentrado 12%", estado: "Activo", fechaRegistro: new Date().toISOString()},
        {id: "MP004", codigo: "MP004", nombre: "Envase Plastico 5L", categoria: "Empaque", unidad: "und", stock: 1200, stockMin: 300, costoUnitario: 0.85, monedaCostoBase: "USD", descripcion: "Envase HDPE con tapa rosca", estado: "Activo", fechaRegistro: new Date().toISOString()},
        {id: "MP005", codigo: "MP005", nombre: "Sulfato de Aluminio", categoria: "Bases", unidad: "kg", stock: 45, stockMin: 100, costoUnitario: 3.20, monedaCostoBase: "USD", descripcion: "Coagulante para tratamiento de agua", estado: "Activo", fechaRegistro: new Date().toISOString()}
      ];
      erp.saveLocal(db);
    }
    bindEvents();
    renderTabla();
    renderFiltros();
  }

  function renderFiltros() {
    var db = erp.getDB();
    var selCat = document.getElementById("f21-filtro-cat");
    if (!selCat) return;
    var cats = db.categorias || [];
    var valActual = selCat.value;
    var html = '<option value="">Todas las categorias</option>';
    for (var i = 0; i < cats.length; i++) {
      html += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + '</option>';
    }
    selCat.innerHTML = html;
    if (valActual) selCat.value = valActual;
  }

  function renderTabla() {
    var db = erp.getDB();
    var tbody = document.getElementById("f21-tbody");
    var empty = document.getElementById("f21-empty");
    var stats = document.getElementById("f21-stats");
    if (!tbody) return;

    var buscarEl = document.getElementById("f21-buscar");
    var buscar = buscarEl ? buscarEl.value.toLowerCase() : "";
    var filtroCatEl = document.getElementById("f21-filtro-cat");
    var filtroCat = filtroCatEl ? filtroCatEl.value : "";
    var filtroStockEl = document.getElementById("f21-filtro-stock");
    var filtroStock = filtroStockEl ? filtroStockEl.value : "";

    var materiales = db.materiasPrimas || [];
    var filtrados = [];
    for (var i = 0; i < materiales.length; i++) {
      var m = materiales[i];
      if (buscar && m.nombre.toLowerCase().indexOf(buscar) === -1 && m.codigo.toLowerCase().indexOf(buscar) === -1 && m.categoria.toLowerCase().indexOf(buscar) === -1) continue;
      if (filtroCat && m.categoria !== filtroCat) continue;
      if (filtroStock === "bajo" && m.stock >= m.stockMin) continue;
      if (filtroStock === "ok" && m.stock < m.stockMin) continue;
      filtrados.push(m);
    }

    if (filtrados.length === 0) {
      tbody.innerHTML = "";
      if (empty) empty.style.display = "block";
      if (stats) stats.textContent = "0 materiales";
      return;
    }
    if (empty) empty.style.display = "none";

    var html = "";
    var bajo = 0;
    for (var i = 0; i < filtrados.length; i++) {
      var m = filtrados[i];
      var esBajo = m.stock < m.stockMin;
      if (esBajo) bajo++;
      var stockClass = esBajo ? "badge-danger" : "badge-success";
      var stockText = esBajo ? "BAJO" : "OK";
      var costoFmt = erp.formatearMoneda(m.costoUnitario, m.monedaCostoBase || "USD");
      html += '<tr>' +
        '<td><strong>' + m.codigo + '</strong></td>' +
        '<td>' + m.nombre + '</td>' +
        '<td><span class="badge badge-info">' + m.categoria + '</span></td>' +
        '<td>' + m.unidad + '</td>' +
        '<td>' + m.stock + '</td>' +
        '<td>' + m.stockMin + '</td>' +
        '<td>' + costoFmt + '</td>' +
        '<td>' + (m.monedaCostoBase || "USD") + '</td>' +
        '<td><span class="badge ' + stockClass + '">' + stockText + '</span></td>' +
        '<td class="actions">' +
          '<button class="btn btn-primary btn-sm" onclick="window.f21Editar(\'' + m.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
          '<button class="btn btn-danger btn-sm" onclick="window.f21Eliminar(\'' + m.id + '\')" title="Eliminar"><i class="fas fa-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }
    tbody.innerHTML = html;
    if (stats) stats.textContent = filtrados.length + " materiales | " + bajo + " con stock bajo";
  }

  function abrirModal(editId) {
    var db = erp.getDB();
    var modal = document.getElementById("f21-modal");
    var title = document.getElementById("f21-modal-title");
    if (!modal) return;

    var selCat = document.getElementById("f21-categoria");
    var selUni = document.getElementById("f21-unidad");
    if (selCat) {
      var cats = db.categorias || [];
      var ch = '<option value="">Seleccione...</option>';
      for (var i = 0; i < cats.length; i++) ch += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + '</option>';
      selCat.innerHTML = ch;
    }
    if (selUni) {
      var uns = db.unidades || [];
      var uh = '<option value="">Seleccione...</option>';
      for (var i = 0; i < uns.length; i++) uh += '<option value="' + uns[i].simbolo + '">' + uns[i].nombre + ' (' + uns[i].simbolo + ')</option>';
      selUni.innerHTML = uh;
    }

    if (editId) {
      var m = null;
      for (var i = 0; i < db.materiasPrimas.length; i++) {
        if (db.materiasPrimas[i].id === editId) { m = db.materiasPrimas[i]; break; }
      }
      if (!m) return;
      editandoId = editId;
      title.textContent = "Editar Material";
      document.getElementById("f21-codigo").value = m.codigo;
      document.getElementById("f21-nombre").value = m.nombre;
      document.getElementById("f21-categoria").value = m.categoria;
      document.getElementById("f21-unidad").value = m.unidad;
      document.getElementById("f21-stock").value = m.stock;
      document.getElementById("f21-stockmin").value = m.stockMin;
      document.getElementById("f21-costo").value = m.costoUnitario;
      document.getElementById("f21-moneda").value = m.monedaCostoBase || "USD";
      document.getElementById("f21-descripcion").value = m.descripcion || "";
    } else {
      editandoId = null;
      title.textContent = "Agregar Material";
      document.getElementById("f21-codigo").value = "";
      document.getElementById("f21-nombre").value = "";
      document.getElementById("f21-categoria").value = "";
      document.getElementById("f21-unidad").value = "";
      document.getElementById("f21-stock").value = "0";
      document.getElementById("f21-stockmin").value = "0";
      document.getElementById("f21-costo").value = "0";
      document.getElementById("f21-moneda").value = "USD";
      document.getElementById("f21-descripcion").value = "";
    }
    modal.style.display = "flex";
  }

  function cerrarModal() {
    var modal = document.getElementById("f21-modal");
    if (modal) modal.style.display = "none";
    editandoId = null;
  }

  function guardar() {
    var db = erp.getDB();
    var nombre = document.getElementById("f21-nombre").value.trim();
    var categoria = document.getElementById("f21-categoria").value;
    var unidad = document.getElementById("f21-unidad").value;

    if (!nombre) { erp.showToast("error", "Error", "El nombre es obligatorio"); return; }
    if (!categoria) { erp.showToast("error", "Error", "Seleccione una categoria"); return; }
    if (!unidad) { erp.showToast("error", "Error", "Seleccione una unidad"); return; }

    var codigo = document.getElementById("f21-codigo").value.trim();
    if (!codigo) codigo = erp.genId("MP");

    var existente = null;
    for (var i = 0; i < db.materiasPrimas.length; i++) {
      if (db.materiasPrimas[i].codigo === codigo && db.materiasPrimas[i].id !== editandoId) {
        existente = db.materiasPrimas[i]; break;
      }
    }
    if (existente) { erp.showToast("error", "Error", "El codigo " + codigo + " ya existe"); return; }

    var fechaRegistro = new Date().toISOString();
    if (editandoId) {
      for (var i = 0; i < db.materiasPrimas.length; i++) {
        if (db.materiasPrimas[i].id === editandoId) {
          fechaRegistro = db.materiasPrimas[i].fechaRegistro;
          break;
        }
      }
    }

    var data = {
      id: editandoId || erp.genId("MP"),
      codigo: codigo,
      nombre: nombre,
      categoria: categoria,
      unidad: unidad,
      stock: parseFloat(document.getElementById("f21-stock").value) || 0,
      stockMin: parseFloat(document.getElementById("f21-stockmin").value) || 0,
      costoUnitario: parseFloat(document.getElementById("f21-costo").value) || 0,
      monedaCostoBase: document.getElementById("f21-moneda").value,
      descripcion: document.getElementById("f21-descripcion").value.trim(),
      estado: "Activo",
      fechaRegistro: fechaRegistro
    };

    if (editandoId) {
      var idx = -1;
      for (var i = 0; i < db.materiasPrimas.length; i++) {
        if (db.materiasPrimas[i].id === editandoId) { idx = i; break; }
      }
      if (idx >= 0) db.materiasPrimas[idx] = data;
      erp.showToast("success", "Actualizado", nombre + " guardado correctamente");
    } else {
      db.materiasPrimas.push(data);
      erp.showToast("success", "Agregado", nombre + " registrado correctamente");
    }
    erp.saveLocal(db);
    cerrarModal();
    renderTabla();
    renderFiltros();
  }

  function eliminar(id) {
    erp.showConfirm("Eliminar Material", "Esta accion no se puede deshacer. Continuar?", function() {
      var db = erp.getDB();
      var idx = -1;
      for (var i = 0; i < db.materiasPrimas.length; i++) {
        if (db.materiasPrimas[i].id === id) { idx = i; break; }
      }
      if (idx >= 0) {
        var nombre = db.materiasPrimas[idx].nombre;
        db.materiasPrimas.splice(idx, 1);
        erp.saveLocal(db);
        erp.showToast("success", "Eliminado", nombre + " removido");
        renderTabla();
      }
    });
  }

  function exportarCSV() {
    var db = erp.getDB();
    var mats = db.materiasPrimas || [];
    if (mats.length === 0) { erp.showToast("warning", "Sin datos", "No hay materiales para exportar"); return; }
    var csv = "Codigo,Nombre,Categoria,Unidad,Stock,StockMin,CostoUnitario,Moneda,Estado\n";
    for (var i = 0; i < mats.length; i++) {
      var m = mats[i];
      csv += m.codigo + "," + m.nombre + "," + m.categoria + "," + m.unidad + "," + m.stock + "," + m.stockMin + "," + m.costoUnitario + "," + (m.monedaCostoBase || "USD") + "," + m.estado + "\n";
    }
    var blob = new Blob([csv], {type: "text/csv"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "MateriasPrimas_" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    erp.showToast("success", "Exportado", mats.length + " materiales exportados");
  }

  function bindEvents() {
    var btnAdd = document.getElementById("f21-btn-agregar");
    var btnExp = document.getElementById("f21-btn-export");
    var btnClose = document.getElementById("f21-modal-close");
    var btnCancel = document.getElementById("f21-btn-cancelar");
    var btnSave = document.getElementById("f21-btn-guardar");
    var buscar = document.getElementById("f21-buscar");
    var filtroCat = document.getElementById("f21-filtro-cat");
    var filtroStock = document.getElementById("f21-filtro-stock");

    if (btnAdd) btnAdd.onclick = function() { abrirModal(null); };
    if (btnExp) btnExp.onclick = exportarCSV;
    if (btnClose) btnClose.onclick = cerrarModal;
    if (btnCancel) btnCancel.onclick = cerrarModal;
    if (btnSave) btnSave.onclick = guardar;
    if (buscar) buscar.oninput = renderTabla;
    if (filtroCat) filtroCat.onchange = renderTabla;
    if (filtroStock) filtroStock.onchange = renderTabla;

    window.f21Editar = abrirModal;
    window.f21Eliminar = eliminar;
  }

  erp.registerPlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    html: PLUGIN_HTML,
    css: PLUGIN_CSS,
    init: function(api) { init(); },
    onShow: function(api) { renderTabla(); renderFiltros(); }
  });
})(erp);