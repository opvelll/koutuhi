import argparse
import os
import sys
import pandas as pd
from src.suica.Suica_pymupdf import extract_suica_history_pymupdf
from src.suica.date_extractor import extract_history_date_pymupdf
from src.suica.history_transformer import transform_suica_history


def main():
    parser = argparse.ArgumentParser(description='Suica利用履歴PDFからExcelに書き出すツール')
    parser.add_argument('pdf', help='入力対象のSuica履歴PDFファイルパス')
    parser.add_argument('output', help='出力先Excelファイルパス(xlsx)')
    args = parser.parse_args()

    pdf_path = args.pdf
    out_path = args.output

    if not os.path.exists(pdf_path):
        print(f"Error: PDFファイルが見つかりません: {pdf_path}")
        sys.exit(1)

    # 日付抽出
    report_date = extract_history_date_pymupdf(pdf_path)
    print(f"履歴出力日: {report_date}")

    # 履歴抽出
    df = extract_suica_history_pymupdf(pdf_path)
    if df.empty:
        print("Error: Suica履歴データが取得できませんでした。")
        sys.exit(1)

    # 変換
    df_out = transform_suica_history(df)

    # Excel書き込み
    try:
        with pd.ExcelWriter(out_path, engine='openpyxl') as writer:
            df_out.to_excel(writer, index=False, sheet_name='Suica履歴')
            # オプションで履歴出力日を別シートに書き込む
            df_date = pd.DataFrame({'履歴日付': [report_date]})
            df_date.to_excel(writer, index=False, sheet_name='Meta')
        print(f"Excelに書き出しました: {out_path}")
    except Exception as e:
        print(f"Error: Excel書き込みに失敗しました: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
