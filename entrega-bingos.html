<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Entrega de Bingos</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f4f6f8;
      color: #1f2937;
    }

    header {
      background: white;
      border-bottom: 1px solid #ddd;
      padding: 16px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
    }

    header h1 {
      margin: 0;
      font-size: 24px;
    }

    header span {
      color: #6b7280;
      font-size: 13px;
    }

    header a {
      text-decoration: none;
      color: #2563eb;
      font-weight: bold;
      font-size: 14px;
    }

    main {
      max-width: 1000px;
      margin: auto;
      padding: 20px;
    }

    .panel {
      background: white;
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
    }

    .juegos {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }

    .juego-btn {
      padding: 13px 10px;
      border: 2px solid #d1d5db;
      background: white;
      border-radius: 10px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
    }

    .juego-btn.activo {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
    }

    .selector-mesa {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: end;
      gap: 10px;
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 7px;
    }

    select {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      font-size: 16px;
    }

    button {
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .mesa-nav {
      padding: 12px 14px;
      background: #e5e7eb;
      color: #374151;
      font-weight: bold;
      white-space: nowrap;
    }

    .titulo-actual {
      margin: 0;
      font-size: 22px;
    }

    .actualizacion {
      margin-top: 5px;
      color: #6b7280;
      font-size: 12px;
    }

    .resumen {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 15px;
    }

    .resumen-item {
      border-radius: 11px;
      padding: 14px;
      text-align: center;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }

    .resumen-item strong {
      display: block;
      font-size: 28px;
      margin-bottom: 4px;
    }

    .resumen-item span {
      color: #6b7280;
      font-size: 12px;
    }

    .pendientes-grande {
      background: #fff7ed;
      border-color: #fed7aa;
    }

    .pendientes-grande strong {
      color: #c2410c;
    }

    .lista-personas {
      display: grid;
      gap: 12px;
    }

    .persona-card {
      background: white;
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
      border-left: 5px solid #f59e0b;
    }

    .persona-card.completo {
      border-left-color: #10b981;
      background: #f0fdf4;
    }

    .persona-cabecera {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .persona-nombre {
      margin: 0;
      font-size: 20px;
    }

    .estado {
      padding: 5px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: bold;
      background: #fef3c7;
      color: #92400e;
      white-space: nowrap;
    }

    .persona-card.completo .estado {
      background: #d1fae5;
      color: #047857;
    }

    .desglose {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 10px;
    }

    .chip {
      background: #f3f4f6;
      color: #4b5563;
      border-radius: 999px;
      padding: 5px 8px;
      font-size: 12px;
    }

    .cantidades {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 14px;
    }

    .cantidad-box {
      text-align: center;
      padding: 10px;
      border-radius: 9px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }

    .cantidad-box strong {
      display: block;
      font-size: 22px;
    }

    .cantidad-box span {
      color: #6b7280;
      font-size: 11px;
    }

    .acciones {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      margin-top: 14px;
    }

    .entregar {
      padding: 13px 15px;
      background: #2563eb;
      color: white;
      font-weight: bold;
      font-size: 15px;
    }

    .entregar:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .deshacer {
      padding: 11px 12px;
      background: #e5e7eb;
      color: #374151;
      font-weight: bold;
      font-size: 12px;
    }

    .deshacer:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    .vacio,
    .error {
      background: white;
      border-radius: 14px;
      padding: 30px 20px;
      text-align: center;
      color: #6b7280;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
    }

    .error {
      color: #b91c1c;
      background: #fef2f2;
    }

    .cargando {
      opacity: .65;
      pointer-events: none;
    }

    @media (max-width: 760px) {
      header {
        align-items: flex-start;
      }

      main {
        padding: 12px;
      }

      .juegos {
        grid-template-columns: repeat(2, 1fr);
      }

      .juego-btn:last-child {
        grid-column: 1 / -1;
      }

      .selector-mesa {
        grid-template-columns: 1fr 1fr;
      }

      .selector-mesa > div {
        grid-column: 1 / -1;
        grid-row: 1;
      }

      .resumen,
      .cantidades {
        grid-template-columns: repeat(3, 1fr);
      }

      .persona-cabecera {
        flex-direction: column;
        gap: 7px;
      }

      .acciones {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>

<body>

<header>
  <div>
    <h1>🎟️ Entrega de Bingos</h1>
    <span>Reparto de cartones por juego y mesa</span>
  </div>

  <a href="/index.html">Volver al inicio</a>
</header>

<main>

  <section class="panel">
    <label>Juego que se está repartiendo</label>

    <div class="juegos" id="juegos">
      <button class="juego-btn" data-juego="Juego 1" onclick="seleccionarJuego('Juego 1')">Juego 1</button>
      <button class="juego-btn" data-juego="Juego 2" onclick="seleccionarJuego('Juego 2')">Juego 2</button>
      <button class="juego-btn" data-juego="Juego 3" onclick="seleccionarJuego('Juego 3')">Juego 3</button>
      <button class="juego-btn" data-juego="Juego 4" onclick="seleccionarJuego('Juego 4')">Juego 4</button>
      <button class="juego-btn" data-juego="Juego Mayor" onclick="seleccionarJuego('Juego Mayor')">Juego Mayor</button>
    </div>
  </section>


  <section class="panel">
    <div class="selector-mesa">
      <button class="mesa-nav" type="button" onclick="cambiarMesa(-1)">← Anterior</button>

      <div>
        <label for="mesa">Mesa</label>
        <select id="mesa" onchange="cambiarMesaSelect()"></select>
      </div>

      <button class="mesa-nav" type="button" onclick="cambiarMesa(1)">Siguiente →</button>
    </div>
  </section>


  <section class="panel" id="panel-resumen">
    <h2 class="titulo-actual" id="titulo-actual">Juego 1 — Mesa 1</h2>
    <div class="actualizacion" id="ultima-actualizacion"></div>

    <div class="resumen">
      <div class="resumen-item">
        <strong id="total-pagados">0</strong>
        <span>Pagados</span>
      </div>

      <div class="resumen-item">
        <strong id="total-entregados">0</strong>
        <span>Entregados</span>
      </div>

      <div class="resumen-item pendientes-grande">
        <strong id="total-pendientes">0</strong>
        <span>Por entregar</span>
      </div>
    </div>
  </section>


  <section class="lista-personas" id="lista-personas">
    <div class="vacio">Cargando...</div>
  </section>

</main>


<script>
  const JUEGOS = [
    "Juego 1",
    "Juego 2",
    "Juego 3",
    "Juego 4",
    "Juego Mayor"
  ];

  let juegoActual =
    localStorage.getItem("entrega-bingo-juego") ||
    "Juego 1";

  let mesaActual =
    Number(localStorage.getItem("entrega-bingo-mesa")) ||
    1;

  let cargando = false;
  let accionando = false;


  function cargarMesas() {
    const select = document.getElementById("mesa");
    select.innerHTML = "";

    for (let i = 1; i <= 50; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = "Mesa " + i;
      select.appendChild(option);
    }

    select.value = String(mesaActual);
  }


  function marcarJuegoActivo() {
    document.querySelectorAll(".juego-btn").forEach(boton => {
      boton.classList.toggle(
        "activo",
        boton.dataset.juego === juegoActual
      );
    });
  }


  function seleccionarJuego(juego) {
    if (!JUEGOS.includes(juego)) {
      return;
    }

    juegoActual = juego;
    localStorage.setItem("entrega-bingo-juego", juegoActual);
    marcarJuegoActivo();
    cargarEntrega(true);
  }


  function cambiarMesaSelect() {
    const valor = Number(document.getElementById("mesa").value);

    if (!Number.isInteger(valor) || valor < 1 || valor > 50) {
      return;
    }

    mesaActual = valor;
    localStorage.setItem("entrega-bingo-mesa", String(mesaActual));
    cargarEntrega(true);
  }


  function cambiarMesa(cambio) {
    const nueva = mesaActual + cambio;

    if (nueva < 1 || nueva > 50) {
      return;
    }

    mesaActual = nueva;
    localStorage.setItem("entrega-bingo-mesa", String(mesaActual));
    document.getElementById("mesa").value = String(mesaActual);
    cargarEntrega(true);
  }


  function actualizarCabecera(datos) {
    document.getElementById("titulo-actual").textContent =
      `${juegoActual} — Mesa ${mesaActual}`;

    document.getElementById("total-pagados").textContent =
      Number(datos?.resumen?.pagados || 0);

    document.getElementById("total-entregados").textContent =
      Number(datos?.resumen?.entregados || 0);

    document.getElementById("total-pendientes").textContent =
      Number(datos?.resumen?.pendientes || 0);

    document.getElementById("ultima-actualizacion").textContent =
      "Actualizado " +
      new Date().toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
  }


  function renderPersonas(personas) {
    const contenedor = document.getElementById("lista-personas");
    contenedor.innerHTML = "";

    if (!Array.isArray(personas) || personas.length === 0) {
      contenedor.innerHTML = `
        <div class="vacio">
          No hay bingos pagados para <strong>${juegoActual}</strong>
          en la Mesa ${mesaActual}.
        </div>
      `;
      return;
    }

    personas.forEach(persona => {
      const card = document.createElement("article");
      card.className = "persona-card" + (persona.completo ? " completo" : "");

      const cabecera = document.createElement("div");
      cabecera.className = "persona-cabecera";

      const nombre = document.createElement("h3");
      nombre.className = "persona-nombre";
      nombre.textContent = persona.nombre || "Sin nombre";

      const estado = document.createElement("span");
      estado.className = "estado";
      estado.textContent = persona.completo
        ? "✅ COMPLETO"
        : `🎟️ ${persona.pendientes} pendiente${persona.pendientes === 1 ? "" : "s"}`;

      cabecera.appendChild(nombre);
      cabecera.appendChild(estado);
      card.appendChild(cabecera);

      const desglose = document.createElement("div");
      desglose.className = "desglose";

      if (Number(persona.preventa || 0) > 0) {
        const chipPreventa = document.createElement("span");
        chipPreventa.className = "chip";
        chipPreventa.textContent = `Preventa: ${persona.preventa}`;
        desglose.appendChild(chipPreventa);
      }

      if (Number(persona.directos || 0) > 0) {
        const chipDirectos = document.createElement("span");
        chipDirectos.className = "chip";
        chipDirectos.textContent = `Compra directa: ${persona.directos}`;
        desglose.appendChild(chipDirectos);
      }

      card.appendChild(desglose);

      const cantidades = document.createElement("div");
      cantidades.className = "cantidades";

      [
        ["Pagados", persona.pagados],
        ["Entregados", persona.entregados],
        ["Pendientes", persona.pendientes]
      ].forEach(([etiqueta, valor]) => {
        const caja = document.createElement("div");
        caja.className = "cantidad-box";

        const fuerte = document.createElement("strong");
        fuerte.textContent = Number(valor || 0);

        const texto = document.createElement("span");
        texto.textContent = etiqueta;

        caja.appendChild(fuerte);
        caja.appendChild(texto);
        cantidades.appendChild(caja);
      });

      card.appendChild(cantidades);

      const acciones = document.createElement("div");
      acciones.className = "acciones";

      const entregar = document.createElement("button");
      entregar.className = "entregar";
      entregar.type = "button";
      entregar.disabled = Number(persona.pendientes || 0) <= 0;
      entregar.textContent = persona.pendientes > 0
        ? `✓ Entregar ${persona.pendientes}`
        : "✓ Todo entregado";
      entregar.onclick = () => entregarPersona(persona);

      const deshacer = document.createElement("button");
      deshacer.className = "deshacer";
      deshacer.type = "button";
      deshacer.disabled = Number(persona.entregados || 0) <= 0;
      deshacer.textContent = "↩ Deshacer última";
      deshacer.onclick = () => deshacerUltima(persona);

      acciones.appendChild(entregar);
      acciones.appendChild(deshacer);
      card.appendChild(acciones);

      contenedor.appendChild(card);
    });
  }


  async function cargarEntrega(forzar = false) {
    if (cargando && !forzar) {
      return;
    }

    cargando = true;

    const lista = document.getElementById("lista-personas");

    try {
      const respuesta = await fetch(
        "/.netlify/functions/entregas-bingo" +
        `?juego=${encodeURIComponent(juegoActual)}` +
        `&mesa=${mesaActual}` +
        `&t=${Date.now()}`,
        { cache: "no-store" }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo cargar la entrega.");
      }

      actualizarCabecera(datos);
      renderPersonas(datos.personas);
    } catch (error) {
      console.error(error);
      lista.innerHTML = `
        <div class="error">
          ❌ ${String(error.message || "No se pudo cargar la entrega.")}
        </div>
      `;
    } finally {
      cargando = false;
    }
  }


  async function entregarPersona(persona) {
    if (accionando || Number(persona.pendientes || 0) <= 0) {
      return;
    }

    const confirmar = confirm(
      `¿Entregar ${persona.pendientes} cartón(es) de ${juegoActual} a ${persona.nombre}?`
    );

    if (!confirmar) {
      return;
    }

    accionando = true;
    document.body.classList.add("cargando");

    try {
      const respuesta = await fetch(
        "/.netlify/functions/entregas-bingo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            accion: "entregar",
            juego: juegoActual,
            mesa: mesaActual,
            personaClave: persona.clave,
            cantidad: persona.pendientes
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo registrar la entrega.");
      }

      await cargarEntrega(true);
    } catch (error) {
      console.error(error);
      alert("❌ " + error.message);
      await cargarEntrega(true);
    } finally {
      accionando = false;
      document.body.classList.remove("cargando");
    }
  }


  async function deshacerUltima(persona) {
    if (accionando || Number(persona.entregados || 0) <= 0) {
      return;
    }

    const confirmar = confirm(
      `¿Deshacer la última entrega de ${juegoActual} para ${persona.nombre}?`
    );

    if (!confirmar) {
      return;
    }

    accionando = true;
    document.body.classList.add("cargando");

    try {
      const respuesta = await fetch(
        "/.netlify/functions/entregas-bingo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            accion: "deshacer-ultima",
            juego: juegoActual,
            mesa: mesaActual,
            personaClave: persona.clave
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo deshacer la entrega.");
      }

      await cargarEntrega(true);
    } catch (error) {
      console.error(error);
      alert("❌ " + error.message);
      await cargarEntrega(true);
    } finally {
      accionando = false;
      document.body.classList.remove("cargando");
    }
  }


  cargarMesas();
  marcarJuegoActivo();
  cargarEntrega(true);

  setInterval(
    () => cargarEntrega(false),
    3000
  );
</script>

</body>
</html>
