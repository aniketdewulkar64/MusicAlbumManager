const {addAlbum,showAlbum,deleteAlbum, editAlbum,getSingleAlbum} = require('../controller/musicController');
const express = require('express');

const routes = express.Router()

routes.post('/add',addAlbum)
routes.get('/',showAlbum)
routes.put('/:id',editAlbum)
routes.delete('/:id',deleteAlbum)
routes.get('/:id', getSingleAlbum)

module.exports= routes