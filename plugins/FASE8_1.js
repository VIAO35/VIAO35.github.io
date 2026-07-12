(function() {
  var PLUGIN_ID = "FASE8_1";
  var PLUGIN_VERSION = "3.0.0";
  var PLUGIN_NAME = "Monedas CRUD";

  var plugin = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: 8,
    microFase: "8.1",
    autor: "ERP Industrial Team",
    descripcion: "Gestion de monedas: VES, USD, EUR. CRUD completo con simbolos y decimales.",
    schemaVersionRequerida: "3.0.0",
    dependencias: ["FASE1_10"],

    schema: {}, // Usa schema existente: monedas

    menu: {
      section: "Fases Instaladas",
      label: "Monedas",
      icono: "fas fa-coins",
      badge: "8.1",
      orden: 8
    },

    css: `
      #mod-fase8_1 .moneda-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; transition: .2s; }
      #mod-fase8_1 .moneda-card:hover { border-color: #3b82f6; transform: translateY(-2px); }
      #mod-fase8_1 .moneda-simbolo { font-size: 36px; font-weight: 700; color: #3b82f6; margin-bottom: 8px; }
      #mod-fase8_1 .moneda-nombre { font-size: 14px; font-weight: 600; color: #f1f5f9; }
      #mod-fase8_1 .moneda-codigo { font-size: 12px; color: #94a3b8; margin-top: 4px; }
      #mod-fase8_1 .moneda-base { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; background: rgba(16,185,129,0.15); color: #10b981; margin-top: 8px; }
    `,

    html: `
      <div id="mod-fase8_1">
        <h1 class="page-title"><i class="fas fa-coins"></i> Monedas</h1>
        <p class="page-subtitle">Fase 8.1 - Gestion de monedas del sistema</p>

        <div class="kpi-grid" id="f81_monedasGrid"></div>

        <div class="chart-card">
          <div class="chart-card-header"><span class="chart-card-title">Monedas Configuradas</span></div>
          <div class="data-table-wrapper">
            <table class="data-table" id="f81_table">
              <thead>
                <tr><th>Codigo</th><th>Nombre</th><th>Simbolo</th><th>Decimales</th><th>Es Base</th><th>Acciones</th></tr>
              </thead>
              <tbody id="f81_tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f81_erp = erp;

      window.f81_render = function() {
        var db = erp.getDB();
        var monedas = db.monedas || [];

        // Grid de cards
        var grid = document.getElementById("f81_monedasGrid");
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

        // Tabla
        var tbody = document.getElementById("f81_tbody");
        if (tbody) {
          var html = "";
          for (var i = 0; i < monedas.length; i++) {
            var m = monedas[i];
            html += '<tr>' +
              '<td><strong>' + m.codigo + '</strong></td>' +
              '<td>' + m.nombre + '</td>' +
              '<td>' + m.simbolo + '</td>' +
              '<td>' + m.decimales + '</td>' +
              '<td>' + (m.esBase ? '<span class="badge badge-success">SI</span>' : '<span class="badge badge-secondary">NO</span>') + '</td>' +
              '<td class="actions"><button class="btn btn-primary btn-sm" onclick="f81_edit(\'' + m.codigo + '\')"><i class="fas fa-edit"></i></button></td>' +
            '</tr>';
          }
          tbody.innerHTML = html;
        }
      };

      window.f81_edit = function(codigo) {
        erp.showToast("info", "Editar Moneda", "Funcion en desarrollo - Fase 8.2+");
      };

      window.f81_onShow = function() {
        f81_render();
      };

      console.log("FASE8_1 inicializado: Monedas CRUD");
    },

    onShow: function(erp) {
      if (window.f81_onShow) window.f81_onShow();
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();
