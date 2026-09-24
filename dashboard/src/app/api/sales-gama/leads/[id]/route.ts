import { NextRequest, NextResponse } from "next/server";
import { getLeadWithMessages, updateLeadStatus } from "@/lib/sales-gama/supabase";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const UpdateStatusSchema = z.object({
  estado: z.enum(["nuevo", "caliente", "cerrado", "derivado"]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = ParamsSchema.parse(await params);

    const result = await getLeadWithMessages(id);
    if (!result) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const { lead, messages } = result;
    return NextResponse.json({ lead, messages });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "ID inválido", details: error.flatten() }, { status: 400 });
    }
    console.error("[sales-gama/leads/[id]] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = ParamsSchema.parse(await params);
    const body = await request.json();
    const { estado } = UpdateStatusSchema.parse(body);

    const success = await updateLeadStatus(id, estado);
    if (!success) {
      return NextResponse.json({ error: "No se pudo actualizar el lead" }, { status: 500 });
    }

    return NextResponse.json({ success: true, estado });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.flatten() }, { status: 400 });
    }
    console.error("[sales-gama/leads/[id]] PATCH Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}