const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');
const metaApi = require('./metaApi');
const { watermarkWithLogo } = require('./imageProcessor');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images as static files
const UPLOADS_DIR = path.join(__dirname, 'assets', 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// --- DIAGNOSTICS ---
app.get('/api/ping', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.get('/api/meta/test-connection', async (req, res) => {
  try {
    const info = await metaApi.testConnection();
    res.json({ message: 'Connected', data: info });
  } catch (error) {
    console.error('Test Connection Route Error:', error);
    res.status(500).json({ 
      error: 'Meta Connection Failed', 
      details: error.response?.data || error.message 
    });
  }
});

app.get('/api/meta/lead-forms', async (req, res) => {
  try {
    const forms = await metaApi.getLeadForms();
    res.json(forms);
  } catch (error) {
    console.error('Lead Forms Route Error:', error.response?.data?.error?.message || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Lead Forms', 
      details: error.response?.data || error.message 
    });
  }
});

app.post('/api/meta/lead-forms/create', async (req, res) => {
  console.log('📝 Creating new Lead Form:', req.body.name);
  const { name = `Contact Form - ${new Date().toISOString().replace('T', ' ').slice(0, 19)}` } = req.body;
  try {
    const newForm = await metaApi.createLeadForm(name);
    res.json(newForm);
  } catch (error) {
    console.error('Lead Form Create Route Error:', error);
    res.status(500).json({ 
      error: 'Failed to create Lead Form', 
      details: error.response?.data?.error?.error_user_msg || error.response?.data?.error?.message || error.message 
    });
  }
});

app.get('/api/meta/lead-forms/:id/leads', async (req, res) => {
  try {
    const leads = await metaApi.getFormLeads(req.params.id);
    res.json(leads);
  } catch (error) {
    console.error('Fetch Leads Route Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Leads', 
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

// Multer – store to disk using original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ad_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WEBP, GIF images are allowed'));
  },
});

const PORT = 3001;


// --- SETTINGS (API KEYS) ROUTES ---
app.get('/api/settings', (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.post('/api/settings', (req, res) => {
  const { openai_key, meta_app_id, meta_app_secret, meta_access_token, meta_ad_account_id, meta_page_id } = req.body;
  
  const query = `
    UPDATE settings 
    SET openai_key = ?, meta_app_id = ?, meta_app_secret = ?, meta_access_token = ?, meta_ad_account_id = ?, meta_page_id = ?
    WHERE id = 1
  `;
  
  db.run(query, [openai_key, meta_app_id, meta_app_secret, meta_access_token, meta_ad_account_id, meta_page_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Settings updated successfully' });
  });
});

// --- CAMPAIGNS (DRAFTS) ROUTES ---
app.get('/api/campaigns', (req, res) => {
  db.all('SELECT * FROM campaigns ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/campaigns', (req, res) => {
  console.log('Incoming Campaign Draft Payload:', req.body);
  const { name, target_audience, target_cities, target_keywords, budget, objective, lead_gen_form_id } = req.body;
  const citiesJson = JSON.stringify(target_cities || []);
  const keywordsJson = JSON.stringify(target_keywords || []);
  const finalObjective = objective || 'OUTCOME_TRAFFIC';

  const query = `
    INSERT INTO campaigns (name, target_audience, target_cities, target_keywords, budget, objective, lead_gen_form_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
  `;
  
  db.run(query, [name, target_audience, citiesJson, keywordsJson, budget, finalObjective, lead_gen_form_id || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: `Campaign draft "${name}" saved.` });
  });
});


app.put('/api/campaigns/:id/publish', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 1. Fetch complete campaign and creative data
    const campaign = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (!campaign.creative_id) return res.status(400).json({ error: 'Please attach a creative before publishing.' });

    // Fetch linked creative
    const creative = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM creatives WHERE id = ?', [campaign.creative_id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!creative) return res.status(404).json({ error: 'Creative not found' });

    // 2. Start Meta Publication Sequence
    console.log(`🚀 Starting Meta publication for: ${campaign.name}`);
    
    // A. Create Campaign
    const metaCampaign = await metaApi.createCampaign(campaign.name, campaign.objective);
    const campaignId = metaCampaign.id;

    // B. Create Ad Set (Targeting)
    // We now resolve specific districts and keywords to Meta IDs
    let targetCities = [];
    let targetKeywords = [];
    try { targetCities = JSON.parse(campaign.target_cities || '[]'); } catch (e) { targetCities = []; }
    try { targetKeywords = JSON.parse(campaign.target_keywords || '[]'); } catch (e) { targetKeywords = []; }

    const targetingSpec = await metaApi.resolveTargeting(targetCities, targetKeywords);
    console.log('📝 Meta Targeting Pre-flight Check:', JSON.stringify(targetingSpec, null, 2));

    let metaAdSet;
    try {
      metaAdSet = await metaApi.createAdSet(campaignId, campaign.name, campaign.budget || 500, targetingSpec, campaign.objective);
    } catch (adSetError) {
      const errorData = adSetError.response?.data?.error;
      const subcode = errorData?.error_subcode;
      const userMsg = errorData?.error_user_msg || '';

      // Check for High-End Self-Healing: Deprecated/Combined Targeting IDs (Subcode 1870247)
      if (subcode === 1870247 && userMsg.includes('alternative_interest_id')) {
        console.log('🛡️ Meta Auto-Fixer: Found deprecated targeting. Attempting to extract alternatives...');
        
        try {
          // Extract the first alternative_interest_id using regex
          const altIdMatch = userMsg.match(/"alternative_interest_id":"(\d+)"/);
          const altNameMatch = userMsg.match(/"alternative_interest_name":"([^"]+)"/);
          const deprecatedIdMatch = userMsg.match(/"deprecated_interest_id":"(\d+)"/);

          if (altIdMatch && deprecatedIdMatch) {
            const oldId = deprecatedIdMatch[1];
            const newId = altIdMatch[1];
            const newName = altNameMatch ? altNameMatch[1] : 'Fixed Interest';

            console.log(`♻️ Swapping Deprecated ID ${oldId} for Meta-recommended ID ${newId} (${newName})`);

            // Update the targetingSpec in-place
            targetingSpec.flexible_spec[0].interests = targetingSpec.flexible_spec[0].interests.map(i => 
              i.id === oldId ? { id: newId, name: newName } : i
            );

            console.log('🚀 Retrying publication with healed targeting...');
            metaAdSet = await metaApi.createAdSet(campaignId, campaign.name, campaign.budget || 500, targetingSpec, campaign.objective);
          } else {
            throw adSetError; // Couldn't find specific IDs to swap
          }
        } catch (retryError) {
          console.error('❌ Self-Healing failed or retry failed:', retryError.response?.data || retryError.message);
          throw adSetError;
        }
      } else {
        console.error('❌ AdSet Creation Failed (No auto-fix available):', errorData || adSetError.message);
        throw adSetError;
      }
    }
    const adSetId = metaAdSet.id;

    // C. Handle Creative (Single or Carousel)
    let creativeId;
    if (creative.ad_type === 'carousel') {
      console.log(`🎠 Handling Carousel creative with multiple slides...`);
      let slides = [];
      try {
        slides = JSON.parse(creative.slides_json || '[]');
      } catch (e) {
        throw new Error('Failed to parse carousel slides.');
      }

      if (slides.length === 0) throw new Error('Carousel has no slides.');

      // Upload all images for the slides in parallel
      const slidesWithHashes = await Promise.all(slides.map(async (slide, index) => {
        if (!slide.imageUrl) throw new Error(`Slide ${index + 1} is missing an image.`);
        console.log(`📸 Uploading image for slide ${index + 1}...`);
        const hash = await metaApi.uploadImage(slide.imageUrl);
        return { ...slide, imageHash: hash };
      }));

      // Create Carousel Creative
      const metaCreative = await metaApi.createCarouselCreative(
        creative.ad_name || `Carousel - ${campaign.name}`,
        campaign.name, // Use campaign name as the primary message
        slidesWithHashes,
        campaign.lead_gen_form_id
      );
      creativeId = metaCreative.id;
    } else {
      // Single Image Logic
      if (!creative.image_url) throw new Error('Creative is missing an image. Please upload one before publishing.');
      
      const imageHash = await metaApi.uploadImage(creative.image_url);
      const metaCreative = await metaApi.createAdCreative(
        creative.ad_name, 
        creative.headline, 
        creative.ad_copy, 
        imageHash,
        creative.description,
        campaign.lead_gen_form_id
      );
      creativeId = metaCreative.id;
    }

    // D. Create the final Ad
    // This connects the Ad Set and the Creative
    const metaAd = await metaApi.createAd(adSetId, creativeId, campaign.name);
    
    // 3. Update status in local DB
    db.run(
      'UPDATE campaigns SET status = "active", meta_campaign_id = ? WHERE id = ?',
      [campaignId, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
          message: 'Campaign fully published to Meta!', 
          meta_id: campaignId 
        });
      }
    );

  } catch (error) {
    console.error('❌ Publication Crash Point:', error);
    res.status(500).json({ 
      error: 'Meta API Publication Failed', 
      details: error.response?.data || error.message 
    });
  }
});

