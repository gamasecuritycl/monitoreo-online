import os
from PIL import Image, ImageDraw, ImageFont

# Directories
uploaded_dir = r"C:\Users\tetor\.gemini\antigravity-ide\brain\59f5622e-d309-498f-a2f4-dbd77e0922b6\.user_uploaded"
artifact_dir = r"C:\Users\tetor\.gemini\antigravity-ide\brain\59f5622e-d309-498f-a2f4-dbd77e0922b6"
public_ads_dir = r"c:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\dashboard\public\ads"
os.makedirs(public_ads_dir, exist_ok=True)

# Load real source images
im_elements1 = Image.open(os.path.join(uploaded_dir, "media_1790511574229.png"))
im_elements2 = Image.open(os.path.join(uploaded_dir, "media_1790511580527.png"))
im_lineup = Image.open(os.path.join(uploaded_dir, "media_1790511563124.png"))
im_logo = Image.open(os.path.join(uploaded_dir, "media_1790276391412.png"))

# Precise crops of real VETTI hardware
# Central Vetti:
crop_central = im_elements1.crop((70, 20, 300, 260))
# Sensor Presencia:
crop_presencia = im_elements1.crop((320, 20, 560, 260))
# Sensor Apertura:
crop_apertura = im_elements1.crop((620, 20, 800, 260))
# Control Remoto 4 botones:
crop_control = im_elements2.crop((350, 30, 540, 250))
# Full lineup:
crop_lineup = im_lineup.crop((0, 90, im_lineup.width, 320))

# Fonts
font_dir = r"C:\Windows\Fonts"
f_hero = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 52)
f_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 38)
f_subtitle = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 28)
f_badge = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 32)
f_small_bold = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 22)
f_small = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 20)
f_price_big = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 48)

