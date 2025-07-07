import fitz
import os

# PDFファイルのパスを修正
pdf_path = os.path.join("sample", "JE80F121120754077_20231016_20240115160118.pdf")

try:
    doc = fitz.open(pdf_path)
    print(f"Successfully opened {pdf_path}")
    for i, page in enumerate(doc):
        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: (b[1], b[0]))  # y-coordinate, then x-coordinate
        for b in blocks:
            # テキストブロックの座標とテキストを整形して出力
            bbox = [round(coord, 2) for coord in b[:4]]
            text = b[4].replace("\n", " ").strip()
            if text:
                print(f"Page {i+1} | BBOX: {bbox} | Text: {text}")
except Exception as e:
    print(f"Error processing {pdf_path}: {e}")
