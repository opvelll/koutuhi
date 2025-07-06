import PySimpleGUI as sg

from Process import extract_workday_from_salary_pdf

# レイアウトの定義
layout = [[sg.Text("給与明細ファイルを選択してください")],
          [sg.Input(enable_events=True, key="-FILE-"),
           sg.FileBrowse(key="salary_file")],
          [sg.Table(values=[], key="workday_table", headings=[
                    "日付", "金額", "場所"], auto_size_columns=False, col_widths=[10, 10, 10], num_rows=1, justification="left", row_height=15)],

          [sg.Button("とじる")]]

# ウィンドウの作成
window = sg.Window("ファイル選択", layout)

# イベントループ
while True:
    event, values = window.read()
    if event in (None, "とじる"):
        break
    if event == "-FILE-":
        value = extract_workday_from_salary_pdf(values["salary_file"])
        window["workday_table"].update(values=value, num_rows=len(value))

window.close()
