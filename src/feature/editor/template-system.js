// src/features/editor/template-system.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:Template]', msg);

  // 📦 Extended Template Library
  const DEFAULT_TEMPLATES = {
    // Achievement Templates
    'achievement-table': {
      name: 'Achievement Table',
      category: 'achievements',
      content: `[table]
[tr][th]Achievement[/th][th]Description[/th][th]Tips[/th][/tr]
[tr][td][b]Name[/b][/td][td]Requirement details[/td][td]• Step 1\\n• Step 2[/td][/tr]
[/table]`,
      description: 'Basic table for listing achievements with tips'
    },
    'achievement-table-advanced': {
      name: 'Advanced Achievement Table',
      category: 'achievements',
      content: `[table]
[tr][th]Icon[/th][th]Achievement Name[/th][th]Points[/th][th]Description[/th][th]Guide Tips[/th][/tr]
[tr][td][previewicon=12345][/td][td][b]Achievement Name[/b][/td][td]10G[/td][td]What you need to do[/td][td]• Best method\\n• Common pitfalls\\n• Time required[/td][/tr]
[tr][td][img]https://example.com/icon.png[/img][/td][td][b]Another One[/b][/td][td]20G[/td][td]More requirements[/td][td]• Alternative approach[/td][/tr]
[/table]

[b]Notes:[/b]
• Replace [previewicon=ID] with actual Steam preview icon IDs
• Or use [img] tags for hosted images (64x64 recommended)
• Sort by progression or difficulty`,
      description: 'Comprehensive table with icons, points, and detailed tips'
    },
    'achievement-checklist': {
      name: 'Achievement Checklist',
      category: 'achievements',
      content: `[h2]🏆 Achievement Checklist[/h2]
Use this checklist to track your progress:

[list]
[*][ ] Story-related achievement 1
[*][ ] Story-related achievement 2
[*][ ] Collectible #1 (Chapter 1)
[*][ ] Collectible #2 (Chapter 1)
[*][ ] Combat mastery achievement
[*][ ] Secret/unmissable achievement
[*][ ] Multi-run required achievement ⚠️
[*][ ] DLC achievement (if applicable)
[/list]

[b]Total:[/b] X/X achievements | [b]Completion time:[/b] ~X hours`,
      description: 'Interactive checklist format for tracking progress'
    },
    'multi-run-tracker': {
      name: 'Multi-Run Tracker',
      category: 'achievements',
      content: `[h3]⚠️ Multi-Run Required Achievements[/h3]
These achievements require multiple playthroughs:

[table]
[tr][th]Playthrough[/th][th]Focus[/th][th]Achievements[/th][th]Notes[/th][/tr]
[tr][td]Run 1[/td][td]Story + Missables[/td][td]X achievements[/td][td]Pick up all collectibles[/td][/tr]
[tr][td]Run 2[/td][td]Cleanup + Difficulty[/td][td]Y achievements[/td][td]Higher difficulty lock-in[/td][/tr]
[tr][td]Run 3+[/td][td]Grinding/Special conditions[/td][td]Z achievements[/td][td]Speedrun/misc challenges[/td][/tr]
[/table]

[b]Minimum runs for 100%:[/b] X | [b]Estimated time:[/b] Y hours`,
      description: 'Track achievements requiring multiple playthroughs'
    },

    // Walkthrough Templates
    'walkthrough-spoiler': {
      name: 'Walkthrough with Spoilers',
      category: 'walkthrough',
      content: `[h2]Chapter / Area Name[/h2]
[b]Objective:[/b] Main goal here.

[h3]Walkthrough Steps[/h3]
[list]
[*]Step 1: Initial actions
[*]Step 2: Progress further
[*]Step 3: Complete objectives
[/list]

[h3]Collectibles in This Area[/h3]
[list]
[*][b]Item 1:[/b] Location description
[*][b]Item 2:[/b] Hidden behind breakable wall
[/list]

[spoiler]
[h4]⚠️ Hidden Content / Secrets[/h4]
• Secret room location
• Easter egg details
• Boss strategy
[/spoiler]`,
      description: 'Structured walkthrough with spoiler-protected secrets'
    },
    'chapter-walkthrough': {
      name: 'Chapter Walkthrough',
      category: 'walkthrough',
      content: `[h1]Chapter X: Chapter Title[/h1]

[h2]📍 Overview[/h2]
[b]Main Objective:[/b] What you need to accomplish
[b]Secondary Objectives:[/b] Optional goals
[b]Recommended Level:[/b] X+

[h2]📖 Step-by-Step Guide[/h2]
[olist]
[*]First major step with details
[*]Continue with next objective
[*]Final steps to complete chapter
[/olist]

[h2]💎 Collectibles[/h2]
[table]
[tr][th]Item[/th][th]Location[/th][th]Missable?[/th][/tr]
[tr][td]Collectible A[/td][td]Area description[/td][td]Yes - before boss[/td][/tr]
[/table]

[h2]⚔️ Enemies Encountered[/h2]
[list]
[*][b]Enemy Type 1:[/b] Strategy tips
[*][b]Enemy Type 2:[/b] Weaknesses
[/list]

[h2]👹 Boss Fight (if applicable)[/h2]
[spoiler]
[b]Phase 1:[/b] Attack patterns and counters
[b]Phase 2:[/b] New moves to watch for
[b]Strategy:[/b] Recommended approach
[/spoiler]`,
      description: 'Comprehensive chapter-by-chapter walkthrough template'
    },
    'area-guide': {
      name: 'Area/Dungeon Guide',
      category: 'walkthrough',
      content: `[h2]🗺️ Area Name[/h2]

[h3]Quick Info[/h3]
• [b]Access:[/b] How to reach this area
• [b]Recommended Level:[/b] X+
• [b]Key Items:[/b] What to bring

[h3]Map Layout[/h3]
[spoiler]Include screenshot or describe layout[/spoiler]

[h3]Points of Interest[/h3]
[list]
[*][b]Location A:[/b] Description + rewards
[*][b]Location B:[/b] Hidden treasure
[*][b]NPC:[/b] Quest giver or merchant
[/list]

[h3]Enemies & Drops[/h3]
[table]
[tr][th]Enemy[/th][th]Notable Drops[/th][th]Notes[/th][/tr]
[tr][td]Enemy Name[/td][td]Rare item (X%)[/td][td]Farm here[/td][/tr]
[/table]`,
      description: 'Detailed guide for specific areas or dungeons'
    },

    // Formatting Templates
    'tips-list': {
      name: 'Pro Tips List',
      category: 'formatting',
      content: `[h3]💡 Pro Tips[/h3]
[list]
[*]Tip with [b]emphasis[/b] on key information
[*]Use [spoiler]tags[/spoiler] for spoilers and hidden content
[*]Link: [url=https://store.steampowered.com/]Steam Store[/url]
[*]Formatting: [i]italic[/i], [u]underline[/u], [strike]strikethrough[/strike]
[*]Code/Commands: Use [code]text[/code] for console commands
[/list]

[h4]General Advice[/h4]
• Save frequently at checkpoints
• Check map for missed areas
• Talk to NPCs multiple times`,
      description: 'General tips and tricks formatting'
    },
    'faq-section': {
      name: 'FAQ Section',
      category: 'formatting',
      content: `[h2]❓ Frequently Asked Questions[/h2]

[h3]Q: Question about game mechanic?[/h3]
[b]A:[/b] Detailed answer explaining the mechanic. Include examples if helpful.

[h3]Q: How do I unlock [specific achievement]?[/h3]
[b]A:[/b] Step-by-step instructions:
[list]
[*]Prerequisite condition
[*]Action to perform
[*]Verification method
[/list]

[h3]Q: Is there a missable achievement in this chapter?[/h3]
[b]A:[/b] Yes/No explanation. Point to relevant section if missable.

[h3]Q: Does difficulty affect achievements?[/h3]
[b]A:[/b] Explain difficulty-related requirements or lack thereof.`,
      description: 'Common questions and answers format'
    },
    'update-log': {
      name: 'Update/Changelog Log',
      category: 'formatting',
      content: `[h2]📝 Update Log[/h2]

[h3]v1.X.X - YYYY-MM-DD[/h3]
[list]
[*]Added new section for Chapter X
[*]Updated achievement table with icon IDs
[*]Fixed typo in boss strategy
[*]Added video timestamps
[/list]

[h3]v1.0.0 - YYYY-MM-DD[/h3]
[list]
[*]Initial guide release
[*]Complete walkthrough for all chapters
[*]All achievement descriptions added
[/list]

[i]Last updated: YYYY-MM-DD[/i]`,
      description: 'Track guide updates and revisions'
    },
    'intro-template': {
      name: 'Guide Introduction',
      category: 'formatting',
      content: `[h1]🎮 Game Name - Complete Achievement Guide[/h1]

[b]Author:[/b] Your Name
[b]Version:[/b] 1.0.0
[b]Last Updated:[/b] YYYY-MM-DD
[b]Estimated Completion Time:[/b] X-Y hours
[b]Difficulty:[/b] X/10
[b]Minimum Playthroughs:[/b] X

[h2]📋 Table of Contents[/h2]
[list]
[*][url=#intro]Introduction[/url]
[*][url=#walkthrough]Walkthrough[/url]
[*][url=#achievements]Achievement Guide[/url]
[*][url=#faq]FAQ[/url]
[*][url=#credits]Credits[/url]
[/list]

[h2]🎯 About This Guide[/h2]
This guide covers all achievements/trophies for [Game Name]. It includes:
[list]
[*]Complete step-by-step walkthrough
[*]All collectible locations
[*]Missable achievement warnings
[*]Multi-run roadmap (if applicable)
[*]Video guides (optional)
[/list]

[hr]

[h2]⚠️ Important Notes[/h2]
[list]
[*][b]Spoiler Warning:[/b] This guide contains story spoilers
[*][b]Missables:[/b] X missable achievements - follow the guide carefully
[*][b]Difficulty:[/b] Highest difficulty is achievable / must be done in order
[*][b]DLC:[/b] DLC achievements covered in separate section
[/list]`,
      description: 'Professional guide introduction with table of contents'
    },

    // Specialized Templates
    'collectible-tracker': {
      name: 'Collectible Tracker',
      category: 'specialized',
      content: `[h2]💎 All Collectibles Checklist[/h2]

[h3]Chapter 1[/h3]
[table]
[tr][th]# Item[/th][th]Location[/th][th]Obtained[/th][/tr]
[tr][td]1/10 Collectible Name[/td][td]Specific location description[/td][td]☐[/td][/tr]
[tr][td]2/10 Next Item[/td][td]After defeating first boss[/td][td]☐[/td][/tr]
[/table]

[h3]Chapter 2[/h3]
[table]
[tr][th]# Item[/th][th]Location[/th][th]Obtained[/th][/tr]
[tr][td]1/8 Collectible Name[/td][td]Hidden area description[/td][td]☐[/td][/tr]
[/table]

[b]Total Progress:[/b] X/XX collectibles

[spoiler]
[h4]🗺️ Collectible Map References[/h4]
Link to interactive maps or screenshots showing locations
[/spoiler]`,
      description: 'Track all collectibles across chapters'
    },
    'roadmap-template': {
      name: 'Achievement Roadmap',
      category: 'specialized',
      content: `[h2]🗺️ Achievement Roadmap[/h2]

[h3]Overview[/h3]
• [b]Total Achievements:[/b] XX
• [b]Estimated Time:[/b] X-Y hours
• [b]Minimum Playthroughs:[/b] X
• [b]Missable Achievements:[/b] X
• [b]Glitched Achievements:[/b] X (if any)
• [b]Difficulty Unlocks:[/b] Yes/No

[h3]Phase 1: First Playthrough (Story)[/h3]
[list]
[*]Focus on story progression
[*]Pick up missable items
[*]Complete side quests as you go
[*]Expected achievements: ~XX%
[/list]

[h3]Phase 2: Cleanup Playthrough[/h3]
[list]
[*]Mop up missed collectibles
[*]Complete challenges/feats
[*]Grind-based achievements
[*]Expected achievements: ~XX%
[/list]

[h3]Phase 3: Additional Runs (If Required)[/h3]
[list]
[*]Higher difficulty playthrough
[*]Speedrun attempts
[*]Specific challenge runs
[*]Remaining achievements
[/list]

[h3]Roadmap Summary[/h3]
[table]
[tr][th]Phase[/th][th]Type[/th][th]Time[/th][th]Achievements[/th][/tr]
[tr][td]1[/td][td]Story + Missables[/td][td]~X hrs[/td][td]XX[/td][/tr]
[tr][td]2[/td][td]Cleanup[/td][td]~Y hrs[/td][td]YY[/td][/tr]
[tr][td]3[/td][td]Special Conditions[/td][td]~Z hrs[/td][td]ZZ[/td][/tr]
[/table]`,
      description: 'Strategic roadmap for 100% completion'
    },
    'boss-guide': {
      name: 'Boss Fight Guide',
      category: 'specialized',
      content: `[h2]⚔️ Boss Name[/h2]

[h3]Quick Info[/h3]
• [b]Location:[/b] Where to find this boss
• [b]HP:[/b] Approximate health pool
• [b]Weakness:[/b] Element/type weakness
• [b]Recommended Level:[/b] X+
• [b]Rewards:[/b] Drops/achievements

[h3]Attack Patterns[/h3]
[table]
[tr][th]Attack Name[/th][th]Telegraph[/th][th]Damage[/th][th]Counter[/th][/tr]
[tr][td]Basic Combo[/td][td]Weapon raise[/td][td]Medium[/td][td]Block/Dodge left[/td][/tr]
[tr][td]Special Move[/td][td]Red glow[/td][td]High[/td][td]Roll backward[/td][/tr]
[/table]

[h3]Phase Breakdown[/h3]
[spoiler]
[b]Phase 1 (100%-70% HP)[/b]
• Basic attacks only
• Learn the patterns
• Deal damage safely

[b]Phase 2 (70%-40% HP)[/b]
• New attack added
• More aggressive behavior
• Watch for telegraphs

[b]Phase 3 (40%-0% HP)[/b]
• Desperation mode
• All attacks available
• Stay patient, don't get greedy
[/spoiler]

[h3]Strategy Tips[/h3]
[list]
[*]Stay close/keep distance (depending on build)
[*]Save healing items for phase transitions
[*]Learn dodge timing for key attacks
[*]Use consumables/buffs before engaging
[/list]`,
      description: 'Detailed boss fight strategy guide'
    }
  };

  // Storage key for custom templates
  const STORAGE_KEY = 'sgo_custom_templates';

  // Get all templates (defaults + custom)
  function getAllTemplates() {
    return new Promise((resolve) => {
      // Try to get custom templates from storage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const custom = stored ? JSON.parse(stored) : {};
        
        // Merge custom templates with defaults
        const all = { ...DEFAULT_TEMPLATES };
        Object.keys(custom).forEach(key => {
          all[key] = {
            ...custom[key],
            isCustom: true
          };
        });
        
        resolve(all);
      } catch (e) {
        LOG('Error loading custom templates:', e);
        resolve(DEFAULT_TEMPLATES);
      }
    });
  }

  // Save a custom template
  function saveCustomTemplate(key, template) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const custom = stored ? JSON.parse(stored) : {};
      
      custom[key] = {
        ...template,
        isCustom: true,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
      LOG(`Saved custom template: ${key}`);
      return true;
    } catch (e) {
      LOG('Error saving custom template:', e);
      return false;
    }
  }

  // Delete a custom template
  function deleteCustomTemplate(key) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      
      const custom = JSON.parse(stored);
      delete custom[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
      LOG(`Deleted custom template: ${key}`);
      return true;
    } catch (e) {
      LOG('Error deleting custom template:', e);
      return false;
    }
  }

  // Export templates as JSON
  function exportTemplates() {
    return new Promise((resolve) => {
      getAllTemplates().then(templates => {
        const data = JSON.stringify(templates, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sgo-templates-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        LOG('Exported templates');
        resolve(true);
      });
    });
  }

  // Import templates from JSON file
  function importTemplates(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          
          // Validate structure
          if (typeof imported !== 'object') {
            throw new Error('Invalid template format');
          }
          
          // Only import non-default templates as custom
          const stored = localStorage.getItem(STORAGE_KEY);
          const custom = stored ? JSON.parse(stored) : {};
          
          Object.keys(imported).forEach(key => {
            if (!DEFAULT_TEMPLATES[key]) {
              custom[key] = {
                ...imported[key],
                isCustom: true,
                importedAt: new Date().toISOString()
              };
            }
          });
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
          LOG(`Imported ${Object.keys(custom).length} custom templates`);
          resolve(true);
        } catch (err) {
          LOG('Error importing templates:', err);
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Get templates by category
  function getTemplatesByCategory(category) {
    return new Promise((resolve) => {
      getAllTemplates().then(templates => {
        const filtered = {};
        Object.keys(templates).forEach(key => {
          if (templates[key].category === category) {
            filtered[key] = templates[key];
          }
        });
        resolve(filtered);
      });
    });
  }

  // Insert template at cursor position
  function insertTemplate(textarea, templateKey) {
    return new Promise((resolve, reject) => {
      getAllTemplates().then(templates => {
        if (!templates[templateKey]) {
          reject(new Error(`Template not found: ${templateKey}`));
          return;
        }
        
        const content = templates[templateKey].content;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        textarea.value = textarea.value.substring(0, start) + content + textarea.value.substring(end);
        textarea.setSelectionRange(start + content.length, start + content.length);
        textarea.focus();
        
        LOG(`Inserted template: ${templateKey}`);
        resolve(true);
      });
    });
  }

  // Create template manager UI panel
  function createTemplateManager() {
    const panel = document.createElement('div');
    panel.className = 'sgo-template-manager';
    panel.innerHTML = `
      <div class="sgo-tm-header">
        <h4>📋 Template Manager</h4>
        <div class="sgo-tm-actions">
          <button class="sgo-tm-btn" id="sgo-tm-export" title="Export all templates">⬇ Export</button>
          <button class="sgo-tm-btn" id="sgo-tm-import" title="Import templates">⬆ Import</button>
          <button class="sgo-tm-btn" id="sgo-tm-new" title="Create new template">➕ New</button>
        </div>
        <input type="file" id="sgo-tm-import-file" accept=".json" style="display:none">
      </div>
      <div class="sgo-tm-categories">
        <button class="sgo-tm-cat active" data-cat="all">All</button>
        <button class="sgo-tm-cat" data-cat="achievements">Achievements</button>
        <button class="sgo-tm-cat" data-cat="walkthrough">Walkthrough</button>
        <button class="sgo-tm-cat" data-cat="formatting">Formatting</button>
        <button class="sgo-tm-cat" data-cat="specialized">Specialized</button>
      </div>
      <div class="sgo-tm-list"></div>
    `;
    
    return panel;
  }

  // Render template list
  async function renderTemplateList(container, filter = 'all') {
    const templates = await getAllTemplates();
    const list = container.querySelector('.sgo-tm-list');
    
    let html = '';
    Object.keys(templates).forEach(key => {
      const t = templates[key];
      if (filter !== 'all' && t.category !== filter) return;
      
      html += `
        <div class="sgo-tm-item ${t.isCustom ? 'sgo-tm-custom' : ''}" data-key="${key}">
          <div class="sgo-tm-item-header">
            <span class="sgo-tm-item-name">${t.name}</span>
            ${t.isCustom ? '<span class="sgo-tm-badge">Custom</span>' : ''}
          </div>
          <div class="sgo-tm-item-desc">${t.description || ''}</div>
          <div class="sgo-tm-item-actions">
            <button class="sgo-tm-use" data-key="${key}">Use</button>
            ${t.isCustom ? `<button class="sgo-tm-delete" data-key="${key}">Delete</button>` : ''}
          </div>
        </div>
      `;
    });
    
    list.innerHTML = html || '<div class="sgo-tm-empty">No templates in this category</div>';
    
    // Bind events
    list.querySelectorAll('.sgo-tm-use').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.key;
        const textarea = document.querySelector('#description');
        if (textarea) {
          insertTemplate(textarea, key);
        }
      });
    });
    
    list.querySelectorAll('.sgo-tm-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.key;
        if (confirm(`Delete custom template "${key}"?`)) {
          deleteCustomTemplate(key);
          renderTemplateList(container, filter);
        }
      });
    });
    
    list.querySelectorAll('.sgo-tm-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.key;
        const t = templates[key];
        // Show preview in a modal or expand the item
        showTemplatePreview(t);
      });
    });
  }

  // Show template preview
  function showTemplatePreview(template) {
    const existing = document.querySelector('.sgo-tm-preview-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.className = 'sgo-tm-preview-modal';
    modal.innerHTML = `
      <div class="sgo-tm-preview-content">
        <div class="sgo-tm-preview-header">
          <h4>${template.name}</h4>
          <button class="sgo-tm-close">✕</button>
        </div>
        <div class="sgo-tm-preview-body">
          <pre>${template.content}</pre>
        </div>
        <div class="sgo-tm-preview-footer">
          <button class="sgo-tm-insert">Insert Template</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.sgo-tm-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.sgo-tm-insert').addEventListener('click', () => {
      const textarea = document.querySelector('#description');
      if (textarea) {
        // Find the template key from DEFAULT_TEMPLATES or custom
        const key = Object.keys(DEFAULT_TEMPLATES).find(k => DEFAULT_TEMPLATES[k] === template) 
          || Object.keys(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')).find(k => 
              JSON.parse(localStorage.getItem(STORAGE_KEY))[k] === template);
        if (key) insertTemplate(textarea, key);
      }
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // Initialize template manager in a sidebar or panel
  function initTemplateManager() {
    // Check if we're on the guide editor page
    if (!/steamcommunity\.com\/sharedfiles\/editguide/.test(window.location.href)) {
      return;
    }
    
    LOG('Initializing Template Manager...');
    
    // Wait for the description field to be available
    const observer = new MutationObserver((mutations, obs) => {
      const descField = document.querySelector('#description');
      if (!descField) return;
      
      obs.disconnect();
      
      // Create and inject the template manager panel
      const manager = createTemplateManager();
      manager.id = 'sgo-template-manager';
      
      // Insert near the description field
      const descContainer = descField.closest('div') || descField.parentNode;
      if (descContainer) {
        descContainer.parentNode.insertBefore(manager, descContainer.nextSibling);
      }
      
      // Initial render
      renderTemplateList(manager);
      
      // Category filter buttons
      manager.querySelectorAll('.sgo-tm-cat').forEach(btn => {
        btn.addEventListener('click', () => {
          manager.querySelectorAll('.sgo-tm-cat').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderTemplateList(manager, btn.dataset.cat);
        });
      });
      
      // Export button
      manager.querySelector('#sgo-tm-export').addEventListener('click', exportTemplates);
      
      // Import button
      manager.querySelector('#sgo-tm-import').addEventListener('click', () => {
        document.getElementById('sgo-tm-import-file').click();
      });
      
      manager.querySelector('#sgo-tm-import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          importTemplates(file).then(() => {
            renderTemplateList(manager);
            e.target.value = ''; // Reset input
          }).catch(err => {
            alert('Failed to import templates: ' + err.message);
          });
        }
      });
      
      // New template button
      manager.querySelector('#sgo-tm-new').addEventListener('click', () => {
        const key = prompt('Enter template ID (lowercase, hyphens):');
        if (!key) return;
        
        const name = prompt('Enter template name:');
        if (!name) return;
        
        const description = prompt('Enter template description:');
        const category = prompt('Enter category (achievements/walkthrough/formatting/specialized):', 'formatting');
        
        // Create a simple template editor
        const content = prompt('Enter template content (BBCode):');
        if (!content) return;
        
        saveCustomTemplate(key, { name, description, category, content });
        renderTemplateList(manager);
      });
      
      LOG('✅ Template Manager initialized');
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Expose API
  window.SGO = window.SGO || {};
  window.SGO.Templates = {
    getAll: getAllTemplates,
    getByCategory: getTemplatesByCategory,
    insert: insertTemplate,
    saveCustom: saveCustomTemplate,
    deleteCustom: deleteCustomTemplate,
    export: exportTemplates,
    import: importTemplates,
    initManager: initTemplateManager
  };
  
  // Auto-initialize when loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTemplateManager);
  } else {
    initTemplateManager();
  }
})();
