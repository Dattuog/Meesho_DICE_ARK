class CreditCalculationService {
  constructor() {
    // Cost factors for different return scenarios (in percentage of product price)
    this.costFactors = {
      reverseLogistics: {
        // Based on product category and distance
        fashion: { base: 8, distanceMultiplier: 0.5 }, // 8% + 0.5% per 100km
        electronics: { base: 12, distanceMultiplier: 0.8 },
        homeKitchen: { base: 10, distanceMultiplier: 0.6 },
        beauty: { base: 6, distanceMultiplier: 0.4 },
        default: { base: 9, distanceMultiplier: 0.6 }
      },
      warehouseProcessing: {
        // Quality check, repackaging, storage costs
        fashion: 4.5,
        electronics: 8.0,
        homeKitchen: 6.0,
        beauty: 3.5,
        default: 5.5
      },
      productWriteOff: {
        // Risk of product becoming unsellable
        fashion: 15, // Higher due to trends/seasons
        electronics: 25, // Higher due to tech obsolescence
        homeKitchen: 12,
        beauty: 18, // Expiry dates
        default: 16
      },
      qualityDegradation: {
        // Reduced resale value
        fashion: 20,
        electronics: 30,
        homeKitchen: 15,
        beauty: 25,
        default: 22
      }
    };

    // Credit percentage configurations
    this.creditConfig = {
      buyerCreditPercentage: 60, // 60% of avoided costs go to buyer
      maxCreditPercentage: 35, // Max 35% of product price as credit
      minCreditAmount: 25, // Minimum ₹25 credit
      maxCreditAmount: 2000 // Maximum ₹2000 credit
    };

    // Cost sharing between seller and Meesho
    this.costSharingConfig = {
      seller: 65, // Seller bears 65% of credit cost
      meesho: 35  // Meesho bears 35% of credit cost
    };
  }

  /**
   * Calculate instant partial credit for NGO donation
   * @param {Object} product - Product details
   * @param {Object} orderDetails - Order information
   * @param {string} returnReason - Reason for return
   * @returns {Object} Credit calculation details
   */
  calculateInstantCredit(product, orderDetails, returnReason = 'ngo_donation') {
    try {
      const productPrice = parseFloat(product.price);
      const category = this.getCategoryKey(product.category);
      const distanceKm = this.calculateDistance(orderDetails.deliveryAddress, orderDetails.sellerLocation);
      
      // Calculate avoided costs
      const avoidedCosts = this.calculateAvoidedCosts(productPrice, category, distanceKm, returnReason);
      
      // Calculate buyer credit (percentage of avoided costs)
      const rawBuyerCredit = (avoidedCosts.total * this.creditConfig.buyerCreditPercentage) / 100;
      
      // Apply credit limits
      const cappedCredit = Math.min(
        rawBuyerCredit,
        (productPrice * this.creditConfig.maxCreditPercentage) / 100,
        this.creditConfig.maxCreditAmount
      );
      
      const finalBuyerCredit = Math.max(cappedCredit, this.creditConfig.minCreditAmount);
      
      // Calculate cost sharing
      const costSharing = this.calculateCostSharing(finalBuyerCredit);
      
      // Calculate seller savings vs traditional return
      const traditionalReturnCost = avoidedCosts.total;
      const sellerNetCost = costSharing.sellerAmount;
      const sellerSavings = traditionalReturnCost - sellerNetCost;
      
      return {
        success: true,
        creditDetails: {
          buyerCredit: Math.round(finalBuyerCredit * 100) / 100,
          avoidedCosts: {
            ...avoidedCosts,
            total: Math.round(avoidedCosts.total * 100) / 100
          },
          costSharing: {
            ...costSharing,
            sellerAmount: Math.round(costSharing.sellerAmount * 100) / 100,
            meeshoAmount: Math.round(costSharing.meeshoAmount * 100) / 100
          },
          sellerBenefit: {
            traditionalCost: Math.round(traditionalReturnCost * 100) / 100,
            ngoPathCost: Math.round(sellerNetCost * 100) / 100,
            savings: Math.round(sellerSavings * 100) / 100,
            savingsPercentage: Math.round((sellerSavings / traditionalReturnCost) * 100)
          },
          metadata: {
            productPrice,
            category,
            distanceKm,
            returnReason,
            calculatedAt: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      console.error('Credit calculation error:', error);
      return {
        success: false,
        error: 'Failed to calculate credit',
        message: error.message
      };
    }
  }

  /**
   * Calculate avoided costs for different return scenarios
   */
  calculateAvoidedCosts(productPrice, category, distanceKm, returnReason) {
    const factors = this.costFactors;
    
    // Reverse logistics cost
    const reverseLogistics = factors.reverseLogistics[category] || factors.reverseLogistics.default;
    const logisticsCost = (productPrice * reverseLogistics.base / 100) + 
                         (productPrice * reverseLogistics.distanceMultiplier * Math.ceil(distanceKm / 100) / 100);
    
    // Warehouse processing cost
    const processingRate = factors.warehouseProcessing[category] || factors.warehouseProcessing.default;
    const processingCost = productPrice * processingRate / 100;
    
    // Product write-off risk
    const writeOffRate = factors.productWriteOff[category] || factors.productWriteOff.default;
    const writeOffCost = productPrice * writeOffRate / 100;
    
    // Quality degradation cost
    const degradationRate = factors.qualityDegradation[category] || factors.qualityDegradation.default;
    const degradationCost = productPrice * degradationRate / 100;
    
    const totalAvoidedCosts = logisticsCost + processingCost + writeOffCost + degradationCost;
    
    return {
      reverseLogistics: Math.round(logisticsCost * 100) / 100,
      warehouseProcessing: Math.round(processingCost * 100) / 100,
      productWriteOff: Math.round(writeOffCost * 100) / 100,
      qualityDegradation: Math.round(degradationCost * 100) / 100,
      total: Math.round(totalAvoidedCosts * 100) / 100
    };
  }

  /**
   * Calculate cost sharing between seller and Meesho
   */
  calculateCostSharing(totalCredit) {
    const sellerAmount = (totalCredit * this.costSharingConfig.seller) / 100;
    const meeshoAmount = (totalCredit * this.costSharingConfig.meesho) / 100;
    
    return {
      total: totalCredit,
      sellerAmount,
      meeshoAmount,
      sellerPercentage: this.costSharingConfig.seller,
      meeshoPercentage: this.costSharingConfig.meesho
    };
  }

  /**
   * Get category key for cost calculations
   */
  getCategoryKey(category) {
    if (!category) return 'default';
    
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('fashion') || categoryLower.includes('clothing') || categoryLower.includes('apparel')) {
      return 'fashion';
    } else if (categoryLower.includes('electronics') || categoryLower.includes('mobile') || categoryLower.includes('laptop')) {
      return 'electronics';
    } else if (categoryLower.includes('home') || categoryLower.includes('kitchen') || categoryLower.includes('furniture')) {
      return 'homeKitchen';
    } else if (categoryLower.includes('beauty') || categoryLower.includes('cosmetics') || categoryLower.includes('skincare')) {
      return 'beauty';
    }
    
    return 'default';
  }

  /**
   * Calculate distance between two locations (simplified)
   */
  calculateDistance(address1, address2) {
    // Simplified distance calculation - in real implementation, use proper geolocation
    if (!address1 || !address2) return 500; // Default 500km
    
    // Extract cities and estimate distance
    const city1 = this.extractCity(address1);
    const city2 = this.extractCity(address2);
    
    // Simplified city distance mapping
    const cityDistances = {
      'bangalore-mumbai': 980,
      'bangalore-delhi': 2150,
      'mumbai-delhi': 1400,
      'bangalore-chennai': 350,
      'mumbai-pune': 150,
      'delhi-gurgaon': 30,
      'bangalore-hyderabad': 570,
      'same-city': 50
    };
    
    if (city1 === city2) return cityDistances['same-city'];
    
    const distanceKey = [city1, city2].sort().join('-');
    return cityDistances[distanceKey] || 750; // Default 750km for unknown routes
  }

  /**
   * Extract city from address (simplified)
   */
  extractCity(address) {
    if (!address) return 'unknown';
    
    const addressLower = address.toLowerCase();
    
    if (addressLower.includes('bangalore') || addressLower.includes('bengaluru')) return 'bangalore';
    if (addressLower.includes('mumbai')) return 'mumbai';
    if (addressLower.includes('delhi')) return 'delhi';
    if (addressLower.includes('chennai')) return 'chennai';
    if (addressLower.includes('pune')) return 'pune';
    if (addressLower.includes('hyderabad')) return 'hyderabad';
    if (addressLower.includes('gurgaon')) return 'gurgaon';
    
    return 'unknown';
  }

  /**
   * Update cost factors (for admin configuration)
   */
  updateCostFactors(newFactors) {
    this.costFactors = { ...this.costFactors, ...newFactors };
  }

  /**
   * Update credit configuration
   */
  updateCreditConfig(newConfig) {
    this.creditConfig = { ...this.creditConfig, ...newConfig };
  }

  /**
   * Update cost sharing configuration
   */
  updateCostSharingConfig(newConfig) {
    this.costSharingConfig = { ...this.costSharingConfig, ...newConfig };
  }

  /**
   * Get current configuration for admin dashboard
   */
  getConfiguration() {
    return {
      costFactors: this.costFactors,
      creditConfig: this.creditConfig,
      costSharingConfig: this.costSharingConfig
    };
  }
}

module.exports = CreditCalculationService;