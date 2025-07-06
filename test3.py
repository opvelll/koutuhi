import pdfplumber

pdf_path = 'C:/Users/segawa/koutuhi/sample/給与明細書_20240119141639.pdf'

# PDFファイルを読み込む
with pdfplumber.open(pdf_path) as pdf:

    # 表を抽出する
    tables = pdf.pages[0].find_tables()
    print(tables[0].extract())
