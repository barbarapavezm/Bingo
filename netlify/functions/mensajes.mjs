import { getStore } from "@netlify/blobs";


/* =====================================================
   FUNCIÓN PRINCIPAL
===================================================== */

export default async (req) => {

  try {

    /*
      Importante:
      abrimos el store DENTRO de la función
      para evitar reutilizar tokens expirados.
    */

    const mensajesStore =
      getStore({

        name:
          "chat-bingo",

        consistency:
          "strong"

      });


    /* =================================================
       GET
       CARGAR MENSAJES
    ================================================= */

    if (
      req.method ===
      "GET"
    ) {

      const lista =
        await mensajesStore.list();


      const mensajes =
        [];


      for (
        const blob
        of lista.blobs
      ) {

        const mensaje =
          await mensajesStore.get(
            blob.key,
            {
              type:
                "json"
            }
          );


        if (mensaje) {

          mensajes.push(
            mensaje
          );
        }
      }


      /*
        Ordenamos desde el más antiguo
        al más nuevo.
      */

      mensajes.sort(
        (a, b) =>

          new Date(
            a.fecha ||
            0
          ) -

          new Date(
            b.fecha ||
            0
          )
      );


      /*
        Para que el chat no se vuelva
        pesado, devolvemos solamente
        los últimos 100 mensajes.
      */

      const ultimos =
        mensajes.slice(
          -100
        );


      return Response.json(
        ultimos
      );
    }


    /* =================================================
       POST
       ENVIAR MENSAJE
    ================================================= */

    if (
      req.method ===
      "POST"
    ) {

      const datos =
        await req.json();


      const origen =
        String(
          datos.origen ||
          ""
        ).trim();


      const texto =
        String(
          datos.texto ||
          ""
        ).trim();


      /*
        Solo permitimos los dos
        participantes del chat.
      */

      if (
        origen !==
          "Caja" &&
        origen !==
          "Cocina"
      ) {

        return Response.json(

          {
            error:
              "Origen inválido."
          },

          {
            status:
              400
          }

        );
      }


      if (!texto) {

        return Response.json(

          {
            error:
              "Escribe un mensaje."
          },

          {
            status:
              400
          }

        );
      }


      if (
        texto.length >
        500
      ) {

        return Response.json(

          {
            error:
              "El mensaje es demasiado largo."
          },

          {
            status:
              400
          }

        );
      }


      const id =
        crypto.randomUUID();


      const fecha =
        new Date()
          .toISOString();


      const mensaje = {

        id,

        origen,

        texto,

        fecha

      };


      /*
        La fecha al inicio de la clave
        ayuda a mantener los mensajes
        organizados.
      */

      const clave =
        "mensaje-" +
        Date.now() +
        "-" +
        id;


      await mensajesStore.setJSON(
        clave,
        mensaje
      );


      return Response.json({

        ok:
          true,

        mensaje

      });
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
      "Error chat:",
      error
    );


    return Response.json(

      {
        error:
          error.message ||
          "Error procesando el chat."
      },

      {
        status:
          500
      }

    );
  }
};
