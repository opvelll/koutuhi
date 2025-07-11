import pdfplumber
import re

def extract_workday_from_salary_pdf_pdfplumber(path):
    workdays = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            # テーブル領域を座標で指定 (x0, y0, x1, y1)
            # サンプルPDFの仕事の履歴の表の座標を仮定
            # 実際のPDFに合わせて調整が必要
            bbox = (20, 380, 580, 560) # x0, y0, x1, y1
            
            # 指定した領域からテーブルを抽出
            table_settings = {
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
                "snap_tolerance": 5,
                "join_tolerance": 5,
            }
            table = page.crop(bbox).extract_table(table_settings)

            if table:
                # ヘッダー行をスキップするためのフラグ
                header_skipped = False
                for row_data in table:
                    # ヘッダー行をスキップ
                    if not header_skipped:
                        # ヘッダー行の特定ロジック（例: 日付という文字列が含まれるか）
                        if any("日付" in str(cell) for cell in row_data):
                            header_skipped = True
                            continue
                        else:
                            # ヘッダー行が見つからない場合は、最初の行をヘッダーとみなしてスキップ
                            header_skipped = True
                            continue

                    # 行が空でないことを確認
                    if not row_data or not any(cell for cell in row_data if cell is not None):
                        continue

                    # 日付、場所、金額を抽出
                    # サンプルPDFの構造に合わせて列のインデックスを調整
                    # row_data[0]が日付、row_data[3]が得意先名、row_data[6]が金額と仮定
                    date_str = row_data[0] if len(row_data) > 0 and row_data[0] else ""
                    place_str = row_data[3] if len(row_data) > 3 and row_data[3] else ""
                    amount_str = row_data[6] if len(row_data) > 6 and row_data[6] else ""

                    # 日付形式（MM/DD）の行のみを対象とし、日付形式でなくなったら終了
                    date_match = re.search(r'(\d{1,2}/\d{1,2})', date_str)
                    if not date_match:
                        break # 日付形式でなくなったらループを終了

                    amount_cleaned = re.sub(r'[^\d,]', '', amount_str)
                    if amount_cleaned:
                        workdays.append([date_match.group(1), amount_cleaned, place_str.strip()])

    return workdays

if __name__ == '__main__':
    workdays = extract_workday_from_salary_pdf_pdfplumber(
        "sample/給与明細書_20240119141639.pdf")
    for day in workdays:
        print(day)