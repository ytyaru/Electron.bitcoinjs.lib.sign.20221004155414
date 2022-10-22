トランザクションの署名ができなかった

　心が折れた。どうやらまだ色々と知識が足りないらしい。

<!-- more -->

# 送金する方法のおさらい

1. [create_send][]でトランザクション情報を作成する
2. 1を署名する
3. 2をブロードキャストする（[sendtx][]等）

[create_send]:https://counterparty.io/docs/api/#create_send
[sendtx]:https://blockbook.electrum-mona.org/sendtx

　このうち1だけはほぼ思い通りにできたと思う。

* [mpchain APIのcreate_sendを実行する【curl】][]
* [mpchain APIでcreate_sendを実行する【JavaScript】][]
* [mpchain APIのcreate_sendを実行する【Electron】][]
* [bitcoinjs-libでcreate_sendのtxHexからTransactionデータをデコードする][]

　それまでの工程も以下で大体カバーできるはず。

* [coininfoの全コイン種別を調べる【24種】改][]
* [ecpairとwifを相互変換してみた][]
* [bip39でモナコインアドレスを作る][]

[coininfoの全コイン種別を調べる【24種】改]:https://monaledge.com/article/555
[ecpairとwifを相互変換してみた]:https://monaledge.com/article/568
[bip39でモナコインアドレスを作る]:https://monaledge.com/article/569

[mpchain APIのcreate_sendを実行する【curl】]:https://monaledge.com/article/570
[mpchain APIでcreate_sendを実行する【JavaScript】]:https://monaledge.com/article/571
[mpchain APIのcreate_sendを実行する【Electron】]:https://monaledge.com/article/572
[bitcoinjs-libでcreate_sendのtxHexからTransactionデータをデコードする]:https://monaledge.com/article/573

　ただ、ここから先の署名ができなかった。

# 情報源

　たぶんここあたりを理解できたら送金できるはず。

* [ブラウザでBTC送金トランザクション (segwit対応)][]
* [bitcoinjs-libを使ったウォレット開発入門][]
* [bitcoinjs-lib search sign][]

[bitcoinjs-libを使ったウォレット開発入門]:https://qiita.com/shu-kob/items/380e26eaee025edd6fcb
[ブラウザでBTC送金トランザクション (segwit対応)]:https://memo.appri.me/programming/btc-tx-on-browser#%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6%E3%81%A7BTC%E9%80%81%E9%87%91%E3%83%88%E3%83%A9%E3%83%B3%E3%82%B6%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3_segwit%E5%AF%BE%E5%BF%9C
[bitcoinjs-lib search sign]:https://github.com/bitcoinjs/bitcoinjs-lib/search?q=sign

　自分で最初からトランザクションを作成すれば送金できるのかもしれない。ただ、そのコードを読む力が私にはなかった。何となく雰囲気で読むと、どうやら自分でトランザクションを作成しているようだ。でも私は今まで[create_send][]にトランザクション作成してもらっていた。

　そもそも、トランザクション情報は本当に自分で作ってもいいものなのか。[create_send][]なら支払額が安すぎたらエラーを出すなどしていたが、自分でトランザクションデータを作ったらそうした判定ができなくなる。そのときどうなるのか。ブロードキャストのときにエラーになるのかな？

　あと、単純にトランザクション作成のコードが理解できない。たぶん概要としては所持金である未使用トランザクションUTXOを取得する。支払額＋手数料以上の額をもったそれを用意するのだと思うけど。そのへんをやりたくなくて[create_send][]にまかせたい。

　そんなわけで署名するためにはトランザクション作成からしなければならない。今まで頑張った成果である[create_send][]を使ってトランザクションを作成できないか調べたが、できなかった。

クラス|概要
------|----
`bitcoin.TransactionBuilder`|バージョン6で消されたらしい。
`bitcoin.Psbt`|これを使うっぽいが[create_send][]のデータをどう渡せばいいかわからない。そもそも[create_send][]のデータから作れるのかどうかもわからない。

# コード

　`bitcoin.Psbt.fromHex(txHex)`の`txHex`に[create_send][]の`tx_hex`を渡せばいいはず。と思ったのだが「`Invalid Magic Number`」というエラーが出て阻まれた。

```javascript
const bitcoin = require('bitcoinjs-lib')

//const psbt = bitcoin.Psbt.fromHex(txHex)
//const psbt = bitcoin.Psbt.fromHex(txHex, network)
//const psbt = bitcoin.Psbt.fromHex(txHex, {network:network}) // Invalid Magic Number
//console.log(tx)
//const psbt = bitcoin.Psbt.fromHex(tx, {network:network}) // Invalid Magic Number
```

