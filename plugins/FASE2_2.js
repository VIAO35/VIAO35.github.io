// FASE 2.2 - FORMULARIO AGREGAR MATERIAL v3.0.3
// ERP Core v3.0 - Plugin JS

(function(){
"use strict";

var PID="FASE2_2",PVER="3.0.3",PNAME="Formulario Agregar Material";
var PARENT="fase2",_erp=null,ready=false;

function $(id){return document.getElementById(id);}

// ── GENERAR CODIGO ──
function genCodigo(){
  var db=_erp.getDB(),m=db.materiasPrimas||[],mx=0;
  for(var i=0;i<m.length;i++){
    var x=m[i].codigo||"",mt=x.match(/MP(\d+)/);
    if(mt){var n=parseInt(mt[1],10);if(n>mx)mx=n;}
  }
  return "MP"+String(mx+1).padStart(3,"0");
}

function codigoUnico(cod,excluir){
  var db=_erp.getDB(),m=db.materiasPrimas||[];
  for(var i=0;i<m.length;i++){
    if(m[i].id!==excluir&&(m[i].codigo===cod||m[i].id===cod))return false;
  }
  return true;
}

function validar(){
  var e=[],c=$("f22_cod"),n=$("f22_nom"),s=$("f22_stk"),sm=$("f22_min"),co=$("f22_cost"),ca=$("f22_cat"),u=$("f22_uni");
  if(!c||!c.value.trim())e.push("Codigo obligatorio");
  if(!n||!n.value.trim())e.push("Nombre obligatorio");
  if(n&&n.value.trim().length<2)e.push("Nombre min 2 caracteres");
  if(!s||isNaN(parseFloat(s.value))||parseFloat(s.value)<0)e.push("Stock inicial >= 0");
  if(!sm||isNaN(parseFloat(sm.value))||parseFloat(sm.value)<0)e.push("Stock minimo >= 0");
  if(!co||isNaN(parseFloat(co.value))||parseFloat(co.value)<0)e.push("Costo >= 0");
  if(!ca||!ca.value)e.push("Seleccione categoria");
  if(!u||!u.value)e.push("Seleccione unidad");
  return e;
}

function mostrarErr(e){
  var d=$("f22_err");if(!d)return;
  if(!e.length){d.style.display="none";d.innerHTML="";return;}
  var h='<div style="background:rgba(239,68,68,.15);border:1px solid #ef4444;border-radius:8px;padding:12px;margin-bottom:16px">'+
    '<div style="color:#ef4444;font-weight:600;font-size:13px"><i class="fas fa-exclamation-circle"></i> Corrija:</div><ul style="margin:4px 0 0 18px;color:#fca5a5;font-size:12px">';
  for(var i=0;i<e.length;i++)h+="<li>"+e[i]+"</li>";
  h+="</ul></div>";d.innerHTML=h;d.style.display="block";
}

function limpiarErr(){
  var d=$("f22_err");if(d){d.style.display="none";d.innerHTML="";}
  var ids=["f22_cod","f22_nom","f22_stk","f22_min","f22_cost","f22_cat","f22_uni"];
  for(var i=0;i<ids.length;i++){var el=$(ids[i]);if(el)el.style.borderColor="#334155";}
}

function cargarSelects(){
  var db=_erp.getDB(),cats=db.categorias||[],uns=db.unidades||[];
  var ca=$("f22_cat"),un=$("f22_uni");
  if(ca){var h='<option value="">-- Seleccione --</option>';for(var i=0;i<cats.length;i++)h+='<option value="'+cats[i].nombre+'">'+cats[i].nombre+'</option>';ca.innerHTML=h;}
  if(un){var h='<option value="">-- Seleccione --</option>';for(var i=0;i<uns.length;i++)h+='<option value="'+uns[i].nombre+'">'+uns[i].nombre+' ('+uns[i].simbolo+')</option>';un.innerHTML=h;}
}

// ── MODAL ──
function openModal(){
  console.log("[FASE2_2] openModal");
  limpiarErr();injectModal();
  var m=$("f22_modal");if(!m){console.error("[FASE2_2] Modal no existe");return;}
  var c=$("f22_cod"),n=$("f22_nom"),s=$("f22_stk"),sm=$("f22_min"),co=$("f22_cost"),mo=$("f22_mon"),ca=$("f22_cat"),u=$("f22_uni"),de=$("f22_desc");
  if(c)c.value=genCodigo();if(n)n.value="";if(s)s.value="0";if(sm)sm.value="0";if(co)co.value="0";if(mo)mo.value="VES";if(ca)ca.value="";if(u)u.value="";if(de)de.value="";
  cargarSelects();
  m.style.display="flex";m.style.opacity="0";
  setTimeout(function(){m.style.opacity="1";m.style.transition="opacity .2s";},10);
  setTimeout(function(){var el=$("f22_nom");if(el)el.focus();},100);
}

function closeModal(){
  var m=$("f22_modal");if(!m)return;
  m.style.opacity="0";
  setTimeout(function(){m.style.display="none";},200);
  limpiarErr();
}

function guardar(){
  limpiarErr();
  var e=validar();if(e.length){mostrarErr(e);return;}
  var c=$("f22_cod"),n=$("f22_nom"),ca=$("f22_cat"),u=$("f22_uni"),s=$("f22_stk"),sm=$("f22_min"),co=$("f22_cost"),mo=$("f22_mon"),de=$("f22_desc");
  var cod=c?c.value.trim():"",nom=n?n.value.trim():"",cat=ca?ca.value:"",uni=u?u.value:"";
  var stk=parseFloat(s?s.value:0)||0,smin=parseFloat(sm?sm.value:0)||0,cost=parseFloat(co?co.value:0)||0,mon=mo?mo.value:"VES",des=de?de.value.trim():"";
  if(!codigoUnico(cod,null)){mostrarErr(["Codigo '"+cod+"' ya existe"]);if(c)c.style.borderColor="#ef4444";return;}
  var db=_erp.getDB();if(!db.materiasPrimas)db.materiasPrimas=[];
  db.materiasPrimas.push({id:_erp.genId("MP"),codigo:cod,nombre:nom,categoria:cat,unidad:uni,stock:stk,stockMin:smin,costoUnitario:cost,monedaCostoBase:mon,descripcion:des,fechaRegistro:new Date().toISOString(),activo:true});
  _erp.saveLocal(db);closeModal();
  _erp.showToast("success","Guardado","Material '"+nom+"' agregado");
  if(window.FASE2_1&&window.FASE2_1.refresh)window.FASE2_1.refresh();
}

function bindEvents(){
  var x=$("f22_x"),cn=$("f22_can"),sv=$("f22_save"),gn=$("f22_gen"),m=$("f22_modal");
  if(x)x.onclick=closeModal;if(cn)cn.onclick=closeModal;if(sv)sv.onclick=guardar;
  if(gn)gn.onclick=function(){var c=$("f22_cod");if(c)c.value=genCodigo();};
  if(m)m.onclick=function(e){if(e.target===m)closeModal();};
  var ids=["f22_cod","f22_nom","f22_cat","f22_uni","f22_stk","f22_min","f22_cost","f22_mon"];
  for(var i=0;i<ids.length;i++){(function(idx){
    var el=$(ids[idx]);if(!el)return;
    el.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();if(idx<ids.length-1){var n=$(ids[idx+1]);if(n)n.focus();}else guardar();}};
  })(i);}
}

