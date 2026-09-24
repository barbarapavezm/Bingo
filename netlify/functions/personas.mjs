import { getStore } from "@netlify/blobs";

const PRECIO_PREVENTA = 10000;


/* =====================================================
   UTILIDADES
===================================================== */

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


async function codigoExiste(
  codigo,
  personasStore
) {

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


async function crearCodigoUnico(
  personasStore
) {

  for (
    let intento = 0;
    intento < 30;
    intento++
  ) {

    const codigo =
      generarCodigo();


    if (
      !(await codigoExiste(
        codigo,
        personasStore
      ))
    ) {

      return codigo;
    }
  }


  throw new Error(
    "No se pudo generar un código único."
  );
}


async function buscarPorCodigo(
  codigo,
  personasStore
) {

  const buscado =
    normalizarCodigo(
      codigo
    );


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


/* =====================================================
   PREVENTAS
===================================================== */

function crearBeneficios(
  cantidad
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

      estado:
        "pendiente"

    }

  };
}


function obtenerCantidadVenta(
  venta
) {

  if (
    Number(
      venta?.cantidadPreventas
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

    const preventa =
      venta.productos.find(
        producto =>
          normalizar(
            producto.nombre
          ) ===
          "preventa"
      );


    if (
      preventa &&
      Number(
        preventa.cantidad
      ) > 0
    ) {

      return Number(
        preventa.cantidad
      );
    }
  }


  return 0;
}


function actualizarCantidadVenta(
  venta,
  cantidad
) {

  const total =
    cantidad *
    PRECIO_PREVENTA;


  venta.cantidadPreventas =
    cantidad;


  venta.productos = [

    {

      id:
        12,

      nombre:
        "Preventa",

      precio:
        PRECIO_PREVENTA,

      cantidad,

      subtotal:
        total,

      categoria:
        "preventa"

    }

  ];


  venta.beneficiosPreventa =
    crearBeneficios(
      cantidad
    );


  venta.total =
    total;


  return venta;
}


/* =====================================================
   OBTENER VENTAS DE PREVENTA
===================================================== */

async function obtenerVentasPreventa(
  personaId,
  ventasStore
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
          type:
            "json"
        }
      );


    if (
      venta &&
      venta.clienteId ===
        personaId &&
      (
        venta.tipoVenta ===
          "preventa" ||

        (
          Array.isArray(
            venta.productos
          ) &&

          venta.productos.some(
            producto =>
              normalizar(
                producto.nombre
              ) ===
              "preventa"
          )
        )
      )
    ) {

      ventas.push({

        key:
          blob.key,

        venta

      });
    }
  }


  ventas.sort(
    (a, b) =>

      new Date(
        b.venta.fecha ||
        0
      ) -

      new Date(
        a.venta.fecha ||
        0
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
    (
      total,
      item
    ) =>

      total +
      obtenerCantidadVenta(
        item.venta
      ),

    0
  );
}


