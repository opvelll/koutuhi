import fitz  # PyMuPDF
import re


def extract_history_date_pymupdf(pdf_path):
    """
    PDF全体のテキストから履歴出力日付を抽出して返します。
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return ''
    full_text = ''
    for page in doc:
        full_text += page.get_text()
    # YYYY/MM/DD形式を検索
    match = re.search(r'(\d{4}/\d{1,2}/\d{1,2})', full_text)
    if match:
        return match.group(1)
    # 日本語表記 YYYY年MM月DD日形式を検索
    match = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日', full_text)
    if match:
        y, m, d = match.groups()
        return f"{y}/{int(m):02d}/{int(d):02d}"
    return ''
