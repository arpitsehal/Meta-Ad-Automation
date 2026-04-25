const db = require('./db');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * MetaApi Service
 * Handles all communications with Meta Marketing API
 */
class MetaApi {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async getCredentials() {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Test if the current credentials can connect to Meta
   */
  async testConnection() {
    const creds = await this.getCredentials();
    if (!creds || !creds.meta_access_token) throw new Error('No access token found.');
    
    try {
      // Fetch basic ad account info to verify token
      const response = await axios.get(`${this.baseUrl}/${creds.meta_ad_account_id}`, {
        params: {
          fields: 'name,account_status',
          access_token: creds.meta_access_token
        }
      });
      return response.data;
    } catch (error) {
      console.error('Meta Connection Test Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getPageAccessToken(creds) {
    if (!creds.meta_page_id) throw new Error('Meta Page ID not configured.');
    try {
      const response = await axios.get(`${this.baseUrl}/${creds.meta_page_id}`, {
        params: {
          fields: 'access_token',
          access_token: creds.meta_access_token
        }
      });
      return response.data.access_token || creds.meta_access_token;
    } catch (error) {
      console.warn('⚠️ Could not fetch explicit Page Access Token. Using default token.', error.response?.data?.error?.message || error.message);
      return creds.meta_access_token;
    }
  }

  /**
   * Get Lead Generation Forms for the Page
   */
  async getLeadForms() {
    const creds = await this.getCredentials();
    const pageId = creds.meta_page_id;
    
    if (!pageId) throw new Error('Meta Page ID not configured.');

    const pageToken = await this.getPageAccessToken(creds);

    try {
      const response = await axios.get(`${this.baseUrl}/${pageId}/leadgen_forms`, {
        params: {
          fields: 'id,name,status',
          access_token: pageToken
        }
      });
      // Filter out inactive forms
      return response.data.data.filter(form => form.status === 'ACTIVE');
    } catch (error) {
      console.error('Meta Lead Forms Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a new Lead Generation Form on the Page
   */
  async createLeadForm(name) {
    const creds = await this.getCredentials();
    const pageId = creds.meta_page_id;
    
    if (!pageId) throw new Error('Meta Page ID not configured.');

    const pageToken = await this.getPageAccessToken(creds);

    const payload = {
      name: name,
      questions: JSON.stringify([
        { 
          type: 'CUSTOM',
          label: 'Inquiry for (PCD Pharma or 3rd Party Manufacturing)?'
        },
        { type: 'FULL_NAME' },
        { type: 'EMAIL' },
        { type: 'PHONE' }
      ]),
      privacy_policy: JSON.stringify({
        url: 'https://chemsroot.com',
        link_text: 'Privacy Policy'
      }),
      follow_up_action_url: 'https://chemsroot.com',
      access_token: pageToken
    };

    try {
      const response = await axios.post(`${this.baseUrl}/${pageId}/leadgen_forms`, payload);
      return response.data;
    } catch (error) {
      console.error('Meta Lead Form Creation Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Leads for a specific Lead Generation Form
   */
  async getFormLeads(formId) {
    const creds = await this.getCredentials();
    const pageToken = await this.getPageAccessToken(creds);

    try {
      const response = await axios.get(`${this.baseUrl}/${formId}/leads`, {
        params: {
          access_token: pageToken,
          fields: 'created_time,id,field_data'
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Meta Form Leads Error:', error.response?.data?.error?.message || error.message);
      throw error;
    }
  }

  /**
   * Create a Campaign on Meta
   */
  async createCampaign(name, objective = 'OUTCOME_TRAFFIC') {
    const creds = await this.getCredentials();
    const adAccountId = creds.meta_ad_account_id;
    
    const payload = {
      name: `Campaign - ${name}`,
      objective: objective,
      status: 'PAUSED',
      special_ad_categories: ['NONE'],
      is_adset_budget_sharing_enabled: false,
      access_token: creds.meta_access_token
    };

    try {
      const response = await axios.post(`${this.baseUrl}/${adAccountId}/campaigns`, payload);
      return response.data;
    } catch (error) {
      console.error('Meta Campaign Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Search for Meta Location Keys based on our district names
   * @param {string} query District name
   */
  async searchLocation(query) {
    const creds = await this.getCredentials();
    if (!creds || !creds.meta_access_token) {
      throw new Error('Meta Access Token not found in settings.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          type: 'adgeolocation',
          q: query,
          location_types: ['city', 'region'],
          access_token: creds.meta_access_token
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Meta Location Search Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload an image to Meta and get back an Image Hash
   */
  async uploadImage(imageRelativePath) {
    if (!imageRelativePath) {
      throw new Error('Image upload failed: No image path provided.');
    }
    const creds = await this.getCredentials();
    const adAccountId = creds.meta_ad_account_id;
    
    try {
      // Resolve the local path to the actual file on disk
      const filename = path.basename(imageRelativePath);
      const absolutePath = path.resolve(__dirname, 'assets', 'uploads', filename);
      if (!fs.existsSync(absolutePath)) throw new Error(`Image file not found at: ${absolutePath}`);

      // Read file and convert to base64 for Meta's 'bytes' parameter
      const imageBuffer = fs.readFileSync(absolutePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(`${this.baseUrl}/${adAccountId}/adimages`, {
        bytes: base64Image,
        access_token: creds.meta_access_token
      });

      // Meta returns images as a map: { images: { "filename.jpg": { hash: "..." } } }
      const imagesMap = response.data.images;
      const firstKey = Object.keys(imagesMap)[0];
      return imagesMap[firstKey].hash;
    } catch (error) {
      console.error('Meta Image Upload Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Search for Geolocation keys (Cities)
   */
  async searchLocation(query) {
    const creds = await this.getCredentials();
    const trySearch = async (searchTerm) => {
      try {
        const response = await axios.get(`${this.baseUrl}/search`, {
          params: {
            type: 'adgeolocation',
            location_types: ['city', 'region'],
            q: searchTerm,
            access_token: creds.meta_access_token
          }
        });
        return response.data.data.find(item => item.country_code === 'IN') || null;
      } catch (e) { return null; }
    };

    let match = await trySearch(query);
    if (!match && !query.toLowerCase().includes('india')) {
      console.log(`🔍 Try #2 for location: ${query}, India`);
      match = await trySearch(`${query}, India`);
    }

    if (match) {
      console.log(`✅ Located: ${query} -> ${match.name} (Key: ${match.key})`);
    } else {
      console.warn(`⚠️ Location not found in India: ${query}`);
    }
    return match;
  }

  /**
   * Search for Interest IDs (Keywords) with Smart Similarity Scoring
   */
  async searchInterest(query) {
    const creds = await this.getCredentials();
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          type: 'adinterest',
          q: query,
          access_token: creds.meta_access_token
        }
      });
      
      const results = response.data.data;
      if (!results || results.length === 0) return null;

      // Smart Matching Algorithm:
      // We calculate a score for each result based on name similarity.
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

      const scoredResults = results.map(item => {
        const nameLower = item.name.toLowerCase();
        let score = 0;
        
        // Exact match (high bonus)
        if (nameLower === queryLower) score += 100;
        
        // Substring match
        if (nameLower.includes(queryLower)) score += 50;

        // Word overlap
        queryWords.forEach(word => {
          if (nameLower.includes(word)) score += 10;
        });

        // Audience size as a tiny tie-breaker (avoid total niche)
        const reachBonus = Math.min((item.audience_size || 0) / 10000000, 5); 
        
        return { ...item, matchScore: score + reachBonus };
      });

      scoredResults.sort((a, b) => b.matchScore - a.matchScore);
      
      const bestMatch = scoredResults[0];
      if (bestMatch && bestMatch.matchScore > 5) { // Threshold to avoid garbage matches
        console.log(`✅ Best Match: ${query} -> ${bestMatch.name} (Score: ${Math.round(bestMatch.matchScore)}, Reach: ${bestMatch.audience_size || 'N/A'})`);
        return bestMatch;
      }

      console.warn(`⚠️ No strong interest match for: ${query}`);
      return null;
    } catch (error) {
      console.error(`❌ Meta Interest Search Error (${query}):`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Resolve an array of names into Meta-compatible targeting specs
   */
  async resolveTargeting(cities, keywords) {
    console.log(`🔍 Resolving targeting: ${cities.length} cities, ${keywords.length} keywords...`);
    
    // Resolve Cities (with map to catch individual failures)
    const cityObjects = await Promise.all(cities.map(async (c) => {
      try { return await this.searchLocation(c); } catch { return null; }
    }));
    const cityKeys = cityObjects.filter(c => c !== null).map(c => ({ key: c.key }));

    // Resolve Interests (with map to catch individual failures)
    const interestObjects = await Promise.all(keywords.map(async (k) => {
      try { return await this.searchInterest(k); } catch { return null; }
    }));
    const interestIds = interestObjects.filter(i => i !== null).map(i => ({ id: i.id, name: i.name }));

    console.log(`📊 targeting results: ${cityKeys.length} Cities matched, ${interestIds.length} Interests matched.`);

    const targeting = {};
    const geo = {};

    if (cityKeys.length > 0) {
      geo.cities = cityKeys;
    } else {
      geo.countries = ['IN'];
    }
    
    targeting.geo_locations = geo;

    if (interestIds.length > 0) {
      targeting.flexible_spec = [{ interests: interestIds }];
    } else {
      console.warn('⚠️ No interests could be resolved. Audience will be broad (India-wide locations only).');
    }

    return targeting;
  }

  /**
   * Create an Ad Set with targeting
   */
  async createAdSet(campaignId, name, budget, targetingSpec = null, objective = 'OUTCOME_TRAFFIC') {
    const creds = await this.getCredentials();
    const adAccountId = creds.meta_ad_account_id;
    const pageId = creds.meta_page_id;

    const optimizationGoal = objective === 'OUTCOME_LEADS' ? 'LEAD_GENERATION' : 'LINK_CLICKS';

    const payload = {
      name: `AdSet - ${name}`,
      campaign_id: campaignId,
      daily_budget: Math.max(budget, 110) * 100, 
      billing_event: 'IMPRESSIONS',
      optimization_goal: optimizationGoal,
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      targeting: targetingSpec || {
        geo_locations: { countries: ['IN'] },
      },
      status: 'PAUSED',
      access_token: creds.meta_access_token
    };

    if (objective === 'OUTCOME_LEADS') {
      payload.promoted_object = { page_id: pageId };
      payload.destination_type = 'ON_AD';
    }

    try {
      const response = await axios.post(`${this.baseUrl}/${adAccountId}/adsets`, payload);
      return response.data;
    } catch (error) {
      console.error('Meta AdSet Creation Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create the Ad Creative (The actual message + image)
   */
  async createAdCreative(adName, headline, body, imageHash, description = '', leadGenFormId = null) {
    const creds = await this.getCredentials();
    const adAccountId = creds.meta_ad_account_id;
    const pageId = creds.meta_page_id;

    const callToAction = leadGenFormId 
      ? { type: 'SIGN_UP', value: { lead_gen_form_id: leadGenFormId } }
      : { type: 'LEARN_MORE' };

    const payload = {
      name: adName,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          image_hash: imageHash,
          link: "https://chemsroot.com",
          message: body,
          call_to_action: callToAction,
          name: headline,
          description: description
        }
      },
      access_token: creds.meta_access_token
    };

    try {
      const response = await axios.post(`${this.baseUrl}/${adAccountId}/adcreatives`, payload);
      return response.data;
    } catch (error) {
      console.error('Meta Creative Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a Carousel Ad Creative
   */
  async createCarouselCreative(adName, message, slides, leadGenFormId = null) {
    const creds = await this.getCredentials();
    const adAccountId = creds.meta_ad_account_id;
    const pageId = creds.meta_page_id;

    const callToAction = leadGenFormId 
      ? { type: 'SIGN_UP', value: { lead_gen_form_id: leadGenFormId } }
      : { type: 'LEARN_MORE' };

    const child_attachments = slides.map(slide => ({
      link: "https://chemsroot.com",
      image_hash: slide.imageHash,
      name: slide.headline,
      description: slide.description || '',
      call_to_action: callToAction
    }));

    const payload = {
      name: adName,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          link: `https://facebook.com/${pageId}`,
          message: message,
          call_to_action: callToAction,
          child_attachments: child_attachments
        }
      },
      access_token: creds.meta_access_token
    };

    try {
      const response = await axios.post(`${this.baseUrl}/${adAccountId}/adcreatives`, payload);
      return response.data;
    } catch (error) {
      console.error('Meta Carousel Creative Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Final Step: Create the Ad
   */
  async createAd(adSetId, creativeId, name) {
    const creds = await this.getCredentials();
    const adAccountId = creds.meta_ad_account_id;

    const payload = {
      name: name,
      adset_id: adSetId,
      creative: { creative_id: creativeId },
      status: 'PAUSED',
      access_token: creds.meta_access_token
    };

    try {
      const response = await axios.post(`${this.baseUrl}/${adAccountId}/ads`, payload);
      return response.data;
    } catch (error) {
      console.error('Meta Ad Creation Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update the status of a Campaign (e.g., to PAUSED or ACTIVE)
   */
  async updateCampaignStatus(campaignId, status) {
    const creds = await this.getCredentials();
    
    try {
      const response = await axios.post(`${this.baseUrl}/${campaignId}`, {
        status: status,
        access_token: creds.meta_access_token
      });
      return response.data;
    } catch (error) {
      console.error('Meta Status Update Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Account-level insights for the last 30 days
   */
  async getAccountInsights() {
    const creds = await this.getCredentials();
    const adAccountId = creds.meta_ad_account_id;

    try {
      const response = await axios.get(`${this.baseUrl}/${adAccountId}/insights`, {
        params: {
          fields: 'spend,reach,impressions,clicks,inline_link_clicks,cpc',
          date_preset: 'last_30d',
          access_token: creds.meta_access_token
        }
      });
      return response.data.data[0] || null;
    } catch (error) {
      console.error('Meta Account Insights Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Daily insights for the last 7 days (for charts)
   */
  async getDailyInsights() {
    const creds = await this.getCredentials();
    const adAccountId = creds.meta_ad_account_id;

    try {
      const response = await axios.get(`${this.baseUrl}/${adAccountId}/insights`, {
        params: {
          fields: 'spend,reach,date_start',
          date_preset: 'last_7d',
          time_increment: 1,
          access_token: creds.meta_access_token
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Meta Daily Insights Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new MetaApi();
