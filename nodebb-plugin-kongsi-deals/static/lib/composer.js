'use strict';

/* globals define, $, app, socket, window */

console.log('[kongsi-deals] Loading composer script (v2)...');

define('kongsi/composer', ['composer', 'hooks'], function (composer, hooks) {
    var Composer = {};

    Composer.init = function () {
        console.log('[kongsi-deals] Initializing Composer extension...');
        
        // Hook into composer loading to inject fields
        $(window).on('action:composer.loaded', function (ev, data) {
            console.log('[kongsi-deals] action:composer.loaded fired', data);
            
            // USE VALIDATOR: data.postContainer is usually the jQuery object
            var composerEl = data.postContainer || $('#cmp-uuid-' + data.post_uuid);
            
            console.log('[kongsi-deals] Composer element found:', composerEl.length);
            
            if (composerEl.length === 0) {
                 console.warn('[kongsi-deals] Composer element STILL not found. giving up.');
                 return;
            }
            
            // Check if already injected
            if (composerEl.find('.deal-fields-container').length) {
                console.log('[kongsi-deals] Fields already injected.');
                return;
            }

            var dealFieldsHtml = `
                <div class="deal-fields-container" style="padding: 10px; margin: 10px 0; background: #f9f9f9; border: 1px solid #eee; border-radius: 5px;">
                    <strong style="display:block; margin-bottom:5px;">Deal Information</strong>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <div style="flex: 1 1 45%;">
                            <label style="font-size: 12px; margin-bottom:2px; display:block;">Deal URL</label>
                            <input type="url" class="form-control input-sm deal-url" placeholder="https://..." name="deal_url" style="width:100%;">
                        </div>
                        <div style="flex: 1 1 45%;">
                            <label style="font-size: 12px; margin-bottom:2px; display:block;">Store Name</label>
                            <input type="text" class="form-control input-sm deal-store" placeholder="e.g. Lazada" name="deal_store" style="width:100%;">
                        </div>
                        <div style="flex: 1 1 45%;">
                            <label style="font-size: 12px; margin-bottom:2px; display:block;">Sale Price (RM)</label>
                            <input type="number" step="0.01" class="form-control input-sm deal-price" placeholder="0.00" name="deal_price" style="width:100%;">
                        </div>
                        <div style="flex: 1 1 45%;">
                            <label style="font-size: 12px; margin-bottom:2px; display:block;">List Price (RM)</label>
                            <input type="number" step="0.01" class="form-control input-sm deal-list-price" placeholder="0.00" name="deal_list_price" style="width:100%;">
                        </div>
                    </div>
                </div>
            `;

            // Insert after title or at top of body
            var titleContainer = composerEl.find('.title-container');
            if (titleContainer.length) {
                console.log('[kongsi-deals] Injecting after title container');
                titleContainer.after(dealFieldsHtml);
            } else {
                console.log('[kongsi-deals] Title container not found. Trying .composer-container prepend');
                // Fallback: prepend to the main text area container
                var container = composerEl.find('.composer-container');
                if (container.length) {
                    container.prepend(dealFieldsHtml);
                } else {
                     // Last resort: prepend to the whole composer element
                     console.log('[kongsi-deals] Prepending to composerEl root');
                     composerEl.prepend(dealFieldsHtml);
                }
            }
        });

        // Register filter hook
        hooks.on('filter:composer.submit', function (payload, callback) {
            console.log('[kongsi-deals] filter:composer.submit fired', payload);
            
            // We need to find the element again. 
            // In the submit hook, we might not have 'postContainer' easily available in 'payload' depending on version.
            // But usually payload.composerData.post_uuid is reliable for DOM lookup IF the element exists.
            var uuid = payload.composerData.post_uuid;
            var composerEl = $('#cmp-uuid-' + uuid); 
            // If the element was moved or something, this might be tricky.
            // But usually ID lookup works fine here because the composer is still open during submit.
            
            if (composerEl.length) {
                var dealUrl = composerEl.find('input[name="deal_url"]').val();
                var dealStore = composerEl.find('input[name="deal_store"]').val();
                var dealPrice = composerEl.find('input[name="deal_price"]').val();
                var dealListPrice = composerEl.find('input[name="deal_list_price"]').val();
                
                // Only add if not empty (or enable clearing? let's send whatever)
                payload.composerData.deal_url = dealUrl;
                payload.composerData.deal_store = dealStore;
                payload.composerData.deal_price = dealPrice;
                payload.composerData.deal_list_price = dealListPrice;
            } else {
                console.warn('[kongsi-deals] SUBMIT: Composer element not found by ID:', uuid);
            }
            
            callback(null, payload);
        });
    };

    return Composer;
});

require(['kongsi/composer'], function (Composer) {
    Composer.init();
});
