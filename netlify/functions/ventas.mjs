import { getStore } from "@netlify/blobs";


/*
  IMPORTANTE:
  No abrimos los Netlify Blobs stores al cargar el módulo.
  Los inicializamos nuevamente en cada ejecución de la Function
  para evitar reutilizar credenciales/token vencidos.
*/
let ventasStore = null;
let personasStore = null;


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
   TIPOS DE ONCE
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


function nombreOnce(tipo) {

  if (tipo === "vegana") {
    return "Once vegana";
  }


  if (tipo === "vegetariana") {
    return "Once vegetariana";
  }


  return "Once normal";
}


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


function obtenerTiposOnceVenta(
  venta,
  cantidad = null
) {

  const total =
    cantidad ??
    obtenerCantidadPreventa(
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


  const desdeBeneficios =
    venta?.beneficiosPreventa?.once?.tipos;


  if (
    Array.isArray(
      desdeBeneficios
    )
  ) {

    const tipos =
      normalizarTiposOnce(
        desdeBeneficios,
        total
      );


    if (tipos) {
      return tipos;
    }
  }


  const tipoUnico =
    normalizarTipoOnce(
      venta?.tipoOnce ||
      venta?.beneficiosPreventa?.once?.tipo
    );


  if (tipoUnico) {

    return Array.from(
      {
        length:
          total
      },
      () =>
        tipoUnico
    );
  }


  if (
    Array.isArray(
      venta?.productos
    )
  ) {

    const encontrados =
      [];


    for (const producto of venta.productos) {

      const nombre =
        String(
          producto?.nombre ||
          ""
        )
          .trim()
          .toLowerCase();


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


function agruparOncesProductos(
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


  return [
    "normal",
    "vegetariana",
    "vegana"
  ]
    .filter(
      tipo =>
        conteo[tipo] > 0
    )
    .map(
      tipo => ({

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

      })
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

      tipos,

      estado:
        "pendiente"

    }

  };
}


function resumenTipoOnce(
  tipos
) {

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


function construirProductosPreventa(
  cantidad,
  tiposOnce
) {

  const total =
    PRECIO_PREVENTA *
    cantidad;


  return [

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
    },

    ...agruparOncesProductos(
      tiposOnce
    )

  ];
}


async function sincronizarPersonaDesdeVentas(
  persona,
  ventasStore
) {

  if (!persona?.id) {
    return persona;
  }


  const lista =
    await ventasStore.list();


  const tipos =
    [];


  let cantidad =
    0;


  for (const blob of lista.blobs) {

    const venta =
      await ventasStore.get(
        blob.key,
        {
          type:
            "json"
        }
      );


    if (
      !venta ||
      venta.clienteId !==
        persona.id ||
      venta.tipoVenta !==
        "preventa"
    ) {

      continue;
    }


    const cant =
      obtenerCantidadPreventa(
        venta
      );


    cantidad +=
      cant;


    tipos.push(
      ...obtenerTiposOnceVenta(
        venta,
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

    /*
      Stores frescos para ESTA ejecución.
      Ambos apuntan a los mismos datos persistentes,
      solo renovamos las credenciales usadas por Netlify.
    */
    ventasStore = getStore({
      name: "ventas-bingo",
      consistency: "strong"
    });

    personasStore = getStore({
      name: "personas-bingo",
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


      /*
        Validamos cada dato por separado para evitar el
        mensaje genérico "Datos de preventa inválidos"
        y aceptar tanto el formato nuevo (tiposOnce[])
        como el antiguo (tipoOnce).
      */
      if (!nombre) {
        return Response.json(
          { error: "Falta el nombre de la persona." },
          { status: 400 }
        );
      }

      if (!datos.metodoPago) {
        return Response.json(
          { error: "Falta el método de pago de la preventa." },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(cantidadPreventas) ||
        cantidadPreventas < 1
      ) {
        return Response.json(
          { error: "La cantidad de preventas no es válida." },
          { status: 400 }
        );
      }

      let tiposOnce =
        normalizarTiposOnce(
          datos.tiposOnce,
          cantidadPreventas,
          datos.tipoOnce
        );

      /*
        Si por una versión anterior del frontend llega
        un único tipo, lo repetimos para la cantidad indicada.
      */
      if (!tiposOnce) {
        const unico =
          normalizarTipoOnce(
            datos.tipoOnce
          );

        if (unico) {
          tiposOnce =
            Array.from(
              { length: cantidadPreventas },
              () => unico
            );
        }
      }

      if (!tiposOnce) {
        return Response.json(
          {
            error:
              "Debes elegir una Once válida para cada preventa."
          },
          { status: 400 }
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

        const tiposPrevios =
          Array.isArray(
            persona.tiposOnce
          )
            ? persona.tiposOnce
                .map(
                  normalizarTipoOnce
                )
                .filter(Boolean)

            : Array.from(
                {
                  length:
                    Number(
                      persona.cantidadPreventas ||
                      0
                    )
                },
                () =>
                  normalizarTipoOnce(
                    persona.tipoOnce
                  ) ||
                  "normal"
              );


        persona.tiposOnce = [
          ...tiposPrevios,
          ...tiposOnce
        ];


        persona.tipoOnce =
          resumenTipoOnce(
            persona.tiposOnce
          );


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

          tiposOnce: [
            ...tiposOnce
          ],

          tipoOnce:
            resumenTipoOnce(
              tiposOnce
            ),

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

          tiposOnce: [
            ...tiposOnce
          ],

          tipoOnce:
            resumenTipoOnce(
              tiposOnce
            ),

          productos:
            construirProductosPreventa(
              cantidadPreventas,
              tiposOnce
            ),

          beneficiosPreventa:
            crearBeneficios(
              cantidadPreventas,
              tiposOnce
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


          if (
            Array.isArray(
              persona.tiposOnce
            )
          ) {

            persona.tiposOnce =
              persona.tiposOnce.slice(
                0,
                Math.max(
                  0,
                  persona.tiposOnce.length -
                  cantidadPreventas
                )
              );


            persona.tipoOnce =
              resumenTipoOnce(
                persona.tiposOnce
              );
          }


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


        let tiposOnceActuales =
          normalizarTiposOnce(
            datos.tiposOnce,
            cantidadNueva,
            datos.tipoOnce
          );


        if (!tiposOnceActuales) {

          const anteriores =
            obtenerTiposOnceVenta(
              anterior,
              cantidadAnterior
            );


          if (
            cantidadNueva <=
            anteriores.length
          ) {

            tiposOnceActuales =
              anteriores.slice(
                0,
                cantidadNueva
              );

          } else {

            const relleno =
              anteriores[
                anteriores.length - 1
              ] ||
              "normal";


            tiposOnceActuales = [
              ...anteriores,
              ...Array.from(
                {
                  length:
                    cantidadNueva -
                    anteriores.length
                },
                () =>
                  relleno
              )
            ];
          }
        }


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

          tiposOnce:
            tiposOnceActuales,

          tipoOnce:
            resumenTipoOnce(
              tiposOnceActuales
            ),

          productos:
            construirProductosPreventa(
              cantidadNueva,
              tiposOnceActuales
            ),

          beneficiosPreventa:
            crearBeneficios(
              cantidadNueva,
              tiposOnceActuales
            ),

          total

        };


        await ventasStore.setJSON(
          anterior.id,
          actualizada
        );


        if (persona) {

          await sincronizarPersonaDesdeVentas(
            persona,
            ventasStore
          );


          await personasStore.setJSON(
            persona.id,
            persona
          );
        }


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

      let personaPreventa =
        null;


      if (
        venta.tipoVenta ===
          "preventa" &&
        venta.clienteId
      ) {

        personaPreventa =
          await personasStore.get(
            venta.clienteId,
            {
              type:
                "json"
            }
          );
      }


      await ventasStore.delete(
        id
      );


      if (personaPreventa) {

        await sincronizarPersonaDesdeVentas(
          personaPreventa,
          ventasStore
        );


        await personasStore.setJSON(
          personaPreventa.id,
          personaPreventa
        );
      }


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
          error?.message ||
          "Error procesando la venta."
      },
      {
        status: 500
      }
    );
  }
};
