import pytest

from src.suica.Suica_pymupdf import (
    SUICA_COLUMNS,
    add_year_to_dates,
    extract_suica_history_pymupdf,
    parse_suica_history_text,
)


def test_parse_suica_history_text_extracts_transport_rows():
    df = parse_suica_history_text(
        [
            '10 24 入 竹ノ塚 出 地　入谷 \\1,616 -356',
            '10 24 入 地　入谷 出 竹ノ塚 \\1,260 -356',
        ]
    )

    result = list(map(tuple, df[['利用駅1', '利用駅2']].values.tolist()))
    assert result == [('竹ノ塚', '地　入谷'), ('地　入谷', '竹ノ塚')]
    assert df['支払額'].tolist() == [-356, -356]
    assert df['残額'].tolist() == [1616, 1260]


def test_add_year_to_dates_handles_history_crossing_year_boundary():
    df = parse_suica_history_text(
        [
            '12 31 入 A 出 B \\1,000 -100',
            '1 1 入 B 出 A \\900 -100',
        ]
    )

    result = add_year_to_dates(df, '2024/1/15')

    assert result['日付'].tolist() == ['2023/12/31', '2024/01/01']


def test_add_year_to_dates_requires_report_date():
    df = parse_suica_history_text(['10 24 入 竹ノ塚 出 地　入谷 \\1,616 -356'])

    with pytest.raises(ValueError, match='履歴出力日'):
        add_year_to_dates(df, '')


def test_extract_suica_history_returns_expected_columns_for_missing_pdf():
    df = extract_suica_history_pymupdf('missing.pdf')

    assert list(df.columns) == SUICA_COLUMNS
    assert df.empty
