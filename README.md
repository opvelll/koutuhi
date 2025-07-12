# 交通費請求書作成支援ツール

## 概要

Suicaの利用履歴（PDF）から、交通経路、交通費の情報を抽出し、サンエス警備の「勤務表及び交通費請求書」に自動で入力するツールです。

画面
![初期画面](<img/スクリーンショット 2025-07-12 035646.png>)

生成例
![生成例](<img/スクリーンショット 2025-07-12 205816.png>)

## インストール

1. リポジトリをクローン 

    ```
    git clone https://github.com/opvelll/koutuhi.git
    ```

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

1. `main_gui.pyw`の起動
   ![初期画面](<img/スクリーンショット 2025-07-12 035501.png>)

2. Suica PDFファイルを**Browse**ボタンをクリックして選択し、**Load**ボタンをクリック。

3. チェックボックスで必要な履歴を選択し、**Generate**ボタンをクリックします。

4. テンプレートExcelを元に交通費請求書がデスクトップ直下に生成されます。[Excel Online](https://excel.cloud.microsoft/)などで確認することができます。
    ![生成例](<img/スクリーンショット 2025-07-12 205816.png>)


・テンプレートExcelに支社、社員ID、名前を入力しておくか、`setting`フォルダ内のYAMLファイルに設定しておくと、生成物にそれらが反映されます。

## 注意点

うまくPDFから情報を取り出せない＆うまくテンプレートに書き込めない場合がありますので、あくまで補助ツールとなります。