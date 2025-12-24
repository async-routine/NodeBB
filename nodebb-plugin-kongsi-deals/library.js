'use strict';

const db = require.main.require('./src/database');

const plugin = {};

const dealFields = [
    'deal_price',
    'deal_list_price',
    'deal_url',
    'deal_store',
    'deal_image',
    'deal_expires_at',
    'deal_is_anonymous'
];

/**
 * Hook: action:topic.save
 * Called after a topic is created or updated in the DB.
 * We save our custom deal fields into a separate hash `deal:<tid>`.
 */
plugin.topicSaved = async function (data) {
    const { topic, data: rawData } = data;
    
    if (!topic || !topic.tid) return;

    const dealData = {};
    let hasDealData = false;

    dealFields.forEach(field => {
        if (rawData.hasOwnProperty(field)) {
            dealData[field] = rawData[field];
            hasDealData = true;
        }
    });

    if (hasDealData) {
        await db.setObject(`deal:${topic.tid}`, dealData);
    }
};

/**
 * Hook: filter:topic.get
 * Called when a single topic is retrieved.
 */
plugin.topicGet = async function (data) {
    if (!data || !data.topic) return data;
    
    const dealData = await db.getObject(`deal:${data.topic.tid}`);
    if (dealData) {
        Object.assign(data.topic, dealData);
    }
    
    return data;
};

/**
 * Hook: filter:topics.get
 * Called when a list of topics is retrieved (e.g. Recent, Category).
 */
plugin.topicsGet = async function (data) {
    if (!data || !data.topics) return data;

    const tids = data.topics.map(t => t && t.tid).filter(Boolean);
    if (!tids.length) return data;
    
    const keys = tids.map(tid => `deal:${tid}`);
    const deals = await db.getObjects(keys);

    data.topics.forEach((topic, index) => {
        if (topic && deals[index]) {
            Object.assign(topic, deals[index]);
        }
    });

    return data;
};

// Kept for compatibility if needed, but logic moved to topicSaved
plugin.topicSave = async function (data) {
    return data;
};

module.exports = plugin;
