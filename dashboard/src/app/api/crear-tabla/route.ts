import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET() {
  const connectionString = "postgresql://postgres:yr43d8lek%25fr$6!xDzlMuqVf@db.onxwyrwmpjxtwlmjrosr.supabase.co:5432/postgres"

  const sql_create_table = `
  CREATE TABLE IF NOT EXISTS public.clientes_expediente (
      cuenta VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(255),
      sector VARCHAR(255),
      direccion VARCHAR(255),
      plan VARCHAR(100),
      tipo1 VARCHAR(100),
      ciudad VARCHAR(150),
      telefono1 VARCHAR(100),
      telefono2 VARCHAR(100),
      telefono3 VARCHAR(100),
      telefono4 VARCHAR(100),
      telefono5 VARCHAR(100),
      telefono6 VARCHAR(100),
      
      -- Telefonos de emergencia (contactos)
      nombre1 VARCHAR(255), direccion1 VARCHAR(255), carg1 VARCHAR(150), t1 VARCHAR(100),
      nombre2 VARCHAR(255), direccion2 VARCHAR(255), carg2 VARCHAR(150), t2 VARCHAR(100),
      nombre3 VARCHAR(255), direccion3 VARCHAR(255), carg3 VARCHAR(150), t3 VARCHAR(100),
      nombre4 VARCHAR(255), direccion4 VARCHAR(255), carg4 VARCHAR(150), t4 VARCHAR(100),
      nombre5 VARCHAR(255), direccion5 VARCHAR(255), carg5 VARCHAR(150), t5 VARCHAR(100),
      nombre6 VARCHAR(255), direccion6 VARCHAR(255), carg6 VARCHAR(150), t6 VARCHAR(100),
      nombre7 VARCHAR(255), direccion7 VARCHAR(255), carg7 VARCHAR(150), t7 VARCHAR(100),
      
      -- Adicionales
      referencia1 TEXT,
      caract_adic1 TEXT,
      observacion1 TEXT,
      comentario TEXT,
      foto TEXT,
      fecha VARCHAR(100),
      instalador VARCHAR(200),
      marca VARCHAR(150),
      modelo VARCHAR(150),
      version VARCHAR(100),
      ubicacion_uc VARCHAR(255),
      num_linea VARCHAR(100),
      entrada1 VARCHAR(100),
      entrada2 VARCHAR(100),
      salida VARCHAR(100),
      corte_sirena VARCHAR(100)
  );

  -- Habilitar permisos para que la API anon pueda consultar y actualizar
  ALTER TABLE public.clientes_expediente OWNER TO postgres;
  GRANT ALL ON TABLE public.clientes_expediente TO postgres;
  GRANT ALL ON TABLE public.clientes_expediente TO anon;
  GRANT ALL ON TABLE public.clientes_expediente TO authenticated;
  GRANT ALL ON TABLE public.clientes_expediente TO service_role;

  -- Habilitar RLS pero permitir todo a anon de forma simple para desarrollo rápido
  ALTER TABLE public.clientes_expediente DISABLE ROW LEVEL SECURITY;
  `

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    await client.query(sql_create_table)
    await client.end()
    return NextResponse.json({ status: "success", message: "Tabla public.clientes_expediente creada/actualizada exitosamente." })
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message })
  }
}
