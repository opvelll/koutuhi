import os
from pathlib import Path
from datetime import datetime, timedelta
import pandas as pd
import openpyxl

# PDF抽出～変形関数のインポート
from src.suica.Suica_pymupdf import extract_suica_history_pymupdf, add_year_to_dates
from src.suica.suica_transform import transform_commute
from src.suica.date_extractor import extract_history_date_pymupdf

# テンプレート・出力設定
TEMPLATE_PATH = Path('sample/d54ff476ff529c75ab262cbbed599019.xlsx')
OUTPUT_DIR = Path('output')
# 対象Suica PDF
PDF_PATH = Path('sample/JE80F121120754077_20231016_20240115160118.pdf')


def make_timesheets(pdf_path: Path, template_path: Path, output_dir: Path):
    """
    Suica PDF から通勤情報を抽出し、Excelテンプレートに反映、月ごとに出力する。
    """
    # 出力ディレクトリ作成
    output_dir.mkdir(exist_ok=True)

    # Suica履歴抽出
    report_date = extract_history_date_pymupdf(pdf_path)
    df_raw = extract_suica_history_pymupdf(pdf_path)
    df_with_year = add_year_to_dates(df_raw, report_date)
    df = transform_commute(df_with_year)
    # '日付'をdatetime型に変換
    df['日付'] = pd.to_datetime(df['日付'])

    # 年月でグループ化
    df['year'] = df['日付'].dt.year
    df['month'] = df['日付'].dt.month

    for (year, month), group in df.groupby(['year', 'month']):
        # 日付(date)->通勤経路および往復金額の辞書
        route_map = {d.date(): r for d, r in zip(group['日付'], group['通勤経路'])}
        fare_map = {d.date(): v for d, v in zip(group['日付'], group['往復金額'])}

        # テンプレート読み込み
        wb = openpyxl.load_workbook(template_path)
        ws = wb['勤務表']
        # 年/月/1 形式の文字列を設定
        target = ws['D3']
        target.value = datetime(2023, 10, 1)
        target.number_format = "yyyy年m月"

        # 日付ごとのデータを直接書き込み（日付セルを元に行を決定）
        for date_key, route in route_map.items():
            day = date_key.day
            row = day + 5
            # 通勤経路を右隣のセル(V列)に入力
            ws.cell(row, 22, route)
            # 往復金額(AG列)
            ws.cell(row, 33, fare_map[date_key])

        # ファイル出力
        out_file = output_dir / f"勤務表_{year:04d}-{month:02d}.xlsx"
        wb.save(out_file)
        print(f"✓ 出力完了: {out_file}")


if __name__ == '__main__':
    make_timesheets(PDF_PATH, TEMPLATE_PATH, OUTPUT_DIR)

    # 以下サンプル実行結果例
    # ✓ 出力完了: output\勤務表_2023-10.xlsx
    # ✓ 出力完了: output\勤務表_2023-11.xlsx
    # ✓ 出力完了: output\勤務表_2023-12.xlsx
    # ✓ 出力完了: output\勤務表_2024-01.xlsx
