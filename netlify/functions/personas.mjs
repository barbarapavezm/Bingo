import { getStore } from "@netlify/blobs";


const PRECIO_PREVENTA = 10000;


/* =========================
   UTILIDADES
========================= */

function normalizar(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase();
}


function normalizarTipoOnce(valor) {

  const tipo =
    String(valor || "")
      .trim()
      .toLowerCase();


  if (
    tipo === "normal" ||
    tipo === "vegetariana" ||
    tipo === "vegana"
  ) {

    return tipo;
  }


  return null;
}


function nombreOnce(tipo) {

  if (tipo === "vegana") {
    return "Once vegana";
  }

  if (tipo === "vegetariana") {
    return "Once vegetariana";
  }

  return "Once normal";
}


function normalizarCodigo(codigo) {
  return String(codigo || "")
    .trim()
    .toUpperCase();
}


function generarCodigo() {

  const caracteres =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let codigo = "";

  for (let i = 0; i < 5; i++) {

    codigo +=
      caracteres[
        Math.floor(
          Math.random() *
          caracteres.length
        )
      ];
  }

  return codigo;
}


async function codigoExiste(codigo, personasStore) {

  const lista =
    await personasStore.list();


  for (const blob of lista.blobs) {

    const persona =
      await personasStore.get(
        blob.key,
        {
          type: "json"
        }
      );


    if (
      persona &&
      normalizarCodigo(
        persona.codigoPreventa
      ) ===
      normalizarCodigo(codigo)
    ) {
      return true;
    }
  }


  return false;
}


async function crearCodigoUnico(personasStore) {

  for (
    let intento = 0;
    intento < 30;
    intento++
  ) {

    const codigo =
      generarCodigo();


    if (
      !(await codigoExiste(codigo, personasStore))
    ) {
      return codigo;
    }
  }


  throw new Error(
    "No se pudo generar un código único."
  );
}


async function buscarPorCodigo(codigo, personasStore) {

  const buscado =
    normalizarCodigo(codigo);


  const lista =
    await personasStore.list();


  for (const blob of lista.blobs) {

    const persona =
      await personasStore.get(
        blob.key,
        {
          type: "json"
        }
      );


    if (
      persona &&
      normalizarCodigo(
        persona.codigoPreventa
      ) === buscado
    ) {
      return persona;
    }
  }


  return null;
}


/* =========================
   PREVENTAS / VENTAS
========================= */

function normalizarTiposOnce(
  valores,
  cantidad,
  fallback = "normal"
) {

  let tipos =
    Array.isArray(valores)
      ? valores
          .map(normalizarTipoOnce)
          .filter(Boolean)
      : [];


  if (
    tipos.length === 0
  ) {

    const tipoFallback =
      normalizarTipoOnce(
        fallback
      ) ||
      "normal";


    tipos =
      Array.from(
        {
          length:
            cantidad
        },
        () =>
          tipoFallback
      );
  }


  if (
    tipos.length !==
    cantidad
  ) {

    return null;
  }


  return tipos;
}


function resumenTipoOnce(tipos) {

  if (
    !Array.isArray(tipos) ||
    tipos.length === 0
  ) {

    return null;
  }


  const primero =
    tipos[0];


  return tipos.every(
    tipo =>
      tipo === primero
  )
    ? primero
    : "mixta";
}


function obtenerCantidadVenta(venta) {

  if (
    Number(venta?.cantidadPreventas) > 0
  ) {

    return Number(
      venta.cantidadPreventas
    );
  }


  if (
    Array.isArray(
      venta?.productos
    )
  ) {

    const preventa =
      venta.productos.find(
        producto =>
          normalizar(
            producto.nombre
          ) === "preventa"
      );


    if (
      preventa &&
      Number(preventa.cantidad) > 0
    ) {

      return Number(
        preventa.cantidad
      );
    }
  }


  return 0;
}


function obtenerTiposOnceVenta(
  venta,
  cantidad = null
) {

  const total =
    cantidad ??
    obtenerCantidadVenta(
      venta
    );


  if (
    Array.isArray(
      venta?.tiposOnce
    )
  ) {

    const tipos =
      normalizarTiposOnce(
        venta.tiposOnce,
        total
      );


    if (tipos) {
      return tipos;
    }
  }


  if (
    Array.isArray(
      venta?.beneficiosPreventa?.once?.tipos
    )
  ) {

    const tipos =
      normalizarTiposOnce(
        venta.beneficiosPreventa.once.tipos,
        total
      );


    if (tipos) {
      return tipos;
    }
  }


  const unico =
    normalizarTipoOnce(
      venta?.tipoOnce ||
      venta?.beneficiosPreventa?.once?.tipo
    );


  if (unico) {

    return Array.from(
      {
        length:
          total
      },
      () =>
        unico
    );
  }


  if (
    Array.isArray(
      venta?.productos
    )
  ) {

    const encontrados =
      [];


    venta.productos.forEach(
      producto => {

        const nombre =
          normalizar(
            producto?.nombre
          );


        let tipo =
          null;


        if (nombre === "once normal") {
          tipo = "normal";
        }


        if (nombre === "once vegetariana") {
          tipo = "vegetariana";
        }


        if (nombre === "once vegana") {
          tipo = "vegana";
        }


        if (tipo) {

          const cantidadProducto =
            Math.max(
              0,
              Number(
                producto?.cantidad ||
                0
              )
            );


          for (
            let i = 0;
            i < cantidadProducto;
            i++
          ) {

            encontrados.push(
              tipo
            );
          }
        }
      }
    );


    if (
      encontrados.length ===
      total
    ) {

      return encontrados;
    }
  }


  return Array.from(
    {
      length:
        total
    },
    () =>
      "normal"
  );
}


