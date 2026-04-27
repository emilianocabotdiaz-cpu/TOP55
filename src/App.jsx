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
    <span className={`inline-flex px-3 py-1 rounded-full text-xs ${styles[tone]}`}>
      {children}
    </span>
  );
}

function Card({ children }) {
  return <div className="bg-white p-5 rounded-xl shadow">{children}</div>;
}

// ===================== MESA =====================
function MesaScreen({ vots, setVots, usuario, mesas, onLogout }) {
  const [numero, setNumero] = useState("");
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState("gray");

  const mesa = mesas.find((m) => m.usuario === usuario);
  const votsMesa = vots.filter((v) => v.mesaId === mesa?.id);

  const registrar = async () => {
    if (!numero) {
      setMsg("Introduce número");
      setTone("red");
      return;
    }

    const vot = votsMesa.find((v) => String(v.numero) === numero);

    if (!vot) {
      setMsg("No encontrado");
      setTone("red");
      return;
    }

    if (vot.registrada) {
      setMsg("Ya registrado");
      setTone("amber");
      setNumero("");
      return;
    }

    const hora = new Date().toLocaleTimeString();

    await updateDoc(doc(db, "vots", vot.id), {
      registrada: true,
      hora,
    });

    setVots((prev) =>
      prev.map((v) =>
        v.id === vot.id ? { ...v, registrada: true, hora } : v
      )
    );

    setMsg("OK");
    setTone("green");
    setNumero("");
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Card>
        <h1 className="text-2xl font-bold mb-4">
          Mesa: {mesa?.nombre || usuario}
        </h1>

        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && registrar()}
          placeholder="NÚMERO"
          className="w-full text-center text-4xl border p-4 rounded"
        />

        <button
          onClick={registrar}
          className="w-full mt-4 bg-green-600 text-white text-2xl p-4 rounded"
        >
          REGISTRAR
        </button>

        <div className="mt-4 text-center">
          <Badge tone={tone}>{msg || "Esperando..."}</Badge>
        </div>

        <button onClick={onLogout} className="mt-6">
          Salir
        </button>
      </Card>
    </div>
  );
}

// ===================== PANEL =====================
function CooperativaScreen({ vots, setVots, mesas }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [mesaId, setMesaId] = useState("");

  const crear = async () => {
    if (!nombre || !numero) return;

    if (vots.some((v) => String(v.numero) === numero)) {
      alert("Número duplicado");
      return;
    }

    const nuevo = {
      nombre,
      telefono,
      calle,
      numero,
      mesaId,
      registrada: false,
      hora: null,
    };

    const ref = await addDoc(collection(db, "vots"), nuevo);
    setVots((prev) => [...prev, { id: ref.id, ...nuevo }]);

    setNombre("");
    setTelefono("");
    setCalle("");
    setNumero("");
  };

  const importarExcel = async (e) => {
    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

    for (const fila of sheet) {
      if (!fila.numero) continue;

      if (vots.some((v) => String(v.numero) === String(fila.numero))) continue;

      await addDoc(collection(db, "vots"), {
        nombre: fila.nombre || "",
        telefono: fila.telefono || "",
        calle: fila.calle || "",
        numero: String(fila.numero),
        mesaId: "",
        registrada: false,
        hora: null,
      });
    }

    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <h2 className="font-bold text-xl mb-3">Nuevo VOT</h2>

        <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" className="input"/>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="input"/>
        <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className="input"/>
        <input value={calle} onChange={(e) => setCalle(e.target.value)} placeholder="Calle" className="input"/>

        <select onChange={(e) => setMesaId(e.target.value)} className="input">
          <option value="">Mesa</option>
          {mesas.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>

        <button onClick={crear} className="btn mt-2">Crear</button>

        <input type="file" onChange={importarExcel} className="mt-3"/>
      </Card>

      <Card>
        <h2 className="font-bold text-xl mb-3">Listado VOTs</h2>

        <div className="max-h-[400px] overflow-auto space-y-2">
          {vots.map((v) => (
            <div key={v.id} className="border p-2 flex justify-between">
              <span>{v.numero} - {v.nombre}</span>
              <Badge tone={v.registrada ? "green" : "amber"}>
                {v.registrada ? "OK" : "Pendiente"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ===================== APP =====================
export default function App() {
  const [sesion, setSesion] = useState(null);
  const [vots, setVots] = useState([]);
  const [mesas, setMesas] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const v = await getDocs(collection(db, "vots"));
      const m = await getDocs(collection(db, "mesas"));

      setVots(v.docs.map((d) => ({ id: d.id, ...d.data() })));
      setMesas(m.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    cargar();
  }, []);

  if (!sesion) {
    return (
      <button onClick={() => setSesion({ rol: "mesa", usuario: "mesa1" })}>
        Entrar demo
      </button>
    );
  }

  if (sesion.rol === "mesa") {
    return (
      <MesaScreen
        vots={vots}
        setVots={setVots}
        usuario={sesion.usuario}
        mesas={mesas}
        onLogout={() => setSesion(null)}
      />
    );
  }

  return <CooperativaScreen vots={vots} setVots={setVots} mesas={mesas} />;
}
