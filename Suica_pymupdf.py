import pymupdf


def extract_suica_text_pymupdf(path):
    """
    SuicaのPDFからテキストを抽出し、ページごとに標準出力に表示する（PyMuPDF版）。
    """
    # ドキュメントを開く
    doc = pymupdf.open(path)
    try:
        # 各ページごとにテキストを取得して出力
        for page_num, page in enumerate(doc, start=1):
            text = page.get_text().encode("utf8").decode("utf8")
            print(f"---- Page {page_num} ----")
            print(text)
    finally:
        doc.close()


if __name__ == '__main__':
    # サンプルPDFパスを指定
    sample_path = "sample/JE80F121120754077_20231016_20240115160118.pdf"
    extract_suica_text_pymupdf(sample_path)