function crearBeneficios(
  cantidad,
  tiposOnce
) {

  const tipos =
    normalizarTiposOnce(
      tiposOnce,
      cantidad
    ) ||
    Array.from(
      {
        length:
          cantidad
      },
      () =>
        "normal"
    );


  return {

    juegos: [
      {
        nombre: "Juego 1",
        cantidad
      },
      {
        nombre: "Juego 2",
        cantidad
      },
      {
        nombre: "Juego 3",
        cantidad
      },
      {
        nombre: "Juego 4",
        cantidad
      },
      {
        nombre: "Juego Mayor",
        cantidad
      }
    ],

    once: {
      cantidad,
      tipos,
      estado: "pendiente"
    }

  };
}


function construirProductosPreventa(
  cantidad,
  tiposOnce
) {

  const conteo = {
    normal: 0,
    vegetariana: 0,
    vegana: 0
  };


  tiposOnce.forEach(
    tipo => {

      if (
        conteo[tipo] !==
        undefined
      ) {

        conteo[tipo]++;
      }
    }
  );


  const total =
    cantidad *
    PRECIO_PREVENTA;


  const productos = [
    {
      id: 12,
      nombre: "Preventa",
      precio: PRECIO_PREVENTA,
      cantidad,
      subtotal: total,
      categoria: "preventa"
    }
  ];


  [
    "normal",
    "vegetariana",
    "vegana"
  ].forEach(
    tipo => {

      if (
        conteo[tipo] > 0
      ) {

        productos.push({
          id:
            "once-preventa-" +
            tipo,

          nombre:
            nombreOnce(
              tipo
            ),

          precio:
            0,

          cantidad:
            conteo[tipo],

          subtotal:
            0,

          categoria:
            "comida",

          incluidoEnPreventa:
            true,

          tipoOnce:
            tipo
        });
      }
    }
  );


  return productos;
}


function actualizarCantidadVenta(
  venta,
  cantidad,
  tiposForzados = null
) {

  const total =
    cantidad *
    PRECIO_PREVENTA;


  let tipos =
    tiposForzados;


  if (!tipos) {

    tipos =
      obtenerTiposOnceVenta(
        venta,
        obtenerCantidadVenta(
          venta
        )
      ).slice(
        0,
        cantidad
      );
  }


  tipos =
    normalizarTiposOnce(
      tipos,
      cantidad
    ) ||
    Array.from(
      {
        length:
          cantidad
      },
      () =>
        "normal"
    );


  venta.cantidadPreventas =
    cantidad;


  venta.tiposOnce =
    tipos;


  venta.tipoOnce =
    resumenTipoOnce(
      tipos
    );


  venta.productos =
    construirProductosPreventa(
      cantidad,
      tipos
    );


  venta.beneficiosPreventa =
    crearBeneficios(
      cantidad,
      tipos
    );


  venta.total =
    total;


  return venta;
}


async function obtenerVentasPreventa(
  personaId,
  ventasStore
) {

  const lista =
    await ventasStore.list();


  const ventas =
    [];


  for (const blob of lista.blobs) {

    const venta =
      await ventasStore.get(
        blob.key,
        {
          type: "json"
        }
      );


    if (
      venta &&
      venta.clienteId === personaId &&
      (
        venta.tipoVenta === "preventa" ||
        (
          Array.isArray(
            venta.productos
          ) &&
          venta.productos.some(
            p =>
              normalizar(
                p.nombre
              ) === "preventa"
          )
        )
      )
    ) {

      ventas.push({
        key: blob.key,
        venta
      });
    }
  }


  /*
    Usaremos primero las ventas
    más recientes.
  */

  ventas.sort(
    (a, b) =>
      new Date(
        b.venta.fecha || 0
      ) -
      new Date(
        a.venta.fecha || 0
      )
  );


  return ventas;
}


async function totalPreventasEnVentas(
  personaId,
  ventasStore
) {

  const ventas =
    await obtenerVentasPreventa(
      personaId,
      ventasStore
    );


  return ventas.reduce(
    (total, item) =>
      total +
      obtenerCantidadVenta(
        item.venta
      ),
    0
  );
}