/* =====================================================
   DIVIDIR VENTAS
===================================================== */

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
      (
        total,
        item
      ) =>

        total +
        obtenerCantidadVenta(
          item.venta
        ),

      0
    );


  if (
    disponibles <
    cantidad
  ) {

    throw new Error(
      "No hay suficientes preventas asociadas a ventas para realizar la división."
    );
  }


  let restante =
    cantidad;


  for (
    const item
    of ventas
  ) {

    if (
      restante <= 0
    ) {

      break;
    }


    const venta =
      item.venta;


    const cantidadVenta =
      obtenerCantidadVenta(
        venta
      );


    if (
      cantidadVenta <=
      0
    ) {

      continue;
    }


    const mover =
      Math.min(
        restante,
        cantidadVenta
      );


    /*
      Si movemos TODA esta venta,
      solamente cambiamos el dueño.
    */

    if (
      mover ===
      cantidadVenta
    ) {

      venta.clienteId =
        personaDestino.id;


      venta.nombre =
        personaDestino.nombre;


      venta.codigoPreventa =
        personaDestino
          .codigoPreventa;


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
        Parte queda en la persona original.
      */

      const cantidadOriginal =
        cantidadVenta -
        mover;


      actualizarCantidadVenta(
        venta,
        cantidadOriginal
      );


      await ventasStore.setJSON(
        item.key,
        venta
      );


      /*
        Y la otra parte pasa
        a una venta nueva.
      */

      const nuevaVentaId =
        crypto.randomUUID();


      const nuevaVenta = {

        ...venta,

        id:
          nuevaVentaId,

        clienteId:
          personaDestino.id,

        nombre:
          personaDestino.nombre,

        codigoPreventa:
          personaDestino
            .codigoPreventa,

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
        mover
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


/* =====================================================
   ELIMINAR PREVENTAS
===================================================== */

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
      (
        total,
        item
      ) =>

        total +
        obtenerCantidadVenta(
          item.venta
        ),

      0
    );


  if (
    disponibles <
    cantidad
  ) {

    throw new Error(
      "No hay suficientes ventas asociadas para eliminar esa cantidad."
    );
  }


  let restante =
    cantidad;


  for (
    const item
    of ventas
  ) {

    if (
      restante <= 0
    ) {

      break;
    }


    const cantidadVenta =
      obtenerCantidadVenta(
        item.venta
      );


    if (
      cantidadVenta <=
      0
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
      nuevaCantidad ===
      0
    ) {

      await ventasStore.delete(
        item.key
      );


    } else {

      actualizarCantidadVenta(
        item.venta,
        nuevaCantidad
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


/* =====================================================
   MOVER VENTAS Y PEDIDOS DE MESA
===================================================== */

async function moverRelacionadosDeMesa(
  persona,
  mesaAnterior,
  nuevaMesa,
  ventasStore,
  pedidosStore
) {

  /* =========================
     VENTAS
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
          type:
            "json"
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
      Compatibilidad con ventas antiguas
      que todavía no tenían clienteId.
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


  /* =========================
     PEDIDOS
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
          type:
            "json"
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
}


/* =====================================================
   CAMBIAR NOMBRE EN VENTAS Y PEDIDOS
===================================================== */

async function actualizarNombreRelacionados(
  personaId,
  nuevoNombre,
  ventasStore,
  pedidosStore
) {

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
          type:
            "json"
        }
      );


    if (
      venta &&
      venta.clienteId ===
      personaId
    ) {

      venta.nombre =
        nuevoNombre;


      await ventasStore.setJSON(
        blob.key,
        venta
      );
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
          type:
            "json"
        }
      );


    if (
      pedido &&
      pedido.clienteId ===
      personaId
    ) {

      pedido.nombre =
        nuevoNombre;


      await pedidosStore.setJSON(
        blob.key,
        pedido
      );
    }
  }
}


/* =====================================================
   FUNCIÓN PRINCIPAL
===================================================== */

export default async (req) => {

  try {

    /*
      MUY IMPORTANTE:

      Los stores se crean DENTRO de cada
      ejecución de la Function.

      Así evitamos reutilizar un token
      expirado de Netlify Blobs.
    */

    const personasStore =
      getStore({

        name:
          "personas-bingo",

        consistency:
          "strong"

      });


    const ventasStore =
      getStore({

        name:
          "ventas-bingo",

        consistency:
          "strong"

      });


    const pedidosStore =
      getStore({

        name:
          "pedidos-bingo",

        consistency:
          "strong"

      });


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
        datos.accion;


      /* =================================================
         CREAR PERSONA SIN PREVENTA
      ================================================= */

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
            datos.nombre ||
            ""
          ).trim();


        if (
          !Number.isInteger(
            mesa
          ) ||
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
              status:
                400
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

          ],

          historialPreventas:
            []

        };


        await personasStore.setJSON(
          id,
          persona
        );


        return Response.json({

          ok:
            true,

          persona

        });
      }


      /* =================================================
         CREAR PREVENTA
      ================================================= */

      if (
        accion ===
        "crear-preventa"
      ) {

        const nombre =
          String(
            datos.nombre ||
            ""
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
          cantidadPreventas <
          1
        ) {

          return Response.json(

            {
              error:
                "Datos de preventa inválidos."
            },

            {
              status:
                400
            }

          );
        }


        const id =
          crypto.randomUUID();


        const codigoPreventa =
          await crearCodigoUnico(
            personasStore
          );


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
            [],

          historialPreventas:
            []

        };


        await personasStore.setJSON(
          id,
          persona
        );


        return Response.json({

          ok:
            true,

          persona

        });
      }


      /* =================================================
         ASIGNAR PREVENTA A MESA
      ================================================= */

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
          !Number.isInteger(
            mesa
          ) ||
          mesa < 1 ||
          mesa > 50
        ) {

          return Response.json(

            {
              error:
                "Código o mesa inválidos."
            },

            {
              status:
                400
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
              status:
                404
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
          mesaAnterior !==
          mesa
        ) {

          return Response.json(

            {
              error:
                "Esta preventa ya está asociada a otra mesa. Solicita el cambio a administración."
            },

            {
              status:
                409
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
          mesaAnterior !==
          mesa
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


        await moverRelacionadosDeMesa(

          persona,

          mesaAnterior,

          mesa,

          ventasStore,

          pedidosStore

        );


        return Response.json({

          ok:
            true,

          persona

        });
      }


      /* =================================================
         ACTIVO / NO ACTIVO
      ================================================= */

      if (
        accion ===
        "actualizar-activo"
      ) {

        const personaId =
          String(
            datos.personaId ||
            ""
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


        const activo =
          datos.activo ===
          true;


        persona.activo =
          activo;


        persona.llegadaEn =
          activo

            ? (
                persona.llegadaEn ||
                new Date()
                  .toISOString()
              )

            : null;


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


      /* =================================================
         EDITAR NOMBRE
      ================================================= */

      if (
        accion ===
        "editar-nombre"
      ) {

        const personaId =
          String(
            datos.personaId ||
            ""
          ).trim();


        const nuevoNombre =
          String(
            datos.nombre ||
            ""
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
              status:
                400
            }

          );
        }


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


        persona.nombre =
          nuevoNombre;


        await personasStore.setJSON(
          persona.id,
          persona
        );


        await actualizarNombreRelacionados(

          persona.id,

          nuevoNombre,

          ventasStore,

          pedidosStore

        );


        return Response.json({

          ok:
            true,

          persona

        });
      }


      /* =================================================
         DIVIDIR PREVENTAS
      ================================================= */

      if (
        accion ===
        "dividir-preventas"
      ) {

        const personaId =
          String(
            datos.personaId ||
            ""
          ).trim();


        const nuevoNombre =
          String(
            datos.nuevoNombre ||
            ""
          ).trim();


        const cantidad =
          Number(
            datos.cantidad
          );


        if (
          !personaId ||
          !nuevoNombre ||
          !Number.isInteger(
            cantidad
          ) ||
          cantidad < 1
        ) {

          return Response.json(

            {
              error:
                "Datos inválidos."
            },

            {
              status:
                400
            }

          );
        }


        const personaOrigen =
          await personasStore.get(
            personaId,
            {
              type:
                "json"
            }
          );


        if (
          !personaOrigen
        ) {

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
              status:
                400
            }

          );
        }


        const cantidadVentas =
          await totalPreventasEnVentas(

            personaOrigen.id,

            ventasStore

          );


        if (
          cantidadVentas <
          cantidad
        ) {

          return Response.json(

            {
              error:
                "No se pudo relacionar esa cantidad con las ventas registradas."
            },

            {
              status:
                409
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
            await crearCodigoUnico(
              personasStore
            ),

          cantidadPreventas:
            cantidad,

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


        await traspasarVentas(

          personaOrigen,

          nuevaPersona,

          cantidad,

          ventasStore

        );


        personaOrigen
          .cantidadPreventas =

          cantidadActual -
          cantidad;


        if (
          !Array.isArray(
            personaOrigen
              .historialPreventas
          )
        ) {

          personaOrigen
            .historialPreventas =
            [];
        }


        personaOrigen
          .historialPreventas
          .push({

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


        if (
          personaOrigen
            .cantidadPreventas ===
          0
        ) {

          personaOrigen
            .codigoPreventa =
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


      /* =================================================
         ELIMINAR PREVENTAS
      ================================================= */

      if (
        accion ===
        "eliminar-preventas"
      ) {

        const personaId =
          String(
            datos.personaId ||
            ""
          ).trim();


        const cantidad =
          Number(
            datos.cantidad
          );


        if (
          !personaId ||
          !Number.isInteger(
            cantidad
          ) ||
          cantidad < 1
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


        const cantidadActual =
          Number(
            persona
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
                "No puedes eliminar más preventas de las que tiene."
            },

            {
              status:
                400
            }

          );
        }


        await descontarVentas(

          persona.id,

          cantidad,

          ventasStore

        );


        const ahora =
          new Date()
            .toISOString();


        persona
          .cantidadPreventas =

          cantidadActual -
          cantidad;


        if (
          !Array.isArray(
            persona
              .historialPreventas
          )
        ) {

          persona
            .historialPreventas =
            [];
        }


        persona
          .historialPreventas
          .push({

            tipo:
              "eliminacion-error",

            cantidad,

            monto:
              cantidad *
              PRECIO_PREVENTA,

            fecha:
              ahora

          });


        if (
          persona
            .cantidadPreventas ===
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


      /* =================================================
         CAMBIAR MESA
      ================================================= */

      if (
        accion ===
        "cambiar-mesa"
      ) {

        const personaId =
          String(
            datos.personaId ||
            ""
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
              status:
                400
            }

          );
        }


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
              status:
                400
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


        await moverRelacionadosDeMesa(

          persona,

          mesaAnterior,

          nuevaMesa,

          ventasStore,

          pedidosStore

        );


        return Response.json({

          ok:
            true,

          persona

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


        return Response.json(
          persona
        );
      }


      /* =========================
         PREVENTAS
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
                type:
                  "json"
              }
            );


          if (
            persona &&
            persona.tipo ===
              "preventa" &&
            Number(
              persona
                .cantidadPreventas ||
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


      /* =========================
         PERSONAS DE UNA MESA
      ========================= */

      if (
        mesaParametro
      ) {

        const mesa =
          Number(
            mesaParametro
          );


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
                type:
                  "json"
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
        status:
          500
      }

    );
  }
};
