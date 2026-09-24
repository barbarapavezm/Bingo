import { getStore } from "@netlify/blobs";

const store = getStore("pedidos-bingo");

export default async (req) => {
  try {

    // CREAR PEDIDO
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

      const pedidoCompleto = {
        id,
        mesa: Number(pedido.mesa),
        nombre: pedido.nombre.trim(),
        productos: pedido.productos,
        estado: "nuevo",
        fecha: new Date().toISOString()
      };

      await store.setJSON(id, pedidoCompleto);

      return Response.json({
        ok: true,
        pedido: pedidoCompleto
      });
    }


    // OBTENER PEDIDOS
    if (req.method === "GET") {

      const lista = await store.list();
      const pedidos = [];

      for (const blob of lista.blobs) {

        const pedido = await store.get(
          blob.key,
          { type: "json" }
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

      return Response.json(pedidos);
    }


    // CAMBIAR ESTADO
    if (req.method === "PUT") {

      const datos = await req.json();

      if (!datos.id || !datos.estado) {
        return Response.json(
          { error: "Faltan datos" },
          { status: 400 }
        );
      }

      const pedido = await store.get(
        datos.id,
        { type: "json" }
      );

      if (!pedido) {
        return Response.json(
          { error: "Pedido no encontrado" },
          { status: 404 }
        );
      }

      const estadosPermitidos = [
        "nuevo",
        "preparando",
        "listo",
        "entregado"
      ];

      if (!estadosPermitidos.includes(datos.estado)) {
        return Response.json(
          { error: "Estado inválido" },
          { status: 400 }
        );
      }

      pedido.estado = datos.estado;
      pedido.actualizado = new Date().toISOString();

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
      { error: "Método no permitido" },
      { status: 405 }
    );

  } catch (error) {

    console.error(error);

    return Response.json(
      { error: "Error procesando pedido" },
      { status: 500 }
    );
  }
};
