import { ed25519 } from "@noble/curves/ed25519"
import { Struct, Vector, str, u8 } from "@polkadot-api/substrate-bindings"
import { UserSignedExtensions, getTxCreator } from "@polkadot-api/tx-helper"
import { fromHex, toHex } from "@polkadot-api/utils"
import smoldotProvider from "./smoldot-provider"

const priv = fromHex(
  "0xb18290bac66576e4067e0c47eb23b2eb40dc2a5906fe9af94063dc163367a1f0",
)

// https://westend.subscan.io/account/5GBkn4bHdJgbfjCKCpWvo5dNDa7FhEjGZiPtRX9ZzNAzMrz2
const from = ed25519.getPublicKey(priv)

const txCreator = getTxCreator(
  smoldotProvider(),
  ({ userSingedExtensionsName }, callback) => {
    const userSignedExtensionsData = Object.fromEntries(
      userSingedExtensionsName.map((x) => {
        if (x === "CheckMortality") {
          const result: UserSignedExtensions["CheckMortality"] = {
            mortal: false,
          }
          return [x, result]
        }

        if (x === "ChargeTransactionPayment") return [x, 0n]
        return [x, { tip: 0n }]
      }),
    )

    callback({
      userSignedExtensionsData,
      overrides: {},
      signingType: "Ed25519",
      signer: async (value) => ed25519.sign(value, priv),
    })
  },
)

const callCodec = Struct({
  module: u8,
  method: u8,
  calls: Vector(
    Struct({
      module: u8,
      method: u8,
      remark: str,
    }),
  ),
})

export async function getTx(nBytesTarget = 64_000_000) {
  const nCalls = Math.floor(nBytesTarget / 100)
  const remark =
    "This is a test is just a test... Trying to get 98 bytes out of this. So, we need a bit more text"

  const callData = callCodec.enc({
    module: 16,
    method: 2,
    calls: Array(nCalls)
      .fill(null)
      .map(() => ({
        module: 0,
        method: 7,
        remark,
      })),
  })

  return toHex(await txCreator.createTx(from, callData))
}