　他にも色々と試してみたが駄目だった。たぶん知識が足りない。

## main.js

```javascript
ipcMain.handle('signTx', async(event, txHex, tx, address)=>{ // tx: create_sendの戻り値をデコードしたもの
    console.log('----- signTx -----')
    //console.log(tx)
    const wif = getWifByAddress(address)
    console.log('----- getWifByAddress()後 -----')
    console.log(wif)
    const account = Wif.decode(wif);

    /*
    // https://github.com/bitcoinjs/bitcoinjs-lib/issues/1697
    const keyPair = ECPair.fromWIF(wif, network);
    const txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);
    for (let i = 0; i < tx.ins.length; i++) {
        txb.sign(i, keyPair);
    }
    const signedTxHex = txb.build().toHex();
    return signedTxHex
    */

    console.log('----- bitcoin.Psbt.fromHex(txHex)前 -----')
    //const psbt = bitcoin.Psbt.fromHex(txHex)
    //const psbt = bitcoin.Psbt.fromHex(txHex, network)
    //const psbt = bitcoin.Psbt.fromHex(txHex, {network:network}) // Invalid Magic Number
    //console.log(tx)
    //const psbt = bitcoin.Psbt.fromHex(tx, {network:network}) // Invalid Magic Number

    const psbt = new bitcoin.Psbt({network})
    console.log(tx)
    //console.log(tx.ins)
    for (const i of tx.ins) {
        console.log(i)
        //psbt.addInput({hash:Buffer.from(i.hash, 'hash'), index:i.index, nonWitnessUtxo:Buffer.from(txHex, 'hex') })
        //psbt.addInput({hash:Buffer.from(i.hash, 'hash'), index:i.index }) // Need a Utxo input item for signing
        //psbt.addInput({hash:i.hash, index:i.index-1 }) // Error adding input.
        //psbt.addInput({hash:i.hash, index:i.index }) // Error adding input.
        //psbt.addInput({hash:i.hash, index:i.index, nonWitnessUtxo:Buffer.from(txHex, 'hex')}) // Error adding input.
    }

    for (const o of tx.outs) {
        console.log(o)
        psbt.addOutput({ address:address, value:o.value }) // 
        //psbt.addOutput({ address:address, value:o.value }) // Error adding output.
//        psbt.addOutput({ value:o.value, script:o.script }) // Error adding output.
    }
    console.log('psbt.signInput前')
    psbt.signInput(1, ECPair.fromPrivateKey(fromWif(wif).privateKey))
    psbt.validateSignaturesOfInput(1)
    psbt.finalizeAllInputs()
    return psbt.extractTransaction().toHex();
    /*
    const tx = bitcoin.Transaction.fromHex(txHex)
    console.log(tx.toHex())
    //const psbt = bitcoin.Psbt.fromHex(tx.toHex(), {network:network})
    const psbt = bitcoin.Psbt.fromBuffer(tx.toBuffer(), {network:network})
    //const privKey = ECPair.fromPrivateKey(account.privateKey);
    const privKey = ECPair.fromPrivateKey(fromWif(wif).privateKey);
    for (const i=0; i < tx.ins.length; i++) {
        psbt.signInput(i, privKey)
    }
    psbt.finalizeAllInputs();
    return psbt.extractTransaction().toHex();
    */
    
    /*
    const txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);
    for (let i = 0; i < tx.ins.length; i++) {
        txb.sign(i, keyPair);
    }
    const signedTxHex = txb.build().toHex();
    console.log(signedTxHex)
    */
    /*
    console.log(tx)
    //tx.sign(0, key);
    tx.sign(0, fromWif(wif));
    const signedTxHex = tx.toHex(); // HEX-data of signed transation
    console.log(signedTxHex)
    //tx.hashForSignature(0, 
    */
    //console.log(tx.txHex)
    //const psbt = bitcoin.Psbt.fromHex(tx.txHex, {network:network})
    //const privKey = bitcoin.ECPair.fromPrivateKey(account.privateKey);
    /*
    const privKey = ECPair.fromPrivateKey(account.privateKey);
    for (const i=0; i < tx.ins.length; i++) {
        psbt.signInput(i, privKey)
    }
    psbt.finalizeAllInputs();
    return psbt.extractTransaction().toHex();
    */
    /*
    */
})
```

## 署名するときの不安

　もし署名できたらその時点で所持金がなくなったりするのだろうか？