async function sincronizarTiposOncePersona(
  persona,
  ventasStore
) {

  const ventas =
    await obtenerVentasPreventa(
      persona.id,
      ventasStore
    );


  const tipos =
    [];


  let cantidad =
    0;


  for (const item of ventas) {

    const cant =
      obtenerCantidadVenta(
        item.venta
      );


    cantidad +=
      cant;


    tipos.push(
      ...obtenerTiposOnceVenta(
        item.venta,
        cant
      )
    );
  }


  persona.cantidadPreventas =
    cantidad;


  persona.tiposOnce =
    tipos;


  persona.tipoOnce =
    resumenTipoOnce(
      tipos
    );


  if (
    cantidad === 0
  ) {

    persona.tipo =
      "sin-preventa";


    persona.codigoPreventa =
      null;

  } else {

    persona.tipo =
      "preventa";
  }


  return persona;
}


/* =========================
   TRASPASAR VENTAS
   AL DIVIDIR
========================= */

async function traspasarVentas(
  personaOrigen,
  personaDestino,
  cantidad,
  ventasStore
) {

  const ventas =
    await obtenerVentasPreventa(
      personaOrigen.id,
      ventasStore
    );


  const disponibles =
    ventas.reduce(
      (total, item) =>
        total +
        obtenerCantidadVenta(
          item.venta
        ),
      0
    );


  if (
    disponibles < cantidad
  ) {

    throw new Error(
      "No hay suficientes preventas asociadas a ventas para realizar la división."
    );
  }


  let restante =
    cantidad;


  for (const item of ventas) {

    if (restante <= 0) {
      break;
    }


    const venta =
      item.venta;


    const cantidadVenta =
      obtenerCantidadVenta(
        venta
      );


    if (
      cantidadVenta <= 0
    ) {
      continue;
    }


    const mover =
      Math.min(
        restante,
        cantidadVenta
      );


    /*
      Si trasladamos TODA esa venta,
      simplemente cambiamos su dueño.
      El dinero registrado no cambia.
    */

    if (
      mover === cantidadVenta
    ) {

      venta.clienteId =
        personaDestino.id;

      venta.nombre =
        personaDestino.nombre;

      venta.codigoPreventa =
        personaDestino.codigoPreventa;

      venta.divididaDesde =
        personaOrigen.id;

      venta.divisionEn =
        new Date()
          .toISOString();


      await ventasStore.setJSON(
        item.key,
        venta
      );


    } else {

      /*
        Si movemos solo una parte,
        conservamos exactamente el tipo
        de Once de cada preventa.
      */

      const tiposOriginales =
        obtenerTiposOnceVenta(
          venta,
          cantidadVenta
        );


      const tiposMover =
        tiposOriginales.slice(
          0,
          mover
        );


      const tiposQuedan =
        tiposOriginales.slice(
          mover
        );


      const ventaOriginal =
        JSON.parse(
          JSON.stringify(
            venta
          )
        );


      const cantidadOriginal =
        cantidadVenta -
        mover;


      actualizarCantidadVenta(
        venta,
        cantidadOriginal,
        tiposQuedan
      );


      await ventasStore.setJSON(
        item.key,
        venta
      );


      const nuevaVentaId =
        crypto.randomUUID();


      const nuevaVenta = {
        ...ventaOriginal,

        id:
          nuevaVentaId,

        clienteId:
          personaDestino.id,

        nombre:
          personaDestino.nombre,

        codigoPreventa:
          personaDestino.codigoPreventa,

        derivadaDe:
          item.key,

        divididaDesde:
          personaOrigen.id,

        divisionEn:
          new Date()
            .toISOString()
      };


      actualizarCantidadVenta(
        nuevaVenta,
        mover,
        tiposMover
      );


      await ventasStore.setJSON(
        nuevaVentaId,
        nuevaVenta
      );
    }


    restante -=
      mover;
  }
}


/* =========================
   ELIMINAR PREVENTAS
   Y DINERO DE CAJA
========================= */

async function descontarVentas(
  personaId,
  cantidad,
  ventasStore
) {

  const ventas =
    await obtenerVentasPreventa(
      personaId,
      ventasStore
    );


  const disponibles =
    ventas.reduce(
      (total, item) =>
        total +
        obtenerCantidadVenta(
          item.venta
        ),
      0
    );


  if (
    disponibles < cantidad
  ) {

    throw new Error(
      "No hay suficientes ventas asociadas para eliminar esa cantidad."
    );
  }


  let restante =
    cantidad;


  for (const item of ventas) {

    if (restante <= 0) {
      break;
    }


    const cantidadVenta =
      obtenerCantidadVenta(
        item.venta
      );


    if (
      cantidadVenta <= 0
    ) {
      continue;
    }


    const quitar =
      Math.min(
        restante,
        cantidadVenta
      );


    const nuevaCantidad =
      cantidadVenta -
      quitar;


    if (
      nuevaCantidad === 0
    ) {

      await ventasStore.delete(
        item.key
      );


    } else {

      const tiposActuales =
        obtenerTiposOnceVenta(
          item.venta,
          cantidadVenta
        );


      const tiposRestantes =
        tiposActuales.slice(
          0,
          nuevaCantidad
        );


      actualizarCantidadVenta(
        item.venta,
        nuevaCantidad,
        tiposRestantes
      );


      await ventasStore.setJSON(
        item.key,
        item.venta
      );
    }


    restante -=
      quitar;
  }
}


/* =========================
   FUNCIÓN PRINCIPAL
========================= */

