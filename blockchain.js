/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoin = require('bitcoinjs-lib'); // v3.x.x
const bitcoinMessage = require('bitcoinjs-message');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
     initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({ data: 'Genesis Block' });
            //console.log('GENESIS BLOCK: ' + JSON.stringify(block));
            this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        let self = this;
        return new Promise((resolve) => {
            resolve(self.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't forget 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
       async _addBlock(block) {
        let self = this;

           return new Promise((resolve, reject) => {

               //Assign the block's timestamp
               block.time = new Date().getTime().toString().slice(0,-3);

               //Assign the block's height
               //self.getChainHeight().then(previousBlockHeight => {
               let previousBlockHeight = self.height;
               block.height = previousBlockHeight + 1;

               if (previousBlockHeight === -1) {//Genesis Block
                   block.previousBlockHash = null;
               } else {//Not Genesis Block
                   //self.getBlockByHeight(previousBlockHeight).then(b => {
                   let b = self.chain[previousBlockHeight];
                   block.previousBlockHash = b.hash;
               }
                   block.hash = SHA256(JSON.stringify(block)).toString();
                   console.log('\nAdding the new Block: \n' + JSON.stringify(block));

               if (self.chain.push(block)) {
                   self.height = self.height + 1
                   console.log('Block added successfully. ');
                   resolve(block);
               } else {
                   reject('Could not add the genesis block: ' + JSON.stringify(block));
               }
          });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submitting your Block.
     * The method returns a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            
           
            //Message Format: 
            //<WALLET_ADDRESS>:${new Date().getTime().toString().slice(0, -3)}:starRegistry
            var message = JSON.stringify(address) + ':'
                + new Date().getTime().toString().slice(0, -3) + ':'
                + 'starRegistry';
            //console.log(message);
            resolve(message);
            
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
     submitStar(address, message, digitalSignature, star) {
         let self = this;
         console.log('This is the message recieved by submitStar'
             + message);
        return new Promise((resolve, reject) => {

            //1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
            let messageTime = parseInt(message.split(':')[1]);
            console.log('The message time is: ' + messageTime);
            //2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            console.log('The current time is: ' + currentTime);

            //3. Check if the time elapsed is less than 5 minutes
            let elapsedTime = currentTime - messageTime;
            if (elapsedTime >= 3000) { // 5 minutes(or more) have passed already
                reject('Time Elapsed is less than 5 minutes. Star is rejected');
            } else {//Less than 5 minutes elapsed -> Proceed to wallet address verification
                let walletAddress = message.split(':')[0];
                let givenAddressStr = JSON.stringify(address); //for comparison with the address in the given message string
                console.log('The extracted wallet address is: ' + walletAddress);
                console.log('The given publicKey address is: ' + givenAddressStr);
                if (walletAddress != givenAddressStr) {//Incorrect Wallet Address
                    reject('Owner of the star is different from the given address');
                } else {//Correct Wallet Address 
                    //Verification of the signature  //Reciever
                    let publicKey = ec.keyFromPublic(address, 'hex');
                    if (publicKey.verify(message, digitalSignature)) {

                        //5. Create the block and add it to the chain
                        let b = new BlockClass.Block(message);
                        self._addBlock(b).then(block =>
                            //6. Resolve with the block added.
                            resolve(block)).catch(msg => {
                                console.log(msg);
                                reject(msg);
                            });

                    } else {
                        reject('Could not verify the signature!')
                    }
                }
            }
        
        
            
        });
       
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
           
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            //let block = self.chain[height];
            if (block) {
                console.log('FROM INSIDE GETBLOCKBYHEIGHT: FOUND THE BLOCK---------------' + JSON.stringify(block));
                resolve(block);
            } else {
                console.log('FROM INSIDE GETBLOCKBYHEIGHT: NO BLOCK WITH HEIGHT = '+height+' ---------------');

                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            
        });
    }

}

module.exports.Blockchain = Blockchain;

    let bc = new Blockchain();
/*

    let b1 = new BlockClass.Block('Block 1');
    bc._addBlock(b1);

    let b2 = new BlockClass.Block('Block 2');
     bc._addBlock(b2);

    let b3 = new BlockClass.Block('Block 3');
    bc._addBlock(b3);

    //bc.submitStar('87987676e8789f8766564d769708c09', 'Hi there!', '68655635e5890e98098796a8769709');
*/
//Testing Function: requestMessageOwnershipVerification(publicKey)
//Sender
var keyPair = ec.genKeyPair();
var publicKey = keyPair.getPublic();
bc.requestMessageOwnershipVerification(publicKey).then(msg => {
    console.log(msg);
    //Sign the test message
    let digitalSignature = keyPair.sign(msg);
    let star = 'star format for now';
    bc.submitStar(publicKey, msg, digitalSignature, star).then(b =>
        console.log('This block was added by submitStar: \n' + JSON.stringify(b))
        ).catch(msg=>console.log(msg));
}
);
