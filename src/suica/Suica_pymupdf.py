import fitz  # PyMuPDF
import pandas as pd
import os
import re
from .date_extractor import extract_history_date_pymupdf


def parse_suica_history_text(lines):
    """
    再構築されたテキスト行のリストを、複数の正規表現を使って解析し、DataFrameに変換する。
    """
    pattern_transport = re.compile(
        r"^(\d{1,2})\s+(\d{1,2})\s+"
        r"(\S+)\s+"
        r"(.+?)\s+"
        r"(\S+)\s+"
        r"(.+?)\s+"
        r"(\\[\d,]+)\s+"
        r"([+-][\d,]+)"
    )

    pattern_other = re.compile(
        r"^(\d{1,2})\s+(\d{1,2})\s+"
        r"(\S+)\s+"
        r"(\\[\d,]+)\s*"
        r"([+-][\d,]+)?"
    )

    data = []
    for line in lines:
        line = line.encode('utf-8').decode('utf-8-sig')

        match = pattern_transport.match(line)
        if match:
            groups = [g.strip() if g else '' for g in match.groups()]
            data.append(groups)
            continue

        match = pattern_other.match(line)
        if match:
            groups = [g.strip() if g else '' for g in match.groups()]
            row = [groups[0], groups[1], groups[2],
                   '', '', '', groups[3], groups[4]]
            data.append(row)

    if not data:
        return pd.DataFrame()

    columns = ['月', '日', '種別1', '利用駅1', '種別2', '利用駅2', '残額', '支払額']
    df = pd.DataFrame(data, columns=columns)

    df['支払額'] = df['支払額'].replace('', '0').str.replace(',', '').astype(int)
    df['残額'] = df['残額'].str.replace(
        '\\', '', regex=False).str.replace(',', '').astype(int)
    df['月'] = df['月'].str.zfill(2)
    df['日'] = df['日'].str.zfill(2)
    df['日付'] = df['月'] + '/' + df['日']

    df = df[['日付', '種別1', '利用駅1', '種別2', '利用駅2', '支払額', '残額']]

    return df


def extract_suica_history_pymupdf(pdf_path):
    """
    PyMuPDFを使い、単語の座標情報を基にSuicaの利用履歴テーブルを再構築し、DataFrameに変換する。
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error: ファイルを開けませんでした: {e}")
        return pd.DataFrame()

    all_lines = []
    table_rect = fitz.Rect(150, 90, 540, 680)

    for page in doc:
        words = page.get_text("words", clip=table_rect)
        if not words:
            continue

        lines = {}
        tolerance = 2
        for w in words:
            y1 = round(w[3])
            found_line = False
            for ly in lines.keys():
                if abs(y1 - ly) <= tolerance:
                    lines[ly].append(w)
                    found_line = True
                    break
            if not found_line:
                lines[y1] = [w]

        sorted_line_keys = sorted(lines.keys())
        for key in sorted_line_keys:
            lines[key].sort(key=lambda w: w[0])
            line_text = " ".join(w[4] for w in lines[key])
            if "pw" in line_text or "c" in line_text:
                continue
            all_lines.append(line_text)

    df = parse_suica_history_text(all_lines)
    return df


def add_year_to_dates(df, report_date):
    """
    DataFrame の '日付' 列に年情報を付加します。
    report_date: 'YYYY/MM/DD' 形式の文字列
    """
    # report_date の年と月を取得
    rep_year, rep_mon, _ = map(int, report_date.split('/'))
    df2 = df.copy().reset_index(drop=True)
    # 年度を判定するための変数初期化
    # 最初の行月が report_month より大きければ前年から開始
    first_month = int(df2.loc[0, '日付'].split('/')[0])
    current_year = rep_year - 1 if first_month > rep_mon else rep_year
    prev_mon = first_month
    years = []
    # 各行を順に処理し、月が前行より小さくなったら翌年に切り替え
    for date_str in df2['日付']:
        mon = int(date_str.split('/')[0])
        if mon < prev_mon:
            current_year += 1
        years.append(current_year)
        prev_mon = mon
    # 年情報を付与して整形
    df2['日付'] = [f"{y}/{d}" for y, d in zip(years, df2['日付'])]
    return df2


# --- Extraction Result ---
#         日付 種別1  利用駅1 種別2   利用駅2  支払額   残額
# 2023/10/16   繰                     0 2494
# 2023/10/18   入   竹ノ塚   出   東武押上 -261 2233
# 2023/10/18   入  東武押上   出    竹ノ塚 -261 1972
# 2023/10/24   入   竹ノ塚   出   地　入谷 -356 1616
# 2023/10/24   入     地  入谷  出 竹ノ塚 -356 1260
# 2023/10/25   入   竹ノ塚   出   地　入谷 -356  904
if __name__ == '__main__':
    sample_pdf_path = os.path.join(
        "sample", "JE80F121120754077_20231016_20240115160118.pdf")
    output_csv_path = "suica_history.csv"

    if not os.path.exists(sample_pdf_path):
        print(f"Error: サンプルファイルが見つかりません: {sample_pdf_path}")
    else:
        # 履歴出力日を抽出
        report_date = extract_history_date_pymupdf(sample_pdf_path)
        print(f"\n履歴出力日: {report_date}")
        # 履歴データを抽出
        extracted_data = extract_suica_history_pymupdf(sample_pdf_path)
        if not extracted_data.empty:
            # 結果をprintで表示
            # print("\n--- Extraction Result ---")
            # print(extracted_data.to_string(index=False))
            # 年情報を追加して表示
            dated_df = add_year_to_dates(extracted_data, report_date)
            print("\n--- Extraction with Year ---")
            print(dated_df.to_string(index=False))
        else:
            print("\nExtraction did not return any data or failed to parse.")
