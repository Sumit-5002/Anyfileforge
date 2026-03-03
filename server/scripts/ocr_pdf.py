#!/usr/bin/env python3
import argparse
import io
import json
import shutil
import subprocess
import sys


def run_ocrmypdf(input_pdf, output_pdf, output_text, language):
    ocrmypdf_bin = shutil.which("ocrmypdf")
    if not ocrmypdf_bin:
        raise RuntimeError("ocrmypdf is not installed")

    cmd = [
        ocrmypdf_bin,
        "--force-ocr",
        "--skip-text",
        "--optimize",
        "0",
        "--output-type",
        "pdf",
        "--language",
        language,
        "--sidecar",
        output_text,
        input_pdf,
        output_pdf,
    ]
    subprocess.run(cmd, check=True, capture_output=True, text=True)
    return "ocrmypdf"


def run_pymupdf_tesseract(input_pdf, output_pdf, output_text, language):
    try:
        import fitz  # PyMuPDF
        from PIL import Image
        import pytesseract
        from pytesseract import Output
    except Exception as exc:
        raise RuntimeError(
            "Fallback OCR requires PyMuPDF, Pillow and pytesseract"
        ) from exc

    src = fitz.open(input_pdf)
    dst = fitz.open()
    sidecar_lines = []

    for page_index in range(len(src)):
        page = src[page_index]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        png_bytes = pix.tobytes("png")
        image = Image.open(io.BytesIO(png_bytes))

        ocr_data = pytesseract.image_to_data(
            image,
            lang=language,
            output_type=Output.DICT,
        )

        out_page = dst.new_page(width=page.rect.width, height=page.rect.height)
        out_page.insert_image(page.rect, stream=png_bytes)

        sx = page.rect.width / max(1, image.width)
        sy = page.rect.height / max(1, image.height)

        line_tokens = []
        count = len(ocr_data.get("text", []))
        for i in range(count):
            token = (ocr_data["text"][i] or "").strip()
            if not token:
                continue

            conf_raw = str(ocr_data["conf"][i]).strip()
            try:
                conf_value = float(conf_raw)
            except Exception:
                conf_value = -1
            if conf_value < 0:
                continue

            left = float(ocr_data["left"][i]) * sx
            top = float(ocr_data["top"][i]) * sy
            height = float(ocr_data["height"][i]) * sy
            font_size = max(7, min(42, height * 0.9))

            # render_mode=3 inserts invisible text layer that remains searchable
            out_page.insert_text(
                (left, top + height),
                token,
                fontsize=font_size,
                render_mode=3,
            )
            line_tokens.append(token)

        sidecar_lines.append(" ".join(line_tokens))

    dst.save(output_pdf, deflate=True)
    with open(output_text, "w", encoding="utf-8") as handle:
        handle.write("\n\n".join(sidecar_lines))

    src.close()
    dst.close()
    return "pymupdf+pytesseract"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, dest="input_pdf")
    parser.add_argument("--output-pdf", required=True, dest="output_pdf")
    parser.add_argument("--output-text", required=True, dest="output_text")
    parser.add_argument("--language", default="eng")
    args = parser.parse_args()

    try:
        try:
            engine = run_ocrmypdf(args.input_pdf, args.output_pdf, args.output_text, args.language)
        except Exception:
            engine = run_pymupdf_tesseract(args.input_pdf, args.output_pdf, args.output_text, args.language)

        print(json.dumps({"ok": True, "engine": engine}))
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

