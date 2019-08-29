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
//const EC = require('elliptic').ec;
//const ec = new EC('secp256k1');


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
        if (this.height === -1) {
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
            //Date().getTime() returns the milliseconds since midnight January 1, 1970
            //toString().slice(0,-3) gets rid of the milliseconds counter
            //SO, The below statement returns the "seconds" since midnight January 1, 1970
            block.time = new Date().getTime().toString().slice(0, -3);

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
            //console.log('\nAdding the new Block: \n' + JSON.stringify(block));

            if (self.chain.push(block)) {
                self.height = self.height + 1
                console.log('Block added successfully. ');
                resolve(block);
            } else {
                reject('Could not add the block: ' + JSON.stringify(block));
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
            var message = `${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`;
            console.log('FROM requestMessageOwnershipVerification::: ' + message);
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
    submitStar(address, message, signature, star) {
        //Trying the code from Alex
        let self = this;
        return new Promise(async (resolve, reject) => { 
            //Validate time
            let msgTime = parseInt(message.split(':')[1]);
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            if ((msgTime + (5 * 60)) <= currentTime) {
                reject(new Error('Date expired.'));
            } else {

                //Validate signature
                try {
                    await bitcoinMessage.verify(message, address, signature);
                } catch (err) {
                    reject('Invalid signature.');
                }
                //Add block
                try {
                    let block = new BlockClass.Block({ owner: address, star: star });
                    let addedBlock = await self._addBlock(block);
                    resolve(addedBlock);
                } catch (err) {
                    reject('Could not add the star.');
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
        return new Promise((resolve) => {
            let block = self.chain.filter(p => p.hash === hash)[0];
            if (block) {
                //console.log('FROM INSIDE GETBLOCKBYHASH: FOUND THE BLOCK---------------' + JSON.stringify(block));
                resolve(block);
            } else {
                //console.log('FROM INSIDE GETBLOCKBYHASH: NO BLOCK WITH HASH = ' + hash + ' ---------------');

                resolve(null);
            }
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
                //console.log('FROM INSIDE GETBLOCKBYHEIGHT: FOUND THE BLOCK---------------' + JSON.stringify(block));
                resolve(block);
            } else {
                //console.log('FROM INSIDE GETBLOCKBYHEIGHT: NO BLOCK WITH HEIGHT = '+height+' ---------------');
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and belong to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded. 
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            //stars. = self.chain.filter(p => JSON.stringify(p.body).split(':')[0] == address)[0];
            //stars = blocks.body.split(':')[2];
            for (var i = 1; i <= self.height; i++) {//i starts from 1 to skip the genesis block
                self.chain[i].getBData().then(bi => {
                    //bi is the data from the ith block in the blockchain
                    //pki is the primary key(address) extracted from the ith block's data
                    let pki = bi.owner;
                    console.log('This is the PK extracted from block # '
                        + i + ':' + pki);
                    if (pki == address) {
                        console.log("\n\nFound a star matching the given address!\n\n")
                            //Extract the star information from the block's body 
                            //(Because each block contains only 1 star)
                        let si = bi.star;
                        console.log('The body for this block is: ' + si);
                        stars.push(si);
                    }
                }).catch(err => console.log('Error from getStarsByWalletAddress: ' + err));
            }
            console.log('The stars resulted from getStarsByWalletAddress: ' + stars);
            resolve(stars);
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
        let currentHash = null;
        let previousHash = null;
        return new Promise((resolve) => {
            //For each block in the chain:
            for (var i = 0; i < self.chain.length; i++) {
                //1. You should validate each block using`validateBlock`
                self.chain[i].validate().then().catch(x =>
                    errorLog.push('Block #' + i +
                        ' cannot be validated. Reason: Individual block validation failed...'));
                //2. Each Block should check the with the previousBlockHash
                currentHash = self.chain[i].previousBlockHash;
                if (currentHash !== previousHash) {
                    console.log('Block Number ' + i + ' cannot be validated, because:\n' +
                        currentHash + ' != ' + previousHash);
                    errorLog.push('Block #' + i +
                        'cannot be validated. Reason: Previous Hash not identical...\n');

                }
                previousHash = self.chain[i].hash;
            }
            resolve(errorLog);
        });
    }

}

module.exports.Blockchain = Blockchain;

/*
let bc = new Blockchain();

//START TEST==========================================================================================================

var keyPair = bitcoin.ECPair.fromWIF('5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss')
var privateKey = keyPair.privateKey
var address = 'bc1qluzh2029z4kljvfe3jsz9dk0rd4l6chyh3sdl3'
//var message = `${address} : B : C`
bc.requestMessageOwnershipVerification(address).then( message => {

    //THE FOLLOWING ARE COPIED FROM: 
    //https://github.com/bitcoinjs/bitcoinjs-message
    //var message = 'This is an example of a signed message.'

    var signature =  bitcoinMessage.sign(message, privateKey, keyPair.compressed)
    console.log(signature.toString('base64'))
    // => 'G9L5yLFjti0QTHhPyFrZCT1V/MMnBtXKmoiKDZ78NDBjERki6ZTQZdSMCtkgoNmp17By9ItJr8o7ChX0XxY91nk='

    //console.log(bitcoinMessage.verify(message, address, signature))
    // => true

    let star = '"star1" : {' +
        '"dec": "68° 52\' 56.9",' +
        '"ra": "16h 29m 1.0s",' +
        '"story": "Here is a star"' +
        '};';
    bc.submitStar(address, message, signature, star)
        .then(star => {
            console.log('submitStar returned successfully')
        })
        .catch(err => console.log(`submitStar failed due to the following error: ${err}`));
});
//END TEST==========================================================================================================

/*
//Testing function: getStarsByWalletAddress()
//First Add the stars using submitStar()
//var keyPair1 = ec.genKeyPair();
var publicKey = 'bc1qluzh2029z4kljvfe3jsz9dk0rd4l6chyh3sdl3';

var keyPair = bitcoin.ECPair.fromWIF('bc1qluzh2029z4kljvfe3jsz9dk0rd4l6chyh3sdl3');
console.log('Generated the pair from public key..');
bc.requestMessageOwnershipVerification(publicKey).then(msg1 => {
    console.log(JSON.stringify(msg1).toString());
        //Sign the test message
    var privateKey = keyPair.privateKey;
    var digitalSignature = bitcoinMessage.sign(msg1, privateKey, keyPair.compressed);
        //let digitalSignature = keyPair.sign(msg1);
        let star1 = '"star1" : {' +
            '"dec": "68° 52\' 56.9",' +
            '"ra": "16h 29m 1.0s",' +
            '"story": "Here is a star"' +
            '};';
        let star2 = '"star2" : {' +
            '"dec": "68° 52\' 56.9",' +
            '"ra": "16h 29m 1.0s",' +
            '"story": "Here is another Star"' +
            '};';
        let star3 = '"star3" : {' +
            '"dec": "68° 52\' 56.9",' +
            '"ra": "16h 29m 1.0s",' +
            '"story": "Here is yet another Star"' +
        '};';


        bc.submitStar(publicKey, msg1, digitalSignature, star1).then(b1 => {
            //console.log('This block was added by submitStar: \n' + JSON.stringify(b1));


            bc.submitStar(publicKey, msg1, digitalSignature, star2).then(b1 => {
                bc.submitStar(publicKey, msg1, digitalSignature, star3).then(b1 => {

                    //All stars are added,
                    //Now Test the function getStarsByWalletAddress
                    bc.getStarsByWalletAddress(publicKey).then(a1 => {
                        console.log('The stars submitted by the owner: \n'
                            + JSON.stringify(publicKey) + '  are: ' + a1);

                        //Validate the chain after adding the blocks to it
                        //Basically checks the hash of each block is correct(i.e. the hash was not tampered)
                        //Also, check the previous hash is identical to the hash of the previous block
                        //bc.validateChain().then(errors => {
                        //    console.log('\n\nThe Error Log from validate chain:\n' + errors)
                        //});
                    });
                });
            });
        }
        ).catch(msg => console.log(msg));
});



//*/

/*
//Testing function: _addBlock(data) and getBlockByHash
let hash = null; //will be used to test the function getBlockByHash(hash)

let b1 = new BlockClass.Block('Block 1');
bc._addBlock(b1).then(b => {
    hash = b.hash;
    console.log('set the hash value');
    let b2 = new BlockClass.Block('Block 2');
    bc._addBlock(b2).then(x => {
        let b3 = new BlockClass.Block('Block 3');
        bc._addBlock(b3).then(y => {
            bc.getBlockByHash(hash).then(z => console.log(JSON.stringify(z)))
                .catch(msg => console.log(msg));
        });


    });


});


//*/
/*
//Testing Functions: requestMessageOwnershipVerification(publicKey) and submitStar(...)
//Sender
var keyPair = ec.genKeyPair();
var publicKey = keyPair.getPublic();
bc.requestMessageOwnershipVerification(publicKey).then(msg => {
    console.log(msg);
    //Sign the test message
    let digitalSignature = keyPair.sign(msg);
    let star = '"star" : {' +
        '"dec": "68° 52\' 56.9",' +
        '"ra": "16h 29m 1.0s",' +
        '"story": "Testing the story 4"' +
        '};';
    bc.submitStar(publicKey, msg, digitalSignature, star).then(b =>
        console.log('This block was added by submitStar: \n' + JSON.stringify(b))
        ).catch(msg=>console.log(msg));
}
);
*/

/*
//Experimenting with Date and Time
//Returns the milliseconds since midnight January 1, 1970
console.log(new Date().getTime().toString().slice(0,-3))
*/