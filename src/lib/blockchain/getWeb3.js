// import { MiniMeToken } from 'minimetoken';
import Web3 from 'web3';
// import ZeroClientProvider from './ZeroClientProvider';
import config from '../../configuration';
// import { takeActionAfterWalletUnlock, confirmBlockchainTransaction } from '../middleware';

// import ErrorPopup from '../../components/ErrorPopup';

// let givethWeb3;
let newWeb3;
/* ///////////// custom Web3 Functions ///////////// */

// const providerOpts = rpcUrl => {
//   const opts = { rpcUrl };

//   // TODO: this doesn't appear to work
//   // if rpcUrl is a Websocket url, set blockTrackerProvider
//   // so EthBlockTracker will use subscriptions for new blocks instead of polling
//   // if (rpcUrl && /^ws(s)?:\/\//i.test(rpcUrl)) {
//   // const p = new Web3.providers.WebsocketProvider(rpcUrl);
//   // p.sendAsync = p.send;
//   // opts.engineParams = { blockTrackerProvider: p };
//   // }

//   return opts;
// };

// const setWallet = (rpcUrl, isHomeNetwork = false) =>
//   function set(wallet) {
//     if (!wallet) throw new Error('a wallet is required');

//     const web3 = this;

//     const engine = new ZeroClientProvider(
//       Object.assign(providerOpts(rpcUrl), {
//         getAccounts: cb => cb(null, wallet.getAddresses()),
//         approveTransaction: (txParams, cb) => {
//           // TODO consolidate wallet unlock & tx confirmation if wallet is lock
//           // 2 popups are currently annoying

//           // TODO may need to call cb(null, false) if the user doesn't unlock their wallet
//           takeActionAfterWalletUnlock(wallet, () => {
//             // if we return false, the promise is rejected.
//             // confirmBlockchainTransaction(() => cb(null, true), () => cb(null, false));
//             confirmBlockchainTransaction(() => cb(null, true), () => {});
//           });
//         },
//         signTransaction: (txData, cb) => {
//           // provide chainId as GivethWallet.Account does not have a provider set. If we don't provide
//           // a chainId, the account will attempt to fetch it via the provider.
//           const getId = txData.chainId ? Promise.resolve(txData.chainId) : this.eth.net.getId;

//           // note: nonce & gasPrice are set by subproviders
//           getId()
//             .then(id => {
//               txData.chainId = id;
//               return wallet.signTransaction(txData);
//             })
//             .then(sig => {
//               cb(null, sig.rawTransaction);
//             })
//             .catch(err => {
//               cb(err);
//             });
//         },
//       }),
//     );

//     const minimeTokenCache = {};

//     const getBalance = () => {
//       const { tokenAddresses } = config;
//       const addr = wallet.getAddresses()[0];

//       const tokenBal = tAddr => {
//         if (!isHomeNetwork && tAddr) {
//           const token = minimeTokenCache[tAddr] || new MiniMeToken(web3, tAddr);
//           minimeTokenCache[tAddr] = token;
//           return token.balanceOf(addr).then(bal => ({
//             address: tAddr,
//             bal,
//           }));
//         }
//         return undefined;
//       };
//       const bal = () => (addr ? web3.eth.getBalance(addr) : undefined);

//       Promise.all([bal(), ...Object.values(tokenAddresses).map(a => tokenBal(a))])
//         .then(([balance, ...tokenBalances]) => {
//           if (isHomeNetwork) wallet.homeBalance = balance;
//           else {
//             wallet.balance = balance;
//             wallet.tokenBalances = tokenBalances.reduce((val, t) => {
//               val[t.address] = t.bal;
//               return val;
//             }, {});
//           }
//         })
//         .catch(err => {
//           ErrorPopup(
//             'Something went wrong with getting the balance. Please try again after refresh.',
//             err,
//           );
//         });
//     };

//     getBalance();

//     engine.setMaxListeners(50);
//     engine.on('block', getBalance);
//     this.setProvider(engine);
//   };

// export const getWeb3 = () =>
//   new Promise(resolve => {
//     if (!givethWeb3) {
//       givethWeb3 = new Web3(new ZeroClientProvider(providerOpts(config.foreignNodeConnection)));
//       givethWeb3.setWallet = setWallet(config.foreignNodeConnection);
//     }

//     resolve(givethWeb3);
//   });

let enablePromise;
function enable(force = false) {
  if (!force && enablePromise) return enablePromise;

  enablePromise = new Promise((resolve, reject) =>
    this.currentProvider
      .enable()
      .then(addrs => {
        this.isEnabled = true;
        resolve(addrs);
      })
      .catch(e => {
        enablePromise = false;
        this.isEnabled = false;
        reject(e);
      }),
  );

  return enablePromise;
}

export default () =>
  new Promise(resolve => {
    if (document.readyState !== 'complete') {
      // wait until complete
    }
    // only support inject web3 provider for home network
    if (!newWeb3) {
      if (window.ethereum) {
        newWeb3 = new Web3(window.ethereum);
        newWeb3.enable = enable.bind(newWeb3);
        // newWeb3.accountsEnabled = false;
      } else if (window.web3) {
        newWeb3 = new Web3(window.web3.currentProvider);
        newWeb3.enable = newWeb3.eth.getAccounts;
        newWeb3.accountsEnabled = true;
      } else {
        // we provide a fallback so we can generate/read data
        newWeb3 = new Web3(config.foreignNodeConnection);
        newWeb3.defaultNode = true;
      }
    }

    resolve(newWeb3);
  });
