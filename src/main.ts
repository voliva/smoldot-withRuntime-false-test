import { createClient } from "@polkadot-api/substrate-client"
import smoldotProvider from "./smoldot-provider"
import { getTx } from "./get-tx"

console.log("creating transaction")

const tx = await getTx(1_500_000)
// const tx = await getTx()

console.log("transaction created, sending it...")

const client = createClient(smoldotProvider())
client.transaction(
  tx,
  (e) => {
    switch (e.type) {
      case "validated": {
        console.log("validated")
        break
      }
      case "broadcasted": {
        console.log("broadcasted", e.numPeers)
        break
      }
      case "bestChainBlockIncluded": {
        console.log("bestChainBlockIncluded", e.block)
        break
      }
      case "finalized": {
        console.log("finalized", e.block)
        client.destroy()
        break
      }
      case "invalid": {
        console.log("invalid tx")
        client.destroy()
        break
      }
      case "dropped": {
        console.log("dropped")
        client.destroy()
        break
      }
      case "error": {
        console.log("error", e.error)
        client.destroy()
        break
      }
    }
  },
  (e) => {
    console.log("unexpected error", e)
    client.destroy()
  },
)
