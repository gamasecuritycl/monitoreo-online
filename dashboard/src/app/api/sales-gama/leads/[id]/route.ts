import { NextRequest, NextResponse } from "next/server";
import { getLeadWithMessages } from "@/lib/sales-gama/supabase";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().uuid(),
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