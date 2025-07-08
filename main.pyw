import PySimpleGUI as sg

from src.salary.Process_pymupdf_simple import extract_workday_from_salary_pdf_pymupdf_simple
from src.suica.Suica_pymupdf import extract_suica_history_pymupdf


# レイアウトの定義
layout = [
    [sg.Text("給与明細ファイルを選択してください")],
    [sg.Input(enable_events=True, key="-SALARY-"),
     sg.FileBrowse(key="salary_file")],
    [sg.Text("Suica利用履歴ファイルを選択してください")],
    [sg.Input(enable_events=True, key="-SUICA-"),
     sg.FileBrowse(key="suica_file")],
    [sg.Pane(
        [
            sg.Column(
                [
                    [sg.Text("給与明細")],
                    [sg.Table(values=[], key="workday_table", headings=["日付", "曜日", "得意先名", "勤務場所", "通常残業", "深夜残業", "合計"],
                              auto_size_columns=False,
                              justification="left",
                              expand_x=True, expand_y=True)]
                ],
                expand_x=True, expand_y=True
            ),
            sg.Column(
                [
                    [sg.Text("Suica利用履歴")],
                    [sg.Table(values=[], key="suica_table", headings=['日付', '種別1', '利用駅1', '種別2', '利用駅2', '支払額', '残額'],
                              auto_size_columns=False,
                              justification="left",
                              expand_x=True, expand_y=True)]
                ],
                expand_x=True, expand_y=True
            )
        ],
        orientation='v', expand_x=True, expand_y=True, key='-PANE-'
    )],
    [sg.Button("とじる"), sg.Sizegrip()]
]

# ウィンドウの作成
window = sg.Window("ファイル選択", layout, resizable=True)

# イベントループ
while True:
    event, values = window.read()
    if event in (None, "とじる"):
        break
    if event == "-SALARY-":
        # 簡易版の抽出関数を使用
        value = extract_workday_from_salary_pdf_pymupdf_simple(
            values["salary_file"])
        window["workday_table"].update(values=value)
    if event == "-SUICA-":
        df = extract_suica_history_pymupdf(values["suica_file"])
        if not df.empty:
            window["suica_table"].update(values=df.values.tolist())

window.close()
