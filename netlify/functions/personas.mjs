import { getStore } from "@netlify/blobs";


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


async function crearCodigoUnico() {

  for (
    let intento = 0;
    intento < 30;
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


/* =========================
   BUSCAR PREVENTA POR CÓDIGO
========================= */

async function buscarPorCodigo(codigo) {

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
   FUNCIÓN PRINCIPAL
========================= */

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
         CREAR PERSONA
         SIN PREVENTA
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
              desde:
                null,

              hacia:
                mesa,

              fecha:
                ahora,

              motivo:
                "Ingreso inicial"
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

          cantidadPreventas,

          activo:
            false,

          llegadaEn:
            null,

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
         A UNA MESA
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
            codigo
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


        /*
          Si ya pertenece a otra mesa,
          no permitimos que la persona
          se cambie sola.

          El cambio debe hacerlo
          administración.
        */

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


        /*
          Al usar correctamente el
          código sabemos que llegó
          al evento.
        */

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


        /*
          Solo registramos la asignación
          si todavía no estaba en esa mesa.
        */

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


        /* =========================
           ACTUALIZAR VENTAS
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


        /* =========================
           ACTUALIZAR PEDIDOS
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


        if (!personaId) {

          return Response.json(
            {
              error:
                "Falta la persona."
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
         CAMBIAR MESA
         ADMIN
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


        /* MOVER VENTAS */

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


          /*
            Compatibilidad con ventas
            antiguas sin clienteId.
          */

          if (
            !venta.clienteId &&
            mesaAnterior &&
            Number(
              venta.mesa
            ) ===
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


        /* MOVER PEDIDOS */

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
              blob.key,
              pedido
            );


            continue;
          }


          if (
            !pedido.clienteId &&
            mesaAnterior &&
            Number(
              pedido.mesa
            ) ===
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


      const tipo =
        url.searchParams.get(
          "tipo"
        );



      /* =========================
         PERSONA POR ID
      ========================= */

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



      /* =========================
         TODAS LAS PREVENTAS
      ========================= */

      if (
        tipo ===
        "preventa"
      ) {

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
            persona.tipo ===
              "preventa" &&
            Number(
              persona.cantidadPreventas ||
              0
            ) > 0
          ) {

            /*
              Compatibilidad con cuentas
              antiguas que todavía no
              tengan estos campos.
            */

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



      /* =========================
         PERSONAS DE MESA
      ========================= */

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
            ) ===
              mesa
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
          "Error procesando la solicitud."
      },
      {
        status: 500
      }
    );
  }
};
