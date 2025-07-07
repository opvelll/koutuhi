import pdfplumber


def extract_suica_text_pdfplumber(path):
    """
    SuicaのPDFからテーブル情報を抽出し、標準出力に表示する（pdfplumber版）。
    """
    # PDFファイルを開く
    with pdfplumber.open(path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=0):
            print(f"---- Page {page_num} ----")
            # テーブルを検出
            tables = page.find_tables()
            if not tables:
                print("テーブルが見つかりませんでした。")
                continue
            # 最初のテーブルを抽出
            data = tables[0].extract()
            # 抽出結果を行単位で表示
            for row in data:
                print(row)


if __name__ == '__main__':
    # サンプルPDFパスを指定
    sample_path = "sample/JE80F121120754077_20231016_20240115160118.pdf"
    extract_suica_text_pdfplumber(sample_path)
