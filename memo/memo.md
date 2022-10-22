トランザクションの署名ができなかった

　どうやらまだ色々と知識が足りないらしい。心が折れた。送金の夢は一旦ここで断念する。たぶん3度目の挫折。

<!-- more -->

# 成果物

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/Electron.bitcoinjs.lib.sign.20221004155414

## 実行

```
NAME='Electron.bitcoinjs.lib.sign.20221004155414'
git clone https://github.com/ytyaru/$NAME
cd $NAME
npm i
npm start
```

　動作させると以下エラーになる。署名を実装したかったが、できなかった。

```
renderer.js:24 Uncaught (in promise) Error: Error invoking remote method 'signTx': Error: No input #1
```

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

　bitcoinjs-libでトランザクションを作成するコード例はネットを検索すれば結構あった。ただバージョンによる違いなどがあり、情報が錯綜して苦労した。

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

## どうすれば送金できるか

　たぶん情報源にあることを理解するしかない。テストネットの使い方や、トランザクションをすべて自分で作成する所からはじめると思う。となると今までの苦労が水の泡になりそう。[create_send][]とか苦労したのに使わなそうだし。もうその時点で精神的ダメージが大きすぎた。「今までの苦労は一体……」という精神的徒労感に勝てなかった。

## 挫折

　送金についてはもう何度目の挫折になるか。3度目くらいか。ネットではどこかでだれかが簡単だって言ってたけど死ぬほど難しい。

　一旦ほかのことをやって忘れ、心の傷を癒やしたい。もっとエラーなくサクサク書いて動く楽しいプログラミング生活を満喫して英気を養おう。

