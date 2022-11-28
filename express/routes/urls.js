var express = require('express');
var router = express.Router();

/* GET page to create a new url */
router.get('/', function(req, res, next) {
  res.render('new');
});

router.get('/:short', function(req, res, next) {
  let {short} = req.params
  let url = await getFromDB(short)
  if (url && url.original) {
    return reply.redirect(302, url.original);
  } else {
    return reply.code(404).send({message: "No such shortcode"})
  }
});

module.exports = router;
