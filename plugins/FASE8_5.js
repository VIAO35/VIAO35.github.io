(function() {
  var PLUGIN_ID = "FASE8_5";
  var PLUGIN_VERSION = "3.0.0";
  var PLUGIN_NAME = "Reporte Multi-Moneda";

  var plugin = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: 8,
    microFase: "8.5",
    autor: "ERP Industrial Team",
    descripcion: "Reportes con conversion a moneda base, export CSV/PDF, comparativo.",
    schemaVersionRequerida: "3.0.0",
    dependencias: ["FASE8_4"],

    schema: {},

    menu: {
      section: "Fases Instaladas",
      label: "Reporte Multi-Moneda",
      icono: "fas fa-file-invoice-dollar",
      badge: "8.5",
      orden: 8
    },

    css: `
      #mod-fase8_5 .reporte-resumen { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
    `,

    html: `
      <div id="mod-fase8_5">
        <h1 class="page-title"><i class="fas fa-file-invoice-dollar"></i> Reporte Multi-Moneda</h1>
        <p class="page-subtitle">Fase 8.5 - Reportes con conversion a moneda base</p>

        <div class="reporte-resumen" id="f85_resumen"></div>

        <div class="chart-card">
          <div class="chart-card-header">
            <span class="chart-card-title">Inventario Valorizado por Moneda</span>
            <button class="btn btn-primary btn-sm" onclick="f85_exportCSV()"><i class="fas fa-file-csv"></i> Export CSV</button>
          </div>
          <div class="data-table-wrapper">
            <table class="data-table" id="f85_table">
              <thead>
                <tr><th>Categoria</th><th>Items</th><th>Stock Total</th><th>Valor VES</th><th>Valor USD</th><th>Valor EUR</th></tr>
              </thead>
              <tbody id="f85_tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f85_erp = erp;

      window.f85_render = function() {
        var db = erp.getDB();
        var materias = db.materiasPrimas || [];
        var categorias = db.categorias || [];

        // Resumen por moneda
        var totalVES = 0, totalUSD = 0, totalEUR = 0;
        for (var i = 0; i < materias.length; i++) {
          var m = materias[i];
          var costo = (m.stock || 0) * (m.costoUnitario || 0);
          var moneda = m.monedaCostoBase || "VES";
          totalVES += erp.convertirMoneda(costo, moneda, "VES").monto;
          totalUSD += erp.convertirMoneda(costo, moneda, "USD").monto;
          totalEUR += erp.convertirMoneda(costo, moneda, "EUR").monto;
        }

        var resumen = document.getElementById("f85_resumen");
        if (resumen) {
          resumen.innerHTML =
            '<div class="kpi-card"><div class="kpi-card-header"><span class="kpi-card-title">Total VES</span></div><div class="kpi-card-value">' + erp.formatearMoneda(totalVES, "VES") + '</div></div>' +
            '<div class="kpi-card"><div class="kpi-card-header"><span class="kpi-card-title">Total USD</span></div><div class="kpi-card-value">' + erp.formatearMoneda(totalUSD, "USD") + '</div></div>' +
            '<div class="kpi-card"><div class="kpi-card-header"><span class="kpi-card-title">Total EUR</span></div><div class="kpi-card-value">' + erp.formatearMoneda(totalEUR, "EUR") + '</div></div>';
        }

        // Tabla por categoria
        var tbody = document.getElementById("f85_tbody");
        if (!tbody) return;

        var html = "";
        for (var c = 0; c < categorias.length; c++) {
          var cat = categorias[c];
          var catItems = materias.filter(function(m) { return m.categoria === cat.nombre; });
          if (catItems.length === 0) continue;

          var stockTotal = catItems.reduce(function(s, m) { return s + (m.stock || 0); }, 0);
          var valVES = 0, valUSD = 0, valEUR = 0;
          for (var i = 0; i < catItems.length; i++) {
            var m = catItems[i];
            var costo = (m.stock || 0) * (m.costoUnitario || 0);
            var moneda = m.monedaCostoBase || "VES";
            valVES += erp.convertirMoneda(costo, moneda, "VES").monto;
            valUSD += erp.convertirMoneda(costo, moneda, "USD").monto;
            valEUR += erp.convertirMoneda(costo, moneda, "EUR").monto;
          }

          html += '<tr>' +
            '<td><strong>' + cat.nombre + '</strong></td>' +
            '<td>' + catItems.length + '</td>' +
            '<td>' + stockTotal + '</td>' +
            '<td>' + erp.formatearMoneda(valVES, "VES") + '</td>' +
            '<td>' + erp.formatearMoneda(valUSD, "USD") + '</td>' +
            '<td>' + erp.formatearMoneda(valEUR, "EUR") + '</td>' +
          '</tr>';
        }
        tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px">Sin datos</td></tr>';
      };

      window.f85_exportCSV = function() {
        var db = erp.getDB();
        var materias = db.materiasPrimas || [];
        var csv = "Codigo,Nombre,Categoria,Stock,CostoBase,Moneda,ValorVES,ValorUSD,ValorEUR\n";
        for (var i = 0; i < materias.length; i++) {
          var m = materias[i];
          var costo = (m.stock || 0) * (m.costoUnitario || 0);
          var moneda = m.monedaCostoBase || "VES";
          var ves = erp.convertirMoneda(costo, moneda, "VES").monto;
          var usd = erp.convertirMoneda(costo, moneda, "USD").monto;
          var eur = erp.convertirMoneda(costo, moneda, "EUR").monto;
          csv += (m.codigo || m.id) + "," + m.nombre + "," + (m.categoria || "") + "," + m.stock + "," + (m.costoUnitario || 0) + "," + moneda + "," + ves.toFixed(2) + "," + usd.toFixed(2) + "," + eur.toFixed(2) + "\n";
        }
        var blob = new Blob([csv], {type: "text/csv"});
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "Reporte_MultiMoneda_" + new Date().toISOString().split("T")[0] + ".csv";
        a.click();
        URL.revokeObjectURL(url);
        erp.showToast("success", "Export OK", "CSV descargado");
      };

      window.f85_onShow = function() {
        f85_render();
      };

      console.log("FASE8_5 inicializado: Reporte Multi-Moneda");
    },

    onShow: function(erp) {
      if (window.f85_onShow) window.f85_onShow();
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();
