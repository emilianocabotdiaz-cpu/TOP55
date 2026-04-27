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
    <span
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
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
    <button
      onClick={onLogout}
      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium"
    >
      Salir
    </button>
  );
}

function ActionButton({ children, onClick, tone = "default" }) {
  const classes = {
    default: "border border-slate-200 text-slate-700",
    danger: "border border-rose-200 bg-rose-50 text-rose-700",
    dark: "bg-slate-950 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${classes[tone]}`}
    >
      {children}
    </button>
  );
}

function LoginScreen({ onLogin, responsables, mesas }) {
  const [rol, setRol] = useState("cooperativa");
  const [usuario, setUsuario] = useState("admin");
  const [password, setPassword] = useState("");

  const mesasActivas = mesas.filter((m) => m.activo);

  const entrar = () => {
    if (rol === "cooperativa") {
      if (password === "17052026") {
        onLogin({ rol, usuario: "admin" });
      } else {
        alert("Contraseña incorrecta");
      }
      return;
    }

    if (rol === "responsable") {
      const user = responsables.find(
        (r) => r.usuario === usuario && r.password === password
      );
      if (user) onLogin({ rol, usuario });
      else alert("Credenciales incorrectas");
      return;
    }

    if (rol === "mesa") {
      const user = mesas.find(
        (m) => m.usuario === usuario && m.password === password && m.activo
      );
      if (user) onLogin({ rol, usuario });
      else alert("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-8 md:px-8">
      <div className="mx-auto max-w-xl">
        <Card>
          <h1 className="text-3xl font-bold text-slate-950">
            Acceso a la aplicación
          </h1>
          <p className="mt-2 text-slate-600">
            Selecciona el perfil para entrar.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Perfil
              </label>
              <select
                value={rol}
                onChange={(e) => {
                  const nuevoRol = e.target.value;
                  setRol(nuevoRol);
                  setPassword("");

                  if (nuevoRol === "responsable") {
                    setUsuario(responsables[0]?.usuario || "");
                  } else if (nuevoRol === "mesa") {
                    setUsuario(mesasActivas[0]?.usuario || "");
                  } else {
                    setUsuario("admin");
                  }
                }}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none"
              >
                <option value="cooperativa">Panel de control</option>
                <option value="mesa">Mesa</option>
                <option value="responsable">Responsable</option>
              </select>
            </div>

            {rol === "responsable" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Responsable
                </label>
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

            {rol === "mesa" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mesa
                </label>
                <select
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none"
                >
                  {mesasActivas.map((m) => (
                    <option key={m.id} value={m.usuario}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
            </div>

            <button
              onClick={entrar}
              className="h-12 w-full rounded-xl bg-slate-950 font-semibold text-white"
            >
              Entrar
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MesaScreen({ onLogout, vots, setVots, usuario, mesas }) {
  const [numero, setNumero] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("gray");
  const [redIndex, setRedIndex] = useState(0);

  const redes = [
    {
      nombre: "InstaPost",
      fondo: "bg-slate-100",
      barra: "bg-white",
      acento: "text-pink-600",
      boton: "text-blue-600",
      usuario: "viajes_huelva",
      imagen: "bg-gradient-to-br from-pink-300 via-orange-200 to-yellow-200",
    },
    {
      nombre: "FaceWall",
      fondo: "bg-slate-100",
      barra: "bg-white",
      acento: "text-blue-700",
      boton: "text-blue-700",
      usuario: "noticias_locales",
      imagen: "bg-gradient-to-br from-blue-200 via-sky-300 to-slate-200",
    },
    {
      nombre: "TikTalk",
      fondo: "bg-zinc-950",
      barra: "bg-zinc-900",
      acento: "text-white",
      boton: "text-cyan-300",
      usuario: "trend_today",
      imagen: "bg-gradient-to-br from-zinc-800 via-slate-700 to-black",
    },
    {
      nombre: "SocialNow",
      fondo: "bg-stone-100",
      barra: "bg-white",
      acento: "text-stone-800",
      boton: "text-emerald-700",
      usuario: "eventos_del_dia",
      imagen: "bg-gradient-to-br from-emerald-200 via-stone-200 to-amber-100",
    },
  ];

  const red = redes[redIndex];

  useEffect(() => {
    const intervalo = setInterval(() => {
      setRedIndex((prev) => (prev + 1) % redes.length);
    }, 300000); // 5 minutos

    return () => clearInterval(intervalo);
  }, []);

  const mesaActiva = mesas.find((m) => m.usuario === usuario);
  const votsAsignados = vots.filter((o) => o.mesaId === mesaActiva?.id);

  const publicarComentario = async () => {
    const num = String(numero || "").trim();

    if (!num) {
      setMensaje("Escribe un comentario");
      setTipoMensaje("red");
      return;
    }

    const vot = votsAsignados.find(
      (o) => String(o.numero || "").trim() === num
    );

    if (!vot) {
      setMensaje("No se pudo publicar");
      setTipoMensaje("red");
      return;
    }

    if (vot.registrada) {
      setMensaje("Comentario duplicado");
      setTipoMensaje("amber");
      return;
    }

    const hora = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await updateDoc(doc(db, "vots", vot.id), {
      registrada: true,
      hora,
    });

    setVots((prev) =>
      prev.map((o) =>
        o.id === vot.id ? { ...o, registrada: true, hora } : o
      )
    );

    setNumero("");
    setMensaje("Comentario publicado");
    setTipoMensaje("green");
  };

  return (
    <div className={`min-h-screen ${red.fondo} px-4 py-5 transition-all duration-1000`}>
      <div className="mx-auto max-w-md overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-2xl">
        
        {/* Barra superior */}
        <div className={`flex items-center justify-between border-b border-slate-200 px-4 py-3 ${red.barra}`}>
          <div className={`text-2xl font-black tracking-tight ${red.acento}`}>
            {red.nombre}
          </div>

          <button
            onClick={onLogout}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
          >
            salir
          </button>
        </div>

        {/* Stories */}
        <div className="flex gap-3 overflow-hidden border-b border-slate-200 bg-white px-4 py-3">
          {["Mesa", "Local", "Directo", "Hoy", "Info"].map((s, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1">
              <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-pink-500 via-orange-400 to-yellow-300 p-[3px]">
                <div className="h-full w-full rounded-full border-2 border-white bg-slate-200"></div>
              </div>
              <span className="text-[10px] text-slate-500">{s}</span>
            </div>
          ))}
        </div>

        {/* Cabecera post */}
        <div className="flex items-center justify-between bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-300"></div>
            <div>
              <div className="text-sm font-bold text-slate-900">{red.usuario}</div>
              <div className="text-xs text-slate-500">
                {mesaActiva?.nombre || usuario} · ahora
              </div>
            </div>
          </div>
          <div className="text-xl text-slate-500">•••</div>
        </div>

        {/* Imagen simulada */}
        <div className={`relative h-[330px] ${red.imagen}`}>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute left-8 top-10 h-24 w-24 rounded-full bg-white/40"></div>
            <div className="absolute bottom-12 right-8 h-32 w-32 rounded-full bg-black/10"></div>
            <div className="absolute left-12 bottom-20 h-3 w-48 rounded-full bg-white/50"></div>
            <div className="absolute left-12 bottom-14 h-3 w-36 rounded-full bg-white/40"></div>
          </div>

          <div className="absolute bottom-5 left-5 rounded-2xl bg-black/30 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            Nueva publicación
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-2xl">
              <span>♡</span>
              <span>💬</span>
              <span>↗</span>
            </div>
            <span className="text-2xl">▱</span>
          </div>

          <div className="mt-2 text-sm font-semibold text-slate-900">
            Les gusta a varios usuarios
          </div>

          <div className="mt-1 text-sm text-slate-500">
            Ver todos los comentarios
          </div>

          <div className="mt-3 flex justify-center">
            <Badge tone={tipoMensaje}>
              {mensaje || "Añade un comentario..."}
            </Badge>
          </div>
        </div>

        {/* Campo fijo de comentario */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-300"></div>

            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && publicarComentario()}
              placeholder="Añade un comentario..."
              autoFocus
              className="h-11 flex-1 rounded-full bg-slate-100 px-4 text-lg font-semibold outline-none"
            />

            <button
              onClick={publicarComentario}
              className={`text-sm font-bold ${red.boton}`}
            >
              Publicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function ResponsableScreen({ onLogout, usuario, vots, responsables, mesas }) {
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
              <h1 className="text-3xl font-bold text-slate-950">
                Pantalla responsable
              </h1>
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
                  <th className="px-4 py-3 text-left">Número</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-left">Calle</th>
                  <th className="px-4 py-3 text-left">Mesa</th>
                  <th className="px-4 py-3 text-left">Hora</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {votsResp.map((o) => {
                  const mesa = mesas.find((m) => m.id === o.mesaId);

                  return (
                    <tr key={o.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-semibold">{o.numero || "-"}</td>
                      <td className="px-4 py-3">{o.nombre}</td>
                      <td className="px-4 py-3">{o.telefono || "-"}</td>
                      <td className="px-4 py-3">{o.calle || "-"}</td>
                      <td className="px-4 py-3">{mesa?.nombre || "-"}</td>
                      <td className="px-4 py-3">{o.hora || "-"}</td>
                      <td className="px-4 py-3">
                        {o.registrada ? (
                          <Badge tone="green">Ha entrado</Badge>
                        ) : (
                          <Badge tone="amber">Falta</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => abrirWhatsApp(o.telefono, o.nombre)}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white"
                        >
                          <span>📱</span> WhatsApp
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
  mesas,
  setMesas,
}) {
  const [nuevoNumero, setNuevoNumero] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevaCalle, setNuevaCalle] = useState("");
  const [nuevoResponsableId, setNuevoResponsableId] = useState("");
  const [nuevaMesaId, setNuevaMesaId] = useState("");
  const [mensajeImportacion, setMensajeImportacion] = useState("");

  const [nombreResponsable, setNombreResponsable] = useState("");
  const [telefonoResponsable, setTelefonoResponsable] = useState("");
  const [passwordResponsable, setPasswordResponsable] = useState("");

  const [nombreMesa, setNombreMesa] = useState("");
  const [telefonoMesa, setTelefonoMesa] = useState("");
  const [passwordMesa, setPasswordMesa] = useState("");

  const [votEditando, setVotEditando] = useState(null);
  const [responsableEditando, setResponsableEditando] = useState(null);
  const [mesaEditando, setMesaEditando] = useState(null);

  const total = vots.length;
  const llegadas = vots.filter((o) => o.registrada).length;
  const pendientes = total - llegadas;

  useEffect(() => {
    if (!nuevoResponsableId && responsables.length > 0) {
      setNuevoResponsableId(responsables[0].id);
    }
  }, [responsables, nuevoResponsableId]);

  const normalizarTexto = (texto) => {
    return String(texto || "")
      .replace(/\u00A0/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/-/g, "")
      .replace(/\s+/g, "")
      .trim();
  };

  const exportarVots = () => {
    const datos = vots.map((v) => {
      const responsable = responsables.find((r) => r.id === v.responsableId);
      const mesa = mesas.find((m) => m.id === v.mesaId);

      return {
        numero: v.numero || "",
        nombre: v.nombre || "",
        telefono: v.telefono || "",
        calle: v.calle || "",
        responsable: responsable?.nombre || "",
        usuario_responsable: responsable?.usuario || "",
        mesa: mesa?.nombre || "",
        usuario_mesa: mesa?.usuario || "",
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
    if (!nuevoNumero || !nuevoNombre || !nuevoResponsableId) return;

    if (votEditando) {
      const votActual = vots.find((v) => v.id === votEditando);

      if (votActual?.id) {
        await updateDoc(doc(db, "vots", votActual.id), {
          numero: nuevoNumero,
          nombre: nuevoNombre,
          telefono: nuevoTelefono,
          calle: nuevaCalle,
          responsableId: nuevoResponsableId,
          mesaId: nuevaMesaId || "",
        });
      }

      setVots((prev) =>
        prev.map((v) =>
          v.id === votEditando
            ? {
                ...v,
                numero: nuevoNumero,
                nombre: nuevoNombre,
                telefono: nuevoTelefono,
                calle: nuevaCalle,
                responsableId: nuevoResponsableId,
                mesaId: nuevaMesaId || "",
              }
            : v
        )
      );

      setVotEditando(null);
    } else {
      const nuevoVot = {
        numero: nuevoNumero,
        nombre: nuevoNombre,
        telefono: nuevoTelefono,
        calle: nuevaCalle,
        responsableId: nuevoResponsableId,
        mesaId: nuevaMesaId || "",
        hora: null,
        registrada: false,
      };

      const docRef = await addDoc(collection(db, "vots"), nuevoVot);
      setVots((prev) => [...prev, { id: docRef.id, ...nuevoVot }]);
    }

    setNuevoNumero("");
    setNuevoNombre("");
    setNuevoTelefono("");
    setNuevaCalle("");
    setNuevaMesaId("");

    if (responsables.length > 0) {
      setNuevoResponsableId(responsables[0].id);
    }
  };

  const editarVot = (v) => {
    setVotEditando(v.id);
    setNuevoNumero(v.numero || "");
    setNuevoNombre(v.nombre || "");
    setNuevoTelefono(v.telefono || "");
    setNuevaCalle(v.calle || "");
    setNuevoResponsableId(v.responsableId || "");
    setNuevaMesaId(v.mesaId || "");
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
        let mesasCreadas = 0;
        const nuevos = [];
        const mesasActualizadas = [...mesas];

        for (const fila of filas) {
          const numero = String(fila.numero || "").trim();
          const nombre = String(fila.nombre || "").trim();
          const telefono = String(fila.telefono || "").trim();
          const calle = String(fila.calle || "").trim();

          const nombreResponsableExcel = normalizarTexto(fila.responsable);
          const nombreMesaOriginal = String(fila.mesa || "")
            .replace(/\u00A0/g, " ")
            .trim();
          const nombreMesaExcel = normalizarTexto(fila.mesa);

          const responsable = responsables.find(
            (r) => normalizarTexto(r.nombre) === nombreResponsableExcel
          );

          let mesa = mesasActualizadas.find(
            (m) =>
              normalizarTexto(m.nombre) === nombreMesaExcel ||
              normalizarTexto(m.usuario) === nombreMesaExcel
          );

          if (!mesa && nombreMesaOriginal) {
            const usuarioGenerado = `mesa${mesasActualizadas.length + 1}`;
            const nuevaMesa = {
              nombre: nombreMesaOriginal,
              telefono: "",
              usuario: usuarioGenerado,
              password: "1234",
              activo: true,
            };

            const docRefMesa = await addDoc(collection(db, "mesas"), nuevaMesa);
            mesa = {
              id: docRefMesa.id,
              ...nuevaMesa,
              _collection: "mesas",
            };
            mesasActualizadas.push(mesa);
            mesasCreadas += 1;
          }

          if (!numero || !nombre || !responsable) {
            errores += 1;
            continue;
          }

          const nuevo = {
            numero,
            nombre,
            telefono,
            calle,
            responsableId: responsable.id,
            mesaId: mesa?.id || "",
            hora: null,
            registrada: false,
          };

          const docRef = await addDoc(collection(db, "vots"), nuevo);
          nuevos.push({ id: docRef.id, ...nuevo });
          importados += 1;
        }

        if (mesasActualizadas.length !== mesas.length) {
          setMesas(mesasActualizadas);
        }

        if (nuevos.length) {
          setVots((prev) => [...prev, ...nuevos]);
        }

        setMensajeImportacion(
          `Importación completada. Correctos: ${importados}. Errores: ${errores}. Mesas creadas: ${mesasCreadas}.`
        );
      } catch (error) {
        console.error(error);
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
    setNombreResponsable(r.nombre || "");
    setTelefonoResponsable(r.telefono || "");
    setPasswordResponsable(r.password || "");
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

  const crearOActualizarMesa = async () => {
    if (!nombreMesa || !passwordMesa) return;

    if (mesaEditando) {
      const actual = mesas.find((m) => m.id === mesaEditando);

      if (actual?.id) {
        const collectionName = actual._collection || "mesas";
        await updateDoc(doc(db, collectionName, actual.id), {
          nombre: nombreMesa,
          telefono: telefonoMesa,
          password: passwordMesa,
        });
      }

      setMesas((prev) =>
        prev.map((m) =>
          m.id === mesaEditando
            ? {
                ...m,
                nombre: nombreMesa,
                telefono: telefonoMesa,
                password: passwordMesa,
              }
            : m
        )
      );

      setMesaEditando(null);
    } else {
      const usuario = `mesa${mesas.length + 1}`;
      const nuevaMesa = {
        nombre: nombreMesa,
        telefono: telefonoMesa,
        usuario,
        password: passwordMesa,
        activo: true,
      };

      const docRef = await addDoc(collection(db, "mesas"), nuevaMesa);
      setMesas((prev) => [
        ...prev,
        { id: docRef.id, ...nuevaMesa, _collection: "mesas" },
      ]);
    }

    setNombreMesa("");
    setTelefonoMesa("");
    setPasswordMesa("");
  };

  const editarMesa = (m) => {
    setMesaEditando(m.id);
    setNombreMesa(m.nombre || "");
    setTelefonoMesa(m.telefono || "");
    setPasswordMesa(m.password || "");
  };

  const eliminarMesa = async (id) => {
    const tieneVots = vots.some((v) => v.mesaId === id);
    if (tieneVots) {
      alert("No puedes eliminar una mesa con VOTs asignados.");
      return;
    }

    const mesa = mesas.find((m) => m.id === id);
    const collectionName = mesa?._collection || "mesas";

    if (!window.confirm("¿Eliminar esta mesa?")) return;

    await deleteDoc(doc(db, collectionName, id));
    setMesas((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">
                Panel de control
              </h1>
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
            <h2 className="text-lg font-bold text-slate-950">
              {votEditando ? "Editar VOT" : "Alta de VOT"}
            </h2>
            <div className="mt-4 space-y-3">
              <input
                value={nuevoNumero}
                onChange={(e) => setNuevoNumero(e.target.value)}
                placeholder="Número"
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
              <input
                value={nuevaCalle}
                onChange={(e) => setNuevaCalle(e.target.value)}
                placeholder="Calle"
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
              <select
                value={nuevaMesaId}
                onChange={(e) => setNuevaMesaId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              >
                <option value="">Sin mesa asignada</option>
                {mesas
                  .filter((m) => m.activo)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
              </select>

              <button
                onClick={crearOActualizarVot}
                className="h-11 w-full rounded-xl bg-slate-950 font-semibold text-white"
              >
                {votEditando ? "Guardar cambios" : "Crear VOT"}
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-950">
              Importar / Exportar VOTs
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Columnas: numero, nombre, telefono, calle, responsable, mesa
            </p>
            <div className="mt-4 space-y-3">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importarExcel}
                className="block w-full text-sm text-slate-700"
              />
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                La columna mesa es opcional. Si no existe, se crea automáticamente.
              </div>
              <ActionButton tone="dark" onClick={exportarVots}>
                Exportar VOTs
              </ActionButton>
              {mensajeImportacion ? (
                <Badge tone="gray">{mensajeImportacion}</Badge>
              ) : null}
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
                className="h-11 w-full rounded-xl bg-slate-950 font-semibold text-white"
              >
                {responsableEditando ? "Guardar cambios" : "Crear responsable"}
              </button>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-bold text-slate-950">
              {mesaEditando ? "Editar mesa" : "Alta de mesa"}
            </h2>
            <div className="mt-4 space-y-3">
              <input
                value={nombreMesa}
                onChange={(e) => setNombreMesa(e.target.value)}
                placeholder="Nombre"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <input
                value={telefonoMesa}
                onChange={(e) => setTelefonoMesa(e.target.value)}
                placeholder="Teléfono"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <input
                type="password"
                value={passwordMesa}
                onChange={(e) => setPasswordMesa(e.target.value)}
                placeholder="Contraseña"
                className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none"
              />
              <button
                onClick={crearOActualizarMesa}
                className="h-11 w-full rounded-xl bg-slate-950 font-semibold text-white"
              >
                {mesaEditando ? "Guardar cambios" : "Crear mesa"}
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-950">Listado de VOTs</h2>
            <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Número</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">Calle</th>
                    <th className="px-4 py-3 text-left">Responsable</th>
                    <th className="px-4 py-3 text-left">Mesa</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vots.map((o) => {
                    const responsable = responsables.find(
                      (r) => r.id === o.responsableId
                    );
                    const mesa = mesas.find((m) => m.id === o.mesaId);

                    return (
                      <tr key={o.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-semibold">{o.numero || "-"}</td>
                        <td className="px-4 py-3">{o.nombre}</td>
                        <td className="px-4 py-3">{o.telefono || "-"}</td>
                        <td className="px-4 py-3">{o.calle || "-"}</td>
                        <td className="px-4 py-3">{responsable?.nombre || "-"}</td>
                        <td className="px-4 py-3">{mesa?.nombre || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <ActionButton onClick={() => editarVot(o)}>
                              Editar
                            </ActionButton>
                            <ActionButton
                              tone="danger"
                              onClick={() => eliminarVot(o.id)}
                            >
                              Eliminar
                            </ActionButton>
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
            <h2 className="text-lg font-bold text-slate-950">
              Listado de responsables
            </h2>
            <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-800">
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
                      <td className="px-4 py-3">{r.telefono || "-"}</td>
                      <td className="px-4 py-3">{r.usuario}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <ActionButton onClick={() => editarResponsable(r)}>
                            Editar
                          </ActionButton>
                          <ActionButton
                            tone="danger"
                            onClick={() => eliminarResponsable(r.id)}
                          >
                            Eliminar
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-950">Listado de mesas</h2>
            <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mesas.map((m) => (
                    <tr key={m.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-semibold">{m.nombre}</td>
                      <td className="px-4 py-3">{m.telefono || "-"}</td>
                      <td className="px-4 py-3">{m.usuario}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <ActionButton onClick={() => editarMesa(m)}>
                            Editar
                          </ActionButton>
                          <ActionButton
                            tone="danger"
                            onClick={() => eliminarMesa(m.id)}
                          >
                            Eliminar
                          </ActionButton>
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
  const [mesas, setMesas] = useState([]);
  const [cargadoNube, setCargadoNube] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [snapVots, snapResponsables, snapMesas, snapInteractoresLegacy] =
          await Promise.all([
            getDocs(collection(db, "vots")),
            getDocs(collection(db, "responsables")),
            getDocs(collection(db, "mesas")),
            getDocs(collection(db, "interactores")),
          ]);

        const datosVots = snapVots.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          numero: d.data().numero || "",
          nombre: d.data().nombre || "",
          telefono: d.data().telefono || "",
          calle: d.data().calle || "",
          mesaId: d.data().mesaId || d.data().interactorId || "",
        }));

        const datosResponsables = snapResponsables.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const mesasNuevas = snapMesas.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          _collection: "mesas",
        }));

        const mesasLegacy = snapInteractoresLegacy.docs
          .filter((d) => !mesasNuevas.some((m) => m.id === d.id))
          .map((d) => ({
            id: d.id,
            ...d.data(),
            _collection: "interactores",
          }));

        setVots(datosVots);
        setResponsables(datosResponsables);
        setMesas([...mesasNuevas, ...mesasLegacy]);
      } catch (error) {
        console.error("Error cargando datos desde Firebase", error);
      } finally {
        setCargadoNube(true);
      }
    };

    cargarDatos();
  }, []);

  if (!cargadoNube) {
    return (
      <div className="min-h-screen bg-slate-100 p-8 text-slate-700">
        Cargando datos...
      </div>
    );
  }

  if (!sesion) {
    return (
      <LoginScreen
        onLogin={setSesion}
        responsables={responsables}
        mesas={mesas}
      />
    );
  }

  if (sesion.rol === "mesa") {
    return (
      <MesaScreen
        onLogout={() => setSesion(null)}
        vots={vots}
        setVots={setVots}
        usuario={sesion.usuario}
        mesas={mesas}
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
        mesas={mesas}
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
      mesas={mesas}
      setMesas={setMesas}
    />
  );
}
