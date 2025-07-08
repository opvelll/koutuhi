import fitz  # PyMuPDF
import pandas as pd
import os
import re


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


def extract_history_date_pymupdf(pdf_path):
    """
    PDF全体のテキストから履歴出力日付を抽出して返します。"""
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return ''
    full_text = ''
    for page in doc:
        full_text += page.get_text()
    # YYYY/MM/DD形式を検索
    match = re.search(r'(\d{4}/\d{1,2}/\d{1,2})', full_text)
    if match:
        return match.group(1)
    # 日本語表記 YYYY年MM月DD日形式を検索
    match = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日', full_text)
    if match:
        y, m, d = match.groups()
        return f"{y}/{int(m):02d}/{int(d):02d}"
    return ''


def transform_suica_history(df):
    """
    Suica履歴DataFrameを日付ごとの経路と支払額テーブルに変換します。
    """
    if df.empty:
        return pd.DataFrame(columns=['日付', '経路', '支払額'])
    df2 = df.copy()
    # 経路文字列を生成

    def make_route(row):
        if row['利用駅2']:
            return f"{row['種別1']}:{row['利用駅1']} -> {row['種別2']}:{row['利用駅2']}"
        else:
            return f"{row['種別1']}:{row['利用駅1']}"
    df2['経路'] = df2.apply(make_route, axis=1)
    result = df2[['日付', '経路', '支払額']]
    return result


if __name__ == '__main__':
    sample_pdf_path = os.path.join(
        "sample", "JE80F121120754077_20231016_20240115160118.pdf")
    output_csv_path = "suica_history.csv"

    if not os.path.exists(sample_pdf_path):
        print(f"Error: サンプルファイルが見つかりません: {sample_pdf_path}")
    else:
        extracted_data = extract_suica_history_pymupdf(sample_pdf_path)
        if not extracted_data.empty:
            try:
                # UTF-8-SIGでCSVに保存し、Excelでの文字化けを防ぐ
                extracted_data.to_csv(
                    output_csv_path, index=False, encoding='utf-8-sig')
                print(f"\n--- Extraction Successful ---")
                print(f"Data has been saved to {output_csv_path}")
            except Exception as e:
                print(f"\nError saving to CSV: {e}")
        else:
            print("\nExtraction did not return any data or failed to parse.")
