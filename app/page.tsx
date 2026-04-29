"use client";

import { FormEvent, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-browser";

const modes = [
  { id: "dudas", label: "Dudas de temario" },
  { id: "test", label: "Generar test" },
  { id: "animo", label: "Companero de animo" },
  { id: "plan", label: "Plan semanal" },
];

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function renderMessageText(text: string) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return blocks.map((block, blockIndex) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const isList = lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line));

    if (isList) {
      return (
        <ul className="message-list" key={`${block}-${blockIndex}`}>
          {lines.map((line) => (
            <li key={line}>{line.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, "")}</li>
          ))}
        </ul>
      );
    }

    return (
      <p className="message-paragraph" key={`${block}-${blockIndex}`}>
        {lines.map((line, lineIndex) => (
          <span key={`${line}-${lineIndex}`}>
            {line}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  });
}

const paidWelcomeMessage =
  "Bienvenido compañero, estoy para ayudarte a ser Policía. Lo vas a conseguir y lo vamos a celebrar. ¿Dime en qué te puedo ayudar, compi?";

const trialWelcomeMessage =
  "Puedes probarme gratis con 3 mensajes. Pregúntame una duda, pídeme un test o dime cómo llevas la semana.";

const modeSupportMessages: Record<string, string> = {
  dudas: "Perfecto, compañero. Volvemos a dudas de temario: vamos a dejarlo claro, corto y útil para examen.",
  test: "Vamos con test. Practicar es avanzar: cada fallo corregido te acerca un poco más a tu plaza.",
  animo: "Estoy contigo. Respira, ordenamos el día y damos el siguiente paso. Esto se construye bloque a bloque.",
  plan: "Buena decisión. Vamos a organizar el estudio para que hoy salgas con trabajo hecho y cabeza tranquila.",
};

export default function Home() {
  const [pageNotice, setPageNotice] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "yearly" | null>(null);
  const [paidAccess, setPaidAccess] = useState(false);
  const [demoUses, setDemoUses] = useState(0);
  const [mode, setMode] = useState("dudas");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installNotice, setInstallNotice] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: trialWelcomeMessage,
    },
  ]);

  useEffect(() => {
    const supabaseClient = supabase;
    const params = new URLSearchParams(window.location.search);
    const checkoutSuccess = params.get("checkout") === "success";
    const checkoutCancelled = params.get("checkout") === "cancelled";
    const storedPaidAccess = !isSupabaseConfigured && localStorage.getItem("opocompi-paid-access") === "true";
    const storedUses = Number(localStorage.getItem("opocompi-demo-uses") ?? "0");

    if (checkoutSuccess) {
      if (isSupabaseConfigured) {
        setPageNotice("Pago completado. Estamos comprobando tu membresia; si tarda unos segundos, recarga la pagina.");
      } else {
        localStorage.setItem("opocompi-paid-access", "true");
        setPaidAccess(true);
        setPageNotice("Pago completado. Tu chat queda desbloqueado en este dispositivo.");
        setMessages([
          {
            id: "paid-welcome",
            role: "assistant",
            text: paidWelcomeMessage,
          },
        ]);
      }
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (checkoutCancelled) {
      setPageNotice("Pago cancelado. Puedes seguir usando la prueba gratuita si te quedan mensajes.");
      window.history.replaceState({}, "", window.location.pathname);
    }

    setPaidAccess(storedPaidAccess);
    setDemoUses(Number.isFinite(storedUses) ? storedUses : 0);

    const storedMessages = localStorage.getItem("opocompi-chat-messages");
    if (storedMessages && !checkoutSuccess && !storedPaidAccess) {
      try {
        const parsedMessages = JSON.parse(storedMessages) as Message[];
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      } catch {
        localStorage.removeItem("opocompi-chat-messages");
      }
    } else if (storedPaidAccess) {
      setMessages([
        {
          id: "paid-welcome",
          role: "assistant",
          text: paidWelcomeMessage,
        },
      ]);
    }

    async function loadSession() {
      if (!supabaseClient || !isSupabaseConfigured) return;

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        setUserEmail("");
        return;
      }

      const email = session.user.email ?? "";
      setUserEmail(email);
      setCheckoutEmail((current) => current || email);
      setLoginEmail((current) => current || email);

      try {
        const response = await fetch("/api/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const profile = await response.json();
        if (profile.hasAccess) {
          localStorage.setItem("opocompi-paid-access", "true");
          setPaidAccess(true);
          setMessages([
            {
              id: "paid-welcome",
              role: "assistant",
              text: paidWelcomeMessage,
            },
          ]);
        }
      } catch {
        setPageNotice("No pude comprobar la membresia ahora. Si acabas de entrar, recarga en unos segundos.");
      }
    }

    loadSession();

    if (!supabaseClient || !isSupabaseConfigured) return;

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        setInstallNotice("La instalacion como app no esta disponible en este navegador.");
      });
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setIsStandalone(standalone);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsStandalone(true);
      setInstallPrompt(null);
      setInstallNotice("OpoCompi ya esta instalada en tu movil.");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("opocompi-chat-messages", JSON.stringify(messages));
  }, [messages]);

  function changeMode(nextMode: string) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: modeSupportMessages[nextMode] ?? "Seguimos, compañero. Estoy contigo para avanzar paso a paso.",
      },
    ]);
  }

  async function startCheckout(plan: "monthly" | "yearly") {
    setPageNotice("");

    if (isSupabaseConfigured && !userEmail) {
      setPageNotice("Primero inicia sesion. Asi la membresia queda guardada en tu cuenta.");
      document.querySelector("#login")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!userEmail && !checkoutEmail.trim()) {
      setPageNotice("Escribe tu email para contratar la membresia.");
      document.querySelector("#login")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setCheckoutLoading(plan);

    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ plan, email: userEmail || checkoutEmail }),
      });

      const checkout = await response.json();
      if (checkout.url) {
        window.location.href = checkout.url;
        return;
      }

      setPageNotice(checkout.error ?? "No se pudo abrir Stripe Checkout. Revisa las variables STRIPE_* en Vercel.");
    } catch {
      setPageNotice("No se pudo conectar con Stripe Checkout. Revisa Vercel y vuelve a hacer redeploy.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function loginWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageNotice("");

    if (!loginEmail.trim()) {
      setPageNotice("Escribe tu email para enviarte el enlace de acceso.");
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await response.json();
      setPageNotice(data.message ?? data.error ?? "Revisa tu email para entrar.");
    } catch {
      setPageNotice("No pude enviar el enlace de acceso. Revisa Supabase y vuelve a intentarlo.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loginWithGoogle() {
    setPageNotice("");

    if (!supabase || !isSupabaseConfigured) {
      setPageNotice("Supabase no esta configurado todavia para login.");
      return;
    }

    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setPageNotice(`Supabase: ${error.message}`);
      setAuthLoading(false);
    }
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem("opocompi-paid-access");
    localStorage.removeItem("opocompi-chat-messages");
    setPaidAccess(false);
    setUserEmail("");
    setCheckoutEmail("");
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: trialWelcomeMessage,
      },
    ]);
    setPageNotice("Sesion cerrada. Puedes volver a entrar cuando quieras, compi.");
  }

  async function installApp() {
    if (isStandalone) {
      setInstallNotice("OpoCompi ya esta funcionando como app.");
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      setInstallNotice(
        choice.outcome === "accepted"
          ? "Listo. OpoCompi se esta instalando en tu movil."
          : "Sin problema. Puedes instalarla mas tarde desde el navegador."
      );
      return;
    }

    setInstallNotice("En iPhone: comparte esta pagina y pulsa 'Anadir a pantalla de inicio'. En Android: usa el menu del navegador e instala la app.");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = prompt.trim();
    if (!text) return;

    if (!paidAccess && demoUses >= 3) {
      setPageNotice("Has usado los 3 mensajes gratuitos. Contrata la membresia para desbloquear el chat completo.");
      document.querySelector("#membresia")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]);
    setPrompt("");
    setBusy(true);

    if (!paidAccess) {
      const nextUses = demoUses + 1;
      setDemoUses(nextUses);
      localStorage.setItem("opocompi-demo-uses", String(nextUses));
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text, mode }),
      });
      const data = await response.json();
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: data.reply ?? data.error ?? "No pude responder ahora." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="OpoCompi inicio">
          <span className="brand-mark logo-mark">
            <img src="/brand/opocompi-logo.png" alt="" />
          </span>
          <span>OpoCompi</span>
        </a>
        <nav className="nav" aria-label="Navegacion principal">
          {!userEmail ? <a href="#login">Login</a> : null}
          {!paidAccess ? <a href="#membresia">Precios</a> : null}
          <a href="#asistente">Probar chat</a>
          <a href="/tests">Tests</a>
        </nav>
        <div className="topbar-actions">
          {!isStandalone ? (
            <button className="btn btn-secondary install-topbar" type="button" onClick={installApp}>
              Instalar
            </button>
          ) : null}
          {userEmail ? <span className="session-pill">{userEmail}</span> : null}
          {userEmail || paidAccess ? (
            <button className="btn btn-secondary" type="button" onClick={logout}>Salir</button>
          ) : (
            <a className="btn btn-primary" href="#login">Entrar</a>
          )}
        </div>
      </header>

      <main>
        {pageNotice ? (
          <div className="page-notice" role="status">
            {pageNotice}
          </div>
        ) : null}

        <section id="inicio" className="hero">
          <div className="hero-media" aria-hidden="true">
            <img src="/brand/police-banner.jpg" alt="" />
          </div>
          <div className="hero-content">
            <img className="hero-logo" src="/brand/opocompi-logo.png" alt="Logotipo de OpoCompi" />
            <p className="eyebrow">Tu primer compañero en la Policía</p>
            <h1>OpoCompi</h1>
            <p className="hero-copy">
              El primer asistente para opositores de policía basado en IA generativa propia y totalmente enfocada a Policía Nacional.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href={paidAccess ? "#asistente" : "#login"}>
                {paidAccess ? "Ir al chat" : "Entrar o crear cuenta"}
              </a>
              {!paidAccess ? <a className="btn btn-secondary" href="#asistente">Probar chat</a> : null}
            </div>
          </div>
        </section>

        {!paidAccess ? (
          <section id="login" className="auth-section">
            <div className="section-heading compact">
              <p className="eyebrow">Acceso</p>
              <h2>Entra para guardar tu membresia</h2>
              <p>
                Inicia sesion antes de pagar. Asi, cuando contrates, OpoCompi sabra que la membresia es tuya en cualquier dispositivo.
              </p>
            </div>
            <div className="auth-card">
              {userEmail ? (
                <div className="logged-box">
                  <strong>Sesion iniciada</strong>
                  <p>{userEmail}</p>
                  <a className="btn btn-primary" href="#membresia">Elegir membresia</a>
                </div>
              ) : (
                <>
                  <form className="auth-form" onSubmit={loginWithEmail}>
                    <label>
                      Email
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                        placeholder="tu@email.com"
                      />
                    </label>
                    <button className="btn btn-primary" type="submit" disabled={authLoading}>
                      {authLoading ? "Enviando..." : "Enviar enlace"}
                    </button>
                  </form>
                  <div className="auth-divider"><span>o</span></div>
                  <button className="btn btn-secondary google-btn" type="button" onClick={loginWithGoogle} disabled={authLoading}>
                    Entrar con Google
                  </button>
                  <p className="auth-help">El enlace llega al correo. Google funcionara si lo tienes activado en Supabase.</p>
                </>
              )}
            </div>
          </section>
        ) : null}

        {!paidAccess ? (
          <section id="membresia" className="pricing">
            <div className="section-heading compact">
              <p className="eyebrow">Membresia</p>
              <h2>Acceso completo al chat</h2>
              <p>Inicia sesion, elige plan y paga con Stripe. Al volver del pago, el chat y los tests quedan vinculados a tu cuenta.</p>
            </div>
            <div className="purchase-form">
              {userEmail ? (
                <p className="purchase-session">Vas a contratar con la cuenta <strong>{userEmail}</strong>.</p>
              ) : (
                <label>
                  Email para la membresia
                  <input
                    type="email"
                    value={checkoutEmail}
                    onChange={(event) => setCheckoutEmail(event.target.value)}
                    placeholder="tu@email.com"
                  />
                </label>
              )}
            </div>
            <div className="pricing-grid two">
              <article className="price-card">
                <h3>Mensual</h3>
                <p className="price">9,90 EUR<span>/mes</span></p>
                <ul>
                  <li>Chat IA privado</li>
                  <li>Tests por bloque</li>
                  <li>Acompanamiento motivacional</li>
                </ul>
                <button className="btn btn-secondary" type="button" onClick={() => startCheckout("monthly")}>
                  {checkoutLoading === "monthly" ? "Abriendo pago..." : "Contratar mensual"}
                </button>
              </article>
              <article className="price-card featured">
                <div className="tag">Ahorro anual</div>
                <h3>Oposicion completa</h3>
                <p className="price">90,90 EUR<span>/ano</span></p>
                <ul>
                  <li>Todo lo del plan mensual</li>
                  <li>Mejor precio para preparacion completa</li>
                  <li>Acceso continuado al chat</li>
                </ul>
                <button className="btn btn-primary" type="button" onClick={() => startCheckout("yearly")}>
                  {checkoutLoading === "yearly" ? "Abriendo pago..." : "Contratar anual"}
                </button>
              </article>
            </div>
          </section>
        ) : null}

        {!paidAccess ? (
          <section className="conversion-section">
            <div className="section-heading compact">
              <p className="eyebrow">Hecho para opositores</p>
              <h2>Menos bloqueo, mas practica</h2>
              <p>
                OpoCompi no sustituye tu temario: te acompaña para entenderlo, repasarlo y convertir dudas en entrenamiento.
              </p>
            </div>
            <div className="benefit-grid">
              <article>
                <strong>Respuesta inmediata</strong>
                <p>Pregunta una duda y recibe una explicacion corta, ordenada y adaptada a oposicion.</p>
              </article>
              <article>
                <strong>Tests para fijar</strong>
                <p>Practica con opciones A/B/C/D, corrige fallos y repasa los puntos debiles.</p>
              </article>
              <article>
                <strong>Ritmo de estudio</strong>
                <p>Recibe apoyo, planes breves y empuje cuando cuesta sentarse a estudiar.</p>
              </article>
            </div>
          </section>
        ) : null}

        {!paidAccess ? (
          <section className="how-section">
            <div className="how-copy">
              <p className="eyebrow">Como funciona</p>
              <h2>Pruebalo antes de pagar</h2>
              <p>Empieza con 3 mensajes gratis. Si te ayuda, desbloqueas el chat completo y la zona de tests.</p>
            </div>
            <div className="steps-list">
              <article>
                <span>1</span>
                <p>Haz una pregunta real de tu oposicion.</p>
              </article>
              <article>
                <span>2</span>
                <p>Comprueba si la explicacion te ayuda a avanzar.</p>
              </article>
              <article>
                <span>3</span>
                <p>Activa la membresia y sigue practicando cada dia.</p>
              </article>
            </div>
          </section>
        ) : null}

        <section id="asistente" className="workspace">
          <div className="section-heading">
            <p className="eyebrow">{paidAccess ? "Zona de miembros" : "Prueba gratuita"}</p>
            <h2>{paidAccess ? "Tu chat privado de oposicion" : "Chat de acompanamiento"}</h2>
            <p>
              {paidAccess
                ? "Dime que tema llevas entre manos y avanzamos juntos, compi."
                : "Usa 3 mensajes gratis. Al contratar la membresia, el chat queda desbloqueado para seguir estudiando."}
            </p>
          </div>

          <div className="app-shell">
            <aside className="side-panel">
              <div>
                <p className="panel-label">Estado</p>
                <div className={`member-badge ${paidAccess ? "active" : "locked"}`}>
                  {paidAccess ? "Membresia activa" : `Prueba ${Math.min(demoUses, 3)}/3`}
                </div>
              </div>

              <div className="focus-card">
                <p className="panel-label">Acompanamiento</p>
                <p className="side-note">Pregunta lo que necesites y OpoCompi adaptara la respuesta a tu oposicion.</p>
              </div>
            </aside>

            <section className="chat-card" aria-label="Chat con el asistente">
              <div className="chat-messages" aria-live="polite">
                {messages.map((message) => (
                  <article className={`message ${message.role}`} key={message.id}>
                    <span>{message.role === "user" ? "Tu" : "OpoCompi"}</span>
                    <div className="message-body">{renderMessageText(message.text)}</div>
                  </article>
                ))}
              </div>
              <form className="chat-form" onSubmit={sendMessage}>
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  type="text"
                  placeholder="Ej.: Hazme 5 preguntas sobre Constitucion Espanola"
                  disabled={busy}
                />
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? "Pensando..." : paidAccess ? "Enviar" : `Enviar (${Math.max(0, 3 - demoUses)} gratis)`}
                </button>
              </form>
            </section>
          </div>
        </section>

        {!paidAccess ? (
          <section className="cta-band">
            <div>
              <p className="eyebrow">Empieza hoy</p>
              <h2>Tu oposicion no se prepara sola y nosotros te vamos a acompanar.</h2>
              <p className="install-copy">
                Instala OpoCompi en tu movil y llevalo siempre en la pantalla de inicio.
              </p>
              {installNotice ? <p className="install-notice">{installNotice}</p> : null}
            </div>
            <div className="cta-actions">
              <button className="btn btn-primary" type="button" onClick={installApp}>
                {isStandalone ? "App instalada" : "Instalar app"}
              </button>
              <a className="btn btn-secondary" href="#membresia">Ver membresia</a>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="footer">
        <p>OpoCompi debe usar contenido revisado por preparadores o fuentes oficiales antes de ponerse en produccion.</p>
      </footer>
    </>
  );
}
