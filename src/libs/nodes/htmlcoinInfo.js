import axios from 'axios'
import config from 'libs/config'
// todo change apis to htmlcoin.info
let domain = ''
let insightDomain = ''
switch (config.getNetwork()) {
  case 'testnet':
    domain = 'https://info-testnet.htmlcoin.com'
    insightDomain = 'https://testnet-api.htmlcoin.com/'
    break
  case 'mainnet':
    domain = 'https://info.htmlcoin.com'
    insightDomain = 'https://explorer.htmlcoin.com'
    break
}
const apiPrefix = insightDomain + ''
const _get = async url => {
  return (await axios.get(apiPrefix + url)).data
}
const _post = async (url, data) => {
  return (await axios.post(apiPrefix + url, data)).data
}
export default {
  async getInfo(address) {
    return await _get(`/addr/${address}`)
  },
  async getHrc20(address) {
    return await _get(`/erc20/balances?balanceAddress=${address}`)
  },
  async getTokenInfo(contractAddress) {
    return await _get(`/hrc20/${contractAddress}`)
  },
  async getTxList(address) {
    return await _get(`/txs/?address=${address}`)
  },
  async getUtxoList(address) {
    return (await _get(`/addr/${address}/utxo`)).map(item => {
      return {
        address: item.address,
        txid: item.txid,
        confirmations: item.confirmations,
        isStake: item.isStake,
        amount: item.amount,
        value: item.satoshis,
        hash: item.txid,
        pos: item.vout
      }
    })
  },
  async sendRawTx(rawTx) {
    return (await (_post('/tx/send', { rawtx: rawTx }))).txid
  },
  async fetchRawTx(txid) {
    return (await _get(`/rawtx/${txid}`)).rawtx
  },
  getTxExplorerUrl(tx) {
    return `${domain}/tx/${tx}`
  },
  getAddrExplorerUrl(addr) {
    return `${domain}/address/${addr}`
  },
  async callContract(address, encodedData) {
    return (await _get(`/contracts/${address}/hash/${encodedData}/call`))['executionResult']['output']
  }
}
