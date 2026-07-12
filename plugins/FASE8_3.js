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
    descripcion: "Conversion automatica entre monedas usando tasas del dia.",
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
      #mod-fase8_3 .calc-panel { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; }
      #mod-fase8_3 .calc-result { font-size: 32px; font-weight: 700; color: #3b82f6; text-align: center; margin: 16px 0; }
      #mod-fase8_3 .calc-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      #mod-fase8_3 .calc-label { font-size: 13px; color: #94a3b8; min-width: 80px; }
      #mod-fase8_3 .calc-input { flex: 1; padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 16px; }
      #mod-fase8_3 .calc-select { padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 14px; }
      #mod-fase8_3 .formula-box { background: #334155; border-radius: 8px; padding: 12px; margin: 12px 0; font-family: monospace; font-size: 13px; color: #94a3b8; text-align: center; }
      #mod-fase8_3 .tasa-info { text-align: center; font-size: 12px; color: #64748b; margin-top: 8px; }
    `,

    html: `
      <div id="mod-fase8_3">
        <h1 class="page-title"><i class="fas fa-calculator"></i> Conversor de Monedas</h1>
        <p class="page-subtitle">Fase 8.3 - Conversion automatica con tasas del dia</p>

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
              <option value="USD" selected>USD (Dolar)</option>
              <option value="VES">VES (Bolivar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>

          <div class="formula-box" id="f83_formula">Ingresa un monto para convertir</div>

          <div class="section-divider"></div>
          <div class="calc-result" id="f83_resultado">-</div>
          <div class="tasa-info" id="f83_tasaInfo">Registra una tasa en "Tasas de Cambio" primero</div>
        </div>

        <div class="chart-card" style="margin-top: 24px">
          <div class="chart-card-header"><span class="chart-card-title">Conversiones Rapidas (1 unidad)</span></div>
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

        var db = erp.getDB();
        var tasas = db.tasasCambio || [];
        var tasa = null;
        for (var i = 0; i < tasas.length; i++) {
          if (tasas[i].activa) { tasa = tasas[i]; break; }
        }

        var resultadoEl = document.getElementById("f83_resultado");
        var formulaEl = document.getElementById("f83_formula");
        var tasaInfoEl = document.getElementById("f83_tasaInfo");

        if (!tasa) {
          if (resultadoEl) resultadoEl.textContent = "-";
          if (formulaEl) formulaEl.textContent = "No hay tasa activa. Ve a Tasas de Cambio primero.";
          if (tasaInfoEl) tasaInfoEl.textContent = "Registra una tasa primero";
          return;
        }

        var resultado = 0;
        var formula = "";
        var factor = 0;

        if (desde === hasta) {
          resultado = monto;
          formula = monto + " " + desde + " = " + monto + " " + hasta;
          factor = 1;
        }
        else if (desde === "VES" && hasta === "USD") {
          factor = tasa.ves_a_usd || 0;
          resultado = monto * factor;
          formula = monto + " VES x " + factor.toFixed(6) + " = " + resultado.toFixed(4) + " USD";
        }
        else if (desde === "USD" && hasta === "VES") {
          factor = tasa.usd_a_ves || 0;
          resultado = monto * factor;
          formula = monto + " USD x " + factor.toFixed(2) + " = " + resultado.toFixed(2) + " VES";
        }
        else if (desde === "VES" && hasta === "EUR") {
          factor = tasa.ves_a_eur || 0;
          resultado = monto * factor;
          formula = monto + " VES x " + factor.toFixed(6) + " = " + resultado.toFixed(4) + " EUR";
        }
        else if (desde === "EUR" && hasta === "VES") {
          factor = tasa.eur_a_ves || 0;
          resultado = monto * factor;
          formula = monto + " EUR x " + factor.toFixed(2) + " = " + resultado.toFixed(2) + " VES";
        }
        else if (desde === "USD" && hasta === "EUR") {
          factor = tasa.usd_a_eur || 0;
          resultado = monto * factor;
          formula = monto + " USD x " + factor.toFixed(4) + " = " + resultado.toFixed(4) + " EUR";
        }
        else if (desde === "EUR" && hasta === "USD") {
          factor = tasa.eur_a_usd || 0;
          resultado = monto * factor;
          formula = monto + " EUR x " + factor.toFixed(4) + " = " + resultado.toFixed(4) + " USD";
        }

        var simbolos = {VES: "Bs.", USD: "$", EUR: "€"};
        if (resultadoEl) resultadoEl.textContent = simbolos[hasta] + " " + resultado.toLocaleString("es-VE", {minimumFractionDigits: 2, maximumFractionDigits: 2});
        if (formulaEl) formulaEl.textContent = formula;
        if (tasaInfoEl) tasaInfoEl.textContent = "Tasa del " + tasa.fecha + " | Factor: " + factor.toFixed(6);
      };

      window.f83_rapidas = function() {
        var db = erp.getDB();
        var container = document.getElementById("f83_rapidas");
        if (!container) return;

        var tasas = db.tasasCambio || [];
        var tasa = null;
        for (var i = 0; i < tasas.length; i++) {
          if (tasas[i].activa) { tasa = tasas[i]; break; }
        }

        if (!tasa) {
          container.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:20px">Registra una tasa en "Tasas de Cambio" primero</div>';
          return;
        }

        var html = "";
        var conversions = [
          {m: 1, from: "USD", to: "VES", val: tasa.usd_a_ves},
          {m: 1, from: "EUR", to: "VES", val: tasa.eur_a_ves},
          {m: 1, from: "USD", to: "EUR", val: tasa.usd_a_eur},
          {m: 1000, from: "VES", to: "USD", val: (tasa.ves_a_usd || 0) * 1000}
        ];

        for (var i = 0; i < conversions.length; i++) {
          var c = conversions[i];
          html += '<div class="kpi-card">' +
            '<div class="kpi-card-header"><span class="kpi-card-title">' + c.m + ' ' + c.from + ' → ' + c.to + '</span></div>' +
            '<div class="kpi-card-value" style="font-size:20px">' + erp.formatearMoneda(c.val, c.to) + '</div>' +
          '</div>';
        }
        container.innerHTML = html;
      };

      window.f83_onShow = function() {
        f83_calcular();
        f83_rapidas();
      };

      console.log("FASE8_3 inicializado: Conversor v2");
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
