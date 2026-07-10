(function() {
  var PLUGIN_ID = "FASE9_1";
  var PLUGIN_VERSION = "3.0.0";
  var PLUGIN_NAME = "Clientes CRUD";

  var plugin = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: 9,
    microFase: "9.1",
    autor: "ERP Industrial Team",
    descripcion: "Tabla clientes, form agregar/editar/eliminar, RIF/CI, credito 3 monedas, filtros, export CSV.",
    schemaVersionRequerida: "3.0.0",
    dependencias: ["FASE1_10", "FASE8_5", "FASE2_6"],

    schema: {}, // Usa schema existente: clientes

    menu: {
      section: "Fases Instaladas",
      label: "Clientes",
      icono: "fas fa-users",
      badge: "9.1",
      orden: 9
    },

    css: `
      #mod-fase9-1 .cliente-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
      #mod-fase9-1 .cliente-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      #mod-fase9-1 .cliente-avatar { width: 48px; height: 48px; border-radius: 50%; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; }
      #mod-fase9-1 .cliente-info { flex: 1; }
      #mod-fase9-1 .cliente-nombre { font-size: 16px; font-weight: 600; color: #f1f5f9; }
      #mod-fase9-1 .cliente-rif { font-size: 12px; color: #94a3b8; }
      #mod-fase9-1 .credito-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      #mod-fase9-1 .credito-item { text-align: center; padding: 8px; border-radius: 6px; background: #334155; }
      #mod-fase9-1 .credito-moneda { font-size: 11px; color: #94a3b8; }
      #mod-fase9-1 .credito-monto { font-size: 14px; font-weight: 600; color: #f1f5f9; }
      #mod-fase9-1 .modal-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
    `,

    html: `
      <div id="mod-fase9-1">
        <h1 class="page-title"><i class="fas fa-users"></i> Clientes</h1>
        <p class="page-subtitle">Fase 9.1 - Gestion de clientes y creditos</p>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">Total Clientes</span><div class="kpi-card-icon blue"><i class="fas fa-users"></i></div></div>
            <div class="kpi-card-value" id="f91_total">0</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">Activos</span><div class="kpi-card-icon green"><i class="fas fa-check-circle"></i></div></div>
            <div class="kpi-card-value" id="f91_activos">0</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">Credito Total VES</span><div class="kpi-card-icon amber"><i class="fas fa-coins"></i></div></div>
            <div class="kpi-card-value" id="f91_credito">Bs. 0,00</div>
          </div>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap">
          <input type="text" class="config-input" id="f91_search" placeholder="Buscar cliente..." style="flex:1; min-width:200px" onkeyup="f91_render()">
          <select class="config-input" id="f91_filterTipo" onchange="f91_render()" style="min-width:150px">
            <option value="">Todos los tipos</option>
            <option value="Mayorista">Mayorista</option>
            <option value="Minorista">Minorista</option>
            <option value="Distribuidor">Distribuidor</option>
          </select>
          <button class="btn btn-primary" onclick="f91_openModal()"><i class="fas fa-plus"></i> Nuevo Cliente</button>
          <button class="btn btn-secondary" onclick="f91_exportCSV()"><i class="fas fa-file-csv"></i> Export</button>
        </div>

        <div class="chart-card">
          <div class="chart-card-header"><span class="chart-card-title">Lista de Clientes</span></div>
          <div id="f91_clientesList"></div>
        </div>
      </div>

      <!-- Modal Cliente -->
      <div class="modal-overlay" id="f91_modal" style="display:none">
        <div class="modal modal-wide">
          <div class="modal-header"><div class="modal-title" id="f91_modalTitle">Nuevo Cliente</div><button class="modal-close" onclick="f91_closeModal()">&times;</button></div>
          <div class="modal-body">
            <div class="modal-form-grid">
              <div class="form-group"><label>Codigo</label><input type="text" class="config-input" id="f91_codigo"></div>
              <div class="form-group"><label>Nombre</label><input type="text" class="config-input" id="f91_nombre"></div>
              <div class="form-group"><label>RIF/CI</label><input type="text" class="config-input" id="f91_rif"></div>
              <div class="form-group"><label>Tipo</label>
                <select class="config-input" id="f91_tipo">
                  <option value="Mayorista">Mayorista</option>
                  <option value="Minorista">Minorista</option>
                  <option value="Distribuidor">Distribuidor</option>
                </select>
              </div>
              <div class="form-group"><label>Direccion</label><input type="text" class="config-input" id="f91_direccion"></div>
              <div class="form-group"><label>Telefono</label><input type="text" class="config-input" id="f91_telefono"></div>
              <div class="form-group"><label>Email</label><input type="email" class="config-input" id="f91_email"></div>
              <div class="form-group"><label>Plazo Credito (dias)</label><input type="number" class="config-input" id="f91_plazo" value="30"></div>
              <div class="form-group"><label>Credito VES</label><input type="number" class="config-input" id="f91_credVES" value="0"></div>
              <div class="form-group"><label>Credito USD</label><input type="number" class="config-input" id="f91_credUSD" value="0"></div>
              <div class="form-group"><label>Credito EUR</label><input type="number" class="config-input" id="f91_credEUR" value="0"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="f91_closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="f91_guardar()"><i class="fas fa-save"></i> Guardar</button>
          </div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f91_erp = erp;
      window.f91_editId = null;

      window.f91_openModal = function(id) {
        window.f91_editId = id || null;
        document.getElementById("f91_modalTitle").textContent = id ? "Editar Cliente" : "Nuevo Cliente";
        if (id) {
          var db = erp.getDB();
          var c = db.clientes.find(function(x) { return x.id === id; });
          if (c) {
            document.getElementById("f91_codigo").value = c.codigo || "";
            document.getElementById("f91_nombre").value = c.nombre || "";
            document.getElementById("f91_rif").value = c.rif || "";
            document.getElementById("f91_tipo").value = c.tipo || "Mayorista";
            document.getElementById("f91_direccion").value = c.direccion || "";
            document.getElementById("f91_telefono").value = c.telefono || "";
            document.getElementById("f91_email").value = c.email || "";
            document.getElementById("f91_plazo").value = c.plazoCredito || 30;
            document.getElementById("f91_credVES").value = c.creditoVES || 0;
            document.getElementById("f91_credUSD").value = c.creditoUSD || 0;
            document.getElementById("f91_credEUR").value = c.creditoEUR || 0;
          }
        } else {
          document.getElementById("f91_codigo").value = erp.genId("CLI");
          document.getElementById("f91_nombre").value = "";
          document.getElementById("f91_rif").value = "";
          document.getElementById("f91_tipo").value = "Mayorista";
          document.getElementById("f91_direccion").value = "";
          document.getElementById("f91_telefono").value = "";
          document.getElementById("f91_email").value = "";
          document.getElementById("f91_plazo").value = 30;
          document.getElementById("f91_credVES").value = 0;
          document.getElementById("f91_credUSD").value = 0;
          document.getElementById("f91_credEUR").value = 0;
        }
        document.getElementById("f91_modal").style.display = "flex";
      };

      window.f91_closeModal = function() {
        document.getElementById("f91_modal").style.display = "none";
        window.f91_editId = null;
      };

      window.f91_guardar = function() {
        var db = erp.getDB();
        if (!db.clientes) db.clientes = [];

        var cliente = {
          id: window.f91_editId || erp.genId("CLI"),
          codigo: document.getElementById("f91_codigo").value,
          nombre: document.getElementById("f91_nombre").value,
          rif: document.getElementById("f91_rif").value,
          tipo: document.getElementById("f91_tipo").value,
          direccion: document.getElementById("f91_direccion").value,
          telefono: document.getElementById("f91_telefono").value,
          email: document.getElementById("f91_email").value,
          estado: "Activo",
          plazoCredito: parseInt(document.getElementById("f91_plazo").value) || 30,
          creditoVES: parseFloat(document.getElementById("f91_credVES").value) || 0,
          creditoUSD: parseFloat(document.getElementById("f91_credUSD").value) || 0,
          creditoEUR: parseFloat(document.getElementById("f91_credEUR").value) || 0
        };

        if (window.f91_editId) {
          var idx = db.clientes.findIndex(function(c) { return c.id === window.f91_editId; });
          if (idx >= 0) db.clientes[idx] = cliente;
        } else {
          db.clientes.push(cliente);
        }

        erp.saveLocal(db);
        f91_closeModal();
        f91_render();
        erp.showToast("success", "Cliente Guardado", cliente.nombre);
      };

      window.f91_eliminar = function(id) {
        erp.showConfirm("Eliminar Cliente", "Seguro que deseas eliminar este cliente?", function() {
          var db = erp.getDB();
          db.clientes = db.clientes.filter(function(c) { return c.id !== id; });
          erp.saveLocal(db);
          f91_render();
          erp.showToast("info", "Eliminado", "Cliente removido");
        });
      };

      window.f91_render = function() {
        var db = erp.getDB();
        var clientes = db.clientes || [];
        var search = (document.getElementById("f91_search").value || "").toLowerCase();
        var tipoFilter = document.getElementById("f91_filterTipo").value;

        var filtered = clientes.filter(function(c) {
          if (search && c.nombre.toLowerCase().indexOf(search) === -1 && c.rif.toLowerCase().indexOf(search) === -1) return false;
          if (tipoFilter && c.tipo !== tipoFilter) return false;
          return true;
        });

        // KPIs
        var activos = clientes.filter(function(c) { return c.estado === "Activo"; }).length;
        var totalCredVES = clientes.reduce(function(s, c) { return s + (c.creditoVES || 0); }, 0);
        document.getElementById("f91_total").textContent = clientes.length;
        document.getElementById("f91_activos").textContent = activos;
        document.getElementById("f91_credito").textContent = erp.formatearMoneda(totalCredVES, "VES");

        // Lista
        var container = document.getElementById("f91_clientesList");
        if (!container) return;

        if (filtered.length === 0) {
          container.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:40px">No hay clientes registrados</div>';
          return;
        }

        var html = '<div style="display:flex; flex-direction:column; gap:12px">';
        for (var i = 0; i < filtered.length; i++) {
          var c = filtered[i];
          html += '<div class="cliente-card">' +
            '<div class="cliente-header">' +
              '<div class="cliente-avatar"><i class="fas fa-user"></i></div>' +
              '<div class="cliente-info">' +
                '<div class="cliente-nombre">' + c.nombre + ' <span class="badge ' + (c.estado === "Activo" ? 'badge-success' : 'badge-danger') + '">' + c.estado + '</span></div>' +
                '<div class="cliente-rif">' + c.rif + ' | ' + c.tipo + ' | Plazo: ' + c.plazoCredito + ' dias</div>' +
              '</div>' +
              '<div class="actions">' +
                '<button class="btn btn-primary btn-sm" onclick="f91_openModal(\'' + c.id + '\')"><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-danger btn-sm" onclick="f91_eliminar(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' +
              '</div>' +
            '</div>' +
            '<div class="credito-grid">' +
              '<div class="credito-item"><div class="credito-moneda">VES</div><div class="credito-monto">' + erp.formatearMoneda(c.creditoVES || 0, "VES") + '</div></div>' +
              '<div class="credito-item"><div class="credito-moneda">USD</div><div class="credito-monto">' + erp.formatearMoneda(c.creditoUSD || 0, "USD") + '</div></div>' +
              '<div class="credito-item"><div class="credito-moneda">EUR</div><div class="credito-monto">' + erp.formatearMoneda(c.creditoEUR || 0, "EUR") + '</div></div>' +
            '</div>' +
          '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
      };

      window.f91_exportCSV = function() {
        var db = erp.getDB();
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
        erp.showToast("success", "Export OK", "CSV descargado");
      };

      window.f91_initDemo = function() {
        var db = erp.getDB();
        if (!db.clientes || db.clientes.length === 0) {
          db.clientes = [
            {id:"CLI001", codigo:"CLI001", nombre:"Supermercados Metro", rif:"J-12345678-9", tipo:"Mayorista", estado:"Activo", direccion:"Av. Principal 123", telefono:"0212-5551111", email:"compras@metro.com", plazoCredito:30, creditoVES:50000, creditoUSD:85, creditoEUR:78},
            {id:"CLI002", codigo:"CLI002", nombre:"Farmacias Unidas C.A.", rif:"J-98765432-1", tipo:"Distribuidor", estado:"Activo", direccion:"Calle Comercio 456", telefono:"0212-5552222", email:"pedidos@farmacias.com", plazoCredito:45, creditoVES:75000, creditoUSD:128, creditoEUR:117},
            {id:"CLI003", codigo:"CLI003", nombre:"Hotel Caribe", rif:"J-45678901-2", tipo:"Minorista", estado:"Activo", direccion:"Playa El Agua", telefono:"0295-5553333", email:"admin@hotelcaribe.com", plazoCredito:15, creditoVES:25000, creditoUSD:43, creditoEUR:39}
          ];
          erp.saveLocal(db);
          erp.showToast("info", "Demo", "3 clientes de demo cargados");
        }
      };

      window.f91_onShow = function() {
        f91_initDemo();
        f91_render();
      };

      console.log("FASE9_1 inicializado: Clientes CRUD");
    },

    onShow: function(erp) {
      if (window.f91_onShow) window.f91_onShow();
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();