var MODAL_INJECTED=false;
function injectModal(){
  if(MODAL_INJECTED||$("f22_modal")){MODAL_INJECTED=true;return;}
  var slot=$(PARENT+"-slot-modals");
  if(slot)slot.insertAdjacentHTML("beforeend",MODAL_HTML);else document.body.insertAdjacentHTML("beforeend",MODAL_HTML);
  bindEvents();MODAL_INJECTED=true;console.log("[FASE2_2] Modal inyectado");
}

// ── REEMPLAZAR BOTON (no modificar, reemplazar) ──
function activarBoton(){
  var oldBtn=$("fase2-btn-nuevo-mat");
  if(!oldBtn)return;
  // Si ya fue reemplazado, no hacer nada
  if(oldBtn.getAttribute("data-f22-hooked"))return;

  var parent=oldBtn.parentNode;
  if(!parent)return;

  // Crear boton nuevo clonado pero sin onclick inline
  var newBtn=document.createElement("button");
  newBtn.id="fase2-btn-nuevo-mat";
  newBtn.className=oldBtn.className;
  newBtn.innerHTML='<i class="fas fa-box"></i> Nuevo Material';
  newBtn.setAttribute("data-f22-hooked","1");
  newBtn.style.opacity="1";
  newBtn.style.cursor="pointer";
  newBtn.onclick=function(e){e.preventDefault();e.stopPropagation();openModal();return false;};

  parent.replaceChild(newBtn,oldBtn);
  console.log("[FASE2_2] Boton reemplazado y activado");
}

// ── CSS ──
var CSS='#f22_modal{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:2600;display:none;align-items:center;justify-content:center;padding:20px}'+
  '#f22_modal{opacity:0;transition:opacity .2s}'+
  '@keyframes f22in{from{opacity:0;transform:translateY(-20px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}'+
  '#f22_cod{font-family:monospace;font-weight:600;color:#3b82f6}'+
  '#f22_gen:hover{background:#3b82f6!important;color:#fff!important}'+
  '#f22_modal input:focus,#f22_modal select:focus,#f22_modal textarea:focus{outline:none;border-color:#3b82f6!important;box-shadow:0 0 0 2px rgba(59,130,246,.2)}';

