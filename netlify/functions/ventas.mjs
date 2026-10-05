import { getStore } from "@netlify/blobs";


const ventasStore = getStore({
  name: "ventas-bingo",
  consistency: "strong"
});

const personasStore = getStore({
  name: "personas-bingo",
  consistency: "strong"
});


const PRECIO_PREVENTA =
  10000;


/* =========================
   CÓDIGOS
========================= */

function normalizarCodigo(codigo) {

  return String(
    codigo || ""
  )
    .trim()
    .toUpperCase();
}


function generarCodigo() {

  const caracteres =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let codigo = "";


  for (
    let i = 0;
    i < 5;
    i++
  ) {

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
    "No se pudo generar código de preventa."
  );
}


/* =========================
   TIPO DE ONCE
========================= */

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


/* =========================
   BENEFICIOS PREVENTA
========================= */

function crearBeneficios(
  cantidad,
  tipoOnce
) {

  return {

    juegos: [

      {
        nombre:
          "Juego 1",

        cantidad
      },

      {
        nombre:
          "Juego 2",

        cantidad
      },

      {
        nombre:
          "Juego 3",

        cantidad
      },

      {
        nombre:
          "Juego 4",

        cantidad
      },

      {
        nombre:
          "Juego Mayor",

        cantidad
      }

    ],

    once: {

      cantidad,

      tipo:
        tipoOnce,

      estado:
        "pendiente"
    }

  };
}


/* =========================
   CANTIDAD DE PREVENTAS
   DE UNA VENTA
========================= */

function obtenerCantidadPreventa(
  venta
) {

  if (
    Number.isInteger(
      Number(
        venta?.cantidadPreventas
      )
    ) &&
    Number(
      venta.cantidadPreventas
    ) > 0
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

    const producto =
      venta.productos.find(
        p =>
          String(
            p.nombre || ""
          )
            .trim()
            .toLowerCase() ===
          "preventa"
      );


    if (
      producto &&
      Number(
        producto.cantidad
      ) > 0
    ) {

      return Number(
        producto.cantidad
      );
    }
  }


  return 1;
}


/* =========================
   FUNCIÓN PRINCIPAL
========================= */

