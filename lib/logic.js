'use strict';
/**
 * Write your transction processor functions here
 */

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

/**
 * Close the bidding for product listing and choose the
 * highest bid that is over the asking price
 * @param {org.acme.product.auction.CloseBidding} closeBidding - the closeBidding transaction
 * @transaction
 */
function closeBidding(closeBidding) {
    var listing = closeBidding.listing;
    if (listing.state !== 'FOR_SALE') {
        throw new Error('Listing is not FOR SALE');
    }
    // by default we mark the listing as RESERVE_NOT_MET
    listing.state = 'RESERVE_NOT_MET';
    var highestOffer = null;
    var buyer = null;
    var seller = listing.product.owner;
    if (listing.offers && listing.offers.length > 0) {
        // sort the bids by bidPrice
        listing.offers.sort(function(a, b) {
            return (b.bidPrice - a.bidPrice);
        });
        highestOffer = listing.offers[0];
        if (highestOffer.bidPrice >= listing.reservePrice) {

            buyer = highestOffer.member;
            //seller = listing.owner;

            // update the balance of the seller
            seller.balance += highestOffer.bidPrice;
            // update the balance of the buyer
            buyer.balance -= highestOffer.bidPrice;
            // transfer the product to the buyer
            listing.product.owner = buyer;
            // Clear the offers
            //listing.offers = null;
            // mark the listing as SOLD
            listing.state = 'SOLD';
        }
    }
    listing.product.owner.products.push(listing.product);

    return getParticipantRegistry('org.acme.product.auction.Seller')
           .then(function(sellerRegistry) {
            // update seller
               return sellerRegistry.update(seller);
           })
           .then(function() {
               if(listing.state ==='SOLD'){
                   return getParticipantRegistry('org.acme.product.auction.Member')
                        .then(function(memberRegistry){
                            return memberRegistry.update(buyer);
                        });
               }
           })
           .then(function() {
               return getAssetRegistry('org.acme.product.auction.Product');
           })
           .then(function(productRegistry) {
               // remove the listing
               return productRegistry.update(listing.product);
           })
           .then(function() {
               return getAssetRegistry('org.acme.product.auction.ProductListing');
           })
           .then(function(productListingRegistry) {
               // remove the listing
               return productListingRegistry.update(listing);
           });
}

/**
 * Make an Offer for a ProductListing
 * @param {org.acme.product.auction.Offer} offer - the offer
 * @transaction
 */
function makeOffer(offer) {
    var listing = offer.listing;
    if (listing.state !== 'FOR_SALE') {
        throw new Error('Listing is not FOR SALE');
    }
    if(offer.bidPrice < listing.reservePrice){
        throw new Error('Bid amount less than reserve amount!!');
    }

    if(offer.member.balance < offer.bidPrice){
        throw new Error('Insufficient fund for bid. Please verify the placed bid!!');
    }

    return getAssetRegistry('org.acme.product.auction.ProductListing')
            .then(function(productListingRegistry) {
                // save the product listing
                listing.offers.push(offer);
                return productListingRegistry.update(listing);
            });
}


/**
 * Create a new listing
 * @param {org.acme.product.auction.StartBidding} publishListing - the listing transaction
 * @transaction
 */
function publishListing(listing) {
    listing.product.owner.products=listing.product.owner.products.filter(function(object){
        return object.getIdentifier()!==listing.product.getIdentifier();
    });

    return getAssetRegistry('org.acme.product.auction.ProductListing')
            .then(function (registry) {
                var factory = getFactory();
                // Create the bond asset.
                var productListing = factory.newResource('org.acme.product.auction', 'ProductListing',Math.random().toString(36).substring(3));
                productListing.reservePrice = listing.reservePrice;
                productListing.state='FOR_SALE';
                productListing.product=listing.product;
                productListing.offers = [];
                // Add the bond asset to the registry.
                return registry.add(productListing);
            })
            .then(function() {
                return getParticipantRegistry('org.acme.product.auction.Seller');
            })
            .then(function(sellerRegistry) {
                // save the buyer
                return sellerRegistry.update(listing.product.owner);
            });
}


/**
 * Add new Product
 * @param {org.acme.product.auction.AddProduct} addProduct - new product addition
 * @transaction
 */
function addProduct(newproduct) {
    var factory = getFactory();
    var product = factory.newResource('org.acme.product.auction', 'Product', Math.random().toString(36).substring(3));
    product.description = newproduct.description;
    product.owner=newproduct.owner;
    product.owner.products.push(product);
    return  getAssetRegistry('org.acme.product.auction.Product')
            .then(function (registry) {
                return registry.add(product);
            })
            .then(function () {
                return getParticipantRegistry('org.acme.product.auction.Seller');
            })
            .then(function(sellerRegistry) {
                return sellerRegistry.update(newproduct.owner);
            });

}
