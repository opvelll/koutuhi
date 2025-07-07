import re
import pymupdf


def extract_workday_from_salary_pdf_pymupdf_simple(path):
    """給与明細PDFから勤務日、金額、場所の履歴を抽出する（簡易版）"""
    # ドキュメントを開いて全ページのテキストを抽出
    doc = pymupdf.open(path)
    texts = [page.get_text() for page in doc]
    content = "\n".join(texts)

    # 日付を起点に仕事履歴を抽出し、二次元リストにする
    lines = content.splitlines()
    history = []
    for i, line in enumerate(lines):
        m = re.fullmatch(r"(\d{1,2}/\d{1,2})", line.strip())
        if m:
            entry = [line.strip()]
            # 日付の次の6行を取得（7フィールド）
            for j in range(1, 7):
                if i + j < len(lines):
                    raw = lines[i + j]
                    nxt = ' '.join(raw.split())
                    # 次行が日付形式なら空文字を入れる
                    if re.fullmatch(r"\d{1,2}/\d{1,2}", nxt):
                        entry.append("")
                    else:
                        entry.append(nxt)
                else:
                    entry.append("")
            history.append(entry)
    doc.close()
    return history


# テスト用実行
if __name__ == '__main__':
    sample_path = "C:/Users/segawa/koutuhi/sample/給与明細書_20240119141639.pdf"
    for rec in extract_workday_from_salary_pdf_pymupdf_simple(sample_path):
        print(rec)