　たぶんその後ブロードキャストして承認されたらなくなると思うのだが。けど未承認の状態でも所持金はなくなるのでは？　そうでないと未承認の状態で所持金以上に支払えてしまうから。となると、一体いつ所持金が減るのか。考えてみればそこまで細かいタイミングについて把握してなかった。

　もし署名した時点でコインが減るなら、おかしなコードを書いたらコインが消滅したりしないだろうか。

　まあそもそも署名さえできなかったのだが。

# 所感

　というわけで無念だが一旦ここでモナコイン送金の夢は断念する。

　送金なんてAPI一発でできる。たしかにMpurse APIならそうだった。でもそれ以外の方法でやろうとするとめちゃくちゃ大変らしい。

　今まではググったりMpurseのコードを読んだりして必要なライブラリなどを調査し、さらに関係する細々とした各パッケージを使ってみて全体像を想像してきた。遅々として進まず、エラーに阻まれまくってついに心が折れた。

　たぶん情報源にあることを理解するしかない。テストネットの使い方や、トランザクションをすべて自分で作成する所からはじめると思う。となると今までの苦労が水の泡になりそう。[create_send][]とか苦労したのに使わなそうだし。もうその時点で精神的ダメージが大きすぎた。「今までの苦労は一体……」という精神的徒労感に勝てなかった。

　送金についてはもう何度目の挫折になるか。3度目くらいか。ネットではどこかでだれかが簡単だって言ってたけど死ぬほど難しい。

　一旦ほかのことをやって忘れ、心の傷を癒やしたい。もっとエラーなくサクサク書いて動く楽しいプログラミング生活を満喫して英気を養おう。




　そのうちまたいつか手をつけて送金までこぎつけたいけど、遅々として進まずエラーに阻まれまくって心が折れた。ほかのことをやって忘れ、心の傷を癒やしたい。

　そしたら情報源のようにテストネットの使い方や、トランザクションをすべて自分で作成する所からはじめる。今まで[create_send][]を使う苦労などをすべてかなぐり捨てることになるので精神的ダメージが大きかった。

--------------------------------------------------------------------------
















<!-- more -->

# ブツ

* [リポジトリ][]

![eye-catch.png][リポジトリ]

[リポジトリ]:https://github.com/ytyaru/Electron.bitcoinjs.lib.transaction.20221004120314
[eye-catch.png]:eye-catch.png

# 実行

```sh
NAME='Electron.bitcoinjs.lib.transaction.20221004120314'
git clone https://github.com/ytyaru/$NAME
cd $NAME
./run.sh
```

環境|version
----|-------
Node.js|18.10.0
Electron|21.0.1

# 情報源

* [bitcoinjs-libを使ったウォレット開発入門][]
* [ブラウザでBTC送金トランザクション (segwit対応)][]
* [bitcoinjs-lib search sign][]

[bitcoinjs-libを使ったウォレット開発入門]:https://qiita.com/shu-kob/items/380e26eaee025edd6fcb
[ブラウザでBTC送金トランザクション (segwit対応)]:https://memo.appri.me/programming/btc-tx-on-browser#%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6%E3%81%A7BTC%E9%80%81%E9%87%91%E3%83%88%E3%83%A9%E3%83%B3%E3%82%B6%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3_segwit%E5%AF%BE%E5%BF%9C
[bitcoinjs-lib search sign]:https://github.com/bitcoinjs/bitcoinjs-lib/search?q=sign

　むずかしすぎる。コード例はトランザクションの生成と署名をすべて自前でやっているようだ。でも私は[mpchain API][]で[create_send][]したのでトランザクションの生成はやってもらったはず。あとは署名とブロードキャストをすればいいと思っている。

　でも、どうやって署名すればいいかわからない。生成せずに署名だけをする

　





ブラウザでBTC送金トランザクション (segwit対応)
ブラウザでBTC送金トランザクション (segwit対応)

# 調査

　[create_send][]の戻り値は以下のようなものだった。

```javascript
{"id":0,"jsonrpc":"2.0","result":{"btc_change":101556960,"btc_fee":2250,"btc_in":112970610,"btc_out":11411400,"tx_hex":"0100000001737a59194d5705b49f8e7c262d97d5cfd1e31ba5f6a7590402634bcbd71c53e9010000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888acffffffff02c81fae00000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888ace0a20d06000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888ac00000000"}}
```

　これは指定したアドレスや金額に応じてトランザクション情報を返してくれたもののはず。それらしきものは`tx_hex`なのだが、名前や値から察するに16進数化されている。これをデコードすることでJSONにできるはず。それをするのがbitcoinjs-libのはず。

