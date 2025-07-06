
import pandas as pd
import tabula
import re
from pdfminer.high_level import extract_text
from datetime import datetime

def extract_suica_history(path):
    dfs = tabula.read_pdf(path, lattice=False,pages="all")
    return pd.concat(dfs, ignore_index=True)

def convert_dataframe(df):
    df["入金・利用額"] = df["入金・利用額"].str.replace(",", "").fillna(0).astype(int)
    df['月'] = df['月'].astype(int)
    df['日'] = df['日'].astype(int)

def extract_date_from_pdf(path):
    dates = re.search(r'\d{4}/\d{1,2}/\d{1,2}', extract_text(path))
    return datetime.strptime(dates.group(), '%Y/%m/%d')

def add_year(df, date_obj):
    row_year = date_obj.year
    df["年"] = row_year
    if date_obj.month < df["月"].iloc[-1]:
        row_year = row_year - 1

    for index in range(len(df) - 1, -1, -1):
        back_month = df.at[index + 1, "月"] if index + 1 < len(df) else 12
        if back_month < df.at[index, "月"]:
            row_year = row_year - 1
        df.at[index, "年"] = row_year
