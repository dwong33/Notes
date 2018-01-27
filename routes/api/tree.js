"use strict";

const express = require('express');
const router = express.Router();
const sql = require('../../services/sql');
const options = require('../../services/options');
const utils = require('../../services/utils');
const auth = require('../../services/auth');
const protected_session = require('../../services/protected_session');
const sync_table = require('../../services/sync_table');
const wrap = require('express-promise-wrap').wrap;

router.get('/', auth.checkApiAuth, wrap(async (req, res, next) => {
    const notes = await sql.getAll(`
      SELECT 
        notes_tree.*, 
        notes.note_title, 
        notes.is_protected,
        notes.type
      FROM 
        notes_tree 
      JOIN 
        notes ON notes.note_id = notes_tree.note_id
      WHERE 
        notes.is_deleted = 0 
        AND notes_tree.is_deleted = 0
      ORDER BY 
        note_position`);

    protected_session.decryptNotes(req, notes);

    res.send({
        notes: notes,
        start_note_path: await options.getOption('start_note_path')
    });
}));

router.put('/:noteTreeId/set-prefix', auth.checkApiAuth, wrap(async (req, res, next) => {
    const noteTreeId = req.params.noteTreeId;
    const sourceId = req.headers.source_id;
    const prefix = utils.isEmptyOrWhitespace(req.body.prefix) ? null : req.body.prefix;

    await sql.doInTransaction(async () => {
        await sql.execute("UPDATE notes_tree SET prefix = ?, date_modified = ? WHERE note_tree_id = ?", [prefix, utils.nowDate(), noteTreeId]);

        await sync_table.addNoteTreeSync(noteTreeId, sourceId);
    });

    res.send({});
}));

module.exports = router;
