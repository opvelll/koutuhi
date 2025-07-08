import argparse
import os
import pandas as pd
from openpyxl import load_workbook
import shutil
from src.salary.Process_pymupdf_simple import extract_workday_from_salary_pdf_pymupdf_simple


def fill_expense_sheet(data, template_path, output_path):
    """
    data: list of dicts with keys 'date', 'location', 'cost'
    """
    # テンプレートを出力ファイルとしてコピー
    shutil.copyfile(template_path, output_path)
    # コピーしたファイルのシート「勤務表」をヘッダ行4行目から読み込む
    df = pd.read_excel(output_path, sheet_name="勤務表",
                       header=3, engine="openpyxl")
    # 列名を標準化: 1列目を日付, 2列目を区間, 6列目を金額に変更
    cols = df.columns.tolist()
    rename_map = {}
    if len(cols) >= 1:
        rename_map[cols[0]] = "日付"
    if len(cols) >= 2:
        rename_map[cols[1]] = "区間"
    if len(cols) >= 6:
        rename_map[cols[5]] = "金額"
    df.rename(columns=rename_map, inplace=True)

    # データを更新または追加 (日付があれば更新、なければ追加)
    for rec in data:
        mask = df["日付"] == rec["date"]
        if mask.any():
            df.loc[mask, ["区間", "金額"]] = rec["location"], rec["cost"]
        else:
            new_row = {"日付": rec["date"],
                       "区間": rec["location"], "金額": rec["cost"]}
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

    # 既存の『勤務表』シートを置き換えて書き戻す
    with pd.ExcelWriter(output_path, engine="openpyxl", mode='a', if_sheet_exists='replace') as writer:
        df.to_excel(writer, sheet_name="勤務表", index=False)


def parse_salary_history(entries):
    """
    抽出された履歴(リストのリスト)から、Excelに書き込む辞書のリストに変換
    """
    result = []
    for rec in entries:
        # rec: [日付, 区間, 作業内容..., 金額, 備考?]
        date = rec[0]
        location = rec[1]
        # 金額フィールドはインデックス5として想定
        cost_str = rec[5] if len(rec) > 5 else "0"
        # カンマや通貨記号を除去
        # parse cost string into float then convert to int to handle decimal like '0.00'
        num_str = cost_str.replace(',', '').replace('円', '')
        try:
            cost = int(float(num_str))
        except (ValueError, TypeError):
            cost = 0
        result.append({"date": date, "location": location, "cost": cost})
    return result


def main():
    parser = argparse.ArgumentParser(description="交通費請求書を生成するスクリプト")
    parser.add_argument('--salary', required=True, help='給与明細PDFのパス')
    parser.add_argument('--template', default=os.path.join('sample',
                        'd54ff476ff529c75ab262cbbed599019.xlsx'), help='テンプレートExcelファイルのパス')
    parser.add_argument('--output', default='output.xlsx', help='出力Excelファイル名')
    args = parser.parse_args()

    # 給与明細PDFから履歴を抽出
    entries = extract_workday_from_salary_pdf_pymupdf_simple(args.salary)
    data = parse_salary_history(entries)

    # Excelに書き込み
    fill_expense_sheet(data, args.template, args.output)
    print(f"Generated expense report: {args.output}")


if __name__ == '__main__':
    main()
