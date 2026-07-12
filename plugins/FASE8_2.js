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
    descripcion: "Registro de tasas en formato natural. El usuario pone cuanto vale 1 USD/EUR en VES.",
    schemaVersionRequerida: "3.0.0",
    dependencias: ["FASE8_1"],
    schema: {},

    menu: {
      section: "Fases Instaladas",
      label: "Tasas de Cambio",
      icono: "fas fa-exchange-alt",
      badge: "8.2",
      orden: 8
    },

    css: `
      #mod-fase8_2 .tasa-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 12px; }
      #mod-fase8_2 .tasa-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px; }
      #mod-fase8_2 .tasa-input-group { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; }
      #mod-fase8_2 .tasa-input-group label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
      #mod-fase8_2 .tasa-input-group input { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #f1f5f9; font-size: 16px; }
      #mod-fase8_2 .tasa-ejemplo { font-size: 11px; color: #64748b; margin-top: 6px; }
      #mod-fase8_2 .tasa-actual { font-size: 28px; font-weight: 700; color: #3b82f6; }
    `,

    html: `
      <div id="mod-fase8_2">
        <h1 class="page-title"><i class="fas fa-exchange-alt"></i> Tasas de Cambio</h1>
        <p class="page-subtitle">Fase 8.2 - Registro de tasas del dia</p>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">1 USD =</span><div class="kpi-card-icon blue"><i class="fas fa-dollar-sign"></i></div></div>
            <div class="kpi-card-value" id="f82_usd_ves_display">-</div>
            <div class="kpi-card-change">Bolivares</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">1 EUR =</span><div class="kpi-card-icon green"><i class="fas fa-euro-sign"></i></div></div>
            <div class="kpi-card-value" id="f82_eur_ves_display">-</div>
            <div class="kpi-card-change">Bolivares</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">1 USD =</span><div class="kpi-card-icon amber"><i class="fas fa-exchange-alt"></i></div></div>
            <div class="kpi-card-value" id="f82_usd_eur_display">-</div>
            <div class="kpi-card-change">Euros</div>
          </div>
        </div>

        <div class="tasa-card">
          <div class="config-panel-title"><i class="fas fa-plus"></i> Registrar Tasa del Dia</div>
          <p style="color:#94a3b8; font-size:13px; margin-bottom:16px">Ingresa la tasa en formato natural. Ejemplo: si 1 dolar cuesta 700 Bs, escribe 700.</p>

          <div class="tasa-form">
            <div class="tasa-input-group">
              <label>1 USD equivale a cuantos VES?</label>
              <input type="number" step="0.01" id="f82_input_usd_ves" placeholder="Ejemplo: 700">
              <div class="tasa-ejemplo">Si 1 dolar = 700 Bs, escribe 700</div>
            </div>
            <div class="tasa-input-group">
              <label>1 EUR equivale a cuantos VES?</label>
              <input type="number" step="0.01" id="f82_input_eur_ves" placeholder="Ejemplo: 780">
              <div class="tasa-ejemplo">Si 1 euro = 780 Bs, escribe 780</div>
            </div>
            <div class="tasa-input-group">
              <label>1 USD equivale a cuantos EUR?</label>
              <input type="number" step="0.0001" id="f82_input_usd_eur" placeholder="Ejemplo: 0.90">
              <div class="tasa-ejemplo">Si 1 dolar = 0.90 EUR, escribe 0.90</div>
            </div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px">
            <button class="btn btn-primary" onclick="f82_guardar()"><i class="fas fa-save"></i> Guardar Tasa</button>
            <button class="btn btn-secondary" onclick="f82_cargarDemo()"><i class="fas fa-database"></i> Cargar Tasa Demo</button>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header"><span class="chart-card-title">Historial de Tasas</span></div>
          <div class="data-table-wrapper">
            <table class="data-table" id="f82_table">
              <thead>
                <tr><th>Fecha</th><th>1 USD → VES</th><th>1 EUR → VES</th><th>1 USD → EUR</th><th>Estado</th></tr>
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

        var usd_ves = parseFloat(document.getElementById("f82_input_usd_ves").value) || 0;
        var eur_ves = parseFloat(document.getElementById("f82_input_eur_ves").value) || 0;
        var usd_eur = parseFloat(document.getElementById("f82_input_usd_eur").value) || 0;

        if (usd_ves <= 0) {
          erp.showToast("error", "Error", "La tasa USD -> VES debe ser mayor a 0");
          return;
        }

        // Calcular inversas para uso interno
        var ves_a_usd = 1 / usd_ves;
        var ves_a_eur = eur_ves > 0 ? 1 / eur_ves : 0;
        var eur_a_usd = usd_eur > 0 ? 1 / usd_eur : 0;

        var nueva = {
          id: erp.genId("TASA"),
          fecha: new Date().toISOString().split("T")[0],
          usd_a_ves: usd_ves,
          eur_a_ves: eur_ves,
          usd_a_eur: usd_eur,
          ves_a_usd: ves_a_usd,
          ves_a_eur: ves_a_eur,
          eur_a_usd: eur_a_usd,
          activa: true,
          tipo: "manual"
        };

        // Desactivar anteriores
        for (var i = 0; i < db.tasasCambio.length; i++) {
          db.tasasCambio[i].activa = false;
        }

        db.tasasCambio.unshift(nueva);
        erp.saveLocal(db);
        f82_render();

        erp.showToast("success", "Tasa Guardada", 
          "1 USD = " + usd_ves + " VES | 1 VES = " + ves_a_usd.toFixed(6) + " USD");
      };

      window.f82_cargarDemo = function() {
        document.getElementById("f82_input_usd_ves").value = "700";
        document.getElementById("f82_input_eur_ves").value = "780";
        document.getElementById("f82_input_usd_eur").value = "0.90";
        erp.showToast("info", "Demo", "Tasa demo cargada. Toca Guardar para aplicar.");
      };

      window.f82_render = function() {
        var db = erp.getDB();
        var tasas = db.tasasCambio || [];
        var activa = null;
        for (var i = 0; i < tasas.length; i++) {
          if (tasas[i].activa) { activa = tasas[i]; break; }
        }

        var usdDisplay = document.getElementById("f82_usd_ves_display");
        var eurDisplay = document.getElementById("f82_eur_ves_display");
        var usdEurDisplay = document.getElementById("f82_usd_eur_display");

        if (activa) {
          if (usdDisplay) usdDisplay.textContent = erp.formatearMoneda(activa.usd_a_ves, "VES");
          if (eurDisplay) eurDisplay.textContent = erp.formatearMoneda(activa.eur_a_ves, "VES");
          if (usdEurDisplay) usdEurDisplay.textContent = activa.usd_a_eur.toFixed(4);
        } else {
          if (usdDisplay) usdDisplay.textContent = "-";
          if (eurDisplay) eurDisplay.textContent = "-";
          if (usdEurDisplay) usdEurDisplay.textContent = "-";
        }

        var tbody = document.getElementById("f82_tbody");
        if (!tbody) return;
        if (tasas.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px">No hay tasas registradas</td></tr>';
          return;
        }

        var html = "";
        for (var i = 0; i < Math.min(tasas.length, 20); i++) {
          var t = tasas[i];
          html += '<tr>' +
            '<td>' + t.fecha + '</td>' +
            '<td>' + erp.formatearMoneda(t.usd_a_ves, "VES") + '</td>' +
            '<td>' + erp.formatearMoneda(t.eur_a_ves, "VES") + '</td>' +
            '<td>' + t.usd_a_eur.toFixed(4) + '</td>' +
            '<td>' + (t.activa ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-secondary">Inactiva</span>') + '</td>' +
          '</tr>';
        }
        tbody.innerHTML = html;
      };

      window.f82_onShow = function() {
        f82_render();
      };

      console.log("FASE8_2 inicializado: Tasas de Cambio v2");
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
