import { NextRequest, NextResponse } from "next/server";
import { listLeads } from "@/lib/sales-gama/supabase";
import { z } from "zod";

const FiltersSchema = z.object({
  estado: z.enum(["nuevo", "caliente", "cerrado", "derivado"]).optional(),
  comuna: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

const QuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));
    const filters = FiltersSchema.parse(Object.fromEntries(searchParams));

    const { items, nextCursor, total } = await listLeads(filters, {
      cursor: query.cursor,
      limit: query.limit,
    });

    return NextResponse.json({ items, nextCursor, total });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Parámetros inválidos", details: error.flatten() }, { status: 400 });
    }
    console.error("[sales-gama/leads] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}