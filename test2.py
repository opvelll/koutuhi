import re
import pymupdf

Kpath = "C:/Users/segawa/koutuhi/sample/給与明細書_20240119141639.pdf"
# ドキュメントを開いて全ページのテキストを抽出
doc = pymupdf.open(Kpath)
texts = [page.get_text() for page in doc]
content = "\n".join(texts)


# a/b 形式の日付から行データを作成
# テキストを行ごとに分割
lines = content.splitlines()
rows = []
current_date = ''
for line in lines:
    # 行全体が日付形式の場合に更新、それ以外は空白に
    m = re.fullmatch(r"(\d{1,2}/\d{1,2})", line.strip())
    if m:
        current_date = m.group(1)
        rows.append([current_date])
    else:
        rows.append([''])
# 結果を表示（先頭20行）
for i, r in enumerate(rows[:20], start=1):
    print(f"Row {i}: {r}")
