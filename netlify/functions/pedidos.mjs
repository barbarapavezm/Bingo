import { getStore } from "@netlify/blobs";

const store = getStore("pedidos-bingo");

export default async (req) => {
  try {

    // =========================
    // CREAR PEDIDO
    // =========================

    if (req.method === "POST") {

      const pedido = await req.json();

      if (
        !pedido.mesa ||
        !pedido.nombre ||
        !Array.isArray(pedido.productos) ||
        pedido.productos.length === 0
      ) {
        return Response.json(
          { error: "Faltan datos del pedido" },
          { status: 400 }
        );
      }

      const id = crypto.randomUUID();
      const ahora = new Date().toISOString();

      const pedidoCompleto = {
        id,
        mesa: Number(pedido.mesa),
        nombre: pedido.nombre.trim(),
        productos: pedido.productos,
        estado: "nuevo",
        fecha: ahora,
        actualizado: ahora,

        prioridadPreparando: false,

        historialEstados: [
          {
            desde: null,
            hacia: "nuevo",
            fecha: ahora
          }
        ]
      };

      await store.setJSON(
        id,
        pedidoCompleto
      );

      return Response.json({
        ok: true,
        pedido: pedidoCompleto
      });
    }


    // =========================
    // OBTENER PEDIDOS
    // =========================

    if (req.method === "GET") {

      const lista =
        await store.list();

      const pedidos = [];

      for (const blob of lista.blobs) {

        const pedido =
          await store.get(
            blob.key,
            {
              type: "json"
            }
          );

        if (pedido) {
          pedidos.push(pedido);
        }
      }

      pedidos.sort(
        (a, b) =>
          new Date(b.fecha) -
          new Date(a.fecha)
      );

      return Response.json(
        pedidos
      );
    }


    // =========================
    // CAMBIAR ESTADO
    // =========================

    if (req.method === "PUT") {

      const datos =
        await req.json();

      if (
        !datos.id ||
        !datos.estado
      ) {
        return Response.json(
          {
            error:
              "Faltan datos"
          },
          {
            status: 400
          }
        );
      }

      const pedido =
        await store.get(
          datos.id,
          {
            type: "json"
          }
        );

      if (!pedido) {
        return Response.json(
          {
            error:
              "Pedido no encontrado"
          },
          {
            status: 404
          }
        );
      }

      const estadosPermitidos = [
        "nuevo",
        "preparando",
        "listo",
        "entregado"
      ];

      if (
        !estadosPermitidos.includes(
          datos.estado
        )
      ) {
        return Response.json(
          {
            error:
              "Estado inválido"
          },
          {
            status: 400
          }
        );
      }

      const estadoAnterior =
        pedido.estado;

      const ahora =
        new Date().toISOString();


      // Historial de estados

      if (
        !Array.isArray(
          pedido.historialEstados
        )
      ) {
        pedido.historialEstados = [];
      }

      pedido.historialEstados.push({
        desde:
          estadoAnterior,

        hacia:
          datos.estado,

        fecha:
          ahora
      });


      pedido.estado =
        datos.estado;

      pedido.actualizado =
        ahora;


      // =========================
      // MARCAR ENTREGADO
      // =========================

      if (
        datos.estado ===
        "entregado"
      ) {

        pedido.entregadoEn =
          ahora;

        pedido.prioridadPreparando =
          false;
      }


      // =========================
      // DEVOLVER ENTREGADO
      // A PREPARANDO
      // =========================

      if (
        estadoAnterior ===
          "entregado" &&
        datos.estado ===
          "preparando"
      ) {

        pedido.reabiertoEn =
          ahora;

        /*
          Esto hará que aparezca
          primero en Preparando.
        */

        pedido.prioridadPreparando =
          true;
      }


      // Si sale de preparando,
      // pierde esa prioridad.

      if (
        datos.estado === "listo" ||
        datos.estado === "nuevo" ||
        datos.estado === "entregado"
      ) {

        pedido.prioridadPreparando =
          false;
      }


      await store.setJSON(
        pedido.id,
        pedido
      );

      return Response.json({
        ok: true,
        pedido
      });
    }


    return Response.json(
      {
        error:
          "Método no permitido"
      },
      {
        status: 405
      }
    );

  } catch (error) {

    console.error(
      "Error en pedidos:",
      error
    );

    return Response.json(
      {
        error:
          "Error procesando pedido"
      },
      {
        status: 500
      }
    );
  }
};
