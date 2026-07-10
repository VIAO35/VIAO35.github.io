(function() {
  var PLUGIN_ID = "FASE8_4";
  var PLUGIN_VERSION = "3.0.0";
  var PLUGIN_NAME = "Precios Multi-Moneda";

  var plugin = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: 8,
    microFase: "8.4",
    autor: "ERP Industrial Team",
    descripcion: "Precios en VES/USD/EUR para materias primas y productos terminados.",
    schemaVersionRequerida: "3.0.0",
    dependencias: ["FASE8_3"],

    schema: {},

    menu: {
      section: "Fases Instaladas",
      label: "Precios Multi-Moneda",
      icono: "fas fa-tags",
      badge: "8.4",
      orden: 8
    },

    css: `
      #mod-fase8-4 .precio-row { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; background: #334155; margin-bottom: 8px; }
      #mod-fase8-4 .precio-label { font-size: 13px; color: #94a3b8; min-width: 120px; }
      #mod-fase8-4 .precio-value { font-size: 16px; font-weight: 600; color: #f1f5f9; flex: 1; }
    `,

    html: `
      <div id="mod-fase8-4">
        <h1 class="page-title"><i class="fas fa-tags"></i> Precios Multi-Moneda</h1>
        <p class="page-subtitle">Fase 8.4 - Visualizacion de precios en todas las monedas</p>

        <div class="chart-card">
          <div class="chart-card-header"><span class="chart-card-title">Materias Primas - Precios en 3 Monedas</span></div>
          <div class="data-table-wrapper">
            <table class="data-table" id="f84_table">
              <thead>
                <tr><th>Codigo</th><th>Nombre</th><th>Costo Base</th><th>En VES</th><th>En USD</th><th>En EUR</th></tr>
              </thead>
              <tbody id="f84_tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f84_erp = erp;

      window.f84_render = function() {
        var db = erp.getDB();
        var materias = db.materiasPrimas || [];
        var tbody = document.getElementById("f84_tbody");
        if (!tbody) return;

        if (materias.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px">No hay materias primas</td></tr>';
          return;
        }

        var html = "";
        for (var i = 0; i < materias.length; i++) {
          var m = materias[i];
          var costo = m.costoUnitario || 0;
          var moneda = m.monedaCostoBase || "VES";

          var ves = erp.convertirMoneda(costo, moneda, "VES").monto;
          var usd = erp.convertirMoneda(costo, moneda, "USD").monto;
          var eur = erp.convertirMoneda(costo, moneda, "EUR").monto;

          html += '<tr>' +
            '<td>' + (m.codigo || m.id) + '</td>' +
            '<td>' + m.nombre + '</td>' +
            '<td>' + erp.formatearMoneda(costo, moneda) + '</td>' +
            '<td>' + erp.formatearMoneda(ves, "VES") + '</td>' +
            '<td>' + erp.formatearMoneda(usd, "USD") + '</td>' +
            '<td>' + erp.formatearMoneda(eur, "EUR") + '</td>' +
          '</tr>';
        }
        tbody.innerHTML = html;
      };

      window.f84_onShow = function() {
        f84_render();
      };

      console.log("FASE8_4 inicializado: Precios Multi-Moneda");
    },

    onShow: function(erp) {
      if (window.f84_onShow) window.f84_onShow();
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();