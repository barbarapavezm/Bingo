import { getStore } from "@netlify/blobs";

const JUEGOS_VALIDOS = [
  "Juego 1",
  "Juego 2",
  "Juego 3",
  "Juego 4",
  "Juego Mayor"
];


function normalizar(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function obtenerCantidadPreventa(venta) {

  const directa =
    Number(
      venta?.cantidadPreventas
    );


  if (
    Number.isInteger(directa) &&
    directa > 0
  ) {

    return directa;
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
            producto?.nombre
          ) ===
          "preventa"
      );


    const cantidad =
      Number(
        preventa?.cantidad
      );


    if (
      Number.isInteger(
        cantidad
      ) &&
      cantidad > 0
    ) {

      return cantidad;
    }
  }


  return 1;
}


function clavePersona({
  clienteId,
  nombre,
  mesa
}) {

  if (
    clienteId
  ) {

    return (
      "id:" +
      clienteId
    );
  }


  return (
    "legacy:" +
    (
      Number(mesa) ||
      0
    ) +
    ":" +
    normalizar(
      nombre
    )
  );
}


async function cargarPersonas(
  personasStore
) {

  const lista =
    await personasStore.list();


  const mapa =
    new Map();


  for (
    const blob
    of lista.blobs
  ) {

    const persona =
      await personasStore.get(
        blob.key,
        {
          type:
            "json"
        }
      );


    if (
      persona?.id
    ) {

      mapa.set(
        persona.id,
        persona
      );
    }
  }


  return mapa;
}


async function calcularDerechos({

  juego,
  mesa,
  ventasStore,
  personasStore,
  entregasStore

}) {

  const personas =
    await cargarPersonas(
      personasStore
    );


  const listaVentas =
    await ventasStore.list();


  const acumulado =
    new Map();


  function asegurarRegistro({

    clienteId,
    nombre,
    mesaActual

  }) {

    const clave =
      clavePersona({

        clienteId,

        nombre,

        mesa:
          mesaActual

      });


    if (
      !acumulado.has(
        clave
      )
    ) {

      acumulado.set(

        clave,

        {

          clave,

          clienteId:
            clienteId ||
            null,

          nombre:
            nombre ||
            "Sin nombre",

          mesa:
            Number(
              mesaActual
            ) ||
            null,

          preventa:
            0,

          directos:
            0

        }

      );
    }


    return acumulado.get(
      clave
    );
  }


  /*
    Recorremos todas las ventas.
  */

  for (
    const blob
    of listaVentas.blobs
  ) {

    const venta =
      await ventasStore.get(
        blob.key,
        {
          type:
            "json"
        }
      );


    if (
      !venta
    ) {

      continue;
    }


    const persona =
      venta.clienteId

        ? personas.get(
            venta.clienteId
          )

        : null;


    const mesaActual =
      Number(

        persona?.mesa ??

        venta.mesa ??

        0

      );


    const nombreActual =
      String(

        persona?.nombre ??

        venta.nombre ??

        "Sin nombre"

      ).trim();


    const clienteId =

      persona?.id ??

      venta.clienteId ??

      null;


    /*
      Si todavía no tiene mesa,
      no se puede repartir.
    */

    if (
      !Number.isInteger(
        mesaActual
      ) ||
      mesaActual < 1 ||
      mesaActual > 50
    ) {

      continue;
    }


    /*
      PREVENTAS

      Cada preventa incluye:

      Juego 1
      Juego 2
      Juego 3
      Juego 4
      Juego Mayor

      El Pack Once NO se cuenta
      porque corresponde a comida.
    */

    if (
      venta.tipoVenta ===
      "preventa"
    ) {

      const cantidad =
        obtenerCantidadPreventa(
          venta
        );


      if (
        cantidad > 0
      ) {

        const registro =
          asegurarRegistro({

            clienteId,

            nombre:
              nombreActual,

            mesaActual

          });


        registro.preventa +=
          cantidad;
      }


      continue;
    }


    /*
      VENTAS NORMALES
    */

    if (
      !Array.isArray(
        venta.productos
      )
    ) {

      continue;
    }


    const cantidadJuego =
      venta.productos.reduce(

        (
          total,
          producto
        ) => {

          if (
            normalizar(
              producto?.nombre
            ) !==
            normalizar(
              juego
            )
          ) {

            return total;
          }


          const cantidad =
            Number(
              producto?.cantidad ||
              0
            );


          return (

            total +

            (
              Number.isFinite(
                cantidad
              ) &&
              cantidad > 0

                ? cantidad

                : 0
            )

          );
        },

        0

      );


    if (
      cantidadJuego > 0
    ) {

      const registro =
        asegurarRegistro({

          clienteId,

          nombre:
            nombreActual,

          mesaActual

        });


      registro.directos +=
        cantidadJuego;
    }
  }


  /*
    Revisamos cuántos cartones
    ya fueron entregados.
  */

  const listaEntregas =
    await entregasStore.list();


  const entregadosPorClave =
    new Map();


  for (
    const blob
    of listaEntregas.blobs
  ) {

    const entrega =
      await entregasStore.get(
        blob.key,
        {
          type:
            "json"
        }
      );


    if (
      !entrega ||
      entrega.juego !==
        juego
    ) {

      continue;
    }


    const cantidad =
      Number(
        entrega.cantidad ||
        0
      );


    if (
      !entrega.personaClave ||
      !Number.isFinite(
        cantidad
      ) ||
      cantidad <= 0
    ) {

      continue;
    }


    entregadosPorClave.set(

      entrega.personaClave,

      (
        entregadosPorClave.get(
          entrega.personaClave
        ) ||
        0
      ) +
      cantidad

    );
  }


  /*
    Filtramos solo la mesa
    seleccionada.
  */

  const personasMesa =

    Array.from(
      acumulado.values()
    )

      .filter(
        registro =>
          registro.mesa ===
          mesa
      )

      .map(
        registro => {

          const pagados =

            registro.preventa +

            registro.directos;


          const entregados =

            entregadosPorClave.get(
              registro.clave
            ) ||

            0;


          const pendientes =

            Math.max(

              0,

              pagados -
              entregados

            );


          return {

            ...registro,

            pagados,

            entregados,

            pendientes,

            completo:

              pendientes === 0 &&
              pagados > 0

          };
        }
      )

      .filter(
        registro =>
          registro.pagados >
          0
      )

      .sort(
        (
          a,
          b
        ) =>

          a.nombre.localeCompare(
            b.nombre,
            "es"
          )
      );


  const resumen =
    personasMesa.reduce(

      (
        acc,
        persona
      ) => {

        acc.pagados +=
          persona.pagados;


        acc.entregados +=
          persona.entregados;


        acc.pendientes +=
          persona.pendientes;


        return acc;
      },

      {

        pagados:
          0,

        entregados:
          0,

        pendientes:
          0

      }

    );


  return {

    juego,

    mesa,

    resumen,

    personas:
      personasMesa

  };
}


