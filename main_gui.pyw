import PySimpleGUI as sg
from pathlib import Path
import pandas as pd

from src.fill_timesheet import preview_suica_records, make_timesheets_from_records


def render_preview(window, df: pd.DataFrame):
    """
    テーブルカラムに Suica 履歴プレビューを描画するヘルパー関数。
    """
    # 既存内容クリア
    window['-TABLE_COL-'].update([])
    # ヘッダー
    header_elems = [sg.Text(col, size=(22, 1))
                    for col in df.columns] + [sg.Text('使用する', size=(10, 1))]
    window.extend_layout(window['-TABLE_COL-'], [header_elems])
    # 各行描画
    for i, row in df.iterrows():
        # 日付表示
        date_str = row['日付'].strftime('%Y-%m-%d')
        # 欠損判定
        s1, s2 = row.get('利用駅1'), row.get('利用駅2')
        missing = pd.isna(s1) or not str(
            s1).strip() or pd.isna(s2) or not str(s2).strip()
        # 各セル
        row_elems = []
        for col in df.columns:
            val = date_str if col == '日付' else row[col]
            row_elems.append(sg.Text(str(val), size=(22, 1)))
        chk = sg.Checkbox('', default=not missing,
                          disabled=missing, key=f'-CHK_{i}-')
        window.extend_layout(window['-TABLE_COL-'], [row_elems + [chk]])
    window.refresh()


def main():
    sg.theme('LightGrey1')

    layout = [  # レイアウト定義
        [sg.Text('Suica PDF ファイル:'), sg.Input('', key='-PDF_PATH-'),
         sg.FileBrowse(file_types=(('PDF Files', '*.pdf'),))],
        [sg.Text('テンプレート Excel:'), sg.Input('', key='-TEMPLATE_PATH-'),
         sg.FileBrowse('選択', file_types=(('Excel Files', '*.xlsx'),))],
        [sg.Text('出力フォルダ:'), sg.Input(
            '', key='-OUTPUT_DIR-'), sg.FolderBrowse()],
        [sg.Button('Load', key='-LOAD-')],
        [sg.Frame('Records', [  # テーブル表示
                  [sg.Column([], key='-TABLE_COL-', scrollable=True,
                             size=(1200, 400), expand_x=True, expand_y=True)
                   ]
                  ], expand_x=True, expand_y=True)],
        [sg.Button('Generate', key='-GENERATE-'), sg.Button('Exit')]
    ]

    window = sg.Window('Suica To Timesheet', layout,
                       finalize=True, resizable=True)
    df = None

    while True:
        event, values = window.read()
        if event in (sg.WIN_CLOSED, 'Exit'):
            break

        if event == '-LOAD-':
            pdf_input = values['-PDF_PATH-']
            pdf_path = Path(pdf_input)
            # 空文字やフォルダの場合はエラー
            if not pdf_input or not pdf_path.exists() or not pdf_path.is_file():
                sg.popup_error('有効なPDFファイルを指定してください')
                continue
            df = preview_suica_records(pdf_path)
            render_preview(window, df)

        if event == '-GENERATE-':
            if df is None:
                sg.popup_error('まず PDF を Load してください')
                continue
            # 選択行
            selected_idx = [i for i in df.index if window[f'-CHK_{i}-'].get()]
            if not selected_idx:
                sg.popup_error('選択された行がありません')
                continue
            df_sel = df.loc[selected_idx]
            # テンプレート・出力先取得
            tpl = Path(values['-TEMPLATE_PATH-'])
            outdir = Path(values['-OUTPUT_DIR-']
                          ) if values['-OUTPUT_DIR-'] else None
            if not tpl.exists() or not tpl.is_file():
                sg.popup_error('有効なテンプレートファイルを指定してください')
                continue
            if outdir and not outdir.exists():
                outdir.mkdir(parents=True, exist_ok=True)
            # 勤務表生成
            make_timesheets_from_records(df_sel, tpl, outdir or Path('output'))
            sg.popup('勤務表の作成が完了しました')

    window.close()


if __name__ == '__main__':
    main()
