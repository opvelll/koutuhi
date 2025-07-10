import pandas as pd


def transform_commute(df: pd.DataFrame) -> pd.DataFrame:
    """
    Suica利用履歴から通勤ルートと往復金額、日付合計を生成する。

    - 種別1 が '入' または '＊入' のみ抽出し、現金等は除外
    - 同一日付・同一路線で入→出 をまとめて往復金額を計算（absで金額合計）
    - 日付ごとの合計金額も列として追加

    入力 df は少なくとも以下の列を持つこと:
      - '日付', '種別1', '利用駅1', '利用駅2', '支払額'

    返り値: DataFrame with columns ['日付', '通勤経路', '往復金額']
    """
    # 種別1 が '入' または '＊入' のみ抽出
    df2 = df[df['種別1'].isin(['入', '＊入'])].copy()
    # 空駅は除外
    df2 = df2[df2['利用駅1'].notna() & df2['利用駅2'].notna()]

    # 金額はabsで計算
    df2['abs金額'] = df2['支払額'].abs()
    # 日付ごとの往復金額（入→出の最初の組を経路として使用、金額は合計）
    route_info = (
        df2.groupby('日付')
           .first()[['利用駅1', '利用駅2']]
           .reset_index()
    )
    route_info['通勤経路'] = route_info['利用駅1'] + '～' + route_info['利用駅2']
    # 日付合計: 日付ごとにabs金額を合計
    total_df = (
        df2.groupby('日付')['abs金額']
           .sum()
           .reset_index()
           .rename(columns={'abs金額': '合計額'})
    )
    # 日付ごとの合計額を呼び出し、往復金額として設定
    result = route_info[['日付', '通勤経路']].merge(total_df, on='日付')
    result['往復金額'] = result['合計額']
    # 合計額列は不要のため削除
    return result[['日付', '通勤経路', '往復金額']]


#         日付     通勤経路  往復金額
# 2023/10/18 竹ノ塚～東武押上   522
# 2023/10/24 竹ノ塚～地　入谷   712
# 2023/10/25 竹ノ塚～地　入谷   712
# 2023/10/26  竹ノ塚～三ノ輪   712
if __name__ == '__main__':
    # サンプル実行例
    from Suica_pymupdf import extract_suica_history_pymupdf, add_year_to_dates
    from date_extractor import extract_history_date_pymupdf
    import os

    pdf_path = os.path.join(
        'sample', 'JE80F121120754077_20231016_20240115160118.pdf')
    # 履歴出力日から年情報を付与
    report_date = extract_history_date_pymupdf(pdf_path)
    df_raw = extract_suica_history_pymupdf(pdf_path)
    df_with_year = add_year_to_dates(df_raw, report_date)
    df = transform_commute(df_with_year)
    print(df.to_string(index=False))  # 確認用出力
