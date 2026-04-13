import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, ShieldCheck, Copy, CheckCheck,
  ChevronLeft, ChevronRight, LayoutGrid, Square,
  GripVertical, Upload, X, Image as ImageIcon,
} from 'lucide-react';
import './Creative.css';

// ── 4 Campaign Templates ──────────────────────────────────────────────────────
const CREATIVE_COLORS = ['hsl(217,91%,60%)', 'hsl(142,71%,45%)', 'hsl(271,91%,65%)', 'hsl(38,95%,56%)'];

// ── Image Upload Zone ─────────────────────────────────────────────────────────
const ImageUploadZone = ({ imageUrl, onUploaded, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef();

  const doUpload = async (file) => {
    if (!file) return;
    setIsUploading(true); setUploadError('');
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await fetch('http://localhost:3001/api/upload-image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onUploaded(data.imageUrl);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    doUpload(e.dataTransfer.files[0]);
  };

  if (imageUrl) {
    return (
      <div className="image-preview-wrapper">
        <img src={imageUrl} alt="Ad" className="image-preview" />
        <button className="image-remove-btn" onClick={onRemove} title="Remove image">
          <X size={14} />
        </button>
        <div className="image-preview-label">
          <ImageIcon size={12} /> Ad image attached
        </div>
      </div>
    );
  }

  return (
    <div
      className={`image-dropzone ${isDragging ? 'image-dropzone--drag' : ''} ${isUploading ? 'image-dropzone--uploading' : ''}`}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={e => doUpload(e.target.files[0])}
      />
      {isUploading ? (
        <div className="dropzone-inner">
          <div className="upload-spinner" />
          <span>Uploading…</span>
        </div>
      ) : (
        <div className="dropzone-inner">
          <Upload size={28} color="var(--text-secondary)" />
          <span><strong>Click or drag</strong> to upload image</span>
          <span className="dropzone-hint">JPEG · PNG · WEBP · GIF · max 10 MB</span>
          {uploadError && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{uploadError}</span>}
        </div>
      )}
    </div>
  );
};

// ── Ad Preview Card ───────────────────────────────────────────────────────────
const AdCard = ({ slide, accent }) => (
  <div className="ad-preview animate-fade-in" style={{ borderTop: `3px solid ${accent || 'var(--accent-primary)'}` }}>
    <div className="ad-preview__header">
      <div className="ad-preview__avatar" style={{ background: accent || 'var(--accent-primary)' }}>C</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Chemsroot Pharmaceutical</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sponsored · 🇮🇳 India</div>
      </div>
    </div>
    <div className="ad-preview__body" style={{ whiteSpace: 'pre-wrap', padding: '0 0.75rem 0.5rem', fontSize: '0.9rem' }}>{slide.body}</div>
    {slide.imageUrl && (
      <img src={slide.imageUrl} alt="Ad visual" className="ad-preview__image" />
    )}
    {!slide.imageUrl && (
      <div className="ad-preview__image-placeholder">
        <ImageIcon size={28} />
        <span>No image yet</span>
      </div>
    )}
    <div style={{ padding: '0.75rem' }}>
      {slide.headline && <div className="ad-preview__headline" style={{ fontWeight: 600, fontSize: '1rem' }}>{slide.headline}</div>}
      {slide.description && <div className="ad-preview__description" style={{ fontSize: '0.85rem', color: '#65676b', marginTop: '2px', lineHeight: '1.2' }}>{slide.description}</div>}
      {slide.cta && <div className="ad-preview__cta" style={{ color: accent || 'var(--accent-primary)', marginTop: '0.5rem', fontWeight: 600 }}>{slide.cta} →</div>}
    </div>
  </div>
);

// ── Image field in editor ─────────────────────────────────────────────────────
const SlideImageField = ({ slide, onUpdate }) => (
  <div className="form-group">
    <label>Ad Image</label>
    <ImageUploadZone
      imageUrl={slide.imageUrl}
      onUploaded={url => onUpdate('imageUrl', url)}
      onRemove={() => onUpdate('imageUrl', '')}
    />
  </div>
);

// ── Text fields shared across both modes ──────────────────────────────────────
const SlideTextFields = ({ slide, onUpdate }) => (
  <>
    <div className="form-group">
      <label>Ad Name</label>
      <input 
        type="text" 
        placeholder="e.g. Summer Sale 2026"
        value={slide.adName || ''} 
        onChange={e => onUpdate('adName', e.target.value)} 
      />
    </div>
    <div className="form-group">
      <label>Headline</label>
      <input 
        type="text" 
        placeholder="e.g. Premium Pharma Solutions"
        value={slide.headline || ''} 
        onChange={e => onUpdate('headline', e.target.value)} 
      />
    </div>
    <div className="form-group">
      <label>Description</label>
      <input 
        type="text" 
        placeholder="Include additional details"
        value={slide.description || ''} 
        onChange={e => onUpdate('description', e.target.value)} 
      />
    </div>
    <div className="form-group">
      <label>Body Copy</label>
      <textarea
        className="prompt-area"
        style={{ minHeight: '140px' }}
        placeholder="Write your compelling ad copy here..."
        value={slide.body || ''}
        onChange={e => onUpdate('body', e.target.value)}
      />
    </div>
    <div className="form-group">
      <label>Call to Action</label>
      <input 
        type="text" 
        placeholder="e.g. Shop Now, Order Today"
        value={slide.cta || ''} 
        onChange={e => onUpdate('cta', e.target.value)} 
      />
    </div>
  </>
);

// ── Component ─────────────────────────────────────────────────────────────────
const Creative = () => {
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('cs_templates');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        label: 'Template 1',
        adName: 'Chemsroot Edward – Brand Awareness',
        headline: 'Trust Edward for Every Ailment',
        body: "Chemsroot Edward – India's trusted name in pharmaceutical care. Backed by science, built for you. Ask your doctor today.\n\n*This advertisement is for informational purposes only and does not constitute medical advice.",
        cta: 'Learn More',
        accent: CREATIVE_COLORS[0],
      }
    ];
  });

  const handleAddTemplate = () => {
    if (templates.length >= 4) return;
    const newId = (Math.max(...templates.map(t => t.id), 0) || 0) + 1;
    setTemplates(prev => [...prev, {
      id: newId,
      label: `Template ${newId}`,
      adName: '',
      headline: '',
      body: '',
      cta: 'Learn More',
      accent: CREATIVE_COLORS[(newId - 1) % 4],
    }]);
  };

  const handleDeleteTemplate = (id, e) => {
    e.stopPropagation();
    if (templates.length <= 1) return;
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedTemplate === id) {
      setSelectedTemplate(null);
      setSingleSlide({ adName: '', headline: '', body: '', cta: '', imageUrl: '' });
    }
    setCarouselSelected(prev => {
      const next = prev.filter(tid => tid !== id);
      setActiveSlideIdx(idx => Math.min(idx, Math.max(0, next.length - 1)));
      return next;
    });
  };

  const [carouselSelected, setCarouselSelected] = useState(() => {
    const saved = localStorage.getItem('cs_selected');
    return saved ? JSON.parse(saved) : [];
  });
  const [carouselSlides, setCarouselSlides] = useState(() => {
    const saved = localStorage.getItem('cs_slides');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [dragging, setDragging] = useState(null);

  // Common
  const [campaignId, setCampaignId] = useState(() => localStorage.getItem('cs_campaign_id') || '');
  const [draftsList, setDraftsList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/campaigns/drafts')
      .then(r => r.json())
      .then(data => {
        setDraftsList(data);
        // Force-sync: if we have drafts but no ID (or stale ID), pick the newest one
        if (data.length > 0 && (!campaignId || !data.find(d => String(d.id) === String(campaignId)))) {
          setCampaignId(String(data[0].id));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem('cs_campaign_id', campaignId);
    if (!campaignId) return;

    // Hydration: Fetch saved creative for this campaign
    fetch(`http://localhost:3001/api/creative/${campaignId}`)
      .then(r => r.json())
      .then(data => {
        if (!data) return;
        
        if (data.ad_type === 'carousel') {
          const slides = JSON.parse(data.slides_json || '[]');
          const newTpls = slides.map((s, i) => ({
            id: i + 1,
            label: `Template ${i + 1}`,
            adName: s.adName || '',
            headline: s.headline || '',
            description: s.description || '',
            body: s.body || '',
            cta: s.cta || 'Learn More',
            accent: CREATIVE_COLORS[i % 4],
          }));
          setTemplates(newTpls);
          setCarouselSelected(newTpls.map(t => t.id));
          const slideMap = {};
          newTpls.forEach((t, i) => {
            slideMap[t.id] = { ...slides[i], imageUrl: slides[i].imageUrl || '' };
          });
          setCarouselSlides(slideMap);
        } else {
          // Single
          const oneTpl = {
            id: 1,
            label: 'Template 1',
            adName: data.ad_name || '',
            headline: data.headline || '',
            description: data.description || '',
            body: data.ad_copy || '',
            cta: data.cta || 'Learn More',
            accent: CREATIVE_COLORS[0],
          };
          setTemplates([oneTpl]);
          setCarouselSelected([1]);
          setCarouselSlides({ 1: { ...oneTpl, imageUrl: data.image_url || '' } });
        }
        setActiveSlideIdx(0);
      })
      .catch(console.error);
  }, [campaignId]);

  // Sync Drafts to Local Storage
  useEffect(() => {
    localStorage.setItem('cs_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('cs_selected', JSON.stringify(carouselSelected));
  }, [carouselSelected]);

  useEffect(() => {
    localStorage.setItem('cs_slides', JSON.stringify(carouselSlides));
  }, [carouselSlides]);

  // ── Unified Toggle Helper
  const toggleCarouselTemplate = (tpl) => {
    setCarouselSelected(prev => {
      if (prev.includes(tpl.id)) {
        const next = prev.filter(i => i !== tpl.id);
        setActiveSlideIdx(Math.min(activeSlideIdx, Math.max(0, next.length - 1)));
        return next;
      }
      setCarouselSlides(s => ({
        ...s,
        [tpl.id]: s[tpl.id] ?? { adName: tpl.adName, headline: tpl.headline, description: tpl.description, body: tpl.body, cta: tpl.cta, imageUrl: '' },
      }));
      return [...prev, tpl.id];
    });
  };

  const updateSlide = (id, field, value) =>
    setCarouselSlides(s => ({ ...s, [id]: { ...s[id], [field]: value } }));

  const currentSlideId = carouselSelected[activeSlideIdx];
  const currentSlide = carouselSlides[currentSlideId] || {};
  const currentTpl = templates.find(t => t.id === currentSlideId) || {};

  // Drag reorder
  const dragOver = useRef(null);
  const handleDragStart = (id) => setDragging(id);
  const handleDragEnter = (id) => { dragOver.current = id; };
  const handleDragEnd = () => {
    if (dragging == null || !dragOver.current) return;
    setCarouselSelected(prev => {
      const copy = [...prev];
      const from = copy.indexOf(dragging), to = copy.indexOf(dragOver.current);
      if (from === to) return prev;
      copy.splice(from, 1); copy.splice(to, 0, dragging);
      return copy;
    });
    setDragging(null); dragOver.current = null;
  };

  // ── Copy / Save
  const handleCopy = () => {
    if (carouselSelected.length === 0) return;
    const isSingle = carouselSelected.length === 1;
    const text = isSingle
      ? (() => { const s = carouselSlides[carouselSelected[0]] || {}; return `${s.adName}\nHeadline: ${s.headline}\n\n${s.body}\nCTA: ${s.cta}`; })()
      : carouselSelected.map((id, i) => {
          const s = carouselSlides[id] || {};
          return `Slide ${i + 1}: ${s.adName}\nHeadline: ${s.headline}\n${s.body}\nCTA: ${s.cta}`;
        }).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!campaignId) return setErrorMsg('Select a campaign draft first.');
    if (carouselSelected.length === 0) return setErrorMsg('Tick at least 1 template to save.');
    setIsSaving(true); setSaveMsg(''); setErrorMsg('');
    const isSingle = carouselSelected.length === 1;
    const singleData = carouselSlides[carouselSelected[0]] || {};
    const payload = isSingle
      ? { ad_type: 'single', ad_name: singleData.adName, headline: singleData.headline, description: singleData.description, ad_copy: singleData.body, cta: singleData.cta, image_url: singleData.imageUrl }
      : { ad_type: 'carousel', ad_name: `Carousel (${carouselSelected.length} slides)`, slides: carouselSelected.map(id => carouselSlides[id]) };
    
    try {
      const cleanId = parseInt(campaignId);
      const res = await fetch(`http://localhost:3001/api/creative/${cleanId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) setErrorMsg(data.error || 'Save failed');
      else { 
        setSaveMsg(`✅ Creative successfully attached to Campaign #${cleanId}!`); 
        setTimeout(() => setSaveMsg(''), 5000); 
      }
    } catch { 
      setErrorMsg('Failed to connect to backend. Please check your internet or server.'); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const canSave = carouselSelected.length > 0;

  return (
    <div className="creative-container animate-fade-in">
      <div className="header">
        <h1 className="title">Creative Studio</h1>
        <p className="subtitle">Build a single ad or combine templates into a Meta carousel. Add images to each slide.</p>
      </div>

      {/* ══════════════ UNIFIED MODE ══════════════ */}
        <>
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h2 className="title" style={{ fontSize: '1.05rem', margin: 0 }}>
                <LayoutGrid size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Pick Templates
              </h2>
              {carouselSelected.length > 0 && (
                <span className="slide-count-badge" style={{ margin: 0 }}>
                  {carouselSelected.length} template{carouselSelected.length > 1 ? 's' : ''} active
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Tick 1 template for a Single Ad, or tick 2+ to build a Carousel Slideshow.
            </p>
            <div className="template-grid">
              {templates.map((tpl, gridIdx) => {
                const checked = carouselSelected.includes(tpl.id);
                const idx = carouselSelected.indexOf(tpl.id);
                return (
                  <button
                    key={tpl.id}
                    className={`template-card ${checked ? 'template-card--active' : ''}`}
                    style={checked ? { borderColor: tpl.accent, boxShadow: `0 0 0 3px ${tpl.accent}33`, position: 'relative' } : { position: 'relative' }}
                    onClick={() => toggleCarouselTemplate(tpl)}
                  >
                    {checked && <span className="slide-order-badge" style={{ background: tpl.accent }}>#{idx + 1}</span>}
                    <span className="template-number" style={{ background: `${tpl.accent}22`, color: tpl.accent }}>T{gridIdx + 1}</span>
                    <span className="template-label">Template {gridIdx + 1}</span>
                    <span className="carousel-check">{checked ? '✓ Added' : '+ Add'}</span>
                    {templates.length > 1 && (
                      <div 
                        className="template-delete" 
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', cursor: 'pointer', opacity: 0.5, zIndex: 10 }}
                      >
                        <X size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
              {templates.length < 4 && (
                <button 
                  className="template-card" 
                  style={{ borderStyle: 'dashed', borderColor: 'var(--border)', justifyContent: 'center', opacity: 0.7, background: 'transparent', minHeight: '66px' }} 
                  onClick={handleAddTemplate}
                >
                   <span className="template-label" style={{ fontWeight: 600 }}>+ Add Template</span>
                </button>
              )}
            </div>
          </div>

          {carouselSelected.length >= 1 && (
            <div className="studio-grid">
              {/* Left – editor */}
              <div className="glass-panel input-panel">
                {/* Reorder strip (hidden for single) */}
                {carouselSelected.length > 1 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                      Slide Order (drag to reorder, click to edit)
                    </label>
                    <div className="slide-strip">
                      {carouselSelected.map((id, i) => {
                        const tplIndex = templates.findIndex(t => t.id === id);
                        const tpl = templates[tplIndex];
                        if (!tpl) return null;
                        const hasImg = !!carouselSlides[id]?.imageUrl;
                        return (
                          <div
                            key={id}
                            className={`slide-pill ${activeSlideIdx === i ? 'slide-pill--active' : ''}`}
                            style={activeSlideIdx === i ? { borderColor: tpl.accent, color: tpl.accent } : {}}
                            draggable
                            onDragStart={() => handleDragStart(id)}
                            onDragEnter={() => handleDragEnter(id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={e => e.preventDefault()}
                            onClick={() => setActiveSlideIdx(i)}
                          >
                            <GripVertical size={12} style={{ opacity: 0.5 }} />
                            <span style={{ fontWeight: 700 }}>{i + 1}</span>
                            <span style={{ fontSize: '0.72rem' }}>T{tplIndex + 1}</span>
                            {hasImg && <ImageIcon size={11} title="Has image" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <h2 className="title" style={{ fontSize: '1rem' }}>
                  {carouselSelected.length === 1 ? currentTpl.label : `Slide ${activeSlideIdx + 1} — ${currentTpl.label}`}
                </h2>
                <SlideTextFields
                  slide={currentSlide}
                  onUpdate={(field, val) => updateSlide(currentSlideId, field, val)}
                />
                <SlideImageField
                  slide={currentSlide}
                  onUpdate={(field, val) => updateSlide(currentSlideId, field, val)}
                />
              </div>

              {/* Right – slideshow preview */}
              <div className="glass-panel output-panel">
                <h2 className="title" style={{ fontSize: '1.05rem' }}>
                  Creative Preview
                  {carouselSelected.length > 1 && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      {activeSlideIdx + 1} / {carouselSelected.length}
                    </span>
                  )}
                </h2>
                <ComplianceBadge />

                <div className="slideshow-wrapper">
                  {carouselSelected.length > 1 && (
                    <button
                      className="slide-nav slide-nav--left"
                      onClick={() => setActiveSlideIdx(i => Math.max(0, i - 1))}
                      disabled={activeSlideIdx === 0}
                    ><ChevronLeft size={20} /></button>
                  )}

                  <div className="slideshow-inner">
                    <AdCard slide={currentSlide} accent={currentTpl.accent} />
                  </div>

                  {carouselSelected.length > 1 && (
                    <button
                      className="slide-nav slide-nav--right"
                      onClick={() => setActiveSlideIdx(i => Math.min(carouselSelected.length - 1, i + 1))}
                      disabled={activeSlideIdx === carouselSelected.length - 1}
                    ><ChevronRight size={20} /></button>
                  )}
                </div>

                {carouselSelected.length > 1 && (
                  <div className="slide-dots">
                    {carouselSelected.map((id, i) => {
                      const tpl = templates.find(t => t.id === id);
                      if (!tpl) return null;
                      return (
                        <button
                          key={id}
                          className={`slide-dot ${activeSlideIdx === i ? 'slide-dot--active' : ''}`}
                          style={activeSlideIdx === i ? { background: tpl.accent } : {}}
                          onClick={() => setActiveSlideIdx(i)}
                        />
                      );
                    })}
                  </div>
                )}

                <SaveRow {...{ campaignId, setCampaignId, draftsList, onCopy: handleCopy, onSave: handleSave, isSaving, canSave, copied, saveMsg, errorMsg }} />
              </div>
            </div>
          )}

          {carouselSelected.length === 0 && (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Tick a template above to start building your creative.
            </div>
          )}
        </>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const ComplianceBadge = () => (
  <div className="compliance-check">
    <ShieldCheck size={18} color="var(--success)" />
    <div className="compliance-text">
      <strong>MLR Pre-Check:</strong> Ensure copy includes the mandatory disclaimer and no unverified efficacy claims before publishing.
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', minHeight: 200 }}>
    {text}
  </div>
);

const SaveRow = ({ campaignId, setCampaignId, draftsList, onCopy, onSave, isSaving, canSave, copied, saveMsg, errorMsg }) => {
  const handleSelectChange = (e) => {
    const val = e.target.value;
    console.log('Switching target campaign to:', val);
    setCampaignId(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
      <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={onCopy}>
        {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>
      <div className="form-group">
        <label>Attach to Campaign Draft (Linked to: #{campaignId || 'None'})</label>
        <select value={campaignId} onChange={handleSelectChange}>
          <option value="" disabled>Select campaign...</option>
          {draftsList.map(d => (
            <option key={d.id} value={String(d.id)}>
              {d.name} (ID: {d.id})
            </option>
          ))}
        </select>
      </div>
      {errorMsg && <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errorMsg}</div>}
      <button 
        className="btn btn-primary" 
        style={{ width: '100%', justifyContent: 'center' }} 
        onClick={onSave} 
        disabled={isSaving || !canSave || !campaignId}
      >
        {isSaving ? 'Saving...' : `Save & Attach to #${campaignId || '?'}`}
      </button>
      {saveMsg && <div style={{ color: 'var(--success)', fontWeight: 500 }}>{saveMsg}</div>}
    </div>
  );
};

export default Creative;
