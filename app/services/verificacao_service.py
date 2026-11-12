from io import BytesIO

from PIL import Image, UnidentifiedImageError


class VerificacaoService:
    MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
    MAX_IMAGE_PIXELS = 25_000_000

    @classmethod
    def validar_imagem(cls, conteudo: bytes) -> None:
        if not conteudo or len(conteudo) > cls.MAX_IMAGE_SIZE_BYTES:
            raise ValueError("Cada imagem deve ter conteúdo e no máximo 5 MB")

        try:
            with Image.open(BytesIO(conteudo)) as imagem:
                if imagem.format != "JPEG":
                    raise ValueError("Formato inválido. Envie as imagens em JPEG")
                if imagem.width * imagem.height > cls.MAX_IMAGE_PIXELS:
                    raise ValueError("A resolução máxima permitida é 25 megapixels")
                imagem.verify()
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
            raise ValueError("Não foi possível ler uma das imagens enviadas") from error