export default async (req) => {

  try {


    /* =========================
       POST
    ========================= */

    if (
      req.method ===
      "POST"
    ) {

      const datos =
        await req.json();


      const tipoVenta =
        datos.tipoVenta ===
          "preventa"

          ? "preventa"

          : "normal";



      /* =========================
         VENTA NORMAL
      ========================= */

      if (
        tipoVenta ===
        "normal"
      ) {

        const mesa =
          Number(
            datos.mesa
          );


        const nombre =
          String(
            datos.nombre || ""
          ).trim();


        const total =
          Number(
            datos.total
          );


        if (
          !Number.isInteger(mesa) ||
          mesa < 1 ||
          mesa > 50 ||
          !nombre ||
          !datos.metodoPago ||
          !Array.isArray(
            datos.productos
          ) ||
          datos.productos.length ===
            0 ||
          total <= 0
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


        const id =
          crypto.randomUUID();


        const venta = {

          id,

          tipoVenta:
            "normal",

          mesa,

          clienteId:
            datos.clienteId ||
            null,

          nombre,

          metodoPago:
            datos.metodoPago,

          productos:
            datos.productos,

          total,

          fecha:
            new Date()
              .toISOString()

        };


        await ventasStore.setJSON(
          id,
          venta
        );


        return Response.json({
          ok: true,
          venta
        });
      }



      /* =========================
         PREVENTA
      ========================= */

      const nombre =
        String(
          datos.nombre || ""
        ).trim();


      const cantidadPreventas =
        Number(
          datos.cantidadPreventas ||
          obtenerCantidadPreventa(
            datos
          ) ||
          1
        );


      const tipoOnce =
        normalizarTipoOnce(
          datos.tipoOnce
        );


      if (
        !nombre ||
        !datos.metodoPago ||
        !tipoOnce ||
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



      let persona =
        null;


      let personaNueva =
        false;



      /* =========================
         AGREGAR A UNA CUENTA
         EXISTENTE
      ========================= */

      if (
        datos.clienteId
      ) {

        persona =
          await personasStore.get(
            datos.clienteId,
            {
              type: "json"
            }
          );


        if (!persona) {

          return Response.json(
            {
              error:
                "No se encontró la persona seleccionada."
            },
            {
              status: 404
            }
          );
        }


        if (
          !persona.codigoPreventa
        ) {

          persona.codigoPreventa =
            await crearCodigoUnico();
        }


        persona.tipo =
          "preventa";


        if (
          persona.tipoOnce &&
          persona.tipoOnce !== tipoOnce
        ) {

          return Response.json(
            {
              error:
                "Esta persona ya tiene registrada una Once " +
                persona.tipoOnce +
                ". Usa el mismo tipo para mantener su cuenta consistente."
            },
            {
              status: 409
            }
          );
        }


        persona.tipoOnce =
          tipoOnce;


        persona.onceEstado =
          persona.onceEstado ||
          "pendiente";


        persona.cantidadPreventas =
          Number(
            persona.cantidadPreventas ||
            0
          ) +
          cantidadPreventas;


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


        await personasStore.setJSON(
          persona.id,
          persona
        );



      /* =========================
         NUEVA PERSONA
      ========================= */

      } else {

        const ahora =
          new Date()
            .toISOString();


        const personaId =
          crypto.randomUUID();


        const codigoPreventa =
          await crearCodigoUnico();


        persona = {

          id:
            personaId,

          nombre,

          mesa:
            null,

          tipo:
            "preventa",

          codigoPreventa,

          cantidadPreventas,

          tipoOnce,

          onceEstado:
            "pendiente",

          oncePedidoId:
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
            []

        };


        await personasStore.setJSON(
          persona.id,
          persona
        );


        personaNueva =
          true;
      }



      /* =========================
         GUARDAR VENTA
      ========================= */

      try {

        const ventaId =
          crypto.randomUUID();


        const total =
          PRECIO_PREVENTA *
          cantidadPreventas;


        const venta = {

          id:
            ventaId,

          tipoVenta:
            "preventa",

          mesa:
            persona.mesa ||
            null,

          clienteId:
            persona.id,

          codigoPreventa:
            persona.codigoPreventa,

          nombre:
            persona.nombre,

          metodoPago:
            datos.metodoPago,

          cantidadPreventas,

          tipoOnce,

          productos: [

            {
              id:
                12,

              nombre:
                "Preventa",

              precio:
                PRECIO_PREVENTA,

              cantidad:
                cantidadPreventas,

              subtotal:
                total,

              categoria:
                "preventa"
            },

            {
              id:
                "once-preventa",

              nombre:
                tipoOnce === "vegana"
                  ? "Once vegana"
                  : tipoOnce === "vegetariana"
                    ? "Once vegetariana"
                    : "Once normal",

              precio:
                0,

              cantidad:
                cantidadPreventas,

              subtotal:
                0,

              categoria:
                "comida",

              incluidoEnPreventa:
                true
            }

          ],

          beneficiosPreventa:
            crearBeneficios(
              cantidadPreventas,
              tipoOnce
            ),

          total,

          fecha:
            new Date()
              .toISOString()

        };


        await ventasStore.setJSON(
          ventaId,
          venta
        );


        return Response.json({

          ok:
            true,

          venta,

          persona

        });


      } catch (errorVenta) {


        /*
          Si era una persona nueva
          y la venta falla, eliminamos
          la cuenta para evitar una
          preventa fantasma.
        */

        if (personaNueva) {

          await personasStore.delete(
            persona.id
          );


        } else {


          /*
            Si la persona ya existía,
            deshacemos el aumento de
            preventas.
          */

          persona.cantidadPreventas =
            Math.max(
              0,

              Number(
                persona.cantidadPreventas ||
                0
              ) -
              cantidadPreventas
            );


          await personasStore.setJSON(
            persona.id,
            persona
          );
        }


        throw errorVenta;
      }
    }



    /* =========================
       GET
    ========================= */

    if (
      req.method ===
      "GET"
    ) {

      const lista =
        await ventasStore.list();


      const ventas =
        [];


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
       PUT
       EDITAR VENTA
    ========================= */

    if (
      req.method ===
      "PUT"
    ) {

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



      /* =========================
         EDITAR PREVENTA
      ========================= */

      if (
        anterior.tipoVenta ===
        "preventa"
      ) {

        const cantidadAnterior =
          obtenerCantidadPreventa(
            anterior
          );


        const cantidadNueva =
          Number(
            datos.cantidadPreventas ||
            obtenerCantidadPreventa(
              datos
            )
          );


        if (
          !Number.isInteger(
            cantidadNueva
          ) ||
          cantidadNueva < 1
        ) {

          return Response.json(
            {
              error:
                "Cantidad de preventas inválida."
            },
            {
              status: 400
            }
          );
        }


        const diferencia =
          cantidadNueva -
          cantidadAnterior;


        const persona =
          anterior.clienteId

            ? await personasStore.get(
                anterior.clienteId,
                {
                  type: "json"
                }
              )

            : null;


        if (persona) {

          persona.cantidadPreventas =
            Math.max(
              0,

              Number(
                persona.cantidadPreventas ||
                0
              ) +
              diferencia
            );


          if (
            datos.nombre !==
            undefined
          ) {

            persona.nombre =
              String(
                datos.nombre
              ).trim();
          }


          await personasStore.setJSON(
            persona.id,
            persona
          );
        }


        const tipoOnceActual =
          normalizarTipoOnce(
            datos.tipoOnce ||
            anterior.tipoOnce ||
            persona?.tipoOnce ||
            anterior.beneficiosPreventa?.once?.tipo ||
            "normal"
          ) ||
          "normal";


        const total =
          PRECIO_PREVENTA *
          cantidadNueva;


        const actualizada = {

          ...anterior,

          nombre:
            datos.nombre !==
            undefined

              ? String(
                  datos.nombre
                ).trim()

              : anterior.nombre,

          metodoPago:
            datos.metodoPago ||
            anterior.metodoPago,

          cantidadPreventas:
            cantidadNueva,

          tipoOnce:
            tipoOnceActual,

          productos: [

            {
              id:
                12,

              nombre:
                "Preventa",

              precio:
                PRECIO_PREVENTA,

              cantidad:
                cantidadNueva,

              subtotal:
                total,

              categoria:
                "preventa"
            },

            {
              id:
                "once-preventa",

              nombre:
                tipoOnceActual === "vegana"
                  ? "Once vegana"
                  : tipoOnceActual === "vegetariana"
                    ? "Once vegetariana"
                    : "Once normal",

              precio:
                0,

              cantidad:
                cantidadNueva,

              subtotal:
                0,

              categoria:
                "comida",

              incluidoEnPreventa:
                true
            }

          ],

          beneficiosPreventa:
            crearBeneficios(
              cantidadNueva,
              tipoOnceActual
            ),

          total

        };


        await ventasStore.setJSON(
          anterior.id,
          actualizada
        );


        return Response.json({
          ok: true,
          venta: actualizada
        });
      }



      /* =========================
         EDITAR VENTA NORMAL
      ========================= */

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
                producto.precio ||
                0
              ) *
              Number(
                producto.cantidad ||
                0
              )
            ),

          0
        );


      let mesa =
        anterior.mesa;


      if (
        datos.mesa !==
        undefined
      ) {

        mesa =
          Number(
            datos.mesa
          );
      }


      const actualizada = {

        ...anterior,

        mesa,

        nombre:
          datos.nombre !==
          undefined

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
                  producto.precio ||
                  0
                ) *
                Number(
                  producto.cantidad ||
                  0
                )

            })
          ),

        total

      };


      await ventasStore.setJSON(
        anterior.id,
        actualizada
      );


      return Response.json({
        ok: true,
        venta: actualizada
      });
    }



    /* =========================
       DELETE
    ========================= */

    if (
      req.method ===
      "DELETE"
    ) {

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


      if (!venta) {

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



      /* =========================
         SI ES PREVENTA
      ========================= */

      if (
        venta.tipoVenta ===
          "preventa" &&
        venta.clienteId
      ) {

        const persona =
          await personasStore.get(
            venta.clienteId,
            {
              type: "json"
            }
          );


        if (persona) {

          const cantidad =
            obtenerCantidadPreventa(
              venta
            );


          persona.cantidadPreventas =
            Math.max(
              0,

              Number(
                persona.cantidadPreventas ||
                0
              ) -
              cantidad
            );


          /*
            Si ya no tiene ninguna
            preventa, dejamos su cuenta,
            pero deja de ser preventa.
          */

          if (
            persona.cantidadPreventas ===
            0
          ) {

            persona.tipo =
              "sin-preventa";


            persona.codigoPreventa =
              null;
          }


          await personasStore.setJSON(
            persona.id,
            persona
          );
        }
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
