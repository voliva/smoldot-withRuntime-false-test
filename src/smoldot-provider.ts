import { start } from "smoldot"
import chainSpec from "./westend-spec"
import { getSyncProvider } from "@polkadot-api/json-rpc-provider-proxy"
import { appendFileSync, existsSync, rmSync } from "fs"
import { getTickDate } from "./tick-date"

const WIRE_FILE = "wire-logs.txt"
const SMOLDOT_LOGS_FILE = "smoldot-logs.txt"

if (existsSync(WIRE_FILE)) rmSync(WIRE_FILE)
if (existsSync(SMOLDOT_LOGS_FILE)) rmSync(SMOLDOT_LOGS_FILE)

const appendWireLog = (message: string, isInput: boolean) => {
  const msg = `${getTickDate()}-${isInput ? "<<" : ">>"}-${message}\n`
  appendFileSync(WIRE_FILE, msg)
}

const appendSmlog = (level: number, target: string, message: string) => {
  appendFileSync(
    SMOLDOT_LOGS_FILE,
    `${getTickDate()} (${level})${target}\n${message}\n\n`,
  )
}

const smoldot = start({
  maxLogLevel: 9,
  logCallback: appendSmlog,
})

export default () =>
  getSyncProvider(async () => {
    const chain = await smoldot.addChain({ chainSpec })

    return (listener, onError) => {
      let listening = true

      ;(async () => {
        do {
          let message = ""
          try {
            message = await chain.nextJsonRpcResponse()
          } catch (e) {
            console.log(e)
            onError()
            return
          }
          if (!listening) break
          appendWireLog(message, true)
          listener(message)
        } while (listening)
      })()

      return {
        send(msg: string) {
          appendWireLog(msg, false)
          chain.sendJsonRpc(msg)
        },
        disconnect() {
          listening = false
          // chain.remove()
        },
      }
    }
  })