export default async (req) => {

  try {

    /*
      IMPORTANTE:
      Los stores se abren dentro de cada ejecución de la Function.
      Así Netlify usa credenciales frescas y no reutilizamos un token
      expirado de una instancia caliente.
    */

    const personasStore = getStore({
      name: "personas-bingo",
      consistency: "strong"
    });

    const ventasStore = getStore({
      name: "ventas-bingo",
      consistency: "strong"
    });

    const pedidosStore = getStore({
      name: "pedidos-bingo",
      consistency: "strong"
    });

    const entregasStore = getStore({
      name: "entregas-bingo",
      consistency: "strong"
    });


    /* =========================
       POST
    ========================= */

    if (
      req.method ===
      "POST"
    ) {

      const datos =
        await req.json();


      const accion =
        datos.accion;



      /* =========================
         CREAR SIN PREVENTA
      ========================= */

      if (
        accion ===
        "crear-sin-preventa"
      ) {

        const mesa =
          Number(
            datos.mesa
          );


        const nombre =
          String(
            datos.nombre || ""
          ).trim();


        if (
          !Number.isInteger(mesa) ||
          mesa < 1 ||
          mesa > 50 ||
          !nombre
        ) {

          return Response.json(
            {
              error:
                "Faltan datos."
            },
            {
              status: 400
            }
          );
        }


        const id =
          crypto.randomUUID();


        const ahora =
          new Date()
            .toISOString();


        const persona = {

          id,

          nombre,

          mesa,

          tipo:
            "sin-preventa",

          codigoPreventa:
            null,

          cantidadPreventas:
            0,

          activo:
            true,

          llegadaEn:
            ahora,

          fechaCreacion:
            ahora,

          asignadoEn:
            ahora,

          historialMesas: [
            {
              desde: null,
              hacia: mesa,
              fecha: ahora,
              motivo: "Ingreso inicial"
            }
          ],

          historialPreventas:
            []

        };


        await personasStore.setJSON(
          id,
          persona
        );


        return Response.json({
          ok: true,
          persona
        });
      }



      /* =========================
         CREAR PREVENTA
         COMPATIBILIDAD
      ========================= */

      if (
        accion ===
        "crear-preventa"
      ) {

        const nombre =
          String(
            datos.nombre || ""
          ).trim();


        const cantidadPreventas =
          Number(
            datos.cantidadPreventas ||
            1
          );


        const tiposOnce =
          normalizarTiposOnce(
            datos.tiposOnce,
            cantidadPreventas,
            datos.tipoOnce
          ) ||
          Array.from(
            {
              length:
                cantidadPreventas
            },
            () =>
              "normal"
          );


        if (
          !nombre ||
          !Number.isInteger(
            cantidadPreventas
          ) ||
          cantidadPreventas < 1
        ) {

          return Response.json(
            {
              error:
                "Datos de preventa inválidos."
            },
            {
              status: 400
            }
          );
        }


        const id =
          crypto.randomUUID();


        const codigoPreventa =
          await crearCodigoUnico(personasStore);


        const ahora =
          new Date()
            .toISOString();


        const persona = {

          id,

          nombre,

          mesa:
            null,

          tipo:
            "preventa",

          codigoPreventa,

          cantidadPreventas,

          tiposOnce,

          tipoOnce:
            resumenTipoOnce(
              tiposOnce
            ),

          activo:
            false,

          llegadaEn:
            null,

          fechaCreacion:
            ahora,

          asignadoEn:
            null,

          historialMesas:
            [],

          historialPreventas:
            []

        };


        await personasStore.setJSON(
          id,
          persona
        );


        return Response.json({
          ok: true,
          persona
        });
      }



      /* =========================
         ASIGNAR PREVENTA
         A MESA
      ========================= */

      if (
        accion ===
        "asignar-preventa"
      ) {

        const codigo =
          normalizarCodigo(
            datos.codigo
          );


        const mesa =
          Number(
            datos.mesa
          );


        if (
          !codigo ||
          !Number.isInteger(mesa) ||
          mesa < 1 ||
          mesa > 50
        ) {

          return Response.json(
            {
              error:
                "Código o mesa inválidos."
            },
            {
              status: 400
            }
          );
        }


        const persona =
          await buscarPorCodigo(
            codigo,
            personasStore
          );


        if (!persona) {

          return Response.json(
            {
              error:
                "Código de preventa no encontrado."
            },
            {
              status: 404
            }
          );
        }


        const mesaAnterior =
          persona.mesa
            ? Number(
                persona.mesa
              )
            : null;


        if (
          mesaAnterior &&
          mesaAnterior !== mesa
        ) {

          return Response.json(
            {
              error:
                "Esta preventa ya está asociada a otra mesa. Solicita el cambio a administración."
            },
            {
              status: 409
            }
          );
        }


        const ahora =
          new Date()
            .toISOString();


        persona.mesa =
          mesa;


        persona.asignadoEn =
          persona.asignadoEn ||
          ahora;


        persona.activo =
          true;


        persona.llegadaEn =
          persona.llegadaEn ||
          ahora;


        if (
          !Array.isArray(
            persona.historialMesas
          )
        ) {

          persona.historialMesas =
            [];
        }


        if (
          mesaAnterior !== mesa
        ) {

          persona.historialMesas.push({

            desde:
              mesaAnterior,

            hacia:
              mesa,

            fecha:
              ahora,

            motivo:
              "Asignación mediante código de preventa"

          });
        }


        await personasStore.setJSON(
          persona.id,
          persona
        );


        /*
          Mover ventas de la persona
          a la mesa elegida.
        */

        const listaVentas =
          await ventasStore.list();


        for (const blob of listaVentas.blobs) {

          const venta =
            await ventasStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (
            venta &&
            venta.clienteId ===
              persona.id
          ) {

            venta.mesa =
              mesa;


            await ventasStore.setJSON(
              blob.key,
              venta
            );
          }
        }


        /*
          Mover pedidos.
        */

        const listaPedidos =
          await pedidosStore.list();


        for (const blob of listaPedidos.blobs) {

          const pedido =
            await pedidosStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (
            pedido &&
            pedido.clienteId ===
              persona.id
          ) {

            pedido.mesa =
              mesa;


            await pedidosStore.setJSON(
              blob.key,
              pedido
            );
          }
        }


        return Response.json({
          ok: true,
          persona
        });
      }



      /* =========================
         ACTIVO / NO ACTIVO
      ========================= */

      if (
        accion ===
        "actualizar-activo"
      ) {

        const personaId =
          String(
            datos.personaId || ""
          ).trim();


        const persona =
          await personasStore.get(
            personaId,
            {
              type: "json"
            }
          );


        if (!persona) {

          return Response.json(
            {
              error:
                "Persona no encontrada."
            },
            {
              status: 404
            }
          );
        }


        const activo =
          datos.activo === true;


        persona.activo =
          activo;


        if (activo) {

          persona.llegadaEn =
            persona.llegadaEn ||
            new Date()
              .toISOString();

        } else {

          persona.llegadaEn =
            null;
        }


        await personasStore.setJSON(
          persona.id,
          persona
        );


        return Response.json({
          ok: true,
          persona
        });
      }



      /* =========================
         EDITAR NOMBRE
      ========================= */

      if (
        accion ===
        "editar-nombre"
      ) {

        const personaId =
          String(
            datos.personaId || ""
          ).trim();


        const nuevoNombre =
          String(
            datos.nombre || ""
          ).trim();


        if (
          !personaId ||
          !nuevoNombre
        ) {

          return Response.json(
            {
              error:
                "Nombre inválido."
            },
            {
              status: 400
            }
          );
        }


        const persona =
          await personasStore.get(
            personaId,
            {
              type: "json"
            }
          );


        if (!persona) {

          return Response.json(
            {
              error:
                "Persona no encontrada."
            },
            {
              status: 404
            }
          );
        }


        persona.nombre =
          nuevoNombre;


        await personasStore.setJSON(
          persona.id,
          persona
        );


        /*
          Corregimos también el nombre
          de todas sus ventas.
        */

        const listaVentas =
          await ventasStore.list();


        for (const blob of listaVentas.blobs) {

          const venta =
            await ventasStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (
            venta &&
            venta.clienteId ===
              persona.id
          ) {

            venta.nombre =
              nuevoNombre;


            await ventasStore.setJSON(
              blob.key,
              venta
            );
          }
        }


        /*
          Y pedidos.
        */

        const listaPedidos =
          await pedidosStore.list();


        for (const blob of listaPedidos.blobs) {

          const pedido =
            await pedidosStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (
            pedido &&
            pedido.clienteId ===
              persona.id
          ) {

            pedido.nombre =
              nuevoNombre;


            await pedidosStore.setJSON(
              blob.key,
              pedido
            );
          }
        }


        return Response.json({
          ok: true,
          persona
        });
      }



      /* =========================
         EDITAR ONCES
      ========================= */

      if (
        accion ===
          "editar-tipo-once" ||
        accion ===
          "editar-tipos-once"
      ) {

        const personaId =
          String(
            datos.personaId || ""
          ).trim();


        const persona =
          await personasStore.get(
            personaId,
            {
              type:
                "json"
            }
          );


        if (!persona) {

          return Response.json(
            {
              error:
                "Persona no encontrada."
            },
            {
              status:
                404
            }
          );
        }


        const cantidadTotal =
          Number(
            persona.cantidadPreventas ||
            0
          );


        let tiposOnce =
          null;


        if (
          accion ===
          "editar-tipos-once"
        ) {

          tiposOnce =
            normalizarTiposOnce(
              datos.tiposOnce,
              cantidadTotal
            );

        } else {

          const tipoOnce =
            normalizarTipoOnce(
              datos.tipoOnce
            );


          if (tipoOnce) {

            tiposOnce =
              Array.from(
                {
                  length:
                    cantidadTotal
                },
                () =>
                  tipoOnce
              );
          }
        }


        if (!tiposOnce) {

          return Response.json(
            {
              error:
                "Debes indicar un tipo de Once válido para cada preventa."
            },
            {
              status:
                400
            }
          );
        }


        const ventas =
          await obtenerVentasPreventa(
            persona.id,
            ventasStore
          );


        let indice =
          0;


        for (const item of ventas) {

          const cantidadVenta =
            obtenerCantidadVenta(
              item.venta
            );


          const tiposVenta =
            tiposOnce.slice(
              indice,
              indice +
              cantidadVenta
            );


          actualizarCantidadVenta(
            item.venta,
            cantidadVenta,
            tiposVenta
          );


          await ventasStore.setJSON(
            item.key,
            item.venta
          );


          indice +=
            cantidadVenta;
        }


        await sincronizarTiposOncePersona(
          persona,
          ventasStore
        );


        await personasStore.setJSON(
          persona.id,
          persona
        );


        return Response.json({
          ok:
            true,
          persona
        });
      }



      /* =========================
         DIVIDIR PREVENTAS
      ========================= */

      if (
        accion ===
        "dividir-preventas"
      ) {

        const personaId =
          String(
            datos.personaId || ""
          ).trim();


        const nuevoNombre =
          String(
            datos.nuevoNombre || ""
          ).trim();


        const cantidad =
          Number(
            datos.cantidad
          );


        if (
          !personaId ||
          !nuevoNombre ||
          !Number.isInteger(cantidad) ||
          cantidad < 1
        ) {

          return Response.json(
            {
              error:
                "Datos inválidos."
            },
            {
              status: 400
            }
          );
        }


        const personaOrigen =
          await personasStore.get(
            personaId,
            {
              type: "json"
            }
          );


        if (!personaOrigen) {

          return Response.json(
            {
              error:
                "Persona no encontrada."
            },
            {
              status: 404
            }
          );
        }


        const cantidadActual =
          Number(
            personaOrigen
              .cantidadPreventas ||
            0
          );


        if (
          cantidad >
          cantidadActual
        ) {

          return Response.json(
            {
              error:
                "La persona no tiene suficientes preventas."
            },
            {
              status: 400
            }
          );
        }


        /*
          Comprobamos ANTES que las
          preventas estén respaldadas
          por las ventas.
        */

        const cantidadVentas =
          await totalPreventasEnVentas(
            personaOrigen.id,
            ventasStore
          );


        if (
          cantidadVentas < cantidad
        ) {

          return Response.json(
            {
              error:
                "No se pudo relacionar esa cantidad con las ventas registradas."
            },
            {
              status: 409
            }
          );
        }


        const ahora =
          new Date()
            .toISOString();


        const nuevaPersona = {

          id:
            crypto.randomUUID(),

          nombre:
            nuevoNombre,

          mesa:
            null,

          tipo:
            "preventa",

          codigoPreventa:
            await crearCodigoUnico(personasStore),

          cantidadPreventas:
            cantidad,

          tiposOnce:
            [],

          tipoOnce:
            null,

          activo:
            false,

          llegadaEn:
            null,

          fechaCreacion:
            ahora,

          asignadoEn:
            null,

          historialMesas:
            [],

          historialPreventas: [
            {
              tipo:
                "recibidas-por-division",

              cantidad,

              desdePersonaId:
                personaOrigen.id,

              fecha:
                ahora
            }
          ]

        };


        /*
          Repartimos primero las ventas.
          El dinero TOTAL no cambia.
        */

        await traspasarVentas(
          personaOrigen,
          nuevaPersona,
          cantidad,
          ventasStore
        );


        await sincronizarTiposOncePersona(
          personaOrigen,
          ventasStore
        );


        await sincronizarTiposOncePersona(
          nuevaPersona,
          ventasStore
        );


        /*
          Restamos las preventas
          a la persona original.
        */


        if (
          !Array.isArray(
            personaOrigen.historialPreventas
          )
        ) {

          personaOrigen.historialPreventas =
            [];
        }


        personaOrigen.historialPreventas.push({

          tipo:
            "division",

          cantidad,

          haciaPersonaId:
            nuevaPersona.id,

          haciaNombre:
            nuevaPersona.nombre,

          fecha:
            ahora

        });


        /*
          Si entregó TODAS sus preventas,
          su código deja de ser válido.
        */

        if (
          personaOrigen.cantidadPreventas ===
          0
        ) {

          personaOrigen.codigoPreventa =
            null;

          personaOrigen.tipo =
            "sin-preventa";
        }


        await personasStore.setJSON(
          personaOrigen.id,
          personaOrigen
        );


        await personasStore.setJSON(
          nuevaPersona.id,
          nuevaPersona
        );


        return Response.json({

          ok:
            true,

          personaOrigen,

          nuevaPersona

        });
      }



      /* =========================
         ELIMINAR PREVENTAS
         VENDIDAS POR ERROR
      ========================= */

      if (
        accion ===
        "eliminar-preventas"
      ) {

        const personaId =
          String(
            datos.personaId || ""
          ).trim();


        const cantidad =
          Number(
            datos.cantidad
          );


        if (
          !personaId ||
          !Number.isInteger(cantidad) ||
          cantidad < 1
        ) {

          return Response.json(
            {
              error:
                "Cantidad inválida."
            },
            {
              status: 400
            }
          );
        }


        const persona =
          await personasStore.get(
            personaId,
            {
              type: "json"
            }
          );


        if (!persona) {

          return Response.json(
            {
              error:
                "Persona no encontrada."
            },
            {
              status: 404
            }
          );
        }


        const cantidadActual =
          Number(
            persona.cantidadPreventas ||
            0
          );


        if (
          cantidad >
          cantidadActual
        ) {

          return Response.json(
            {
              error:
                "No puedes eliminar más preventas de las que tiene."
            },
            {
              status: 400
            }
          );
        }


        /*
          Primero descontamos las ventas.
          Ejemplo:
          4 -> eliminar 1
          $40.000 -> $30.000.
        */

        await descontarVentas(
          persona.id,
          cantidad,
          ventasStore
        );


        const ahora =
          new Date()
            .toISOString();


        await sincronizarTiposOncePersona(
          persona,
          ventasStore
        );


        if (
          !Array.isArray(
            persona.historialPreventas
          )
        ) {

          persona.historialPreventas =
            [];
        }


        persona.historialPreventas.push({

          tipo:
            "eliminacion-error",

          cantidad,

          monto:
            cantidad *
            PRECIO_PREVENTA,

          fecha:
            ahora

        });


        /*
          Si queda en cero,
          deja de aparecer como preventa
          y el código deja de funcionar.
        */

        if (
          persona.cantidadPreventas ===
          0
        ) {

          persona.codigoPreventa =
            null;

          persona.tipo =
            "sin-preventa";
        }


        await personasStore.setJSON(
          persona.id,
          persona
        );


        return Response.json({

          ok:
            true,

          persona,

          cantidadEliminada:
            cantidad,

          montoDescontado:
            cantidad *
            PRECIO_PREVENTA

        });
      }



      /* =========================
         CAMBIAR MESA
      ========================= */

      if (
        accion ===
        "cambiar-mesa"
      ) {

        const personaId =
          String(
            datos.personaId || ""
          ).trim();


        const nuevaMesa =
          Number(
            datos.nuevaMesa
          );


        if (
          !personaId ||
          !Number.isInteger(
            nuevaMesa
          ) ||
          nuevaMesa < 1 ||
          nuevaMesa > 50
        ) {

          return Response.json(
            {
              error:
                "Datos inválidos."
            },
            {
              status: 400
            }
          );
        }


        const persona =
          await personasStore.get(
            personaId,
            {
              type: "json"
            }
          );


        if (!persona) {

          return Response.json(
            {
              error:
                "Persona no encontrada."
            },
            {
              status: 404
            }
          );
        }


        const mesaAnterior =
          persona.mesa
            ? Number(
                persona.mesa
              )
            : null;


        if (
          mesaAnterior ===
          nuevaMesa
        ) {

          return Response.json(
            {
              error:
                "La persona ya está en esa mesa."
            },
            {
              status: 400
            }
          );
        }


        const ahora =
          new Date()
            .toISOString();


        persona.mesa =
          nuevaMesa;


        persona.asignadoEn =
          ahora;


        if (
          !Array.isArray(
            persona.historialMesas
          )
        ) {

          persona.historialMesas =
            [];
        }


        persona.historialMesas.push({

          desde:
            mesaAnterior,

          hacia:
            nuevaMesa,

          fecha:
            ahora,

          motivo:
            "Cambio realizado por administración"

        });


        await personasStore.setJSON(
          persona.id,
          persona
        );


        /*
          Ventas.
        */

        const listaVentas =
          await ventasStore.list();


        for (const blob of listaVentas.blobs) {

          const venta =
            await ventasStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (!venta) {
            continue;
          }


          if (
            venta.clienteId ===
            persona.id
          ) {

            venta.mesa =
              nuevaMesa;


            await ventasStore.setJSON(
              blob.key,
              venta
            );

            continue;
          }


          if (
            !venta.clienteId &&
            mesaAnterior &&
            Number(venta.mesa) ===
              mesaAnterior &&
            normalizar(
              venta.nombre
            ) ===
            normalizar(
              persona.nombre
            )
          ) {

            venta.mesa =
              nuevaMesa;


            venta.clienteId =
              persona.id;


            await ventasStore.setJSON(
              blob.key,
              venta
            );
          }
        }


        /*
          Pedidos.
        */

        const listaPedidos =
          await pedidosStore.list();


        for (const blob of listaPedidos.blobs) {

          const pedido =
            await pedidosStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (!pedido) {
            continue;
          }


          if (
            pedido.clienteId ===
            persona.id
          ) {

            pedido.mesa =
              nuevaMesa;


            await pedidosStore.setJSON(
              blob.key,
              pedido
            );

            continue;
          }


          if (
            !pedido.clienteId &&
            mesaAnterior &&
            Number(pedido.mesa) ===
              mesaAnterior &&
            normalizar(
              pedido.nombre
            ) ===
            normalizar(
              persona.nombre
            )
          ) {

            pedido.mesa =
              nuevaMesa;


            pedido.clienteId =
              persona.id;


            await pedidosStore.setJSON(
              blob.key,
              pedido
            );
          }
        }


        return Response.json({
          ok: true,
          persona
        });
      }



      /* =========================
         ELIMINAR PERSONA COMPLETA
      ========================= */

      if (
        accion ===
        "eliminar-persona"
      ) {

        const personaId =
          String(
            datos.personaId || ""
          ).trim();


        if (!personaId) {

          return Response.json(
            {
              error:
                "Falta identificar a la persona."
            },
            {
              status: 400
            }
          );
        }


        const persona =
          await personasStore.get(
            personaId,
            {
              type: "json"
            }
          );


        if (!persona) {

          return Response.json(
            {
              error:
                "Persona no encontrada."
            },
            {
              status: 404
            }
          );
        }


        let ventasEliminadas = 0;
        let pedidosEliminados = 0;
        let entregasEliminadas = 0;


        const listaVentas =
          await ventasStore.list();


        for (
          const blob
          of listaVentas.blobs
        ) {

          const venta =
            await ventasStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (
            venta &&
            venta.clienteId ===
              personaId
          ) {

            await ventasStore.delete(
              blob.key
            );

            ventasEliminadas++;
          }
        }


        const listaPedidos =
          await pedidosStore.list();


        for (
          const blob
          of listaPedidos.blobs
        ) {

          const pedido =
            await pedidosStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (
            pedido &&
            pedido.clienteId ===
              personaId
          ) {

            await pedidosStore.delete(
              blob.key
            );

            pedidosEliminados++;
          }
        }


        const listaEntregas =
          await entregasStore.list();


        for (
          const blob
          of listaEntregas.blobs
        ) {

          const entrega =
            await entregasStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (
            entrega &&
            entrega.clienteId ===
              personaId
          ) {

            await entregasStore.delete(
              blob.key
            );

            entregasEliminadas++;
          }
        }


        await personasStore.delete(
          personaId
        );


        return Response.json({
          ok: true,

          personaEliminada: {
            id:
              persona.id,

            nombre:
              persona.nombre,

            mesa:
              persona.mesa
          },

          ventasEliminadas,
          pedidosEliminados,
          entregasEliminadas
        });
      }



      return Response.json(
        {
          error:
            "Acción inválida."
        },
        {
          status: 400
        }
      );
    }



    /* =========================
       GET
    ========================= */

    if (
      req.method ===
      "GET"
    ) {

      const url =
        new URL(
          req.url
        );


      const id =
        url.searchParams.get(
          "id"
        );


      const mesaParametro =
        url.searchParams.get(
          "mesa"
        );


      const tipo =
        url.searchParams.get(
          "tipo"
        );



      /* PERSONA POR ID */

      if (id) {

        const persona =
          await personasStore.get(
            id,
            {
              type: "json"
            }
          );


        if (!persona) {

          return Response.json(
            {
              error:
                "Persona no encontrada."
            },
            {
              status: 404
            }
          );
        }


        return Response.json(
          persona
        );
      }



      /* TODAS LAS PREVENTAS */

      if (
        tipo ===
        "preventa"
      ) {

        const lista =
          await personasStore.list();


        const personas =
          [];


        for (const blob of lista.blobs) {

          const persona =
            await personasStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (
            persona &&
            persona.tipo ===
              "preventa" &&
            Number(
              persona.cantidadPreventas ||
              0
            ) > 0
          ) {

            if (
              persona.activo ===
              undefined
            ) {

              persona.activo =
                false;
            }


            if (
              persona.llegadaEn ===
              undefined
            ) {

              persona.llegadaEn =
                null;
            }


            personas.push(
              persona
            );
          }
        }


        personas.sort(
          (a, b) =>
            String(
              a.nombre
            ).localeCompare(
              String(
                b.nombre
              ),
              "es"
            )
        );


        return Response.json(
          personas
        );
      }



      /* PERSONAS DE MESA */

      if (mesaParametro) {

        const mesa =
          Number(
            mesaParametro
          );


        if (
          !Number.isInteger(mesa) ||
          mesa < 1 ||
          mesa > 50
        ) {

          return Response.json(
            {
              error:
                "Mesa inválida."
            },
            {
              status: 400
            }
          );
        }


        const lista =
          await personasStore.list();


        const personas =
          [];


        for (const blob of lista.blobs) {

          const persona =
            await personasStore.get(
              blob.key,
              {
                type: "json"
              }
            );


          if (
            persona &&
            Number(
              persona.mesa
            ) === mesa
          ) {

            personas.push(
              persona
            );
          }
        }


        personas.sort(
          (a, b) =>
            String(
              a.nombre
            ).localeCompare(
              String(
                b.nombre
              ),
              "es"
            )
        );


        return Response.json(
          personas
        );
      }



      return Response.json(
        {
          error:
            "Falta indicar ID, mesa o tipo."
        },
        {
          status: 400
        }
      );
    }



    return Response.json(
      {
        error:
          "Método no permitido."
      },
      {
        status: 405
      }
    );


  } catch (error) {

    console.error(
      "Error personas:",
      error
    );


    return Response.json(
      {
        error:
          error.message ||
          "Error procesando la solicitud."
      },
      {
        status: 500
      }
    );
  }
};