(function() {
  var PLUGIN_ID = "FASE8_2";
  var PLUGIN_VERSION = "3.0.0";
  var PLUGIN_NAME = "Tasas de Cambio";

  var plugin = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: 8,
    microFase: "8.2",
    autor: "ERP Industrial Team",
    descripcion: "Registro diario de tasas VES/USD/EUR. Historial, grafica, alertas.",
    schemaVersionRequerida: "3.0.0",
    dependencias: ["FASE8_1"],

    schema: {}, // Usa schema existente: tasasCambio

    menu: {
      section: "Fases Instaladas",
      label: "Tasas de Cambio",
      icono: "fas fa-exchange-alt",
      badge: "8.2",
      orden: 8
    },

    css: `
      #mod-fase8-2 .tasa-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 12px; }
      #mod-fase8-2 .tasa-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      #mod-fase8-2 .tasa-title { font-size: 14px; font-weight: 600; color: #f1f5f9; }
      #mod-fase8-2 .tasa-value { font-size: 24px; font-weight: 700; color: #3b82f6; }
      #mod-fase8-2 .tasa-meta { font-size: 12px; color: #94a3b8; }
      #mod-fase8-2 .tasa-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
    `,

    html: `
      <div id="mod-fase8-2">
        <h1 class="page-title"><i class="fas fa-exchange-alt"></i> Tasas de Cambio</h1>
        <p class="page-subtitle">Fase 8.2 - Registro y historial de tasas</p>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">VES/USD</span><div class="kpi-card-icon blue"><i class="fas fa-dollar-sign"></i></div></div>
            <div class="kpi-card-value" id="f82_tasaUSD">-</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">VES/EUR</span><div class="kpi-card-icon green"><i class="fas fa-euro-sign"></i></div></div>
            <div class="kpi-card-value" id="f82_tasaEUR">-</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">USD/EUR</span><div class="kpi-card-icon amber"><i class="fas fa-exchange-alt"></i></div></div>
            <div class="kpi-card-value" id="f82_tasaUSDEUR">-</div>
          </div>
        </div>

        <div class="tasa-card">
          <div class="config-panel-title"><i class="fas fa-plus"></i> Nueva Tasa</div>
          <div class="tasa-form">
            <div class="form-group"><label>Fecha</label><input type="date" class="config-input" id="f82_fecha"></div>
            <div class="form-group"><label>VES a USD</label><input type="number" step="0.0001" class="config-input" id="f82_ves_usd" placeholder="0.0016129"></div>
            <div class="form-group"><label>VES a EUR</label><input type="number" step="0.0001" class="config-input" id="f82_ves_eur" placeholder="0.0013986"></div>
            <div class="form-group"><label>USD a EUR</label><input type="number" step="0.0001" class="config-input" id="f82_usd_eur" placeholder="0.8672"></div>
          </div>
          <button class="btn btn-primary" onclick="f82_guardar()"><i class="fas fa-save"></i> Guardar Tasa</button>
        </div>

        <div class="chart-card">
          <div class="chart-card-header"><span class="chart-card-title">Historial de Tasas</span></div>
          <div class="data-table-wrapper">
            <table class="data-table" id="f82_table">
              <thead>
                <tr><th>Fecha</th><th>VES/USD</th><th>VES/EUR</th><th>USD/EUR</th><th>Tipo</th><th>Estado</th></tr>
              </thead>
              <tbody id="f82_tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f82_erp = erp;

      window.f82_guardar = function() {
        var db = erp.getDB();
        if (!db.tasasCambio) db.tasasCambio = [];

        var nueva = {
          id: erp.genId("TASA"),
          fecha: document.getElementById("f82_fecha").value || new Date().toISOString().split("T")[0],
          ves_a_usd: parseFloat(document.getElementById("f82_ves_usd").value) || 0,
          ves_a_eur: parseFloat(document.getElementById("f82_ves_eur").value) || 0,
          usd_a_eur: parseFloat(document.getElementById("f82_usd_eur").value) || 0,
          activa: true,
          tipo: "manual",
          descripcion: "Tasa registrada manualmente"
        };

        // Desactivar tasas anteriores del mismo tipo
        for (var i = 0; i < db.tasasCambio.length; i++) {
          if (db.tasasCambio[i].tipo === "manual") db.tasasCambio[i].activa = false;
        }

        db.tasasCambio.unshift(nueva);
        erp.saveLocal(db);
        f82_render();
        erp.showToast("success", "Tasa Guardada", "Nueva tasa registrada");
      };

      window.f82_render = function() {
        var db = erp.getDB();
        var tasas = db.tasasCambio || [];
        var activa = tasas.find(function(t) { return t.activa; });

        if (activa) {
          document.getElementById("f82_tasaUSD").textContent = activa.ves_a_usd.toFixed(6);
          document.getElementById("f82_tasaEUR").textContent = activa.ves_a_eur.toFixed(6);
          document.getElementById("f82_tasaUSDEUR").textContent = activa.usd_a_eur.toFixed(4);
        }

        var tbody = document.getElementById("f82_tbody");
        if (!tbody) return;
        if (tasas.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px">No hay tasas registradas</td></tr>';
          return;
        }

        var html = "";
        for (var i = 0; i < Math.min(tasas.length, 20); i++) {
          var t = tasas[i];
          html += '<tr>' +
            '<td>' + t.fecha + '</td>' +
            '<td>' + t.ves_a_usd.toFixed(6) + '</td>' +
            '<td>' + t.ves_a_eur.toFixed(6) + '</td>' +
            '<td>' + t.usd_a_eur.toFixed(4) + '</td>' +
            '<td>' + t.tipo + '</td>' +
            '<td>' + (t.activa ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-secondary">Inactiva</span>') + '</td>' +
          '</tr>';
        }
        tbody.innerHTML = html;
      };

      window.f82_onShow = function() {
        document.getElementById("f82_fecha").value = new Date().toISOString().split("T")[0];
        f82_render();
      };

      console.log("FASE8_2 inicializado: Tasas de Cambio");
    },

    onShow: function(erp) {
      if (window.f82_onShow) window.f82_onShow();
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();