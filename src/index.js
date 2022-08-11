const {
  createQueryClient,
  SifSigningStargateClient,
} = require("@sifchain/stargate");
const { request } = require("undici");
const chalk = require("chalk");
const {
  DirectSecp256k1HdWallet,
  EncodeObject,
  Registry,
} = require("@cosmjs/proto-signing");
const { Decimal } = require("@cosmjs/math");
const {
  lcd_endpoint,
  rpc_endpoint,
  sifvaloper,
  pool,
  seed,
} = require("../config.json");

console.log("\nDeveloped with ❤️  by kwak Ducksquaddd\n\n");

setInterval(async () => {
  const queryClients = await createQueryClient("https://rpc.sifchain.finance");
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(seed, {
    prefix: "sif",
  });
  const [firstAccount] = await wallet.getAccounts();
  const client = await SifSigningStargateClient.connectWithSigner(
    rpc_endpoint,
    wallet
  );
  let urewards = await getRewardsFor(firstAccount.address, sifvaloper);
  let rewards = unitRToRowan(urewards);

  const tokenEntries = await queryClients.tokenRegistry
    .entries({})
    .then((x) => x.registry?.entries);

  const rowan = tokenEntries?.find((x) => x.baseDenom === "rowan");
  const other_asset = tokenEntries?.find((x) => x.baseDenom === pool);
  urewards = BigInt(urewards) - 2000000000000000000n;
  let swapAmt = BigInt(urewards) / 2n;

  const swap = await client.simulateSwap(
    {
      denom: rowan.denom,
      amount: swapAmt,
    },
    { denom: other_asset.denom },
    0.05
  );

  const fee = {
    amount: [
      {
        denom: "rowan",
        amount: "2000000000000000000", // 0.1 ROWAN
      },
    ],
    gas: "280000", //
  };

  let messages = [];

  const claimRewardsMsg = {
    typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",

    value: {
      delegatorAddress: firstAccount.address,
      validatorAddress: sifvaloper,
    },
  };

  const swapMsg = {
    typeUrl: "/sifnode.clp.v1.MsgSwap",
    value: {
      signer: firstAccount.address,
      sentAsset: { symbol: rowan.denom.toString() },
      receivedAsset: { symbol: other_asset.denom.toString() },
      sentAmount: swapAmt.toString(),
      minReceivingAmount: Decimal.fromUserInput(
        swap.minimumReceiving.toString(),
        other_asset.decimals.toNumber()
      ).atomics,
    },
  };

  const addLiquidityMsg = {
    typeUrl: "/sifnode.clp.v1.MsgAddLiquidity",
    value: {
      signer: firstAccount.address,
      externalAsset: { symbol: other_asset.denom.toString() },
      nativeAssetAmount: swapAmt.toString(),
      externalAssetAmount: Decimal.fromUserInput(
        swap.minimumReceiving.toString(),
        other_asset.decimals.toNumber()
      ).atomics,
    },
  };

  messages.push(claimRewardsMsg, swapMsg, addLiquidityMsg);

  try {
    let tx = await client.signAndBroadcast(
      firstAccount.address,
      messages,
      fee,
      "Sifchain recompound to liquidity pool! Stake with kwak! https://wallet.keplr.app/chains/sifchain"
    );
    console.log(chalk.green(`Transaction hash: ${tx.transactionHash}`));
    console.log(chalk.green(`Rewards: ${rewards} ROWAN`));
    console.log(chalk.green(`Swap Amount: ${unitRToRowan(swapAmt)} ROWAN`));
    console.log(
      chalk.green(`Swap Recieve: ${swap.minimumReceiving.toString()} ${pool}`)
    );
  } catch (err) {
    console.log(err);
  }
}, 86400000);

function unitRToRowan(unit) {
  let uRowan = BigInt(unit);
  return parseInt(uRowan / 1000000000000n) / 1000000;
}

// Code grabbed from here: https://github.com/anothersoft/sifrecompound/blob/125bd651cf09070f098b1b1f92f9b9577c886a39/index.js#L95
async function getRewardsFor(delegator, validator) {
  let rewards = await (
    await request(
      lcd_endpoint +
        "/cosmos/distribution/v1beta1/delegators/" +
        delegator +
        "/rewards",
      { method: "GET", maxRedirections: 3 }
    )
  ).body.json();
  let reward = rewards.rewards.find(
    (reward) => reward.validator_address === validator
  );
  let rewardNum = 0n;

  if (reward && reward.reward && reward.reward[0] && reward.reward[0].amount) {
    rewardNum = BigInt(reward.reward[0].amount.split(".")[0]);
  }
  return rewardNum;
}
