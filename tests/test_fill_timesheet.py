import openpyxl
import yaml
import pytest
from pathlib import Path

# テスト用: defaults.yaml の読み込み


def load_defaults(config_path: Path) -> dict:
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def test_verify_timesheets():
    """
    output ディレクトリ内の勤務表ファイルの J3, Q3, Z3 セルの値が defaults.yaml と一致することを検証する。
    """
    root = Path(__file__).parent.parent
    output_dir = root / 'output'
    config_path = root / 'setting' / 'defaults.yaml'

    settings = load_defaults(config_path)
    files = list(output_dir.glob('勤務表_*.xlsx'))
    assert files, f"No timesheet files found in {output_dir}"
    for file in files:
        wb = openpyxl.load_workbook(file, data_only=True)
        ws = wb['勤務表']
        assert ws['J3'].value == settings['branch'], (
            f"{file.name}: expected branch {settings['branch']}, got {ws['J3'].value}")
        assert ws['Q3'].value == settings['employee_id'], (
            f"{file.name}: expected employee_id {settings['employee_id']}, got {ws['Q3'].value}")
        assert ws['Z3'].value == settings['name'], (
            f"{file.name}: expected name {settings['name']}, got {ws['Z3'].value}")
