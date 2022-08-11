# Sifchain stake to liquidity pool compounder

This project is made for if you want to compound your staking rewards, but not lock them up for 21 days.<br>
The obvious solution is not staking them but you wont make any money based off those sitting rewards.<br>
So this project every 24 hours will claim your rewards, swap half to your pool of choice and liquidity pool them.<br>
Giving you peace of mind that you can claim those at any point while still making good money on the staking apr

# How to setup and run this project

1. First make sure you have Node and npm installed https://nodejs.org/en/ also make sure you also have git installed
2. run `git clone https://github.com/Kwak-Nodes/SifStakeToLpCompounder.git`
3. switch into the directory by `cd SifStakeToLpCompounder`
4. Install all the needed dependencies by running `npm i` and `npm i pm2 -g`
5. edit config.json
6. run `pm2 start index.js`

Keep in mind this can error depending how much rowan you are making while staking. Dont use this if you are not atleast making 50 rowan a day else you are prone to errors.

# How to edit config.json

- sifvaloper - Input your validator address here
- pool - Input the pool you want your rewards to end up. make sure eth based coins start with c (eg: cusdc) and ibc based coins start with u (eg: uscrt)
- seed - Input your seed phrase
