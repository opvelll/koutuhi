import pandas as pd


# ヘルパー関数: 日付ごとの通勤経路(DataFrame)を生成
def _generate_routes_df(df2: pd.DataFrame) -> pd.DataFrame:
    routes = []
    for date, grp in df2.groupby('日付'):
        seen = set()
        pairs = []
        # ユニークなstationペア(順序保持)を収集
        for _, row in grp.iterrows():
            orig1 = str(row['利用駅1']).strip()
            orig2 = str(row['利用駅2']).strip()
            key = frozenset([orig1, orig2])
            if key in seen:
                continue
            seen.add(key)
            pairs.append((orig1, orig2))
        # オーバーラップするペアを連結してセグメント化
        segments = []
        if pairs:
            curr = [pairs[0][0], pairs[0][1]]
            prev_end = pairs[0][1]
            for a, b in pairs[1:]:
                if a == prev_end:
                    curr.append(b)
                    prev_end = b
                else:
                    segments.append(curr)
                    curr = [a, b]
                    prev_end = b
            segments.append(curr)
        # セグメントを文字列化
        route_str = ' '.join('～'.join(seg) for seg in segments)
        routes.append({'日付': date, '通勤経路': route_str})
    return pd.DataFrame(routes)


# ヘルパー関数: 日付ごとの往復金額(DataFrame)を計算
def _calculate_total_df(df2: pd.DataFrame) -> pd.DataFrame:
    return (
        df2.groupby('日付')['abs金額']
        .sum()
        .reset_index()
        .rename(columns={'abs金額': '往復金額'})
    )


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
    # ヘルパー関数で通勤経路と往復金額を生成
    routes_df = _generate_routes_df(df2)
    total_df = _calculate_total_df(df2)
    # routes_df と合計金額をマージ
    result = pd.merge(routes_df, total_df, on='日付')
    # 日付を YYYY/MM/DD 形式の文字列に変換
    if pd.api.types.is_datetime64_any_dtype(result['日付']):
        result['日付'] = result['日付'].dt.strftime('%Y/%m/%d')
    return result[['日付', '通勤経路', '往復金額']]


#         日付                                            通勤経路  往復金額
# 2023/10/18                                        竹ノ塚～東武押上   522
# 2023/10/24                                        竹ノ塚～地　入谷   712
# 2023/10/25                                        竹ノ塚～地　入谷   712
# 2023/10/26                      竹ノ塚～三ノ輪 地　入谷～地北千住 東武北千～竹ノ塚   712
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
