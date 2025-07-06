
import pymupdf
import re

def extract_workday_from_salary_pdf_pymupdf(path):
    doc = pymupdf.open(path)
    workdays = []

    # 全ページから単語を収集し、y座標でグループ化
    all_lines = {}
    for page_num, page in enumerate(doc):
        words = page.get_text("words")
        if not words:
            continue

        for w in words:
            # y座標を整数に丸めて、多少のズレを許容する
            y0 = round(w[1] / 10) * 10
            if y0 not in all_lines:
                all_lines[y0] = []
            all_lines[y0].append(w)

    # ヘッダー行のy座標を特定
    header_y = -1
    # ヘッダー行のy座標は390付近と仮定
    for y in sorted(all_lines.keys()):
        if 380 < y < 400:  # y座標の範囲を絞る
            line_words = all_lines[y]
            line_words.sort(key=lambda w: w[0])
            
            # ヘッダー行に特徴的な単語が特定のx座標範囲に存在するかを確認
            # 例: 日付 (x: 25-65), 得意先名 (x: 65-200), 合計 (x: 520-560)
            has_date_col = any(25 < w[0] < 65 for w in line_words)
            has_company_col = any(65 < w[0] < 200 for w in line_words)
            has_amount_col = any(520 < w[0] < 560 for w in line_words)

            if has_date_col and has_company_col and has_amount_col:
                header_y = y
                break
    
    if header_y == -1:
        doc.close()
        return []

    # ヘッダー行より下のデータ行を処理
    for y, line_words in sorted(all_lines.items()):
        if y <= header_y:
            continue

        line_words.sort(key=lambda w: w[0])

        # 座標に基づいて各列の単語を抽出
        date_words = [w[4] for w in line_words if 25 < w[0] < 65]
        company_words = [w[4] for w in line_words if 65 < w[0] < 200]
        work_name_words = [w[4] for w in line_words if 240 < w[0] < 440]
        amount_words = [w[4] for w in line_words if 520 < w[0] < 560]

        date = "".join(date_words)
        place = " ".join(company_words + work_name_words)
        amount = "".join(amount_words)

        # 日付形式（MM/DD）の行のみを対象とし、日付形式でなくなったら終了
        date_match = re.search(r'(\d{1,2}/\d{1,2})', date)
        if not date_match:
            break # 日付形式でなくなったらループを終了

        amount_cleaned = re.sub(r'[^\d,]', '', amount)
        if amount_cleaned:
            workdays.append([date_match.group(1), amount_cleaned, place.strip()])

    doc.close()
    return workdays

if __name__ == '__main__':
    workdays = extract_workday_from_salary_pdf_pymupdf(
        "C:/Users/segawa/koutuhi/sample/給与明細書_20240119141639.pdf")
    for day in workdays:
        print(day)
