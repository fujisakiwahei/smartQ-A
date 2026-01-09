# Requirements Document

## Project Description (Input)

クライアントに納品するウィジェットの実装。なるべく横展開や導入のコストを下げたいので、クライアントの既存サイトに短い JS を書いたらサーバが iframe など（具体的な仕様は未確定）を返して、それをブラウザで描画するようにする。
クライアントの既存サイトで入力するコードには、tenant の id を記載することでサーバ側にて照合を行い適切な tenant のウィジェットが表示されるようにする。（その tenant の Q&A リストなど、データベースから正しくデータを取得する）。

ウィジェットの UI 仕様：

- 初期状態は画面右下に固定配置された角丸正方形のランチャーアイコン。
- クリックするとチャットウィンドウが開く（トグル動作）。
- 開いたウィンドウの右上には「閉じる」ボタンがあり、クリックするとランチャーに戻る。
- チャットインターフェース自体のレイアウトは全テナント共通だが、表示される Q&A データはテナントごとに異なる。

## Requirements

### Requirement 1: クライアント導入（ウィジェットローダー）

**目的:** クライアント管理者として、複雑なインストール作業なしでチャットボットを表示させるために、自社サイトにシンプルなスクリプトを埋め込みたい。

#### Acceptance Criteria

1. The [Widget Loader] shall [public な URL（例: `/widget.js`）でホストされる]
2. When [クライアントサイトでスクリプトが実行された], the [Widget Loader] shall [設定（script タグの属性など）から`tenant_id`を読み取る]
3. When [初期化処理を行う], the [Widget Loader] shall [ホストページ上に iframe または Shadow DOM コンテナを作成する]
4. When [ウィジェット本体をロードする], the [Widget Loader] shall [サーバのエンドポイントに対して`tenant_id`を含むリクエストを送信する]

### Requirement 2: サーバーサイド検証と配信

**目的:** システムとして、知識データを許可された Web サイトにのみ公開するために、参照元ドメインに基づいてウィジェットのリクエストを検証したい。

#### Acceptance Criteria

1. When [ウィジェットの配信リクエストを受信した], the [Widget Delivery Service] shall [指定された`tenant_id`がデータベースに存在するか確認する]
2. When [リクエストを検証する], the [Widget Delivery Service] shall [リクエストの Referer（または Origin）がテナントの`allowed_domains`リストに含まれているか照合する]
3. If [ドメインが許可リストに含まれていない], the [Widget Delivery Service] shall [リクエストを拒否する（403 エラーまたはエラー表示を返す）]
4. When [検証に成功した], the [Widget Delivery Service] shall [そのテナント用のウィジェットアプリケーションコードをレスポンスとして返す]

### Requirement 3: ウィジェットの状態と外観

**目的:** エンドユーザーとして、Web サイトのコンテンツ閲覧を妨げないように、必要な時だけ開くことができる邪魔にならないウィジェットを利用したい。

#### Acceptance Criteria

1. The [Widget Launcher] shall [画面右下に固定配置された角丸正方形のアイコンとして表示される]
2. When [Widget Launcher がクリックされた], the [Widget Client] shall [チャットウィンドウを開く（表示する）]
3. Where [チャットウィンドウが開いている], the [Widget Client] shall [ウィンドウ右上に「閉じる」ボタンを表示する]
4. When [「閉じる」ボタンがクリックされた], the [Widget Client] shall [チャットウィンドウを閉じ、ランチャー表示に戻る]

### Requirement 4: チャット対話機能

**目的:** エンドユーザーとして、テナントのナレッジベースに基づいた回答を得るために、Web サイト上のウィジェットでチャットを行いたい。

#### Acceptance Criteria

1. The [Widget UI] shall [すべてのテナントで共通のチャットインターフェース（入力欄、送信ボタン、履歴表示エリア）を表示する]
2. When [ユーザーがメッセージを送信した], the [Widget UI] shall [メッセージと`tenant_id`を含めて Chat API を呼び出す]
3. While [AI の応答を待機している], the [Widget UI] shall [ローディングインジケーターを表示する]
4. When [API から応答を受信した], the [Widget UI] shall [回答テキストをチャット履歴に追加して表示する]
5. The [Widget UI] shall [ホストページのスタイル（CSS）の影響を受けないように隔離（iframe 等）されている]
