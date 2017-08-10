/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const AdminConnection = require('composer-admin').AdminConnection;
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const path = require('path');
require('chai').should();
var expect = require('chai').expect
//require('chai').expect();
const bfs_fs = BrowserFS.BFSRequire('fs');
const NS = 'org.acme.product.auction';

describe('ProductAuction - AddProduct Test', () => {
  var businessNetworkConnection;
    before(function() {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        var adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type: 'embedded'
        })
        .then(function() {
            return adminConnection.connect('defaultProfile', 'admin', 'Xurw3yU9zI0l');
        })
        .then(function() {
            return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        })
        .then(function(businessNetworkDefinition) {
            return adminConnection.deploy(businessNetworkDefinition);
        })
        .then(function() {
            businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
            return businessNetworkConnection.connect('defaultProfile', 'product-auction', 'admin', 'Xurw3yU9zI0l');
        });
    });
    describe('#BiddingProcess', () => {
        it('Add the product to seller list', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
            // create the auctioneer
            const seller = factory.newResource(NS, 'Seller', 'daniel.selman@example.com');
            seller.organisation = 'XYZ Corp';
            seller.balance = 0;
            seller.products=[];
            // create product

            const product = factory.newTransaction(NS, 'AddProduct');
            product.description = 'My nice car';
            product.owner=factory.newRelationship(NS, 'Seller', seller.$identifier);
            // Get the asset registry.
            return businessNetworkConnection.getParticipantRegistry(NS + '.Seller')
                  .then((userRegistry) => {
                    // add the buyer and seller
                      return userRegistry.add(seller);
                  })
                  .then(() => {
                      // Submit the transaction for the product
                    return businessNetworkConnection.submitTransaction(product);
                  })
                  .then(() => {
                      return businessNetworkConnection.getParticipantRegistry(NS + '.Seller');
                  })
                  .then((userRegistry) => {
                      // add the buyer and seller
                      return userRegistry.get(seller.$identifier);
                  })
                  .then((seller) => {
                      // check the length of product list
                      //console.log(seller.products);
                      return seller.products.length.should.equal(1);
                  });
            });

            it('Authorized owner should start the bidding', function() {
                const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
                // create the auctioneer
                const sellerId = 'daniel.selman@example.com';
                var productid=null;

                // Get the asset registry.
                return businessNetworkConnection.getParticipantRegistry(NS + '.Seller')
                      .then((userRegistry) => {
                          return userRegistry.get(sellerId);
                      })
                      .then((seller) => {
                          // check the length of product list
                          productid=seller.products[0].getIdentifier();
                          return businessNetworkConnection.getAssetRegistry(NS + '.Product');
                      })
                      .then((productRegistry)=>{
                          return productRegistry.get(productid);
                      })
                      .then((prod)=>{
                        const listing = factory.newTransaction(NS, 'StartBidding');
                        listing.reservePrice=50;
                        //listing.owner=factory.newRelationship(NS, 'Seller', sellerId);
                        listing.product=factory.newRelationship(NS, 'Product', productid);
                        return businessNetworkConnection.submitTransaction(listing);
                      })
                      .then(() => {
                          return businessNetworkConnection.getAssetRegistry(NS + '.ProductListing');
                      })
                      .then((productListingRegistry)=>{
                          return productListingRegistry.getAll();
                      })
                      .then((productListing)=>{
                        return productListing.length.should.equal(1);
                      });
            });

            it('Members bid for the product', function() {
                const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
                  // create the buyer
                 const buyer = factory.newResource(NS, 'Member', 'sstone1@example.com');
                 buyer.firstName = 'Simon';
                 buyer.lastName = 'Stone';
                 buyer.balance = 100;
                 buyer.products=[];

                 // create another potential buyer
                 const buyer2 = factory.newResource(NS, 'Member', 'whitemat@example.com');
                 buyer2.firstName = 'Matthew';
                 buyer2.lastName = 'White';
                 buyer2.balance = 10000;
                 buyer2.products=[];
                 var productListingId=null;
                // Get the asset registry.
                return businessNetworkConnection.getAssetRegistry(NS + '.ProductListing')
                      .then((productListingRegistry)=>{
                          return productListingRegistry.getAll();
                      })
                      .then((productListing)=>{
                          //console.log(productListing);
                          productListingId = productListing[0].getIdentifier();
                      })
                      .then(() => {
                          return businessNetworkConnection.getParticipantRegistry(NS + '.Member');
                      })
                      .then((userRegistry) => {
                          // add the buyer and seller
                          return userRegistry.addAll([buyer,buyer2]);
                      })
                      .then(() => {
                        const offer = factory.newTransaction(NS, 'Offer');
                        offer.bidPrice=100;
                        offer.member=factory.newRelationship(NS, 'Member', buyer.$identifier);
                        offer.listing=factory.newRelationship(NS, 'ProductListing', productListingId);
                        return businessNetworkConnection.submitTransaction(offer);
                      })
                      .then(()=>{
                        const offer = factory.newTransaction(NS, 'Offer');
                        offer.bidPrice=1000;
                        offer.member=factory.newRelationship(NS, 'Member', buyer2.$identifier);
                        offer.listing=factory.newRelationship(NS, 'ProductListing', productListingId);
                        return businessNetworkConnection.submitTransaction(offer);
                      })
                      .then(()=>{
                         return businessNetworkConnection.getAssetRegistry(NS + '.ProductListing');
                      })
                      .then((productListingRegistry)=>{
                          return productListingRegistry.get(productListingId);
                      })
                      .then((productListing)=>{
                          productListing.offers.length.should.equal(2);
                      });
            });


            it('Close bid for the product', function() {
                const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
                //const sellerId = 'daniel.selman@example.com';
                const buyerID = 'whitemat@example.com';
                // Get the asset registry.
                var productId=null;
                return businessNetworkConnection.getAssetRegistry(NS + '.ProductListing')
                      .then((productListingRegistry)=>{
                          return productListingRegistry.getAll();
                      })
                      .then((productListing)=>{
                          //console.log(productListing);
                          productId= productListing[0].product.getIdentifier();
                          const offer = factory.newTransaction(NS, 'CloseBidding');
                          //offer.owner=factory.newRelationship(NS, 'Seller', sellerId);
                          offer.listing=factory.newRelationship(NS, 'ProductListing', productListing[0].getIdentifier());
                          return businessNetworkConnection.submitTransaction(offer);
                      })
                      .then(()=>{
                         return businessNetworkConnection.getAssetRegistry(NS + '.Product');
                      })
                      .then((productRegistry)=>{
                         return productRegistry.get(productId);
                      })
                      .then((productListing)=>{
                        //  console.log(productListing);
                         productListing.owner.$identifier.should.equal(buyerID);
                      });
            });
        });
});
