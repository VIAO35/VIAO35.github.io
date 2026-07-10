(function() {
  var PLUGIN_ID = "FASE2_2";
  var PLUGIN_VERSION = "3.0.0";
  var PLUGIN_NAME = "Formulario Agregar Material";

  var plugin = {
    id: PLUGIN_ID,
    nombre: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    fasePrincipal: 2,
    microFase: "2.2",
    autor: "ERP Industrial Team",
    descripcion: "Modal form para agregar nuevos materiales al inventario. Validaciones, generacion automatica de codigo, y seleccion de categoria/unidad.",
    schemaVersionRequerida: "3.0.0",
    dependencias: ["FASE2_1"],

    schema: {},

    menu: {
      section: "almacen",
      label: "Agregar Material",
      icono: "fas fa-plus-circle",
      badge: "2.2",
      orden: 22
    },

    css: `
      #mod-fase2-2 .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      #mod-fase2-2 .modal-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        width: 100%;
        max-width: 720px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      }
      #mod-fase2-2 .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #334155;
        position: sticky;
        top: 0;
        background: #1e293b;
        z-index: 10;
        border-radius: 16px 16px 0 0;
      }
      #mod-fase2-2 .modal-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      #mod-fase2-2 .modal-title .icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
      }
      #mod-fase2-2 .btn-close {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1.5rem;
        cursor: pointer;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      #mod-fase2-2 .btn-close:hover {
        background: #334155;
        color: #fff;
      }
      #mod-fase2-2 .modal-body {
        padding: 1.5rem;
      }
      #mod-fase2-2 .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
      @media (max-width: 640px) {
        #mod-fase2-2 .form-grid { grid-template-columns: 1fr; }
      }
      #mod-fase2-2 .form-group.full {
        grid-column: 1 / -1;
      }
      #mod-fase2-2 .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #cbd5e1;
        margin-bottom: 0.375rem;
      }
      #mod-fase2-2 .form-label .required {
        color: #ef4444;
        margin-left: 2px;
      }
      #mod-fase2-2 .form-hint {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.25rem;
      }
      #mod-fase2-2 .form-input,
      #mod-fase2-2 .form-select,
      #mod-fase2-2 .form-textarea {
        width: 100%;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 0.625rem 0.875rem;
        color: #f1f5f9;
        font-size: 0.9375rem;
        transition: all 0.2s;
        box-sizing: border-box;
      }
      #mod-fase2-2 .form-input:focus,
      #mod-fase2-2 .form-select:focus,
      #mod-fase2-2 .form-textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
      }
      #mod-fase2-2 .form-input.error,
      #mod-fase2-2 .form-select.error {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239,68,68,0.15);
      }
      #mod-fase2-2 .form-textarea {
        min-height: 80px;
        resize: vertical;
        font-family: inherit;
      }
      #mod-fase2-2 .form-select {
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        padding-right: 2.5rem;
      }
      #mod-fase2-2 .form-select option {
        background: #1e293b;
        color: #f1f5f9;
      }
      #mod-fase2-2 .input-group {
        display: flex;
        gap: 0.5rem;
      }
      #mod-fase2-2 .input-group .form-input {
        flex: 1;
      }
      #mod-fase2-2 .btn-gen {
        white-space: nowrap;
        padding: 0.625rem 1rem;
        background: #334155;
        border: 1px solid #475569;
        border-radius: 8px;
        color: #e2e8f0;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }
      #mod-fase2-2 .btn-gen:hover {
        background: #475569;
        border-color: #64748b;
      }
      #mod-fase2-2 .precio-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }
      @media (max-width: 640px) {
        #mod-fase2-2 .precio-grid { grid-template-columns: 1fr; }
      }
      #mod-fase2-2 .precio-item {
        position: relative;
      }
      #mod-fase2-2 .precio-item .moneda-badge {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.75rem;
        font-weight: 700;
        color: #64748b;
        background: #0f172a;
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        border: 1px solid #334155;
      }
      #mod-fase2-2 .stock-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }
      @media (max-width: 640px) {
        #mod-fase2-2 .stock-grid { grid-template-columns: 1fr; }
      }
      #mod-fase2-2 .error-msg {
        color: #ef4444;
        font-size: 0.75rem;
        margin-top: 0.25rem;
        display: none;
        align-items: center;
        gap: 0.25rem;
      }
      #mod-fase2-2 .error-msg.show {
        display: flex;
      }
      #mod-fase2-2 .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1.25rem 1.5rem;
        border-top: 1px solid #334155;
        position: sticky;
        bottom: 0;
        background: #1e293b;
        border-radius: 0 0 16px 16px;
        z-index: 10;
      }
      #mod-fase2-2 .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      #mod-fase2-2 .btn-secondary {
        background: #334155;
        color: #e2e8f0;
        border: 1px solid #475569;
      }
      #mod-fase2-2 .btn-secondary:hover {
        background: #475569;
      }
      #mod-fase2-2 .btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #fff;
        box-shadow: 0 4px 14px rgba(59,130,246,0.3);
      }
      #mod-fase2-2 .btn-primary:hover {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(59,130,246,0.4);
      }
      #mod-fase2-2 .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      #mod-fase2-2 .section-title {
        font-size: 0.875rem;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 1.5rem 0 0.75rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #334155;
        grid-column: 1 / -1;
      }
      #mod-fase2-2 .section-title:first-of-type {
        margin-top: 0;
      }
      #mod-fase2-2 .empty-select {
        color: #64748b;
      }
      #mod-fase2-2 .tag-nuevo {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background: rgba(16,185,129,0.15);
        color: #10b981;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        border: 1px solid rgba(16,185,129,0.3);
      }
    `,

    html: `
      <div id="mod-fase2-2">
        <div class="modal-overlay" id="f22_modal">
          <div class="modal-card" id="f22_card">
            <div class="modal-header">
              <div class="modal-title">
                <div class="icon">📦</div>
                <span>Agregar Material <span class="tag-nuevo">NUEVO</span></span>
              </div>
              <button class="btn-close" onclick="f22_closeModal()">&times;</button>
            </div>
            <form id="f22_form" onsubmit="f22_guardar(event)">
              <div class="modal-body">
                <div class="form-grid">
                  <div class="section-title">Informacion Basica</div>
                  <div class="form-group full">
                    <label class="form-label">Codigo <span class="required">*</span></label>
                    <div class="input-group">
                      <input type="text" class="form-input" id="f22_codigo" placeholder="MAT-0001" maxlength="20" required>
                      <button type="button" class="btn-gen" onclick="f22_generarCodigo()">
                        <span>🎲</span> Generar
                      </button>
                    </div>
                    <div class="form-hint">Codigo unico de identificacion del material</div>
                    <div class="error-msg" id="f22_err_codigo">⚠️ Codigo ya existe o es invalido</div>
                  </div>
                  <div class="form-group full">
                    <label class="form-label">Nombre <span class="required">*</span></label>
                    <input type="text" class="form-input" id="f22_nombre" placeholder="Ej: Acero Inoxidable 304" maxlength="100" required>
                    <div class="error-msg" id="f22_err_nombre">⚠️ Nombre es obligatorio</div>
                  </div>
                  <div class="form-group full">
                    <label class="form-label">Descripcion</label>
                    <textarea class="form-textarea" id="f22_descripcion" placeholder="Descripcion detallada del material..."></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Categoria <span class="required">*</span></label>
                    <select class="form-select" id="f22_categoria" required>
                      <option value="" class="empty-select">-- Seleccionar categoria --</option>
                    </select>
                    <div class="error-msg" id="f22_err_categoria">⚠️ Selecciona una categoria</div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Unidad de Medida <span class="required">*</span></label>
                    <select class="form-select" id="f22_unidad" required>
                      <option value="" class="empty-select">-- Seleccionar unidad --</option>
                    </select>
                    <div class="error-msg" id="f22_err_unidad">⚠️ Selecciona una unidad</div>
                  </div>
                  <div class="section-title">Precios</div>
                  <div class="form-group full">
                    <div class="precio-grid">
                      <div class="precio-item">
                        <label class="form-label">Precio VES</label>
                        <input type="number" class="form-input" id="f22_precio_ves" placeholder="0.00" min="0" step="0.01">
                        <span class="moneda-badge">VES</span>
                      </div>
                      <div class="precio-item">
                        <label class="form-label">Precio USD</label>
                        <input type="number" class="form-input" id="f22_precio_usd" placeholder="0.00" min="0" step="0.01">
                        <span class="moneda-badge">USD</span>
                      </div>
                      <div class="precio-item">
                        <label class="form-label">Precio EUR</label>
                        <input type="number" class="form-input" id="f22_precio_eur" placeholder="0.00" min="0" step="0.01">
                        <span class="moneda-badge">EUR</span>
                      </div>
                    </div>
                  </div>
                  <div class="section-title">Stock</div>
                  <div class="form-group full">
                    <div class="stock-grid">
                      <div>
                        <label class="form-label">Stock Inicial <span class="required">*</span></label>
                        <input type="number" class="form-input" id="f22_stock" placeholder="0" min="0" step="0.01" required>
                        <div class="error-msg" id="f22_err_stock">⚠️ Stock inicial requerido</div>
                      </div>
                      <div>
                        <label class="form-label">Stock Minimo <span class="required">*</span></label>
                        <input type="number" class="form-input" id="f22_stock_min" placeholder="0" min="0" step="0.01" required>
                        <div class="error-msg" id="f22_err_stockmin">⚠️ Stock minimo requerido</div>
                      </div>
                      <div>
                        <label class="form-label">Ubicacion Almacen</label>
                        <input type="text" class="form-input" id="f22_ubicacion" placeholder="Ej: A-12-3" maxlength="50">
                      </div>
                    </div>
                  </div>
                  <div class="form-group full">
                    <label class="form-label">Proveedor Principal</label>
                    <select class="form-select" id="f22_proveedor">
                      <option value="" class="empty-select">-- Sin proveedor asignado --</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="f22_closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" id="f22_btn_guardar">
                  <span>💾</span> Guardar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `,

    init: function(erp) {
      window.f22_erp = erp;

      // Categorias demo para industria quimica/limpieza
      window.f22_categoriasDemo = [
        {id:"CAT-SURF", nombre:"Surfactantes", descripcion:"Agentes tensoactivos para detergentes"},
        {id:"CAT-AMID", nombre:"Amidas", descripcion:"Amidas y derivados para espuma y viscosidad"},
        {id:"CAT-ALCA", nombre:"Alcalinizantes", descripcion:"Compuestos alcalinos para ajuste de pH"},
        {id:"CAT-FRAG", nombre:"Fragancias", descripcion:"Esencias y perfumes para productos"},
        {id:"CAT-COLO", nombre:"Colorantes", descripcion:"Pigmentos y colorantes para productos"},
        {id:"CAT-CONS", nombre:"Conservantes", descripcion:"Agentes conservantes y biocidas"},
        {id:"CAT-ESP", nombre:"Espesantes", descripcion:"Agentes espesantes y viscosificantes"},
        {id:"CAT-SECA", nombre:"Secuestrantes", descripcion:"Agentes quelantes y secuestrantes"},
        {id:"CAT-ACID", nombre:"Acidos", descripcion:"Acidos organicos e inorganicos"},
        {id:"CAT-SOLV", nombre:"Solventes", descripcion:"Solventes organicos y miscelaneos"},
        {id:"CAT-ENV", nombre:"Envases", descripcion:"Botellas, tapas, etiquetas, empaques"},
        {id:"CAT-INSU", nombre:"Insumos", descripcion:"Insumos varios para produccion"},
        {id:"CAT-MP", nombre:"Materia Prima General", descripcion:"Materias primas diversas"}
      ];

      // Unidades demo
      window.f22_unidadesDemo = [
        {id:"UNI-KG", nombre:"Kilogramo", simbolo:"kg"},
        {id:"UNI-LT", nombre:"Litro", simbolo:"L"},
        {id:"UNI-GL", nombre:"Galon", simbolo:"gal"},
        {id:"UNI-UN", nombre:"Unidad", simbolo:"und"},
        {id:"UNI-CAJ", nombre:"Caja", simbolo:"caj"},
        {id:"UNI-BOL", nombre:"Bolsa", simbolo:"bol"},
        {id:"UNI-DR", nombre:"Drum", simbolo:"drum"},
        {id:"UNI-TN", nombre:"Tonelada", simbolo:"tn"}
      ];

      window.f22_ensureCategorias = function() {
        var db = erp.getDB();
        if (!db.categorias) db.categorias = [];
        if (db.categorias.length === 0) {
          for (var i = 0; i < window.f22_categoriasDemo.length; i++) {
            db.categorias.push(window.f22_categoriasDemo[i]);
          }
          erp.saveLocal(db);
          erp.showToast("info", "Categorias", "13 categorias de industria quimica cargadas");
        }
      };

      window.f22_ensureUnidades = function() {
        var db = erp.getDB();
        if (!db.unidades) db.unidades = [];
        if (db.unidades.length === 0) {
          for (var i = 0; i < window.f22_unidadesDemo.length; i++) {
            db.unidades.push(window.f22_unidadesDemo[i]);
          }
          erp.saveLocal(db);
          erp.showToast("info", "Unidades", "8 unidades de medida cargadas");
        }
      };

      window.f22_generarCodigo = function() {
        var db = erp.getDB();
        var mats = db.materiasPrimas || [];
        var max = 0;
        for (var i = 0; i < mats.length; i++) {
          var m = mats[i];
          var mt = m.codigo && m.codigo.match(/MAT-(\d+)/);
          if (mt) {
            var n = parseInt(mt[1], 10);
            if (n > max) max = n;
          }
        }
        var cod = "MAT-" + String(max + 1).padStart(4, "0");
        document.getElementById("f22_codigo").value = cod;
        document.getElementById("f22_codigo").classList.remove("error");
        document.getElementById("f22_err_codigo").classList.remove("show");
      };

      window.f22_cargarSelects = function() {
        var db = erp.getDB();
        var sc = document.getElementById("f22_categoria");
        var su = document.getElementById("f22_unidad");
        var sp = document.getElementById("f22_proveedor");
        var htmlCat = '<option value="" class="empty-select">-- Seleccionar categoria --</option>';
        var htmlUni = '<option value="" class="empty-select">-- Seleccionar unidad --</option>';
        var htmlProv = '<option value="" class="empty-select">-- Sin proveedor asignado --</option>';

        var cs = db.categorias || [];
        for (var i = 0; i < cs.length; i++) {
          htmlCat += '<option value="' + cs[i].id + '">' + cs[i].nombre + '</option>';
        }

        var us = db.unidades || [];
        for (var i = 0; i < us.length; i++) {
          htmlUni += '<option value="' + us[i].id + '">' + us[i].nombre + ' (' + us[i].simbolo + ')</option>';
        }

        var ps = db.proveedores || [];
        for (var i = 0; i < ps.length; i++) {
          htmlProv += '<option value="' + ps[i].id + '">' + ps[i].nombre + ' (' + (ps[i].rif || "S/RIF") + ')</option>';
        }

        if (sc) sc.innerHTML = htmlCat;
        if (su) su.innerHTML = htmlUni;
        if (sp) sp.innerHTML = htmlProv;
      };

      window.f22_validar = function() {
        var v = true;
        var db = erp.getDB();
        var mats = db.materiasPrimas || [];
        var cod = document.getElementById("f22_codigo").value.trim().toUpperCase();
        var ex = false;
        for (var i = 0; i < mats.length; i++) {
          if (mats[i].codigo && mats[i].codigo.toUpperCase() === cod) { ex = true; break; }
        }
        if (!cod || ex) {
          document.getElementById("f22_codigo").classList.add("error");
          document.getElementById("f22_err_codigo").textContent = ex ? "⚠️ Codigo ya existe" : "⚠️ Codigo es obligatorio";
          document.getElementById("f22_err_codigo").classList.add("show");
          v = false;
        } else {
          document.getElementById("f22_codigo").classList.remove("error");
          document.getElementById("f22_err_codigo").classList.remove("show");
        }
        if (!document.getElementById("f22_nombre").value.trim()) {
          document.getElementById("f22_nombre").classList.add("error");
          document.getElementById("f22_err_nombre").classList.add("show");
          v = false;
        } else {
          document.getElementById("f22_nombre").classList.remove("error");
          document.getElementById("f22_err_nombre").classList.remove("show");
        }
        if (!document.getElementById("f22_categoria").value) {
          document.getElementById("f22_categoria").classList.add("error");
          document.getElementById("f22_err_categoria").classList.add("show");
          v = false;
        } else {
          document.getElementById("f22_categoria").classList.remove("error");
          document.getElementById("f22_err_categoria").classList.remove("show");
        }
        if (!document.getElementById("f22_unidad").value) {
          document.getElementById("f22_unidad").classList.add("error");
          document.getElementById("f22_err_unidad").classList.add("show");
          v = false;
        } else {
          document.getElementById("f22_unidad").classList.remove("error");
          document.getElementById("f22_err_unidad").classList.remove("show");
        }
        var s = parseFloat(document.getElementById("f22_stock").value);
        if (isNaN(s) || s < 0) {
          document.getElementById("f22_stock").classList.add("error");
          document.getElementById("f22_err_stock").classList.add("show");
          v = false;
        } else {
          document.getElementById("f22_stock").classList.remove("error");
          document.getElementById("f22_err_stock").classList.remove("show");
        }
        var m = parseFloat(document.getElementById("f22_stock_min").value);
        if (isNaN(m) || m < 0) {
          document.getElementById("f22_stock_min").classList.add("error");
          document.getElementById("f22_err_stockmin").classList.add("show");
          v = false;
        } else {
          document.getElementById("f22_stock_min").classList.remove("error");
          document.getElementById("f22_err_stockmin").classList.remove("show");
        }
        return v;
      };

      window.f22_guardar = function(e) {
        e.preventDefault();
        if (!f22_validar()) return;
        document.getElementById("f22_btn_guardar").disabled = true;
        erp.showLoading(true);
        setTimeout(function() {
          try {
            var db = erp.getDB();
            if (!db.materiasPrimas) db.materiasPrimas = [];
            var mat = {
              id: erp.genId("MAT"),
              codigo: document.getElementById("f22_codigo").value.trim().toUpperCase(),
              nombre: document.getElementById("f22_nombre").value.trim(),
              descripcion: document.getElementById("f22_descripcion").value.trim(),
              categoriaId: document.getElementById("f22_categoria").value,
              unidadId: document.getElementById("f22_unidad").value,
              precioVES: parseFloat(document.getElementById("f22_precio_ves").value) || 0,
              precioUSD: parseFloat(document.getElementById("f22_precio_usd").value) || 0,
              precioEUR: parseFloat(document.getElementById("f22_precio_eur").value) || 0,
              stock: parseFloat(document.getElementById("f22_stock").value) || 0,
              stockMinimo: parseFloat(document.getElementById("f22_stock_min").value) || 0,
              ubicacion: document.getElementById("f22_ubicacion").value.trim(),
              proveedorId: document.getElementById("f22_proveedor").value || null,
              fechaCreacion: new Date().toISOString(),
              ultimaModificacion: new Date().toISOString(),
              activo: true
            };
            db.materiasPrimas.push(mat);
            db.ultimaModificacion = new Date().toISOString();
            erp.saveLocal(db);
            erp.showToast("success", "Material Guardado", mat.nombre + " (" + mat.codigo + ") agregado correctamente.");
            if (typeof window.f21_render !== "undefined") window.f21_render();
            f22_closeModal();
          } catch (err) {
            console.error("[" + PLUGIN_ID + "] Error:", err);
            erp.showToast("error", "Error", "No se pudo guardar el material: " + err.message);
          } finally {
            erp.showLoading(false);
            document.getElementById("f22_btn_guardar").disabled = false;
          }
        }, 300);
      };

      window.f22_openModal = function() {
        f22_ensureCategorias();
        f22_ensureUnidades();
        f22_cargarSelects();
        document.getElementById("f22_form").reset();
        document.querySelectorAll("#mod-fase2-2 .error-msg").forEach(function(el) { el.classList.remove("show"); });
        document.querySelectorAll("#mod-fase2-2 .form-input, #mod-fase2-2 .form-select").forEach(function(el) { el.classList.remove("error"); });
        document.getElementById("f22_btn_guardar").disabled = false;
        document.getElementById("f22_modal").style.display = "flex";
        document.body.style.overflow = "hidden";
        document.getElementById("f22_codigo").focus();
      };

      window.f22_closeModal = function() {
        document.getElementById("f22_modal").style.display = "none";
        document.body.style.overflow = "";
      };

      console.log("FASE2_2 inicializado: Formulario Agregar Material");
    },

    onShow: function(erp) {
      if (window.f22_openModal) window.f22_openModal();
    }
  };

  if (typeof erp !== "undefined" && erp.registerPlugin) {
    erp.registerPlugin(plugin);
  } else {
    console.error("ERP no disponible para " + PLUGIN_ID);
  }
})();
