import { getStore } from "@netlify/blobs";

function respuestaError(mensaje, status = 400) {
  return Response.json(
    { error: mensaje },
    { status }
  );
}

function limpiarProductos(productos) {
  if (!Array.isArray(productos)) {
    return [];
  }

  return productos
    .map(producto => ({
      nombre: String(producto?.nombre || "").trim(),
      cantidad: Math.max(
        0,
        Math.floor(Number(producto?.cantidad || 0))
      )
    }))
    .filter(
      producto =>
        producto.nombre &&
        producto.cantidad > 0
    );
}

export default async (req) => {
  try {
    /*
      IMPORTANTE:
      abrimos el store dentro de cada ejecución,
      igual que en las otras funciones corregidas,
      para evitar reutilizar credenciales vencidas.
    */
    const pedidosStore = getStore({
      name: "pedidos-bingo",
      consistency: "strong"
    });

    /* =========================
       GET - LISTAR PEDIDOS
    ========================= */
    if (req.method === "GET") {
      const lista = await pedidosStore.list();
      const pedidos = [];

      for (const blob of lista.blobs) {
        const pedido = await pedidosStore.get(
          blob.key,
          { type: "json" }
        );

        if (pedido) {
          pedidos.push({
            ...pedido,
            id: pedido.id || blob.key
          });
        }
      }

      pedidos.sort(
        (a, b) =>
          new Date(a.fecha || a.actualizado || 0) -
          new Date(b.fecha || b.actualizado || 0)
      );

      return Response.json(pedidos);
    }

    /* =========================
       POST - CREAR PEDIDO
    ========================= */
    if (req.method === "POST") {
      const datos = await req.json();

      const mesa = Number(datos.mesa);
      const nombre = String(datos.nombre || "").trim();
      const clienteId = String(datos.clienteId || "").trim() || null;
      const origen = String(datos.origen || "mesa").trim();
      const productos = limpiarProductos(datos.productos);

      if (
        !Number.isInteger(mesa) ||
        mesa < 1 ||
        mesa > 50
      ) {
        return respuestaError(
          "La mesa debe ser un número entre 1 y 50."
        );
      }

      if (!nombre) {
        return respuestaError(
          "Falta el nombre de la persona."
        );
      }

      if (productos.length === 0) {
        return respuestaError(
          "El pedido no tiene productos válidos."
        );
      }

      const id = crypto.randomUUID();
      const ahora = new Date().toISOString();

      const pedido = {
        id,
        mesa,
        clienteId,
        nombre,
        origen,
        productos,
        estado: "nuevo",
        fecha: ahora,
        actualizado: ahora,
        entregadoEn: null,
        prioridadPreparando: false
      };

      await pedidosStore.setJSON(
        id,
        pedido
      );

      return Response.json(
        {
          ok: true,
          pedido
        },
        {
          status: 201
        }
      );
    }

    /* =========================
       PUT - CAMBIAR ESTADO
    ========================= */
    if (req.method === "PUT") {
      const datos = await req.json();

      const id = String(datos.id || "").trim();
      const estado = String(datos.estado || "").trim();

      const estadosValidos = [
        "nuevo",
        "preparando",
        "listo",
        "entregado"
      ];

      if (!id) {
        return respuestaError(
          "Falta el id del pedido."
        );
      }

      if (!estadosValidos.includes(estado)) {
        return respuestaError(
          "Estado de pedido inválido."
        );
      }

      const pedido = await pedidosStore.get(
        id,
        { type: "json" }
      );

      if (!pedido) {
        return respuestaError(
          "Pedido no encontrado.",
          404
        );
      }

      const ahora = new Date().toISOString();
      const estabaEntregado =
        pedido.estado === "entregado";

      pedido.estado = estado;
      pedido.actualizado = ahora;

      if (estado === "entregado") {
        pedido.entregadoEn = ahora;
        pedido.prioridadPreparando = false;
      } else {
        pedido.entregadoEn = null;

        /*
          Si un pedido entregado vuelve a preparando,
          Cocina lo muestra con prioridad.
        */
        pedido.prioridadPreparando =
          estabaEntregado &&
          estado === "preparando";
      }

      await pedidosStore.setJSON(
        id,
        pedido
      );

      return Response.json({
        ok: true,
        pedido
      });
    }

    return respuestaError(
      "Método no permitido.",
      405
    );

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error?.message ||
          "Error interno al gestionar pedidos."
      },
      {
        status: 500
      }
    );
  }
};
