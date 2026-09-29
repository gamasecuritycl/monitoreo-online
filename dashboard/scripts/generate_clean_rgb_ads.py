import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

uploaded_dir = r"C:\Users\tetor\.gemini\antigravity-ide\brain\59f5622e-d309-498f-a2f4-dbd77e0922b6\.user_uploaded"
artifact_dir = r"C:\Users\tetor\.gemini\antigravity-ide\brain\59f5622e-d309-498f-a2f4-dbd77e0922b6"
public_ads_dir = r"c:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\dashboard\public\ads"
os.makedirs(public_ads_dir, exist_ok=True)

# Load clean isolated cutouts
central_raw = Image.open(os.path.join(public_ads_dir, "clean_central.png")).convert("RGBA")
presencia_raw = Image.open(os.path.join(public_ads_dir, "clean_presencia.png")).convert("RGBA")
apertura_raw = Image.open(os.path.join(public_ads_dir, "clean_apertura.png")).convert("RGBA")
control_raw = Image.open(os.path.join(public_ads_dir, "clean_control.png")).convert("RGBA")
logo_raw = Image.open(os.path.join(uploaded_dir, "media_1790276391412.png")).convert("RGBA")

# Fonts
font_dir = r"C:\Windows\Fonts"
f_hero = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 40)
f_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 32)
f_subtitle = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 23)
f_badge = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 19)
f_price_num = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 44)
f_price_lbl = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 19)
f_price_sub = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 17)
f_prod_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 18)
f_prod_sub = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 15)
f_cta = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 28)

