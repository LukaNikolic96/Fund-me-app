// razlika izmedju nodejs i frontend javascript
// u node js koristimo require()
// u javascript koristimo import

import { ethers } from "./ethers-5.7.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");

connectButton.onclick = connect; // kad se klikne na connect button ono poziva funkciju connect
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

async function connect() {
  /* proveravamo da li postojo metamask tako sto kucamo
    typeof (Tip sta zelimo da vidimo) i ako kad ukucamo window
    .etherium ne izadje undefined to znaci da onda postoji metamask
    i da izbaci I see a metamask u suprotnom izbaci no metamask (ovo je 
    vazilo dok nismo izbrisali console log i umesto toga stavili
    obavestenja koje se nalaze dole u kodu)*/
  if (typeof window.ethereum !== "undefined") {
    // konektujemo sajt s metamask
    await window.ethereum.request({ method: "eth_requestAccounts" });
    // obavestenje da je konektovano
    connectButton.innerHTML = "Connected!";
  } else {
    connectButton.innerHTML = "Please install metamask!";
  }
}

// fund function
async function getBalance() {
  if (typeof window.ethereum != "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    console.log(ethers.utils.formatEther(balance));
  }
}
async function fund() {
  const ethAmount = document.getElementById("ethAmount").value;
  console.log(`Funding with ${ethAmount}`);
  if (typeof window.ethereum !== "undefined") {
    // sta nam je sve potrebno
    // provider / connection to the blockchain
    /* provider linija koda funkcionise tako sto proverava nas metamask
    i kaze ah pronaso sam http  endpoint (window.ethereum) i to cemo da koristimo
    za naseg provajdera*/
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // singer / wallet / someone with some gas
    /* ova linija pokazuje koji provajder je konektovan na wallet provajder je metamask
    a account u ovom slucaju je account 1 */
    const signer = provider.getSigner();
    // contract that we are interactinh with
    // za contract nam treba ABI & Address
    /* stavljamo signem da contract konektujemo s nas signera */
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });
      // listen for the tx to be mined - ovo ce koristimo jer jos nismo ucili za eventi
      // listen for an event
      await listenForTransactionMine(transactionResponse, provider);
      console.log("Done!");
    } catch (error) {
      console.log(error);
    }
  }
}

function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}...`);
  // listen for this transaction to finish
  /* kako funkcionise - kad nadje taj transaction hash onda poziva
  transactionReceipt funkciju koja stavlja completed u consolu i onda
  je promise resolve tj obecanje je odrzano , mi joj kazemo da zavrsi funkciju
  tek kad transactionResponse nadje hash i onda se pojavljuje Done! u console log iznad
  uz pomoc await u kod iznad gde poziva listenForTransactionMine funkciju 
  kad dobije znak da je Promise izvrseno onda prelazi na narednu liniju
  sto je u ovom slucaju console.log("Done!)*/
  return new Promise((resolve, reject) => {
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations`
      );
      resolve();
    });
  });
}

// withdraw function

async function withdraw() {
  if (typeof window.ethereum != "undefined") {
    console.log("Withdrawing...");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.withdraw();
      await listenForTransactionMine(transactionResponse, provider);
    } catch (error) {
      console.log(error);
    }
  }
}
