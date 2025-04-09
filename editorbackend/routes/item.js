const express = require('express');
const Item = require('../models/itemmodel'); // Your Mongoose model for items

// Create a new file or folder
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { name, type, parent } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type are required' });
        }

        const newItem = new Item({
            name,
            type,
            parent: parent || null,
        });

        await newItem.save();
        res.status(201).json({ message: `${type} created successfully`, item: newItem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all items in a folder (or root)
router.get('/list', authMiddleware, async (req, res) => {
    try {
        const { parent } = req.query;

        const items = await Item.find({ parent: parent || null }).sort({ type: 1, name: 1 });
        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single item by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
