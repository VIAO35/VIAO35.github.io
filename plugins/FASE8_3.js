(function() {
  var PLUGIN_ID = "FASE8_3";
  var PLUGIN_VERSION = "3.0.0";
  var PLUGIN_NAME = "Conversion Automatica";

  var plugin = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: 8,
    microFase: "8.3",
    autor: "ERP Industrial Team",
    descripcion: "Conversion automatica entre monedas en tiempo real. API convertirMoneda().",
    schemaVersionRequerida: "3.0.0",
    dependencias: ["FASE8_2"],

    schema: {},

    menu: {
      section: "Fases Instaladas",
      label: "Conversor",
      icono: "fas fa-calculator",
      badge: "8.3",
      orden: 8
    },

    css: `
      #mod-fase8-3 .calc-panel { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; }
      #mod-fase8-3 .calc-result { font-size: 32px; font-weight: 700; color: #3b82f6; text-align: center; margin: 16px 0; }
      #mod-fase8-3 .calc-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      #mod-fase8-3 .calc-label { font-size: 13px; color: #94a3b8; min-width: 80px; }
      #mod-fase8-3 .calc-input { flex: 1; padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 16px; }
      #mod-fase8-3 .calc-select { padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 14px; }
      #mod-fase8-3 .tasa-info { text-align: center; font-size: 12px; color: #64748b; margin-top: 8px; }
    `,

    html: `
      <div id="mod-fase8-3">
        <h1 class="page-title"><i class="fas fa-calculator"></i> Conversor de Monedas</h1>
        <p class="page-subtitle">Fase 8.3 - Conversion automatica en tiempo real</p>

        <div class="calc-panel">
          <div class="calc-row">
            <span class="calc-label">Monto:</span>
            <input type="number" class="calc-input" id="f83_monto" value="1000" oninput="f83_calcular()">
          </div>
          <div class="calc-row">
            <span class="calc-label">De:</span>
            <select class="calc-select" id="f83_desde" onchange="f83_calcular()">
              <option value="VES">VES (Bolivar)</option>
              <option value="USD">USD (Dolar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
          <div class="calc-row">
            <span class="calc-label">A:</span>
            <select class="calc-select" id="f83_hasta" onchange="f83_calcular()">
              <option value="USD">USD (Dolar)</option>
              <option value="VES" selected>VES (Bolivar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
          <div class="calc-row">
            <span class="calc-label">Fecha:</span>
            <input type="date" class="calc-input" id="f83_fecha" onchange="f83_calcular()">
          </div>
          <div class="section-divider"></div>
          <div class="calc-result" id="f83_resultado">$ 1.61</div>
          <div class="tasa-info" id="f83_tasaInfo">Tasa: 1 VES = 0.001613 USD</div>
        </div>

        <div class="chart-card" style="margin-top: 24px">
          <div class="chart-card-header"><span class="chart-card-title">Conversiones Rapidas</span></div>
          <div class="kpi-grid" id="f83_rapidas"></div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f83_erp = erp;

      window.f83_calcular = function() {
        var monto = parseFloat(document.getElementById("f83_monto").value) || 0;
        var desde = document.getElementById("f83_desde").value;
        var hasta = document.getElementById("f83_hasta").value;
        var fecha = document.getElementById("f83_fecha").value || null;

        var resultado = erp.convertirMoneda(monto, desde, hasta, fecha);
        var simbolos = {VES: "Bs.", USD: "$", EUR: "€"};

        document.getElementById("f83_resultado").textContent = simbolos[hasta] + " " + resultado.monto.toLocaleString("es-VE", {minimumFractionDigits: 2, maximumFractionDigits: 2});

        if (resultado.tasa) {
          document.getElementById("f83_tasaInfo").textContent = "Tasa del " + resultado.tasa.fecha + " | Factor: " + resultado.factor.toFixed(6);
        } else {
          document.getElementById("f83_tasaInfo").textContent = "Sin tasa disponible para la fecha seleccionada";
        }
      };

      window.f83_rapidas = function() {
        var db = erp.getDB();
        var monedas = db.monedas || [];
        var container = document.getElementById("f83_rapidas");
        if (!container) return;

        var html = "";
        var base = db.config.monedaBase || "VES";
        var montoDemo = 1000;

        for (var i = 0; i < monedas.length; i++) {
          var m = monedas[i];
          if (m.codigo === base) continue;
          var conv = erp.convertirMoneda(montoDemo, base, m.codigo);
          html += '<div class="kpi-card">' +
            '<div class="kpi-card-header"><span class="kpi-card-title">' + base + ' → ' + m.codigo + '</span></div>' +
            '<div class="kpi-card-value" style="font-size:20px">' + erp.formatearMoneda(conv.monto, m.codigo) + '</div>' +
            '<div class="kpi-card-change">Factor: ' + conv.factor.toFixed(6) + '</div>' +
          '</div>';
        }
        container.innerHTML = html;
      };

      window.f83_onShow = function() {
        document.getElementById("f83_fecha").value = new Date().toISOString().split("T")[0];
        f83_calcular();
        f83_rapidas();
      };

      console.log("FASE8_3 inicializado: Conversion Automatica");
    },

    onShow: function(erp) {
      if (window.f83_onShow) window.f83_onShow();
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();