// Prevent server from dying on unhandled async errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('🛑 Unhandled Rejection at:', promise, 'reason:', reason);
});


app.put('/api/campaigns/:id/stop', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 1. Get the meta_campaign_id from the database
    const campaign = await new Promise((resolve, reject) => {
      db.get('SELECT meta_campaign_id FROM campaigns WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (campaign && campaign.meta_campaign_id) {
      console.log(`⏸ Pausing Meta Campaign: ${campaign.meta_campaign_id}`);
      try {
        await metaApi.updateCampaignStatus(campaign.meta_campaign_id, 'PAUSED');
      } catch (metaError) {
        const errorMsg = metaError.response?.data?.error?.message || '';
        if (errorMsg.includes('deleted')) {
          console.warn(`⚠️ Meta Campaign ${campaign.meta_campaign_id} was already deleted on Meta. Updating local status to stopped.`);
        } else {
          throw metaError;
        }
      }
    }

    // 2. Update local database status
    db.run(`UPDATE campaigns SET status = 'stopped' WHERE id = ?`, [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Campaign stopped on Dashboard and Paused on Meta.' });
    });

  } catch (error) {
    console.error('Stop Route Error:', error);
    res.status(500).json({ error: 'Failed to stop campaign on Meta', details: error.message });
  }
});

