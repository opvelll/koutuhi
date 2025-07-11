import pandas as pd
import re


def transform_commute(df: pd.DataFrame) -> pd.DataFrame:
    """
    Suica利用履歴から通勤ルートと往復金額、日付合計を生成する。

    - 種別1 が '入' または '＊入' のみ抽出し、現金等は除外
    - 同一日付の支払い額を合計して往復金額を計算（absで金額合計）

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
    # 日付ごとに集計: 通勤経路をユニークに抽出し、合計金額を計算
    # 通勤経路は、各日付の利用駅ペアを作成、最初の出現順で '駅1～駅2' として連結
    routes = []
    for date, grp in df2.groupby('日付'):
        seen = set()
        route_labels = []
        for _, row in grp.iterrows():
            # 原始駅名と比較用クリーン駅名取得
            orig1 = str(row['利用駅1']).strip()
            orig2 = str(row['利用駅2']).strip()
            cmp1 = re.sub(r'\s+', '', orig1)
            cmp2 = re.sub(r'\s+', '', orig2)
            pair = frozenset([cmp1, cmp2])
            if pair in seen:
                continue
            seen.add(pair)
            # 表示はtrimのみした元の駅名を使用
            route_labels.append(f"{orig1}～{orig2}")
        routes.append({'日付': date, '通勤経路': ' '.join(route_labels)})
    routes_df = pd.DataFrame(routes)
    # 日付ごとの合計金額
    total_df = (
        df2.groupby('日付')['abs金額']
           .sum()
           .reset_index()
           .rename(columns={'abs金額': '往復金額'})
    )
    # routes_df と合計金額をマージ
    result = pd.merge(routes_df, total_df, on='日付')
    # 日付を YYYY/MM/DD 形式の文字列に変換
    if pd.api.types.is_datetime64_any_dtype(result['日付']):
        result['日付'] = result['日付'].dt.strftime('%Y/%m/%d')
    return result[['日付', '通勤経路', '往復金額']]


#         日付     通勤経路  往復金額
# 2023/10/18 竹ノ塚～東武押上   522
# 2023/10/24 竹ノ塚～地　入谷   712
# 2023/10/25 竹ノ塚～地　入谷   712
# 2023/10/26  竹ノ塚～三ノ輪   712
if __name__ == '__main__':
    # サンプル実行例
    import sys
    from pathlib import Path
    # srcディレクトリをパスに追加してモジュールを解決
    sys.path.insert(0, str(Path(__file__).parents[1]))
    from suica.Suica_pymupdf import extract_suica_history_pymupdf, add_year_to_dates
    from suica.date_extractor import extract_history_date_pymupdf
    import os

    pdf_path = os.path.join(
        'sample', 'JE80F121120754077_20231016_20240115160118.pdf')
    # 履歴出力日から年情報を付与
    report_date = extract_history_date_pymupdf(pdf_path)
    df_raw = extract_suica_history_pymupdf(pdf_path)
    df_with_year = add_year_to_dates(df_raw, report_date)
    df = transform_commute(df_with_year)
    print(df.to_string(index=False))  # 確認用出力
