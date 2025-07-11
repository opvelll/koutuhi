import PySimpleGUI as sg
from pathlib import Path
import pandas as pd
import yaml
from src.fill_timesheet import preview_suica_records, make_timesheets_from_records, load_defaults


def prepare_display_data(df):
    selected_rows = set()
    disabled_rows = set()
    display_data = []
    for i, row in df.iterrows():
        s1 = row.get('利用駅1')
        s2 = row.get('利用駅2')
        is_disabled = pd.isna(s1) or not str(
            s1).strip() or pd.isna(s2) or not str(s2).strip()

        if is_disabled:
            disabled_rows.add(i)
            selected_char = ''
        else:
            selected_rows.add(i)
            selected_char = '✅'

        display_data.append([
            row['日付'].strftime('%Y-%m-%d'),
            row.get('種別1', ''),
            row.get('利用駅1', ''),
            row.get('種別2', ''),
            row.get('利用駅2', ''),
            row.get('支払額', ''),
            row.get('残額', ''),
            selected_char
        ])
    return display_data, selected_rows, disabled_rows


def resolve_outdir(raw_out):
    if isinstance(raw_out, str) and raw_out.lower() == 'desktop':
        return Path.home() / 'Desktop'
    elif raw_out:
        return Path(raw_out).expanduser()
    else:
        return None


def toggle_selection(clicked_index, window, selected_rows):
    current = window['-TABLE-'].get()
    if clicked_index in selected_rows:
        selected_rows.remove(clicked_index)
        current[clicked_index][7] = ''
    else:
        selected_rows.add(clicked_index)
        current[clicked_index][7] = '✅'
    window['-TABLE-'].update(values=current)


def main():
    sg.theme('LightGrey1')
    # Load default settings
    config_path = Path('setting/defaults.yaml')
    settings = load_defaults(config_path)
    # Get raw default strings for display
    default_tpl_str = settings.get('template_path', '')
    default_out_str = settings.get('output_dir', '')
    # Determine actual default output path, interpreting 'desktop' specially
    if isinstance(default_out_str, str) and default_out_str.lower() == 'desktop':
        default_out_path = Path.home() / 'Desktop'
    else:
        default_out_path = Path(
            default_out_str).expanduser() if default_out_str else None

    header = ["日付", "種別1", "利用駅1", "種別2", "利用駅2", "支払額", "残額", "選択"]

    layout = [
        [sg.Text('Suica PDF ファイル:'), sg.Input('', key='-PDF_PATH-', expand_x=True),
         sg.FileBrowse(file_types=(('PDF Files', '*.pdf'),))],
        [sg.Text('テンプレート勤務表Excel:'), sg.Input(default_tpl_str, key='-TEMPLATE_PATH-', expand_x=True),
         sg.FileBrowse('選択', file_types=(('Excel Files', '*.xlsx'),))],
        [sg.Text('出力フォルダ:'), sg.Input(default_out_str,
                                      key='-OUTPUT_DIR-', expand_x=True), sg.FolderBrowse()],
        [sg.Button('Load', key='-LOAD-')],
        [sg.Table(values=[], headings=header, max_col_width=25,
                  auto_size_columns=True,
                  display_row_numbers=False,
                  justification='left',
                  num_rows=10,  # 高さを調整してボタンが見えるようにする
                  key='-TABLE-',
                  row_height=35,
                  tooltip='Suica Records',
                  enable_events=True,
                  expand_x=True,
                  expand_y=True,
                  col_widths=[10, 5, 15, 5, 15, 10, 10, 5])],
        [sg.Button('Generate', key='-GENERATE-'), sg.Button('Exit')]
    ]

    window = sg.Window('Suica To Timesheet', layout,
                       finalize=True, resizable=True, size=(1000, 600))
    df = None
    selected_rows = set()
    disabled_rows = set()

    while True:
        event, values = window.read()
        if event in (sg.WIN_CLOSED, 'Exit'):
            break

        if event == '-LOAD-':
            pdf_input = values['-PDF_PATH-']
            pdf_path = Path(pdf_input)
            if not pdf_input or not pdf_path.exists() or not pdf_path.is_file():
                sg.popup_error('有効なPDFファイルを指定してください')
                continue

            df = preview_suica_records(pdf_path)

            display_data, selected_rows, disabled_rows = prepare_display_data(
                df)

            window['-TABLE-'].update(values=display_data)

        elif event == '-TABLE-' and values['-TABLE-']:
            clicked_row_index = values['-TABLE-'][0]

            if clicked_row_index in disabled_rows:
                continue  # 無効な行はクリックを無視

            toggle_selection(clicked_row_index, window, selected_rows)

        if event == '-GENERATE-':
            if df is None:
                sg.popup_error('まず PDF を Load してください')
                continue

            if not selected_rows:
                sg.popup_error('選択された行がありません')
                continue

            df_sel = df.loc[sorted(list(selected_rows))]

            tpl = Path(values['-TEMPLATE_PATH-'])
            # Resolve output directory, interpreting 'desktop' keyword
            out_raw = values.get('-OUTPUT_DIR-', '')
            outdir = resolve_outdir(out_raw)

            if not tpl.exists() or not tpl.is_file():
                sg.popup_error('有効なテンプレートファイルを指定してください')
                continue

            if outdir and not outdir.exists():
                outdir.mkdir(parents=True, exist_ok=True)

            make_timesheets_from_records(df_sel, tpl, outdir or Path('output'))
            # Save updated defaults using raw input strings
            settings['template_path'] = values['-TEMPLATE_PATH-']
            settings['output_dir'] = values['-OUTPUT_DIR-']
            with open(config_path, 'w', encoding='utf-8') as f:
                yaml.safe_dump(settings, f, allow_unicode=True)
            sg.popup('勤務表の作成が完了しました')

    window.close()


if __name__ == '__main__':
    main()
