# Bidding Platform

This is an interactive, distributed, product auction demo. List assets for sale (setting a reserve price), and watch as assets that have met their reserve price are automatically transferred to the highest bidder at the end of the auction.

This business network defines:

**Participants:**
`Member` `Seller`

**Assets:**
`Product` `ProductListing`

**Transactions:**
`AddProduct` `StartBidding` `Offer` `CloseBidding`

The `addProduct` function is called when an `AddProduct` transaction is submitted. The logic allows a seller to create a product asset and update its registry.

The `publishListing` function is called when a `StartBidding` transaction is submitted by the owner of product. The logic allows a seller to create a smart contract in the form of product listing for their product with a reserve bid.

The `makeOffer` function is called when an `Offer` transaction is submitted. The logic simply checks that the listing for the offer is still for sale, and then adds the offer to the listing, and then updates the offers in the `ProductListing` asset registry.

The `closeBidding` function is called when a `CloseBidding` transaction is submitted for processing. The logic checks that the listing is still for sale, sorts the offers by bid price, and then if the reserve has been met, transfers the ownership of the product associated with the listing to the highest bidder. Money is transferred from the buyer's account to the seller's account, and then all the modified assets are updated in their respective registries.

### Prerequisites and setup:

* [Docker](https://www.docker.com/products/overview) - v1.12 or higher
* [Docker Compose](https://docs.docker.com/compose/overview/) - v1.8 or higher
* [Git client](https://git-scm.com/downloads) - needed for clone commands
* [Node.js & npm](https://nodejs.org/en/download/) - node v6.2.0 - v6.10.0 (v7+ not supported); npm comes with your node installation.
*  git - 2.9.x
*  Python - 2.7.x

### Generate the Business Network Archive

To check that the structure of the files is valid, you can now generate a Business Network Archive (BNA) file for your business network definition. The BNA file is the deployable unit -- a file that can be deployed to the Composer runtime for execution.

Use the following command to generate the network archive:
```bash
npm install
```
You should see the following output:
```bash
> mkdirp ./dist && composer archive create --sourceType dir --sourceName . -a ./dist/product-auction.bna

Creating Business Network Archive

Looking for package.json of Business Network Definition
	Input directory: /Users/ishan/Documents/git-demo/BlockchainBalanceTransfer-CompositeJourney

Found:
	Description: Sample product auction network
	Name: product-auction
	Identifier: product-auction@0.0.1

Written Business Network Definition Archive file to
	Output file: ./dist/product-auction.bna

Command succeeded
```
The `composer archive create` command has created a file called `product-auction.bna` in the `dist` folder.

You can test the business network definition against the embedded runtime that stores the state of 'the blockchain' in-memory in a Node.js process. This embedded runtime is very useful for unit testing, as it allows you to focus on testing the business logic rather than configuring an entire Fabric.
From your project working directory (product-auction), open the file test/productAuction.js and run the following command:
```
npm test
```
You should see the following output : 
```
> product-auction@0.0.1 test /Users/ishan/Documents/git-demo/BlockchainBalanceTransfer-CompositeJourney
> mocha --recursive

  ProductAuction - AddProduct Test
    #BiddingProcess
      ✓ Add the product to seller list (119ms)
      ✓ Authorized owner should start the bidding (90ms)
      ✓ Members bid for the product (127ms)
      ✓ Close bid for the product (53ms)


  4 passing (2s)
```
### Deploy the Business Network Archive

#### Deploy using Composer Playground
Open [Composer Playground](http://composer-playground.mybluemix.net/), by default the Basic Sample Network is imported.
If you have previously used Playground, be sure to clear your browser local storage by running `localStorage.clear()` in your browser Console. Now import the `product-auction.bna` file and click on deploy button.

>You can also setup [Composer Playground locally](https://hyperledger.github.io/composer/installing/using-playground-locally.html).

To test this Business Network Definition in the **Test** tab:

In the `Seller` participant registry, create a new participant.

```
{
  "$class": "org.acme.product.auction.Seller",
  "organisation": "ACME",
  "email": "auction@acme.org",
  "balance": 237.508,
  "products": []
}
```

In the `Member` participant registry, create two participants.

```
{
  "$class": "org.acme.product.auction.Member",
  "firstName": "Amy",
  "lastName": "Williams",
  "email": "memberA@acme.org",
  "balance": 1000,
  "products": []
}
```

```
{
  "$class": "org.acme.product.auction.Member",
  "firstName": "Billy",
  "lastName": "Thompson",
  "email": "memberB@acme.org",
  "balance": 1000,
  "products": []
}
```

Now click on `Submit Transaction` and select `AddProduct` transaction from the dropdown, to create a product for the seller.
```
{
  "$class": "org.acme.product.auction.AddProduct",
  "description": "Sample Product",
  "owner": "resource:org.acme.product.auction.Seller#auction@acme.org"
}
```
You can verify the transaction by checking the product and seller registry.

To create a product listing for the above product, copy the `ProductID`. Then submit `StartBidding` transaction.
```
{
  "$class": "org.acme.product.auction.StartBidding",
  "reservePrice": 200,
  "product": "resource:org.acme.product.auction.Product#<ProductID>",
  "owner": "resource:org.acme.product.auction.Seller#auction@acme.org"
}
```
You've just listed `Sample Product` for auction, with a reserve price of 200!
A listing has been created in `ProductListing` registry for the product with `FOR_SALE` state.

Now Member participants can submit `Offer` transactions to bid on a product listing.

Submit an `Offer` transaction, by submitting a transaction and selecting `Offer` from the dropdown.

> `ListingID` is the id of the listing copied from the `ProductListing` registry.

```
{
  "$class": "org.acme.product.auction.Offer",
  "bidPrice": 300,
  "listing": "resource:org.acme.product.auction.ProductListing#<ListingID>",
  "member": "resource:org.acme.product.auction.Member#memberA@acme.org"
}
```

```
{
  "$class": "org.acme.product.auction.Offer",
  "bidPrice": 500,
  "listing": "resource:org.acme.product.auction.ProductListing#<ListingID>",
  "member": "resource:org.acme.product.auction.Member#memberB@acme.org"
}
```
You can check the `ProductListing` registry, to view all the bids for the product.

To end the auction submit a `CloseBidding` transaction for the listing.

```
{
  "$class": "org.acme.vehicle.auction.CloseBidding",
  "listing": "resource:org.acme.product.auction.ProductListing#<ListingID>",
  "owner": "resource:org.acme.product.auction.Seller#auction@acme.org"
}
```

This simply indicates that the auction for `ListingID` is now closed, triggering the `closeBidding` function that was described above.

To see the Product was sold you need to click on the `ProductListing` asset registry to check the owner of the product. The highest bid is placed by owner `memberB@acme.org` so you should see the owner of the product is now `memberB@acme.org`.

If you check the state of the ProductListing with `ListingID` is `SOLD`.

If you click on the `Member` asset registry you can check the balance of each User. You should see that the balance of the buyer `memberB@acme.org` has been debited by `500`, whilst the balance of the seller `auction@acme.org` has been credited with `500`. Also the product list of the buyer `memberB@acme.org` is updated.

#### Develop on Hyperledger Composer running locally

#### a) Installing Hyperledger Composer development tools

* The `composer-cli` contains all the command line operations for developing business networks. To install `composer-cli` run the following command:
```
npm install -g composer-cli
```

* The `generator-hyperledger-composer` is a Yeoman plugin that creates bespoke applications for your business network. To install `generator-hyperledger-composer` run the following command:
```
npm install -g generator-hyperledger-composer
```

* The `composer-rest-server` uses the Hyperledger Composer LoopBack Connector to connect to a business network, extract the models and then present a page containing the REST APIs that have been generated for the model. To install `composer-rest-server` run the following command:
```
npm install -g composer-rest-server
```

* `Yeoman` is a tool for generating applications. When combined with the `generator-hyperledger-composer` component, it can interpret business networks and generate applications based on them. To install `Yeoman` run the following command:
```
npm install -g yo
```

#### b) Starting Hyperledger Fabric
You can either setup your own network by following the [instructions](https://github.com/IBM/BlockchainNetwork-CompositeJourney#build-your-first-network-byfn) or use the already configured network using `couchdb` for storing the transactions with the help of following commands:
```
cd fabric-tools
./downloadFabric.sh
./startFabric.sh
./createComposerProfile.sh
```  
 You end of your development session using:
 ```
./stopFabric.sh
./teardownFabric.sh
 ```

#### c)Deploy to the running Hyperledger Fabric

Change directory to the `dist` folder containing `product-auction.bna` file and type:
```
cd dist
composer network deploy -a product-auction.bna -p hlfv1 -i PeerAdmin -s <randomString>
```

After sometime time business netwokr should be deployed to the local Hyperledger Fabric. You should see the output as follows:
```
Deploying business network from archive: product-auction.bna
Business network definition:
	Identifier: product-auction@0.0.1
	Description: Sample product auction network

✔ Deploying business network definition. This may take a minute...


Command succeeded
```

You can verify that the network has been deployed by typing:
```
composer network ping -n product-auction -p hlfv1 -i admin -s adminpw
```

#### d) Generate REST API

To integrate with the deployed business network (creating assets/participants and submitting transactions) we can either use the Composer Node SDK or we can generate a REST API.
To create the REST API we need to launch the `composer-rest-server` and tell it how to connect to our deployed business network.
Now launch the server by changing directory to the product-auction folder and type:
```bash
cd ..
composer-rest-server
```

Answer the questions posed at startup. These allow the composer-rest-server to connect to Hyperledger Fabric and configure how the REST API is generated.
```
  _   _                                 _              _                                  ____                                                         
 | | | |  _   _   _ __     ___   _ __  | |   ___    __| |   __ _    ___   _ __           / ___|   ___    _ __ ___    _ __     ___    ___    ___   _ __
 | |_| | | | | | | '_ \   / _ \ | '__| | |  / _ \  / _` |  / _` |  / _ \ | '__|  _____  | |      / _ \  | '_ ` _ \  | '_ \   / _ \  / __|  / _ \ | '__|
 |  _  | | |_| | | |_) | |  __/ | |    | | |  __/ | (_| | | (_| | |  __/ | |    |_____| | |___  | (_) | | | | | | | | |_) | | (_) | \__ \ |  __/ | |   
 |_| |_|  \__, | | .__/   \___| |_|    |_|  \___|  \__,_|  \__, |  \___| |_|             \____|  \___/  |_| |_| |_| | .__/   \___/  |___/  \___| |_|   
          |___/  |_|                                       |___/                                                    |_|                                
? Enter your Fabric Connection Profile Name: hlfv1
? Enter your Business Network Identifier : product-auction
? Enter your Fabric username : admin
? Enter your secret: adminpw
? Specify if you want namespaces in the generated REST API: never use namespaces
? Specify if you want the generated REST API to be secured: No

To restart the REST server using the same options, issue the following command:
   composer-rest-server -p hlfv1 -n product-auction -i admin -s adminpw -N never

Discovering types from business network definition ...
Discovered types from business network definition
Generating schemas for all types in business network definition ...
Generated schemas for all types in business network definition
Adding schemas for all types to Loopback ...
Swagger: skipping unknown type "Offer".
Swagger: skipping unknown type "Offer".
Swagger: skipping unknown type "Offer".
Added schemas for all types to Loopback
Web server listening at: http://localhost:3000
Browse your REST API at http://localhost:3000/explorer
```
**Test REST API**
If the composer-rest-server started successfully you should see these two lines are output:
```
Web server listening at: http://localhost:3000
Browse your REST API at http://localhost:3000/explorer
```

Open a web browser and navigate to http://localhost:3000/explorer

You should see the LoopBack API Explorer, allowing you to inspect and test the generated REST API. Follow the instructions to test Business Network Definition as mentioned above in the composer section.


## Additional Resources
* [Hyperledger Fabric Docs](http://hyperledger-fabric.readthedocs.io/en/latest/)
* [Hyperledger Composer Docs](https://hyperledger.github.io/composer/introduction/introduction.html)

## License
[Apache 2.0](LICENSE)
