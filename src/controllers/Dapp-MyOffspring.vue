<template>
  <v-card>
    <v-card-title>
      <span class="headline"><img href="./images/myoffspring_logo.png"></span>
    </v-card-title>
    <v-card-text>
      <v-form>
        <v-text-field
          label="Full Name"
          v-model.trim="fullName"
          required
        ></v-text-field>
        <v-text-field
          label="Mother's Full Name"
          v-model.trim="motherFullName"
        ></v-text-field>
        <v-text-field
          label="Father's Full Name"
          v-model.trim="fatherFullName"
        ></v-text-field>
        <v-text-field
          label="Date of Birth (YYYYMMDD)"
          v-model.trim="dateOfBirth"
        ></v-text-field>
        <v-text-field
          label="Time of Birth (HH24mmss)"
          v-model.trim="timeOfBirth"
        ></v-text-field>
        <v-text-field
          label="Place of Birth (City, State, Country)"
          v-model.trim="placeOfBirth"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-text-field
          label="Gas Price (1e-8 HTML/gas)"
          v-model.trim="gasPrice"
          required
        ></v-text-field>
        <v-text-field
          label="Gas Limit"
          v-model.trim="gasLimit"
          required
        ></v-text-field>
        <v-text-field
          label="Fee"
          v-model.trim="fee"
          required
          ></v-text-field>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn class="success" dark @click="send" :disabled="notValid">{{ $t('common.confirm') }}</v-btn>
    </v-card-actions>
    <v-dialog v-model="confirmSendDialog" persistent max-width="50%">
      <v-card>
        <v-card-title>
          <span class="headline">
            {{ $t('send_to_contract.confirm') }}
          </span>
        </v-card-title>
        <v-card-text>
          <v-container grid-list-md>
            <v-layout wrap>
              <v-flex xs12>
                <v-text-field label="Raw Tx" v-model="rawTx" multi-line disabled></v-text-field>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="blue--text darken-1" flat @click="confirmSend" v-show="canSend && !sending">{{ $t('common.confirm') }}</v-btn>
          <v-btn class="red--text darken-1" flat @click.native="confirmSendDialog = false" :v-show="!sending">{{ $t('common.cancel') }}</v-btn>
          <v-progress-circular indeterminate :size="50" v-show="sending" class="primary--text"></v-progress-circular>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import webWallet from 'libs/web-wallet'
import abi from 'ethjs-abi'
import server from 'libs/server'

export default {
  data () {
    return {
      contractAddress: '',
      abi: '',
      parsedAbi: null,
      method: null,
      inputParams: [],
      gasPrice: '40',
      gasLimit: '2500000',
      fee: '0.01',
      confirmSendDialog: false,
      rawTx: 'loading...',
      canSend: false,
      sending: false
    }
  },
  computed: {
    notValid: function() {
      //@todo valid the address
      const gasPriceCheck = /^\d+\.?\d*$/.test(this.gasPrice) && this.gasPrice > 0
      const gasLimitCheck = /^\d+\.?\d*$/.test(this.gasLimit) && this.gasLimit > 0
      const feeCheck = /^\d+\.?\d*$/.test(this.fee) && this.fee > 0.0001
      return !(gasPriceCheck && gasLimitCheck && feeCheck && this.method !== null)
    }
  },
  watch: {
    method: function() {
      this.inputParams = []
    }
  },
  methods: {
    async send() {
      try {

	const abiJson = [{"constant": true, "inputs": [{"name": "hash", "type": "string"} ], "name": "getHeir", "outputs": [{"name": "result", "type": "string"}, {"name": "heirFullName", "type": "string"}, {"name": "motherFullName", "type": "string"}, {"name": "fatherFullName", "type": "string"}, {"name": "dateOfBirth", "type": "uint256"}, {"name": "timeOfBirth", "type": "uint256"}, {"name": "placeOfBirth", "type": "string"} ], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "hash", "type": "string"}, {"name": "heirFullName", "type": "string"}, {"name": "motherFullName", "type": "string"}, {"name": "fatherFullName", "type": "string"}, {"name": "dateOfBirth", "type": "uint256"}, {"name": "timeOfBirth", "type": "uint256"}, {"name": "placeOfBirth", "type": "string"} ], "name": "newHeir", "outputs": [{"name": "result", "type": "string"} ], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"payable": true, "stateMutability": "payable", "type": "fallback"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "hash", "type": "string"} ], "name": "heirEvent", "type": "event"} ]

        const encodedData = abi.encodeMethod(abiJson[1], ['a', this.fullName, this.motherFullName, this.fatherFullName, this.dateOfBirth, this.timeOfBirth, this.placeOfBirth]).substr(2)
        this.confirmSendDialog = true
        try {
          this.rawTx = await webWallet.getWallet().generateSendToContractTx(this.contractAddress, encodedData, this.gasLimit, this.gasPrice, this.fee)
        } catch (e) {
          this.$root.log.error('send_to_generate_tx_error', e.stack || e.toString() || e)
          alert(e.message || e)
          this.confirmSendDialog = false
          return false
        }
        this.canSend = true
      } catch (e) {
        this.$root.error('Params error')
        this.$root.log.error('send_to_contract_encode_abi_error', e.stack || e.toString() || e)
        this.confirmSendDialog = false
        return false
      }
    },

    async confirmSend() {
      this.sending = true
      try {
        const txId = await webWallet.getWallet().sendRawTx(this.rawTx)
        this.confirmSendDialog = false
        this.sending = false
        this.$root.success('Successful send. You can view at ' + server.currentNode().getTxExplorerUrl(txId))
        this.$emit('send')
      } catch (e) {
        alert(e.message || e)
        this.$root.log.error('send_to_contract_post_raw_tx_error', e.response || e.stack || e.toString() || e)
        this.confirmSendDialog = false
      }
    }
  }
}
</script>
