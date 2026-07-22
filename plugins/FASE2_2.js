// ═══════════════════════════════════════════════════════════════════════════════
// FASE 2.2 - FORMULARIO AGREGAR MATERIAL
// Modal form mejorado para agregar nuevos materiales al inventario
// Validaciones avanzadas, generacion automatica de codigo, seleccion categoria/unidad
// Dependencia: FASE2_1
// Compatible con ERP Core v3.0 - Slots API
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  let PLUGIN_ID       = "FASE2_2";
  let PLUGIN_VERSION  = "3.0.0";
  let PLUGIN_NAME     = "Formulario Agregar Material";
  let PLUGIN_FASE     = 2;
  let PLUGIN_MICRO    = "2.2";
  let SCHEMA_REQ      = "3.0.0";
  let DEPENDENCIAS    = ["FASE2_1"];
  let PARENT_MODULE   = "fase2";

  let _erp = null;
  let initialized = false;

  // ─── CACHE DE ELEMENTOS DOM ───
  function $(id) { return document.getElementById(id); }

  // ─── GENERAR CODIGO AUTOMATICO ───
  function generarCodigo() {
    let db = _erp.getDB();
    let materias = db.materiasPrimas || [];
    let maxNum = 0;
    for (let i = 0; i < materias.length; i++) {
      let cod = materias[i].codigo || "";
      let match = cod.match(/MP(\d+)/);
      if (match) {
        let num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    let next = maxNum + 1;
    let codigo = "MP" + String(next).padStart(3, "0");
    return codigo;
  }

  // ─── VALIDAR CODIGO UNICO ───
  function codigoEsUnico(codigo, excluirId) {
    let db = _erp.getDB();
    let materias = db.materiasPrimas || [];
    for (let i = 0; i < materias.length; i++) {
      if (materias[i].id !== excluirId && (materias[i].codigo === codigo || materias[i].id === codigo)) {
        return false;
      }
    }
    return true;
  }

  // ─── VALIDAR FORMULARIO ───
  function validarFormulario() {
    let errores = [];
    let inpCodigo = $("f22_inpCodigo");
    let inpNombre = $("f22_inpNombre");
    let inpStock = $("f22_inpStock");
    let inpStockMin = $("f22_inpStockMin");
    let inpCosto = $("f22_inpCosto");
    let inpCategoria = $("f22_inpCategoria");
    let inpUnidad = $("f22_inpUnidad");

    let codigo = inpCodigo ? inpCodigo.value.trim() : "";
    let nombre = inpNombre ? inpNombre.value.trim() : "";
    let stock = parseFloat(inpStock ? inpStock.value : 0);
    let stockMin = parseFloat(inpStockMin ? inpStockMin.value : 0);
    let costo = parseFloat(inpCosto ? inpCosto.value : 0);

    if (!codigo) errores.push("El codigo es obligatorio");
    if (!nombre) errores.push("El nombre es obligatorio");
    if (nombre.length < 2) errores.push("El nombre debe tener al menos 2 caracteres");
    if (isNaN(stock) || stock < 0) errores.push("El stock inicial debe ser un numero mayor o igual a 0");
    if (isNaN(stockMin) || stockMin < 0) errores.push("El stock minimo debe ser un numero mayor o igual a 0");
    if (isNaN(costo) || costo < 0) errores.push("El costo unitario debe ser un numero mayor o igual a 0");
    if (!inpCategoria || !inpCategoria.value) errores.push("Debe seleccionar una categoria");
    if (!inpUnidad || !inpUnidad.value) errores.push("Debe seleccionar una unidad");

    return errores;
  }

  // ─── MOSTRAR ERRORES DE VALIDACION ───
  function mostrarErrores(errores) {
    let container = $("f22_errorContainer");
    if (!container) return;
    if (errores.length === 0) {
      container.style.display = "none";
      container.innerHTML = "";
      return;
    }
    let html = '<div style="background:rgba(239,68,68,.15);border:1px solid #ef4444;border-radius:8px;padding:12px;margin-bottom:16px;">' +
      '<div style="color:#ef4444;font-weight:600;font-size:13px;margin-bottom:6px;"><i class="fas fa-exclamation-circle"></i> Corrija los siguientes errores:</div>' +
      '<ul style="margin:0;padding-left:18px;color:#fca5a5;font-size:12px;">';
    for (let i = 0; i < errores.length; i++) {
      html += "<li>" + errores[i] + "</li>";
    }
    html += "</ul></div>";
    container.innerHTML = html;
    container.style.display = "block";
  }

  // ─── LIMPIAR ERRORES ───
  function limpiarErrores() {
    let container = $("f22_errorContainer");
    if (container) {
      container.style.display = "none";
      container.innerHTML = "";
    }
    let inputs = ["f22_inpCodigo", "f22_inpNombre", "f22_inpStock", "f22_inpStockMin", "f22_inpCosto", "f22_inpCategoria", "f22_inpUnidad"];
    for (let i = 0; i < inputs.length; i++) {
      let el = $(inputs[i]);
      if (el) el.style.borderColor = "#334155";
    }
  }

  // ─── MARCAR CAMPOS CON ERROR ───
  function marcarCampoError(fieldId) {
    let el = $(fieldId);
    if (el) el.style.borderColor = "#ef4444";
  }

  // ─── CARGAR CATEGORIAS Y UNIDADES EN SELECTS ───
  function loadCategories() {
    let db = _erp.getDB();
    let cats = db.categorias || [];
    let unidades = db.unidades || [];
    let inpCategoria = $("f22_inpCategoria");
    let inpUnidad = $("f22_inpUnidad");

    if (inpCategoria) {
      let html = '<option value="">-- Seleccione --</option>';
      for (let i = 0; i < cats.length; i++) {
        html += '<option value="' + cats[i].nombre + '">' + cats[i].nombre + "</option>";
      }
      inpCategoria.innerHTML = html;
    }
    if (inpUnidad) {
      let html = '<option value="">-- Seleccione --</option>';
      for (let i = 0; i < unidades.length; i++) {
        html += '<option value="' + unidades[i].nombre + '">' + unidades[i].nombre + " (" + unidades[i].simbolo + ")</option>";
      }
      inpUnidad.innerHTML = html;
    }
  }

  // ─── ABRIR MODAL ───
  function openModal() {
    limpiarErrores();

    // Asegurar que el modal esté en el DOM
    injectModal();

    let modal = $("f22_modal");
    let inpCodigo = $("f22_inpCodigo");
    let inpNombre = $("f22_inpNombre");
    let inpStock = $("f22_inpStock");
    let inpStockMin = $("f22_inpStockMin");
    let inpCosto = $("f22_inpCosto");
    let inpMoneda = $("f22_inpMoneda");
    let inpCategoria = $("f22_inpCategoria");
    let inpUnidad = $("f22_inpUnidad");
    let inpDescripcion = $("f22_inpDescripcion");

    if (inpCodigo) inpCodigo.value = generarCodigo();
    if (inpNombre) inpNombre.value = "";
    if (inpStock) inpStock.value = "0";
    if (inpStockMin) inpStockMin.value = "0";
    if (inpCosto) inpCosto.value = "0";
    if (inpMoneda) inpMoneda.value = "VES";
    if (inpCategoria) inpCategoria.value = "";
    if (inpUnidad) inpUnidad.value = "";
    if (inpDescripcion) inpDescripcion.value = "";

    loadCategories();

    if (modal) {
      modal.style.display = "flex";
      modal.classList.add("active");
    }

    setTimeout(function() {
      let el = $("f22_inpNombre");
      if (el) el.focus();
    }, 100);
  }

  // ─── CERRAR MODAL ───
  function closeModal() {
    let modal = $("f22_modal");
    if (modal) {
      modal.classList.remove("active");
      modal.style.display = "none";
    }
    limpiarErrores();
  }

  // ─── GUARDAR MATERIAL ───
  function saveMaterial() {
    limpiarErrores();

    let errores = validarFormulario();
    if (errores.length > 0) {
      mostrarErrores(errores);
      return;
    }

    let inpCodigo = $("f22_inpCodigo");
    let inpNombre = $("f22_inpNombre");
    let inpCategoria = $("f22_inpCategoria");
    let inpUnidad = $("f22_inpUnidad");
    let inpStock = $("f22_inpStock");
    let inpStockMin = $("f22_inpStockMin");
    let inpCosto = $("f22_inpCosto");
    let inpMoneda = $("f22_inpMoneda");
    let inpDescripcion = $("f22_inpDescripcion");

    let codigo = inpCodigo ? inpCodigo.value.trim() : "";
    let nombre = inpNombre ? inpNombre.value.trim() : "";
    let categoria = inpCategoria ? inpCategoria.value : "";
    let unidad = inpUnidad ? inpUnidad.value : "";
    let stock = parseFloat(inpStock ? inpStock.value : 0) || 0;
    let stockMin = parseFloat(inpStockMin ? inpStockMin.value : 0) || 0;
    let costo = parseFloat(inpCosto ? inpCosto.value : 0) || 0;
    let moneda = inpMoneda ? inpMoneda.value : "VES";
    let descripcion = inpDescripcion ? inpDescripcion.value.trim() : "";

    if (!codigoEsUnico(codigo, null)) {
      mostrarErrores(["El codigo '" + codigo + "' ya existe. Use otro codigo."]);
      marcarCampoError("f22_inpCodigo");
      return;
    }

    let db = _erp.getDB();
    if (!db.materiasPrimas) db.materiasPrimas = [];

    let newId = _erp.genId("MP");
    let nuevoMaterial = {
      id: newId,
      codigo: codigo,
      nombre: nombre,
      categoria: categoria,
      unidad: unidad,
      stock: stock,
      stockMin: stockMin,
      costoUnitario: costo,
      monedaCostoBase: moneda,
      descripcion: descripcion,
      fechaRegistro: new Date().toISOString(),
      activo: true
    };

    db.materiasPrimas.push(nuevoMaterial);
    _erp.saveLocal(db);

    closeModal();
    _erp.showToast("success", "Guardado", "Material '" + nombre + "' agregado correctamente (" + codigo + ")");

    if (window.FASE2_1 && window.FASE2_1.refresh) {
      window.FASE2_1.refresh();
    }
    if (window.FASE2_PADRE && window.FASE2_PADRE.render) {
      window.FASE2_PADRE.render();
    }
  }

  // ─── EVENT LISTENERS ───
  function bindEvents() {
    let btnClose = $("f22_modalClose");
    let btnCancel = $("f22_btnCancel");
    let btnSave = $("f22_btnSave");
    let btnGenCodigo = $("f22_btnGenCodigo");
    let modal = $("f22_modal");

    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    if (btnSave) btnSave.onclick = saveMaterial;
    if (btnGenCodigo) btnGenCodigo.onclick = function() {
      let inpCodigo = $("f22_inpCodigo");
      if (inpCodigo) inpCodigo.value = generarCodigo();
    };
    if (modal) {
      modal.onclick = function(e) { if (e.target === modal) closeModal(); };
    }

    let inputs = ["f22_inpCodigo", "f22_inpNombre", "f22_inpCategoria", "f22_inpUnidad",
                  "f22_inpStock", "f22_inpStockMin", "f22_inpCosto", "f22_inpMoneda"];
    for (let i = 0; i < inputs.length; i++) {
      (function(idx) {
        let el = $(inputs[idx]);
        if (el) {
          el.onkeydown = function(e) {
            if (e.key === "Enter") {
              e.preventDefault();
              if (idx < inputs.length - 1) {
                let next = $(inputs[idx + 1]);
                if (next) next.focus();
              } else {
                saveMaterial();
              }
            }
          };
        }
      })(i);
    }
  }

  // ─── INYECTAR MODAL EN DOM ───
  function injectModal() {
    let existente = $("f22_modal");
    if (existente) return; // Ya está inyectado

    // Intentar inyectar en el slot de modals del padre
    let modalsSlot = $(PARENT_MODULE + "-slot-modals");
    if (modalsSlot) {
      modalsSlot.insertAdjacentHTML("beforeend", MODAL_HTML);
    } else {
      // Fallback: inyectar al final del body
      document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    }
    bindEvents();
  }

  // ─── SOBRESCRIBIR BOTON NUEVO MATERIAL DEL PADRE ───
  function hookParentButtons() {
    // 1. Sobrescribir el botón del toolbar del módulo padre (via ERP API)
    if (_erp && _erp.enableButton) {
      _erp.enableButton(PARENT_MODULE, "nuevo-mat", openModal, "Nuevo Material", "fa-box");
    }

    // 2. Sobrescribir el botón interno de la tabla de FASE2_1 (f21_btnAdd)
    let btnAdd = $("f21_btnAdd");
    if (btnAdd) {
      btnAdd.onclick = openModal;
    }
  }

  // ─── HTML DEL MODAL ───
  let MODAL_HTML = '<div class="modal-overlay" id="f22_modal" style="display:none;align-items:center;justify-content:center;">' +
    '<div class="modal-content" style="background:#1e293b;border:1px solid #334155;border-radius:12px;width:100%;max-width:650px;max-height:92vh;overflow-y:auto;">' +
      '<div class="modal-header" style="padding:20px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:36px;height:36px;border-radius:8px;background:rgba(59,130,246,.15);display:flex;align-items:center;justify-content:center;color:#3b82f6;font-size:16px;"><i class="fas fa-plus-circle"></i></div>' +
          '<div>' +
            '<div class="modal-title" id="f22_modalTitle" style="font-size:16px;font-weight:600;color:#f1f5f9;">Agregar Nuevo Material</div>' +
            '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">Complete todos los campos obligatorios (*)</div>' +
          '</div>' +
        '</div>' +
        '<button id="f22_modalClose" style="width:32px;height:32px;border-radius:6px;background:#334155;border:none;color:#f1f5f9;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">&times;</button>' +
      '</div>' +
      '<div class="modal-body" style="padding:20px;">' +
        '<div id="f22_errorContainer" style="display:none;"></div>' +
        '<div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Codigo <span style="color:#ef4444">*</span></label>' +
            '<div style="display:flex;gap:8px;">' +
              '<input type="text" id="f22_inpCodigo" placeholder="Ej: MP006" style="flex:1;padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;" readonly>' +
              '<button id="f22_btnGenCodigo" class="btn btn-secondary" style="padding:10px 12px;white-space:nowrap;font-size:12px;"><i class="fas fa-sync-alt"></i> Generar</button>' +
            '</div>' +
          '</div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Nombre <span style="color:#ef4444">*</span></label>' +
            '<input type="text" id="f22_inpNombre" placeholder="Nombre del material" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;">' +
          '</div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Categoria <span style="color:#ef4444">*</span></label>' +
            '<select id="f22_inpCategoria" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"><option value="">-- Seleccione --</option></select>' +
          '</div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Unidad <span style="color:#ef4444">*</span></label>' +
            '<select id="f22_inpUnidad" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;"><option value="">-- Seleccione --</option></select>' +
          '</div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Stock Inicial</label>' +
            '<input type="number" id="f22_inpStock" value="0" min="0" step="0.01" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;">' +
          '</div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Stock Minimo</label>' +
            '<input type="number" id="f22_inpStockMin" value="0" min="0" step="0.01" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;">' +
          '</div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Costo Unitario</label>' +
            '<input type="number" id="f22_inpCosto" value="0" step="0.01" min="0" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;">' +
          '</div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Moneda Costo</label>' +
            '<select id="f22_inpMoneda" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;">' +
              '<option value="VES">VES (Bolivar)</option>' +
              '<option value="USD">USD (Dolar)</option>' +
              '<option value="EUR">EUR (Euro)</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group" style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1;">' +
            '<label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Descripcion (opcional)</label>' +
            '<textarea id="f22_inpDescripcion" rows="2" placeholder="Descripcion adicional del material..." style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;resize:vertical;"></textarea>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-footer" style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:10px;">' +
        '<button class="btn btn-secondary" id="f22_btnCancel">Cancelar</button>' +
        '<button class="btn btn-primary" id="f22_btnSave"><i class="fas fa-save"></i> Guardar Material</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  // ─── CSS SCOPED ───
  let PLUGIN_CSS = [
    "/* FASE2_2 - Formulario Agregar Material */",
    "#mod-fase2-2 #f22_modal.active { display: flex !important; }",
    "#mod-fase2-2 #f22_modal { z-index: 2600; position: fixed; inset: 0; background: rgba(0,0,0,.7); display: none; }",
    "#mod-fase2-2 #f22_modal .modal-content { animation: f22-slideIn 0.2s ease-out; }",
    "#mod-fase2-2 @keyframes f22-slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }",
    "#mod-fase2-2 #f22_inpCodigo { font-family: monospace; font-weight: 600; color: #3b82f6; }",
    "#mod-fase2-2 #f22_btnGenCodigo { transition: all 0.2s; }",
    "#mod-fase2-2 #f22_btnGenCodigo:hover { background: #3b82f6; color: #fff; }",
    "#mod-fase2-2 .form-group input:focus,",
    "#mod-fase2-2 .form-group select:focus,",
    "#mod-fase2-2 .form-group textarea:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59,130,246,.2); }"
  ].join("\n");

  // ─── INICIALIZAR PLUGIN ───
  function initPlugin() {
    if (initialized) return;
    initialized = true;

    // Inyectar CSS
    let styleId = "erp-css-" + PLUGIN_ID;
    let existente = $(styleId);
    if (existente) existente.remove();
    let style = document.createElement("style");
    style.id = styleId;
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);

    // Inyectar modal
    injectModal();

    // Sobrescribir botones del padre para usar nuestro modal
    hookParentButtons();

  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // API GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════════

  window.FASE2_2 = {
    PLUGIN_ID: PLUGIN_ID,
    PLUGIN_VERSION: PLUGIN_VERSION,
    PLUGIN_NAME: PLUGIN_NAME,
    parentModule: PARENT_MODULE,
    openModal: openModal,
    closeModal: closeModal,
    generarCodigo: generarCodigo,
    refresh: function() {
      if (window.FASE2_1 && window.FASE2_1.refresh) {
        window.FASE2_1.refresh();
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEFINICION DEL PLUGIN
  // ═══════════════════════════════════════════════════════════════════════════════

  let pluginDef = {
    id: "FASE2_2",
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: PLUGIN_FASE,
    microFase: PLUGIN_MICRO,
    autor: "VIAO35",
    descripcion: "Modal form mejorado para agregar nuevos materiales al inventario. Validaciones avanzadas, generacion automatica de codigo, y seleccion de categoria/unidad.",
    schemaVersionRequerida: SCHEMA_REQ,
    dependencias: DEPENDENCIAS,
    menu: null,

    schema: {},

    css: PLUGIN_CSS,
    html: "",

    init: function(erp) {
      _erp = erp;
      setTimeout(function() {
        initPlugin();
      }, 500);
    },

    onShow: function(erp) {
      _erp = erp;
      if (!initialized) {
        initPlugin();
      } else {
        hookParentButtons();
      }
    }
  };

  // ─── REGISTRAR PLUGIN ───
  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(pluginDef);
  } else {
    console.error("[" + PLUGIN_ID + "] ERP no disponible. No se pudo registrar.");
  }
})();
