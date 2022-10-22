const { app, BrowserWindow, session, ipcMain, dialog, net } = require('electron')
const path = require('path')
const fs = require('fs')
const util = require('util')
const childProcess = require('child_process');
const fetch = require('electron-fetch').default; // Node.js v18 ならGlobalにfetchがあるらしいが使えなかったので継続利用する
const bitcoin = require('bitcoinjs-lib')
const tinysecp = require('tiny-secp256k1');
const coininfo = require('coininfo');
const ecpair = require('ecpair');
const Wif = require('wif');
const network = coininfo('MONA').toBitcoinJS();
network.messagePrefix = ''; //hack
const ECPair = ecpair.ECPairFactory(tinysecp)

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        //transparent: true, // 透過
        //opacity: 0.3,
        //frame: false,      // フレームを非表示にする
        webPreferences: {
            nodeIntegration: false,
            //nodeIntegration: true, // https://www.electronjs.org/ja/docs/latest/breaking-changes
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    mainWindow.loadFile('src/index.html')
    //mainWindow.setMenuBarVisibility(false);
    mainWindow.webContents.openDevTools()
}
app.whenReady().then(async()=>{
    createWindow()
    app.on('activate', async()=>{
        if (BrowserWindow.getAllWindows().length === 0) { createWindow() }
    })
})

app.on('window-all-closed', async()=>{
    if (process.platform !== 'darwin') { app.quit() }
})

ipcMain.handle('versions', (event)=>{ return process.versions })
ipcMain.handle('rootDirName', (event)=>{ return __dirname })

ipcMain.handle('basename', (event, p)=>{ return path.basename(p) })
ipcMain.handle('dirname', (event, p)=>{ return path.dirname(p) })
ipcMain.handle('extname', (event, p)=>{ return path.extname(p) })
ipcMain.handle('pathSep', (event, p)=>{ return path.sep })

ipcMain.handle('exists', (event, path)=>{ return fs.existsSync(path) })
ipcMain.handle('isFile', (event, path)=>{ return fs.lstatSync(path).isFile() })
ipcMain.handle('isDir', (event, path)=>{ return fs.lstatSync(path).isDirectory() })
ipcMain.handle('isLink', (event, path)=>{ return fs.lstatSync(path).isSymbolicLink() })
ipcMain.handle('isBlockDev', (event, path)=>{ return fs.lstatSync(path).isBlockDevice() })
ipcMain.handle('isCharDev', (event, path)=>{ return fs.lstatSync(path).isCharacterDevice() })
ipcMain.handle('isFifo', (event, path)=>{ return fs.lstatSync(path).isFIFO() })
ipcMain.handle('isSocket', (event, path)=>{ return fs.lstatSync(path).isSocket() })
ipcMain.handle('mkdir', (event, path)=>{
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, {recursive:true})
    }
})

ipcMain.handle('cp', async(event, src, dst, options) => { fs.cp(src, dst, options, ()=>{}); })
ipcMain.handle('readFile', (event, path, kwargs)=>{ return fs.readFileSync(path, kwargs) })
ipcMain.handle('readTextFile', (event, path, encoding='utf8')=>{ return fs.readFileSync(path, { encoding: encoding }) })
ipcMain.handle('writeFile', (event, path, data)=>{ return fs.writeFileSync(path, data) })
ipcMain.handle('shell', async(event, command) => {
    const exec = util.promisify(childProcess.exec);
    return await exec(command);
})
/* Node.js v18.10 nodeIntegration: true にしたが fetch api が存在しないと怒られる。「fetch is not defined」
ipcMain.handle('fetch', async(event, url, options) => {
    console.log('IPC')
    const res = await fetch(url, options)
    return await res.text()
})
*/

// fetch の Response は関数を含んでいるためIPCでは返せない。そこで関数実行結果を返す
async function returnMimeTypeData(url, options, res) {
    // res.text(), blob(), arrayBuffer(), formData(), redirect(), clone(), error()
    if (!options) { return await res.text() }
    else if ('application/json' === options.headers['Content-Type']) { return await res.json() }
    else if (options.headers['Content-Type'].match(/text\//)) { return await res.text() }
    else if (options.headers['Content-Type'].match(/(image|audio|video|)\//)) { return await res.blob() }
    else { return await res.text() }
}
ipcMain.handle('fetch', async(event, url, options)=>{
    console.log(url, options)
    const res = await fetch(url, options).catch(e=>console.error(e));
    return await returnMimeTypeData(url, options, res)
})
ipcMain.handle('decodeTxHex', async(event, txHex)=>{
    console.log('----- decodeTxHex start -----')
    console.log(txHex)
    const tx = bitcoin.Transaction.fromHex(txHex);
    console.log(tx)
    console.log('----- decodeTxHex end -----')
    return tx
})
function readWif(path) {
    const text = fs.readFileSync(path, { encoding: 'utf-8' })
    const lines = text.split('\n').map(l=>l.split('\t'));
    const header = lines.shift();
    return lines.map(l=>l[0]).filter(v=>v)
}
/*
function readTsv(path) {
    const text = fs.readFileSync(path, { encoding: 'utf-8' })
    const lines = text.split('\n').map(l=>l.split('\t'));
    const header = lines.shift();
    return lines.filter(v=>v).map( // 空行ができてしまう
        l => header.reduce(
            (a, c, i, s) => Object.assign(a, {[c]:l[i]}), {})
    );
}
*/
function getWifByAddress(address) {
    //const tsv = readTsv(`src/db/wif.tsv`)
    const wifs = readWif(`src/db/wif.tsv`)
    //console.log(tsv)
    //console.log(tsv.length)
    //for (const record of tsv) {
    for (const wif of wifs) {
        //console.log(record)
        //console.log(record.wif)
        // Invalid network version
        //const keyPair = bitcoin.ECPair.fromWIF(wif, network);
        //const keyPair = ECPair.fromWIF(record.wif, network);
        //const keyPair = ECPair.fromWIF(record.wif, network);
        //console.log(ECPair.fromWIF(Wif.encode(128, Buffer.from(ECPair.makeRandom().privateKey.toString('hex'), 'hex'), true), network))

        //const keyPair = ECPair.fromWIF(record.wif); // Invalid network version
        //const keyPair = ECPair.fromWIF(record.wif, coininfo('MONA'));
        //const keyPair = ECPair.fromWIF(record.wif, coininfo('MONA').toBitcore());
        //const keyPair = ECPair.fromWIF(record.wif, coininfo('MONA').toBitcoinJS());
        const keyPair = fromWif(wif)
        console.log(wif, keyPair)
        const obj = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });
        console.log(address)
        console.log(obj.address)
        if (obj.address === address) { return wif; }
    }
    console.log(`ウォレット内には指定されたアドレスが存在しません。`)
    throw new Error(`ウォレット内には指定されたアドレスが存在しません。`) 
}
function fromWif(wif) { // どの引数パターンで成功するかはアドレスを作成したライブラリなどによる？
    try { return ECPair.fromWIF(wif, coininfo('MONA').toBitcoinJS()) }
    catch(e) {
        try { return ECPair.fromWIF(wif, coininfo('MONA').toBitcore()) }
        catch(e) {
            try { return ECPair.fromWIF(wif, coininfo('MONA')) }
            catch(e) {
                try { return ECPair.fromWIF(wif) }
                catch(e) { throw e }
            }
        }
    }
}
//ipcMain.handle('signTx', async(event, tx, address)=>{
//ipcMain.handle('signTx', async(event, txHex, address)=>{
//ipcMain.handle('signTx', async(event, tx, address)=>{ // tx: create_sendの戻り値をデコードしたもの
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

