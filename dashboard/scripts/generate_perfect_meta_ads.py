import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

uploaded_dir = r"C:\Users\tetor\.gemini\antigravity-ide\brain\59f5622e-d309-498f-a2f4-dbd77e0922b6\.user_uploaded"
artifact_dir = r"C:\Users\tetor\.gemini\antigravity-ide\brain\59f5622e-d309-498f-a2f4-dbd77e0922b6"
public_ads_dir = r"c:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\dashboard\public\ads"
os.makedirs(public_ads_dir, exist_ok=True)

# Load isolated transparent products
central_raw = Image.open(os.path.join(public_ads_dir, "isolated_central.png")).convert("RGBA")
presencia_raw = Image.open(os.path.join(public_ads_dir, "isolated_presencia.png")).convert("RGBA")
apertura_raw = Image.open(os.path.join(public_ads_dir, "isolated_apertura.png")).convert("RGBA")
control_raw = Image.open(os.path.join(public_ads_dir, "isolated_control.png")).convert("RGBA")
logo_raw = Image.open(os.path.join(public_ads_dir, "user_logo.png")).convert("RGBA")

# Fonts
font_dir = r"C:\Windows\Fonts"
f_hero = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 46)
f_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 36)
f_subtitle = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 26)
f_badge = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 22)
f_price_num = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 44)
f_price_lbl = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 20)
f_prod_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 19)
f_prod_sub = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 17)
f_cta = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 28)