# Shadows for clean products
def add_shadow(img, offset=(6, 12), blur=10, opacity=140):
    w, h = img.size
    shadow = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    alpha = img.split()[-1]
    black = Image.new("RGBA", (w, h), (0, 0, 0, opacity))
    shadow.paste(black, (20 + offset[0], 20 + offset[1]), alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    comp = Image.new("RGBA", shadow.size, (0, 0, 0, 0))
    comp.paste(shadow, (0, 0))
    comp.paste(img, (20, 20), img)
    return comp

# Standard product size for 4-in-a-row layout
p_central = add_shadow(central_raw.resize((190, 210), Image.Resampling.LANCZOS))
p_presencia = add_shadow(presencia_raw.resize((200, 210), Image.Resampling.LANCZOS))
p_apertura = add_shadow(apertura_raw.resize((140, 210), Image.Resampling.LANCZOS))
p_control = add_shadow(control_raw.resize((170, 205), Image.Resampling.LANCZOS))

# Hero size for single-focus ads
hero_p = add_shadow(presencia_raw.resize((270, 280), Image.Resampling.LANCZOS), offset=(10, 16), blur=14)
hero_c = add_shadow(control_raw.resize((230, 275), Image.Resampling.LANCZOS), offset=(10, 16), blur=14)
hero_a = add_shadow(apertura_raw.resize((180, 280), Image.Resampling.LANCZOS), offset=(10, 16), blur=14)
hero_cnt = add_shadow(central_raw.resize((260, 280), Image.Resampling.LANCZOS), offset=(10, 16), blur=14)

ADS_DEFINITIONS = [
    {
        "num": 1,
        "tag": "EQUIPO 100% TUYO · SIN ARRIENDOS",
        "title": "Pack Alarma VETTI en Propiedad",
        "subtitle": "La alarma es tuya para siempre. Sin contratos de amarre.",
        "focus": "pack",
        "b1": "Tecnología Brasilera VETTI Multivía",
        "b2": "Central Receptora 24/7 en < 2 Minutos",
        "b3": "Control total desde tu celular con App Móvil"
    },
    {
        "num": 2,
        "tag": "100% INMUNE A MASCOTAS (20 KG)",
        "title": "Alarma Inteligente VETTI Antimascotas",
        "subtitle": "Tu perro o gato pasean libres sin activar falsas alarmas.",
        "focus": "presencia",
        "b1": "Sensor PIR con discriminación biométrica de 20 kg",
        "b2": "Pilas comunes con duración récord de 4 años",
        "b3": "Detección panorámica 120° x 12 metros de fondo"
    },
    {
        "num": 3,
        "tag": "SEGURIDAD MIENTRAS DUERMES",
        "title": "Modo Noche & Control 4 Botones",
        "subtitle": "Armado perimetral con Botón de Pánico SOS en tu velador.",
        "focus": "control",
        "b1": "Arma el perímetro y camina libre por tu casa",
        "b2": "Botón SOS rojo para emergencias o asalto",
        "b3": "Control de bolsillo ultrafino (7,8 mm / 12g)"
    },
    {
        "num": 4,
        "tag": "ESTÉTICA MINIMALISTA · CERO CABLES",
        "title": "Sensor de Apertura Ultrafino",
        "subtitle": "Casi invisible en tu puerta. Sin perforaciones ni canaletas.",
        "focus": "apertura",
        "b1": "Detección magnética anticipada de forzamiento",
        "b2": "100% inalámbrico con alcance de 100 metros",
        "b3": "Instalación limpia y rápida en menos de 2 horas"
    },
    {
        "num": 5,
        "tag": "NANO-CONSUMO DE ENERGÍA",
        "title": "Batería de 4 Años de Duración",
        "subtitle": "Olvídate de cambiar pilas a cada rato en tus sensores.",
        "focus": "presencia",
        "b1": "Ingeniería VETTI de ultra bajo consumo",
        "b2": "Funciona con pilas estándar de fácil recambio",
        "b3": "Aviso automático de batería baja al celular"
    },
    {
        "num": 6,
        "tag": "CONECTIVIDAD MULTIVÍA ANTI-SABOTAJE",
        "title": "Central Activa Aunque Corten la Luz",
        "subtitle": "Batería de respaldo interna y transmisión redundante 4G.",
        "focus": "central",
        "b1": "5 Vías: Ethernet RJ-45, DTMF, Wi-Fi y 4G",
        "b2": "Sigue transmitiendo durante cortes de energía",
        "b3": "Aviso inmediato de corte eléctrico a la central"
    },
    {
        "num": 7,
        "tag": "DOBLE CONTROL TOTAL",
        "title": "Tu Celular + Control de Bolsillo",
        "subtitle": "Maneja tu alarma desde tu smartphone o con tu llavero.",
        "focus": "pack",
        "b1": "App Móvil: notificaciones en vivo y armado remoto",
        "b2": "Control físico: armado con 1 clic para tus hijos",
        "b3": "Botón de pánico SOS siempre al alcance"
    },
    {
        "num": 8,
        "tag": "ESPECIAL DEPARTAMENTOS Y CASAS",
        "title": "El Pack Exacto para tu Departamento",
        "subtitle": "Protege los puntos críticos de entrada sin pagar de más.",
        "focus": "pack",
        "b1": "Puerta principal + Sensor de living + Control SOS",
        "b2": "Cubre el 80% de los accesos vulnerables",
        "b3": "El equipo es 100% tuyo (sin letras chicas)"
    },
    {
        "num": 9,
        "tag": "PROTECCIÓN PARA COMERCIO Y PYMES",
        "title": "Pack VETTI para Locales Comerciales",
        "subtitle": "Seguridad para cortinas metálicas y auxilio bajo mesón.",
        "focus": "control",
        "b1": "Botón SOS de pánico silencioso anti-asalto",
        "b2": "Reporte diario de aperturas y cierres en tu celular",
        "b3": "Respuesta prioritaria con Carabineros OS-10"
    },
    {
        "num": 10,
        "tag": "OFERTA EXCLUSIVA DE LANZAMIENTO",
        "title": "Instalación Express en 24 Horas",
        "subtitle": "Asegura hoy tu Pack VETTI al mejor precio de Chile.",
        "focus": "pack",
        "b1": "Equipos: $180.000 + IVA (100% de tu propiedad)",
        "b2": "Monitoreo 24/7: Desde 0,9 UF + IVA al mes",
        "b3": "Técnicos propios en V Región y Región Metropolitana"
    }
]

def render_ad_clean(data):
    W, H = 1080, 1080
    # Solid clean dark blue background (RGB, ZERO alpha bugs, ZERO white circles)
    im = Image.new("RGB", (W, H), (8, 18, 34))
    draw = ImageDraw.Draw(im)

    # Subtle elegant border
    draw.rounded_rectangle([15, 15, W - 15, H - 15], radius=20, outline=(25, 52, 88), width=2)

    # 1. TOP HEADER (y: 35 to 110)
    logo_size = 76
    resized_logo = logo_raw.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    im.paste(resized_logo, (45, 32), resized_logo)

    draw.text((135, 36), "GAMA SECURITY", font=f_title, fill=(255, 255, 255))
    draw.text((135, 78), "CENTRAL DE MONITOREO 24/7 · CHILE", font=f_badge, fill=(41, 151, 255))

    # Top Tag Pill on right
    tag_w = 460
    draw.rounded_rectangle([W - tag_w - 45, 42, W - 45, 96], radius=24, fill=(16, 38, 70), outline=(41, 151, 255), width=2)
    draw.text((W - tag_w - 20, 56), data["tag"], font=f_badge, fill=(255, 255, 255))

    # 2. HEADLINE & SUBTITLE (y: 125 to 220)
    draw.text((45, 130), data["title"], font=f_hero, fill=(255, 255, 255))
    draw.text((45, 185), data["subtitle"], font=f_subtitle, fill=(160, 185, 215))

    # 3. PRODUCT SHOWCASE CONTAINER (y: 235 to 640)
    draw.rounded_rectangle([45, 235, W - 45, 640], radius=18, fill=(12, 26, 48), outline=(28, 56, 96), width=1)

    focus = data["focus"]
    if focus == "pack":
        # 4 items cleanly presented
        items = [
            (p_central, "Central VETTI", "Multivía RJ45/4G", 65),
            (p_presencia, "Sensor Presencia", "Inmune Mascotas 20kg", 305),
            (p_apertura, "Sensor Apertura", "Ultrafino Puerta", 545),
            (p_control, "Control 4 Botones", "Con Botón Pánico SOS", 785)
        ]
        for p_img, p_name, p_sub, x in items:
            # Clean individual dark pedestal
            draw.rounded_rectangle([x, 250, x + 225, 625], radius=14, fill=(17, 36, 66), outline=(35, 70, 120), width=1)
            # Paste product with shadow
            im.paste(p_img, (x + 8, 265), p_img)
            # Labels
            draw.text((x + 14, 535), p_name, font=f_prod_title, fill=(255, 255, 255))
            draw.text((x + 14, 565), p_sub, font=f_prod_sub, fill=(41, 151, 255))
            draw.text((x + 14, 595), "✓ INCLUIDO EN PACK", font=f_prod_sub, fill=(52, 211, 153))

    elif focus == "presencia":
        im.paste(hero_p, (70, 260), hero_p)
        tx = 430
        draw.text((tx, 275), "SMART SENSOR DE PRESENCIA VETTI", font=f_title, fill=(41, 151, 255))
        draw.text((tx, 335), f"• {data['b1']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 385), f"• {data['b2']}", font=f_subtitle, fill=(52, 211, 153))
        draw.text((tx, 435), f"• {data['b3']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 485), "• Llave Tamper anti-sabotaje integrada", font=f_subtitle, fill=(160, 185, 215))
        draw.rounded_rectangle([tx, 550, W - 70, 615], radius=10, fill=(18, 40, 75), outline=(41, 151, 255), width=1)
        draw.text((tx + 20, 568), "Pack incluye: Central VETTI + Sensor Puerta + Control 4B", font=f_badge, fill=(255, 255, 255))

    elif focus == "control":
        im.paste(hero_c, (90, 260), hero_c)
        tx = 430
        draw.text((tx, 275), "SMART CONTROL REMOTO 4 BOTONES", font=f_title, fill=(41, 151, 255))
        draw.text((tx, 335), f"• {data['b1']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 385), f"• {data['b2']}", font=f_subtitle, fill=(239, 68, 68))
        draw.text((tx, 435), f"• {data['b3']}", font=f_subtitle, fill=(52, 211, 153))
        draw.text((tx, 485), "• Alcance de 100m con confirmación visual", font=f_subtitle, fill=(160, 185, 215))
        draw.rounded_rectangle([tx, 550, W - 70, 615], radius=10, fill=(18, 40, 75), outline=(41, 151, 255), width=1)
        draw.text((tx + 20, 568), "Pack incluye: Central VETTI + Sensor Movimiento + Sensor Puerta", font=f_badge, fill=(255, 255, 255))

    elif focus == "apertura":
        im.paste(hero_a, (110, 260), hero_a)
        tx = 430
        draw.text((tx, 275), "SMART SENSOR DE APERTURA ULTRAFINO", font=f_title, fill=(41, 151, 255))
        draw.text((tx, 335), f"• {data['b1']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 385), f"• {data['b2']}", font=f_subtitle, fill=(52, 211, 153))
        draw.text((tx, 435), f"• {data['b3']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 485), "• Casi invisible en marcos de puertas y ventanas", font=f_subtitle, fill=(160, 185, 215))
        draw.rounded_rectangle([tx, 550, W - 70, 615], radius=10, fill=(18, 40, 75), outline=(41, 151, 255), width=1)
        draw.text((tx + 20, 568), "Pack incluye: Central VETTI + Sensor Movimiento + Control 4B", font=f_badge, fill=(255, 255, 255))

    elif focus == "central":
        im.paste(hero_cnt, (80, 260), hero_cnt)
        tx = 430
        draw.text((tx, 275), "CENTRAL SMART ALARM VETTI", font=f_title, fill=(41, 151, 255))
        draw.text((tx, 335), f"• {data['b1']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 385), f"• {data['b2']}", font=f_subtitle, fill=(52, 211, 153))
        draw.text((tx, 435), f"• {data['b3']}", font=f_subtitle, fill=(255, 255, 255))
        draw.text((tx, 485), "• Protocolo Contact ID conectado a Central 24/7 GAMA", font=f_subtitle, fill=(160, 185, 215))
        draw.rounded_rectangle([tx, 550, W - 70, 615], radius=10, fill=(18, 40, 75), outline=(41, 151, 255), width=1)
        draw.text((tx + 20, 568), "Pack incluye: 2 Sensores (Movimiento y Puerta) + Control 4B", font=f_badge, fill=(255, 255, 255))

    # 4. BOTTOM PRICING SECTION (y: 660 to 895)
    # Left Card: EQUIPOS $180.000 + IVA
    draw.rounded_rectangle([45, 665, 525, 895], radius=16, fill=(14, 30, 58), outline=(41, 151, 255), width=2)
    draw.text((70, 685), "EQUIPO 100% EN PROPIEDAD", font=f_badge, fill=(41, 151, 255))
    draw.text((70, 720), "$180.000", font=f_price_num, fill=(255, 255, 255))
    draw.text((320, 735), "+ IVA", font=f_subtitle, fill=(160, 185, 215))
    draw.text((70, 788), "• Central VETTI + 1 Control 4 Botones", font=f_price_lbl, fill=(225, 238, 255))
    draw.text((70, 820), "• 1 Sensor Presencia + 1 Sensor Puerta", font=f_price_lbl, fill=(225, 238, 255))
    draw.text((70, 852), "✓ Sin arriendos ni contratos abusivos", font=f_price_lbl, fill=(52, 211, 153))

    # Right Card: MONITOREO 0,9 UF + IVA/MES
    draw.rounded_rectangle([555, 665, W - 45, 895], radius=16, fill=(14, 30, 58), outline=(52, 211, 153), width=2)
    draw.text((580, 685), "MONITOREO PROFESIONAL 24/7", font=f_badge, fill=(52, 211, 153))
    draw.text((580, 720), "0,9 UF", font=f_price_num, fill=(255, 255, 255))
    draw.text((735, 735), "+ IVA / mes", font=f_subtitle, fill=(160, 185, 215))
    draw.text((580, 788), "• Verificación humana en < 2 minutos", font=f_price_lbl, fill=(225, 238, 255))
    draw.text((580, 820), "• Notificaciones en tiempo real en App", font=f_price_lbl, fill=(225, 238, 255))
    draw.text((580, 852), "✓ Coordinación directa Carabineros OS-10", font=f_price_lbl, fill=(41, 151, 255))

    # 5. ULTRA-CLEAN CTA BUTTON (y: 920 to 1030)
    draw.rounded_rectangle([45, 920, W - 45, 1030], radius=20, fill=(0, 102, 204), outline=(41, 151, 255), width=2)
    draw.text((120, 952), "COTIZAR PACK VETTI POR WHATSAPP 📲  +56 9 9101 6912", font=f_cta, fill=(255, 255, 255))

    out_file = f"vetti_ad_{data['num']}.png"
    im.save(os.path.join(public_ads_dir, out_file), "PNG")
    im.save(os.path.join(artifact_dir, out_file), "PNG")
    print(f"Ad {data['num']} rendered without circle or artifacts.")

for d in ADS_DEFINITIONS:
    render_ad_clean(d)

print("All 10 Meta Ads successfully regenerated cleanly in RGB!")
