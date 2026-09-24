import { getStore } from "@netlify/blobs";

const ventasStore =
  getStore({
    name: "ventas-bingo",
    consistency: "strong"
  });

const personasStore =
  getStore({
    name: "personas-bingo",
    consistency: "strong"
  });


/* =========================
   CÓDIGO PREVENTA
========================= */

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
    "No se pudo generar código de preventa."
  );
}


/* =========================
   FUNCIÓN PRINCIPAL
========================= */

export default async (req) => {

  try {

    /* =========================
       CREAR VENTA
    ========================= */

    if (req.method === "POST") {

      const venta =
        await req.json();


      const tipoVenta =
        venta.tipoVenta === "preventa"
          ? "preventa"
          : "normal";


      if (
        !venta.nombre ||
        !venta.metodoPago ||
        !Array.isArray(
          venta.productos
        ) ||
        venta.productos.length === 0 ||
        !venta.total
      ) {

        return Response.json(
          {
            error:
              "Faltan datos de la venta."
          },
          {
            status: 400
          }
        );
      }


      /* =========================
         VENTA NORMAL
      ========================= */

      if (
        tipoVenta ===
        "normal"
      ) {

        const mesa =
          Number(
            venta.mesa
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


        const id =
          crypto.randomUUID();


        const ventaCompleta = {

          id,

          tipoVenta:
            "normal",

          mesa,

          clienteId:
            venta.clienteId ||
            null,

          nombre:
            venta.nombre.trim(),

          metodoPago:
            venta.metodoPago,

          productos:
            venta.productos,

          total:
            Number(
              venta.total
            ),

          fecha:
            new Date()
              .toISOString()

        };


        await ventasStore.setJSON(
          id,
          ventaCompleta
        );


        return Response.json({
          ok: true,
          venta:
            ventaCompleta
        });
      }



      /* =========================
         PREVENTA
      ========================= */

      const personaId =
        crypto.randomUUID();

      const codigoPreventa =
        await crearCodigoUnico();

      const ahora =
        new Date()
          .toISOString();


      const persona = {

        id:
          personaId,

        nombre:
          venta.nombre.trim(),

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


      /*
        Primero creamos la persona.
      */

      await personasStore.setJSON(
        personaId,
        persona
      );


      try {

        const ventaId =
          crypto.randomUUID();


        const ventaCompleta = {

          id:
            ventaId,

          tipoVenta:
            "preventa",

          mesa:
            null,

          clienteId:
            personaId,

          codigoPreventa,

          nombre:
            venta.nombre.trim(),

          metodoPago:
            venta.metodoPago,

          productos:
            venta.productos,

          /*
            Aquí guardamos los
            beneficios incluidos.

            La ONCE todavía NO es
            comida concreta.
          */

          beneficiosPreventa:
            venta.beneficiosPreventa ||
            {
              juegos: [],
              once: {
                cantidad: 1,
                estado: "pendiente"
              }
            },

          total:
            Number(
              venta.total
            ),

          fecha:
            ahora

        };


        await ventasStore.setJSON(
          ventaId,
          ventaCompleta
        );


        return Response.json({

          ok: true,

          venta:
            ventaCompleta,

          persona

        });


      } catch (errorVenta) {

        /*
          Si fallara al guardar la venta,
          borramos la cuenta para no dejar
          una preventa fantasma.
        */

        await personasStore.delete(
          personaId
        );


        throw errorVenta;
      }

    }



    /* =========================
       OBTENER VENTAS
    ========================= */

    if (req.method === "GET") {

      const lista =
        await ventasStore.list();

      const ventas = [];


      for (
        const blob
        of lista.blobs
      ) {

        const venta =
          await ventasStore.get(
            blob.key,
            {
              type: "json"
            }
          );


        if (venta) {
          ventas.push(
            venta
          );
        }
      }


      ventas.sort(
        (a, b) =>
          new Date(
            b.fecha
          ) -
          new Date(
            a.fecha
          )
      );


      return Response.json(
        ventas
      );
    }



    /* =========================
       EDITAR VENTA
    ========================= */

    if (req.method === "PUT") {

      const datos =
        await req.json();


      if (!datos.id) {

        return Response.json(
          {
            error:
              "Falta el ID de la venta."
          },
          {
            status: 400
          }
        );
      }


      const anterior =
        await ventasStore.get(
          datos.id,
          {
            type: "json"
          }
        );


      if (!anterior) {

        return Response.json(
          {
            error:
              "Venta no encontrada."
          },
          {
            status: 404
          }
        );
      }


      const productos =
        Array.isArray(
          datos.productos
        )
          ? datos.productos
          : anterior.productos;


      const total =
        productos.reduce(
          (
            suma,
            producto
          ) =>

            suma +
            (
              Number(
                producto.precio || 0
              ) *
              Number(
                producto.cantidad || 0
              )
            ),

          0
        );


      let mesa =
        anterior.mesa;


      if (
        anterior.tipoVenta !==
          "preventa" &&
        datos.mesa !== undefined
      ) {

        mesa =
          Number(
            datos.mesa
          );
      }


      const ventaActualizada = {

        ...anterior,

        mesa,

        nombre:
          datos.nombre !== undefined
            ? String(
                datos.nombre
              ).trim()
            : anterior.nombre,

        metodoPago:
          datos.metodoPago ||
          anterior.metodoPago,

        productos:
          productos.map(
            producto => ({

              ...producto,

              cantidad:
                Number(
                  producto.cantidad
                ),

              subtotal:
                Number(
                  producto.precio || 0
                ) *
                Number(
                  producto.cantidad || 0
                )

            })
          ),

        total

      };


      await ventasStore.setJSON(
        anterior.id,
        ventaActualizada
      );


      return Response.json({
        ok: true,
        venta:
          ventaActualizada
      });
    }



    /* =========================
       ELIMINAR
    ========================= */

    if (req.method === "DELETE") {

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


      const venta =
        await ventasStore.get(
          id,
          {
            type: "json"
          }
        );


      /*
        Si eliminamos una preventa,
        también eliminamos su cuenta
        y su código.
      */

      if (
        venta &&
        venta.tipoVenta ===
          "preventa" &&
        venta.clienteId
      ) {

        await personasStore.delete(
          venta.clienteId
        );
      }


      await ventasStore.delete(
        id
      );


      return Response.json({
        ok: true
      });
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
      "Error ventas:",
      error
    );


    return Response.json(
      {
        error:
          "Error procesando la venta."
      },
      {
        status: 500
      }
    );
  }
};