ADS_DATA = [
    {
        "num": 1,
        "tag": "EQUIPO 100% TUYO · SIN ARRIENDOS",
        "title": "Pack Alarma VETTI en Propiedad",
        "subtitle": "La alarma es tuya para siempre. Sin contratos forzosos.",
        "highlight": "Central + 1 Sensor Movimiento + 1 Apertura + 1 Control 4B",
        "feature1": "Tecnologia Brasilera de Alta Gama",
        "feature2": "Verificacion Humana 24/7 en < 2 Minutos",
        "feature3": "Control total desde tu celular con App Movil",
        "focus": "hero_pack"
    },
    {
        "num": 2,
        "tag": "CERO FALSAS ALARMAS · 100% EFECTIVA",
        "title": "Sensor Inmune a Mascotas (20 kg)",
        "subtitle": "Tu perro o gato pasean libres sin activar la alarma.",
        "highlight": "Sensor PIR Biometrico + Control 4B con SOS",
        "feature1": "Discriminacion inteligente hasta 20 kilos",
        "feature2": "Pilas comunes con duracion record de 4 anos",
        "feature3": "Angulo de deteccion 120° y 12m de alcance",
        "focus": "presencia"
    },
    {
        "num": 3,
        "tag": "SEGURIDAD MIENTRAS DUERMES",
        "title": "Modo Noche & Control 4 Botones",
        "subtitle": "Armado perimetral con boton de Panico SOS directo.",
        "highlight": "Control Remoto Ultrafino de 7,8 mm (12 gramos)",
        "feature1": "Arma el perimetro y camina libre por tu casa",
        "feature2": "Boton SOS para emergencias medicas o asalto",
        "feature3": "Confirmacion silenciosa o audible instantanea",
        "focus": "control"
    },
    {
        "num": 4,
        "tag": "ESTETICA MINIMALISTA · CERO CABLES",
        "title": "Sensor de Apertura Ultrafino",
        "subtitle": "Casi invisible en tu puerta. Sin perforaciones ni canaletas.",
        "highlight": "100% Inalambrico con Deteccion Anticipada",
        "feature1": "Diseno ultrafino de maxima discrecion",
        "feature2": "Alcance de hasta 100 metros en zonas libres",
        "feature3": "Instalacion limpia y express en menos de 2 horas",
        "focus": "apertura"
    },
    {
        "num": 5,
        "tag": "TECNOLOGIA NANO-CONSUMO VETTI",
        "title": "Bateria de 4 Anos de Duracion",
        "subtitle": "Olvidate de subirte a cambiar pilas cada pocos meses.",
        "highlight": "Maxima Autonomia con Pilas Estandar",
        "feature1": "Sensores ultra eficientes con nano-consumo",
        "feature2": "Aviso automatico de bateria baja al celular",
        "feature3": "Cero costos imprevistos de mantencion",
        "focus": "presencia"
    },
    {
        "num": 6,
        "tag": "CONECTIVIDAD MULTIVIA ANTI-SABOTAJE",
        "title": "Central Activa Aunque Corten la Luz",
        "subtitle": "Bateria de respaldo interna y transmision redundante.",
        "highlight": "5 Vias: Ethernet RJ-45, DTMF, Wi-Fi y 4G",
        "feature1": "Sigue transmitiendo durante cortes de energia",
        "feature2": "Aviso instantaneo de corte de luz a la central",
        "feature3": "Hasta 254 sectores y 6 particiones independientes",
        "focus": "central"
    },
    {
        "num": 7,
        "tag": "COMODIDAD ABSOLUTA",
        "title": "Doble Control: Celular + Llavero",
        "subtitle": "Maneja tu alarma desde tu smartphone o con tu control fisico.",
        "highlight": "App Movil en Tiempo Real + Control 4 Botones",
        "feature1": "Notificaciones push inmediatas de apertura y cierre",
        "feature2": "Control de bolsillo facil para ninos y adultos mayores",
        "feature3": "Armado total, parcial, desarmado y pánico SOS",
        "focus": "hero_pack"
    },
    {
        "num": 8,
        "tag": "ESPECIAL DEPARTAMENTOS Y CASAS",
        "title": "El Pack Exacto para tu Hogar",
        "subtitle": "Protege los puntos criticos de entrada sin pagar de mas.",
        "highlight": "Puerta Principal + Living + Control SOS",
        "feature1": "Cubre el 80% de los accesos vulnerables",
        "feature2": "Tamano compacto ideal para departamentos",
        "feature3": "Sin cables molestos ni obras en las paredes",
        "focus": "hero_pack"
    },
    {
        "num": 9,
        "tag": "PROTECCION PARA NEGOCIOS Y PYMES",
        "title": "Pack VETTI para Locales y Tiendas",
        "subtitle": "Seguridad para cortinas, mesones de atencion y cajas.",
        "highlight": "Boton de Panico Silencioso Anti-Asalto Incluido",
        "feature1": "Reporte de apertura y cierre de tu personal",
        "feature2": "Sensor magnetico para cortina metalica o puerta",
        "feature3": "Respuesta prioritaria coordinada con Carabineros OS-10",
        "focus": "lineup"
    },
    {
        "num": 10,
        "tag": "OFERTA EXCLUSIVA DE LANZAMIENTO",
        "title": "Instalacion Express en 24 Horas",
        "subtitle": "Asegura hoy tu Pack VETTI al mejor precio de Chile.",
        "highlight": "Equipos: $180.000 + IVA · Monitoreo desde 0,9 UF",
        "feature1": "Tecnicos propios en V Region y Region Metropolitana",
        "feature2": "Instalacion y configuracion rapida garantizada",
        "feature3": "Cupos limitados por cuadrilla tecnica",
        "focus": "hero_pack"
    }
]

