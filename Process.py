
import pandas as pd
import tabula


def extract_workday_from_salary_pdf(path):
    dfs = tabula.read_pdf(
        path, lattice=True, pages='all', multiple_tables=True, pandas_options={"header": None})

    df = dfs[0]

    # "日付" が含まれる行を探す
    start_row = -1
    for i in range(len(df)):
        # "日付" という文字列がセルのどこかに含まれているかチェック
        if isinstance(df.iloc[i, 0], str) and "日付" in df.iloc[i, 0]:
            start_row = i + 1
            break

    if start_row == -1:
        return []

    df = df.iloc[start_row:]
    
    workdays = []
    for i in range(len(df)):
        # 日付列と場所列が空でないことを確認
        if pd.notna(df.iloc[i, 0]) and pd.notna(df.iloc[i, 5]):
            # 抽出するのは日付と場所
            workdays.append([df.iloc[i, 0], df.iloc[i, 5]])
            
    return workdays


if __name__ == '__main__':
    workdays = extract_workday_from_salary_pdf(
        "C:/Users/segawa/koutuhi/resource/給与明細書_20240119141639.pdf")
    print(workdays)
