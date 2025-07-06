import PySimpleGUI as sg
from Process import extract_workday_from_salary_pdf
from Suica import extract_suica_history, convert_dataframe, add_year, extract_date_from_pdf

# レイアウトの定義
layout = [[sg.Text("給与明細ファイルを選択してください")],
          [sg.Input(enable_events=True, key="-SALARY-"),
           sg.FileBrowse(key="salary_file")],
          [sg.Text("Suica利用履歴ファイルを選択してください")],
          [sg.Input(enable_events=True, key="-SUICA-"),
           sg.FileBrowse(key="suica_file")],
          [sg.Table(values=[], key="workday_table", headings=[
                    "日付", "金額", "場所"], auto_size_columns=False, col_widths=[10, 10, 10], num_rows=1, justification="left", row_height=15)],
          [sg.Table(values=[], key="suica_table", headings=[
                    "月", "日", "種別", "利用駅", "種別", "利用駅", "残高", "入金・利用額", "年"], auto_size_columns=False, col_widths=[5, 5, 10, 15, 10, 15, 10, 10, 10], num_rows=1, justification="left", row_height=15)],
          [sg.Button("とじる")]]

# ウィンドウの作成
window = sg.Window("ファイル選択", layout)

# イベントループ
while True:
    event, values = window.read()
    if event in (None, "とじる"):
        break
    if event == "-SALARY-":
        value = extract_workday_from_salary_pdf(values["salary_file"])
        window["workday_table"].update(values=value, num_rows=len(value))
    if event == "-SUICA-":
        df = extract_suica_history(values["suica_file"])
        convert_dataframe(df)
        add_year(df, extract_date_from_pdf(values["suica_file"]))
        window["suica_table"].update(values=df.values.tolist(), num_rows=len(df))

window.close()
