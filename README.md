# P2HACKS2025 アピールシート

## プロダクト名  
はなび  
<img width="2240" alt="HANABI_logo_copy" src="https://github.com/user-attachments/assets/8065e2af-efe4-475b-8024-e7a38b655e7d" />

## コンセプト
「ひとりでも楽しい、みんなでならもっと楽しいSNS」

HANABIは、会話のように「相手を探したり、相手の返答を求める」ような従来のSNSの構造に革命を起こします。  
HANABIが提供するのは、「誰もいない夜道で歌ったり、思いを叫ぶ」ような快感です。  

HANABIが解決する課題：  
1. SNSが他社の投稿や返信に依存している課題  
　→ひとりで使える用途を提供する  
2. 気軽に投稿できない課題  
　→投稿が一定時間で消えるようにする  
　→炎上をポジティブに変える

## 対象ユーザ
対象としているユーザーの悩み：  
1. 誰か返信してくれないか不安になる  
2. 炎上が怖くて気軽につぶやけない  
3. 吐き出したい思いを抱えているけれど、自由に叫ぶ場所がない  
4. SNSの比較文化に疲れる  
5. いいねやリプライの数を気にしてしまう  
6. 気軽に拡散できる環境が怖い  
7. いいねやリプライを送ったとき、次の投稿にもいいねやリプライをしてあげなきゃいけないような気持ちになる  
8. dummy  
9. dummy  
など...
 
要するに、HANABIの対象ユーザーは自然言語と情報機器を扱うことのできる人間です。  
しかし、SNSと感情分析の仕様上、10～30代の日本人が中心になると考えています。

## 利用の流れ
1．HANABIのWebサイトを開く(URL、QRコードなどから)   
<img width="1207" alt="image" src="https://github.com/user-attachments/assets/d20add45-34b9-4f1a-a71e-8343ace7fed9" />  
2．&lt;Login&gt;タブから、GoogleアカウントでSign inする  
<img width="1207" alt="image" src="https://github.com/user-attachments/assets/289dbf77-078c-41cb-9fb3-e2f893d065ef" />  
3．&lt;SNS&gt;タブから、HANABIを起動する  
<img width="1903" alt="image" src="https://github.com/user-attachments/assets/acd77445-d0c5-4594-b2b6-2e1ef3bbee5e" />  
その後：  
・&lt;発火&gt;ボタンを押すと出てくるテキストボックスに「発火したい内容」を入力して、&lt;発火&gt;ボタンを押す or Enterキーを押す（Shift + Enterで改行ができます）  
・他ユーザーの投稿をクリックして追い花火を打ち上げる  
・&lt;おひとり&gt;タブで、自分の思いを吐き出す（&lt;おひとり&gt;タブで投稿した内容は、他人に公開されません）  
・消したい投稿を、ドラッグして水バケツにドロップする  

## 推しポイント
ここにはプロダクトの推しポイントを書きます。
なぜそのプロダクトはほかのプロダクトより優れているのでしょうか？他のプロダクトにはない特徴は何でしょうか？ほかでもないそのプロダクトによってユーザーはどのような嬉しさを得ますか？

## スクリーンショット(任意)
<img width="1895" alt="スクリーンショット 2025-12-19 160322" src="https://github.com/user-attachments/assets/dc10a411-8968-49ec-82ff-a15b90be3c0a" />

## 開発体制

### 役割分担
紅べこ：PM、デザイン、フロントエンド、バックエンド、発表  
よし：バックエンド、インフラ  
イノ：フロントエンド、バックエンド  
Kj：フロントエンド、バックエンド  
全員：発表資料作成

### 開発における工夫した点
チーム開発における工夫：  
- 事前にWindows11にnvmを用いてNode.jsをインストールして、バージョンを揃えた  
- 一日の最後に褒め合い会を実施して、互いのその日の頑張りを褒め合った  
- 毎日対面で全員集合することを徹底した  
- 迷ったときのために、「プロジェクトの指針
  (https://docs.google.com/document/d/1ySdrOqEB4dRODu6fXeJYCmHa-D2mt5kq8Pl0hfx_ruM/edit?usp=sharing)
  」
  を作成していつでも見られるようにした  

技術的な工夫：  
- とんかつ  

スケジュール管理の工夫：  
- 評価基準を基に、発表関連のタスクに時間を多く使うようにした。
- ゴールから逆算してスケジュールを決定し、余裕を持って開発を進めた(日, 火, 水, 木に全員で開発をすることで、)


## 開発技術

### 利用したプログラミング言語
- TypeScript
- JavaScript(極性辞書から不要な行をまとめて削除するためにのみ使用)
- Python(形態素解析に使用)

### 利用したフレームワーク・ライブラリ
フレームワーク：
- Next.js

ライブラリ：
- fireworks-js-setlocation(fireworks-jsをフォークして改造)
  - [githubリポジトリ](https://github.com/shun-god/fireworks-js-setlocation)
  - [npmパッケージ](https://www.npmjs.com/package/@shun_god/fireworks-js-setlocation)
  - [npmパッケージ(reactラッパー)](https://www.npmjs.com/package/@shun_god/fireworks-js-setlocation-react)
- [その他](./package.json)

### その他開発に使用したツール・サービス
- GitHub
- Firebase
- Figjam
- Discord
- GoogleDocument
- VSCode
- GoogleAntigravity
- ChatGPT
- Gemini