async function obtenerUltimaEntrega({

  juego,
  personaClave,
  entregasStore

}) {

  const lista =
    await entregasStore.list();


  const coincidencias =
    [];


  for (
    const blob
    of lista.blobs
  ) {

    const entrega =
      await entregasStore.get(
        blob.key,
        {
          type:
            "json"
        }
      );


    if (
      entrega &&
      entrega.juego ===
        juego &&
      entrega.personaClave ===
        personaClave &&
      Number(
        entrega.cantidad ||
        0
      ) > 0
    ) {

      coincidencias.push({

        key:
          blob.key,

        entrega

      });
    }
  }


  coincidencias.sort(
    (
      a,
      b
    ) =>

      new Date(
        b.entrega.fecha ||
        0
      ) -

      new Date(
        a.entrega.fecha ||
        0
      )
  );


  return (
    coincidencias[0] ||
    null
  );
}


/* =====================================================
   FUNCIÓN PRINCIPAL
===================================================== */

export default async (req) => {

  try {

    /*
      IMPORTANTE:

      Los stores se crean dentro
      de cada ejecución para evitar
      reutilizar tokens expirados.
    */

    const ventasStore =
      getStore({

        name:
          "ventas-bingo",

        consistency:
          "strong"

      });


    const personasStore =
      getStore({

        name:
          "personas-bingo",

        consistency:
          "strong"

      });


    const entregasStore =
      getStore({

        name:
          "entregas-bingo",

        consistency:
          "strong"

      });


    /* =================================================
       GET
    ================================================= */

    if (
      req.method ===
      "GET"
    ) {

      const url =
        new URL(
          req.url
        );


      const juego =
        String(
          url.searchParams.get(
            "juego"
          ) ||
          ""
        ).trim();


      const mesa =
        Number(
          url.searchParams.get(
            "mesa"
          )
        );


      if (
        !JUEGOS_VALIDOS.includes(
          juego
        )
      ) {

        return Response.json(

          {
            error:
              "Juego inválido."
          },

          {
            status:
              400
          }

        );
      }


      if (
        !Number.isInteger(
          mesa
        ) ||
        mesa < 1 ||
        mesa > 50
      ) {

        return Response.json(

          {
            error:
              "Mesa inválida."
          },

          {
            status:
              400
          }

        );
      }


      const resultado =
        await calcularDerechos({

          juego,

          mesa,

          ventasStore,

          personasStore,

          entregasStore

        });


      return Response.json(
        resultado
      );
    }


    /* =================================================
       POST
    ================================================= */

    if (
      req.method ===
      "POST"
    ) {

      const datos =
        await req.json();


      const accion =
        String(
          datos.accion ||
          ""
        ).trim();


      const juego =
        String(
          datos.juego ||
          ""
        ).trim();


      const mesa =
        Number(
          datos.mesa
        );


      const personaClave =
        String(
          datos.personaClave ||
          ""
        ).trim();


      if (
        !JUEGOS_VALIDOS.includes(
          juego
        )
      ) {

        return Response.json(

          {
            error:
              "Juego inválido."
          },

          {
            status:
              400
          }

        );
      }


      if (
        !Number.isInteger(
          mesa
        ) ||
        mesa < 1 ||
        mesa > 50
      ) {

        return Response.json(

          {
            error:
              "Mesa inválida."
          },

          {
            status:
              400
          }

        );
      }


      if (
        !personaClave
      ) {

        return Response.json(

          {
            error:
              "Falta identificar a la persona."
          },

          {
            status:
              400
          }

        );
      }


      /* =================================================
         ENTREGAR
      ================================================= */

      if (
        accion ===
        "entregar"
      ) {

        /*
          Recalculamos justo antes de guardar
          para reducir el riesgo de una entrega
          duplicada desde una pantalla vieja.
        */

        const estado =
          await calcularDerechos({

            juego,

            mesa,

            ventasStore,

            personasStore,

            entregasStore

          });


        const persona =
          estado.personas.find(
            item =>
              item.clave ===
              personaClave
          );


        if (
          !persona
        ) {

          return Response.json(

            {
              error:
                "La persona ya no tiene bingos pagados en esta mesa."
            },

            {
              status:
                404
            }

          );
        }


        if (
          persona.pendientes <=
          0
        ) {

          return Response.json(

            {
              error:
                "Esta persona ya tiene todos sus cartones entregados."
            },

            {
              status:
                409
            }

          );
        }


        const solicitada =

          datos.cantidad ===
          undefined

            ? persona.pendientes

            : Number(
                datos.cantidad
              );


        if (
          !Number.isInteger(
            solicitada
          ) ||
          solicitada < 1
        ) {

          return Response.json(

            {
              error:
                "Cantidad inválida."
            },

            {
              status:
                400
            }

          );
        }


        const cantidad =
          Math.min(

            solicitada,

            persona.pendientes

          );


        const id =
          crypto.randomUUID();


        const fecha =
          new Date()
            .toISOString();


        const clave =
          "entrega-" +
          Date.now() +
          "-" +
          id;


        const entrega = {

          id,

          personaClave:
            persona.clave,

          clienteId:
            persona.clienteId,

          nombre:
            persona.nombre,

          mesa,

          juego,

          cantidad,

          fecha

        };


        await entregasStore.setJSON(
          clave,
          entrega
        );


        return Response.json({

          ok:
            true,

          entrega

        });
      }


      /* =================================================
         DESHACER ÚLTIMA ENTREGA
      ================================================= */

      if (
        accion ===
        "deshacer-ultima"
      ) {

        const ultima =
          await obtenerUltimaEntrega({

            juego,

            personaClave,

            entregasStore

          });


        if (
          !ultima
        ) {

          return Response.json(

            {
              error:
                "No hay una entrega anterior para deshacer."
            },

            {
              status:
                404
            }

          );
        }


        await entregasStore.delete(
          ultima.key
        );


        return Response.json({

          ok:
            true,

          entregaEliminada:
            ultima.entrega

        });
      }


      return Response.json(

        {
          error:
            "Acción inválida."
        },

        {
          status:
            400
        }

      );
    }


    /* =================================================
       OTROS MÉTODOS
    ================================================= */

    return Response.json(

      {
        error:
          "Método no permitido."
      },

      {
        status:
          405
      }

    );


  } catch (error) {

    console.error(
      "Error entregas-bingo:",
      error
    );


    return Response.json(

      {
        error:

          error?.message ||

          "Error procesando la entrega de bingos."
      },

      {
        status:
          500
      }

    );
  }
};
