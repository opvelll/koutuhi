
import fitz  # PyMuPDF
import re

def extract_workday_from_salary_pdf_pymupdf(path):
    doc = fitz.open(path)
    workdays = []

    for page in doc:
        words = page.get_text("words")
        if not words:
            continue

        # y座標で単語をグループ化して行を作成
        lines = {}
        for w in words:
            # y座標を整数に丸めて、多少のズレを許容する
            y0 = round(w[1] / 10) * 10
            if y0 not in lines:
                lines[y0] = []
            lines[y0].append(w)

        # ヘッダー行のy座標を特定 (y=389の行)
        # デバッグ出力からヘッダー行のy座標が約389であることが分かっている
        header_y = -1
        for y in lines.keys():
            if 380 < y < 400:
                header_y = y
                break
        
        if header_y == -1:
            continue

        # ヘッダー行より下のデータ行を処理
        for y, line_words in sorted(lines.items()):
            if y <= header_y:
                continue

            line_words.sort(key=lambda w: w[0])

            # 座標に基づいて各列の単語を抽出
            date_words = [w[4] for w in line_words if 25 < w[0] < 65]
            company_words = [w[4] for w in line_words if 65 < w[0] < 200]
            # 勤務名は複数の単語に分かれている可能性があるので結合する
            work_name_words = [w[4] for w in line_words if 240 < w[0] < 440]
            amount_words = [w[4] for w in line_words if 520 < w[0] < 560]

            date = "".join(date_words)
            # 得意先名と勤務名を結合して場所とする
            place = " ".join(company_words + work_name_words)
            amount = "".join(amount_words)

            # 日付形式（MM/DD）の行のみを抽出し、不要な文字を取り除く
            date_match = re.search(r'(\d{1,2}/\d{1,2})', date)
            if date_match:
                # 金額も念のためクリーニング
                amount_cleaned = re.sub(r'[^\d,]', '', amount)
                if amount_cleaned:
                    workdays.append([date_match.group(1), amount_cleaned, place.strip()])

    doc.close()
    return workdays

if __name__ == '__main__':
    workdays = extract_workday_from_salary_pdf_pymupdf(
        "C:/Users/segawa/koutuhi/sample/給与明細書_20240119141639.pdf")
    # 結果を見やすく表示
    for day in workdays:
        print(day)
