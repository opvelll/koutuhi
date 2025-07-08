import pandas as pd


def transform_suica_history(df: pd.DataFrame) -> pd.DataFrame:
    """
    Suica履歴DataFrameを日付ごとの経路と支払額テーブルに変換します。

    引数:
        df: parse_suica_history_text などで得られた DataFrame
    戻り値:
        日付, 経路, 支払額 の列を持つ DataFrame
    """
    if df.empty:
        return pd.DataFrame(columns=['日付', '経路', '支払額'])
    df2 = df.copy()

    def make_route(row):
        if row['利用駅2']:
            return f"{row['種別1']}:{row['利用駅1']} -> {row['種別2']}:{row['利用駅2']}"
        else:
            return f"{row['種別1']}:{row['利用駅1']}"

    df2['経路'] = df2.apply(make_route, axis=1)
    result = df2[['日付', '経路', '支払額']]
    return result
