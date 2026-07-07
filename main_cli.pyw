import argparse
from pathlib import Path
from src.fill_timesheet import make_timesheets
from src.app_paths import resolve_app_path


def main():
    parser = argparse.ArgumentParser(description='Suica通勤履歴から勤務表を生成します')
    parser.add_argument('--pdf', required=True, type=Path,
                        help='Suica利用履歴のPDFファイルパス')
    parser.add_argument('--template', default=Path(
        'setting/d54ff476ff529c75ab262cbbed599019.xlsx'), type=Path, help='勤務表テンプレートのExcelファイルパス')
    parser.add_argument('--output', default=Path('output'),
                        type=Path, help='出力先ディレクトリパス')
    args = parser.parse_args()

    make_timesheets(args.pdf, resolve_app_path(args.template), args.output)


if __name__ == '__main__':
    main()
