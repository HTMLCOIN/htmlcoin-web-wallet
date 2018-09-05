import insight from 'libs/nodes/insight'
import htmlcoinInfo from 'libs/nodes/htmlcoinInfo'

let nodeConfigs = {
  insight,
  htmlcoinInfo
  
}

const defaultNodeId = 'insight'
let currentNodeId = defaultNodeId

export default {
  currentNode() {
    return nodeConfigs[currentNodeId]
  },

  setNodeId(nodeId) {
    if (nodeConfigs[nodeId]) {
      currentNodeId = nodeId
    }
  }
}
