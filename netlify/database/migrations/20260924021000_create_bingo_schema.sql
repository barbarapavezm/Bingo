CREATE TABLE IF NOT EXISTS mesas (
  id SERIAL PRIMARY KEY,
  numero INTEGER UNIQUE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio INTEGER NOT NULL CHECK (precio >= 0),
  categoria TEXT NOT NULL,
  entregable BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  mesa_id INTEGER REFERENCES mesas(id),
  metodo_pago TEXT NOT NULL CHECK (
    metodo_pago IN ('efectivo', 'transferencia')
  ),
  total INTEGER NOT NULL CHECK (total >= 0),
  creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id SERIAL PRIMARY KEY,
  venta_id INTEGER NOT NULL
    REFERENCES ventas(id) ON DELETE CASCADE,

  producto_id INTEGER NOT NULL
    REFERENCES productos(id),

  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario INTEGER NOT NULL CHECK (precio_unitario >= 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  mesa_id INTEGER NOT NULL
    REFERENCES mesas(id),

  estado TEXT NOT NULL DEFAULT 'nuevo'
    CHECK (
      estado IN ('nuevo', 'preparando', 'listo', 'entregado')
    ),

  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL
    REFERENCES pedidos(id) ON DELETE CASCADE,

  producto_id INTEGER NOT NULL
    REFERENCES productos(id),

  cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);

CREATE TABLE IF NOT EXISTS mesa_productos (
  id SERIAL PRIMARY KEY,

  mesa_id INTEGER NOT NULL
    REFERENCES mesas(id),

  producto_id INTEGER NOT NULL
    REFERENCES productos(id),

  comprados INTEGER NOT NULL DEFAULT 0
    CHECK (comprados >= 0),

  pedidos INTEGER NOT NULL DEFAULT 0
    CHECK (pedidos >= 0),

  UNIQUE (mesa_id, producto_id)
);


-- Crear las 50 mesas
INSERT INTO mesas (numero, token)
SELECT
  numero,
  md5(
    random()::text ||
    clock_timestamp()::text ||
    numero::text
  )
FROM generate_series(1, 50) AS numero
ON CONFLICT (numero) DO NOTHING;


-- Productos iniciales
INSERT INTO productos
(nombre, precio, categoria, entregable, activo)
SELECT *
FROM (
  VALUES
    ('Completo', 1500, 'comida', true, true),
    ('Té', 1000, 'comida', true, true),
    ('Café', 1000, 'comida', true, true),
    ('Bebida', 1000, 'comida', true, true),
    ('Agua', 500, 'comida', true, true),

    ('Juego 1', 1000, 'bingo', false, true),
    ('Juego 2', 1000, 'bingo', false, true),
    ('Juego 3', 1000, 'bingo', false, true),
    ('Juego 4', 1000, 'bingo', false, true),
    ('Juego Mayor', 2000, 'bingo', false, true),
    ('Pack de 11', 5000, 'bingo', false, true),
    ('Preventa', 4000, 'bingo', false, true)
) AS nuevos(nombre, precio, categoria, entregable, activo)
WHERE NOT EXISTS (
  SELECT 1 FROM productos
);
