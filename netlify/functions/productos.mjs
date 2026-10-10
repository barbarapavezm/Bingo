import { getStore } from "@netlify/blobs";


const PRODUCTOS_BASE = [
  { id: 1, nombre: "Completo", precio: 1500, categoria: "comida" },
  { id: 2, nombre: "Té", precio: 1000, categoria: "comida" },
  { id: 3, nombre: "Café", precio: 1000, categoria: "comida" },
  { id: 4, nombre: "Bebida", precio: 1000, categoria: "comida" },
  { id: 5, nombre: "Agua", precio: 500, categoria: "comida" },
  { id: 6, nombre: "Juego 1", precio: 1500, categoria: "bingo" },
  { id: 7, nombre: "Juego 2", precio: 1500, categoria: "bingo" },
  { id: 8, nombre: "Juego 3", precio: 1500, categoria: "bingo" },
  { id: 9, nombre: "Juego 4", precio: 1500, categoria: "bingo" },
  { id: 10, nombre: "Juego Mayor", precio: 3000, categoria: "bingo" },
  { id: 11, nombre: "Once", precio: 3000, categoria: "comida" }
];

const PRECIO_PREVENTA = 10000;

function limpiarProducto(producto) {
  return {
    id: Number(producto.id),
    nombre: String(producto.nombre || "").trim(),
    precio: Math.round(Number(producto.precio)),
    categoria: producto.categoria === "bingo" ? "bingo" : "comida"
  };
}

function validarProductos(productos) {
  if (!Array.isArray(productos) || productos.length === 0 || productos.length > 100) {
    return null;
  }

  const limpios = productos.map(limpiarProducto);
  const ids = new Set();

  for (const producto of limpios) {
    if (
      !Number.isInteger(producto.id) ||
      producto.id < 1 ||
      ids.has(producto.id) ||
      !producto.nombre ||
      !Number.isFinite(producto.precio) ||
      producto.precio < 0
    ) {
      return null;
    }

    ids.add(producto.id);
  }

  return limpios;
}

async function obtenerConfig(store) {
  let config = await store.get("config", { type: "json" });

  if (!config || !Array.isArray(config.productos)) {
    config = {
      productos: PRODUCTOS_BASE,
      precioPreventa: PRECIO_PREVENTA,
      actualizadoEn: new Date().toISOString()
    };

    await store.setJSON("config", config);
  }

  return config;
}

export default async (req) => {
  try {
    const store = getStore({
      name: "productos-bingo-config",
      consistency: "strong"
    });

    if (req.method === "GET") {
      const config = await obtenerConfig(store);

      return Response.json(config, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }

    if (req.method === "POST") {
      const datos = await req.json();
      const productos = validarProductos(datos.productos);

      if (!productos) {
        return Response.json(
          { error: "Los productos enviados no son válidos." },
          { status: 400 }
        );
      }

      const config = {
        productos,
        // La preventa sigue fija en $10.000 para mantenerla sincronizada
        // con la lógica actual de preventas del sistema.
        precioPreventa: PRECIO_PREVENTA,
        actualizadoEn: new Date().toISOString()
      };

      await store.setJSON("config", config);

      return Response.json({ ok: true, ...config });
    }

    return Response.json(
      { error: "Método no permitido." },
      { status: 405 }
    );

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error.message || "Error interno." },
      { status: 500 }
    );
  }
};
