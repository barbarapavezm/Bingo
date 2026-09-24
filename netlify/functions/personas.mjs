import { getStore } from "@netlify/blobs";

const personasStore =
  getStore("personas-bingo");

const ventasStore =
  getStore("ventas-bingo");

const pedidosStore =
  getStore("pedidos-bingo");


function normalizar(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase();
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


async function codigoExiste(codigo) {

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
      persona.codigoPreventa === codigo
    ) {
      return true;
    }
  }

  return false;
}


async function crearCodigoUnico() {

  for (
    let intento = 0;
    intento < 20;
    intento++
  ) {

    const codigo =
      generarCodigo();

    if (
      !(await codigoExiste(codigo))
    ) {
      return codigo;
    }
  }

  throw new Error(
    "No se pudo generar un código único."
  );
}


export default async (req) => {

  try {

    /* =========================
       POST
    ========================= */

    if (req.method === "POST") {

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
          Number(datos.mesa);

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
          ]

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
      ========================= */

      if (
        accion ===
        "crear-preventa"
      ) {

        const nombre =
          String(
            datos.nombre || ""
          ).trim();


        if (!nombre) {

          return Response.json(
            {
              error:
                "Falta el nombre."
            },
            {
              status: 400
            }
          );
        }


        const id =
          crypto.randomUUID();

        const codigoPreventa =
          await crearCodigoUnico();

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

          fechaCreacion:
            ahora,

          asignadoEn:
            null,

          historialMesas:
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


        const lista =
          await personasStore.list();

        let personaEncontrada =
          null;


        for (
          const blob
          of lista.blobs
        ) {

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
            ) === codigo
          ) {

            personaEncontrada =
              persona;

            break;
          }
        }


        if (
          !personaEncontrada
        ) {

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


        if (
          personaEncontrada.mesa
        ) {

          return Response.json(
            {
              error:
                "Esta preventa ya fue asociada a una mesa."
            },
            {
              status: 409
            }
          );
        }


        const ahora =
          new Date()
            .toISOString();


        personaEncontrada.mesa =
          mesa;

        personaEncontrada.asignadoEn =
          ahora;


        if (
          !Array.isArray(
            personaEncontrada.historialMesas
          )
        ) {

          personaEncontrada.historialMesas =
            [];
        }


        personaEncontrada.historialMesas.push({
          desde: null,
          hacia: mesa,
          fecha: ahora,
          motivo: "Asignación de preventa"
        });


        await personasStore.setJSON(
          personaEncontrada.id,
          personaEncontrada
        );


        /* Mover ventas asociadas */

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
              personaEncontrada.id
          ) {

            venta.mesa =
              mesa;


            await ventasStore.setJSON(
              venta.id,
              venta
            );
          }
        }


        return Response.json({
          ok: true,
          persona:
            personaEncontrada
        });
      }



      /* =========================
         CAMBIAR MESA
         ADMINISTRADOR
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


        /* =========================
           MOVER VENTAS
        ========================= */

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


          if (!venta) {
            continue;
          }


          /*
            Forma correcta:
            ventas enlazadas por clienteId.
          */

          if (
            venta.clienteId ===
            persona.id
          ) {

            venta.mesa =
              nuevaMesa;


            await ventasStore.setJSON(
              venta.id,
              venta
            );

            continue;
          }


          /*
            Compatibilidad temporal
            con compras antiguas.

            Si todavía no tienen clienteId,
            pero coinciden nombre + mesa,
            las asociamos a esta cuenta.
          */

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
              venta.id,
              venta
            );
          }
        }


        /* =========================
           MOVER PEDIDOS
        ========================= */

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
              pedido.id,
              pedido
            );

            continue;
          }


          /*
            Compatibilidad con
            pedidos antiguos.
          */

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
              pedido.id,
              pedido
            );
          }
        }


        return Response.json({
          ok: true,
          persona
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

    if (req.method === "GET") {

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


      /* PERSONAS DE UNA MESA */

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


        for (
          const blob
          of lista.blobs
        ) {

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
            String(a.nombre)
              .localeCompare(
                String(b.nombre),
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
            "Falta indicar ID o mesa."
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
          "Error procesando la solicitud."
      },
      {
        status: 500
      }
    );
  }
};