def add_shadow(img, offset=(10, 18), blur=14, opacity=170):
    w, h = img.size
    shadow = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0))
    alpha = img.split()[-1]
    black = Image.new("RGBA", (w, h), (0, 0, 0, opacity))
    shadow.paste(black, (30 + offset[0], 30 + offset[1]), alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    # Paste real image over shadow
    composite = Image.new("RGBA", shadow.size, (0, 0, 0, 0))
    composite.paste(shadow, (0, 0))
    composite.paste(img, (30, 30), img)
    return composite

# Pre-render shadowed elements
shadow_central = add_shadow(central_raw.resize((210, 230), Image.Resampling.LANCZOS))
shadow_presencia = add_shadow(presencia_raw.resize((220, 230), Image.Resampling.LANCZOS))
shadow_apertura = add_shadow(apertura_raw.resize((150, 230), Image.Resampling.LANCZOS))
shadow_control = add_shadow(control_raw.resize((170, 220), Image.Resampling.LANCZOS))

# Hero sizes for featured views
hero_presencia = add_shadow(presencia_raw.resize((310, 325), Image.Resampling.LANCZOS), offset=(14, 24), blur=18)
hero_control = add_shadow(control_raw.resize((250, 325), Image.Resampling.LANCZOS), offset=(14, 24), blur=18)
hero_apertura = add_shadow(apertura_raw.resize((210, 325), Image.Resampling.LANCZOS), offset=(14, 24), blur=18)
hero_central = add_shadow(central_raw.resize((300, 330), Image.Resampling.LANCZOS), offset=(14, 24), blur=18)

ADS_DEFINITIONS = [
    {
        "num": 1,
        "tag": "EQUIPO 100% TUYO · SIN ARRIENDOS",
        "title": "Pack Alarma VETTI en Propiedad",
        "subtitle": "La alarma es tuya para siempre. Sin contratos de amarre.",
        "focus": "pack",
        "bullet1": "Tecnología Brasilera VETTI Multivía",
        "bullet2": "Central Receptora 24/7 en < 2 Minutos",
        "bullet3": "Control total desde tu celular con App Móvil"
    },
    {
        "num": 2,
        "tag": "100% INMUNE A MASCOTAS (20 KG)",
        "title": "Alarma Inteligente VETTI Antimascotas",
        "subtitle": "Tu perro o gato pasean libres sin activar falsas alarmas.",
        "focus": "presencia",
        "bullet1": "Sensor PIR con discriminación biométrica",
        "bullet2": "Pilas comunes con duración récord de 4 años",
        "bullet3": "Detección panorámica 120° x 12 metros"
    },
    {
        "num": 3,
        "tag": "SEGURIDAD MIENTRAS DUERMES",
        "title": "Modo Noche & Control 4 Botones",
        "subtitle": "Armado perimetral con Botón de Pánico SOS en tu velador.",
        "focus": "control",
        "bullet1": "Arma el perímetro y camina libre por tu casa",
        "bullet2": "Botón SOS rojo para emergencias o asalto",
        "bullet3": "Control ultrafino de 7,8 mm (solo 12 gramos)"
    },
    {
        "num": 4,
        "tag": "ESTÉTICA MINIMALISTA · CERO CABLES",
        "title": "Sensor de Apertura Ultrafino",
        "subtitle": "Casi invisible en tu puerta. Sin perforaciones ni canaletas.",
        "focus": "apertura",
        "bullet1": "Detección magnética anticipada de forzamiento",
        "bullet2": "100% inalámbrico con alcance de 100 metros",
        "bullet3": "Instalación limpia y rápida en menos de 2 horas"
    },
    {
        "num": 5,
        "tag": "NANO-CONSUMO DE ENERGÍA",
        "title": "Batería de 4 Años de Duración",
        "subtitle": "Olvídate de cambiar pilas a cada rato en tus sensores.",
        "focus": "presencia",
        "bullet1": "Ingeniería VETTI de ultra bajo consumo",
        "bullet2": "Funciona con pilas estándar de fácil recambio",
        "bullet3": "Aviso automático de batería baja al celular"
    },
    {
        "num": 6,
        "tag": "CONECTIVIDAD MULTIVÍA ANTI-SABOTAJE",
        "title": "Central Activa Aunque Corten la Luz",
        "subtitle": "Batería de respaldo interna y transmisión redundante 4G.",
        "focus": "central",
        "bullet1": "5 Vías: Ethernet RJ-45, DTMF, Wi-Fi y 4G",
        "bullet2": "Sigue transmitiendo durante cortes de energía",
        "bullet3": "Aviso inmediato de corte eléctrico a la central"
    },
    {
        "num": 7,
        "tag": "DOBLE CONTROL TOTAL",
        "title": "Tu Celular + Control de Bolsillo",
        "subtitle": "Maneja tu alarma desde tu smartphone o con tu llavero.",
        "focus": "pack",
        "bullet1": "App Móvil: notificaciones en vivo y estado",
        "bullet2": "Control físico: armado con 1 clic para tus hijos",
        "bullet3": "Botón de pánico SOS siempre al alcance"
    },
    {
        "num": 8,
        "tag": "ESPECIAL DEPARTAMENTOS Y CASAS",
        "title": "El Pack Exacto para tu Departamento",
        "subtitle": "Protege los puntos críticos de entrada sin pagar de más.",
        "focus": "pack",
        "bullet1": "Puerta principal + Sensor de living + Control",
        "bullet2": "Cubre el 80% de los accesos vulnerables",
        "bullet3": "El equipo es 100% tuyo (sin letras chicas)"
    },
    {
        "num": 9,
        "tag": "PROTECCIÓN PARA COMERCIO Y PYMES",
        "title": "Pack VETTI para Locales Comerciales",
        "subtitle": "Seguridad para cortinas metálicas y botón de auxilio bajo mesón.",
        "focus": "control",
        "bullet1": "Botón SOS de pánico silencioso anti-asalto",
        "bullet2": "Reporte diario de aperturas y cierres",
        "bullet3": "Respuesta prioritaria con Carabineros OS-10"
    },
    {
        "num": 10,
        "tag": "OFERTA EXCLUSIVA DE LANZAMIENTO",
        "title": "Instalación Express en 24 Horas",
        "subtitle": "Asegura hoy tu Pack VETTI al mejor precio de Chile.",
        "focus": "pack",
        "bullet1": "Equipos: $180.000 + IVA (100% de tu propiedad)",
        "bullet2": "Monitoreo 24/7: Desde 0,9 UF + IVA al mes",
        "bullet3": "Técnicos propios en V Región y Región Metropolitana"
    }
]

def render_ad(data):
    W, H = 1080, 1080
    im = Image.new("RGBA", (W, H), (6, 15, 30, 255))
    draw = ImageDraw.Draw(im)

    # 1. Subtle high-tech gradient lighting
    for r in range(500, 0, -10):
        alpha = int((1 - r / 500.0) * 55)
        draw.ellipse([W//2 - r, 420 - r, W//2 + r, 420 + r], fill=(0, 102, 204, alpha))

    # Fine border
    draw.rounded_rectangle([18, 18, W - 18, H - 18], radius=24, outline=(30, 60, 100), width=2)

    # 2. Top Header Bar
    logo_w, logo_h = 85, 85
    resized_logo = logo_raw.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    im.paste(resized_logo, (50, 40), resized_logo)

    draw.text((150, 48), "GAMA SECURITY", font=f_title, fill=(255, 255, 255))
    draw.text((150, 92), "CENTRAL DE MONITOREO 24/7 · CHILE", font=f_badge, fill=(41, 151, 255))

    # Top Tag Pill
    tag_text = data["tag"]
    draw.rounded_rectangle([540, 52, 1020, 108], radius=28, fill=(15, 36, 68), outline=(41, 151, 255), width=2)
    draw.text((565, 68), tag_text, font=f_badge, fill=(255, 255, 255))

    # 3. Main Headlines (clean, zero clutter)
    draw.text((50, 150), data["title"], font=f_hero, fill=(255, 255, 255))
    draw.text((50, 210), data["subtitle"], font=f_subtitle, fill=(180, 205, 235))

    # 4. Product Showcase Area (y: 260 to 650)
    # Stage platform background with glassmorphism style
    draw.rounded_rectangle([45, 265, 1035, 665], radius=22, fill=(12, 25, 48, 220), outline=(32, 64, 105), width=2)

    focus = data["focus"]
    if focus == "pack":
        # Draw the 4 transparent items side-by-side with beautiful floating pedestals
        cards = [
            (shadow_central, "Central Smart VETTI", "Multivía RJ45 / 4G", 70),
            (shadow_presencia, "Sensor Presencia", "Inmune Mascotas 20kg", 310),
            (shadow_apertura, "Sensor Apertura", "Ultrafino Magnético", 550),
            (shadow_control, "Control 4 Botones", "Con Botón Pánico SOS", 780)
        ]
        for shadow_item, p_name, p_sub, x_pos in cards:
            # Subtle glass pedestal
            draw.rounded_rectangle([x_pos, 285, x_pos + 225, 645], radius=16, fill=(18, 40, 75, 160), outline=(41, 151, 255, 80), width=1)
            # Paste product with shadow
            im.paste(shadow_item, (x_pos - 18, 290), shadow_item)
            # Labels
            draw.text((x_pos + 14, 555), p_name, font=f_prod_title, fill=(255, 255, 255))
            draw.text((x_pos + 14, 585), p_sub, font=f_prod_sub, fill=(41, 151, 255))
            draw.text((x_pos + 14, 615), "✓ INCLUIDO EN PACK", font=f_prod_sub, fill=(52, 211, 153))

    elif focus == "presencia":
        # Featured Sensor Presencia
        im.paste(hero_presencia, (60, 280), hero_presencia)
        tx = 430
        draw.text((tx, 305), "SMART SENSOR DE PRESENCIA VETTI", font=f_title, fill=(41, 151, 255))
        draw.text((tx, 365), f"• {data['bullet1']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 415), f"• {data['bullet2']}", font=f_subtitle, fill=(52, 211, 153))
        draw.text((tx, 465), f"• {data['bullet3']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 515), "• Llave Tamper anti-sabotaje integrada", font=f_subtitle, fill=(180, 205, 235))
        # Mini pack summary box
        draw.rounded_rectangle([tx, 575, 990, 635], radius=12, fill=(18, 40, 75), outline=(41, 151, 255, 120), width=1)
        draw.text((tx + 20, 592), "Pack incluye: Central VETTI + Sensor Puerta + Control 4B", font=f_badge, fill=(255, 255, 255))

    elif focus == "control":
        # Featured Control Remoto 4 botones
        im.paste(hero_control, (90, 280), hero_control)
        tx = 430
        draw.text((tx, 305), "SMART CONTROL REMOTO 4 BOTONES", font=f_title, fill=(41, 151, 255))
        draw.text((tx, 365), f"• {data['bullet1']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 415), f"• {data['bullet2']}", font=f_subtitle, fill=(239, 68, 68))
        draw.text((tx, 465), f"• {data['bullet3']}", font=f_subtitle, fill=(52, 211, 153))
        draw.text((tx, 515), "• Alcance de 100m y batería de larga duración", font=f_subtitle, fill=(180, 205, 235))
        draw.rounded_rectangle([tx, 575, 990, 635], radius=12, fill=(18, 40, 75), outline=(41, 151, 255, 120), width=1)
        draw.text((tx + 20, 592), "Pack incluye: Central VETTI + Sensor Presencia + Sensor Puerta", font=f_badge, fill=(255, 255, 255))

    elif focus == "apertura":
        # Featured Sensor Apertura Ultrafino
        im.paste(hero_apertura, (110, 280), hero_apertura)
        tx = 430
        draw.text((tx, 305), "SMART SENSOR DE APERTURA ULTRAFINO", font=f_title, fill=(41, 151, 255))
        draw.text((tx, 365), f"• {data['bullet1']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 415), f"• {data['bullet2']}", font=f_subtitle, fill=(52, 211, 153))
        draw.text((tx, 465), f"• {data['bullet3']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 515), "• Discreto y casi invisible en marcos de acceso", font=f_subtitle, fill=(180, 205, 235))
        draw.rounded_rectangle([tx, 575, 990, 635], radius=12, fill=(18, 40, 75), outline=(41, 151, 255, 120), width=1)
        draw.text((tx + 20, 592), "Pack incluye: Central VETTI + Sensor Presencia + Control 4B", font=f_badge, fill=(255, 255, 255))

    elif focus == "central":
        # Featured Central Smart Vetti
        im.paste(hero_central, (70, 280), hero_central)
        tx = 430
        draw.text((tx, 305), "CENTRAL SMART ALARM VETTI", font=f_title, fill=(41, 151, 255))
        draw.text((tx, 365), f"• {data['bullet1']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 415), f"• {data['bullet2']}", font=f_subtitle, fill=(52, 211, 153))
        draw.text((tx, 465), f"• {data['bullet3']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 515), "• Conectada a Central Receptora 24/7 de GAMA", font=f_subtitle, fill=(180, 205, 235))
        draw.rounded_rectangle([tx, 575, 990, 635], radius=12, fill=(18, 40, 75), outline=(41, 151, 255, 120), width=1)
        draw.text((tx + 20, 592), "Pack incluye: 2 Sensores (Movimiento y Puerta) + Control 4B", font=f_badge, fill=(255, 255, 255))

    # 5. BOTTOM PRICING SECTION (Clean, High Contrast, High Conversion)
    # Left Card: EQUIPOS $180.000 + IVA
    draw.rounded_rectangle([45, 685, 525, 905], radius=18, fill=(15, 34, 66), outline=(41, 151, 255), width=2)
    draw.text((70, 705), "EQUIPO 100% EN PROPIEDAD", font=f_badge, fill=(41, 151, 255))
    draw.text((70, 740), "$180.000", font=f_price_num, fill=(255, 255, 255))
    draw.text((325, 755), "+ IVA", font=f_subtitle, fill=(180, 205, 235))
    draw.text((70, 810), "• Central VETTI + Control 4 Botones", font=f_price_lbl, fill=(225, 238, 255))
    draw.text((70, 840), "• Sensor Movimiento + Sensor Puerta", font=f_price_lbl, fill=(225, 238, 255))
    draw.text((70, 870), "✓ Sin arriendos ni contratos abusivos", font=f_price_lbl, fill=(52, 211, 153))

    # Right Card: MONITOREO 0,9 UF + IVA/MES
    draw.rounded_rectangle([555, 685, 1035, 905], radius=18, fill=(15, 34, 66), outline=(52, 211, 153), width=2)
    draw.text((580, 705), "MONITOREO PROFESIONAL 24/7", font=f_badge, fill=(52, 211, 153))
    draw.text((580, 740), "0,9 UF", font=f_price_num, fill=(255, 255, 255))
    draw.text((740, 755), "+ IVA / mes", font=f_subtitle, fill=(180, 205, 235))
    draw.text((580, 810), "• Verificación humana en < 2 minutos", font=f_price_lbl, fill=(225, 238, 255))
    draw.text((580, 840), "• Notificaciones en tiempo real en App", font=f_price_lbl, fill=(225, 238, 255))
    draw.text((580, 870), "✓ Coordinación directa Carabineros OS-10", font=f_price_lbl, fill=(41, 151, 255))

    # 6. Ultra-Visible Call To Action Button
    draw.rounded_rectangle([45, 930, 1035, 1035], radius=24, fill=(0, 102, 204), outline=(41, 151, 255), width=2)
    cta_text = "COTIZAR PACK VETTI POR WHATSAPP 📲  +56 9 9101 6912"
    draw.text((115, 962), cta_text, font=f_cta, fill=(255, 255, 255))

    # Save
    out_file = f"vetti_ad_{data['num']}.png"
    im.save(os.path.join(public_ads_dir, out_file), "PNG")
    im.save(os.path.join(artifact_dir, out_file), "PNG")
    print(f"Generated {out_file} successfully")

for d in ADS_DEFINITIONS:
    render_ad(d)

print("All 10 Meta Ads successfully regenerated with transparent isolated products!")
