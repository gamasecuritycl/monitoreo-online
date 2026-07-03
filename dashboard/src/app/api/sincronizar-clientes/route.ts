import { NextResponse } from 'next/server'
import { Client } from 'pg'

// Conexión directa a Supabase Postgres desde la nube de Vercel usando la dirección IPv6 física
const connectionString = "postgresql://postgres:yr43d8lek%25fr$6!xDzlMuqVf@[2600:1f1e:dbb:f602:6a4f:3993:b9a4:9c39]:5432/postgres"

export async function POST(request: Request) {
  try {
    const clientes = await request.json()
    if (!Array.isArray(clientes)) {
      return NextResponse.json({ status: "error", message: "El cuerpo debe ser una lista de clientes." }, { status: 400 })
    }

    console.log(`[SYNC API] Iniciando sincronización de ${clientes.length} clientes...`)

    const client = new Client({
      host: '2600:1f1e:dbb:f602:6a4f:3993:b9a4:9c39',
      port: 5432,
      user: 'postgres',
      password: 'yr43d8lek%fr$6!xDzlMuqVf',
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    // 1. Asegurar que la tabla clientes_expediente existe
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
    ALTER TABLE public.clientes_expediente DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE public.clientes_expediente TO anon;
    `
    await client.query(sql_create_table)

    // 2. Insertar en lotes de forma masiva
    // Construimos una inserción masiva parametrizada con ON CONFLICT DO UPDATE
    // para que sea sumamente rápida y actualice cualquier cambio.
    for (let i = 0; i < clientes.length; i += 50) {
      const lote = clientes.slice(i, i + 50)
      
      for (const c of lote) {
        const queryText = `
          INSERT INTO public.clientes_expediente (
            cuenta, nombre, sector, direccion, plan, tipo1, ciudad,
            telefono1, telefono2, telefono3, telefono4, telefono5, telefono6,
            nombre1, direccion1, carg1, t1,
            nombre2, direccion2, carg2, t2,
            nombre3, direccion3, carg3, t3,
            nombre4, direccion4, carg4, t4,
            nombre5, direccion5, carg5, t5,
            nombre6, direccion6, carg6, t6,
            nombre7, direccion7, carg7, t7,
            referencia1, caract_adic1, observacion1, comentario, foto,
            fecha, instalador, marca, modelo, version, ubicacion_uc,
            num_linea, entrada1, entrada2, salida, corte_sirena
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17,
            $18, $19, $20, $21,
            $22, $23, $24, $25,
            $26, $27, $28, $29,
            $30, $31, $32, $33,
            $34, $35, $36, $37,
            $38, $39, $40, $41,
            $42, $43, $44, $45, $46, $47,
            $48, $49, $50, $51, $52, $53, $54, $55, $56
          )
          ON CONFLICT (cuenta) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            sector = EXCLUDED.sector,
            direccion = EXCLUDED.direccion,
            plan = EXCLUDED.plan,
            tipo1 = EXCLUDED.tipo1,
            ciudad = EXCLUDED.ciudad,
            telefono1 = EXCLUDED.telefono1,
            telefono2 = EXCLUDED.telefono2,
            telefono3 = EXCLUDED.telefono3,
            telefono4 = EXCLUDED.telefono4,
            telefono5 = EXCLUDED.telefono5,
            telefono6 = EXCLUDED.telefono6,
            nombre1 = EXCLUDED.nombre1, direccion1 = EXCLUDED.direccion1, carg1 = EXCLUDED.carg1, t1 = EXCLUDED.t1,
            nombre2 = EXCLUDED.nombre2, direccion2 = EXCLUDED.direccion2, carg2 = EXCLUDED.carg2, t2 = EXCLUDED.t2,
            nombre3 = EXCLUDED.nombre3, direccion3 = EXCLUDED.direccion3, carg3 = EXCLUDED.carg3, t3 = EXCLUDED.t3,
            nombre4 = EXCLUDED.nombre4, direccion4 = EXCLUDED.direccion4, carg4 = EXCLUDED.carg4, t4 = EXCLUDED.t4,
            nombre5 = EXCLUDED.nombre5, direccion5 = EXCLUDED.direccion5, carg5 = EXCLUDED.carg5, t5 = EXCLUDED.t5,
            nombre6 = EXCLUDED.nombre6, direccion6 = EXCLUDED.direccion6, carg6 = EXCLUDED.carg6, t6 = EXCLUDED.t6,
            nombre7 = EXCLUDED.nombre7, direccion7 = EXCLUDED.direccion7, carg7 = EXCLUDED.carg7, t7 = EXCLUDED.t7,
            referencia1 = EXCLUDED.referencia1,
            caract_adic1 = EXCLUDED.caract_adic1,
            observacion1 = EXCLUDED.observacion1,
            comentario = EXCLUDED.comentario,
            foto = EXCLUDED.foto,
            fecha = EXCLUDED.fecha,
            instalador = EXCLUDED.instalador,
            marca = EXCLUDED.marca,
            modelo = EXCLUDED.modelo,
            version = EXCLUDED.version,
            ubicacion_uc = EXCLUDED.ubicacion_uc,
            num_linea = EXCLUDED.num_linea,
            entrada1 = EXCLUDED.entrada1,
            entrada2 = EXCLUDED.entrada2,
            salida = EXCLUDED.salida,
            corte_sirena = EXCLUDED.corte_sirena;
        `
        const values = [
          c.cuenta || '', c.nombre || '', c.sector || '', c.direccion || '', c.plan || '', c.tipo1 || '', c.ciudad || '',
          c.telefono1 || '', c.telefono2 || '', c.telefono3 || '', c.telefono4 || '', c.telefono5 || '', c.telefono6 || '',
          c.nombre1 || '', c.direccion1 || '', c.carg1 || '', c.t1 || '',
          c.nombre2 || '', c.direccion2 || '', c.carg2 || '', c.t2 || '',
          c.nombre3 || '', c.direccion3 || '', c.carg3 || '', c.t3 || '',
          c.nombre4 || '', c.direccion4 || '', c.carg4 || '', c.t4 || '',
          c.nombre5 || '', c.direccion5 || '', c.carg5 || '', c.t5 || '',
          c.nombre6 || '', c.direccion6 || '', c.carg6 || '', c.t6 || '',
          c.nombre7 || '', c.direccion7 || '', c.carg7 || '', c.t7 || '',
          c.referencia1 || '', c.caract_adic1 || '', c.observacion1 || '', c.comentario || '', c.foto || '',
          c.fecha || '', c.instalador || '', c.marca || '', c.modelo || '', c.version || '', c.ubicacion_uc || '',
          c.num_linea || '', c.entrada1 || '', c.entrada2 || '', c.salida || '', c.corte_sirena || ''
        ]
        await client.query(queryText, values)
      }
    }

    await client.end()
    console.log(`[SYNC API] Sincronización exitosa.`)
    return NextResponse.json({ status: "success", message: `Sincronizados ${clientes.length} clientes en Supabase.` })
  } catch (error: any) {
    console.error("[SYNC API ERROR]", error.message)
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 })
  }
}
