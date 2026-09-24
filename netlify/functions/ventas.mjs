import { getStore } from "@netlify/blobs";

const store = getStore("ventas-bingo");

export default async (req) => {
  try {

    if (req.method === "POST") {

      const venta = await req.json();

      if (
        !venta.mesa ||
        !venta.metodoPago ||
        !venta.productos ||
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


    if (req.method === "GET") {

      const lista = await store.list();

      const ventas = [];

      for (const blob of lista.blobs) {
        const venta = await store.get(blob.key, {
          type: "json"
        });

        ventas.push(venta);
      }

      ventas.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );

      return Response.json(ventas);
    }


    return Response.json(
      { error: "Método no permitido" },
      { status: 405 }
    );

  } catch (error) {

    console.error(error);

    return Response.json(
      { error: "Error guardando la venta" },
      { status: 500 }
    );
  }
};
