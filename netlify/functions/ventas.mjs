import { getStore } from "@netlify/blobs";

const store = getStore("ventas-bingo");

export default async (req) => {
  try {

    // =========================
    // CREAR VENTA
    // =========================
    if (req.method === "POST") {

      const venta = await req.json();

      if (
        !venta.mesa ||
        !venta.nombre ||
        !venta.metodoPago ||
        !Array.isArray(venta.productos) ||
        venta.productos.length === 0 ||
        !venta.total
      ) {
        return Response.json(
          { error: "Faltan datos de la venta" },
          { status: 400 }
        );
      }

      const id = crypto.randomUUID();

      const ventaCompleta = {
        id,
        mesa: venta.mesa,
        nombre: venta.nombre,
        metodoPago: venta.metodoPago,
        productos: venta.productos,
        total: venta.total,
        fecha: new Date().toISOString()
      };

      await store.setJSON(id, ventaCompleta);

      return Response.json({
        ok: true,
        venta: ventaCompleta
      });
    }


    // =========================
    // LEER TODAS LAS VENTAS
    // =========================
    if (req.method === "GET") {

      const lista = await store.list();
      const ventas = [];

      for (const blob of lista.blobs) {

        const venta = await store.get(blob.key, {
          type: "json"
        });

        if (venta) {
          ventas.push(venta);
        }
      }

      ventas.sort(
        (a, b) =>
          new Date(b.fecha) - new Date(a.fecha)
      );

      return Response.json(ventas);
    }


    // =========================
    // EDITAR VENTA
    // =========================
    if (req.method === "PUT") {

      const venta = await req.json();

      if (!venta.id) {
        return Response.json(
          { error: "Falta el ID de la venta" },
          { status: 400 }
        );
      }

      if (
        !venta.mesa ||
        !venta.nombre ||
        !venta.metodoPago ||
        !Array.isArray(venta.productos) ||
        venta.productos.length === 0
      ) {
        return Response.json(
          { error: "Faltan datos de la venta" },
          { status: 400 }
        );
      }

      const ventaAnterior = await store.get(
        venta.id,
        { type: "json" }
      );

      if (!ventaAnterior) {
        return Response.json(
          { error: "Venta no encontrada" },
          { status: 404 }
        );
      }

      const total = venta.productos.reduce(
        (suma, producto) =>
          suma +
          (
            Number(producto.precio) *
            Number(producto.cantidad)
          ),
        0
      );

      const ventaActualizada = {
        ...ventaAnterior,
        mesa: Number(venta.mesa),
        nombre: venta.nombre,
        metodoPago: venta.metodoPago,
        productos: venta.productos.map(producto => ({
          ...producto,
          cantidad: Number(producto.cantidad),
          subtotal:
            Number(producto.precio) *
            Number(producto.cantidad)
        })),
        total
      };

      await store.setJSON(
        venta.id,
        ventaActualizada
      );

      return Response.json({
        ok: true,
        venta: ventaActualizada
      });
    }


    // =========================
    // ELIMINAR VENTA
    // =========================
    if (req.method === "DELETE") {

      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return Response.json(
          { error: "Falta el ID de la venta" },
          { status: 400 }
        );
      }

      await store.delete(id);

      return Response.json({
        ok: true
      });
    }


    return Response.json(
      { error: "Método no permitido" },
      { status: 405 }
    );

  } catch (error) {

    console.error(
      "Error en función ventas:",
      error
    );

    return Response.json(
      {
        error: "Error procesando la venta"
      },
      {
        status: 500
      }
    );
  }
};