var MODAL_HTML='<div id="f22_modal" style="display:none">'+
'<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;width:100%;max-width:650px;max-height:92vh;overflow-y:auto;animation:f22in .2s ease-out">'+
'<div style="padding:20px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between">'+
'<div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;border-radius:8px;background:rgba(59,130,246,.15);display:flex;align-items:center;justify-content:center;color:#3b82f6;font-size:16px"><i class="fas fa-plus-circle"></i></div>'+
'<div><div style="font-size:16px;font-weight:600;color:#f1f5f9">Agregar Nuevo Material</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">Complete todos los campos obligatorios (*)</div></div></div>'+
'<button id="f22_x" style="width:32px;height:32px;border-radius:6px;background:#334155;border:none;color:#f1f5f9;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center">&times;</button></div>'+
'<div style="padding:20px"><div id="f22_err" style="display:none"></div>'+
'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">'+
'<div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Codigo <span style="color:#ef4444">*</span></label><div style="display:flex;gap:8px"><input type="text" id="f22_cod" style="flex:1;padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px" readonly><button id="f22_gen" style="padding:10px 12px;white-space:nowrap;font-size:12px;background:#334155;color:#f1f5f9;border:1px solid #475569;border-radius:6px;cursor:pointer"><i class="fas fa-sync-alt"></i> Generar</button></div></div>'+
'<div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Nombre <span style="color:#ef4444">*</span></label><input type="text" id="f22_nom" placeholder="Nombre del material" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px"></div>'+
'<div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Categoria <span style="color:#ef4444">*</span></label><select id="f22_cat" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px"><option value="">-- Seleccione --</option></select></div>'+
'<div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Unidad <span style="color:#ef4444">*</span></label><select id="f22_uni" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px"><option value="">-- Seleccione --</option></select></div>'+
'<div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Stock Inicial</label><input type="number" id="f22_stk" value="0" min="0" step="0.01" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px"></div>'+
'<div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Stock Minimo</label><input type="number" id="f22_min" value="0" min="0" step="0.01" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px"></div>'+
'<div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Costo Unitario</label><input type="number" id="f22_cost" value="0" step="0.01" min="0" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px"></div>'+
'<div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Moneda Costo</label><select id="f22_mon" style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px"><option value="VES">VES (Bolivar)</option><option value="USD">USD (Dolar)</option><option value="EUR">EUR (Euro)</option></select></div>'+
'<div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1"><label style="font-size:12px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">Descripcion (opcional)</label><textarea id="f22_desc" rows="2" placeholder="Descripcion adicional..." style="padding:10px 12px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:13px;resize:vertical"></textarea></div>'+
'</div></div>'+
'<div style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:10px"><button id="f22_can" style="padding:8px 16px;border-radius:6px;border:none;font-size:13px;font-weight:500;cursor:pointer;background:#334155;color:#f1f5f9">Cancelar</button><button id="f22_save" style="padding:8px 16px;border-radius:6px;border:none;font-size:13px;font-weight:500;cursor:pointer;background:#3b82f6;color:#fff"><i class="fas fa-save"></i> Guardar Material</button></div>'+
'</div></div>';

// ── INIT ──
function init(){
  if(ready)return;ready=true;
  var s=document.createElement("style");s.id="erp-css-"+PID;s.textContent=CSS;document.head.appendChild(s);
  injectModal();
  activarBoton();
  console.log("[FASE2_2] Inicializado v"+PVER);
}

// ── API GLOBAL ──
window.FASE2_2={PLUGIN_ID:PID,PLUGIN_VERSION:PVER,PLUGIN_NAME:PNAME,parentModule:PARENT,openModal:openModal,closeModal:closeModal,refresh:function(){if(window.FASE2_1&&window.FASE2_1.refresh)window.FASE2_1.refresh();}};

// ── REGISTRO ──
var def={id:PID,nombre:PNAME,version:PVER,fasePrincipal:2,microFase:"2.2",autor:"VIAO35",descripcion:"Modal form para agregar materiales",schemaVersionRequerida:"3.0.0",dependencias:["FASE2_1"],menu:null,schema:{},css:CSS,html:"",init:function(erp){_erp=erp;setTimeout(init,300);},onShow:function(erp){_erp=erp;activarBoton();}};

if(typeof erp!=="undefined"&&erp.registerPlugin){erp.registerPlugin(def);}else{console.error("[FASE2_2] ERP no disponible");}
})();