app.delete('/api/campaigns/:id', (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM campaigns WHERE id = ?`;
  db.run(query, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Draft deleted.' });
  });
});

// --- ANALYTICS ROUTE ---
// Returns real data from Meta Insights
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const [summary, daily] = await Promise.all([
      metaApi.getAccountInsights(),
      metaApi.getDailyInsights()
    ]);

    // Format summary metrics
    const metrics = {
      totalSpend: summary ? parseFloat(summary.spend) : 0,
      cpc: summary ? parseFloat(summary.cpc || 0) : 0,
      reach: summary ? parseInt(summary.reach) : 0,
      impressions: summary ? parseInt(summary.impressions) : 0,
      clicks: summary ? parseInt(summary.inline_link_clicks || summary.clicks) : 0,
    };

    // Format daily data for Recharts (Front-end expects {date, spend, reach})
    const chartData = daily.map(d => ({
      date: d.date_start,
      spend: parseFloat(d.spend),
      reach: parseInt(d.reach)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      ...metrics,
      chartData
    });

  } catch (error) {
    console.error('Analytics Route Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});


// --- CREATIVES & AI ROUTES ---

app.get('/api/campaigns/drafts', (req, res) => {
  db.all("SELECT * FROM campaigns WHERE status = 'draft' ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/creative/:campaign_id', (req, res) => {
  const { campaign_id } = req.params;
  db.get(`SELECT * FROM creatives WHERE campaign_id = ?`, [campaign_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || null);
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT id, email, role FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  });
});

// --- MANUAL CREATIVE SAVE ---
app.put('/api/creative/:campaign_id', (req, res) => {
  const { campaign_id } = req.params;
  console.log(`Attempting to attach creative to Campaign ID: ${campaign_id}`);
  const { ad_type, ad_name, headline, description, ad_copy, cta, slides, image_url } = req.body;

  const slidesJson = ad_type === 'carousel' ? JSON.stringify(slides || []) : null;
  const finalAdCopy = ad_type === 'carousel'
    ? (slides || []).map((s, i) => `Slide ${i + 1}: ${s.headline}\n${s.body}`).join('\n\n---\n\n')
    : ad_copy;

  db.get(`SELECT id FROM creatives WHERE campaign_id = ?`, [campaign_id], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });

    if (existing) {
      db.run(
        `UPDATE creatives SET ad_type = ?, ad_name = ?, headline = ?, description = ?, ad_copy = ?, cta = ?, slides_json = ?, image_url = ? WHERE campaign_id = ?`,
        [ad_type || 'single', ad_name, headline, description, finalAdCopy, cta, slidesJson, image_url, campaign_id],
        function(updErr) {
          if (updErr) return res.status(500).json({ error: updErr.message });
          res.json({ message: ad_type === 'carousel' ? `Carousel (${(slides||[]).length} slides) updated!` : 'Creative updated successfully!' });
        }
      );
    } else {
      db.run(
        `INSERT INTO creatives (campaign_id, ad_type, ad_name, headline, description, ad_copy, cta, slides_json, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [campaign_id, ad_type || 'single', ad_name, headline, description, finalAdCopy, cta, slidesJson, image_url],
        function(insErr) {
          if (insErr) return res.status(500).json({ error: insErr.message });
          const newId = this.lastID;
          db.run(`UPDATE campaigns SET creative_id = ? WHERE id = ?`, [newId, campaign_id], () => {
            res.json({ message: ad_type === 'carousel' ? `Carousel with ${(slides||[]).length} slides saved & attached!` : 'Creative saved & attached!' });
          });
        }
      );
    }
  });
});



// --- IMAGE UPLOAD ROUTE ---
// POST /api/upload-image  – field name: "image"
app.post('/api/upload-image', (req, res) => {
  // Run multer manually so we can catch its errors and return JSON
  upload.single('image')(req, res, async (err) => {
    if (err) {
      // Multer validation errors (file type, size) → return JSON not HTML
      return res.status(400).json({ error: err.message || 'Upload error' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file received.' });
    }

    // Optional: watermark with logo
    try {
      const logoPath = path.join(__dirname, 'assets', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const original = fs.readFileSync(req.file.path);
        const watermarked = await watermarkWithLogo(original);
        fs.writeFileSync(req.file.path, watermarked);
      }
    } catch (e) {
      console.warn('Watermark skipped:', e.message);
    }

    const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    res.json({ imageUrl, filename: req.file.filename });
  });
});

// Global error handler – always returns JSON (prevents HTML error pages)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
