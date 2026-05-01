# 交通費請求書作成支援ツール

## 概要

Suicaの利用履歴（PDF）から、交通経路、交通費の情報を抽出し、サンエス警備の「勤務表及び交通費請求書」に自動で入力するツールです。

画面
![初期画面](<img/スクリーンショット 2025-07-12 035646.png>)

生成例
![生成例](<img/スクリーンショット 2025-07-12 205816.png>)

## ダウンロードして使う場合

GitHub Releases から `koutuhi-windows.zip` をダウンロードし、任意のフォルダに展開してください。

展開後、`koutuhi.exe` をダブルクリックするとアプリを起動できます。

```text
koutuhi-windows/
├── koutuhi.exe
└── setting/
    ├── defaults.yaml
    └── d54ff476ff529c75ab262cbbed599019.xlsx
```

`setting/defaults.yaml` で、支社・社員ID・氏名・出力先などの初期値を変更できます。`setting` フォルダは `koutuhi.exe` と同じ場所に置いてください。

## 開発環境で動かす場合

1. リポジトリをクローン 

    ```
    git clone https://github.com/opvelll/koutuhi.git
    ```

2. uvで仮想環境を構築

   PowerShell:
   ```powershell
   uv venv
   uv pip install -r requirements.txt
   ```

   テストも実行する場合:
   ```powershell
   uv pip install -r requirements-dev.txt
   uv run pytest -q
   ```

   `uv` コマンドが見つからない場合は、PowerShellを開き直すか、`C:\Users\<ユーザー名>\.local\bin` がPathに含まれているか確認してください。

### venvを直接使う場合

2. 仮想環境の構築と有効化  
   PowerShell:
   ```powershell
   python -m venv env
   .\env\Scripts\Activate.ps1
   ```
   コマンドプロンプト(cmd.exe):
   ```bat
   python -m venv env
   .\env\Scripts\activate.bat
   ```

3. 依存ライブラリのインストール  
   ```powershell
   pip install -r requirements.txt
   ```

4. アプリケーションの起動  
   GUI:
   ```powershell
   python main_gui.pyw
   ```

・以降、仮想環境pythonでmain_gui.pywを起動できます。

   ```powershell
   .\env\Scripts\python.exe main_gui.pyw
   ```

## 使い方

0. [モバイルSuica](https://www.mobilesuica.com/index.aspx)にログイン。SF(電子マネー)利用履歴のページに移動。「選択した履歴を印刷」をクリック。PDFをダウンロード。

1. `koutuhi.exe` または `main_gui.pyw` の起動
   ![初期画面](<img/スクリーンショット 2025-07-12 035501.png>)

2. Suica PDFファイルを**Browse**ボタンをクリックして選択し、**Load**ボタンをクリック。

3. チェックボックスで必要な履歴を選択し、**Generate**ボタンをクリックします。

4. テンプレートExcelを元に交通費請求書がデスクトップ直下に生成されます。[Excel Online](https://excel.cloud.microsoft/)などで確認することができます。
    ![生成例](<img/スクリーンショット 2025-07-12 205816.png>)


・テンプレートExcelに支社、社員ID、名前を入力しておくか、`setting`フォルダ内のYAMLファイルに設定しておくと、生成物にそれらが反映されます。

## 注意点

うまくPDFから情報を取り出せない＆うまくテンプレートに書き込めない場合がありますので、あくまで補助ツールとなります。

## 開発者向け: Windows配布zipの作成

PowerShell:

```powershell
uv venv
uv pip install -r requirements-dev.txt
.\scripts\build_windows.ps1
```

成功すると `artifacts/koutuhi-windows.zip` が作成されます。

GitHub Releases では、`v0.1.0` のようなタグをpushすると `.github/workflows/release.yml` がWindows用zipをビルドし、リリースへ添付します。

```powershell
git tag v0.1.0
git push origin v0.1.0
```
