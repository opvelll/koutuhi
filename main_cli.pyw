import argparse
from pathlib import Path
from src.fill_timesheet import make_timesheets


def main():
    parser = argparse.ArgumentParser(description='Suica通勤履歴から勤務表を生成します')
    parser.add_argument('--pdf', required=True, type=Path,
                        help='Suica利用履歴のPDFファイルパス')
    parser.add_argument('--template', default=Path(
        'sample/d54ff476ff529c75ab262cbbed599019.xlsx'), type=Path, help='勤務表テンプレートのExcelファイルパス')
    parser.add_argument('--output', default=Path('output'),
                        type=Path, help='出力先ディレクトリパス')
    args = parser.parse_args()

    make_timesheets(args.pdf, args.template, args.output)


if __name__ == '__main__':
    main()
