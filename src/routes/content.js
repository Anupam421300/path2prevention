'use strict';
const express = require('express');
const router = express.Router();
const { Article, Recipe, GlossaryTerm, ActivityGuide, Tip, FoodItem, EvidenceSource } = require('../models');

// GET /api/articles
router.get('/articles', async (req, res, next) => {
  try {
    const articles = await Article.find({}).sort({ publishedAt: -1 });
    res.json(articles);
  } catch (err) { next(err); }
});

// GET /api/articles/:slug — supports both ObjectId and slug
router.get('/articles/:idOrSlug', async (req, res, next) => {
  try {
    const param = req.params.idOrSlug;
    // Try ObjectId first, then slug
    const article = param.match(/^[0-9a-fA-F]{24}$/)
      ? await Article.findById(param)
      : await Article.findOne({ slug: param });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) { next(err); }
});

// GET /api/recipes
router.get('/recipes', async (req, res, next) => {
  try {
    const recipes = await Recipe.find({});
    res.json(recipes);
  } catch (err) { next(err); }
});

// GET /api/recipes/:recipeId
router.get('/recipes/:recipeId', async (req, res, next) => {
  try {
    const recipe = await Recipe.findOne({ recipeId: req.params.recipeId });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) { next(err); }
});

// GET /api/glossary
router.get('/glossary', async (req, res, next) => {
  try {
    const terms = await GlossaryTerm.find({}).sort({ term: 1 });
    res.json(terms);
  } catch (err) { next(err); }
});

// GET /api/activity-guides
router.get('/activity-guides', async (req, res, next) => {
  try {
    const guides = await ActivityGuide.find({});
    res.json(guides);
  } catch (err) { next(err); }
});

// GET /api/tips/random
router.get('/tips/random', async (req, res, next) => {
  try {
    const count = await Tip.countDocuments();
    const index = Math.floor(Math.random() * count);
    const tip = await Tip.findOne().skip(index);
    res.json(tip);
  } catch (err) { next(err); }
});

// GET /api/diet-search?q=query
router.get('/diet-search', async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json([]);
    const results = await FoodItem.find({ name: { $regex: q, $options: 'i' } }).limit(20);
    res.json(results);
  } catch (err) { next(err); }
});

// GET /api/content/evidence?ids=id1,id2,id3
// Returns EvidenceSource documents by sourceId for the Evidence Panel popup
router.get('/content/evidence', async (req, res, next) => {
  try {
    const ids = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return res.json([]);
    const sources = await EvidenceSource.find({ sourceId: { $in: ids } });
    res.json(sources);
  } catch (err) { next(err); }
});

module.exports = router;
