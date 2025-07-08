# 勤怠×Suica 自動突合スクリプト 設計ドキュメント

> **目的** : 会社指定の **勤務表兼交通費精算 Excel テンプレート** に、Suica 明細から取得した日次運賃を自動入力し、提出用ファイル（Excel / PDF）をワンクリックで生成する。

---

## 1 背景・前提

| 項目        | 内容                                                           |
| --------- | ------------------------------------------------------------ |
| 勤務表テンプレート | `d54ff476ff529c75ab262cbbed599019.xlsx`（以下 *timesheet.xlsx*） |
| Suica 明細  | PDF または Web の HTML 画面（CSV 直接ダウンロード不可）                        |
| 提出方式      | 印刷紙 or PDF(会社 Web へアップロード)                                   |
| 作業サイクル    | **1 か月遅れ**で作成・提出                                             |
| 実行環境      | Windows 11, Python 3.12, Office 365 / または LibreOffice        |

---

## 2 テンプレート解析結果（*timesheet.xlsx*）

| シート     | 主要セル          | 意味                      | 備考                   |
| ------- | ------------- | ----------------------- | -------------------- |
| `勤務表`   | A6\:A36       | 当月 1〜31 日の Excel シリアル日付 | A 列が空 or 月が変わったら処理終了 |
|         | C 列           | 勤務先名称                   | コピー可（全行同一）           |
|         | **U 列 (21)**  | 通勤経路                    | 「幕張本郷 — 千葉」など        |
|         | **AG 列 (33)** | 交通費(円)                  | 往復合計を入力              |
|         | 最終行           | 月間合計・計算式                | 数式は **壊さず** 値のみ入力    |

> **注意** : 列番号は 1‑based で A=1 … AG=33。

---

## 3 データフロー

```text
      +--------------+
      | Suica PDF    |
      +------+-------+
             |
     (Camelot / pdfplumber)
             v         ①
+------------+-------------+
| DataFrame(日付,運賃)    |
+------------+-------------+
             |
       ② join by date
             v
+------------+-------------+
| timesheet.xlsx (openpyxl)|
+------------+-------------+
             |
       ③ save
             v
+-------------------------+
| 勤務表_YYYY-MM.xlsx     |
+-------------------------+
             |
       ④ optional
             v
+-------------------------+
| 勤務表_YYYY-MM.pdf      |
+-------------------------+
```

### ① Suica 明細取り込み

- **PDF** : `camelot.read_pdf(..., flavor="lattice")` で罫線テーブル抽出 → `pandas.DataFrame`
- **HTML スクレイピング** : `requests + BeautifulSoup` で `<table>` 解析

### ② 突合ロジック

```python
fare_df = suica_df.groupby('date')['fare'].sum()  # 日付毎に往復合計
```

- 片道運賃×2 ではなく、実データ合計を優先（途中下車・立寄り考慮）。
- 出勤日リストは Excel 側の日付列を信頼。

### ③ Excel 反映

- `openpyxl.load_workbook()`
- 6 行目から走査し、`date.month==target.month` の行のみ処理
- `ws.cell(row, 3).value = company_name`
- `ws.cell(row, 21+1).value = route` ※列ずれ注意
- `ws.cell(row, 33).value = fare_map[date]`（キーが存在する場合のみ）

### ④ PDF 変換（任意）

- Excel インストールあり : `win32com.client.Dispatch("Excel.Application").ExportAsFixedFormat(...)`
- 無し : `subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', outfile])`

---

## 4 ライブラリ一覧

| 分類        | 推奨ライブラリ                                          | 補足                                             |
| --------- | ------------------------------------------------ | ---------------------------------------------- |
| PDF → 表   | **camelot**, tabula‑py, pdfplumber               | 罫線あり → lattice, 無し → stream + OCR(pytesseract) |
| HTML 取得   | requests, BeautifulSoup4                         | ログインセッション要管理                                   |
| Excel I/O | **openpyxl**                                     | 書式保持。`pandas.to_excel()` は NG                  |
| PDF 書出    | win32com (Windows), libreoffice (cross‑platform) | フォント埋込も可                                       |
| 便利        | pandas, python‑dateutil                          | 集計／日付演算                                        |

---

## 5 設定ファイル例 (`config.yaml`)

```yaml
# 通勤設定
home_station: "幕張本郷"
work_station: "千葉"
route_label: "幕張本郷 — 千葉"
company_name: "山田工業㈱"

# ファイルパス
template: "d54ff476ff529c75ab262cbbed599019.xlsx"
suica_pdf: "suica_202507.pdf"
output_dir: "./out"

# 対象年月 (YYYY-MM)
month: "2025-07"
```

---

## 6 コード雛形

```python
from pathlib import Path
from datetime import datetime, timedelta
import pandas as pd, openpyxl, camelot

CFG = yaml.safe_load(Path('config.yaml').read_text())
MONTH = datetime.strptime(CFG['month'], '%Y-%m')

def parse_suica(path_pdf):
    tables = camelot.read_pdf(path_pdf, flavor='lattice', pages='all')
    df = pd.concat(t.df for t in tables)
    df.columns = ['date', 'in_station', 'out_station', 'fare', ...]
    df['date'] = pd.to_datetime(df['date'])
    # 往復抽出
    cond = (
        (df['in_station'] == CFG['home_station']) & (df['out_station'] == CFG['work_station']) |
        (df['in_station'] == CFG['work_station']) & (df['out_station'] == CFG['home_station'])
    )
    fares = df[cond].groupby(df['date'].dt.date)['fare'].sum()
    return fares.to_dict()


def fill_timesheet(fare_map):
    wb = openpyxl.load_workbook(CFG['template'])
    ws = wb['勤務表']

    for row in range(6, 37):
        serial = ws.cell(row, 1).value
        if not isinstance(serial, (int, float)):
            continue
        date = datetime(1899, 12, 30) + timedelta(days=int(serial))
        if date.month != MONTH.month:
            continue
        ws.cell(row, 3, CFG['company_name'])
        ws.cell(row, 22, CFG['route_label'])  # U=21, V=22
        if date.date() in fare_map:
            ws.cell(row, 33, fare_map[date.date()])

    out_xlsx = Path(CFG['output_dir']) / f"勤務表_{MONTH:%Y-%m}.xlsx"
    wb.save(out_xlsx)
    return out_xlsx

if __name__ == '__main__':
    fare_map = parse_suica(CFG['suica_pdf'])
    out_file = fill_timesheet(fare_map)
    print('✓ 完了:', out_file)
```

---

## 7 注意点・ハマりどころ

1. **PDF 規格の揺らぎ** : 罫線の有無で Camelot の flavor を切替える。うまく列が合わない場合は `edge_tol`, `line_scale` を調整。
2. **Excel 数式破壊** : `openpyxl` はセルを書換えても既存数式は保持されるが、`pandas.ExcelWriter(engine='openpyxl', mode='a')` だと上書きされる危険。
3. **月跨ぎ** : 末日が 30 行目以降に来るとテンプレートの余白に日付が残り、誤入力することがあるので month チェック必須。
4. **定期券利用** : Suica 運賃が 0 円になるケース → `fare > 0` でフィルタ、または定期区間外日を別ロジックで加算。
5. **会社ルール** : 手入力欄 (備考やハンコ欄) が後工程で必要なら自動入力しないか、マクロでポップアップ入力にする。

---

## 8 TODO / 次フェーズ

-

---

**最終目標** : 毎月 1 クリックで「Suica 明細 PDF」→「勤務表\_YYYY-MM.xlsx / .pdf」生成し、そのまま提出。

