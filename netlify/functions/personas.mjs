import { getStore } from "@netlify/blobs";

const personasStore =
  getStore("personas-bingo");

const ventasStore =
  getStore("ventas-bingo");


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

  for (let intento = 0; intento < 20; intento++) {

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
         PERSONA SIN PREVENTA
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
            ahora

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
         ESTA ACCIÓN LA USARÁ
         CAJA DESPUÉS
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
            null

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


        /*
          Si ya tenía mesa asignada,
          evitamos que otra persona
          use el mismo código.
        */

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


        await personasStore.setJSON(
          personaEncontrada.id,
          personaEncontrada
        );


        /* =========================
           ACTUALIZAR LAS VENTAS
           DE ESA PREVENTA
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
       GET PERSONA POR ID
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


      if (!id) {

        return Response.json(
          {
            error:
              "Falta el ID."
          },
          {
            status: 400
          }
        );
      }


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
