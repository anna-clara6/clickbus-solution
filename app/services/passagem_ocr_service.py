from io import BytesIO
import re

from PIL import Image, UnidentifiedImageError
import pytesseract


class PassagemOcrService:
    MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
    MAX_IMAGE_PIXELS = 25_000_000
    ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
    CANDIDATE_PATTERN = re.compile(r"(?<![0-9])[0-9]{5}(?![0-9])")

    @classmethod
    def identificar(cls, conteudo: bytes) -> int | None:
        if not conteudo or len(conteudo) > cls.MAX_IMAGE_SIZE_BYTES:
            raise ValueError("A imagem deve ter conteúdo e no máximo 5 MB")

        try:
            imagem = Image.open(BytesIO(conteudo))
            if imagem.format not in cls.ALLOWED_FORMATS:
                raise ValueError("Formato inválido. Use uma imagem JPEG, PNG ou WebP")
            if imagem.width * imagem.height > cls.MAX_IMAGE_PIXELS:
                raise ValueError("A resolução máxima permitida é 25 megapixels")
            imagem.verify()
            imagem = Image.open(BytesIO(conteudo)).convert("L")
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
            raise ValueError("Não foi possível ler a imagem enviada") from error

        texto = pytesseract.image_to_string(imagem, lang="por+eng", config="--psm 6", timeout=10)
        candidatos = {int(match.group()) for match in cls.CANDIDATE_PATTERN.finditer(texto)}
        if len(candidatos) != 1:
            return None
        return candidatos.pop()
