from PIL import Image, ImageDraw

def gerar_story_moldura(input_image_path, output_path):
    # 1. Configurações do Canvas (Padrão Story Instagram)
    CANVAS_WIDTH = 1080
    CANVAS_HEIGHT = 1920
    BACKGROUND_COLOR = (10, 73, 20) # O Verde da UK Imóveis (R, G, B)

    # 2. Criar o fundo sólido
    canvas = Image.new('RGB', (CANVAS_WIDTH, CANVAS_HEIGHT), color=BACKGROUND_COLOR)
    
    # 3. Abrir a imagem do imóvel
    img_imovel = Image.open(input_image_path).convert("RGBA")
    
    # 4. Redimensionar a imagem do imóvel para caber na largura (com margem)
    # Queremos que ela ocupe 90% da largura do story
    margem_percent = 0.9
    novo_width = int(CANVAS_WIDTH * margem_percent)
    
    # Calcular altura mantendo a proporção original
    largura_original, altura_original = img_imovel.size
    proporcao = altura_original / largura_original
    novo_height = int(novo_width * proporcao)
    
    img_imovel = img_imovel.resize((novo_width, novo_height), Image.Resampling.LANCZOS)
    
    # 5. Centralizar a imagem no Canvas
    x_offset = (CANVAS_WIDTH - novo_width) // 2
    y_offset = (CANVAS_HEIGHT - novo_height) // 2
    
    # Colar a imagem (usando a própria imagem como máscara para transparências se houver)
    canvas.paste(img_imovel, (x_offset, y_offset), img_imovel)
    
    # 6. Salvar o resultado final
    canvas.convert('RGB').save(output_path, "JPEG", quality=95)
    print(f"Story gerado com sucesso em: {output_path}")

# Exemplo de uso:
gerar_story_moldura("images/55.129.jpg", "images/tratadas/55.129.jpg")