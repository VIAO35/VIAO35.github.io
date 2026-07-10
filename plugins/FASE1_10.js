(function() {
  var PLUGIN_ID = "FASE1_10";
  var PLUGIN_VERSION = "3.0.0";
  var PLUGIN_NAME = "Sync Avanzada + Resolucion Conflictos";

  var plugin = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: 1,
    microFase: "1.10",
    autor: "ERP Industrial Team",
    descripcion: "Sincronizacion avanzada con JSONBin, resolucion de conflictos, claves localStorage estandarizadas.",
    schemaVersionRequerida: "3.0.0",
    dependencias: [],

    schema: {
      syncConfig: {
        apiKey: "",
        binId: "",
        lastSync: null,
        autoSync: false,
        syncInterval: 300000,
        conflictResolution: "local", // local, remote, manual
        syncFields: []
      },
      syncLog: [],
      conflictLog: []
    },

    menu: {
      section: "Fases Instaladas",
      label: "Sync Avanzada",
      icono: "fas fa-cloud-upload-alt",
      badge: "1.10",
      orden: 1
    },

    css: `
      #mod-fase1-10 .sync-panel { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
      #mod-fase1-10 .sync-status { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
      #mod-fase1-10 .sync-status .dot { width: 10px; height: 10px; border-radius: 50%; }
      #mod-fase1-10 .sync-status .dot.online { background: #10b981; }
      #mod-fase1-10 .sync-status .dot.offline { background: #ef4444; }
      #mod-fase1-10 .sync-status .dot.syncing { background: #f59e0b; animation: pulse 1s infinite; }
      #mod-fase1-10 .sync-log { max-height: 300px; overflow-y: auto; margin-top: 12px; }
      #mod-fase1-10 .log-row { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 6px; background: #334155; margin-bottom: 6px; font-size: 12px; }
      #mod-fase1-10 .log-row.success { border-left: 3px solid #10b981; }
      #mod-fase1-10 .log-row.error { border-left: 3px solid #ef4444; }
      #mod-fase1-10 .log-row.warning { border-left: 3px solid #f59e0b; }
      #mod-fase1-10 .log-date { font-family: monospace; color: #94a3b8; min-width: 160px; }
      #mod-fase1-10 .log-msg { flex: 1; color: #f1f5f9; }
      #mod-fase1-10 .conflict-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: #334155; margin-bottom: 8px; }
      #mod-fase1-10 .conflict-field { font-weight: 600; color: #f1f5f9; }
      #mod-fase1-10 .conflict-values { display: flex; gap: 16px; flex: 1; }
      #mod-fase1-10 .conflict-value { padding: 8px 12px; border-radius: 6px; font-size: 12px; flex: 1; }
      #mod-fase1-10 .conflict-value.local { background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; color: #3b82f6; }
      #mod-fase1-10 .conflict-value.remote { background: rgba(245,158,11,0.15); border: 1px solid #f59e0b; color: #f59e0b; }
    `,

    html: `
      <div id="mod-fase1-10">
        <h1 class="page-title"><i class="fas fa-cloud-upload-alt"></i> Sync Avanzada</h1>
        <p class="page-subtitle">Fase 1.10 - Sincronizacion con JSONBin y resolucion de conflictos</p>

        <div class="sync-panel">
          <div class="config-panel-title"><i class="fas fa-key"></i> Configuracion JSONBin</div>
          <div class="form-grid">
            <div class="form-group">
              <label>API Key</label>
              <input type="text" class="config-input" id="f110_apiKey" placeholder="$2b$10...">
            </div>
            <div class="form-group">
              <label>Bin ID</label>
              <input type="text" class="config-input" id="f110_binId" placeholder="1234567890abcdef">
            </div>
            <div class="form-group">
              <label>Resolucion de Conflictos</label>
              <select class="config-input" id="f110_conflictMode">
                <option value="local">Prioridad Local</option>
                <option value="remote">Prioridad Remota</option>
                <option value="manual">Manual (mostrar)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Auto-Sync (minutos)</label>
              <select class="config-input" id="f110_autoSync">
                <option value="0">Desactivado</option>
                <option value="5">5 min</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hora</option>
              </select>
            </div>
          </div>
          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap">
            <button class="btn btn-primary" onclick="f110_saveConfig()"><i class="fas fa-save"></i> Guardar Config</button>
            <button class="btn btn-success" onclick="f110_syncToCloud()"><i class="fas fa-upload"></i> Subir a Nube</button>
            <button class="btn btn-secondary" onclick="f110_syncFromCloud()"><i class="fas fa-download"></i> Descargar de Nube</button>
            <button class="btn btn-warning" onclick="f110_testConnection()"><i class="fas fa-plug"></i> Probar Conexion</button>
          </div>
          <div class="sync-status" id="f110_status">
            <div class="dot offline" id="f110_statusDot"></div>
            <span id="f110_statusText" style="font-size:13px; color:#94a3b8">Sin configurar</span>
          </div>
        </div>

        <div class="sync-panel">
          <div class="config-panel-title"><i class="fas fa-exclamation-triangle"></i> Conflictos Pendientes</div>
          <div id="f110_conflicts"><div style="color:#94a3b8; text-align:center; padding:20px">No hay conflictos</div></div>
        </div>

        <div class="sync-panel">
          <div class="config-panel-title"><i class="fas fa-history"></i> Log de Sincronizacion</div>
          <div class="sync-log" id="f110_syncLog"><div style="color:#94a3b8; text-align:center; padding:20px">Sin registros</div></div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f110_erp = erp;
      window.f110_syncInterval = null;

      window.f110_saveConfig = function() {
        var db = erp.getDB();
        db.syncConfig = db.syncConfig || {};
        db.syncConfig.apiKey = document.getElementById("f110_apiKey").value.trim();
        db.syncConfig.binId = document.getElementById("f110_binId").value.trim();
        db.syncConfig.conflictResolution = document.getElementById("f110_conflictMode").value;
        db.syncConfig.autoSync = parseInt(document.getElementById("f110_autoSync").value) || 0;
        erp.saveLocal(db);
        f110_setupAutoSync();
        erp.showToast("success", "Config Guardada", "Sync configurado correctamente");
      };

      window.f110_loadConfig = function() {
        var db = erp.getDB();
        var cfg = db.syncConfig || {};
        document.getElementById("f110_apiKey").value = cfg.apiKey || "";
        document.getElementById("f110_binId").value = cfg.binId || "";
        document.getElementById("f110_conflictMode").value = cfg.conflictResolution || "local";
        document.getElementById("f110_autoSync").value = cfg.autoSync || 0;
      };

      window.f110_testConnection = async function() {
        var db = erp.getDB();
        var cfg = db.syncConfig || {};
        if (!cfg.apiKey || !cfg.binId) {
          erp.showToast("warning", "Sin Config", "Ingresa API Key y Bin ID");
          return;
        }
        erp.showLoading(true, "Probando conexion...");
        try {
          var resp = await fetch("https://api.jsonbin.io/v3/b/" + cfg.binId + "/latest", {
            headers: {"X-Master-Key": cfg.apiKey}
          });
          if (resp.ok) {
            f110_setStatus("online", "Conectado a JSONBin");
            erp.showToast("success", "Conexion OK", "JSONBin accesible");
          } else {
            throw new Error("HTTP " + resp.status);
          }
        } catch(e) {
          f110_setStatus("offline", "Error: " + e.message);
          erp.showToast("error", "Error", e.message);
        } finally {
          erp.showLoading(false);
        }
      };

      window.f110_syncToCloud = async function() {
        var db = erp.getDB();
        var cfg = db.syncConfig || {};
        if (!cfg.apiKey || !cfg.binId) {
          erp.showToast("warning", "Sin Config", "Configura JSONBin primero");
          return;
        }
        erp.showLoading(true, "Subiendo a JSONBin...");
        try {
          var resp = await fetch("https://api.jsonbin.io/v3/b/" + cfg.binId, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Master-Key": cfg.apiKey
            },
            body: JSON.stringify(db)
          });
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          f110_addLog("success", "Datos subidos a JSONBin");
          f110_setStatus("online", "Sincronizado: " + new Date().toLocaleTimeString());
          erp.showToast("success", "Sync OK", "Datos subidos a la nube");
        } catch(e) {
          f110_addLog("error", "Error subiendo: " + e.message);
          erp.showToast("error", "Sync Error", e.message);
        } finally {
          erp.showLoading(false);
        }
      };

      window.f110_syncFromCloud = async function() {
        var db = erp.getDB();
        var cfg = db.syncConfig || {};
        if (!cfg.apiKey || !cfg.binId) {
          erp.showToast("warning", "Sin Config", "Configura JSONBin primero");
          return;
        }
        erp.showLoading(true, "Descargando de JSONBin...");
        try {
          var resp = await fetch("https://api.jsonbin.io/v3/b/" + cfg.binId + "/latest", {
            headers: {"X-Master-Key": cfg.apiKey}
          });
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          var remote = await resp.json();
          var remoteData = remote.record || remote;

          // Crear snapshot antes de merge
          f110_createPreSyncSnapshot();

          // Resolver conflictos
          var conflicts = f110_detectConflicts(db, remoteData);
          if (conflicts.length > 0 && cfg.conflictResolution === "manual") {
            f110_showConflicts(conflicts, db, remoteData);
            erp.showLoading(false);
            return;
          }

          var merged = f110_mergeData(db, remoteData, cfg.conflictResolution || "local");
          erp.saveLocal(merged);
          f110_addLog("success", "Datos descargados y mergeados");
          f110_setStatus("online", "Sincronizado: " + new Date().toLocaleTimeString());
          erp.showToast("success", "Sync OK", "Datos actualizados desde la nube");
        } catch(e) {
          f110_addLog("error", "Error descargando: " + e.message);
          erp.showToast("error", "Sync Error", e.message);
        } finally {
          erp.showLoading(false);
        }
      };

      window.f110_detectConflicts = function(local, remote) {
        var conflicts = [];
        var keys = Object.keys(local);
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (k === "snapshots" || k === "syncLog" || k === "conflictLog") continue;
          if (JSON.stringify(local[k]) !== JSON.stringify(remote[k])) {
            conflicts.push({field: k, local: JSON.stringify(local[k]).substring(0, 200), remote: JSON.stringify(remote[k]).substring(0, 200)});
          }
        }
        return conflicts;
      };

      window.f110_mergeData = function(local, remote, mode) {
        var merged = JSON.parse(JSON.stringify(local));
        if (mode === "remote") {
          var keys = Object.keys(remote);
          for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (k !== "snapshots" && k !== "syncLog" && k !== "conflictLog") {
              merged[k] = remote[k];
            }
          }
        }
        // Siempre preservar logs locales
        merged.syncLog = local.syncLog || [];
        merged.conflictLog = local.conflictLog || [];
        return merged;
      };

      window.f110_showConflicts = function(conflicts, local, remote) {
        var html = '<div style="display:flex; flex-direction:column; gap:8px">';
        for (var i = 0; i < conflicts.length; i++) {
          var c = conflicts[i];
          html += '<div class="conflict-row">' +
            '<span class="conflict-field">' + c.field + '</span>' +
            '<div class="conflict-values">' +
              '<div class="conflict-value local"><strong>Local:</strong><br>' + c.local + '</div>' +
              '<div class="conflict-value remote"><strong>Remoto:</strong><br>' + c.remote + '</div>' +
            '</div>' +
            '<div style="display:flex; gap:6px">' +
              '<button class="btn btn-primary btn-sm" onclick="f110_resolveConflict(\'' + c.field + '\', \'local\')">Usar Local</button>' +
              '<button class="btn btn-warning btn-sm" onclick="f110_resolveConflict(\'' + c.field + '\', \'remote\')">Usar Remoto</button>' +
            '</div>' +
          '</div>';
        }
        html += '</div>';
        document.getElementById("f110_conflicts").innerHTML = html;
      };

      window.f110_resolveConflict = function(field, choice) {
        // Simplified: re-run sync with chosen resolution
        var db = erp.getDB();
        db.syncConfig.conflictResolution = choice;
        erp.saveLocal(db);
        f110_syncFromCloud();
      };

      window.f110_createPreSyncSnapshot = function() {
        var db = erp.getDB();
        if (!db.snapshots) db.snapshots = [];
        var snap = {
          id: "SNAP_PRESYNC_" + Date.now(),
          fecha: new Date().toISOString(),
          descripcion: "Pre-sync automatico",
          version: erp.version,
          size: JSON.stringify(db).length
        };
        try {
          localStorage.setItem("erp_snap_" + snap.id, JSON.stringify(db));
        } catch(e) {}
        db.snapshots.unshift(snap);
        if (db.snapshots.length > 10) db.snapshots.pop();
        erp.saveLocal(db);
      };

      window.f110_setStatus = function(status, text) {
        var dot = document.getElementById("f110_statusDot");
        var txt = document.getElementById("f110_statusText");
        if (dot) {
          dot.className = "dot " + status;
        }
        if (txt) txt.textContent = text;
      };

      window.f110_addLog = function(type, msg) {
        var db = erp.getDB();
        if (!db.syncLog) db.syncLog = [];
        db.syncLog.unshift({
          fecha: new Date().toISOString(),
          tipo: type,
          mensaje: msg
        });
        if (db.syncLog.length > 100) db.syncLog.pop();
        erp.saveLocal(db);
        f110_renderLog();
      };

      window.f110_renderLog = function() {
        var db = erp.getDB();
        var log = db.syncLog || [];
        var container = document.getElementById("f110_syncLog");
        if (!container) return;
        if (log.length === 0) {
          container.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:20px">Sin registros</div>';
          return;
        }
        var html = '';
        for (var i = 0; i < Math.min(log.length, 50); i++) {
          var l = log[i];
          html += '<div class="log-row ' + l.tipo + '">' +
            '<span class="log-date">' + new Date(l.fecha).toLocaleString() + '</span>' +
            '<span class="log-msg">' + l.mensaje + '</span>' +
          '</div>';
        }
        container.innerHTML = html;
      };

      window.f110_setupAutoSync = function() {
        if (window.f110_syncInterval) {
          clearInterval(window.f110_syncInterval);
          window.f110_syncInterval = null;
        }
        var db = erp.getDB();
        var cfg = db.syncConfig || {};
        if (cfg.autoSync > 0) {
          window.f110_syncInterval = setInterval(function() {
            f110_syncToCloud();
          }, cfg.autoSync * 60000);
        }
      };

      // Auto-init config UI when shown
      window.f110_onShow = function() {
        f110_loadConfig();
        f110_renderLog();
      };

      console.log("FASE1_10 inicializado: Sync Avanzada");
    },

    onShow: function(erp) {
      if (window.f110_onShow) window.f110_onShow();
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();