def make_banner(data):
    W, H = 1080, 1080
    im = Image.new("RGBA", (W, H), (5, 13, 26, 255))
    draw = ImageDraw.Draw(im)

    # Ambient gradient glow
    for r in range(400, 0, -8):
        alpha = int((1 - r / 400.0) * 45)
        draw.ellipse([W//2 - r, 380 - r, W//2 + r, 380 + r], fill=(0, 102, 204, alpha))

    # Outer border
    draw.rounded_rectangle([20, 20, W - 20, H - 20], radius=24, outline=(30, 58, 95), width=2)

    # Top Header Bar
    # Place GAMA logo top-left
    logo_resized = im_logo.resize((100, 100), Image.Resampling.LANCZOS)
    im.paste(logo_resized, (50, 45), logo_resized if logo_resized.mode == 'RGBA' else None)

    draw.text((165, 55), "GAMA SECURITY", font=f_title, fill=(255, 255, 255))
    draw.text((165, 105), "CENTRAL DE MONITOREO 24/7 · CHILE", font=f_small_bold, fill=(41, 151, 255))

    # Top-right Pill Tag
    tag_text = data["tag"]
    draw.rounded_rectangle([520, 55, 1020, 115], radius=30, fill=(15, 34, 64), outline=(41, 151, 255), width=2)
    draw.text((545, 72), tag_text, font=f_small_bold, fill=(255, 255, 255))

    # Main Headline & Subtitle
    draw.text((50, 160), data["title"], font=f_hero, fill=(255, 255, 255))
    draw.text((50, 225), data["subtitle"], font=f_subtitle, fill=(180, 200, 225))

    # Product Showcase Area (y: 280 to 620)
    # Background card for products
    draw.rounded_rectangle([50, 280, 1030, 640], radius=20, fill=(10, 22, 40, 230), outline=(30, 58, 95), width=2)

    focus = data["focus"]
    if focus == "hero_pack":
        # Draw 4 items side-by-side with frames
        items = [
            (crop_central, "Central Smart VETTI", "Multivía RJ45/4G", 80),
            (crop_presencia, "Sensor Presencia", "Inmune Mascotas 20kg", 320),
            (crop_apertura, "Sensor Apertura", "Ultrafino Puerta", 560),
            (crop_control, "Control 4 Botones", "Boton Panico SOS", 800)
        ]
        for c_img, name, sub, x_pos in items:
            # item frame
            draw.rounded_rectangle([x_pos, 300, x_pos + 215, 615], radius=14, fill=(15, 34, 64), outline=(41, 151, 255, 120), width=1)
            # Paste product image centered in top part of card
            resized = c_img.resize((170, 170), Image.Resampling.LANCZOS)
            # Create white mask/background for product
            bg_thumb = Image.new("RGBA", (175, 175), (255, 255, 255, 245))
            # paste onto thumb
            rx = (175 - resized.width) // 2
            ry = (175 - resized.height) // 2
            bg_thumb.paste(resized, (rx, ry), resized if resized.mode == 'RGBA' else None)
            im.paste(bg_thumb, (x_pos + 20, 315))

            # labels
            draw.text((x_pos + 12, 510), name, font=f_small_bold, fill=(255, 255, 255))
            draw.text((x_pos + 12, 545), sub, font=f_small, fill=(41, 151, 255))
            draw.text((x_pos + 12, 575), "✓ INCLUIDO", font=f_small_bold, fill=(52, 211, 153))

    elif focus == "presencia":
        # Featured Sensor Presencia
        res_p = crop_presencia.resize((260, 260), Image.Resampling.LANCZOS)
        bg_p = Image.new("RGBA", (280, 280), (255, 255, 255, 250))
        bg_p.paste(res_p, (10, 10), res_p if res_p.mode == 'RGBA' else None)
        im.paste(bg_p, (90, 315))

        draw.text((410, 320), "SMART SENSOR DE PRESENCIA VETTI", font=f_badge, fill=(41, 151, 255))
        draw.text((410, 375), "• Inmune a mascotas de hasta 20 kg (cero falsas alertas)", font=f_subtitle, fill=(255, 255, 255))
        draw.text((410, 425), "• Nano-consumo: Pilas duran hasta 4 ANOS", font=f_subtitle, fill=(52, 211, 153))
        draw.text((410, 475), "• Cobertura panoramica 120° x 12 metros de profundidad", font=f_subtitle, fill=(255, 255, 255))
        draw.text((410, 525), "• 100% inalambrico con llave tamper anti-sabotaje", font=f_subtitle, fill=(200, 220, 245))
        draw.rounded_rectangle([410, 570, 950, 620], radius=10, fill=(0, 102, 204, 80))
        draw.text((430, 582), "+ Incluye Central VETTI + Sensor Puerta + Control 4B", font=f_small_bold, fill=(255, 255, 255))

    elif focus == "control":
        # Featured Control 4 botones
        res_c = crop_control.resize((240, 270), Image.Resampling.LANCZOS)
        bg_c = Image.new("RGBA", (260, 290), (255, 255, 255, 250))
        bg_c.paste(res_c, (10, 10), res_c if res_c.mode == 'RGBA' else None)
        im.paste(bg_c, (90, 310))

        draw.text((390, 315), "SMART CONTROL REMOTO 4 BOTONES", font=f_badge, fill=(41, 151, 255))
        draw.text((390, 370), "• Boton SOS de Panico instantaneo para emergencias", font=f_subtitle, fill=(239, 68, 68))
        draw.text((390, 420), "• Boton Armado Parcial (Modo Noche en Casa)", font=f_subtitle, fill=(52, 211, 153))
        draw.text((390, 470), "• Armado y desarmado facil de bolsillo (12 gramos)", font=f_subtitle, fill=(255, 255, 255))
        draw.text((390, 520), "• Diseno ultrafino: solo 7,8 mm de grosor", font=f_subtitle, fill=(200, 220, 245))
        draw.rounded_rectangle([390, 570, 950, 620], radius=10, fill=(0, 102, 204, 80))
        draw.text((410, 582), "+ Incluye Central VETTI + Sensor Movimiento + Sensor Puerta", font=f_small_bold, fill=(255, 255, 255))

    elif focus == "apertura":
        # Featured Sensor Apertura
        res_a = crop_apertura.resize((200, 270), Image.Resampling.LANCZOS)
        bg_a = Image.new("RGBA", (230, 290), (255, 255, 255, 250))
        bg_a.paste(res_a, (15, 10), res_a if res_a.mode == 'RGBA' else None)
        im.paste(bg_a, (100, 310))

        draw.text((370, 315), "SMART SENSOR DE APERTURA ULTRAFINO", font=f_badge, fill=(41, 151, 255))
        draw.text((370, 370), "• Diseno compacto: casi invisible en marcos de puerta", font=f_subtitle, fill=(255, 255, 255))
        draw.text((370, 420), "• Deteccion anticipada al primer intento de forzar", font=f_subtitle, fill=(52, 211, 153))
        draw.text((370, 470), "• 100% inalambrico sin cables, canaletas ni taladros", font=f_subtitle, fill=(255, 255, 255))
        draw.text((370, 520), "• Alcance de 100m en zonas libres y 30m con paredes", font=f_subtitle, fill=(200, 220, 245))
        draw.rounded_rectangle([370, 570, 950, 620], radius=10, fill=(0, 102, 204, 80))
        draw.text((390, 582), "+ Incluye Central VETTI + Sensor Movimiento + Control 4B", font=f_small_bold, fill=(255, 255, 255))

    elif focus == "central":
        # Featured Central
        res_cnt = crop_central.resize((240, 270), Image.Resampling.LANCZOS)
        bg_cnt = Image.new("RGBA", (260, 290), (255, 255, 255, 250))
        bg_cnt.paste(res_cnt, (10, 10), res_cnt if res_cnt.mode == 'RGBA' else None)
        im.paste(bg_cnt, (90, 310))

        draw.text((390, 315), "CENTRAL SMART ALARM MONITORADA VETTI", font=f_badge, fill=(41, 151, 255))
        draw.text((390, 370), "• 5 Vias de comunicacion (Ethernet, Wi-Fi, 4G, DTMF)", font=f_subtitle, fill=(255, 255, 255))
        draw.text((390, 420), "• Bateria interna de respaldo (sigue activa sin luz)", font=f_subtitle, fill=(52, 211, 153))
        draw.text((390, 470), "• 6 particiones independientes y 254 sectores", font=f_subtitle, fill=(255, 255, 255))
        draw.text((390, 520), "• Protocolo Contact ID conectado a Central 24/7 GAMA", font=f_subtitle, fill=(200, 220, 245))
        draw.rounded_rectangle([390, 570, 950, 620], radius=10, fill=(0, 102, 204, 80))
        draw.text((410, 582), "+ Incluye 2 Sensores (Movimiento y Puerta) + Control 4B", font=f_small_bold, fill=(255, 255, 255))

    elif focus == "lineup":
        # Full lineup banner in middle
        res_line = crop_lineup.resize((920, 245), Image.Resampling.LANCZOS)
        bg_line = Image.new("RGBA", (940, 260), (255, 255, 255, 250))
        bg_line.paste(res_line, (10, 8), res_line if res_line.mode == 'RGBA' else None)
        im.paste(bg_line, (70, 310))

        draw.rounded_rectangle([70, 580, 1010, 630], radius=10, fill=(15, 34, 64), outline=(41, 151, 255), width=1)
        draw.text((100, 592), "LA SOLUCIÓN INALÁMBRICA MÁS COMPLETA CON TECNOLOGÍA BRASILERA VETTI", font=f_small_bold, fill=(255, 255, 255))

    # BOTTOM SECTION: PRICING BOX & CALL TO ACTION (y: 660 to 1040)
    # Left Price Card: EQUIPOS $180.000 + IVA
    draw.rounded_rectangle([50, 665, 520, 890], radius=18, fill=(15, 34, 64), outline=(41, 151, 255), width=2)
    draw.text((75, 685), "EQUIPO 100% TUYO (SIN ARRIENDO)", font=f_small_bold, fill=(41, 151, 255))
    draw.text((75, 720), "$180.000", font=f_price_big, fill=(255, 255, 255))
    draw.text((345, 740), "+ IVA", font=f_subtitle, fill=(160, 185, 215))
    draw.text((75, 790), "• Central Smart Vetti + 1 Control 4B", font=f_small, fill=(220, 235, 255))
    draw.text((75, 820), "• 1 Sensor Presencia + 1 Sensor Puerta", font=f_small, fill=(220, 235, 255))
    draw.text((75, 850), "✓ Propiedad definitiva garantizada", font=f_small_bold, fill=(52, 211, 153))

    # Right Price Card: MONITOREO 0,9 UF + IVA/MES
    draw.rounded_rectangle([550, 665, 1030, 890], radius=18, fill=(15, 34, 64), outline=(52, 211, 153), width=2)
    draw.text((575, 685), "PLANES DE MONITOREO 24/7", font=f_small_bold, fill=(52, 211, 153))
    draw.text((575, 720), "0,9 UF", font=f_price_big, fill=(255, 255, 255))
    draw.text((760, 740), "+ IVA / mes", font=f_subtitle, fill=(160, 185, 215))
    draw.text((575, 790), "• Verificación humana en < 2 minutos", font=f_small, fill=(220, 235, 255))
    draw.text((575, 820), "• Coordinación directa con Carabineros", font=f_small, fill=(220, 235, 255))
    draw.text((575, 850), "• Control total con App Móvil", font=f_small_bold, fill=(41, 151, 255))

    # Big CTA Button at the bottom
    draw.rounded_rectangle([50, 915, 1030, 1020], radius=24, fill=(0, 102, 204), outline=(41, 151, 255), width=2)
    cta_text = "SOLICITAR EVALUACIÓN TÉCNICA VÍA WHATSAPP 📲  +56 9 9101 6912"
    draw.text((95, 948), cta_text, font=f_subtitle, fill=(255, 255, 255))

    # Save to public and artifact directories
    filename = f"vetti_ad_{data['num']}.png"
    out_public = os.path.join(public_ads_dir, filename)
    out_art = os.path.join(artifact_dir, filename)
    im.save(out_public, "PNG")
    im.save(out_art, "PNG")
    print(f"Generated {filename}")

for ad in ADS_DATA:
    make_banner(ad)

print("All 10 Vetti banners generated successfully!")
