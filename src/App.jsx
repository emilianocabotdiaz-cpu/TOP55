import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

function Badge({ children, tone = "gray" }) {
  const styles = {
    gray: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

function StatCard({ title, value }) {
  return (
    <Card className="p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-3 text-2xl font-bold text-slate-950">{value}</div>
    </Card>
  );
}

function LogoutButton({ onLogout }) {
  return (
    <button onClick={onLogout} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium">
      Salir
    </button>
  );
}

function ActionButton({ children, onClick, tone = "default" }) {
  const classes = {
    default: "border border-slate-200 text-slate-700",
    danger: "border border-rose-200 text-rose-700 bg-rose-50",
    dark: "bg-slate-950 text-white",
  };
  return (
    <button onClick={onClick} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${classes[tone]}`}>
      {children}
    </button>
  );
}

function LoginScreen({ onLogin, responsables, interactores }) {
  const [rol, setRol] = useState("cooperativa");
  const [usuario, setUsuario] = useState("admin");
  const [password, setPassword] = useState("");

  const entrar = () => {
    if (rol === "cooperativa") {
      if (password === "17052026") onLogin({ rol, usuario: "admin" });
      else alert("Contraseña incorrecta");
      return;
    }

    if (rol === "responsable") {
      const user = responsables.find((r) => r.usuario === usuario && r.password === password);
      if (user) onLogin({ rol, usuario });
      else alert("Credenciales incorrectas");
      return;
    }

    if (rol === "interactor") {
      const user = interactores.find((i) => i.usuario === usuario && i.password === password && i.activo);
      if (user) onLogin({ rol, usuario });
      else alert("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-8 md:px-8">
      <div className="mx-auto max-w-xl">
        <Card>
          <h1 className="text-3xl font-bold text-slate-950">Acceso a la aplicación</h1>
          <p className="mt-2 text-slate-600">Selecciona el perfil para entrar.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Perfil</label>
              <select
                value={rol}
                onChange={(e) => {
                  const nuevoRol = e.target.value;
                  setRol(nuevoRol);
                  setPassword("");
                  if (nuevoRol === "responsable") setUsuario(responsables[0]?.usuario || "");
                  else if (nuevoRol === "interactor") setUsuario(interactores[0]?.usuario || "");
                  else setUsuario("admin");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none"
              >
                <option value="cooperativa">Panel de control</option>
                <option value="interactor">Interactor</option>
                <option value="responsable">Responsable</option>
              </select>
            </div>

            {rol === "responsable" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Responsable</label>
                <select
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none"
                >
                  {responsables.map((r) => (
                    <option key={r.id} value={r.usuario}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {rol === "interactor" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Interactor</label>
                <select
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none"
                >
                  {interactores
                    .filter((i) => i.activo)
                    .map((i) => (
                      <option key={i.id} value={i.usuario}>
                        {i.nombre}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
            </div>

            <button onClick={entrar} className="h-12 w-full rounded-xl bg-slate-950 text-white font-semibold">
              Entrar
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function InteractorScreen({ onLogout, vots, setVots, usuario, interactores }) {
  const [referencia, setReferencia] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("gray");

  const registrar = async () => {
    const ref = referencia.trim().toUpperCase();
    if (!ref) return;

    const existe = vots.find((o) => o.referencia === ref);
    if (!existe) {
      setMensaje("Referencia no encontrada");
      setTipoMensaje("red");
      return;
    }

    if (existe.registrada) {
      setMensaje("Ya registrada");
      setTipoMensaje("amber");
      return;
    }

    const hora = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (existe.id) {
      await updateDoc(doc(db, "vots", existe.id), { registrada: true, hora });
    }

    setVots((prev) =>
      prev.map((o) => (o.referencia === ref ? { ...o, registrada: true, hora } : o))
    );
    setReferencia("");
    setMensaje("Registrada correctamente");
    setTipoMensaje("green");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-6 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">Pantalla interactor</h1>
              <p className="mt-2 text-slate-600">Solo puede registrar referencias.</p>
              <p className="mt-1 text-sm text-slate-500">
                Interactor activo: {interactores.find((i) => i.usuario === usuario)?.nombre || usuario}
              </p>
            </div>
            <LogoutButton onLogout={onLogout} />
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-slate-950">Registro de entrada</h2>
          <div className="mt-6 space-y-4">
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && registrar()}
              placeholder="REFERENCIA"
              className="h-28 w-full rounded-2xl border border-slate-200 px-6 text-center text-5xl font-bold tracking-wide outline-none"
            />
            <button onClick={registrar} className="h-24 w-full rounded-2xl bg-slate-950 text-3xl font-bold text-white">
              REGISTRAR
            </button>
          </div>
          <div className="mt-5 flex justify-center">
            <Badge tone={tipoMensaje}>{mensaje || "Esperando referencia"}</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ResponsableScreen({ onLogout, usuario, vots, responsables }) {
  const responsable = responsables.find((r) => r.usuario === usuario);
  const votsResp = vots.filter((o) => o.responsableId === responsable?.id);
  const llegadas = votsResp.filter((o) => o.registrada).length;
  const pendientes = votsResp.length - llegadas;

  const abrirWhatsApp = (telefono, nombre) => {
    if (!telefono) {
      alert("Este registro no tiene teléfono");
      return;
    }

    let numero = String(telefono).replace(/\D/g, "");
    if (numero.length === 9) {
      numero = `34${numero}`;
    }

    const mensaje = encodeURIComponent(
      `Hola, contacto sobre el registro de ${nombre || "este VOT"}`
    );

    const url = `https://wa.me/${numero}?text=${mensaje}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">Pantalla responsable</h1>
              <p className="mt-2 text-slate-600">Solo ve sus VOTs.</p>
            </div>
            <LogoutButton onLogout={onLogout} />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Responsable" value={responsable?.nombre || "-"} />
          <StatCard title="Llegadas" value={llegadas} />
          <StatCard title="Pendientes" value={pendientes} />
        </div>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">Estado de sus VOTs</h2>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left">Referencia</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-left">Hora</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {votsResp.map((o) => (
                  <tr key={o.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-semibold">{o.referencia}</td>
                    <td className="px-4 py-3">{o.nombre}</td>
                    <td className="px-4 py-3">{o.telefono}</td>
                    <td className="px-4 py-3">{o.hora || "-"}</td>
                    <td className="px-4 py-3">
                      {o.registrada ? <Badge tone="green">Ha entrado</Badge> : <Badge tone="amber">Falta</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => abrirWhatsApp(o.telefono, o.nombre)}
                        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CooperativaScreen({
  onLogout,
  vots,
  setVots,
  responsables,
  setResponsables,
  interactores,
  setInteractores,
}) {
  const [nuevaReferencia, setNuevaReferencia] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoResponsableId, setNuevoResponsableId] = useState(responsables[0]?.id || "");
  const [mensajeImportacion, setMensajeImportacion] = useState("");

  const [nombreResponsable, setNombreResponsable] = useState("");
  const [telefonoResponsable, setTelefonoResponsable] = useState("");
  const [passwordResponsable, setPasswordResponsable] = useState("");

  const [nombreInteractor, setNombreInteractor] = useState("");
  const [telefonoInteractor, setTelefonoInteractor] = useState("");
  const [passwordInteractor, setPasswordInteractor] = useState("");

  const [votEditando, setVotEditando] = useState(null);
  const [responsableEditando, setResponsableEditando] = useState(null);
  const [interactorEditando, setInteractorEditando] = useState(null);

  const total = vots.length;
  const llegadas = vots.filter((o) => o.registrada).length;
  const pendientes = total - llegadas;

  const exportarVots = () => {
    const datos = vots.map((v) => {
      const responsable = responsables.find((r) => r.id === v.responsableId);
      return {
        referencia: v.referencia,
        nombre: v.nombre,
        telefono: v.telefono,
        responsable: responsable?.nombre || "",
        usuario_responsable: responsable?.usuario || "",
        hora: v.hora || "",
        registrada: v.registrada ? "sí" : "no",
      };
    });

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VOTs");
    XLSX.writeFile(wb, "vots.xlsx");
  };

  const crearOActualizarVot = async () => {
    if (!nuevaReferencia || !nuevoResponsableId) return;
    const ref = nuevaReferencia.toUpperCase();

    if (votEditando) {
      const votActual = vots.find((v) => v.id === votEditando);

      if (votActual?.id) {
        await updateDoc(doc(db, "vots", votActual.id), {
          referencia: ref,
          nombre: nuevoNombre,
          telefono: nuevoTelefono,
          responsableId: Number(nuevoResponsableId),
        });
      }

      setVots((prev) =>
        prev.map((v) =>
          v.id === votEditando
            ? {
                ...v,
                referencia: ref,
                nombre: nuevoNombre,
                telefono: nuevoTelefono,
                responsableId: Number(nuevoResponsableId),
              }
            : v
        )
      );
      setVotEditando(null);
    } else {
      if (vots.some((o) => o.referencia === ref)) {
        alert("La referencia ya existe");
        return;
      }

      const nuevoVot = {
        referencia: ref,
        nombre: nuevoNombre,
        telefono: nuevoTelefono,
        responsableId: Number(nuevoResponsableId),
        hora: null,
        registrada: false,
      };

      const docRef = await addDoc(collection(db, "vots"), nuevoVot);
      setVots((prev) => [...prev, { id: docRef.id, ...nuevoVot }]);
    }

    setNuevaReferencia("");
    setNuevoNombre("");
    setNuevoTelefono("");
  };

  const editarVot = (v) => {
    setVotEditando(v.id);
    setNuevaReferencia(v.referencia);
    setNuevoNombre(v.nombre);
    setNuevoTelefono(v.telefono);
    setNuevoResponsableId(String(v.responsableId));
  };

  const eliminarVot = async (id) => {
    if (!window.confirm("¿Eliminar este VOT?")) return;
    await deleteDoc(doc(db, "vots", id));
    setVots((prev) => prev.filter((v) => v.id !== id));
  };

  const importarExcel = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const nombreHoja = workbook.SheetNames[0];
        const hoja = workbook.Sheets[nombreHoja];
        const filas = XLSX.utils.sheet_to_json(hoja);

        let importados = 0;
        let errores = 0;
        const existentes = new Set(vots.map((v) => v.referencia));
        const nuevos = [];

        for (const fila of filas) {
          const referencia = String(fila.referencia || "").trim().toUpperCase();
          const nombre = String(fila.nombre || "").trim();
          const telefono = String(fila.telefono || "").trim();
          const nombreResponsableExcel = String(fila.responsable || "").trim().toLowerCase();

          const responsable = responsables.find(
            (r) => r.nombre.trim().toLowerCase() === nombreResponsableExcel
          );

          if (!referencia || !responsable || existentes.has(referencia)) {
            errores += 1;
            continue;
          }

          const nuevo = {
            referencia,
            nombre,
            telefono,
            responsableId: responsable.id,
            hora: null,
            registrada: false,
          };

          const docRef = await addDoc(collection(db, "vots"), nuevo);
          nuevos.push({ id: docRef.id, ...nuevo });
          existentes.add(referencia);
          importados += 1;
        }

        if (nuevos.length) setVots((prev) => [...prev, ...nuevos]);
        setMensajeImportacion(`Importación completada. Correctos: ${importados}. Errores: ${errores}.`);
      } catch (error) {
        setMensajeImportacion("Error al leer el Excel.");
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const crearOActualizarResponsable = async () => {
    if (!nombreResponsable || !passwordResponsable) return;

    if (responsableEditando) {
      const actual = responsables.find((r) => r.id === responsableEditando);

      if (actual?.id) {
        await updateDoc(doc(db, "responsables", actual.id), {
          nombre: nombreResponsable,
          telefono: telefonoResponsable,
          password: passwordResponsable,
        });
      }

      setResponsables((prev) =>
        prev.map((r) =>
          r.id === responsableEditando
            ? {
                ...r,
                nombre: nombreResponsable,
                telefono: telefonoResponsable,
                password: passwordResponsable,
              }
            : r
        )
      );

      setResponsableEditando(null);
    } else {
      const usuario = nombreResponsable.toLowerCase().split(" ")[0];
      const nuevoResponsable = {
        nombre: nombreResponsable,
        telefono: telefonoResponsable,
        usuario,
        password: passwordResponsable,
      };

      const docRef = await addDoc(collection(db, "responsables"), nuevoResponsable);
      setResponsables((prev) => [...prev, { id: docRef.id, ...nuevoResponsable }]);
    }

    setNombreResponsable("");
    setTelefonoResponsable("");
    setPasswordResponsable("");
  };

  const editarResponsable = (r) => {
    setResponsableEditando(r.id);
    setNombreResponsable(r.nombre);
    setTelefonoResponsable(r.telefono);
    setPasswordResponsable(r.password);
  };

  const eliminarResponsable = async (id) => {
    if (vots.some((v) => v.responsableId === id)) {
      alert("No puedes eliminar un responsable con VOTs asignados.");
      return;
    }
    if (!window.confirm("¿Eliminar este responsable?")) return;

    await deleteDoc(doc(db, "responsables", id));
    setResponsables((prev) => prev.filter((r) => r.id !== id));
  };

  const crearOActualizarInteractor = async () => {
    if (!nombreInteractor || !passwordInteractor) return;

    if (interactorEditando) {
      const actual = interactores.find((i) => i.id === interactorEditando);

      if (actual?.id) {
        await updateDoc(doc(db, "interactores", actual.id), {
          nombre: nombreInteractor,
          telefono: telefonoInteractor,
          password: passwordInteractor,
        });
      }

      setInteractores((prev) =>
        prev.map((i) =>
          i.id === interactorEditando
            ? {
                ...i,
                nombre: nombreInteractor,
                telefono: telefonoInteractor,
                password: passwordInteractor,
              }
            : i
        )
      );

      setInteractorEditando(null);
    } else {
      const usuario = nombreInteractor.toLowerCase().split(" ")[0] + interactores.length;
      const nuevoInteractor = {
        nombre: nombreInteractor,
        telefono: telefonoInteractor,
        usuario,
        password: passwordInteractor,
        activo: true,
      };

      const docRef = await addDoc(collection(db, "interactores"), nuevoInteractor);
      setInteractores((prev) => [...prev, { id: docRef.id, ...nuevoInteractor }]);
    }

    setNombreInteractor("");
    setTelefonoInteractor("");
    setPasswordInteractor("");
  };

  const editarInteractor = (i) => {
    setInteractorEditando(i.id);
    setNombreInteractor(i.nombre);
    setTelefonoInteractor(i.telefono);
    setPasswordInteractor(i.password);
  };

  const eliminarInteractor = async (id) => {
    if (!window.confirm("¿Eliminar este interactor?")) return;
    await deleteDoc(doc(db, "interactores", id));
    setInteractores((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">Panel de control</h1>
              <p className="mt-2 text-slate-600">Gestión completa.</p>
            </div>
            <LogoutButton onLogout={onLogout} />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total VOTs" value={total} />
          <StatCard title="Llegadas" value={llegadas} />
          <StatCard title="Pendientes" value={pendientes} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <h2 className="text-lg font-bold text-slate-950">{votEditando ? "Editar VOT" : "Alta de VOT"}</h2>
            <div className="mt-4 space-y-3">
              <input
                value={nuevaReferencia}
                onChange={(e) => setNuevaReferencia(e.target.value.toUpperCase())}
                placeholder="Referencia"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <input
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Nombre"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <input
                value={nuevoTelefono}
                onChange={(e) => setNuevoTelefono(e.target.value)}
                placeholder="Teléfono"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <select
                value={nuevoResponsableId}
                onChange={(e) => setNuevoResponsableId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              >
                {responsables.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              <button onClick={crearOActualizarVot} className="h-11 w-full rounded-xl bg-slate-950 text-white font-semibold">
                {votEditando ? "Guardar cambios" : "Crear VOT"}
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-950">Importar / Exportar VOTs</h2>
            <p className="mt-2 text-sm text-slate-500">Columnas: referencia, nombre, telefono, responsable</p>
            <div className="mt-4 space-y-3">
              <input type="file" accept=".xlsx,.xls" onChange={importarExcel} className="block w-full text-sm text-slate-700" />
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Ejemplo responsable: Juan Pérez</div>
              <ActionButton tone="dark" onClick={exportarVots}>Exportar VOTs</ActionButton>
              {mensajeImportacion ? <Badge tone="gray">{mensajeImportacion}</Badge> : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-950">
              {responsableEditando ? "Editar responsable" : "Alta de responsable"}
            </h2>
            <div className="mt-4 space-y-3">
              <input
                value={nombreResponsable}
                onChange={(e) => setNombreResponsable(e.target.value)}
                placeholder="Nombre"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <input
                value={telefonoResponsable}
                onChange={(e) => setTelefonoResponsable(e.target.value)}
                placeholder="Teléfono"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <input
                type="password"
                value={passwordResponsable}
                onChange={(e) => setPasswordResponsable(e.target.value)}
                placeholder="Contraseña"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <button
                onClick={crearOActualizarResponsable}
                className="h-11 w-full rounded-xl bg-slate-950 text-white font-semibold"
              >
                {responsableEditando ? "Guardar cambios" : "Crear responsable"}
              </button>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-bold text-slate-950">
              {interactorEditando ? "Editar interactor" : "Alta de interactor"}
            </h2>
            <div className="mt-4 space-y-3">
              <input
                value={nombreInteractor}
                onChange={(e) => setNombreInteractor(e.target.value)}
                placeholder="Nombre"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <input
                value={telefonoInteractor}
                onChange={(e) => setTelefonoInteractor(e.target.value)}
                placeholder="Teléfono"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <input
                type="password"
                value={passwordInteractor}
                onChange={(e) => setPasswordInteractor(e.target.value)}
                placeholder="Contraseña"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <button
                onClick={crearOActualizarInteractor}
                className="h-11 w-full rounded-xl bg-slate-950 text-white font-semibold"
              >
                {interactorEditando ? "Guardar cambios" : "Crear interactor"}
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-950">Listado de VOTs</h2>
            <div className="mt-4 overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Referencia</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Responsable</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vots.map((o) => {
                    const responsable = responsables.find((r) => r.id === o.responsableId);
                    return (
                      <tr key={o.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-semibold">{o.referencia}</td>
                        <td className="px-4 py-3">{o.nombre}</td>
                        <td className="px-4 py-3">{responsable?.nombre}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <ActionButton onClick={() => editarVot(o)}>Editar</ActionButton>
                            <ActionButton tone="danger" onClick={() => eliminarVot(o.id)}>Eliminar</ActionButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-bold text-slate-950">Listado de responsables</h2>
            <div className="mt-4 overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {responsables.map((r) => (
                    <tr key={r.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-semibold">{r.nombre}</td>
                      <td className="px-4 py-3">{r.telefono}</td>
                      <td className="px-4 py-3">{r.usuario}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <ActionButton onClick={() => editarResponsable(r)}>Editar</ActionButton>
                          <ActionButton tone="danger" onClick={() => eliminarResponsable(r.id)}>Eliminar</ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-950">Listado de interactores</h2>
            <div className="mt-4 overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {interactores.map((i) => (
                    <tr key={i.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-semibold">{i.nombre}</td>
                      <td className="px-4 py-3">{i.telefono}</td>
                      <td className="px-4 py-3">{i.usuario}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <ActionButton onClick={() => editarInteractor(i)}>Editar</ActionButton>
                          <ActionButton tone="danger" onClick={() => eliminarInteractor(i.id)}>Eliminar</ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [vots, setVots] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [interactores, setInteractores] = useState([]);
  const [cargadoNube, setCargadoNube] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [snapVots, snapResponsables, snapInteractores] = await Promise.all([
          getDocs(collection(db, "vots")),
          getDocs(collection(db, "responsables")),
          getDocs(collection(db, "interactores")),
        ]);

        const datosVots = snapVots.docs.map((d) => ({ id: d.id, ...d.data() }));
        const datosResponsables = snapResponsables.docs.map((d) => ({ id: d.id, ...d.data() }));
        const datosInteractores = snapInteractores.docs.map((d) => ({ id: d.id, ...d.data() }));

        setVots(datosVots);
        setResponsables(datosResponsables);
        setInteractores(datosInteractores);
      } catch (error) {
        console.error("Error cargando datos desde Firebase", error);
      } finally {
        setCargadoNube(true);
      }
    };

    cargarDatos();
  }, []);

  if (!cargadoNube) {
    return <div className="min-h-screen bg-slate-100 p-8 text-slate-700">Cargando datos...</div>;
  }

  if (!sesion) {
    return <LoginScreen onLogin={setSesion} responsables={responsables} interactores={interactores} />;
  }

  if (sesion.rol === "interactor") {
    return (
      <InteractorScreen
        onLogout={() => setSesion(null)}
        vots={vots}
        setVots={setVots}
        usuario={sesion.usuario}
        interactores={interactores}
      />
    );
  }

  if (sesion.rol === "responsable") {
    return (
      <ResponsableScreen
        onLogout={() => setSesion(null)}
        usuario={sesion.usuario}
        vots={vots}
        responsables={responsables}
      />
    );
  }

  return (
    <CooperativaScreen
      onLogout={() => setSesion(null)}
      vots={vots}
      setVots={setVots}
      responsables={responsables}
      setResponsables={setResponsables}
      interactores={interactores}
      setInteractores={setInteractores}
    />
  );
}