　bitcoinjs-libのリポジトリで`txHex`を引数にとっているメソッドがあれば、それが16進数値からJSONへデコードするメソッドにちがいない。

　そう当たりをつけてコード検索をかけた。

* [bitcoinjs-lib search txHex][]

[bitcoinjs-lib search txHex]:https://github.com/bitcoinjs/bitcoinjs-lib/search?q=txHex&type=
[blocks.spec.ts]:https://github.com/bitcoinjs/bitcoinjs-lib/blob/239711bf4ef00651af92049bcdf88b12252b945c/test/integration/blocks.spec.ts#L17

　すると[blocks.spec.ts][]にそれらしき箇所を発見した。

```javascript
    const tx = bitcoin.Transaction.fromHex(txHex);
```

　今回はこのメソッドに[create_send][]の戻り値である`tx_hex`を渡してみた。すると想定通りトランザクションの入力と出力がセットされたオブジェクトが返ってきた！

# コード抜粋

　今回のポイントはここ。

```javascript
const bitcoin = require('bitcoinjs-lib')
const tx = bitcoin.Transaction.fromHex(txHex);
```

　これをElectronのIPC通信インタフェースにする。

## main.js

```javascript
ipcMain.handle('decodeTxHex', async(event, txHex)=>{
    console.log(txHex)
    const tx = bitcoin.Transaction.fromHex(txHex);
    console.log(tx)
    return tx
})
```

## preload.js

```javascript
decodeTxHex:async(txHex)=>await ipcRenderer.invoke('decodeTxHex', txHex),
```

## renderer.js

　呼び出す。[create_send][]で`tx_hex`を入手したら、それを`decodeTxHex`に渡す。

```javascript
const json = await Mpchain.createSend(...values)
const tx = await window.ipc.decodeTxHex(json.result.tx_hex)
```

# 結果

## create_send

```javascript
{"id":0,"jsonrpc":"2.0","result":{"btc_change":101556960,"btc_fee":2250,"btc_in":112970610,"btc_out":11411400,"tx_hex":"0100000001737a59194d5705b49f8e7c262d97d5cfd1e31ba5f6a7590402634bcbd71c53e9010000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888acffffffff02c81fae00000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888ace0a20d06000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888ac00000000"}}
```

## decodeTxHex

```javascript
{"version":1,"locktime":0,"ins":[{"hash":{"0":115,"1":122,"2":89,"3":25,"4":77,"5":87,"6":5,"7":180,"8":159,"9":142,"10":124,"11":38,"12":45,"13":151,"14":213,"15":207,"16":209,"17":227,"18":27,"19":165,"20":246,"21":167,"22":89,"23":4,"24":2,"25":99,"26":75,"27":203,"28":215,"29":28,"30":83,"31":233},"index":1,"script":{"0":118,"1":169,"2":20,"3":69,"4":252,"5":19,"6":201,"7":211,"8":160,"9":223,"10":52,"11":0,"12":130,"13":145,"14":73,"15":44,"16":57,"17":224,"18":239,"19":205,"20":210,"21":32,"22":184,"23":136,"24":172},"sequence":4294967295,"witness":[]}],"outs":[{"value":11411400,"script":{"0":118,"1":169,"2":20,"3":69,"4":252,"5":19,"6":201,"7":211,"8":160,"9":223,"10":52,"11":0,"12":130,"13":145,"14":73,"15":44,"16":57,"17":224,"18":239,"19":205,"20":210,"21":32,"22":184,"23":136,"24":172}},{"value":101556960,"script":{"0":118,"1":169,"2":20,"3":69,"4":252,"5":19,"6":201,"7":211,"8":160,"9":223,"10":52,"11":0,"12":130,"13":145,"14":73,"15":44,"16":57,"17":224,"18":239,"19":205,"20":210,"21":32,"22":184,"23":136,"24":172}}]}
```

　`ins`が入力、`outs`が出力。`outs`の`value`には支払額やおつりが入っている。あれ、でも`ins`のほうに`value`がない。なぜ？

　このトランザクションデータは暗号通貨の取引データそのもののはず。

# 今後

　あとはこのデータに署名して、そのデータをブロードキャストすれば取引を依頼できたことになる。この時点で「承認待ち」となる。その後はマイナーがマイニングして「承認済み」となれば、その取引が確定する。

　そういう流れだということはわかっている。問題はそれをソースコードに落とし込む所。署名とブロードキャストを実装すれば、あとは待つだけ。そこまでたどり着けるかな？

　でも先が見えてきた。Node.jsで送金できるようになるかもしれない。がんばろう。

