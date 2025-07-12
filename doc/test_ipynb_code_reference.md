# pdfminerバージョン

以下は試しに作ったときのコード。参考に残しておく。

## 1番目のコードセル
```python
import pandas as pd
import tabula
import re
from pdfminer.high_level import extract_text

def get_salary_data(path):
    df3 = get_cleaned_salary_dataframe(extract_workday_data_from_salary_pdf(path))
    # 欠損値行までのデータを取り出す
    i = find_last_row(df3)
    return df3.iloc[:i,:7] # 7列目までのデータを取り出す

# 最初の完全な欠損値行を見つける
def find_last_row(df):
    for i in range(len(df)):
        if df.iloc[i].isna().all():
            return i

# 給与明細書から勤務日数と給与部分を取り出す
def extract_workday_data_from_salary_pdf(path):
    dfs = get_dataframe_from_salary_pdf(path)
    #display(dfs[0])
    # 1ページ目は"日付"の文字列以降のデータを取り出す
    n = find_workday_data_start_row(dfs[0])
    firstpage = dfs[0].iloc[n:, :7]
    # 1ページ目と、あれば2ページ目のデータを結合する
    secondpage = dfs[1].iloc[:, :7] if 1 < len(dfs)  else pd.DataFrame() 
    return pd.concat([firstpage, secondpage], ignore_index=True)

# 給与明細書からデータフレームを取得する        
def get_dataframe_from_salary_pdf(path):
    return tabula.read_pdf(
        path, lattice=True, pages='all', multiple_tables=True, pandas_options={"header": None})
    

# "日付"の文字列以降のデータを取り出す
def find_workday_data_start_row(df):
    for i in range(len(df)):
        if df.iloc[i, 0] == "日付":
            return i+1


# 以降は数字データのみを取り出すクリーニング関数
# 得意先と勤務地の文字列が長くなると、セルが右側の列に重なり、データがうまく取り出せない。
# データが混ざるように取り出される。
# なので正規表現で形だけ見て、数字データのみ取り出しているが、
# 勤務地のデータの方に数字があると、正しいデータにはならない。
def get_cleaned_salary_dataframe(df):
    df2 = extract_decimal_values_from_columns(df, [4,5])
    return extract_currency_values_from_columns(df2, [6])

def extract_currency_value(s):
    # セル内を数字とカンマのみにする
    cleaned_string = re.sub(r"[^\d\,]", "", s)
    match = re.search(r'\d{2}\,\d{3}', cleaned_string)
    return match.group() if match else pd.NA

def extract_currency_values_from_columns(df, columns):
    for col in columns:
        df[col] = df[col].apply(lambda x: extract_currency_value(str(x)))
    return df

def extract_decimal_values(s):
    # セル内を数字と小数点のみにする
    cleaned_string = re.sub(r"[^\d\.]", "", s)
    match = re.search(r'\d{1}\.\d{2}', cleaned_string)
    return match.group() if match else pd.NA

def extract_decimal_values_from_columns(df, columns):
    for col in columns:
        df[col] = df[col].apply(lambda x: extract_decimal_values(str(x)))
    return df

path = "sample/給与明細書_20240119141639.pdf"
df = get_salary_data(path)
#display(df)

# pdfが何年のデータかを取得する
def get_year(path):
    match = re.search(r'\d{4}年\d{1,2}月度', extract_text(path))
    year = int(match.group()[:4])
    print(year)
    return year

# 年のデータを追加する
df["年"] = get_year(path)
display(df)
```

## 2番目のコードセル
```python
import pandas as pd
import tabula
import re
from pdfminer.high_level import extract_text
from datetime import datetime

path = "sample/JE80F121120754077_20231016_20240115160118.pdf"

def extract_suica_history(path):
    dfs = tabula.read_pdf(path, lattice=False,pages="all")
    return pd.concat(dfs, ignore_index=True)

def convert_dataframe(df):
    df["入金・利用額"] = df["入金・利用額"].str.replace(",", "").fillna(0).astype(int)
    df['月'] = df['月'].astype(int)
    df['日'] = df['日'].astype(int)
    #display(df)

# pdfが何年のデータかを取得する
def extract_date_from_pdf(path):
    dates = re.search(r'\d{4}/\d{1,2}/\d{1,2}', extract_text(path))
    return datetime.strptime(dates.group(), '%Y/%m/%d')

    # 年データを補う
def add_year(df, date_obj):
    row_year = date_obj.year
    df["年"] = row_year
    # pdfの月より最終行の月が大きい場合、去年のデータとして扱う。
    # そうじゃない場合、破綻する。
    if date_obj.month < df["月"].iloc[-1]:
        row_year = row_year - 1

    # データを逆順に行を見て、前の行より月が大きく(1→12)なったら、年を1つ減らす
    for index in range(len(df) - 1, -1, -1):
        # 前の行より月が大きく(1→12)なったら、年を1つ減らす
        back_month = df.at[index + 1, "月"] if index + 1 < len(df) else 12
        if back_month < df.at[index, "月"]:
            row_year = row_year - 1
        df.at[index, "年"] = row_year

df = extract_suica_history(path)
convert_dataframe(df)
add_year(df, extract_date_from_pdf(path))
display(df)
```
