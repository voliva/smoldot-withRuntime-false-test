import { createClient } from "@polkadot-api/substrate-client"
import smoldotProvider from "./smoldot-provider"

const client = createClient(smoldotProvider())
client.chainHead(
  false,
  (ev) => {
    console.log(ev)
  },
  (e) => {
    console.log("unexpected error", e)
    client.destroy()
  },
)
