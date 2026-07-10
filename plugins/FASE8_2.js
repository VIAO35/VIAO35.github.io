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
    descripcion: "Registro diario de tasas. El usuario pone la tasa en formato natural (ej: 1 USD = 700 VES) y el ERP calcula las inversas automaticamente.",
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
      #mod-fase8-2 .tasa-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 12px; }
      #mod-fase8-2 .tasa-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      #mod-fase8-2 .tasa-title { font-size: 14px; font-weight: 600; color: #f1f5f9; }
      #mod-fase8-2 .tasa-value { font-size: 24px; font-weight: 700; color: #3b82f6; }
      #mod-fase8-2 .tasa-meta { font-size: 12px; color: #94a3b8; }
      #mod-fase8-2 .tasa-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 16px; }
      #mod-fase8-2 .tasa-input-group { display: flex; align-items: center; gap: 10px; }
      #mod-fase8-2 .tasa-input-group label { font-size: 13px; color: #94a3b8; min-width: 80px; }
      #mod-fase8-2 .tasa-input-group input { flex: 1; }
      #mod-fase8-2 .tasa-ejemplo { font-size: 11px; color: #64748b; margin-top: 4px; }
    `,

    html: `
      <div id="mod-fase8-2">
        <h1 class="page-title"><i class="fas fa-exchange-alt"></i> Tasas de Cambio</h1>
        <p class="page-subtitle">Fase 8.2 - Registro de tasas en formato natural</p>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">1 USD =</span><div class="kpi-card-icon blue"><i class="fas fa-dollar-sign"></i></div></div>
            <div class="kpi-card-value" id="f82_tasaUSD">-</div>
            <div class="kpi-card-change">VES</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">1 EUR =</span><div class="kpi-card-icon green"><i class="fas fa-euro-sign"></i></div></div>
            <div class="kpi-card-value" id="f82_tasaEUR">-</div>
            <div class="kpi-card-change">VES</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-header"><span class="kpi-card-title">1 USD =</span><div class="kpi-card-icon amber"><i class="fas fa-exchange-alt"></i></div></div>
            <div class="kpi-card-value" id="f82_tasaUSDEUR">-</div>
            <div class="kpi-card-change">EUR</div>
          </div>
        </div>

        <div class="tasa-card">
          <div class="config-panel-title"><i class="fas fa-plus"></i> Nueva Tasa del Dia</div>
          <p style="color:#94a3b8; font-size:13px; margin-bottom:16px">Ingresa la tasa en formato natural. El ERP calculara las conversiones automaticamente.</p>

          <div class="tasa-form">
            <div>
              <div class="tasa-input-group">
                <label>1 USD =</label>
                <input type="number" step="0.01" class="config-input" id="f82_usd_ves" placeholder="700">
              </div>
              <div class="tasa-ejemplo">Ejemplo: Si 1 dolar = 700 Bs, escribe 700</div>
            </div>
            <div>
              <div class="tasa-input-group">
                <label>1 EUR =</label>
                <input type="number" step="0.01" class="config-input" id="f82_eur_ves" placeholder="780">
              </div>
              <div class="tasa-ejemplo">Ejemplo: Si 1 euro = 780 Bs, escribe 780</div>
            </div>
            <div>
              <div class="tasa-input-group">
                <label>1 USD =</label>
                <input type="number" step="0.0001" class="config-input" id="f82_usd_eur" placeholder="0.90">
              </div>
              <div class="tasa-ejemplo">Ejemplo: Si 1 dolar = 0.90 EUR, escribe 0.90</div>
            </div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px">
            <button class="btn btn-primary" onclick="f82_guardar()"><i class="fas fa-save"></i> Guardar Tasa del Dia</button>
            <button class="btn btn-secondary" onclick="f82_usarTasaOficial()"><i class="fas fa-landmark"></i> Usar Tasa BCV</button>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header"><span class="chart-card-title">Historial de Tasas</span></div>
          <div class="data-table-wrapper">
            <table class="data-table" id="f82_table">
              <thead>
                <tr><th>Fecha</th><th>1 USD → VES</th><th>1 EUR → VES</th><th>1 USD → EUR</th><th>Tipo</th><th>Estado</th></tr>
              </thead>
              <tbody id="f82_tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f82_erp = erp;

      // Funcion para calcular tasas inversas automaticamente
      window.f82_calcularInversas = function(usd_ves, eur_ves, usd_eur) {
        // Formato natural: cuantas VES/EUR equivale 1 unidad de moneda fuerte
        // Calculamos las tasas directas para el conversor
        return {
          // Directas (para convertir desde VES)
          ves_a_usd: usd_ves > 0 ? 1 / usd_ves : 0,  // 1 VES = ? USD
          ves_a_eur: eur_ves > 0 ? 1 / eur_ves : 0,  // 1 VES = ? EUR

          // Inversas (para convertir hacia VES)
          usd_a_ves: usd_ves || 0,  // 1 USD = ? VES
          eur_a_ves: eur_ves || 0,  // 1 EUR = ? VES

          // Cruzada
          usd_a_eur: usd_eur || 0,  // 1 USD = ? EUR
          eur_a_usd: usd_eur > 0 ? 1 / usd_eur : 0   // 1 EUR = ? USD
        };
      };

      window.f82_guardar = function() {
        var db = erp.getDB();
        if (!db.tasasCambio) db.tasasCambio = [];

        // Leer valores en formato natural (moneda fuerte -> moneda base)
        var usd_ves = parseFloat(document.getElementById("f82_usd_ves").value) || 0;
        var eur_ves = parseFloat(document.getElementById("f82_eur_ves").value) || 0;
        var usd_eur = parseFloat(document.getElementById("f82_usd_eur").value) || 0;

        if (usd_ves <= 0) {
          erp.showToast("error", "Error", "La tasa USD -> VES debe ser mayor a 0");
          return;
        }

        // Calcular todas las tasas derivadas
        var calculadas = f82_calcularInversas(usd_ves, eur_ves, usd_eur);

        var nueva = {
          id: erp.genId("TASA"),
          fecha: new Date().toISOString().split("T")[0],

          // Valores en formato natural (lo que puso el usuario)
          usd_a_ves: usd_ves,
          eur_a_ves: eur_ves,
          usd_a_eur: usd_eur,

          // Valores calculados para conversiones
          ves_a_usd: calculadas.ves_a_usd,
          ves_a_eur: calculadas.ves_a_eur,
          eur_a_usd: calculadas.eur_a_usd,

          activa: true,
          tipo: "manual",
          descripcion: "Tasa registrada: 1 USD = " + usd_ves + " VES"
        };

        // Desactivar tasas anteriores
        for (var i = 0; i < db.tasasCambio.length; i++) {
          db.tasasCambio[i].activa = false;
        }

        db.tasasCambio.unshift(nueva);
        erp.saveLocal(db);
        f82_render();

        erp.showToast("success", "Tasa Guardada", 
          "1 USD = " + usd_ves + " VES | 1 VES = " + calculadas.ves_a_usd.toFixed(6) + " USD");
      };

      window.f82_usarTasaOficial = function() {
        // Tasa BCV aproximada de ejemplo
        document.getElementById("f82_usd_ves").value = "36.50";
        document.getElementById("f82_eur_ves").value = "39.80";
        document.getElementById("f82_usd_eur").value = "0.9170";
        erp.showToast("info", "BCV", "Tasa oficial cargada. Toca Guardar para aplicar.");
      };

      window.f82_render = function() {
        var db = erp.getDB();
        var tasas = db.tasasCambio || [];
        var activa = tasas.find(function(t) { return t.activa; });

        if (activa) {
          document.getElementById("f82_tasaUSD").textContent = erp.formatearMoneda(activa.usd_a_ves, "VES");
          document.getElementById("f82_tasaEUR").textContent = erp.formatearMoneda(activa.eur_a_ves, "VES");
          document.getElementById("f82_tasaUSDEUR").textContent = activa.usd_a_eur.toFixed(4);
        } else {
          document.getElementById("f82_tasaUSD").textContent = "-";
          document.getElementById("f82_tasaEUR").textContent = "-";
          document.getElementById("f82_tasaUSDEUR").textContent = "-";
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
            '<td>' + erp.formatearMoneda(t.usd_a_ves, "VES") + '</td>' +
            '<td>' + erp.formatearMoneda(t.eur_a_ves, "VES") + '</td>' +
            '<td>' + t.usd_a_eur.toFixed(4) + '</td>' +
            '<td>' + t.tipo + '</td>' +
            '<td>' + (t.activa ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-secondary">Inactiva</span>') + '</td>' +
          '</tr>';
        }
        tbody.innerHTML = html;
      };

      window.f82_onShow = function() {
        f82_render();
      };

      console.log("FASE8_2 inicializado: Tasas de Cambio (formato natural)");
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
