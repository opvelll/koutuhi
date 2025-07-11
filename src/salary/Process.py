
import pandas as pd
import tabula
import re

def extract_workday_from_salary_pdf(path):
    # PDFからDataFrameを取得
    dfs = tabula.read_pdf(
        path, lattice=True, pages='all', multiple_tables=True, pandas_options={"header": None})

    df = dfs[0]

    # "日付" が含まれる行を探す
    start_row = -1
    for i in range(len(df)):
        if isinstance(df.iloc[i, 0], str) and "日付" in df.iloc[i, 0]:
            start_row = i + 1
            break

    if start_row == -1:
        return []

    df = df.iloc[start_row:]

    workdays = []
    for i in range(len(df)):
        # 日付列が空でないことを確認
        if pd.notna(df.iloc[i, 0]):
            # 行全体を文字列として結合
            row_text = ''.join(str(x) for x in df.iloc[i].tolist())

            # 日付、場所、金額を正規表現で抽出
            date_match = re.search(r'(\d{1,2}/\d{1,2})', str(df.iloc[i, 0]))
            place_match = re.search(r'([一-龠]+.+)', str(df.iloc[i, 3]))
            amount_match = re.search(r'([,\d]+)', str(df.iloc[i, 6]))

            date = date_match.group(1) if date_match else ''
            place = place_match.group(1) if place_match else ''
            amount = amount_match.group(1) if amount_match else ''

            if date and place and amount:
                workdays.append([date, amount, place])

    return workdays

if __name__ == '__main__':
    workdays = extract_workday_from_salary_pdf(
        "sample/給与明細書_20240119141639.pdf")
    print(workdays)
