import os
from pathlib import Path
import pandas as pd
import pytest
from src.suica.Suica_pymupdf import extract_suica_history_pymupdf, extract_history_date_pymupdf

# テスト用のサンプルPDFパスを取得
SAMPLE_PDF = Path(__file__).parent.parent / 'sample' / \
    'JE80F121120754077_20231016_20240115160118.pdf'


def test_extract_history_date():
    # 履歴出力日が正しく取得できること
    report_date = extract_history_date_pymupdf(str(SAMPLE_PDF))
    assert report_date == '2024/1/15'


def test_extract_10_24_entries():
    # 10/24 の利用駅1と利用駅2が正しく抽出されること
    df = extract_suica_history_pymupdf(str(SAMPLE_PDF))
    subset = df[df['日付'] == '10/24'][['利用駅1', '利用駅2']]
    result = list(map(tuple, subset.values.tolist()))
    expected = [('竹ノ塚', '地　入谷'), ('地　入谷', '竹ノ塚')]
    assert result == expected, f"Expected {expected}, but got {result}"
